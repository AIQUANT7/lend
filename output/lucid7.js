"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLenderData = exports.parseLenderDatum = void 0;
exports.initializeContract = initializeContract;
exports.lendPT = lendPT;
const lucid_1 = require("@lucid-evolution/lucid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seed = process.env.ADMIN_SEED;
const cbor = process.env.CBOR;
const CBOR = {
    type: "PlutusV2",
    script: cbor,
};
// Create initial datum
const createLenderDatum = (adminPkh, totalPT, totalReward, lenders) => {
    const lenderEntries = lenders.map(([pkhHex, [balance, rewardDebt]]) => [
        pkhHex,
        [balance, rewardDebt]
    ]);
    return [
        adminPkh,
        totalPT,
        totalReward,
        lenderEntries
    ];
};
// Parse datum from CBOR
const parseLenderDatum = (datumCbor) => {
    const datum = lucid_1.Data.from(datumCbor);
    if (!Array.isArray(datum) || datum.length !== 4) {
        throw new Error("Invalid datum structure");
    }
    const [adminPkh, totalPT, totalReward, lendersArray] = datum;
    if (!Array.isArray(lendersArray)) {
        throw new Error("Invalid lenders array in datum");
    }
    const lenders = lendersArray.map((lender) => {
        if (!Array.isArray(lender) || lender.length !== 2) {
            throw new Error("Invalid lender structure");
        }
        const [pkh, [balance, rewardDebt]] = lender;
        return {
            pkh: pkh,
            balance: BigInt(balance),
            rewardDebt: BigInt(rewardDebt)
        };
    });
    function extractBigInt(val) {
        if (typeof val === "bigint" || typeof val === "number" || typeof val === "string") {
            return BigInt(val);
        }
        if (Array.isArray(val) && val.length > 0) {
            return extractBigInt(val[0]);
        }
        throw new Error("Cannot extract bigint from value: " + JSON.stringify(val));
    }
    return {
        adminPkh: adminPkh,
        totalPT: extractBigInt(totalPT),
        totalReward: extractBigInt(totalReward),
        lenders
    };
};
exports.parseLenderDatum = parseLenderDatum;
// Update lender data when they lend more PT
const updateLenderData = (currentDatum, lenderPkh, additionalPT, rewardPerToken = BigInt(0)) => {
    // Find existing lender or create new one
    const existingLenderIndex = currentDatum.lenders.findIndex(l => l.pkh === lenderPkh);
    let updatedLenders = [...currentDatum.lenders];
    if (existingLenderIndex >= 0) {
        // Update existing lender
        const currentLender = currentDatum.lenders[existingLenderIndex];
        updatedLenders[existingLenderIndex] = {
            pkh: lenderPkh,
            balance: currentLender.balance + additionalPT,
            rewardDebt: currentLender.rewardDebt + (additionalPT * rewardPerToken) / BigInt(1000000) // Assuming 6 decimal precision
        };
    }
    else {
        // Add new lender
        updatedLenders.push({
            pkh: lenderPkh,
            balance: additionalPT,
            rewardDebt: (additionalPT * rewardPerToken) / BigInt(1000000)
        });
    }
    return {
        adminPkh: currentDatum.adminPkh,
        totalPT: currentDatum.totalPT + additionalPT,
        totalReward: currentDatum.totalReward,
        lenders: updatedLenders
    };
};
exports.updateLenderData = updateLenderData;
// Convert LenderDatum back to array format for CBOR
const lenderDatumToArray = (datum) => {
    const lenderEntries = datum.lenders.map(lender => [
        lender.pkh,
        [lender.balance, lender.rewardDebt]
    ]);
    return [
        datum.adminPkh,
        datum.totalPT,
        datum.totalReward,
        lenderEntries
    ];
};
function initializeContract() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lucid = yield (0, lucid_1.Lucid)(new lucid_1.Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"), "Preprod");
            const scriptAddr = (0, lucid_1.validatorToAddress)("Preprod", CBOR);
            lucid.selectWallet.fromSeed(seed);
            const adminWallet = yield lucid.wallet().address();
            const { paymentCredential } = (0, lucid_1.getAddressDetails)(adminWallet);
            const adminPkh = paymentCredential === null || paymentCredential === void 0 ? void 0 : paymentCredential.hash;
            if (!adminPkh) {
                throw new Error("Could not extract payment credential hash");
            }
            // Create initial datum
            const initialDatum = createLenderDatum(adminPkh, BigInt(0), // Start with 0 total PT
            BigInt(50000), [] // Start with empty lenders array
            );
            const cborDatum = lucid_1.Data.to(initialDatum);
            console.log("Initial Datum CBOR:", cborDatum);
            const tx = yield lucid.newTx()
                .pay.ToAddressWithData(scriptAddr, { kind: "inline", value: cborDatum }, { lovelace: BigInt(2000000) })
                .complete();
            const signedTx = yield tx.sign.withWallet().complete();
            const txHash = yield signedTx.submit();
            console.log("Contract Initialized. Transaction Hash:", txHash);
            return { scriptAddr, adminPkh };
        }
        catch (error) {
            console.error("Error initializing contract:", error);
            throw error;
        }
    });
}
// // Helper function to get PT token information from lender's wallet
// async function getLenderPTTokens(lenderAddress: string, lucid: any, ptTokenUnit?: string) {
//     const lenderUtxos = await lucid.utxosAt(lenderAddress);
//     const ptTokenInfo: { unit: string, amount: bigint, utxos: UTxO[] }[] = [];
//     lenderUtxos.forEach((utxo: UTxO) => {
//         Object.keys(utxo.assets).forEach(asset => {
//             if (asset !== 'lovelace') {
//                 // If specific token unit provided, only include that
//                 if (ptTokenUnit && asset !== ptTokenUnit) {
//                     return;
//                 }
//                 const amount = utxo.assets[asset] || BigInt(0);
//                 const existingToken = ptTokenInfo.find(token => token.unit === asset);
//                 if (existingToken) {
//                     existingToken.amount += amount;
//                     existingToken.utxos.push(utxo);
//                 } else {
//                     ptTokenInfo.push({
//                         unit: asset,
//                         amount: amount,
//                         utxos: [utxo]
//                     });
//                 }
//             }
//         });
//     });
//     return ptTokenInfo;
// }
// Updated helper function to get and sum all PT tokens from lender's wallet
function getLenderPTTokens(lenderAddress, lucid, ptTokenUnit) {
    return __awaiter(this, void 0, void 0, function* () {
        const lenderUtxos = yield lucid.utxosAt(lenderAddress);
        const ptTokenInfo = [];
        lenderUtxos.forEach((utxo) => {
            Object.keys(utxo.assets).forEach(asset => {
                if (asset !== 'lovelace') {
                    // If specific token unit provided, only include that
                    if (ptTokenUnit && asset !== ptTokenUnit) {
                        return;
                    }
                    const amount = utxo.assets[asset] || BigInt(0);
                    const existingToken = ptTokenInfo.find(token => token.unit === asset);
                    if (existingToken) {
                        // Sum the amounts for the same token unit
                        existingToken.amount += amount;
                        existingToken.utxos.push(utxo);
                    }
                    else {
                        ptTokenInfo.push({
                            unit: asset,
                            amount: amount,
                            utxos: [utxo]
                        });
                    }
                }
            });
        });
        // If no specific token unit was requested, sum all custom tokens
        if (!ptTokenUnit && ptTokenInfo.length > 1) {
            const totalAmount = ptTokenInfo.reduce((sum, token) => sum + token.amount, BigInt(0));
            return [{
                    unit: "all_pt_tokens",
                    amount: totalAmount,
                    utxos: ptTokenInfo.flatMap(token => token.utxos)
                }];
        }
        return ptTokenInfo;
    });
}
// async function lendPT(lenderSeed: string, ptAmount: bigint, ptTokenUnit?: string) {
//     try {
//         const lucid = await Lucid(
//             new Blockfrost(
//                 "https://cardano-preprod.blockfrost.io/api/v0",
//                 "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"
//             ),
//             "Preprod"
//         );
//         const scriptAddr = validatorToAddress("Preprod", CBOR);
//         // Set up lender wallet
//         lucid.selectWallet.fromSeed(lenderSeed);
//         const lenderWallet = await lucid.wallet().address();
//         const { paymentCredential } = getAddressDetails(lenderWallet);
//         const lenderPkh = paymentCredential?.hash;
//         if (!lenderPkh) {
//             throw new Error("Could not extract lender payment credential hash");
//         }
//         console.log("Lender Address:", lenderWallet);
//         console.log("Lender PKH:", lenderPkh);
//         console.log("Lending amount:", ptAmount.toString());
//         // Get PT token information from lender's wallet
//         const ptTokenInfo = await getLenderPTTokens(lenderWallet, lucid, ptTokenUnit);
//         if (ptTokenInfo.length === 0) {
//             throw new Error("No PT tokens found in lender's wallet");
//         }
//         console.log("PT Tokens found in lender's wallet:");
//         ptTokenInfo.forEach((tokenInfo, index) => {
//             console.log(`Token ${index + 1}:`);
//             console.log(`  Unit: ${tokenInfo.unit}`);
//             console.log(`  Amount: ${tokenInfo.amount.toString()}`);
//             console.log(`  UTXOs: ${tokenInfo.utxos.length}`);
//         });
//         // Find the token to use (first one if no specific unit provided)
//         let selectedToken = ptTokenInfo[0];
//         if (ptTokenUnit) {
//             const specificToken = ptTokenInfo.find(token => token.unit === ptTokenUnit);
//             if (!specificToken) {
//                 throw new Error(`PT token with unit ${ptTokenUnit} not found in wallet`);
//             }
//             selectedToken = specificToken;
//         }
//         if (selectedToken.amount < ptAmount) {
//             throw new Error(`Insufficient PT tokens. Available: ${selectedToken.amount}, Required: ${ptAmount}`);
//         }
//         console.log(`Using PT Token: ${selectedToken.unit}`);
//         console.log(`Available: ${selectedToken.amount}, Lending: ${ptAmount}`);
//         // Get current UTXOs at script address
//         const scriptUtxos = await lucid.utxosAt(scriptAddr);
//         console.log("Found UTXOs at script:", scriptUtxos.length);
//         if (scriptUtxos.length === 0) {
//             throw new Error("No UTXOs found at script address. Initialize contract first.");
//         }
//         // Find the UTXO with our datum (assuming it's the first one or has the largest ADA amount)
//         const contractUtxo = scriptUtxos.reduce((prev, current) =>
//             (current.assets.lovelace || BigInt(0)) > (prev.assets.lovelace || BigInt(0)) ? current : prev
//         );
//         if (!contractUtxo.datum) {
//             throw new Error("Contract UTXO has no datum");
//         }
//         // Parse current datum
//         const currentDatum = parseLenderDatum(contractUtxo.datum);
//         console.log("Current total PT:", currentDatum.totalPT.toString());
//         console.log("Current lenders count:", currentDatum.lenders.length);
//         // Update datum with new lending
//         const updatedDatum = updateLenderData(currentDatum, lenderPkh, ptAmount);
//         const updatedDatumArray = lenderDatumToArray(updatedDatum);
//         const updatedCborDatum = Data.to(updatedDatumArray);
//         console.log("New total PT:", updatedDatum.totalPT.toString());
//         // Create redeemer (you might need to adjust this based on your contract)
//         const redeemer = Data.void(); // or whatever your contract expects
//         // Select UTXOs to spend for PT tokens
//         let remainingAmount = ptAmount;
//         const selectedPtUtxos: UTxO[] = [];
//         for (const utxo of selectedToken.utxos) {
//             if (remainingAmount <= 0) break;
//             const utxoTokenAmount = utxo.assets[selectedToken.unit] || BigInt(0);
//             if (utxoTokenAmount > 0) {
//                 selectedPtUtxos.push(utxo);
//                 remainingAmount -= utxoTokenAmount;
//             }
//         }
//         console.log("Selected PT UTXOs:", selectedPtUtxos.length);
//         // Build transaction
//         const txBuilder = lucid.newTx()
//             .collectFrom([contractUtxo], redeemer)
//             .collectFrom(selectedPtUtxos) // Collect PT UTXOs from lender
//             .attach.SpendingValidator(CBOR);
//         // Calculate total PT tokens being sent
//         const totalPtInUtxos = selectedPtUtxos.reduce((sum, utxo) =>
//             sum + (utxo.assets[selectedToken.unit] || BigInt(0)), BigInt(0)
//         );
//         // Send PT tokens to script address along with updated datum
//         const scriptPayment: Record<string, bigint> = {
//             lovelace: contractUtxo.assets.lovelace || BigInt(2000000),
//             [selectedToken.unit]: (contractUtxo.assets[selectedToken.unit] || BigInt(0)) + ptAmount
//         };
//         txBuilder.pay.ToAddressWithData(
//             scriptAddr,
//             { kind: "inline", value: updatedCborDatum },
//             scriptPayment
//         );
//         // Handle change for PT tokens if necessary
//         const change = totalPtInUtxos - ptAmount;
//         if (change > 0) {
//             // Send change back to lender
//             txBuilder.pay.ToAddress(lenderWallet, { [selectedToken.unit]: change });
//         }
//         const tx = await txBuilder.complete();
//         const signedTx = await tx.sign.withWallet().complete();
//         const txHash = await signedTx.submit();
//         console.log("Lending Transaction Hash:", txHash);
//         return {
//             txHash,
//             newTotalPT: updatedDatum.totalPT,
//             lenderBalance: updatedDatum.lenders.find(l => l.pkh === lenderPkh)?.balance || BigInt(0),
//             ptTokenUnit: selectedToken.unit,
//             ptTokensSent: ptAmount
//         };
//     } catch (error) {
//         console.error("Error in lending operation:", error);
//         throw error;
//     }
// }
function lendPT(lenderSeed, ptAmount, ptTokenUnit) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lucid = yield (0, lucid_1.Lucid)(new lucid_1.Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"), "Preprod");
            const scriptAddr = (0, lucid_1.validatorToAddress)("Preprod", CBOR);
            // Set up lender wallet
            lucid.selectWallet.fromSeed(lenderSeed);
            const lenderWallet = yield lucid.wallet().address();
            const { paymentCredential } = (0, lucid_1.getAddressDetails)(lenderWallet);
            const lenderPkh = paymentCredential === null || paymentCredential === void 0 ? void 0 : paymentCredential.hash;
            if (!lenderPkh) {
                throw new Error("Could not extract lender payment credential hash");
            }
            console.log("Lender Address:", lenderWallet);
            console.log("Lender PKH:", lenderPkh);
            console.log("Lending amount:", ptAmount.toString());
            // Get PT token information from lender's wallet
            const ptTokenInfo = yield getLenderPTTokens(lenderWallet, lucid, ptTokenUnit);
            if (ptTokenInfo.length === 0) {
                throw new Error("No PT tokens found in lender's wallet");
            }
            console.log("PT Tokens found in lender's wallet:");
            ptTokenInfo.forEach((tokenInfo, index) => {
                console.log(`Token ${index + 1}:`);
                console.log(`  Unit: ${tokenInfo.unit}`);
                console.log(`  Amount: ${tokenInfo.amount.toString()}`);
                console.log(`  UTXOs: ${tokenInfo.utxos.length}`);
            });
            // Find the token to use (first one if no specific unit provided)
            let selectedToken = ptTokenInfo[0];
            if (ptTokenUnit) {
                const specificToken = ptTokenInfo.find(token => token.unit === ptTokenUnit);
                if (!specificToken) {
                    throw new Error(`PT token with unit ${ptTokenUnit} not found in wallet`);
                }
                selectedToken = specificToken;
            }
            else if (ptTokenInfo[0].unit === "all_pt_tokens") {
                console.log("Using all PT tokens from wallet (aggregated)");
            }
            if (selectedToken.amount < ptAmount) {
                throw new Error(`Insufficient PT tokens. Available: ${selectedToken.amount}, Required: ${ptAmount}`);
            }
            console.log(`Using PT Token: ${selectedToken.unit}`);
            console.log(`Available: ${selectedToken.amount}, Lending: ${ptAmount}`);
            // Get current UTXOs at script address
            const scriptUtxos = yield lucid.utxosAt(scriptAddr);
            console.log("Found UTXOs at script:", scriptUtxos.length);
            if (scriptUtxos.length === 0) {
                throw new Error("No UTXOs found at script address. Initialize contract first.");
            }
            // Find the UTXO with our datum (assuming it's the first one or has the largest ADA amount)
            const contractUtxo = scriptUtxos.reduce((prev, current) => (current.assets.lovelace || BigInt(0)) > (prev.assets.lovelace || BigInt(0)) ? current : prev);
            if (!contractUtxo.datum) {
                throw new Error("Contract UTXO has no datum");
            }
            // Parse current datum
            const currentDatum = parseLenderDatum(contractUtxo.datum);
            console.log("Current total PT:", currentDatum.totalPT.toString());
            console.log("Current lenders count:", currentDatum.lenders.length);
            // Update datum with new lending
            const updatedDatum = updateLenderData(currentDatum, lenderPkh, ptAmount);
            const updatedDatumArray = lenderDatumToArray(updatedDatum);
            const updatedCborDatum = lucid_1.Data.to(updatedDatumArray);
            console.log("New total PT:", updatedDatum.totalPT.toString());
            // Create redeemer
            const redeemer = lucid_1.Data.void();
            // Select UTXOs to spend for PT tokens
            let remainingAmount = ptAmount;
            const selectedPtUtxos = [];
            // Sort UTXOs by descending token amount to minimize the number of inputs
            const sortedUtxos = [...selectedToken.utxos].sort((a, b) => {
                const aAmount = a.assets[selectedToken.unit] || BigInt(0);
                const bAmount = b.assets[selectedToken.unit] || BigInt(0);
                return Number(bAmount - aAmount);
            });
            for (const utxo of sortedUtxos) {
                if (remainingAmount <= 0)
                    break;
                const utxoTokenAmount = utxo.assets[selectedToken.unit] || BigInt(0);
                if (utxoTokenAmount > 0) {
                    selectedPtUtxos.push(utxo);
                    remainingAmount -= utxoTokenAmount;
                }
            }
            console.log("Selected PT UTXOs:", selectedPtUtxos.length);
            // Build transaction
            const txBuilder = lucid.newTx()
                .collectFrom([contractUtxo], redeemer)
                .collectFrom(selectedPtUtxos)
                .attach.SpendingValidator(CBOR);
            // Calculate total PT tokens being sent
            const totalPtInUtxos = selectedPtUtxos.reduce((sum, utxo) => sum + (utxo.assets[selectedToken.unit] || BigInt(0)), BigInt(0));
            // Send PT tokens to script address along with updated datum
            const scriptPayment = {
                lovelace: contractUtxo.assets.lovelace || BigInt(2000000),
                [selectedToken.unit]: (contractUtxo.assets[selectedToken.unit] || BigInt(0)) + ptAmount
            };
            txBuilder.pay.ToAddressWithData(scriptAddr, { kind: "inline", value: updatedCborDatum }, scriptPayment);
            // Handle change for PT tokens if necessary
            const change = totalPtInUtxos - ptAmount;
            if (change > 0) {
                txBuilder.pay.ToAddress(lenderWallet, { [selectedToken.unit]: change });
            }
            const tx = yield txBuilder.complete();
            const signedTx = yield tx.sign.withWallet().complete();
            const txHash = yield signedTx.submit();
            console.log("Lending Transaction Hash:", txHash);
            return {
                txHash,
                newTotalPT: updatedDatum.totalPT,
                lenderBalance: ((_a = updatedDatum.lenders.find(l => l.pkh === lenderPkh)) === null || _a === void 0 ? void 0 : _a.balance) || BigInt(0),
                ptTokenUnit: selectedToken.unit,
                ptTokensSent: ptAmount
            };
        }
        catch (error) {
            console.error("Error in lending operation:", error);
            throw error;
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== Initializing Contract ===");
            const { scriptAddr, adminPkh } = yield initializeContract();
            // Wait a bit for the transaction to be confirmed
            console.log("Waiting for initialization to confirm...");
            yield new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
            console.log("\n=== Lending PT ===");
            // Example PT token unit (replace with your actual PT token unit)
            const PT_TOKEN_UNIT = "your_pt_token_policy_id.your_pt_token_name"; // Replace with actual token unit
            // Method 1: Lend specific PT token
            console.log("Method 1: Lending specific PT token");
            try {
                const lendingResult = yield lendPT(seed, BigInt(100000000), PT_TOKEN_UNIT);
                console.log("Lending completed!");
                console.log("Token unit:", lendingResult.ptTokenUnit);
                console.log("Tokens sent:", lendingResult.ptTokensSent.toString());
                console.log("New total PT in contract:", lendingResult.newTotalPT.toString());
                console.log("Lender balance:", lendingResult.lenderBalance.toString());
            }
            catch (error) {
                console.log("Method 1 failed, trying method 2...");
                console.log("Error:", error);
                // Method 2: Lend any available PT tokens (first custom token found)
                console.log("\nMethod 2: Lending any available PT tokens");
                const lendingResult = yield lendPT(seed, BigInt(100000000)); // No specific token unit
                console.log("Lending completed!");
                console.log("Token unit:", lendingResult.ptTokenUnit);
                console.log("Tokens sent:", lendingResult.ptTokensSent.toString());
                console.log("New total PT in contract:", lendingResult.newTotalPT.toString());
                console.log("Lender balance:", lendingResult.lenderBalance.toString());
            }
        }
        catch (error) {
            console.error("Error in main:", error);
        }
    });
}
// Run main if this file is executed directly
if (require.main === module) {
    main();
}

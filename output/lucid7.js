import { Blockfrost, Lucid, validatorToAddress, getAddressDetails, fromText } from '@lucid-evolution/lucid';
import dotenv from 'dotenv';
dotenv.config();
const seed = process.env.ADMIN_SEED;
const cbor = process.env.CBOR;
const CBOR = {
    type: "PlutusV2",
    script: cbor,
};
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
// const parseLenderDatum = (datumCbor: string): LenderDatum => {
//     const datum = Data.from(datumCbor);
//     if (!Array.isArray(datum) || datum.length !== 4) {
//         throw new Error("Invalid datum structure");
//     }
//     const [adminPkh, totalPT, totalReward, lendersArray] = datum;
//     if (!Array.isArray(lendersArray)) {
//         throw new Error("Invalid lenders array in datum");
//     }
//     const lenders: LenderInfo[] = lendersArray.map((lender: any) => {
//         if (!Array.isArray(lender) || lender.length !== 2) {
//             throw new Error("Invalid lender structure");
//         }
//         const [pkh, [balance, rewardDebt]] = lender;
//         return {
//             pkh: pkh as string,
//             balance: BigInt(balance),
//             rewardDebt: BigInt(rewardDebt)
//         };
//     });
//     function extractBigInt(val: any): bigint {
//         if (typeof val === "bigint" || typeof val === "number" || typeof val === "string") {
//             return BigInt(val);
//         }
//         if (Array.isArray(val) && val.length > 0) {
//             return extractBigInt(val[0]);
//         }
//         throw new Error("Cannot extract bigint from value: " + JSON.stringify(val));
//     }
//     return {
//         adminPkh: adminPkh as string,
//         totalPT: extractBigInt(totalPT),
//         totalReward: extractBigInt(totalReward),
//         lenders
//     };
// };
// const updateLenderData = (
//     currentDatum: LenderDatum,
//     lenderPkh: string,
//     additionalPT: bigint,
//     rewardPerToken: bigint = BigInt(0)
// ): LenderDatum => {
//     const existingLenderIndex = currentDatum.lenders.findIndex(l => l.pkh === lenderPkh);
//     let updatedLenders = [...currentDatum.lenders];
//     if (existingLenderIndex >= 0) {
//         const currentLender = currentDatum.lenders[existingLenderIndex];
//         updatedLenders[existingLenderIndex] = {
//             pkh: lenderPkh,
//             balance: currentLender.balance + additionalPT,
//             rewardDebt: currentLender.rewardDebt + (additionalPT * rewardPerToken) / BigInt(1000000)
//         };
//     } else {
//         updatedLenders.push({
//             pkh: lenderPkh,
//             balance: additionalPT,
//             rewardDebt: (additionalPT * rewardPerToken) / BigInt(1000000)
//         });
//     }
//     return {
//         adminPkh: currentDatum.adminPkh,
//         totalPT: currentDatum.totalPT + additionalPT,
//         totalReward: currentDatum.totalReward,
//         lenders: updatedLenders
//     };
// };
// const lenderDatumToArray = (datum: LenderDatum) => {
//     const lenderEntries = datum.lenders.map(lender => [
//         lender.pkh,
//         [lender.balance, lender.rewardDebt]
//     ]);
//     return [
//         datum.adminPkh,
//         datum.totalPT,
//         datum.totalReward,
//         lenderEntries
//     ];
// };
async function initializeContract() {
    const lucid = await Lucid(new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"), "Preprod");
    const scriptAddr = validatorToAddress("Preprod", CBOR);
    lucid.selectWallet.fromSeed(seed);
    const adminWallet = await lucid.wallet().address();
    const { paymentCredential } = getAddressDetails(adminWallet);
    const adminPkh = paymentCredential?.hash;
    console.log("Admin Address:", adminWallet);
    console.log("Script Address:", scriptAddr);
    console.log("Admin PKH:", adminPkh);
    if (!adminPkh) {
        throw new Error("Could not extract payment credential hash");
    }
    // const initialDatum = createLenderDatum(
    //     adminPkh,
    //     BigInt(0),
    //     BigInt(50000),
    //     []
    // );
    const policyId = "be0df58be0d65b9a944bea9488fc60d5320e5bea9b1ba4f5aece0ae1";
    const assetName = "PLASTIC"; // Replace with your actual asset name
    // const cborDatum = Data.to(initialDatum);
    // console.log("Initial Datum CBOR:", cborDatum);
    const tx = await lucid
        .newTx()
        // .pay.ToAddressWithData(scriptAddr, { kind: "inline", value: cborDatum }, { lovelace: BigInt(2000000) })
        .pay.ToAddress(scriptAddr, { [policyId + fromText(assetName)]: BigInt(5000000) })
        .complete();
    const signedTx = await tx.sign.withWallet().complete();
    const txHash = await signedTx.submit();
    console.log("Contract Initialized. Transaction Hash:", txHash);
    // return { scriptAddr, adminPkh };
}
// async function getLenderPTTokens(lenderAddress: string, lucid: any, ptTokenUnit?: string) {
//     const lenderUtxos = await lucid.utxosAt(lenderAddress);
//     const ptTokenInfo: { unit: string, name: string, amount: bigint, utxos: UTxO[] }[] = [];
//     console.log("lenderUtxos :", lenderUtxos.length);
//     console.log("ptTokeInfo :", ptTokenInfo);
//     lenderUtxos.forEach((utxo: UTxO) => {
//         Object.keys(utxo.assets).forEach(asset => {
//             if (asset !== 'lovelace') {
//                 if (ptTokenUnit && asset !== ptTokenUnit) {
//                     return;
//                 }
//                 const amount = utxo.assets[asset] || BigInt(0);
//                 const existingToken = ptTokenInfo.find(token => token.unit === asset);
//                 console.log("amount :", amount);
//                 console.log("existingToken :", existingToken);
//                 const policyId = asset.slice(0, 56);
//                 log(`Policy ID: ${policyId}`);
//                 if (policyId !== 'be0df58be0d65b9a944bea9488fc60d5320e5bea9b1ba4f5aece0ae1') {
//                     log(`Skipping asset with policy ID.Asset_Name: ${policyId}`);
//                     return;
//                 }
//                 const assetNameHex = asset.slice(56);
//                 let assetName = "PLASTIC";
//                 try {
//                     assetName = Buffer.from(assetNameHex, 'hex').toString('utf8');
//                 } catch {
//                     assetName = assetNameHex;
//                 }
//                 if (existingToken) {
//                     existingToken.amount += amount;
//                     existingToken.utxos.push(utxo);
//                 } else {
//                     ptTokenInfo.push({
//                         unit: asset,
//                         name: assetName,
//                         amount: amount,
//                         utxos: [utxo]
//                     });
//                 }
//             }
//         });
//     });
//     return ptTokenInfo;
// }
// async function getLenderPTTokens(lenderAddress: string, lucid: any, policyId: string) {
//     const lenderUtxos = await lucid.utxosAt(lenderAddress);
//     const ptTokenInfo: { unit: string, name: string, amount: bigint, utxos: UTxO[] }[] = [];
//     console.log(`Checking ${lenderUtxos.length} UTXOs for tokens with policy ID: ${policyId}`);
//     lenderUtxos.forEach((utxo: UTxO) => {
//         Object.keys(utxo.assets).forEach(asset => {
//             if (asset !== 'lovelace') {
//                 // Check if the asset belongs to our policy
//                 const assetPolicyId = asset.slice(0, 56);
//                 if (assetPolicyId !== policyId) {
//                     return; // Skip tokens not from our policy
//                 }
//                 const amount = utxo.assets[asset] || BigInt(0);
//                 const existingToken = ptTokenInfo.find(token => token.unit === asset);
//                 // Extract asset name
//                 const assetNameHex = asset.slice(56);
//                 let assetName = "PLASTIK"; // Default name
//                 // console.log("Asset Name Hex:", assetNameHex);
//                 try {
//                     assetName = Buffer.from(assetNameHex, 'hex').toString('utf8');
//                 } catch {
//                     assetName = assetNameHex; // Fallback to hex if not valid UTF-8
//                 }
//                 if (existingToken) {
//                     existingToken.amount += amount;
//                     existingToken.utxos.push(utxo);
//                 } else {
//                     ptTokenInfo.push({
//                         unit: asset,
//                         name: assetName,
//                         amount: amount,
//                         utxos: [utxo]
//                     });
//                 }
//             }
//         });
//     });
//     console.log(`Found ${ptTokenInfo.length} PT tokens in wallet`);
//     ptTokenInfo.forEach((token, index) => {
//         console.log(`Token ${index + 1}: ${token.name} (${token.unit}), Amount: ${token.amount}`);
//     });
//     return ptTokenInfo;
// }
// async function lendPT(lenderSeed: string, ptAmount: bigint, ptTokenUnit: string) {
//     try {
//         const lucid = await Lucid(
//             new Blockfrost(
//                 "https://cardano-preprod.blockfrost.io/api/v0",
//                 "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"
//             ),
//             "Preprod"
//         );
//         const scriptAddr = validatorToAddress("Preprod", CBOR);
//         lucid.selectWallet.fromSeed(lenderSeed);
//         const lenderWallet = await lucid.wallet().address();
//         const { paymentCredential } = getAddressDetails(lenderWallet);
//         const lenderPkh = paymentCredential?.hash;
//         console.log("lender PKH :", lenderPkh);
//         console.log("ptTokenUnit :", ptTokenUnit);
//         if (!lenderPkh) {
//             throw new Error("Could not extract lender payment credential hash");
//         }
//         console.log("Lender Address:", lenderWallet);
//         // console.log("Lender PKH:", lenderPkh);
//         console.log("Lending amount:", ptAmount.toString());
//         const ptTokenInfo = await getLenderPTTokens(lenderWallet, lucid, ptTokenUnit);
//         // console.log("PLASTIC token Info ", ptTokenInfo);
//         console.log("PT Tokens in lender's wallet:", ptTokenInfo.length);
//         if (ptTokenInfo.length === 0) {
//             throw new Error("No PT tokens found in lender's wallet");
//         }
//         console.log("PT Tokens found in lender's wallet:");
//         ptTokenInfo.forEach((tokenInfo, index) => {
//             console.log("tokenInfo :", tokenInfo);
//             console.log(`  Unit: ${tokenInfo.unit}`);
//             console.log(`  Name: ${tokenInfo.name}`);
//             console.log(`  Amount: ${tokenInfo.amount.toString()}`);
//             console.log(`  UTXOs: ${tokenInfo.utxos.length}`);
//         });
//         // Select the first token found with this policy (or implement selection logic)
//         const selectedToken = ptTokenInfo[0];
//         // console.log("Selected Token:", selectedToken);
//         console.log("Selected Token Details:", {
//             unit: selectedToken.unit,
//             name: selectedToken.name,
//             amount: selectedToken.amount.toString()
//         });
//         if (selectedToken.amount < ptAmount) {
//             throw new Error(`Insufficient tokens. Available: ${selectedToken.amount}, Required: ${ptAmount}`);
//         }
//         console.log(`Using PT Token: ${selectedToken.name} (${selectedToken.unit})`);
//         console.log(`Available: ${selectedToken.amount}, Lending: ${ptAmount}`);
//         const scriptUtxos = await lucid.utxosAt(scriptAddr);
//         // console.log("Found UTXOs at script:", scriptUtxos.length);
//         if (scriptUtxos.length === 0) {
//             throw new Error("No UTXOs found at script address. Initialize contract first.");
//         }
//         const contractUtxo = scriptUtxos.reduce((prev, current) =>
//             (current.assets.lovelace || BigInt(0)) > (prev.assets.lovelace || BigInt(0)) ? current : prev
//         );
//         console.log("Contract UTXO:", contractUtxo);
//         // if (!contractUtxo.datum) {
//         //     throw new Error("Contract UTXO has no datum");
//         // }
//         // const currentDatum = parseLenderDatum(contractUtxo.datum);
//         // console.log("Current total PT:", currentDatum.totalPT.toString());
//         // console.log("Current lenders count:", currentDatum.lenders.length);
//         // const updatedDatum = updateLenderData(currentDatum, lenderPkh, ptAmount);
//         // const updatedDatumArray = lenderDatumToArray(updatedDatum); 
//         // const updatedCborDatum = Data.to(updatedDatumArray);
//         // console.log("New total PT:", updatedDatum.totalPT.toString());
//         // const redeemer = Data.void();
//         // let remainingAmount = ptAmount;
//         // const selectedPtUtxos: UTxO[] = [];
//         // const sortedUtxos = [...selectedToken.utxos].sort((a, b) => {
//         //     const aAmount = a.assets[selectedToken.unit] || BigInt(0);
//         //     const bAmount = b.assets[selectedToken.unit] || BigInt(0);
//         //     return Number(bAmount - aAmount);
//         // });
//         // for (const utxo of sortedUtxos) {
//         //     if (remainingAmount <= 0) break;
//         //     const utxoTokenAmount = utxo.assets[selectedToken.unit] || BigInt(0);
//         //     if (utxoTokenAmount > 0) {
//         //         selectedPtUtxos.push(utxo);
//         //         remainingAmount -= utxoTokenAmount;
//         //     }
//         // }
//         // console.log("Selected PT UTXOs:", selectedPtUtxos.length);
//         // const txBuilder = lucid.newTx()
//         //     .collectFrom([contractUtxo], redeemer)
//         //     .collectFrom(selectedPtUtxos)
//         //     .attach.SpendingValidator(CBOR);
//         // const totalPtInUtxos = selectedPtUtxos.reduce((sum, utxo) =>
//         //     sum + (utxo.assets[selectedToken.unit] || BigInt(0)), BigInt(0)
//         // );
//         // const scriptPayment: Record<string, bigint> = {
//         //     lovelace: contractUtxo.assets.lovelace || BigInt(2000000),
//         //     [selectedToken.unit]: (contractUtxo.assets[selectedToken.unit] || BigInt(0)) + ptAmount
//         // };
//         // txBuilder.pay.ToAddressWithData(
//         //     scriptAddr,
//         //     { kind: "inline", value: updatedCborDatum },
//         //     scriptPayment
//         // );
//         // const change = totalPtInUtxos - ptAmount;
//         // if (change > 0) {
//         //     txBuilder.pay.ToAddress(lenderWallet, { [selectedToken.unit]: change });
//         // }504c415354494b
//         // const tx = await txBuilder.complete();
//         // const signedTx = await tx.sign.withWallet().complete();
//         // const txHash = await signedTx.submit();
//         // console.log("Lending Transaction Hash:", txHash);
//         //     return {
//         //         txHash,
//         //         newTotalPT: updatedDatum.totalPT,
//         //         lenderBalance: updatedDatum.lenders.find(l => l.pkh === lenderPkh)?.balance || BigInt(0),
//         //         ptTokenUnit: selectedToken.unit,
//         //         ptTokenName: selectedToken.name,
//         //         ptTokensSent: ptAmount
//         //     };
//         // } catch (error) {
//         //     console.error("Error in lending operation:", error);
//         //     throw error;
//         // }
//         // Remove the above block comments and return a dummy result for now to avoid void return
//         return {
//             txHash: "",
//             newTotalPT: BigInt(0),
//             lenderBalance: BigInt(0),
//             ptTokenUnit: selectedToken.unit,
//             ptTokenName: selectedToken.name,
//             ptTokensSent: ptAmount
//         };
//     }
//     catch (error) {
//         console.error("Error in lendPT:", error);
//         return undefined;
//     }
// }
// async function main() {
//     try {
//         console.log("=== Initializing Contract ===");
//         const { scriptAddr, adminPkh } = await initializeContract();
//         console.log("Waiting for initialization to confirm...");
//         // await new Promise(resolve => setTimeout(resolve, 30000));
//         console.log("\n=== Lending PT ===");
//         const PT_TOKEN_UNIT = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7"; // Replace with your actual token unit
//         const lendingResult = await lendPT(seed, BigInt(10000000), PT_TOKEN_UNIT);
//         if (lendingResult) {
//             console.log("Lending completed!");
//             console.log("Token name:", lendingResult.ptTokenName);
//             console.log("Token unit:", lendingResult.ptTokenUnit);
//             console.log("Tokens sent:", lendingResult.ptTokensSent.toString());
//             console.log("New total PT in contract:", lendingResult.newTotalPT.toString());
//             console.log("Lender balance:", lendingResult.lenderBalance.toString());
//         } else {
//             console.log("Lending failed or was not completed.");
//         }
//     } catch (error) {
//         console.error("Error in main:", error);
//     }
// }
// // export { initializeContract, lendPT, parseLenderDatum, updateLenderData };
// const POLICY_ID = "be0df58be0d65b9a944bea9488fc60d5320e5bea9b1ba4f5aece0ae1";
// lendPT(seed, BigInt(1), POLICY_ID);
initializeContract();

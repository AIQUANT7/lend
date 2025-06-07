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
const lucid_1 = require("@lucid-evolution/lucid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seed = process.env.ADMIN_SEED;
const cbor = process.env.CBOR;
const CBOR = {
    type: "PlutusV2",
    script: cbor,
};
// Method 1: Using Lucid Evolution's Data construction (Recommended)
const createLenderDatumV1 = (adminPkh, totalPT, totalReward, lenders) => {
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
// Method 2: Using manual constructor format (if Method 1 doesn't work)
const createLenderDatumV2 = (adminPkh, totalPT, totalReward, lenders) => {
    const lenderEntries = lenders.map(([pkhHex, [balance, rewardDebt]]) => ({
        constructor: 0,
        fields: [
            pkhHex, // Direct hex string instead of { bytes: pkhHex }
            {
                constructor: 0,
                fields: [
                    balance, // Direct bigint instead of { int: balance.toString() }
                    rewardDebt
                ]
            }
        ]
    }));
    return {
        constructor: 0,
        fields: [
            adminPkh, // Direct hex string
            totalPT, // Direct bigint
            totalReward, // Direct bigint
            lenderEntries
        ]
    };
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize Lucid with Blockfrost
            const lucid = yield (0, lucid_1.Lucid)(new lucid_1.Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"), "Preprod");
            const scriptAddr = (0, lucid_1.validatorToAddress)("Preprod", CBOR);
            console.log("Script Address:", scriptAddr);
            lucid.selectWallet.fromSeed(seed);
            const adminWallet = yield lucid.wallet().address();
            console.log("Wallet Address:", adminWallet);
            const { paymentCredential } = (0, lucid_1.getAddressDetails)(adminWallet);
            const adminPkh = paymentCredential === null || paymentCredential === void 0 ? void 0 : paymentCredential.hash;
            // console.log("Payment Credential Hash:", adminPkh);
            if (!adminPkh) {
                throw new Error("Could not extract payment credential hash");
            }
            // const { paymentCredential } = getAddressDetails(scriptAddr);
            // const scritpPymentCredential = paymentCredential?.hash;
            // if (!scritpPymentCredential) {
            //     throw new Error("Could not extract script payment credential");
            // }
            // console.log("Script Payment Credential:", scritpPymentCredential);
            console.log("Payment Credentials: ", paymentCredential);
            console.log("Admin Payment Credential:", adminPkh);
            // console.log("Creating datum...");
            // Try Method 1 first (recommended)
            try {
                const datum = createLenderDatumV1(adminPkh, BigInt(1000000), BigInt(50000), [
                    [adminPkh, [BigInt(0), BigInt(0)]],
                ]);
                // console.log("Datum (Method 1):", datum);
                const cborDatum = lucid_1.Data.to(datum);
                console.log("Datum CBOR:", cborDatum);
                const tx = yield lucid.newTx()
                    .pay.ToAddressWithData(scriptAddr, { kind: "inline", value: cborDatum }, { lovelace: BigInt(1000000) })
                    .complete();
                const signedTx = yield tx.sign.withWallet().complete();
                const txHash = yield signedTx.submit();
                console.log("Transaction Hash:", txHash);
            }
            catch (error) {
                console.log("Method 1 Error:", error);
            }
        }
        catch (error) {
            console.error("Error in main:", error);
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                // console.error("Error stack:", error.stack);
            }
        }
    });
}
main();

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
const createLenderDatum = (adminPkh, totalPT, totalReward, lenders) => {
    const lenderEntries = lenders.map(([pkhHex, [balance, rewardDebt]]) => ({
        constructor: 0,
        fields: [
            { bytes: pkhHex },
            {
                constructor: 0,
                fields: [
                    { int: balance.toString() },
                    { int: rewardDebt.toString() }
                ]
            }
        ]
    }));
    return {
        constructor: 0,
        fields: [
            { bytes: adminPkh },
            { int: totalPT.toString() },
            { int: totalReward.toString() },
            { list: lenderEntries }
        ]
    };
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize Lucid with Blockfrost
        const lucid = yield (0, lucid_1.Lucid)(new lucid_1.Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"), "Preprod");
        const scriptAddr = (0, lucid_1.validatorToAddress)("Preprod", CBOR);
        console.log("Script Address:", scriptAddr);
        lucid.selectWallet.fromSeed(seed);
        const adminWallet = yield lucid.wallet().address();
        console.log("Wallet Address:", adminWallet);
        const { paymentCredential } = (0, lucid_1.getAddressDetails)(adminWallet);
        const adminPkh = paymentCredential === null || paymentCredential === void 0 ? void 0 : paymentCredential.hash;
        console.log("Payment Credentials: ", paymentCredential);
        console.log("Admin Payment Credential:", adminPkh);
        // Convert the payment credential to a hex string
        console.log("working upto here");
        const datum = createLenderDatum(adminPkh, BigInt(1000000), BigInt(50000), [
            [adminPkh, [BigInt(0), BigInt(0)]],
        ]);
        console.log("Datum:", datum);
        const cborDatum = lucid_1.Data.to(datum);
        console.log("Datum CBOR:", cborDatum);
        // const tx = await lucid
        //     .newTx()
        //     .pay.ToAddressWithData(
        //         scriptAddr,
        //         { kind: "inline", value: newD },
        //         { lovelace: BigInt(10000000) }
        //     )
        //     .complete();
        // console.log("tx ", tx);
    });
}
main();

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
// import { getAddressDetails } from 'lucid-cardano'
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Script = {
    type: "PlutusV2",
    script: process.env.CBOR,
};
// Datum type matching on-chain LenderDatum
// Constr index 0 wraps the record: [totalPT, rewardPerPT, list of (pkh, (balance, rewardDebt))]
function lenderDatum(totalPT, rewardPerPT, lenders) {
    const entries = lenders.map(([pkhHex, [balance, rewardDebt]]) => new lucid_1.Constr(0, [(0, lucid_1.fromText)(pkhHex), new lucid_1.Constr(0, [balance, rewardDebt])]));
    return new lucid_1.Constr(0, [totalPT, rewardPerPT, entries]);
}
// Redeemer for Deposit
const intiLucid = () => __awaiter(void 0, void 0, void 0, function* () {
    const lucid = yield (0, lucid_1.Lucid)(new lucid_1.Blockfrost(process.env.API_URL, process.env.API_KEY), "Preprod");
    return lucid;
});
function initializePool() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Select wallet from seed phrase
            const lucid = yield intiLucid();
            lucid.selectWallet.fromSeed("nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute");
            const walletAddress = yield lucid.wallet().address();
            console.log("wallet addrss ", walletAddress);
            const utxos = yield lucid.utxosAt(walletAddress);
            // console.log("utxos ", utxos);
            // Address of the validator script
            const scriptAddress = yield (0, lucid_1.validatorToAddress)("Preprod", Script);
            console.log("Script address ", scriptAddress);
            // For simplicity, assume first deposit (empty pool)
            const initialDatum = lucid_1.Data.to(lenderDatum(BigInt(0), BigInt(0), []));
            console.log("initial Datum ", initialDatum);
            // Build transaction to pay PT tokens to the script
            const tx = yield lucid
                .newTx()
                .pay.ToContract(scriptAddress, { kind: "inline", value: initialDatum }, { lovelace: BigInt(5000000) })
                .complete();
            // Sign and submit
            const signed = yield tx.sign.withWallet().complete();
            const txHash = yield signed.submit();
            console.log("Submitted deposit tx:", txHash);
        }
        catch (error) {
            console.log(error);
        }
    });
}
// initializePool();
const pt = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7504c415354494b";
const usdm = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab75553444d";
// Redeemer for Deposit
const depositRedeemer = lucid_1.Data.to(new lucid_1.Constr(0, []));
// ... existing imports and setup ...
function depositPT(amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const lucid = yield intiLucid();
        lucid.selectWallet.fromSeed("nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute");
        // Get current wallet's PKH
        const address = yield lucid.wallet().address();
        // console.log("admin wallet address ", address);
        const { paymentCredential } = yield (0, lucid_1.getAddressDetails)(address);
        if (!(paymentCredential === null || paymentCredential === void 0 ? void 0 : paymentCredential.hash))
            throw new Error("No payment credential found");
        const pkh = paymentCredential.hash;
        // console.log("payment credentials ", paymentCredential);
        // console.log("public key hash ", pkh);
        const scriptAddr = yield (0, lucid_1.validatorToAddress)("Preprod", Script);
        const utxos = yield lucid.utxosAt(scriptAddr);
        const poolUtxo = utxos[0];
        if (!poolUtxo)
            throw Error("No pool UTxO found");
        // console.log("pool utxos ", poolUtxo);
        // Find UTxO with sufficient PT tokens
        const walletUtxos = yield lucid.utxosAt(address);
        // console.log("WalletUtxos ", walletUtxos);
        const ptUtxo = walletUtxos.find((utxo) => utxo.assets[pt] && utxo.assets[pt] >= amount);
        // console.log("ptUtxo ", ptUtxo);
        if (!ptUtxo)
            throw new Error("Insufficient PT tokens");
        // Decode existing datum
        const d = lucid_1.Data.from(poolUtxo.datum);
        let totalPT = d.fields[0];
        let rewardPerPT = d.fields[1];
        let lenders = [];
        for (const e of d.fields[2]) {
            const owner = e.fields[0];
            const rec = e.fields[1];
            lenders.push([owner, [rec.fields[0], rec.fields[1]]]);
        }
        // console.log("d ", d);
        // // Update totals
        totalPT += amount;
        const idx = lenders.findIndex(([o]) => o === pkh);
        const balance = idx >= 0 ? lenders[idx][1][0] + amount : amount;
        const rewardDebt = rewardPerPT * balance;
        // console.log("totalPT ", totalPT);
        // console.log("idx ", idx);
        // console.log("balance:- ", balance);
        // console.log("rewardDebt:- ", rewardDebt);
        lenders = [
            [pkh, [balance, rewardDebt]],
            ...lenders.filter(([o]) => o !== pkh),
        ];
        // console.log("lenders ", lenders);
        const newDatum = lenderDatum(totalPT, rewardPerPT, lenders);
        // console.log("newDatum:- ", newDatum);
        // // Preserve existing assets and add deposited PT
        const newAssets = Object.assign(Object.assign({}, poolUtxo.assets), { [pt]: (poolUtxo.assets[pt] || BigInt(0)) + amount });
        // console.log("newAssets ", newAssets);
        // // Fixed redeemer
        const depositRedeemer = lucid_1.Data.to(new lucid_1.Constr(0, []));
        const tx = yield lucid
            .newTx()
            .attach.SpendingValidator(Script)
            .collectFrom([ptUtxo], depositRedeemer)
            .collectFrom([ptUtxo])
            .addSigner(address)
            .pay.ToContract(scriptAddr, { kind: "inline", value: lucid_1.Data.to(newDatum) }, newAssets)
            .complete();
        // console.log("tx ", tx);
        const signedTx = yield tx.sign.withWallet().complete();
        // console.log("signedTx ", signedTx);
        const txHash = yield signedTx.submit();
        console.log("txHash ", txHash);
    });
}
// Example call
depositPT(BigInt(1000));
const getScriptUtxos = () => __awaiter(void 0, void 0, void 0, function* () {
    const lucid = yield intiLucid();
    const address = (0, lucid_1.validatorToAddress)("Preprod", Script);
    const utxos = yield lucid.utxosAt(address);
    // console.log("Script utxos ", utxos);
});
getScriptUtxos();
const getUnitUtxos = () => __awaiter(void 0, void 0, void 0, function* () {
    const lucid = yield intiLucid();
    // Select wallet from seed phrase
    lucid.selectWallet.fromSeed("nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute");
    const address = yield lucid.wallet().address();
    const myUtxos = yield lucid.utxosAtWithUnit(address, pt);
    console.log("⛏ my PT-UTxOs:", myUtxos);
});
// getUnitUtxos();

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
const api = process.env.API_URL;
const api_key = process.env.API_KEY;
const network = process.env.NETWORK;
const admin_seed = process.env.ADMIN_SEED;
const cbor = process.env.CBOR;
function myLucid() {
    return __awaiter(this, void 0, void 0, function* () {
        const lucid = yield (0, lucid_1.Lucid)(new lucid_1.Blockfrost(api, api_key), "Preprod");
        const seed = admin_seed;
        lucid.selectWallet.fromSeed(seed);
        const adminWallet = yield lucid.wallet().address();
        console.log("admin wallet ", adminWallet);
        const spend_val = {
            type: "PlutusV2",
            script: cbor,
        };
        const scriptAddress = (0, lucid_1.validatorToAddress)("Preprod", spend_val);
        console.log("script address ", scriptAddress);
        const datumString = lucid_1.Data.to("2342525235");
        // console.log("datumString", datumString);
        // Token structure for minting
        const mintingPolicy = (0, lucid_1.scriptFromNative)({
            type: "all",
            scripts: [
                { type: "sig", keyHash: (0, lucid_1.paymentCredentialOf)(adminWallet).hash },
            ],
        });
        console.log("MintingPolicy ", mintingPolicy);
        const policyId = (0, lucid_1.mintingPolicyToId)(mintingPolicy);
        console.log("PolicyId ", policyId);
        // Define NFT metadata
        const assetName = "MyUniqueNFT";
        const unit = policyId + (0, lucid_1.fromText)(assetName);
        const metadata = {
            [unit]: {
                name: "My Unique NFT",
                image: "https://bafybeibreijdhwtcc3ij6ukr5v2i74z6gukrtubg6yd4u76efnjb5ccpv4.ipfs.dweb.link/",
                description: "This is my first NFT minted with Lucid",
                // Add any additional metadata fields
                mediaType: "image/webp",
                files: [{
                        name: "MyNFT",
                        mediaType: "image/webp",
                        src: "https://bafybeibreijdhwtcc3ij6ukr5v2i74z6gukrtubg6yd4u76efnjb5ccpv4.ipfs.dweb.link/"
                    }]
            }
        };
        // console.log("metadata ", metadata);
        const tx = yield lucid
            .newTx()
            // .pay.ToAddress(scriptAddress, { lovelace: BigInt(5000000) })
            // .attachMetadata(1, { msg: "Wen Midgard?" })
            // .pay.ToAddress(scriptAddress, { ["e8f329da44fb66d033d26a566b0f9f743493b0cf18458c051ac44261" + fromText("USDM")]: BigInt(100000) })
            // .pay.ToAddressWithData(scriptAddress, { kind: "inline", value: datumString }, { lovelace: BigInt(5000000) })
            // .pay.ToAddressWithData(scriptAddress, { kind: "hash", value: Data.to("232e3e33434") },
            //     { lovelace: BigInt(4000000) })
            // .mintAssets({ [policyId + fromText("RAVITOKEN")]: BigInt(1000000000) })
            // .pay.ToAddress(adminWallet, { [policyId + fromText("RAVITOKEN")]: BigInt(1000000000) })
            // .attach.MintingPolicy(mintingPolicy)
            .mintAssets({ [unit]: BigInt(10) })
            .pay.ToAddress(adminWallet, { [unit]: BigInt(10) })
            .attach.MintingPolicy(mintingPolicy)
            .complete();
        // console.log("tx ", tx);
        const signedTx = yield tx.sign.withWallet().complete();
        console.log("signedTx ", signedTx);
        const txHash = yield signedTx.submit();
        console.log("txHash ", txHash);
    });
}
myLucid();

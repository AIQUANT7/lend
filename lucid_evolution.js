import {
  Blockfrost,
  Lucid,
  generatePrivateKey,
  generateSeedPhrase,
  validatorToAddress,
  validatorToScriptHash,
} from "@lucid-evolution/lucid";

import dotenv from "dotenv";
dotenv.config();

const api = process.env.API_URL;
const api_key = process.env.API_KEY;
const network = process.env.NETWORK;
const admin_seed = process.env.ADMIN_SEED;
const cbor = process.env.CBOR;
// console.log(api);
// console.log(api_key);
// console.log(network);
// console.log(admin_seed);
// console.log(cbor);

const lucid = await Lucid(new Blockfrost(api, api_key), network);

// console.log(lucid);

lucid.selectWallet.fromSeed(admin_seed);

const wallet = await lucid.wallet().address();
console.log("Wallet Address ", wallet);

const spend_val = {
  type: "PlutusV2",
  script: cbor,
};

// console.log(spend_val);

const scriptAddress = validatorToAddress("Preprod", spend_val);
console.log("Script Address ", scriptAddress);
// addr_test1wp95f6r3lrl4pxh5apyn39tt7utydghx6s6gx69p5kxcwugxwe46n;

const tx = lucid
  .newTx()
  .pay.ToContract(scriptAddress, { lovelace: 5000000n })
  .complete();

const signedTx = await tx.sign.complete();

console.log("tx ", signedTx);

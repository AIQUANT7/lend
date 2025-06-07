"use strict";
// import { Blockfrost, Lucid, Validator, validatorToAddress, fromText, Data, paymentCredentialOf, scriptFromNative, mintingPolicyToId, Network, } from "@lucid-evolution/lucid"
// import dotenv from "dotenv";
// dotenv.config();
// const api: string = process.env.API_URL!;
// const api_key: string = process.env.API_KEY!;
// const admin_seed: string = process.env.ADMIN_SEED!
// const cbor: string = process.env.CBOR!
// const seed: string = process.env.ADMIN_SEED!
// const Validator: Validator = {
//     type: "PlutusV2",
//     script: cbor,
// };
// const createLenderDatum = (
//     totalPT: bigint,
//     rewardPerPT: bigint,
//     lenders: [string, [bigint, bigint]][]
// ): Data => {
//     const entries = lenders.map(
//         ([pkhHex, [balance, rewardDebt]]) =>
//             new Data.Constr(0, [fromText(pkhHex), new Data.Constr(0, [balance, rewardDebt])])
//     );
//     return new Data.Constr(0, [totalPT, rewardPerPT, entries]);
// };
// const initializePool = async () => {
//     try {
//         const lucid = await Lucid(new Blockfrost(api, api_key), "Preprod");
//         lucid.selectWallet.fromSeed("nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute")
//         const adminWallet = await lucid.wallet().address()
//         console.log("Wallet Address:->", adminWallet);
//         const scriptAddr = validatorToAddress("Preprod", Validator)
//         console.log("Script Address:-> ", scriptAddr);
//         const tx = await lucid.newTx()
//             // .pay.ToAddress(scriptAddr, { lovelace: BigInt(10000000) })
//             .pay.ToAddressWithData(scriptAddr, { kind: "inline", value: createLenderDatum(BigInt(0), BigInt(0), []) }, { lovelace: BigInt(10000000) })
//             .complete()
//         const signedTx = await tx.sign.withWallet().complete()
//         const txHash = await signedTx.submit()
//         console.log("txHash ", txHash);
//     } catch (error) {
//         console.log(error);
//     }
// }
// initializePool();

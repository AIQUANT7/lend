"use strict";
// import { Lucid, Blockfrost, validatorToAddress, Data, Validator, Constr, getAddressDetails, Integer, String } from '@lucid-evolution/lucid'
// import dotenv from "dotenv";
// import { fromText } from 'lucid-cardano';
// dotenv.config();
// const Script: Validator = {
//     type: "PlutusV2",
//     script: process.env.CBOR!,
// };
// const initLucid = async () => {
//     const lucid = await Lucid(
//         new Blockfrost(process.env.API_URL!, process.env.API_KEY!),
//         "Preprod"
//     );
//     return lucid;
// };
// function lenderDatum(
//     totalPT: bigint,
//     rewardPerPT: bigint,
//     lenders: [string, [bigint, bigint]][]
// ) {
//     const entries = lenders.map(
//         ([pkhHex, [balance, rewardDebt]]) =>
//             new Constr(0, [fromText(pkhHex), new Constr(0, [balance, rewardDebt])])
//     );
//     return new Constr(0, [totalPT, rewardPerPT, entries]);
// }
// async function initializePool() {
//     try {
//         // Select wallet from seed phrase
//         const lucid = await initLucid();
//         lucid.selectWallet.fromSeed(
//             "nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute"
//         );
//         const walletAddress = await lucid.wallet().address();
//         console.log("wallet addrss ", walletAddress);
//         const scriptAddress = await validatorToAddress("Preprod", Script);
//         console.log("Script address ", scriptAddress);
//         // const tx = await lucid
//         //     .newTx()
//         //     // .pay.ToAddress(scriptAddress, { lovelace: BigInt(4000000) }) // Pay 5 ADA to scriptAddress
//         //     .pay.ToAddressWithData(scriptAddress, { kind: "inline", value: Data.to("Hello World") })
//         //     .attachMetadata(1, { msg: "Ravindra Singh" })
//         //     .complete();
//         // First define your types to match the Haskell code
//         const LenderDatumSchema = Data.Object({
//             adminPkh: String(),  // PubKeyHash
//             totalPT: BigInt(),
//             rewardPerPT: BigInt(),
//             lenders: Data.Array(Data.Tuple([
//                 String(),  // PubKeyHash
//                 Data.Tuple([Integer(), Integer()])  // (staked, rewardDebt)
//             ]))
//         });
//         type LenderDatum = Data.Static<typeof LenderDatumSchema>;
//         const LenderDatum = LenderDatumSchema as unknown as LenderDatum;
//         // Create the actual datum
//         const createLenderDatum = (
//             adminPkh: string,
//             totalPT: BigInt,
//             rewardPerPT: BigInt,
//             lenders: [string, [BigInt, BigInt]][]
//         ): { kind: "inline"; value: string } => {
//             return {
//                 kind: "inline",
//                 value: Data.to({
//                     adminPkh,
//                     totalPT,
//                     rewardPerPT,
//                     lenders
//                 }, LenderDatum)
//             };
//         };
//         const tx = await lucid
//             .newTx()
//             .pay.ToContract(
//                 scriptAddress,
//                 { kind: "inline", value: Data.to(lenderDatum(BigInt(1000), BigInt(0), [[walletAddress, [BigInt(0), BigInt(0)]]])) },
//                 { lovelace: BigInt(4000000) }
//             )
//             .attachMetadata(1, { msg: "Ravindra Singh" })
//             .complete();
//         // console.log("tx ", tx);
//         const signedTx = await tx.sign.withWallet().complete();
//         // console.log("signedTx ", signedTx);
//         const txHash = await signedTx.submit();
//         console.log("Transaction Submitted:", txHash)
//     } catch (error) {
//         console.log(error);
//     }
// }
// initializePool()

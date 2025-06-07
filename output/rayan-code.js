"use strict";
// import {
//     Lucid,
//     Blockfrost,
//     Data,
//     Constr,
//     Assets,
//     fromText,
//     toText,
//     Validator,
//     UTxO,
//     validatorToAddress,
//     getAddressDetails,
//     LucidEvolution,
// } from "@lucid-evolution/lucid";
// import dotenv from "dotenv";
// dotenv.config();
// const validator: Validator = {
//     type: "PlutusV2",
//     script: process.env.CBOR!,
// };
// const intiLucid = async () => {
//     const lucid = await Lucid(
//         new Blockfrost(process.env.API_URL!, process.env.API_KEY!),
//         "Preprod"
//     );
//     return lucid;
// };
// const contractAddress = await intiLucid().then((lucid) =>
//     validatorToAddress("Preprod", validator)
// );
// // Contract parameters (replace with your actual values)
// const ptPolicyId = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7";
// const ptTokenName = fromText("PLASTIK");
// const ptAssetUnit = ptPolicyId + ptTokenName;
// const usdmPolicyId = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7";
// const usdmTokenName = fromText("USDM");
// const precisionFactor = 1_000_000n;
// // Helper functions
// const getPubKeyHash = async (): Promise<string> => {
//     const lucid = await intiLucid();
//     lucid.selectWallet.fromSeed(process.env.MNEMONIC!);
//     const address = await lucid.wallet().address();
//     const { paymentCredential } = getAddressDetails(address);
//     return paymentCredential?.hash || "";
// };
// const buildLenderAction = (action: {
//     type: "Deposit" | "Withdraw" | "AddReward" | "Redeem";
//     amount?: bigint;
// }): Constr<Data> => {
//     switch (action.type) {
//         case "Deposit":
//             return new Constr(0, []);
//         case "Withdraw":
//             if (action.amount === undefined)
//                 throw new Error("Withdraw requires amount");
//             return new Constr(1, [action.amount]);
//         case "AddReward":
//             return new Constr(2, []);
//         case "Redeem":
//             return new Constr(3, []);
//     }
// };
// // Build lender datum for on-chain use
// function buildLenderDatum(datum: LenderDatum): Constr<Data> {
//     const lendersData = datum.lenders.map(
//         ([pkh, [balance, rewardDebt]]) =>
//             new Constr(0, [pkh, new Constr(0, [balance, rewardDebt])])
//     );
//     return new Constr(0, [datum.totalPT, datum.rewardPerPT, lendersData]);
// }
// // Define types for better type safety
// type LenderDatum = {
//     totalPT: bigint;
//     rewardPerPT: bigint;
//     lenders: [string, [bigint, bigint]][];
// };
// type Lender = {
//     pubKeyHash: string;
//     balance: bigint;
//     rewardDebt: bigint;
// };
// // Helper function to parse the lender datum
// function parseLenderDatum(data: Data): LenderDatum {
//     if (data instanceof Constr && data.index === 0) {
//         const [totalPT, rewardPerPT, lendersData] = data.fields;
//         if (
//             typeof totalPT === "bigint" &&
//             typeof rewardPerPT === "bigint" &&
//             Array.isArray(lendersData)
//         ) {
//             const lenders: [string, [bigint, bigint]][] = [];
//             for (const lenderData of lendersData) {
//                 if (lenderData instanceof Constr && lenderData.index === 0) {
//                     const [pkh, tupleData] = lenderData.fields;
//                     if (
//                         typeof pkh === "string" &&
//                         tupleData instanceof Constr &&
//                         tupleData.index === 0
//                     ) {
//                         const [balance, rewardDebt] = tupleData.fields;
//                         if (typeof balance === "bigint" && typeof rewardDebt === "bigint") {
//                             lenders.push([pkh, [balance, rewardDebt]]);
//                         }
//                     }
//                 }
//             }
//             return {
//                 totalPT,
//                 rewardPerPT,
//                 lenders,
//             };
//         }
//     }
//     throw new Error("Invalid datum format");
// }
// // Deposit function with proper type handling
// async function deposit(lucid: LucidEvolution, depositAmount: bigint) {
//     try {
//         const pkh = await getPubKeyHash();
//         const contractUTxOs = await lucid.utxosAt(contractAddress);
//         const userAddress = await lucid.wallet().address();
//         if (contractUTxOs.length === 0) {
//             // Initialize pool with first deposit
//             const initialDatum = buildLenderDatum({
//                 totalPT: depositAmount,
//                 rewardPerPT: 0n,
//                 lenders: [[pkh, [depositAmount, 0n]]],
//             });
//             return lucid
//                 .newTx()
//                 .pay.ToContract(
//                     contractAddress,
//                     { kind: "inline", value: Data.to(initialDatum) },
//                     {
//                         [ptAssetUnit]: depositAmount,
//                     }
//                 )
//                 .complete();
//         }
//         const contractUTxO = contractUTxOs[0];
//         if (!contractUTxO.datum) throw new Error("Missing datum in contract UTxO");
//         const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
//         // Create typed lenders array
//         let lenderExists = false;
//         const updatedLenders: [string, [bigint, bigint]][] =
//             currentDatum.lenders.map(
//                 ([pubKey, [balance, rewardDebt]]): [string, [bigint, bigint]] => {
//                     if (pubKey === pkh) {
//                         lenderExists = true;
//                         const newBalance = balance + depositAmount;
//                         const newRewardDebt = currentDatum.rewardPerPT * newBalance;
//                         return [pubKey, [newBalance, newRewardDebt]];
//                     }
//                     return [pubKey, [balance, rewardDebt]];
//                 }
//             );
//         // Add new lender if not exists
//         if (!lenderExists) {
//             const newBalance = depositAmount;
//             const newRewardDebt = currentDatum.rewardPerPT * newBalance;
//             updatedLenders.push([pkh, [newBalance, newRewardDebt]]);
//         }
//         const newDatum: LenderDatum = {
//             totalPT: currentDatum.totalPT + depositAmount,
//             rewardPerPT: currentDatum.rewardPerPT,
//             lenders: updatedLenders,
//         };
//         // Get user UTxO containing tokens
//         const userUtxos = await lucid.wallet().getUtxos();
//         const userUtxo = userUtxos.find(
//             (utxo) =>
//                 utxo.assets[ptAssetUnit] && utxo.assets[ptAssetUnit] >= depositAmount
//         );
//         if (!userUtxo) throw new Error("User has insufficient tokens");
//         // Build transaction
//         return lucid
//             .newTx()
//             .collectFrom(
//                 [contractUTxO],
//                 Data.to(buildLenderAction({ type: "Deposit" }))
//             )
//             .collectFrom([userUtxo]) // Spend user's token UTxO
//             .pay.ToContract(
//                 contractAddress,
//                 { kind: "inline", value: Data.to(buildLenderDatum(newDatum)) },
//                 {
//                     ...contractUTxO.assets,
//                     [ptAssetUnit]:
//                         (contractUTxO.assets[ptAssetUnit] || 0n) + depositAmount,
//                 }
//             )
//             .attach.SpendingValidator(validator)
//             .addSigner(userAddress)
//             .complete();
//     } catch (error) {
//         console.log(error.message);
//     }
// }
// // Withdraw function
// async function withdraw(lucid: any, withdrawAmount: bigint) {
//     const pkh = await getPubKeyHash();
//     const contractUTxOs = await lucid.utxosAt(contractAddress);
//     if (contractUTxOs.length === 0) throw new Error("No contract UTxOs found");
//     const contractUTxO = contractUTxOs[0];
//     if (!contractUTxO.datum) throw new Error("Missing datum in contract UTxO");
//     const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
//     // Find lender
//     const lenderIndex = currentDatum.lenders.findIndex(
//         ([pubKey]) => pubKey === pkh
//     );
//     if (lenderIndex === -1) throw new Error("Lender not found");
//     const [pubKey, [currentBal, currentRD]] = currentDatum.lenders[lenderIndex];
//     if (withdrawAmount > currentBal) throw new Error("Insufficient balance");
//     // Update lender data
//     const newBal = currentBal - withdrawAmount;
//     const newRD = currentDatum.rewardPerPT * newBal;
//     const updatedLenders = [...currentDatum.lenders];
//     updatedLenders[lenderIndex] = [pubKey, [newBal, newRD]];
//     // Remove lender if balance is zero
//     const finalLenders =
//         newBal === 0n
//             ? updatedLenders.filter((_, i) => i !== lenderIndex)
//             : updatedLenders;
//     const newDatum: LenderDatum = {
//         totalPT: currentDatum.totalPT - withdrawAmount,
//         rewardPerPT: currentDatum.rewardPerPT,
//         lenders: finalLenders,
//     };
//     // Build transaction
//     return lucid
//         .newTx()
//         .collectFrom(
//             [contractUTxO],
//             Data.to(
//                 buildLenderAction({
//                     type: "Withdraw",
//                     amount: withdrawAmount,
//                 })
//             )
//         )
//         .payToContract(
//             contractAddress,
//             { inline: Data.to(buildLenderDatum(newDatum)) },
//             {
//                 ...contractUTxO.assets,
//                 [`${ptPolicyId}${ptTokenName}`]:
//                     (contractUTxO.assets[`${ptPolicyId}${ptTokenName}`] || 0n) -
//                     withdrawAmount,
//             }
//         )
//         .payToAddress(await lucid.wallet().address(), {
//             [`${ptPolicyId}${ptTokenName}`]: withdrawAmount,
//         })
//         .attachSpendingValidator(validator)
//         .addSigner(await lucid.wallet().address())
//         .complete();
// }
// // Add Reward function
// async function addReward(lucid: any, rewardAmount: bigint) {
//     const contractUTxOs = await lucid.utxosAt(contractAddress);
//     if (contractUTxOs.length === 0) throw new Error("No contract UTxOs found");
//     const contractUTxO = contractUTxOs[0];
//     if (!contractUTxO.datum) throw new Error("Missing datum in contract UTxO");
//     const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
//     // Calculate new reward rate
//     const newRewardPerPT =
//         currentDatum.totalPT === 0n
//             ? currentDatum.rewardPerPT
//             : currentDatum.rewardPerPT +
//             (rewardAmount * precisionFactor) / currentDatum.totalPT;
//     const newDatum: LenderDatum = {
//         totalPT: currentDatum.totalPT,
//         rewardPerPT: newRewardPerPT,
//         lenders: currentDatum.lenders,
//     };
//     // Build transaction
//     return lucid
//         .newTx()
//         .collectFrom(
//             [contractUTxO],
//             Data.to(buildLenderAction({ type: "AddReward" }))
//         )
//         .payToContract(
//             contractAddress,
//             { inline: Data.to(buildLenderDatum(newDatum)) },
//             {
//                 ...contractUTxO.assets,
//                 [`${usdmPolicyId}${usdmTokenName}`]:
//                     (contractUTxO.assets[`${usdmPolicyId}${usdmTokenName}`] || 0n) +
//                     rewardAmount,
//             }
//         )
//         .attachSpendingValidator(validator)
//         .complete();
// }
// // Redeem function
// // Redeem function
// async function redeem(lucid: any) {
//     const pkh = await getPubKeyHash();
//     const contractUTxOs = await lucid.utxosAt(contractAddress);
//     if (contractUTxOs.length === 0) throw new Error("No contract UTxOs found");
//     const contractUTxO = contractUTxOs[0];
//     if (!contractUTxO.datum) throw new Error("Missing datum in contract UTxO");
//     const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
//     // Find lender
//     const lenderIndex = currentDatum.lenders.findIndex(
//         ([pubKey]) => pubKey === pkh
//     );
//     if (lenderIndex === -1) throw new Error("Lender not found");
//     const [pubKey, [balance, rewardDebt]] = currentDatum.lenders[lenderIndex];
//     const pending =
//         (currentDatum.rewardPerPT * balance - rewardDebt) / precisionFactor;
//     if (pending <= 0n) throw new Error("No rewards available");
//     // Update lender's reward debt with proper type handling
//     const newRD = currentDatum.rewardPerPT * balance;
//     // Explicitly type the lenders array
//     const updatedLenders: [string, [bigint, bigint]][] = currentDatum.lenders.map(
//         ([pubKey, [bal, rd]]): [string, [bigint, bigint]] => {
//             return pubKey === pkh ? [pubKey, [bal, newRD]] : [pubKey, [bal, rd]];
//         }
//     );
//     const newDatum: LenderDatum = {
//         totalPT: currentDatum.totalPT,
//         rewardPerPT: currentDatum.rewardPerPT,
//         lenders: updatedLenders,
//     };
//     // Build transaction
//     return lucid
//         .newTx()
//         .collectFrom([contractUTxO], Data.to(buildLenderAction({ type: "Redeem" })))
//         .payToContract(
//             contractAddress,
//             { inline: Data.to(buildLenderDatum(newDatum)) },
//             {
//                 ...contractUTxO.assets,
//                 [`${usdmPolicyId}${usdmTokenName}`]:
//                     (contractUTxO.assets[`${usdmPolicyId}${usdmTokenName}`] || 0n) -
//                     pending,
//             }
//         )
//         .payToAddress(await lucid.wallet().address(), {
//             [`${usdmPolicyId}${usdmTokenName}`]: pending,
//         })
//         .attachSpendingValidator(validator)
//         .addSigner(await lucid.wallet().address())
//         .complete();
// }
// const getScriptUtxos = async () => {
//     const lucid = await intiLucid();
//     const utxos = await lucid.utxosAt(contractAddress);
//     console.log(utxos);
//     utxos.forEach((utxo) => {
//         const datum = utxo.datum;
//         if (!datum) return;
//         const oldDatum = Data.from(datum) as Constr<unknown>;
//         console.dir(oldDatum, { depth: null });
//     });
// };
// const lucid = await intiLucid();
// lucid.selectWallet.fromSeed(process.env.MNEMONIC!);
// // const tx = await deposit(lucid, 100n);
// // if (!tx) {
// //   throw new Error("Failed to build deposit transaction.");
// // }
// // const signed = await tx.sign.withWallet().complete();
// // const txHash = await signed.submit();
// // console.log("Deposit tx submitted:", txHash);
// getScriptUtxos();

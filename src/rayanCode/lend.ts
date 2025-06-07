import {
    Lucid,
    Blockfrost,
    Data,
    Constr,
    Assets,
    fromText,
    toText,
    Validator,
    UTxO,
    validatorToAddress,
    getAddressDetails,
    LucidEvolution,
} from "@lucid-evolution/lucid";
import dotenv from "dotenv";

dotenv.config();

const initLucid = async () => {
    const lucid = await Lucid(
        new Blockfrost(process.env.API_URL!, process.env.API_KEY!),
        "Preprod"
    );

    // console.log(lucid);

    return lucid;
};


// console.log("Initializing Lucid...", initLucid)
const StackValidator: Validator = {
    type: "PlutusV2",
    script: process.env.CBOR!,
};
// console.log("cbor1 ", process.env.CBOR);
// console.log("cbor2 ", process.env.CBOR2);

// const RefiValidator: Validator = {
//     type: "PlutusV2",
//     script: process.env.REFI_CBOR!,
// };



const StackContractAddress = await initLucid().then((lucid) =>
    validatorToAddress("Preprod", StackValidator)
);
console.log("Stack Contract Address:", StackContractAddress);
// const refiContractAddress = await initLucid().then((lucid) =>
//     validatorToAddress("Preprod", RefiValidator)
// );
// console.log("Refi Contract Address:", refiContractAddress);



// Roadmap Datum Interface
// interface RoadmapDatum {
//     preId: string;
//     roadmapId: string;
//     roadmapName: string;
//     roadmapDescription: string;
//     progress: bigint;
//     adminsPkh: string[]; // Array of admin PKHs
//     prePkh: string;
//     preSkh: string;
//     totalPlasticCredits: bigint;
//     soldPlasticCredits: bigint;
//     totalPlasticTokens: bigint;
//     sentPlasticTokens: bigint;
//     totalPlastic: bigint;
//     recoverPlastic: bigint;
//     createdAt: string;
// }
// Parses Data → JS RoadmapDatum, expecting 15 fields in the Constr
function parseRoadmapDatum(data: Data) {
    if (data instanceof Constr && data.index === 0) {
        const [
            maybePreId,
            maybeRoadmapId,
            maybeRoadmapName,
            maybeRoadmapDescription,
            maybeProgress,
            maybeAdminsPkh,
            maybePrePkh,
            maybePreSkh,
            maybeTotalPlasticCredits,
            maybeSoldPlasticCredits,
            maybeTotalPlasticTokens,
            maybeSentPlasticTokens,
            maybeTotalPlastic,
            maybeRecoverPlastic,
            maybeCreatedAt,
        ] = data.fields;

        // Validate basic types
        if (
            typeof maybePreId === "string" &&
            typeof maybeRoadmapId === "string" &&
            typeof maybeRoadmapName === "string" &&
            typeof maybeRoadmapDescription === "string" &&
            typeof maybeProgress === "bigint" &&
            Array.isArray(maybeAdminsPkh) &&
            typeof maybePrePkh === "string" &&
            typeof maybePreSkh === "string" &&
            typeof maybeTotalPlasticCredits === "bigint" &&
            typeof maybeSoldPlasticCredits === "bigint" &&
            typeof maybeTotalPlasticTokens === "bigint" &&
            typeof maybeSentPlasticTokens === "bigint" &&
            typeof maybeTotalPlastic === "bigint" &&
            typeof maybeRecoverPlastic === "bigint" &&
            typeof maybeCreatedAt === "string"
        ) {
            // Parse admin PKHs array
            const adminsPkh: string[] = [];
            for (const adminPkh of maybeAdminsPkh) {
                if (typeof adminPkh === "string") {
                    adminsPkh.push(adminPkh);
                } else {
                    throw new Error("Invalid admin PKH format in array");
                }
            }

            return {
                preId: toText(maybePreId),
                roadmapId: toText(maybeRoadmapId),
                roadmapName: toText(maybeRoadmapName),
                roadmapDescription: toText(maybeRoadmapDescription),
                progress: maybeProgress,
                adminsPkh,
                prePkh: maybePrePkh,
                preSkh: maybePreSkh,
                totalPlasticCredits: maybeTotalPlasticCredits,
                soldPlasticCredits: maybeSoldPlasticCredits,
                totalPlasticTokens: maybeTotalPlasticTokens,
                sentPlasticTokens: maybeSentPlasticTokens,
                totalPlastic: maybeTotalPlastic,
                recoverPlastic: maybeRecoverPlastic,
                createdAt: toText(maybeCreatedAt),
            };
        }
    }
    throw new Error("Invalid roadmap datum format");
}

// Updated Initialize Function with Admin PKH Array
const initializeRoadmap = async (
    lucid: LucidEvolution,
    preId: string,
    roadmapId: string,
    roadmapName: string,
    roadmapDescription: string,
    prePkh: string,
    preSkh: string,
    totalPlasticCredits: bigint,
    totalPlasticTokens: bigint,
    totalPlastic: bigint
) => {
    try {
        const adminPkh = await getPubKeyHash(lucid);
        console.log("Admin Pkh:", adminPkh);

        // Check if roadmap already exists
        const utxos = await lucid.utxosAt(StackContractAddress);
        // console.log("UTxOs at refi contract:", refiContractAddress); // Log UTxOs for debugging
        // console.log("UTxOs at refi contract:", utxos);

        const matchedUtxo = utxos.find((utxo) => {
            if (!utxo.datum) return false;
            try {
                const datum = Data.from(utxo.datum) as Constr<Data>;
                return (
                    toText(datum.fields[0] as string) === preId &&
                    toText(datum.fields[1] as string) === roadmapId
                );
            } catch {
                return false;
            }
        });


        console.log("Matched UTXO:", matchedUtxo);


        if (matchedUtxo) {
            throw new Error(
                `Roadmap with preId ${preId} and roadmapId ${roadmapId} already exists`
            );
        }

        // Create datum with proper structure
        const datumToLock = new Constr(0, [
            fromText(preId),
            fromText(roadmapId),
            fromText(roadmapName),
            fromText(roadmapDescription),
            BigInt(0), // progress
            [adminPkh], // Properly constructed list
            prePkh,
            preSkh,
            BigInt(totalPlasticCredits),
            BigInt(0), // soldPlasticCredits
            BigInt(totalPlasticTokens),
            BigInt(0), // sentPlasticTokens
            BigInt(totalPlastic),
            BigInt(0), // recoverPlastic
            fromText(new Date().toISOString()),
        ]);

        const AMOUNT = 3_000_000n;
        const tx = await lucid
            .newTx()
            .pay.ToContract(StackContractAddress, {
                kind: "inline",
                value: Data.to(datumToLock),
            })
            .complete();

        return tx;
    } catch (err) {
        console.error(err);
        throw new Error(
            `Failed to initialize roadmap: ${err instanceof Error ? err.message : String(err)
            }`
        );
    }
};
// initializeRoadmap
//
// 2) Token‐related constants (unchanged)
//

const ptPolicyId = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7";
const ptTokenName = fromText("PLASTIK");
const ptAssetUnit = ptPolicyId + ptTokenName;

const usdmPolicyId = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7";
const usdmTokenName = fromText("USDM");
const usdmAssetUnit = usdmPolicyId + usdmTokenName;

const precisionFactor = 1_000_000n;

//
// 3) Helper: get the current wallet’s PubKeyHash
//

const getPubKeyHash = async (lucid: LucidEvolution): Promise<string> => {
    const address = await lucid.wallet().address();
    const { paymentCredential } = getAddressDetails(address);
    return paymentCredential?.hash || "";
};


// 4) Updated “LenderAction” builder: now includes AdminWithdraw and AdminReturn
//

const buildLenderAction = (action: {
    type: "Deposit" | "Withdraw" | "Redeem" | "FundPlastikToEscrow" | "FundUSDM";
    amount?: bigint;
}): Constr<Data> => {
    switch (action.type) {
        case "Deposit":
            // Haskell: “Deposit” is the first constructor → index 0, no fields
            return new Constr(0, []);
        case "Withdraw":
            if (action.amount === undefined) {
                throw new Error("Withdraw requires amount");
            }
            // Haskell: 2nd constructor → index 1, one Integer field
            return new Constr(1, [action.amount]);
        case "Redeem":
            // Haskell: 4th constructor → index 3, no fields
            return new Constr(2, []);
        case "FundPlastikToEscrow":
            if (action.amount === undefined) {
                throw new Error("FundPlastikToEscrow requires amount");
            }
            // Haskell: 5th constructor → index 4, one Integer field
            return new Constr(3, [action.amount]);
        case "FundUSDM":
            if (action.amount === undefined) {
                throw new Error("FundUSDM requires amount");
            }
            // Haskell: 6th constructor → index 5, one Integer field
            return new Constr(4, [action.amount]);
        default:
            throw new Error("Unknown action type");
    }
};

type LenderDatum = {
    adminsPkh: string[]; // first field
    totalPT: bigint; // second field
    totalReward: bigint; // third field
    lenders: [string, [bigint, bigint]][]; // fourth field
};

// Builds a Constr<Data> matching: LenderDatum adminPkh totalPT totalReward lenders
function buildLenderDatum(datum: LenderDatum): Constr<Data> {
    // Convert each lender entry ([pkh, [balance, rewardDebt]]) → Constr(0, [pkh, Constr(0, [balance, rewardDebt])])
    const lendersData = datum.lenders.map(
        ([pkh, [balance, rewardDebt]]) =>
            new Constr(0, [pkh, new Constr(0, [balance, rewardDebt])])
    );

    console.log("lendersData ", lendersData);

    // Now emit a Constr with index 0 (since Haskell’s single data type LenderDatum gets 0 index)
    // and fields: [adminPkh, totalPT, totalReward, lendersData].

    console.log("datum.adminsPkh ",datum.adminsPkh);
    console.log("datum.totalPT ",datum.totalPT);
    console.log("datum.totalReward ",datum.totalReward);
    console.log("lendersData ",lendersData);
    
    
    
    
    return new Constr(0, [
        datum.adminsPkh,
        datum.totalPT,
        datum.totalReward,
        lendersData,
    ]);
}

// Parses Data → JS LenderDatum, expecting 4 fields in the Constr
// function parseLenderDatum(data: Data): LenderDatum {
//     // console.log("Attempting to parse datum:", data);


//     if (data instanceof Constr && data.index === 0) {
//         const [maybeAdminsPkh, maybeTotalPT, maybeTotalReward, maybeLendersData] =
//             data.fields;
//         // console.log(`maybeAdminsPkh ${maybeAdminsPkh}\nmaybeTotalPT ${maybeTotalPT}\nmaybeTotalReward ${maybeTotalReward}\nmaybeLendersData ${maybeLendersData}`);

//         if (
//             true
//         ) {
//             const adminsPkh: string[] = [];
//             for (const pkh of maybeAdminsPkh) {
//                 if (typeof pkh === "string") {
//                     adminsPkh.push(pkh);
//                 } else {
//                     throw new Error("Invalid admin PKH format in array");
//                 }
//             }
//             const lenders: [string, [bigint, bigint]][] = [];

//             for (const lenderData of maybeLendersData) {
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
//                 adminsPkh: adminsPkh,
//                 totalPT: maybeTotalPT,
//                 totalReward: maybeTotalReward,
//                 lenders,
//             };
//         }
//     }
//     throw new Error("Invalid datum format");


// }
// function parseLenderDatum(data: Data): LenderDatum {
//     if (data instanceof Constr && data.index === 0) {
//         const [maybeAdminsPkh, maybeTotalPT, maybeTotalReward, maybeLendersData] = data.fields;

//         // Validate types
//         if (

//             !Array.isArray(maybeAdminsPkh) ||
//             typeof maybeTotalPT !== 'bigint' ||
//             typeof maybeTotalReward !== 'bigint' ||
//             !Array.isArray(maybeLendersData)) {
//             throw new Error("Invalid datum field types");
//         }

//         const adminsPkh: string[] = [];
//         for (const pkh of maybeAdminsPkh) {
//             if (typeof pkh !== 'string') {
//                 throw new Error("Admin PKH must be string");
//             }
//             adminsPkh.push(pkh);
//         }

//         const lenders: [string, [bigint, bigint]][] = [];
//         for (const lenderData of maybeLendersData) {
//             if (lenderData instanceof Constr && lenderData.index === 0) {
//                 const [pkh, tupleData] = lenderData.fields;
//                 if (typeof pkh === 'string' &&
//                     tupleData instanceof Constr &&
//                     tupleData.index === 0) {
//                     const [balance, rewardDebt] = tupleData.fields;
//                     if (typeof balance === 'bigint' && typeof rewardDebt === 'bigint') {
//                         lenders.push([pkh, [balance, rewardDebt]]);
//                     }
//                 }
//             }
//         }

//         return {
//             adminsPkh,
//             totalPT: maybeTotalPT,
//             totalReward: maybeTotalReward,
//             lenders
//         };
//     }
//     throw new Error("Invalid datum format - expected Constr with index 0");
// }

function parseLenderDatum(data: Data) {
    console.log("data ",data);
    if (data instanceof Constr && data.index === 0) {

        
        const [maybeAdminsPkh, maybeTotalPT, maybeTotalReward, maybeLendersData] = data.fields;


        console.log(`maybeAdminsPkh ${maybeAdminsPkh}\nmaybeTotalPT ${maybeTotalPT}\nmaybeTotalReward ${maybeTotalReward}\nmaybeLendersData ${maybeLendersData}`);
        
        //     // Validate types
        if (

            true



        ) {



            const adminsPkh: string[] = [];
            for (const pkh of maybeAdminsPkh) {
                // console.log("public key hash ", pkh);

                if (typeof pkh !== 'string') {
                    throw new Error("Admin PKH must be string");
                }
                adminsPkh.push(pkh);
            }

            const lenders: [string, [bigint, bigint]][] = [];
            for (const lenderData of maybeLendersData) {
                if (lenderData instanceof Constr && lenderData.index === 0) {
                    const [pkh, tupleData] = lenderData.fields;
                    if (typeof pkh === 'string' &&
                        tupleData instanceof Constr &&
                        tupleData.index === 0) {
                        const [balance, rewardDebt] = tupleData.fields;
                        if (typeof balance === 'bigint' && typeof rewardDebt === 'bigint') {
                            lenders.push([pkh, [balance, rewardDebt]]);
                        }
                    }
                }
            }
            console.log("adminsPkh ",adminsPkh);
            console.log("lenders ",lenders);


            return {
                adminsPkh,
                totalPT: maybeTotalPT,
                totalReward: maybeTotalReward,
                lenders
            };
        }

    } throw new Error("Invalid datum format");



}



async function deposit(lucid: LucidEvolution, depositAmount: bigint) {
    try {
        const pkh = await getPubKeyHash(lucid);
        const userAddress = await lucid.wallet().address();
        console.log("User Address:", userAddress);
        console.log("User Pkh:", pkh);


        // Get UTxOs at contract
        const contractUTxOs = await lucid.utxosAt(StackContractAddress);
        console.log("Contract UTxOs:", contractUTxOs); // Debugging output

        if (contractUTxOs.length === 0) {
            // Initial deposit
            const initialDatum: LenderDatum = {
                adminsPkh: [pkh],
                totalPT: depositAmount,
                totalReward: 0n,
                lenders: [[pkh, [depositAmount, 0n]]]
            };

            console.log("Initial Datum ", initialDatum);


            const tx = await lucid.newTx()
                .pay.ToContract(
                    StackContractAddress,
                    { kind: "inline", value: Data.to(buildLenderDatum(initialDatum)) },
                    { [ptAssetUnit]: depositAmount }
                )
                .complete();

            // console.log("Initial deposit transaction built successfully", tx);

            return tx;
        }
            // console.log("tx ",tx);


        // Existing deposit
        const contractUTxO = contractUTxOs[1];

        console.log("contractUtxo ",contractUTxO);
        
        if (!contractUTxO.datum) throw new Error("Missing datum");
        console.log("contractUTxO datum:-> ", contractUTxO.datum);

        const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
        console.log("Current Datum after parseLenderDatum :", currentDatum); // Debugging output

        // // Update lenders
        const updatedLenders = currentDatum?.lenders.map(([pubKey, [balance, rewardDebt]]) =>
            pubKey === pkh
                ? [pubKey, [balance + depositAmount, rewardDebt]]
                : [pubKey, [balance, rewardDebt]]
        );
        console.log("updatedLenders ", updatedLenders);
    console.log("currentDatum.adminsPkh ",currentDatum.adminsPkh);
    console.log("totalPT ", currentDatum.totalPT + depositAmount);

    console.log(" totalReward",currentDatum.totalReward);

    console.log("updatedLenders ",updatedLenders);


        const newDatum: LenderDatum = {
            adminsPkh: currentDatum.adminsPkh,
            totalPT: currentDatum.totalPT + depositAmount,
            totalReward: currentDatum?.totalReward,
            lenders: updatedLenders
        };
        console.log("newDatum ", newDatum);
console.log("stack contract address ",StackContractAddress);

        // Build transaction
        return lucid.newTx()
            .collectFrom([contractUTxO], Data.to(buildLenderAction({ type: "Deposit" })))
            .pay.ToContract(
                StackContractAddress,
                { kind: "inline", value: Data.to(buildLenderDatum(newDatum)) },
                {
                    ...contractUTxO.assets,
                    [ptAssetUnit]: (contractUTxO.assets[ptAssetUnit] || 0n) + depositAmount
                }
            )
            .attach.SpendingValidator(StackValidator)
            .addSigner(userAddress)
            .complete();

    } catch (error) {
        console.error("Deposit error:", error);
        throw error;
    }
}
async function withdraw(
    lucid: LucidEvolution,
    withdrawAmount: bigint
): Promise<unknown> {
    try {
        // Get the wallet's public key hash
        const pkh = await getPubKeyHash(lucid);

        // Fetch existing UTxO at the contract
        const contractUTxOs = await lucid.utxosAt(StackContractAddress);
        const userAddress = await lucid.wallet().address();
console.log("contract Address ",StackContractAddress);
console.log("userAddress ",userAddress);


        // Check if contract has any UTxOs
        if (contractUTxOs.length === 0) {
            throw new Error("No contract UTxOs found - nothing to withdraw");
        }

        // Get the first contract UTxO (assuming single UTxO for simplicity)
        const contractUTxO = contractUTxOs[0];
        if (!contractUTxO.datum) {
            throw new Error("Missing datum in contract UTxO");
        }

        // Parse the existing on-chain datum
        const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));

        // Find the user in the lenders list
        const userLenderIndex = currentDatum.lenders.findIndex(
            ([pubKey, _]) => pubKey === pkh
        );

        if (userLenderIndex === -1) {
            throw new Error("User is not a lender in this contract");
        }

        const [_, [currentBalance, currentRewardDebt]] =
            currentDatum.lenders[userLenderIndex];

        // Check if user has sufficient balance
        if (currentBalance < withdrawAmount) {
            throw new Error(
                `Insufficient balance. Available: ${currentBalance}, Requested: ${withdrawAmount}`
            );
        }

        // Build updated lenders array
        const updatedLenders: [string, [bigint, bigint]][] = currentDatum.lenders
            .map(
                (
                    [pubKey, [balance, rewardDebt]],
                    index
                ): [string, [bigint, bigint]] => {
                    if (index === userLenderIndex) {
                        const newBalance = balance - withdrawAmount;
                        // Recalculate reward debt for new balance
                        const newRewardDebt = 0n;
                        return [pubKey, [newBalance, newRewardDebt]];
                    }
                    return [pubKey, [balance, rewardDebt]];
                }
            )
            .filter(([_, [balance, __]]) => balance > 0n); // Remove lenders with 0 balance

        let pendingReward = 0n; // Initialize pending reward
        // If user id withdrawing the full stake then we can also pay any pending rewards
        if (currentBalance === withdrawAmount) {
            // find the pending reward for the user from their pkh
            pendingReward =
                currentDatum.lenders.find((lender) => lender[0] === pkh)?.[1][1] || 0n;
        }
        // Build the new datum
        const newDatum: LenderDatum = {
            adminsPkh: currentDatum.adminsPkh,
            totalPT: currentDatum.totalPT - withdrawAmount,
            totalReward: currentDatum.totalReward - pendingReward,
            lenders: updatedLenders,
        };

        // Check if contract has enough PLASTIK tokens to withdraw
        const contractPtBalance = contractUTxO.assets[ptAssetUnit] || 0n;
        if (contractPtBalance < withdrawAmount) {
            throw new Error("Contract has insufficient PLASTIK tokens");
        }

        // Build the redeemer for Withdraw action
        const redeemer = buildLenderAction({
            type: "Withdraw",
            amount: withdrawAmount,
        });

        // Calculate remaining assets in the contract after withdrawal
        const remainingAssets = { ...contractUTxO.assets };
        remainingAssets[ptAssetUnit] = contractPtBalance - withdrawAmount;

        // Build the transaction
        const tx = lucid
            .newTx()
            .collectFrom([contractUTxO], Data.to(redeemer))
            .attach.Script(StackValidator)
            .addSigner(userAddress);

        // If there are still lenders or remaining PT, pay back to contract
        if (newDatum.totalPT > 0n && newDatum.lenders.length > 0) {
            tx.pay.ToContract(
                StackContractAddress,
                { kind: "inline", value: Data.to(buildLenderDatum(newDatum)) },
                remainingAssets
            );
        }

        // Pay withdrawn PLASTIK tokens to user
        tx.pay.ToAddress(userAddress, {
            [ptAssetUnit]: withdrawAmount,
        });

        // Pay any pending USDM rewards to user (if any)
        if (pendingReward > 0n) {
            const usdmAssetUnit = usdmPolicyId + usdmTokenName;
            const contractUsdmBalance = contractUTxO.assets[usdmAssetUnit] || 0n;

            if (contractUsdmBalance >= pendingReward) {
                tx.pay.ToAddress(userAddress, {
                    [usdmAssetUnit]: pendingReward,
                });

                // Subtract rewards from remaining contract assets
                remainingAssets[usdmAssetUnit] = contractUsdmBalance - pendingReward;
            }
        }

        return tx.complete();
    } catch (error: any) {
        console.error("Withdraw error:", error.message);
        throw error;
    }
}

async function redeemReward(lucid: LucidEvolution): Promise<unknown> {
    try {
        const pkh = await getPubKeyHash(lucid);
        const userAddress = await lucid.wallet().address();
        const contractUTxOs = await lucid.utxosAt(contractAddress);
        if (contractUTxOs.length === 0) {
            throw new Error("No contract UTxOs found - nothing to redeem");
        }
        const contractUTxO = contractUTxOs[0];
        if (!contractUTxO.datum) {
            throw new Error("Missing datum in contract UTxO");
        }
        const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
        const userLenderIndex = currentDatum.lenders.findIndex(
            ([pubKey, _]) => pubKey === pkh
        );
        if (userLenderIndex === -1) {
            throw new Error("User is not a lender in this contract");
        }
        const [_, [currentBalance, currentRewardDebt]] =
            currentDatum.lenders[userLenderIndex];
        if (currentRewardDebt === 0n) {
            throw new Error("No rewards to redeem");
        }
        // Build updated lenders array
        const updatedLenders: [string, [bigint, bigint]][] =
            currentDatum.lenders.map(
                (
                    [pubKey, [balance, rewardDebt]],
                    index
                ): [string, [bigint, bigint]] => {
                    if (index === userLenderIndex) {
                        // Reset the rewardDebt to 0 after redeeming
                        return [pubKey, [balance, 0n]];
                    }
                    return [pubKey, [balance, rewardDebt]];
                }
            );
        // Build the new datum
        const newDatum: LenderDatum = {
            adminsPkh: currentDatum.adminsPkh,
            totalPT: currentDatum.totalPT,
            totalReward: currentDatum.totalReward - currentRewardDebt,
            lenders: updatedLenders,
        };
        // Build the redeemer for Redeem action
        const redeemer = buildLenderAction({ type: "Redeem" });
        // Calculate remaining assets in the contract after redeeming
        const remainingAssets = { ...contractUTxO.assets };
        const usdmAssetUnit = usdmPolicyId + usdmTokenName;
        remainingAssets[usdmAssetUnit] =
            (remainingAssets[usdmAssetUnit] || 0n) - currentRewardDebt;
        // Build the transaction
        return lucid
            .newTx()
            .collectFrom([contractUTxO], Data.to(redeemer))
            .attach.Script(validator)
            .pay.ToAddress(userAddress, {
                [usdmAssetUnit]: currentRewardDebt,
            })
            .pay.ToContract(
                contractAddress,
                { kind: "inline", value: Data.to(buildLenderDatum(newDatum)) },
                remainingAssets
            )
            .complete();
    } catch (error) {
        console.error("RedeemReward error:", error);
        throw error;
    }
}

// async function FundPlastik(
//     lucid: LucidEvolution,
//     preId: string,
//     roadmapId: string,
//     soldPlasticCredit: bigint
// ) {
//     try {
//         // Get the wallet's public key hash of Admin
//         const adminPkh = await getPubKeyHash(lucid);
//         const adminAddress = await lucid.wallet().address();
//         console.log("Admin Pkh:", adminPkh);
//         console.log("Admin Address:", adminAddress);

//         // 2. Find matching UTXO
//         const refiUtxos = await lucid.utxosAt(StackContractAddress);
//         // console.log("contract UTxOs:", refiUtxos);

//         // console.log("UTxOs at refi contract:", refiUtxos);

//         const matchedUtxo = refiUtxos.find((utxo) => {
//             // console.log("Checking UTXO:", utxo);
//             // console.log("utxo.datum ", utxo.datum);

//             if (!utxo.datum) return false;

//             try {
//                 const datum = Data.from(utxo.datum) as Constr<Data>;
//                 // console.log("Parsed datum:", datum);

//                 if (!(datum instanceof Constr)) return false;

//                 // Safely extract fields
//                 const utxoPreId = datum.fields[0];
//                 const utxoRoadmapId = datum.fields[1];
//                 // console.log("Extracted fields:", utxoPreId, utxoRoadmapId);

//                 // Convert to text if they're strings/bytes
//                 const preIdText = typeof utxoPreId === 'string' ? toText(utxoPreId) : '';
//                 const roadmapIdText = typeof utxoRoadmapId === 'string' ? toText(utxoRoadmapId) : '';


//                 // console.log("Parsed preId:", preIdText);
//                 // console.log("Parsed roadmapId:", roadmapIdText);

//                 return preIdText === preId && roadmapIdText === roadmapId;

//             } catch (e) {
//                 console.error("Error parsing datum:", e);
//                 return false;
//             }


//             // return (

//             //     console.log("Parsed preId:", toText(datum.fields[0] as string)),
//             //     console.log("Parsed roadmapId:", toText(datum.fields[1] as string)),
//             //     toText(datum.fields[0] as string) === preId &&
//             //     toText(datum.fields[1] as string) === roadmapId
//             // );
//         });

//         // console.log("Matched UTXO:", matchedUtxo);
//         if (!matchedUtxo?.datum) {
//             throw new Error(
//                 `No matching roadmap found for preId: ${preId}, roadmapId: ${roadmapId}`
//             );
//         }
//         // console.log("Matched UTXO datum:", Data.from(matchedUtxo.datum));

//         const refiOldDatum = parseRoadmapDatum(Data.from(matchedUtxo.datum));
//         // console.log("refiOldDatum ", refiOldDatum);

//         const totalPlasticCredits = refiOldDatum.totalPlasticCredits;

//         // console.log("Total Plastic Credits:", totalPlasticCredits);

//         const newSoldCredits = refiOldDatum.soldPlasticCredits + soldPlasticCredit;
//         // console.log("New Sold Plastic Credits:", newSoldCredits);

//         // Calculate progress using integer math
//         const progress = (newSoldCredits * 10000n) / totalPlasticCredits;
//         // console.log("progress ", progress);

//         const newSentTokens = (progress * refiOldDatum.totalPlasticTokens) / 10000n;
//         const recoveredPlastic = (progress * refiOldDatum.totalPlastic) / 10000n
//         fromText(refiOldDatum.roadmapId), // roadmapId
//             fromText(refiOldDatum.roadmapName), // roadmapName
//             fromText(refiOldDatum.roadmapDescription), // roadmapDescription
//             BigInt(progress), // progress
//             refiOldDatum.adminsPkh, // adminsPkh
//             refiOldDatum.prePkh, // prePkh
//             refiOldDatum.preSkh, // preSkh
//             BigInt(refiOldDatum.totalPlasticCredits), // totalPlasticCredits
//             BigInt(newSoldCredits), // soldPlasticCredits
//             BigInt(refiOldDatum.totalPlasticTokens), // totalPlasticTokens
//             BigInt(newSentTokens), // sentPlasticTokens
//             BigInt(refiOldDatum.totalPlastic), // totalPlasticd8799f447072653148726f61646d61703152436c65616e436f617374204d697373696f6e5f5840466f6375736564206f6e2072656d6f76696e6720706c61737469632077617374652066726f6d20636f617374616c20726567696f6e7320616e6420737570706f581c7274696e67206c6f63616c2072656379636c696e6720756e6974732eff19012c9f581c421341eb0d9397b6a9685cba8825059d4392d6a6bf6ca21dcd1c9399ff581cb93e78824bcf5c34a62b2f573727b4bb8a1365ebd152bd6243ff8dc6581ca786470d2a2c8bc00ecaf662a64407364be25325f33d1cb9446b4bd718640319271019012c1864035818323032352d30362d30355430373a30313a35302e3935335aff

//             console.log("Updated Datum:", updatedDatum);

//         const refiRedeemer = Data.to(new Constr(0, [progress]));

//         // console.log("Refi Redeemer:", refiRedeemer);

//         const plastikToLock = (newSentTokens * 80n) / 100n;
//         // console.log("Plastik to Lock:", plastikToLock);

//         /////////////////// ---------- Lending Staking Reward Contract ---------- ///////////////////
//         // Fetch existing UTxO at the stake reward contract
//         const contractUTxOs = await lucid.utxosAt(contractAddress);
//         console.log("Contract UTxOs Stacking/Lending:", contractUTxOs);

//         // Check if contract has any UTxOs
//         if (contractUTxOs.length === 0) {
//             throw new Error("No contract UTxOs found - nothing to withdraw");
//         }

//         // Get the first contract UTxO (assuming single UTxO for simplicity)
//         const contractUTxO = contractUTxOs[0];

//         // console.log("Contract UTxO:", contractUTxO);

//         if (!contractUTxO.datum) {
//             throw new Error("Missing datum in contract UTxO");
//         }

//         // Parse the existing on-chain datum
//         const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
//         // console.log("currentDatum ", currentDatum);

//         // Check that only the on-chain adminPkh can call “AdminWithdraw”
//         if (!currentDatum.adminsPkh.includes(adminPkh)) {
//             throw new Error("Only the admin can withdraw funds");
//         }

//         // Check if contract has enough PLASTIK tokens to send to escrow if not admin will fund it
//         const contractPtBalance = contractUTxO.assets[ptAssetUnit] || 0n;

//         if (contractPtBalance < plastikToLock) {
//             throw new Error("Contract has insufficient PLASTIK tokens");
//         }

//         // Build the redeemer for AdminWithdraw action
//         const redeemer = buildLenderAction({
//             type: "FundPlastikToEscrow",
//             amount: plastikToLock,
//         });

//         // Distibute the USDM rewards among the lenders
//         ////// --------------------------/////////////
//         const rewardMicro = soldPlasticCredit * precisionFactor;

//         const newTotalReward = currentDatum.totalReward + rewardMicro;

//         // Update each lender’s rewardDebt proportionally
//         const updatedLenders: [string, [bigint, bigint]][] =
//             currentDatum.lenders.map(([pubKey, [balance, rewardDebt]]) => {
//                 // Keep rewardDebt as:(balance * newTotalReward) / totalPT
//                 const newRewardDebt = (balance * newTotalReward) / currentDatum.totalPT;
//                 return [pubKey, [balance, newRewardDebt]];
//             });

//         // Calculate remaining assets in the contract after withdrawal
//         const remainingAssets = { ...contractUTxO.assets };
//         console.log("Remaining Assets before withdrawal:", remainingAssets);

//         remainingAssets[ptAssetUnit] =
//             (remainingAssets[ptAssetUnit] || 0n) - plastikToLock;
//         // add the new total reward to the contract
//         remainingAssets[usdmAssetUnit] = newTotalReward;

//         // Now build the new datum (keeping adminPkh, totalPT, lenders unchanged):
//         const newDatum: LenderDatum = {
//             adminsPkh: currentDatum.adminsPkh,
//             totalPT: currentDatum.totalPT,
//             totalReward: newTotalReward,
//             lenders: updatedLenders,
//         };

//         const refiAssets: Assets = {
//             [ptAssetUnit]: (matchedUtxo.assets[ptAssetUnit] || 0n) + plastikToLock,
//             ...(usdmAssetUnit in matchedUtxo.assets
//                 ? { [usdmAssetUnit]: matchedUtxo.assets[usdmAssetUnit] || 0n }
//                 : {}),
//         };
//         console.dir(buildLenderDatum(newDatum), { depth: null });

//         // Build the transaction for Lender Contract
//         const lenderTx = await lucid
//             .newTx()
//             .collectFrom([contractUTxO], Data.to(redeemer)) // Collect from Lender Contract
//             .attach.Script(StackValidator)
//             .pay.ToContract(
//                 // Pay to Lender Contract
//                 StackContractAddress,
//                 { kind: "inline", value: Data.to(buildLenderDatum(newDatum)) },
//                 remainingAssets
//             )
//             .addSigner(adminAddress)
//             .complete();

//         // Build the transaction for Refi Contract
//         const refiTx = await lucid
//             .newTx()
//             .collectFrom([matchedUtxo], Data.to(refiRedeemer)) // Collect from Refi Contract
//             .attach.Script(StackValidator)
//             .pay.ToContract(
//                 // Pay to Refi Contract
//                 StackContractAddress,
//                 { kind: "inline", value: Data.to(updatedDatum) },
//                 refiAssets
//             )
//             .addSigner(adminAddress)
//             .complete();

//         return { lenderTx, refiTx };
//     } catch (error: any) {
//         console.error("AdminWithdraw error:", error.message);
//         throw error;
//     }
// }

// async function FundUSDM(
//   lucid: LucidEvolution,
//   returnAmount: bigint
// ): Promise<unknown> {
//   try {
//     // Get the wallet's public key hash of Admin
//     const adminPkh = await getPubKeyHash(lucid);

//     // Fetch existing UTxO at the contract
//     const contractUTxOs = await lucid.utxosAt(contractAddress);

//     // Check if contract has any UTxOs
//     if (contractUTxOs.length === 0) {
//       throw new Error("No contract UTxOs found - nothing to return");
//     }

//     // Get the first contract UTxO (assuming single UTxO for simplicity)
//     const contractUTxO = contractUTxOs[0];
//     if (!contractUTxO.datum) {
//       throw new Error("Missing datum in contract UTxO");
//     }

//     // Parse the existing on-chain datum
//     const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));

//     // Check that only the on‐chain adminPkh can call “AdminReturn”
//     if (currentDatum.adminPkh !== adminPkh) {
//       throw new Error("Only the admin can return funds");
//     }
//     // Build the redeemer for AdminReturn action
//     const redeemer = buildLenderAction({
//       type: "AdminReturn",
//       amount: returnAmount,
//     });

//     // Calculate remaining assets in the contract after returning
//     const remainingAssets = { ...contractUTxO.assets };
//     remainingAssets[ptAssetUnit] =
//       (remainingAssets[ptAssetUnit] || 0n) + returnAmount;

//     // Build the transaction
//     return lucid
//       .newTx()
//       .collectFrom([contractUTxO], Data.to(redeemer))
//       .attach.Script(validator)
//       .pay.ToContract(
//         contractAddress,
//         { kind: "inline", value: Data.to(buildLenderDatum(currentDatum)) },
//         remainingAssets
//       )
//       .complete();
//   } catch (error: any) {
//     console.error("AdminReturn error:", error.message);
//     throw error;
//   }
// }
async function FundPlastik(
    lucid: LucidEvolution,
    preId: string,
    roadmapId: string,
    soldPlasticCredit: bigint
) {
    try {
        // Get the wallet's public key hash of Admin
        const adminPkh = await getPubKeyHash(lucid);
        const adminAddress = await lucid.wallet().address();

        // 2. Find matching UTXO
        const utxos = await lucid.utxosAt(StackContractAddress);
        const matchedUtxo = utxos.find((utxo) => {
            if (!utxo.datum) return false;
            const datum = Data.from(utxo.datum) as Constr<Data>;
            return (
                toText(datum.fields[0] as string) === preId &&
                toText(datum.fields[1] as string) === roadmapId
            );
        });
        if (!matchedUtxo?.datum) {
            throw new Error(
                `No matching roadmap found for preId: ${preId}, roadmapId: ${roadmapId}`
            );
        }
        // console.log("Matched UTXO datum:", Data.from(matchedUtxo.datum));

        const refiOldDatum = parseRoadmapDatum(Data.from(matchedUtxo.datum));
        // console.log(refiOldDatum);

        const totalPlasticCredits = refiOldDatum.totalPlasticCredits;
        const newSoldCredits = refiOldDatum.soldPlasticCredits + soldPlasticCredit;

        // Calculate progress using integer math
        const progress = (newSoldCredits * 10000n) / totalPlasticCredits;
        console.log(progress);

        const newSentTokens = (progress * refiOldDatum.totalPlasticTokens) / 10000n;
        const recoveredPlastic = (progress * refiOldDatum.totalPlastic) / 10000n;

        // 4. Build new datum
        const updatedDatum = new Constr(0, [
            fromText(refiOldDatum.preId), // preId
            fromText(refiOldDatum.roadmapId), // roadmapId
            fromText(refiOldDatum.roadmapName), // roadmapName
            fromText(refiOldDatum.roadmapDescription), // roadmapDescription
            BigInt(progress), // progress
            refiOldDatum.adminsPkh, // adminsPkh
            refiOldDatum.prePkh, // prePkh
            refiOldDatum.preSkh, // preSkh
            BigInt(refiOldDatum.totalPlasticCredits), // totalPlasticCredits
            BigInt(newSoldCredits), // soldPlasticCredits
            BigInt(refiOldDatum.totalPlasticTokens), // totalPlasticTokens
            BigInt(newSentTokens), // sentPlasticTokens
            BigInt(refiOldDatum.totalPlastic), // totalPlastic
            BigInt(recoveredPlastic), // recoverPlastic
            fromText(refiOldDatum.createdAt), // createdAt
        ]);

        // console.log("Updated Datum:", updatedDatum);

        const refiRedeemer = Data.to(new Constr(0, [progress]));
        const plastikToLock = (newSentTokens * 80n) / 100n;

        /////////////////// ---------- Lending Staking Reward Contract ---------- ///////////////////
        // Fetch existing UTxO at the stake reward contract
        const contractUTxOs = await lucid.utxosAt(StackContractAddress);

        // Check if contract has any UTxOs
        if (contractUTxOs.length === 0) {
            throw new Error("No contract UTxOs found - nothing to withdraw");
        }

        // Get the first contract UTxO (assuming single UTxO for simplicity)
        const contractUTxO = contractUTxOs[0];
        if (!contractUTxO.datum) {
            throw new Error("Missing datum in contract UTxO");
        }

        // Parse the existing on-chain datum
        const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
        console.log("current Datum ", currentDatum);

        // Check that only the on-chain adminPkh can call “AdminWithdraw”
        if (!currentDatum.adminsPkh.includes(adminPkh)) {
            throw new Error("Only the admin can withdraw funds");
        }

        // Check if contract has enough PLASTIK tokens to send to escrow if not admin will fund it
        const contractPtBalance = contractUTxO.assets[ptAssetUnit] || 0n;

        if (contractPtBalance < plastikToLock) {
            throw new Error("Contract has insufficient PLASTIK tokens");
        }

        // Build the redeemer for AdminWithdraw action
        const redeemer = buildLenderAction({
            type: "FundPlastikToEscrow",
            amount: plastikToLock,
        });

        // Distibute the USDM rewards among the lenders
        ////// --------------------------/////////////
        const rewardMicro = soldPlasticCredit * precisionFactor;

        const newTotalReward = currentDatum.totalReward + rewardMicro;

        // Update each lender’s rewardDebt proportionally
        const updatedLenders: [string, [bigint, bigint]][] =
            currentDatum.lenders.map(([pubKey, [balance, rewardDebt]]) => {
                // Keep rewardDebt as:(balance * newTotalReward) / totalPT
                const newRewardDebt = (balance * newTotalReward) / currentDatum.totalPT;
                return [pubKey, [balance, newRewardDebt]];
            });

        // Calculate remaining assets in the contract after withdrawal
        const remainingAssets = { ...contractUTxO.assets };
        remainingAssets[ptAssetUnit] =
            (remainingAssets[ptAssetUnit] || 0n) - plastikToLock;
        // add the new total reward to the contract
        remainingAssets[usdmAssetUnit] = newTotalReward;

        // Now build the new datum (keeping adminPkh, totalPT, lenders unchanged):
        const newDatum: LenderDatum = {
            adminsPkh: currentDatum.adminsPkh,
            totalPT: currentDatum.totalPT,
            totalReward: newTotalReward,
            lenders: updatedLenders,
        };

        const refiAssets: Assets = {
            [ptAssetUnit]: (matchedUtxo.assets[ptAssetUnit] || 0n) + plastikToLock,
            ...(usdmAssetUnit in matchedUtxo.assets
                ? { [usdmAssetUnit]: matchedUtxo.assets[usdmAssetUnit] || 0n }
                : {}),
        };
        console.dir(buildLenderDatum(newDatum), { depth: null });

        // Build the transaction
        return (
            lucid
                .newTx()
                .collectFrom([matchedUtxo], Data.to(refiRedeemer)) // Collect from Refi Contract
                .attach.Script(StackValidator)
                // .collectFrom([contractUTxO], Data.to(redeemer)) // Collect from Lender Contract
                // .attach.Script(validator)
                // .pay.ToContract(
                //   // Pay to Lender Contract
                //   contractAddress,
                //   { kind: "inline", value: Data.to(buildLenderDatum(newDatum)) },
                //   remainingAssets
                // )
                .pay.ToContract(
                    // Pay to Refi Contract
                    StackContractAddress,
                    { kind: "inline", value: Data.to(updatedDatum) },
                    refiAssets
                )
                .addSigner(adminAddress)
                .complete()
        );
    } catch (error: any) {
        console.error("AdminWithdraw error:", error.message);
        throw error;
    }
}
const getScriptUtxos = async (lucid: LucidEvolution, address: string) => {
    const utxos = await lucid.utxosAt(address);
    console.log("Script UTxOs:", utxos);
    utxos.forEach((utxo) => {
        if (!utxo.datum) return;
        const parsed = Data.from(utxo.datum) as Constr<unknown>;
        console.dir(parsed, { depth: null });
    });
};

const lucid = await initLucid();

// const seed = "nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute"
// const adminSeed = lucid.selectWallet.fromSeed("nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute");
lucid.selectWallet.fromSeed("nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute");

// const adminSeed = process.env.ADMIN_SEED
// console.log(adminSeed);


// lucid.selectWallet.fromSeed(adminSeed);
const wallet = lucid.wallet().address();

console.log("Wallet Address ", wallet);


// 1.Example usage of deposit function
const tx = await deposit(lucid, 1n);
console.log("msg\n\n\n", tx);

if (!tx) {
    throw new Error("Failed to build deposit transaction.");
}
const signed = await tx.sign.withWallet().complete();
const txHash = await signed.submit();
console.log("Deposit tx submitted:", txHash);

// 2.Example usage of withdraw function
// const withdrawTx = await withdraw(lucid, 100n);
// if (!withdrawTx) {
//     throw new Error("Failed to build withdraw transaction.");
// }
// const signedWithdraw = await withdrawTx.sign.withWallet().complete();
// const withdrawTxHash = await signedWithdraw.submit();
// console.log("Withdraw tx submitted:", withdrawTxHash);

// 3.Example usage of Redeem Reward function
// const redeemRewardTx = await redeemReward(lucid);
// if (!redeemRewardTx) {
//     throw new Error("Failed to build withdraw transaction.");
// }
// const signedRedeemReward = await redeemRewardTx.sign.withWallet().complete();
// const redeemRewardTxHash = await signedRedeemReward.submit();
// console.log("redeemRewardTx tx submitted:", redeemRewardTxHash);

// 4.Example usage of Initialize Rodmap function
// const initializeRoadmapTx = await initializeRoadmap(
//     lucid,
//     "pre1",
//     "roadmap1",
//     "CleanCoast Mission",
//     "Focused on removing plastic waste from coastal regions and supporting local recycling units.",
//     "b93e78824bcf5c34a62b2f573727b4bb8a1365ebd152bd6243ff8dc6",
//     "a786470d2a2c8bc00ecaf662a64407364be25325f33d1cb9446b4bd7",
//     100n,
//     10000n,
//     100n
// );
// if (!initializeRoadmapTx) {
//     throw new Error("Failed to build withdraw transaction.");
// }
// const signedinitializeRoadmap = await initializeRoadmapTx.sign
//     .withWallet()
//     .complete();
// const initializeRoadmapTxHash = await signedinitializeRoadmap.submit();
// console.log("initializeRoadmap tx submitted:", initializeRoadmapTxHash);

// 5.Example usage of Fund Plastik function
// const tx = await FundPlastik(lucid, "pre1", "roadmap1", 1n);
// if (!tx) {
//     throw new Error("Failed to build deposit transaction.");
// }
// const signed = await tx.sign.withWallet().complete();
// const txHash = await signed.submit();
// console.log("FundPlastik tx submitted:", txHash);

// 6.Example usage of getScriptUtxos function
// getScriptUtxos(lucid, refiContractAddress);
// getScriptUtxos(lucid, StackContractAddress);
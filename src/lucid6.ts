import { Blockfrost, Lucid, Validator, validatorToAddress, Data, datumToHash, getAddressDetails, Kind } from '@lucid-evolution/lucid'
import dotenv from 'dotenv';

dotenv.config();

const seed: string = process.env.ADMIN_SEED!;
const cbor: string = process.env.CBOR!;

const CBOR: Validator = {
    type: "PlutusV2",
    script: cbor,
};

// Method 1: Using Lucid Evolution's Data construction (Recommended)
const createLenderDatumV1 = (
    adminPkh: string,
    totalPT: bigint,
    totalReward: bigint,
    lenders: [string, [bigint, bigint]][]
) => {
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
const createLenderDatumV2 = (
    adminPkh: string,
    totalPT: bigint,
    totalReward: bigint,
    lenders: [string, [bigint, bigint]][]
) => {
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
            totalPT,  // Direct bigint
            totalReward, // Direct bigint
            lenderEntries
        ]
    };
};

async function main() {
    try {
        // Initialize Lucid with Blockfrost
        const lucid = await Lucid(
            new Blockfrost(
                "https://cardano-preprod.blockfrost.io/api/v0",
                "preprodaObP3ncIxrfcxDhiWCDVYdsV6974tS4z"
            ),
            "Preprod"
        );

        const scriptAddr = validatorToAddress("Preprod", CBOR);
        console.log("Script Address:", scriptAddr);

        lucid.selectWallet.fromSeed(seed);
        const adminWallet = await lucid.wallet().address();
        console.log("Wallet Address:", adminWallet);

        const { paymentCredential } = getAddressDetails(adminWallet);
        const adminPkh = paymentCredential?.hash;
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
            const datum = createLenderDatumV1(
                adminPkh,

                BigInt(1000000),
                BigInt(50000),
                [
                    [adminPkh, [BigInt(0), BigInt(0)]],
                ]
            );
            // console.log("Datum (Method 1):", datum);

            const cborDatum = Data.to(datum);
            console.log("Datum CBOR:", cborDatum);


            const tx = await lucid.newTx()
                .pay.ToAddressWithData(scriptAddr, { kind: "inline", value: cborDatum }, { lovelace: BigInt(1000000) })
                .complete();


            const signedTx = await tx.sign.withWallet().complete();
            const txHash = await signedTx.submit();
            console.log("Transaction Hash:", txHash);


        } catch (error) {

            console.log("Method 1 Error:", error);
        }


    } catch (error) {
        console.error("Error in main:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            // console.error("Error stack:", error.stack);
        }
    }
}

main();
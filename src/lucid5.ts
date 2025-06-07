import { Blockfrost, Lucid, Validator, validatorToAddress, Data, datumToHash, getAddressDetails } from '@lucid-evolution/lucid'

import dotenv from 'dotenv';

dotenv.config();

const seed: string = process.env.ADMIN_SEED!;
const cbor: string = process.env.CBOR!;

const CBOR: Validator = {
    type: "PlutusV2",
    script: cbor,
};


const createLenderDatum = (
    adminPkh: string,
    totalPT: bigint,
    totalReward: bigint,
    lenders: [string, [bigint, bigint]][]
): any => {
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

async function main() {
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
    const adminPkh: any = paymentCredential?.hash;
    console.log("Payment Credentials: ", paymentCredential);
    console.log("Admin Payment Credential:", adminPkh);
    // Convert the payment credential to a hex string

    console.log("working upto here");
    const datum = createLenderDatum(
        adminPkh,
        BigInt(1000000),
        BigInt(50000),
        [
            [adminPkh, [BigInt(0), BigInt(0)]],
        ]
    );

    console.log("Datum:", datum);
    const cborDatum = Data.to(datum);
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

}

main()
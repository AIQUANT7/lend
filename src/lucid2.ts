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
    getAddressDetails

} from "@lucid-evolution/lucid";


// import { getAddressDetails } from 'lucid-cardano'
import dotenv from "dotenv";
dotenv.config();

const Script: Validator = {
    type: "PlutusV2",
    script: process.env.CBOR!,
};

// Datum type matching on-chain LenderDatum
// Constr index 0 wraps the record: [totalPT, rewardPerPT, list of (pkh, (balance, rewardDebt))]
function lenderDatum(
    totalPT: bigint,
    rewardPerPT: bigint,
    lenders: [string, [bigint, bigint]][]
) {
    const entries = lenders.map(
        ([pkhHex, [balance, rewardDebt]]) =>
            new Constr(0, [fromText(pkhHex), new Constr(0, [balance, rewardDebt])])
    );
    return new Constr(0, [totalPT, rewardPerPT, entries]);
}

// Redeemer for Deposit

const intiLucid = async () => {
    const lucid = await Lucid(
        new Blockfrost(process.env.API_URL!, process.env.API_KEY!),
        "Preprod"
    );
    return lucid;
};

async function initializePool() {
    try {
        // Select wallet from seed phrase
        const lucid = await intiLucid();
        lucid.selectWallet.fromSeed(
            "nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute"
        );

        const walletAddress = await lucid.wallet().address();
        console.log("wallet addrss ", walletAddress);

        const utxos = await lucid.utxosAt(walletAddress)
        // console.log("utxos ", utxos);

        // Address of the validator script
        const scriptAddress = await validatorToAddress("Preprod", Script);
        console.log("Script address ", scriptAddress);

        // For simplicity, assume first deposit (empty pool)
        const initialDatum = Data.to(lenderDatum(BigInt(0), BigInt(0), []));
        console.log("initial Datum ", initialDatum);

     
        // Build transaction to pay PT tokens to the script
        const tx = await lucid
            .newTx()
            .pay.ToContract(
                scriptAddress,
                { kind: "inline", value: initialDatum },
                { lovelace: BigInt(5000000) }
            )
            .complete();

        // Sign and submit
        const signed = await tx.sign.withWallet().complete();
        const txHash = await signed.submit();
        console.log("Submitted deposit tx:", txHash);
    } catch (error) {
        console.log(error);
    }
}

// initializePool();

const pt =
    "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7504c415354494b";

const usdm = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab75553444d";

// Redeemer for Deposit
const depositRedeemer = Data.to(new Constr(0, []));

// ... existing imports and setup ...

async function depositPT(amount: bigint) {
    const lucid = await intiLucid();

    lucid.selectWallet.fromSeed(
        "nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute"
    );

    // Get current wallet's PKH
    const address = await lucid.wallet().address();
    // console.log("admin wallet address ", address);


    const { paymentCredential } = await getAddressDetails(address)
    if (!paymentCredential?.hash) throw new Error("No payment credential found");
    const pkh = paymentCredential.hash;
    // console.log("payment credentials ", paymentCredential);
    // console.log("public key hash ", pkh);


    const scriptAddr = await validatorToAddress("Preprod", Script);
    const utxos = await lucid.utxosAt(scriptAddr);
    const poolUtxo = utxos[0];
    if (!poolUtxo) throw Error("No pool UTxO found");
    // console.log("pool utxos ", poolUtxo);

    // Find UTxO with sufficient PT tokens
    const walletUtxos = await lucid.utxosAt(address);

    // console.log("WalletUtxos ", walletUtxos);

    const ptUtxo = walletUtxos.find(
        (utxo) => utxo.assets[pt] && utxo.assets[pt] >= amount
    );

    // console.log("ptUtxo ", ptUtxo);

    if (!ptUtxo) throw new Error("Insufficient PT tokens");

    // Decode existing datum
    const d = Data.from(poolUtxo.datum!) as Constr<Data>;
    let totalPT = d.fields[0] as bigint;
    let rewardPerPT = d.fields[1] as bigint;
    let lenders: [string, [bigint, bigint]][] = [];
    for (const e of d.fields[2] as Data[]) {
        const owner = (e as any).fields[0] as string;
        const rec = (e as any).fields[1] as Constr<Data>;
        lenders.push([owner, [rec.fields[0] as bigint, rec.fields[1] as bigint]]);
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
    const newAssets = {
        ...poolUtxo.assets, // Preserve existing assets
        [pt]: (poolUtxo.assets[pt] || BigInt(0)) + amount,
    };

    // console.log("newAssets ", newAssets);


    // // Fixed redeemer
    const depositRedeemer = Data.to(new Constr(0, []));

    const tx = await lucid
        .newTx()
        .attach.SpendingValidator(Script)
        .collectFrom([ptUtxo], depositRedeemer)
        .collectFrom([ptUtxo])
        .addSigner(address)
        .pay.ToContract(
            scriptAddr,
            { kind: "inline", value: Data.to(newDatum) },
            newAssets
        )
        .complete();
    // console.log("tx ", tx);
    const signedTx = await tx.sign.withWallet().complete()
    // console.log("signedTx ", signedTx);


    const txHash = await signedTx.submit()

    console.log("txHash ", txHash);

}

// Example call
depositPT(BigInt(1000));

const getScriptUtxos = async () => {
    const lucid = await intiLucid();
    const address = validatorToAddress("Preprod", Script);

    const utxos = await lucid.utxosAt(address);
    // console.log("Script utxos ", utxos);
};

getScriptUtxos();

const getUnitUtxos = async () => {
    const lucid = await intiLucid();
    // Select wallet from seed phrase
    lucid.selectWallet.fromSeed(
        "nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute"
    );
    const address = await lucid.wallet().address();
    const myUtxos = await lucid.utxosAtWithUnit(address, pt);
    console.log("⛏ my PT-UTxOs:", myUtxos);
};

// getUnitUtxos();
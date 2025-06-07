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
    return lucid;
};

const validator: Validator = {
    type: "PlutusV2",
    script: process.env.CBOR2!,
};


const contractAddress = await initLucid().then((lucid) =>
    validatorToAddress("Preprod", validator)
);
console.log("Contract Address:", contractAddress);
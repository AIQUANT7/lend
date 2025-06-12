import { Lucid, Blockfrost, validatorToAddress, } from "@lucid-evolution/lucid";
import dotenv from "dotenv";
dotenv.config();
const initLucid = async () => {
    const lucid = await Lucid(new Blockfrost(process.env.API_URL, process.env.API_KEY), "Preprod");
    return lucid;
};
const validator = {
    type: "PlutusV2",
    script: process.env.CBOR2,
};
const contractAddress = await initLucid().then((lucid) => validatorToAddress("Preprod", validator));
console.log("Contract Address:", contractAddress);

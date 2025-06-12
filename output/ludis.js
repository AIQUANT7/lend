import { Blockfrost, Lucid, validatorToAddress, fromText, Data, paymentCredentialOf, scriptFromNative, mintingPolicyToId, } from "@lucid-evolution/lucid";
import dotenv from "dotenv";
dotenv.config();
const api = process.env.API_URL;
const api_key = process.env.API_KEY;
const network = process.env.NETWORK;
const admin_seed = process.env.ADMIN_SEED;
const cbor = process.env.CBOR;
async function myLucid() {
    const lucid = await Lucid(new Blockfrost(api, api_key), "Preprod");
    const seed = admin_seed;
    lucid.selectWallet.fromSeed(seed);
    const adminWallet = await lucid.wallet().address();
    console.log("admin wallet ", adminWallet);
    const spend_val = {
        type: "PlutusV2",
        script: cbor,
    };
    const scriptAddress = validatorToAddress("Preprod", spend_val);
    console.log("script address ", scriptAddress);
    const datumString = Data.to("2342525235");
    // console.log("datumString", datumString);
    // Token structure for minting
    const mintingPolicy = scriptFromNative({
        type: "all",
        scripts: [
            { type: "sig", keyHash: paymentCredentialOf(adminWallet).hash },
        ],
    });
    console.log("MintingPolicy ", mintingPolicy);
    const policyId = mintingPolicyToId(mintingPolicy);
    console.log("PolicyId ", policyId);
    // Define NFT metadata
    const assetName = "MyUniqueNFT";
    const unit = policyId + fromText(assetName);
    const metadata = {
        [unit]: {
            name: "My Unique NFT",
            image: "https://bafybeibreijdhwtcc3ij6ukr5v2i74z6gukrtubg6yd4u76efnjb5ccpv4.ipfs.dweb.link/",
            description: "This is my first NFT minted with Lucid",
            // Add any additional metadata fields
            mediaType: "image/webp",
            files: [{
                    name: "MyNFT",
                    mediaType: "image/webp",
                    src: "https://bafybeibreijdhwtcc3ij6ukr5v2i74z6gukrtubg6yd4u76efnjb5ccpv4.ipfs.dweb.link/"
                }]
        }
    };
    // console.log("metadata ", metadata);
    const tx = await lucid
        .newTx()
        // .pay.ToAddress(scriptAddress, { lovelace: BigInt(5000000) })
        // .attachMetadata(1, { msg: "Wen Midgard?" })
        // .pay.ToAddress(scriptAddress, { ["e8f329da44fb66d033d26a566b0f9f743493b0cf18458c051ac44261" + fromText("USDM")]: BigInt(100000) })
        // .pay.ToAddressWithData(scriptAddress, { kind: "inline", value: datumString }, { lovelace: BigInt(5000000) })
        // .pay.ToAddressWithData(scriptAddress, { kind: "hash", value: Data.to("232e3e33434") },
        //     { lovelace: BigInt(4000000) })
        // .mintAssets({ [policyId + fromText("RAVITOKEN")]: BigInt(1000000000) })
        // .pay.ToAddress(adminWallet, { [policyId + fromText("RAVITOKEN")]: BigInt(1000000000) })
        // .attach.MintingPolicy(mintingPolicy)
        .mintAssets({ [unit]: BigInt(10) })
        .pay.ToAddress(adminWallet, { [unit]: BigInt(10) })
        .attach.MintingPolicy(mintingPolicy)
        .complete();
    // console.log("tx ", tx);
    const signedTx = await tx.sign.withWallet().complete();
    console.log("signedTx ", signedTx);
    const txHash = await signedTx.submit();
    console.log("txHash ", txHash);
}
myLucid();

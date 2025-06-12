import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Lucid, Blockfrost } from "@lucid-evolution/lucid";
import { deposit, withdraw, redeemReward, FundPlastik, initializeRoadmap } from "./lend";
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 8081;
app.use(cors());
// import { Lucid, Blockfrost } from "@lucid-evolution/lucid";
// then initialize it like this:
const initLucid = async () => {
    const lucid = await Lucid(new Blockfrost(process.env.API_URL, process.env.API_KEY), "Preprod");
    // console.log(lucid);
    return lucid;
};
const lucid = await initLucid();
const adminSeed = process.env.MNEMONIC;
console.log(adminSeed);
lucid.selectWallet.fromSeed(adminSeed);
const wallet = lucid.wallet().address();
console.log("Wallet-Address ", wallet);
app.get("/", (req, res) => {
    res.send("Hello World");
});
app.post("/deposit", async (req, res, next) => {
    try {
        const { amount } = req.body;
        console.log("Amount ", amount);
        if (!amount)
            return res.status(400).json({ error: "Missing amount" });
        const tx = await deposit(lucid, BigInt(amount));
        console.log("tx ", tx);
        const signedTx = await tx.sign.withWallet().complete();
        console.log("SignedTx ", signedTx);
        const txHash = await signedTx.submit();
        console.log("txHash ", txHash);
        return res.json({ msg: "Deposit submitted", txHash });
    }
    catch (error) {
        console.error("Deposit error:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/withdraw", async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ error: "Missing amount" });
        }
        // Build the transaction using your withdraw function
        const tx = await withdraw(lucid, BigInt(amount));
        // Sign and submit
        const signedTx = await tx.sign.withWallet().complete();
        const txHash = await signedTx.submit();
        console.log("Withdraw tx hash:", txHash);
        return res.json({ msg: "Withdraw submitted", txHash });
    }
    catch (error) {
        console.error("Withdraw error:", error.message);
        res.status(500).json({ error: error.message });
    }
});
app.post("/initializeRoadmap", async (req, res) => {
    try {
        const { preId, roadmapId, roadmapName, roadmapDescription, prePkh, preSkh, totalPlasticCredits, totalPlasticTokens, totalPlastic, } = req.body;
        if (!preId ||
            !roadmapId ||
            !roadmapName ||
            !roadmapDescription ||
            !prePkh ||
            !preSkh ||
            totalPlasticCredits == null ||
            totalPlasticTokens == null ||
            totalPlastic == null) {
            return res.status(400).json({ error: "Missing required fields in request body" });
        }
        // 3. Call your initializeRoadmap function
        const tx = await initializeRoadmap(lucid, preId, roadmapId, roadmapName, roadmapDescription, prePkh, preSkh, BigInt(totalPlasticCredits), BigInt(totalPlasticTokens), BigInt(totalPlastic));
        // 4. Sign and submit transaction
        const signedTx = await tx.sign.withWallet().complete();
        const txHash = await signedTx.submit();
        console.log("initializeRoadmap tx submitted:", txHash);
        res.json({ message: "Roadmap initialized", txHash });
    }
    catch (error) {
        console.error("Initialize Roadmap Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});
;
app.get("/redeemReward", async (req, res) => {
    try {
        // Step 3: Build transaction with redeemReward
        const tx = await redeemReward(lucid);
        if (!tx) {
            return res.status(400).json({ error: "Failed to build redeem transaction." });
        }
        // Step 4: Sign and submit the transaction
        const signedTx = await tx.sign.withWallet().complete();
        const txHash = await signedTx.submit();
        console.log("Redeem reward tx submitted:", txHash);
        res.json({ message: "Reward redeemed successfully", txHash });
    }
    catch (error) {
        console.error("Redeem reward error:", error.message);
        res.status(500).json({ error: error.message });
    }
});
app.post("/fundPlastik", async (req, res) => {
    try {
        const { preId, roadmapId, soldPlasticCredit } = req.body;
        if (!preId || !roadmapId || !soldPlasticCredit) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // Step 3: Call the FundPlastik function
        const tx = await FundPlastik(lucid, preId, roadmapId, BigInt(soldPlasticCredit));
        if (!tx) {
            return res.status(500).json({ error: "Failed to build FundPlastik transaction." });
        }
        // Step 4: Sign and submit the transaction
        const signedTx = await tx.sign.withWallet().complete();
        const txHash = await signedTx.submit();
        console.log("FundPlastik transaction submitted:", txHash);
        res.json({ message: "Funded Plastik successfully", txHash });
    }
    catch (err) {
        console.error("FundPlastik error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
app.get("/fundUsdm", (req, res) => {
    res.send("fundUsdm Page");
});
app.listen(port, () => console.log(`server is listening on port ${port}`));

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { deposit, getPubKeyHash, initializeRoadmap } from "./lend";
import { Lucid, Blockfrost } from "@lucid-evolution/lucid";

dotenv.config();

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

async function initLucid() {
    return await Lucid(
        new Blockfrost(process.env.API_URL!, process.env.API_KEY!),
        "Preprod"
    );
}

// Ping Test
app.get("/", (req, res) => {
    res.send("Plutus backend running");
});

// Deposit Endpoint
app.post("/deposit", async (req, res) => {
    const { amount } = req.body;

    if (!amount || isNaN(Number(amount))) {
        return res.status(400).json({ error: "Amount must be a valid bigint number" });
    }

    try {
        const lucid = await initLucid();

        const tx = await deposit(lucid, BigInt(amount));
        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();

        res.json({ txHash });
    } catch (err) {
        console.error("Error in /deposit:", err);
        res.status(500).json({ error: "Failed to process deposit", message: err instanceof Error ? err.message : String(err) });
    }
});

// Initialize Roadmap
app.post("/roadmap/init", async (req, res) => {
    const {
        preId,
        roadmapId,
        roadmapName,
        roadmapDescription,
        prePkh,
        preSkh,
        totalPlasticCredits,
        totalPlasticTokens,
        totalPlastic
    } = req.body;

    try {
        const lucid = await initLucid();

        const tx = await initializeRoadmap(
            lucid,
            preId,
            roadmapId,
            roadmapName,
            roadmapDescription,
            prePkh,
            preSkh,
            BigInt(totalPlasticCredits),
            BigInt(totalPlasticTokens),
            BigInt(totalPlastic)
        );

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();

        res.json({ txHash });
    } catch (err) {
        console.error("Error in /roadmap/init:", err);
        res.status(500).json({ error: "Failed to initialize roadmap", message: err instanceof Error ? err.message : String(err) });
    }
});

app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
});

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Recommendation API route
  app.post("/api/recommend-sl", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is missing." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const { capital, entryPrice, stopLossPrice, takeProfitPrice, isLong } = req.body;

      if (!capital || (!entryPrice && !stopLossPrice && !takeProfitPrice)) {
          return res.status(400).json({ error: "Missing required parameters." });
      }

      const prompt = `作为一个专业的加密货币/股票交易员。用户目前的账户本金是 $${capital}。
      已知以下交易参数（如果有些为空则表示用户还没填）：
      - 进场价格 (Entry): ${entryPrice || "未填"}
      - 止损价格 (Stop Loss): ${stopLossPrice || "未填"}
      - 预期止盈 (Take Profit): ${takeProfitPrice || "未填"}
      
      请根据以上信息，为用户推荐一个“最佳的固定止损金额（Risk Amount）”，要求能提供一个高效且合理的盈亏比（Risk/Reward Ratio，比如至少1:2或1:3的潜在空间），并确保风险金额在总本金的合理区间内（通常是1%到3%，最多不超过5%，特殊情况除外）。
      
      请返回一个 JSON 对象，包含：
      1. recommendedRiskAmount: 数字类型，你推荐的固定止损金额（单位美元）
      2. explanation: 字符串类型，简短解释为什么推荐这个金额（包含考虑到的盈亏比和资金管理原则，约50-80字）`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedRiskAmount: {
                type: Type.NUMBER,
                description: "Recommended risk amount in dollars",
              },
              explanation: {
                type: Type.STRING,
                description: "Brief explanation of why this amount is recommended based on RR ratio and risk management.",
              },
            },
            required: ["recommendedRiskAmount", "explanation"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No text generated from model.");
      }

      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

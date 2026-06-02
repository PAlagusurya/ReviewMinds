import express from "express";
import { config } from "dotenv";
import { webhookRouter } from "./webhook";
import { logger } from "./logger";

config();

const app = express();
const PORT = Number(process.env.PORT ?? 3002);

// CRITICAL: raw body on webhook route only
// express.json() destroys the raw buffer needed for HMAC validation
app.use(
  "/webhooks/github",
  express.raw({ type: "application/json" }),
  webhookRouter,
);

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "spark" });
});

app.listen(PORT, () => {
  logger.log(`Spark running on port ${PORT}`);
  logger.log("Waiting for GitHub webhook events...");
});

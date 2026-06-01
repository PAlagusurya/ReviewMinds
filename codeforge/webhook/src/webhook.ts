import { Router, Request, Response } from "express";
import { validateSignature } from "./hmac";
import { enqueueAnalysis } from "./queue";
import { logger } from "./logger";

export const webhookRouter = Router();

const HANDLED_ACTIONS = new Set(["opened", "synchronize"]);

interface GitHubPRPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    head: { sha: string };
    base: { ref: string };
    user: { login: string };
  };
  repository: {
    full_name: string;
  };
  installation: {
    id: number;
  };
}

webhookRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const event = req.headers["x-github-event"] as string | undefined;
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";

  // 1. validate HMAC — before touching payload
  if (!validateSignature(req.body as Buffer, signature, secret)) {
    logger.warn("Invalid signature — request rejected");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // 2. only handle pull_request events
  if (event !== "pull_request") {
    logger.log(`Ignored event: ${event}`);
    res.status(200).json({ message: "Event ignored" });
    return;
  }

  // 3. parse raw body now that signature is verified
  const payload = JSON.parse(
    (req.body as Buffer).toString(),
  ) as GitHubPRPayload;

  // 4. only handle opened and synchronize
  if (!HANDLED_ACTIONS.has(payload.action)) {
    logger.log(`Ignored action: ${payload.action}`);
    res.status(200).json({ message: "Action ignored" });
    return;
  }

  // 5. return 200 immediately — GitHub times out after 10 seconds
  res.status(200).json({ message: "Accepted" });

  // 6. enqueue — after response is sent
  try {
    await enqueueAnalysis({
      prNumber: payload.pull_request.number,
      repoFullName: payload.repository.full_name,
      headSha: payload.pull_request.head.sha,
      baseBranch: payload.pull_request.base.ref,
      title: payload.pull_request.title,
      author: payload.pull_request.user.login,
      installationId: payload.installation.id,
    });

    logger.log(
      `Enqueued PR #${payload.pull_request.number} from ${payload.repository.full_name}`,
    );
  } catch (error) {
    logger.error("Failed to enqueue job", error);
  }
});

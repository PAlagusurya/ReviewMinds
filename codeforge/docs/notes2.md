# CodeForge — Day 4: Spark

## What is Spark?

Spark is the webhook receiver. It sits between GitHub and Backend:

```
GitHub App
  → smee.io (dev tunnel)
    → Spark :3002
        → validate HMAC
        → enqueue job
          → Redis (BullMQ)
            → Backend
              → PrAnalysisProcessor
```

---

## Two separate GitHub integrations

```
Day 2 GitHub OAuth App  → user login
Day 4 GitHub App        → webhooks + PR access
```

They coexist. Never mix their credentials.

---

## File structure

```
spark/
├── src/
│   ├── app.ts        ← entry point, boots Express
│   ├── webhook.ts    ← orchestrates validation and enqueue
│   ├── hmac.ts       ← validates GitHub signature
│   ├── queue.ts      ← pushes jobs into Redis
│   └── logger.ts     ← structured console output
├── .env
├── package.json
└── tsconfig.json
```

---

## Files

### `logger.ts`

Thin wrapper around `console.log/warn/error`. Prepends timestamp and `[Spark]` to every line.

```typescript
export const logger = {
  log: (message) => console.log(`${timestamp} [Spark] ${message}`),
  warn: (message) => console.warn(`${timestamp} [Spark] WARN ${message}`),
  error: (message, error?) =>
    console.error(`${timestamp} [Spark] ERROR ${message}`, error),
};
```

---

### `hmac.ts`

#### What is HMAC?

Hash-based Message Authentication Code — verifies a request came from GitHub and wasn't tampered with.

#### What is SHA256?

A mathematical algorithm that converts any input into a fixed 64-character fingerprint. One character change = completely different output. Cannot be reversed.

#### How GitHub webhook validation works

GitHub and Spark share the same **webhook secret**. When GitHub sends a webhook:

1. GitHub computes `SHA256(secret + payload)` → fingerprint
2. Attaches it to the header: `x-hub-signature-256: sha256=abc123...`
3. Spark recomputes the same fingerprint independently
4. Match → genuine. No match → reject 401.

#### How `createHmac` works internally

```typescript
createHmac("sha256", secret) // creates object, loads secret into internal state
  .update(payload) // feeds raw bytes into buffer, waits
  .digest("hex"); // runs final SHA256, converts 32 bytes → 64 char hex string
```

Why two steps — `createHmac` then `.update()`?
Designed to accept data in chunks. Large files call `.update()` multiple times. `.digest()` signals no more data. For webhooks `.update()` is called once since the whole payload arrives at once.

#### Why `express.raw()` not `express.json()`?

HMAC runs on exact raw bytes GitHub sent. If Express parses JSON first it can alter whitespace and key ordering — changing the bytes — breaking the signature check.

#### Why `timingSafeEqual` not `===`?

`===` stops the moment it finds the first mismatch:

```
signature: s h a 2 5 6 = a b c 1 2 3
expected:  s h a 2 5 6 = a b x 1 2 3
                                 ↑
                    stops here → took 9 comparisons → 9ms
```

```
signature: x h a 2 5 6 = a b c 1 2 3
expected:  s h a 2 5 6 = a b c 1 2 3
           ↑
                    stops here → took 1 comparison → 1ms
```

An attacker measures response times across thousands of guesses — slower response means more characters matched. They crack the signature character by character.

`timingSafeEqual` uses XOR internally:

```
same bytes:      'a' XOR 'a' = 0
different bytes: 'b' XOR 'x' = 1

result = 0
for every position i:
    result |= byte[i] of signature XOR byte[i] of expected
return result === 0
```

Never exits early. Always runs all 64 comparisons. Every response takes identical time. Attacker gets nothing useful.

```typescript
const expected = `sha256=${createHmac("sha256", secret)
  .update(payload)
  .digest("hex")}`;

return timingSafeEqual(
  Buffer.from(signature), // GitHub's fingerprint
  Buffer.from(expected), // our fingerprint
);
```

---

### `queue.ts`

#### What is BullMQ?

A queue library built on top of Redis. Spark writes jobs in, Backend reads and processes them. They never talk directly.

#### Why a queue instead of calling Backend directly?

- GitHub times out webhook receivers after **10 seconds**
- Backend processing can take much longer
- Spark drops the job and returns `200` immediately
- Backend picks it up and processes at its own pace

#### How Redis stores jobs

```
bull:analyze-pr:1  →  { prNumber: 42, repoFullName: "you/repo", ... }
bull:analyze-pr:2  →  { prNumber: 43, repoFullName: "you/repo", ... }

bull:analyze-pr:waiting   → [1, 2]   ← waiting to be picked up
bull:analyze-pr:active    → [3]      ← currently being processed
bull:analyze-pr:completed → [4, 5]   ← done
bull:analyze-pr:failed    → [6]      ← failed
```

#### `new Queue('analyze-pr', { connection })`

| Argument       | Purpose                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `'analyze-pr'` | name of the space in Redis — Spark and Backend must use the exact same name |
| `connection`   | tells BullMQ where Redis is running — host and port                         |

#### `PrJobPayload` — what goes into the queue

| Field            | What it is                                         |
| ---------------- | -------------------------------------------------- |
| `prNumber`       | PR number e.g. `#42`                               |
| `repoFullName`   | e.g. `yourname/test-repo`                          |
| `headSha`        | commit SHA at tip of PR branch                     |
| `baseBranch`     | branch PR is merging into e.g. `main`              |
| `title`          | PR title                                           |
| `author`         | GitHub username who opened it                      |
| `installationId` | needed by Backend to authenticate GitHub API calls |

Spark extracts these fields from the raw GitHub webhook payload. Backend never sees the raw GitHub payload — just this clean object.

---

### `webhook.ts`

The brain of Spark. Orchestrates validation and enqueue.

#### Request flow

```
POST /webhooks/github
  → validate HMAC        ← fake request? stop here → 401
    → check event type   ← not pull_request? ignore → 200
      → check action     ← not opened/synchronize? ignore → 200
        → return 200     ← tell GitHub we got it
          → enqueue job  ← drop into Redis
```

#### Why return 200 before enqueuing?

```typescript
res.status(200).json({ message: 'Accepted' });  // GitHub gets this first
await enqueueAnalysis({ ... });                  // then we enqueue
```

GitHub times out after 10 seconds. If Redis is slow and enqueue happens first, GitHub could time out and retry — creating duplicate jobs. Response goes to GitHub first, enqueue happens after.

#### Why ignore non-PR events with 200 not 400?

GitHub would keep retrying on error responses. `200` tells GitHub we received it fine, we just don't need to act on it.

#### Handled actions

Only `opened` and `synchronize`:

- `opened` → new PR created
- `synchronize` → new commit pushed to existing PR branch

---

### `app.ts`

Entry point. Boots Express and wires everything together.

#### Boot sequence

```
loads .env
  → creates Express app
    → registers /webhooks/github with express.raw() middleware
      → registers /health route
        → listens on port 3002
```

#### The critical middleware line

```typescript
app.use(
  "/webhooks/github",
  express.raw({ type: "application/json" }), // keep body as raw Buffer
  webhookRouter, // then validate and process
);
```

`express.raw()` only applies to this route. Keeps the body as raw bytes for HMAC validation.

---

### `pr-analysis.processor.ts` — Backend (Day 4)

#### `@Processor(QUEUES.ANALYZE_PR)`

NestJS decorator that tells BullMQ: watch the `analyze-pr` queue in Redis, whenever a job appears call `process()` on this class. `extends WorkerHost` handles Redis polling internally.

#### `process()`

BullMQ calls this automatically when a job arrives. `job.data` is exactly the `PrJobPayload` Spark put into Redis.

#### Day 4 behaviour

Logs PR metadata to confirm the job arrived correctly. `setTimeout(1000)` is a placeholder for real work added on Day 5.

---

## Key decisions

| Decision                             | Why                                                    |
| ------------------------------------ | ------------------------------------------------------ |
| `express.raw()` not `express.json()` | HMAC needs exact raw bytes GitHub sent                 |
| `timingSafeEqual` not `===`          | prevents timing attacks on signature comparison        |
| `installationId` in payload          | Backend needs it on Day 5 to generate GitHub API token |
| Return 200 before enqueue            | prevents GitHub timeouts causing duplicate jobs        |
| Ignore unknown events with 200       | prevents GitHub retrying on error responses            |
| Port 3002 for Spark                  | Backend is 3000, Forge is 3001, no conflicts           |

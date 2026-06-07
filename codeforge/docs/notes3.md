# Day 5 & 6 — Clarifications

---

## GitHub App Authentication Flow

```
appId + privateKey(.pem) + timestamps
  → signed JWT (lives 10 mins)
    → JWT sent to GitHub
      → GitHub verifies using your app's public key
        → GitHub issues Installation Token (lives 1 hour)
          → Installation Token used for all API calls
```

### What each thing proves

| Thing                | Proves                                                    |
| -------------------- | --------------------------------------------------------- |
| `appId`              | which GitHub App you are                                  |
| `privateKey (.pem)`  | you own that app                                          |
| `JWT`                | one-time credential — only used to get installation token |
| `installationId`     | which repo installation to access                         |
| `Installation Token` | actual API access — scoped to one repo                    |

### Key points

- JWT is never used for API calls directly — only to get the installation token
- Installation token is scoped to one specific repo via `installationId`
- `.pem` never leaves your server
- `createAppAuth` handles all of this internally — you just pass `appId`, `privateKey`, `installationId`

### Why `installationId` is passed to `getOctokit()`

```typescript
private getOctokit(installationId: number): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: this.appId,           // which app
      privateKey: this.privateKey, // proves ownership
      installationId,              // which repo to access
    },
  });
}
```

`installationId` scopes the Octokit instance to one specific repo. Different `installationId` = different repo = different Octokit instance. That's why Webhook passes it through the queue payload — Anvil needs it to create the right Octokit instance per job.

### What if installation token expires mid-job?

Token lives 1 hour. For a single PR analysis this is never an issue. If it did expire:

- Octokit throws `401 Unauthorized`
- BullMQ catches the error
- Job moves to failed queue
- BullMQ retries automatically → new token generated on retry

---

## `onModuleInit()` — runs once at boot not per job

```typescript
onModuleInit() {
  this.appId = Number(this.config.get('GITHUB_APP_ID'));
  this.privateKey = readFileSync(keyPath, 'utf-8');  // reads .pem once
}
```

```
Anvil boots → onModuleInit() runs ONCE → appId + privateKey in memory

Job 1 → uses this.appId, this.privateKey  (no file read)
Job 2 → uses this.appId, this.privateKey  (no file read)
Job 3 → uses this.appId, this.privateKey  (no file read)
```

Disk reads are slow. Read once at boot, reuse forever.

---

## `@Processor` — why queue name not Queue object in constructor

```typescript
@Processor(QUEUES.ANALYZE_PR)
export class PrAnalysisProcessor extends WorkerHost {
  constructor(private readonly githubService: GitHubService) {
    super();
  }
}
```

|       | Producer (Webhook)            | Consumer (Anvil Processor)    |
| ----- | ----------------------------- | ----------------------------- |
| Needs | `Queue` object                | `@Processor` decorator        |
| Does  | pushes jobs via `queue.add()` | receives jobs via `process()` |
| Why   | needs to write to Redis       | BullMQ polls Redis internally |

`@Processor('analyze-pr')` tells BullMQ to watch the queue and call `process()` automatically. The processor never pushes jobs — so it never needs the `Queue` object injected.

---

## `@InjectRepository` — why not `@Injectable` for entities

```typescript
// regular service — @Injectable() marks it, type alone is enough
constructor(private readonly githubService: GitHubService) {}

// entity repository — needs @InjectRepository because generics are erased at runtime
@InjectRepository(PullRequest)
private readonly prRepo: Repository<PullRequest>
```

|           | Services                     | Entity Repositories                                                           |
| --------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Decorator | `@Injectable()` on the class | `@InjectRepository(Entity)` on the parameter                                  |
| Why       | class name is unique token   | `Repository<T>` generic is erased at runtime — NestJS can't tell which entity |
| Source    | NestJS DI container          | TypeORM                                                                       |

Entities are just database table definitions — never marked `@Injectable()`. TypeORM creates a `Repository` object for each entity that has `.save()`, `.find()`, `.create()` etc.

---

## `Promise.allSettled` vs `Promise.all`

```typescript
const [security, complexity, testGaps, breaking] = await Promise.allSettled([
  this.securityWorker.analyze(chunks),
  this.complexityWorker.analyze(chunks),
  this.testGapsWorker.analyze(chunks),
  this.breakingWorker.analyze(chunks, files),
]);
```

|                  | `Promise.all`                         | `Promise.allSettled`                             |
| ---------------- | ------------------------------------- | ------------------------------------------------ |
| One worker fails | everything fails — no findings posted | other 3 still complete — partial findings posted |
| Returns          | values directly                       | result objects with `status` field               |

### Output shape

```typescript
// fulfilled
{ status: 'fulfilled', value: { workerType: 'security', findings: [...] } }

// rejected
{ status: 'rejected', reason: Error('Gemini timeout') }
```

Partial review is always better than no review. That's why `Promise.allSettled`.

---

## `flatMap` vs `map`

```typescript
// map → produces nested arrays
[security, complexity, testGaps, breaking]
  .map((result) => {
    if (result.status === "fulfilled") return result.value.findings;
    return [];
  })
  [
    // result: [[finding1, finding2], [], [finding3], []]

    // flatMap → flattens one level
    (security, complexity, testGaps, breaking)
  ].flatMap((result) => {
    if (result.status === "fulfilled") return result.value.findings;
    return [];
  });
// result: [finding1, finding2, finding3]
```

`flatMap` = `map` + `flat(1)` in one step. Maps each result to an array then flattens all into one.

---

## Quality Score Calculation

Start at 100, subtract penalties per finding:

```typescript
const PENALTIES = {
  high: 15,
  medium: 7,
  low: 2,
  info: 0,
};

score = Math.max(0, 100 - total_penalty);
```

### Example

```
2 high   → 2 × 15 = 30
1 medium → 1 × 7  =  7
2 low    → 2 × 2  =  4
total penalty = 41

score = 100 - 41 = 59/100
```

### Score ranges

```
80-100 → 🟢 good PR
60-79  → 🟡 needs attention
0-59   → 🔴 serious problems
```

`Math.max(0, ...)` prevents negative scores — worst possible is 0.

---

## Gemini Temperature

| Range     | Behaviour           | Use when                      |
| --------- | ------------------- | ----------------------------- |
| `0`       | fully deterministic | JSON output, code generation  |
| `0.1-0.3` | very focused        | summarization, classification |
| `0.4-0.7` | balanced            | general chat, explanations    |
| `0.8-1.0` | creative            | brainstorming, copywriting    |
| `1.0-2.0` | highly random       | poetry, experimental content  |

We use `temperature: 0` because we need consistent valid JSON output. Higher temperature → Gemini adds prose → `JSON.parse` fails.

---

## Why `workerType` must be dynamic not hardcoded

```typescript
// wrong — hardcoded
this.analysisRepo.create({
  workerType: 'security',  // all findings saved as security!
  ...
})

// correct — from worker result
allResults = [security, complexity, testGaps, breaking].flatMap((result) => {
  if (result.status === 'fulfilled') {
    return result.value.findings.map((f) => ({
      ...f,
      workerType: result.value.workerType,  // security | complexity | test-gaps | breaking
    }));
  }
  return [];
});
```

Each finding must carry its own `workerType` so the dashboard can filter by category.

---

## `.env` path resolution

`envFilePath` is relative to where the **process runs** — not where the file lives.

```
You run:    cd codeforge/backend && npm run start:dev
Process:    codeforge/backend/
'.env'   →  codeforge/backend/.env  ✅
'../.env' → codeforge/.env
```

`src/app.module.ts` location doesn't affect path resolution — Node.js always resolves from the working directory.

---

## What is `installationId`?

ReviewMind is a GitHub App. Users install it on their repos:

```
User A installs ReviewMind on acme/backend   → GitHub assigns installationId: 11111
User B installs ReviewMind on startup/api    → GitHub assigns installationId: 22222
User C installs ReviewMind on org/frontend   → GitHub assigns installationId: 33333
```

Each installation is a separate repo with its own unique `installationId`. When a PR is opened, GitHub sends a webhook with that repo's `installationId`. Anvil uses it to generate a token scoped only to that repo — cannot access any other repo.

```
installationId: 11111 → token only works for acme/backend
installationId: 22222 → token only works for startup/api
installationId: 33333 → token only works for org/frontend
```

Same `.pem` file used for all — but each `installationId` limits access to one specific repo.

---

## `@Injectable` vs `@InjectRepository` — when to use which

### `@Injectable()` — for services

```typescript
@Injectable()
export class GitHubService { ... }

// inject it anywhere like this
constructor(private readonly githubService: GitHubService) {}
```

- Marks the class so NestJS manages and injects it
- NestJS identifies it by the class name — unique token
- Register in `providers: []` of the module

### `@InjectRepository()` — for database entities

```typescript
// entity — just a table definition, never @Injectable
@Entity('pull_requests')
export class PullRequest { ... }

// to use the repository for this entity
@InjectRepository(PullRequest)
private readonly prRepo: Repository<PullRequest>
```

- Entities are database table definitions — not services
- TypeORM creates a `Repository` object per entity with `.save()`, `.find()`, `.create()`
- NestJS can't tell which entity from `Repository<PullRequest>` alone — generics are erased at runtime
- `@InjectRepository(PullRequest)` tells NestJS exactly which entity's repository to inject
- Must register the entity in `TypeOrmModule.forFeature([PullRequest])` in the module

### Side by side

|                          | `@Injectable` service | `@InjectRepository` entity           |
| ------------------------ | --------------------- | ------------------------------------ |
| Decorator goes on        | the class             | the constructor parameter            |
| NestJS identifies by     | class name            | entity class passed to decorator     |
| Registered in module via | `providers: []`       | `TypeOrmModule.forFeature([Entity])` |
| Has methods like         | whatever you write    | `.save()`, `.find()`, `.create()`    |

GitHub fires POST
↓
smee forwards it
↓
app.ts — app.listen() receives the request
app.ts — app.use('/webhooks') routes to webhookRouter
↓
webhook.ts — validateSignature() checks HMAC
webhook.ts — event check only pull_request
webhook.ts — action check only opened/synchronize
webhook.ts — res.status(200) tells GitHub "got it"
webhook.ts — enqueueAnalysis() sends to queue.ts
↓
queue.ts — analyzePrQueue.add() writes to Redis
↓
pr-analysis.processor.ts — process() picks up from Redis
logs PR data

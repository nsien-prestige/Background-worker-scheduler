# Background Job Scheduler — Architecture

## Overview

A background job processing system built with NestJS, PostgreSQL (Supabase).
Jobs are created via REST API, queued in a min-heap priority queue, processed
by an independent worker, and tracked through their full lifecycle.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + NestJS |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | TypeORM |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |
| DNS | DuckDNS |
| Hosting | AWS EC2 (t3.micro) |

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (UI)                        │
│         Plain HTML/CSS/JS Dashboard                  │
│    GitHub Pages — nsien-prestige.github.io           │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS / SSE
┌─────────────────▼───────────────────────────────────┐
│              NGINX (Reverse Proxy)                   │
│         prestige-scheduler.duckdns.org               │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│             NESTJS API SERVER (PM2)                  │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ JobsModule  │  │WorkerModule │  │SchedulerMod │  │
│  │- CRUD API   │  │- Polling    │  │- MinHeap    │  │
│  │- DAG service│  │- Handlers   │  │- Aging      │  │
│  │- DLQ API    │  │- RetryLogic │  │- TimingWheel│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              PostgreSQL (Supabase)                   │
│                                                      │
│       jobs  │  job_dependencies  │  migrations       │
└─────────────────────────────────────────────────────┘
```

## Core Components

### 1. Min-Heap Priority Queue

Jobs are ordered in memory by:
1. Priority (1=High, 2=Medium, 3=Low)
2. Scheduled time (earlier first)
3. Creation time (older first)

Operations: O(log n) insert, O(log n) extract-min.

On startup, all pending due jobs load into the heap. New jobs are
inserted immediately. Scheduled future jobs enter the heap when due
via a 10-second background check.

### 2. Worker

Runs inside the NestJS process via `setInterval` (every 5 seconds).

Flow:
1. Extract next job from heap
2. Atomically lock it via `UPDATE ... WHERE status = 'pending' RETURNING *`
3. Check DAG dependencies — unlock and skip if not met
4. Run handler (email simulation)
5. Mark completed or trigger retry logic

**Stale lock watchdog** runs every 60 seconds — resets any job stuck
in `processing` for more than 5 minutes back to `pending`.

### 3. Retry Engine

Failed jobs retry automatically up to 3 times with exponential backoff:

| Attempt | Base Delay | With Jitter |
|---|---|---|
| 1 | 1s | ~1-2s |
| 2 | 5s | ~5-6s |
| 3 | 25s | ~25-26s |

Formula: `delay = 1000 * 5^attempt + random(0, 1000)ms`

After 3 failures the job moves to the Dead Letter Queue.

### 4. Dead Letter Queue (DLQ)

Implemented as a flag (`is_dlq = true`) on the jobs table rather than
a separate table — avoids data duplication, simplifies queries.

Threshold: 10 jobs triggers a critical log alert.

Manual retry resets: `status → pending`, `retry_count → 0`,
`is_dlq → false`, re-adds to heap.

### 5. DAG Workflow

Jobs can depend on other jobs via `job_dependencies` table (adjacency list).

Before processing, the worker checks all dependencies are `completed`
using a single COUNT query. If not met, the job is unlocked and skipped.

Cycle detection uses DFS — rejects any dependency that would create
a circular chain.

### 6. Scheduled and Recurring Jobs

- **Scheduled**: `scheduled_at` in future. Heap ignores until due.
  Background check every 10s adds due jobs to heap.
- **Recurring**: On completion, worker creates a new job with
  `scheduled_at = now + interval`. Self-scheduling forever.

Intervals: `every_1_minute`, `every_5_minutes`, `every_1_hour`

### 7. Starvation Prevention

Every 30 seconds, jobs waiting longer than 60 seconds get priority
boosted by 1 (e.g. LOW=3 → MEDIUM=2). Persisted to DB.

### 8. Alternative Algorithm — Timing Wheel

Implemented alongside the heap for benchmarking.

| | Min-Heap | Timing Wheel |
|---|---|---|
| Insert | O(log n) | O(1) |
| Extract | O(log n) | O(1) |
| Priority ordering | Yes | No |

**Benchmark results (10,000 jobs):**
- Min-Heap: 560,329 ops/sec
- Timing Wheel: 786,775 ops/sec

**Decision**: Heap stays as primary scheduler because priority ordering
is a core requirement. Timing wheel wins on raw speed but cannot
guarantee highest-priority job runs first when multiple jobs are due
simultaneously.

## Database Schema

### jobs

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| type | varchar | Job type e.g. send_email |
| payload | jsonb | Job data |
| priority | int | 1=High, 2=Med, 3=Low |
| status | enum | pending/processing/completed/failed/cancelled |
| retry_count | int | 0-3 |
| error_message | text | Last failure reason |
| scheduled_at | timestamptz | null = run immediately |
| recurring_interval | varchar | null = one-time |
| locked_by | varchar | Worker ID holding lock |
| locked_at | timestamptz | Lock acquisition time |
| started_at | timestamptz | Processing start time |
| completed_at | timestamptz | Completion time |
| is_dlq | boolean | In dead letter queue |
| dlq_reason | text | Why it ended up in DLQ |
| dlq_retry_count | int | Manual retry count |

### job_dependencies

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| job_id | uuid | The dependent job |
| depends_on_id | uuid | The job it depends on |
| created_at | timestamptz | When dependency was added |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /jobs | Create a job |
| GET | /jobs | Get all jobs |
| GET | /jobs/dlq | Get DLQ jobs |
| PATCH | /jobs/:id/cancel | Cancel a job |
| POST | /jobs/:id/retry | Retry a DLQ job |
| POST | /jobs/:jobId/dependencies/:dependsOnId | Add DAG dependency |
| GET | /jobs/benchmark | Run algorithm benchmark |

Full API docs: https://prestige-scheduler.duckdns.org/api/docs

## Deployment

```
AWS EC2 (t3.micro, Ubuntu 24.04)
  └── PM2 (process manager, auto-restart)
       └── NestJS app (port 3000)
            └── Nginx (reverse proxy, ports 80/443)
                 └── Let's Encrypt SSL (auto-renew)
                      └── DuckDNS (prestige-scheduler.duckdns.org)
```

## Architectural Decisions

### DLQ as flag vs separate table
Avoids data duplication. All job context stays in one place.
DLQ view is just `WHERE is_dlq = true`. Manual retry updates
the same row — no data migration needed.

### Heap over timing wheel as primary scheduler
Priority ordering is a core requirement — timing wheel cannot
guarantee highest priority job runs first when multiple jobs
are due simultaneously. Heap's O(log n) is acceptable at this scale.

### Single process worker
Simplifies deployment and avoids IPC complexity. Worker runs as
`setInterval` inside the NestJS process. Atomic DB locking handles
concurrency correctly even if multiple workers are added later.

### TOCTOU-safe atomic updates
All status transitions use `UPDATE ... WHERE status = :expected RETURNING *`
rather than read-then-write to prevent race conditions under concurrent workers.

### Action pattern for repository layer
Every module uses `*ModelAction` classes extending `AbstractModelAction<T>`
instead of injecting TypeORM repositories directly into services. This keeps
services decoupled from the ORM and makes the codebase consistent and testable.
# Background Job Scheduler

A production-grade background job processing system built with NestJS, PostgreSQL, and a custom heap-based priority queue. Jobs are created via REST API, queued, processed by an independent worker, and tracked through their full lifecycle.

## Live Links

| Resource | URL |
|---|---|
| Live UI | https://nsien-prestige.github.io/Background-worker-scheduler/ |
| API Server | https://prestige-scheduler.duckdns.org |
| API Docs (Swagger) | https://prestige-scheduler.duckdns.org/api/docs |
| Architecture Doc | [ARCHITECTURE.md](./ARCHITECTURE.md) |

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + NestJS |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | TypeORM |
| UI | Plain HTML/CSS/JS |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |
| DNS | DuckDNS |
| Hosting | AWS EC2 (t3.micro) |

## Features

- **Heap-based priority queue** — jobs ordered by priority, scheduled time, and creation time
- **Independent worker** — polls every 5 seconds, atomically locks jobs to prevent duplicate processing
- **Retry engine** — automatic retries up to 3 times with exponential backoff and jitter
- **Dead letter queue** — failed jobs land here after exhausting retries, with manual retry support
- **DAG workflow** — jobs can depend on other jobs; dependency check before processing
- **Scheduled jobs** — jobs with a future `scheduled_at` wait until their time is due
- **Recurring jobs** — self-scheduling after completion via intervals
- **Starvation prevention** — priority aging boosts long-waiting low-priority jobs
- **Alternative algorithm** — timing wheel implemented and benchmarked against the heap
- **Live UI** — dashboard with real-time polling, job table, create form, DLQ view, and benchmark tab

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- PostgreSQL (or Supabase account)

### Setup

```bash
# Clone the repo
git clone https://github.com/nsien-prestige/Background-worker-scheduler.git
cd Background-worker-scheduler/backend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Fill in your DATABASE_URL and ALERT_EMAIL

# Run migrations
pnpm run migration:run

# Start development server
pnpm run start:dev
```

### Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=your-supabase-connection-url
DATABASE_LOGGING=false
ALERT_EMAIL=your-email@example.com
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /jobs | Create a job |
| GET | /jobs | Get all jobs (paginated) |
| GET | /jobs/stats | Get job counts by status |
| GET | /jobs/dlq | Get DLQ jobs (paginated) |
| GET | /jobs/benchmark | Run algorithm benchmark |
| PATCH | /jobs/:id/cancel | Cancel a job |
| POST | /jobs/:id/retry | Retry a DLQ job |
| POST | /jobs/:jobId/dependencies/:dependsOnId | Add DAG dependency |

Full docs at: https://prestige-scheduler.duckdns.org/api/docs

## Project Structure

```
backend/
  src/
    config/           # Environment and database config
    database/         # Migrations, seeds, data source
    modules/
      jobs/           # Job entity, service, controller, DAG
      workers/        # Worker, retry engine, handlers, scheduler
        scheduler/    # Min-heap, timing wheel, benchmark
```

## Deployment

Manually deployed to AWS EC2 with:
- PM2 for process management
- Nginx as reverse proxy
- Let's Encrypt SSL via Certbot
- DuckDNS for dynamic DNS

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full architecture details.
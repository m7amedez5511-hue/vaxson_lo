# 🚛 Saudi Logistics API Platform

A production-ready, high-performance logistics management system built with **Node.js**, **Express**, **Prisma**, and **PostgreSQL**. This platform is designed to handle complex fleet operations, driver management, and order tracking with full regulatory compliance.

---

## 🏗️ Architecture & Folder Structure

The project follows a **Layered Architecture** pattern to ensure scalability, maintainability, and clear separation of concerns.

### Project Layout
```text
├── prisma/               # Database schema and migrations
├── scripts/              # Infrastructure and Docker entrypoint scripts (e.g., start.sh)
├── src/
│   ├── App/              # Core Express application configuration
│   ├── components/       # (Optional) Reusable business logic components
│   ├── controllers/      # Request handling and HTTP response logic
│   ├── services/         # Core business logic and database interactions (Prisma)
│   ├── routes/           # API route definitions and centralized routing
│   ├── middleware/       # Global and route-specific middlewares (Error handling, Auth)
│   ├── docs/             # OpenAPI/Swagger documentation files
│   ├── lib/              # Shared library instances (Prisma Client, Redis)
│   ├── utils/            # Helper functions and shared utilities
│   └── server.js         # Application entry point
├── config/               # Application configuration files
└── docker-compose.yml    # Container orchestration for Dev/Prod
```

---

## 📦 Modules Deep-Dive

### 👥 Client Management Module
The Client module is designed for enterprise-grade logistics where data persistence and historical records are critical.

#### Key Features:
- **Multi-Address System**: Support for multiple delivery/pickup locations per client.
- **Atomic Address Synchronization**: A smart sync engine in `client.service.js` that performs `Create/Update/Delete` operations for addresses in a single transaction.
- **Strict One-Default Rule**: Business logic ensures each client has exactly one primary address.

#### 🛡️ Advanced Data Protection: Partial Unique Index
We implemented a **Partial Unique Index** strategy for client emails. This solves the "Soft Delete Email Conflict" problem:
- **The Problem**: Standard unique indexes prevent reusing an email if a deleted record still exists in the DB.
- **The Solution**: We used a PostgreSQL filtered index:
  ```sql
  CREATE UNIQUE INDEX "client_email_active_idx" ON "clients"("email") WHERE is_deleted = false;
  ```
- **The Benefit**: You can have multiple deleted clients with the same email, but only **one active client** per email at any time.

#### 🗑️ Soft Delete Logic
- **Flagging**: `is_deleted` is set to `true` instead of record removal.
- **Global Filtering**: The `findAll` service automatically excludes any record where `isDeleted: true`.
- **Integrity**: Preserves historical data for orders and trips even if a client is deactivated.

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose

### Fast Launch (Development)
1. **Clone the repository**:
   ```bash
   git clone https://git.slash.sa/Slash-Git/LogisticsApp.git
   ```
2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your local secrets
   ```
3. **Run with Docker** (API on `:3000`, nginx on `:8080`):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   ```
   - API direct: http://localhost:3000/api/health  
   - Via nginx: http://localhost:8080/api/health  

### Production Launch
1. Copy and merge env files on the server:
   ```bash
   cp .env.example .env
   # Apply production values from .env.production.example
   ```
2. **Deploy**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
   - Public API (nginx): port **80** / **443** → `logiapi.slash.sa`  
   - Admin UI (`logiadmin.slash.sa`) must set `CORS_ORIGINS=https://logiadmin.slash.sa`  
   - DB/Redis/Mongo are **not** published to the host in production.

### Database Migrations
To apply changes to the database:
```bash
docker exec logistics-app npx prisma migrate dev
```

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL 18
- **Caching**: Redis 8
- **Documentation**: Swagger UI / OpenAPI 3.0
- **Logging**: Winston & Morgan

---

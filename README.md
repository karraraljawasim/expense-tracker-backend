# Expense Tracker REST API

A backend service for tracking expenses, managing budget categories, and generating financial reports. Built with Node.js, Express, TypeScript, MongoDB, and Redis.

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
   * [Prerequisites](#prerequisites)
   * [Installation](#installation)
* [Running with Docker](#running-with-docker)
* [API Routes](#api-routes)
* [Full Interactive API Documentation](#full-interactive-api-documentation)
* [Testing](#testing)
## Features

- **Authentication:** JWT-based access and refresh token flow.
- **Expense & Budget Management:** Track spending across custom categories.
- **Recurring Expenses:** A daily cron job automatically generates expenses that are set up to recur.
- **Budget Alerts:** Spending is checked against budget thresholds in real time whenever an expense is created or updated.
- **Reporting:** Generate monthly and category-based spending summaries.
- **Caching & Security:** Redis-backed rate limiting on sensitive routes to prevent abuse.
- **Validation:** Strict runtime type safety and request validation using Zod.
- **Documentation:** Interactive Swagger UI.
## Tech Stack

- **Core:** Node.js, Express 5, TypeScript
- **Database:** MongoDB (Mongoose)
- **Caching & Rate Limiting:** Redis
- **Validation:** Zod
- **Testing:** Vitest
## Project Structure

```text
expense-tracker-backend/
├── src/
│   ├── config/             
│   ├── helpers/            
│   ├── jobs/               
│   ├── middlewares/        
│   ├── modules/
│   │   ├── auth/           
│   │   ├── budgetAlert/    
│   │   ├── categories/     
│   │   ├── expenses/       
│   │   ├── reports/        
│   │   └── users/          
│   ├── types/              
│   ├── utils/              
│   ├── app.ts              
│   └── server.ts           
├── tests/                  
├── Dockerfile
├── compose.yaml
└── vitest.config.ts
```

*Note: Each directory in `src/modules` follows the same pattern: `*.controller.ts` handles HTTP requests and responses, `*.service.ts` holds business logic, `*.routes.ts` defines endpoints, `*.model.ts` is the Mongoose schema, `*.validation.ts` holds Zod schemas, `*.types.ts` holds TypeScript types, and `*.docs.ts` contains Swagger documentation definitions.*

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (Atlas or local)
- Redis
- Docker (optional)
### Installation

1. Clone the repository:
```bash
   git clone https://github.com/karraraljawasim/expense-tracker-backend.git
   cd expense-tracker-backend
```

2. Install dependencies:
```bash
   npm install
```

3. Environment Setup:
   Copy the example environment file and fill in your values.
```bash
   cp .env.example .env.development.local
```

4. Run the development server:
```bash
   npm run dev
```
The server starts on `http://localhost:8080`.

## Running with Docker

The project supports MongoDB Atlas (default) or a local MongoDB container.

**Atlas:**
```bash
docker compose up --build
```

**Local MongoDB:**
```bash
docker compose --profile local-db up --build
```
*Set `DB_URL` in `.env.development.local` to `mongodb://mongo:27017/expense_tracker_api`.*

## API Routes

All routes below, except `/api/auth/*`, require authentication.

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `POST /api/auth/refresh`
### Categories
- `POST /api/categories`
- `GET /api/categories`
- `GET /api/categories/:categoryId`
- `PATCH /api/categories/:categoryId`
- `PUT /api/categories/:categoryId`
### Expenses
- `POST /api/expenses`
- `GET /api/expenses`
- `GET /api/expenses/:expenseId`
- `PATCH /api/expenses/:expenseId`
- `PATCH /api/expenses/:expenseId?softDelete=true`
### Budget Alerts
- `GET /api/budgets`
- `GET /api/budgets/alerts`
- `PATCH /api/budgets/alerts/:budgetAlertId/read`
- `PATCH /api/budgets/alerts/read-all`
- `GET /api/budgets/history`
### Reports
- `GET /api/reports/monthly`
- `GET /api/reports/categories/:categoryId`
- `GET /api/reports/summary`
## Full Interactive API Documentation

```text
http://localhost:8080/api-docs
```

## Testing

```bash
npm test
```
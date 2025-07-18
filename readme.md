

# Safety System

A comprehensive safety management system with incident tracking, investigations, and user management. Features a Go backend and Next.js/TypeScript frontend.

![Safety System Architecture](https://img.shields.io/badge/architecture-microservices-blue) 
![Go Version](https://img.shields.io/badge/go-1.23.5+-blue) 
![Node Version](https://img.shields.io/badge/node-20+-green)

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Database](#database)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Admin Guide](#admin-guide)
- [Deployment](#deployment)

## Features
✔ Incident tracking and management  
✔ Comprehensive investigation workflows  
✔ Role-based access control (RBAC)  
✔ Real-time notifications  
✔ Analytics dashboard  
✔ Audit logging  

## Tech Stack

### Backend
| Component       | Technology             |
|-----------------|------------------------|
| Language        | Go 1.23.5+             |
| Framework       | Fiber                  |
| Database        | PostgreSQL             |
| ORM             | GORM                   |
| Authentication  | JWT                    |

### Frontend
| Component       | Technology             |
|-----------------|------------------------|
| Framework       | Next.js 14             |
| Language        | TypeScript 5+          |
| Styling         | Tailwind CSS           |
| UI Library      | Shadcn UI + Radix      |
| State Management| Zustand                |

## Quick Start

```bash
# Clone repository
git clone https://github.com/kali07dev/health-sys.git
cd health-sys
```
# Backend setup
```
cp config.example.yaml config.yaml
go mod tidy
go run main.go migrate
```
# Frontend setup
```
cd ui
npm install
cp .env.production .env.local
npm run dev
```

## Detailed Setup

### Prerequisites
- Go 1.23.5+
- Node.js 20+
- PostgreSQL 15+
- Git

### Backend

1. Configure environment:
```bash
mv config.example.yaml config.yaml
# Edit config.yaml with your database credentials
```

2. Install dependencies:
```bash
go mod tidy
```

3. Database setup:
```bash
go run main.go migrate
```

### Frontend

1. Install dependencies:
```bash
cd ui
npm install
```

2. Configure environment:
```bash
cp .env.production .env.local
# Edit .env.local with your API endpoints
```

### Database
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Configuration

The backend configuration is managed through the `config.yaml` file. Here are the key sections:

- **database:** PostgreSQL connection details.
- **logging:** Logging settings.
- **sentry:** Sentry DSN for error tracking.
- **web:** Domain for the web application.
- **smtp:** SMTP server details for sending emails.
- **cors:** Cross-Origin Resource Sharing settings.

### Backend (config.yaml)
```yaml
database:
  host: "localhost"
  port: 5432
  user: "postgres"
  password: "password"
  name: "safety_system"
  
smtp:
  host: "smtp.example.com"
  port: 587
  user: "user@example.com"
  password: "password"
```

### Frontend (.env.local)
```ini
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ENV=development
```

## Project Structure
```
├── cmd/               # CLI commands
├── internal/          # Core application logic
│   ├── api/           # HTTP handlers
│   ├── models/        # Database models
│   └── services/      # Business logic
├── ui/                # Next.js frontend
│   ├── app/           # App router
│   ├── components/    # UI components
│   └── lib/           # Utilities
├── config.yaml        # Backend configuration
└── main.go            # Application entrypoint
```

## Admin Guide

Create admin user:
```bash
go run main.go create-admin \
  -e admin@example.com \
  -p securepassword \
  -f Admin \
  -l User
```

Common commands:
```bash
# Run server
go run main.go server

# Run migrations
go run main.go migrate

# View help
go run main.go --help
```

## Deployment

### Production Build
```bash
# Backend
go build -o safety-system main.go

# Frontend
cd ui
npm run build
npm start
```

### Docker (Example)
```dockerfile
FROM golang:1.23 as builder
WORKDIR /app
COPY . .
RUN go build -o safety-system

FROM alpine:latest
COPY --from=builder /app/safety-system /
CMD ["/safety-system", "server"]
```

---

📄 **License**: MIT  
🐛 **Issue Tracker**: [GitHub Issues](https://github.com/kali07dev/health-sys/issues)  
📧 **Support**: hopekalitera@gmail.com
```


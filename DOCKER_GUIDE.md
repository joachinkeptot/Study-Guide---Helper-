# Docker Compose Quick Start

This file provides quick commands for working with Docker Compose.

## Basic Commands

```bash
# Start all services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart a service
docker-compose restart backend
```

## Service Management

```bash
# Check status
docker-compose ps

# Execute command in container
docker-compose exec backend flask db upgrade
docker-compose exec backend python init_db.py

# Access shell
docker-compose exec backend bash
docker-compose exec postgres psql -U studyguide -d studyguide_db
```

## Database Operations

```bash
# Run migrations
docker-compose exec backend flask db migrate -m "Description"
docker-compose exec backend flask db upgrade

# Access PostgreSQL CLI
docker-compose exec postgres psql -U studyguide -d studyguide_db

# Backup database
docker-compose exec postgres pg_dump -U studyguide studyguide_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U studyguide -d studyguide_db
```

## Development Workflow

```bash
# 1. Start services
docker-compose up -d

# 2. View logs to ensure everything started
docker-compose logs -f

# 3. Access services:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
# - pgAdmin: http://localhost:5050 (with profile tools)

# 4. Make code changes (auto-reload enabled)

# 5. Stop when done
docker-compose down
```

## Troubleshooting

```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Remove all containers and start fresh
docker-compose down -v
docker-compose up -d --build

# View resource usage
docker stats

# Clean up unused images/volumes
docker system prune -a
```

## Optional: pgAdmin

To start pgAdmin for database management:

```bash
# Start with tools profile
docker-compose --profile tools up -d

# Access pgAdmin at http://localhost:5050
# Login: admin@studyguide.local / admin

# Add server connection:
# - Host: postgres
# - Port: 5432
# - Database: studyguide_db
# - Username: studyguide
# - Password: studyguide_dev_password
```

## Production-like Testing

```bash
# Use production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Environment Variables

Modify `docker-compose.yml` or create `.env` file:

```env
# Database
POSTGRES_USER=studyguide
POSTGRES_PASSWORD=studyguide_dev_password
POSTGRES_DB=studyguide_db

# Backend
FLASK_ENV=development
SECRET_KEY=dev-secret-key

# Frontend
PUBLIC_API_URL=http://localhost:5000
```

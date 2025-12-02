# Quick Start Scripts

## Local Development

### Start everything with Docker

```bash
docker-compose up -d
```

### Or start manually:

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate  # or: source .venv/bin/activate
python run.py
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

## Deployment

### Deploy Backend to Railway

```bash
cd backend
./deploy-railway.sh
```

### Deploy Frontend to Vercel

```bash
cd frontend
vercel --prod
```

## Database Operations

### Run Migrations (Local)

```bash
cd backend
flask db migrate -m "Description"
flask db upgrade
```

### Run Migrations (Railway)

```bash
railway run flask db upgrade
```

### Backup Database (Docker)

```bash
docker-compose exec postgres pg_dump -U studyguide studyguide_db > backup.sql
```

### Restore Database (Docker)

```bash
cat backup.sql | docker-compose exec -T postgres psql -U studyguide studyguide_db
```

## Testing

### Backend Tests

```bash
cd backend
./run_tests.sh
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Maintenance

### Update Dependencies

```bash
# Backend
cd backend
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt

# Frontend
cd frontend
npm update
```

### Check for Security Issues

```bash
# Backend
cd backend
pip audit

# Frontend
cd frontend
npm audit
```

## Monitoring

### View Logs (Docker)

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### View Logs (Railway)

```bash
railway logs
```

### Check Health

```bash
# Backend
curl http://localhost:5000/health

# Or production
curl https://your-backend.railway.app/health
```

## Troubleshooting

### Reset Local Database

```bash
docker-compose down -v
docker-compose up -d
```

### Clear Frontend Cache

```bash
cd frontend
rm -rf node_modules .svelte-kit
npm install
npm run dev
```

### Rebuild Docker Images

```bash
docker-compose build --no-cache
docker-compose up -d
```

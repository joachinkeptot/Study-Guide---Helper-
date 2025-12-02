# Backend Routes

This directory contains all Flask API blueprints for the Study Guide Helper application.

## Structure

```
routes/
├── __init__.py         # Blueprint initialization
├── auth.py             # Authentication endpoints
├── study_guides.py     # Study guide management
├── practice.py         # Practice session management
└── progress.py         # Progress tracking and statistics
```

## Features

### Authentication (`auth.py`)

- ✅ JWT-based authentication
- ✅ User registration with validation
- ✅ Login/logout
- ✅ Password hashing with Werkzeug
- ✅ Token expiration (7 days)
- ✅ Protected route decorator

### Study Guides (`study_guides.py`)

- ✅ Multi-format document upload (PDF, DOCX, TXT, MD, images)
- ✅ Automatic text extraction and parsing
- ✅ LLM-powered content structuring
- ✅ Automatic problem generation per topic
- ✅ CRUD operations for guides
- ✅ Pagination support

### Practice (`practice.py`)

- ✅ Session management (start/end)
- ✅ Intelligent problem selection (weighted by confidence)
- ✅ LLM-powered answer evaluation with feedback
- ✅ Real-time progress tracking
- ✅ Confidence rating system (1-3 scale)
- ✅ Topic mastery detection
- ✅ Session summaries with statistics

### Progress (`progress.py`)

- ✅ Overall user statistics
- ✅ Per-guide progress tracking
- ✅ Topic-level mastery metrics
- ✅ Practice session history
- ✅ Accuracy calculations
- ✅ Recent activity tracking

## Usage

All routes are automatically registered with the `/api` prefix through the blueprint system.

### Example: Starting the server

```bash
cd backend
python run.py
```

The API will be available at `http://localhost:5000/api`

### Example: Testing authentication

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use the token
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration

Required environment variables (see `.env.example`):

```env
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
ANTHROPIC_API_KEY=your-anthropic-key  # For Claude
OPENAI_API_KEY=your-openai-key        # For OpenAI
LLM_PROVIDER=claude                   # claude, openai, or ollama
```

## Input Validation

All routes include comprehensive input validation:

- Required fields checking
- Type validation
- Format validation (emails, confidence ratings, etc.)
- Authorization checks (users can only access their own data)

## Error Handling

Consistent error responses across all routes:

- `400`: Bad request / invalid input
- `401`: Unauthorized / invalid credentials
- `404`: Resource not found
- `409`: Conflict (e.g., user already exists)
- `422`: Unprocessable entity (e.g., parsing failed)
- `500`: Internal server error

## Security Features

- JWT token authentication
- Password hashing (Werkzeug)
- User data isolation (users can only access their own data)
- SQL injection protection (SQLAlchemy ORM)
- File upload validation
- Maximum file size limits (16MB)

## See Also

- [API Documentation](../API_DOCUMENTATION.md) - Complete API reference
- [Models](../models.py) - Database models
- [LLM Adapter](../services/llm_adapter.py) - LLM integration
- [Document Parser](../services/document_parser.py) - Document processing

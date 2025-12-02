# Study Guide Helper - API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Auth Routes (`/api/auth`)

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-12-02T10:00:00"
  }
}
```

**Errors:**

- `400`: Invalid input (missing fields, invalid email)
- `409`: User already exists

---

### Login

**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-12-02T10:00:00"
  }
}
```

**Errors:**

- `400`: Missing credentials
- `401`: Invalid credentials

---

### Logout

**POST** `/auth/logout`

Logout (client should delete token).

**Response (200):**

```json
{
  "message": "Logout successful"
}
```

---

### Get Current User

**GET** `/auth/me`

Get authenticated user's profile.

**Response (200):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-12-02T10:00:00"
  }
}
```

---

## Study Guides Routes (`/api/guides`)

### Upload Study Guide

**POST** `/guides/upload`

Upload and parse a study guide document.

**Request (multipart/form-data):**

- `file`: Document file (PDF, DOCX, TXT, MD, or image)
- `title`: (optional) Guide title

**Supported formats:** `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.png`, `.jpg`, `.jpeg`, `.tiff`, `.bmp`

**Response (201):**

```json
{
  "message": "Study guide uploaded and processed successfully",
  "guide": {
    "id": 1,
    "user_id": 1,
    "title": "Introduction to Python",
    "original_filename": "python_guide.pdf",
    "parsed_content": {...},
    "created_at": "2025-12-02T10:00:00",
    "topic_count": 5,
    "topics": [...]
  }
}
```

**Errors:**

- `400`: No file provided or invalid file type
- `422`: Document parsing failed

---

### List Study Guides

**GET** `/guides`

Get all study guides for authenticated user.

**Query Parameters:**

- `limit`: Number of guides per page (default: 20, max: 100)
- `offset`: Offset for pagination (default: 0)

**Response (200):**

```json
{
  "guides": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Introduction to Python",
      "original_filename": "python_guide.pdf",
      "created_at": "2025-12-02T10:00:00",
      "topic_count": 5
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### Get Study Guide

**GET** `/guides/<guide_id>`

Get a specific study guide with topics.

**Response (200):**

```json
{
  "guide": {
    "id": 1,
    "user_id": 1,
    "title": "Introduction to Python",
    "original_filename": "python_guide.pdf",
    "parsed_content": {...},
    "created_at": "2025-12-02T10:00:00",
    "topic_count": 5,
    "topics": [
      {
        "id": 1,
        "study_guide_id": 1,
        "name": "Variables and Data Types",
        "description": "Learn about Python variables",
        "order_index": 0,
        "problem_count": 5
      }
    ]
  }
}
```

**Errors:**

- `404`: Guide not found

---

### Delete Study Guide

**DELETE** `/guides/<guide_id>`

Delete a study guide and all associated data.

**Response (200):**

```json
{
  "message": "Study guide deleted successfully"
}
```

**Errors:**

- `404`: Guide not found

---

## Practice Routes (`/api/practice`)

### Start Practice Session

**POST** `/practice/start`

Start a new practice session.

**Request Body:**

```json
{
  "guide_id": 1,
  "topic_ids": [1, 2, 3] // optional
}
```

**Response (201):**

```json
{
  "message": "Practice session started",
  "session": {
    "id": 1,
    "user_id": 1,
    "study_guide_id": 1,
    "started_at": "2025-12-02T10:00:00",
    "ended_at": null,
    "attempt_count": 0
  }
}
```

**Errors:**

- `400`: Missing guide_id
- `404`: Guide not found

---

### Get Next Problem

**GET** `/practice/next-problem`

Get the next problem (weighted by confidence).

**Query Parameters:**

- `session_id`: Active session ID (required)
- `topic_ids`: Comma-separated topic IDs (optional)

**Response (200):**

```json
{
  "problem": {
    "id": 1,
    "topic_id": 1,
    "question_text": "What is a variable in Python?",
    "problem_type": "multiple_choice",
    "options": ["A", "B", "C", "D"],
    "explanation": "..."
  },
  "session_id": 1
}
```

**Errors:**

- `400`: Missing session_id or invalid session
- `404`: No problems available

---

### Submit Answer

**POST** `/practice/submit`

Submit an answer and get feedback.

**Request Body:**

```json
{
  "session_id": 1,
  "problem_id": 1,
  "answer": "A variable is a container for storing data"
}
```

**Response (200):**

```json
{
  "message": "Answer submitted successfully",
  "attempt": {
    "id": 1,
    "session_id": 1,
    "problem_id": 1,
    "user_answer": "...",
    "is_correct": true,
    "confidence_rating": null,
    "feedback": "Correct! ...",
    "attempted_at": "2025-12-02T10:05:00"
  },
  "is_correct": true,
  "feedback": "Correct! Great job!",
  "score": 100,
  "correct_answer": null,
  "explanation": "...",
  "topic_progress": {
    "problems_attempted": 1,
    "problems_correct": 1,
    "current_confidence": 1.0,
    "mastered": false,
    "accuracy": 100
  }
}
```

**Errors:**

- `400`: Missing required fields or invalid session
- `404`: Problem or session not found

---

### End Practice Session

**POST** `/practice/end`

End a practice session and get summary.

**Request Body:**

```json
{
  "session_id": 1
}
```

**Response (200):**

```json
{
  "message": "Practice session ended",
  "session": {
    "id": 1,
    "user_id": 1,
    "study_guide_id": 1,
    "started_at": "2025-12-02T10:00:00",
    "ended_at": "2025-12-02T10:30:00",
    "attempt_count": 10
  },
  "summary": {
    "total_problems": 10,
    "correct_answers": 8,
    "accuracy": 80.0,
    "duration_minutes": 30.0,
    "topic_breakdown": [
      {
        "topic_name": "Variables",
        "total": 5,
        "correct": 4
      }
    ]
  }
}
```

**Errors:**

- `400`: Missing session_id or session already ended
- `404`: Session not found

---

### Update Confidence Rating

**POST** `/practice/confidence`

Update confidence rating for a problem attempt.

**Request Body:**

```json
{
  "attempt_id": 1,
  "confidence_rating": 3 // 1-3 scale (1=low, 2=medium, 3=high)
}
```

**Response (200):**

```json
{
  "message": "Confidence rating updated",
  "attempt": {
    "id": 1,
    "confidence_rating": 3,
    ...
  }
}
```

**Errors:**

- `400`: Invalid confidence rating (must be 1, 2, or 3)
- `404`: Attempt not found

---

### Get Hint for Problem

**POST** `/practice/hint`

Request the next hint for a problem during practice. Returns hints progressively (one at a time).

**Request Body:**

```json
{
  "session_id": 123,
  "problem_id": 456
}
```

**Response (200):**

```json
{
  "hint": "Think about the relationship between variables...",
  "hint_index": 0,
  "hints_used_count": 1,
  "total_hints": 3,
  "penalty_applied": 0.1
}
```

**Response Fields:**

- `hint`: Text of the next hint
- `hint_index`: Zero-based index of this hint (0 = first hint)
- `hints_used_count`: Total number of hints used so far
- `total_hints`: Total hints available for this problem
- `penalty_applied`: Confidence penalty per hint (usually 0.1 = 10%)

**Errors:**

- `400`: Missing required fields OR all hints already used
- `404`: Session not found OR problem not found OR no hints available for this problem

**Notes:**

- Hints are revealed progressively (must request hint 1 before hint 2, etc.)
- Each hint reduces confidence boost when answer is correct
- Hint usage is tracked in ProblemAttempt when answer is submitted
- If no ProblemAttempt exists yet, first hint can still be requested

**Example Usage:**

```javascript
// Request first hint
const hint1 = await api.post("/api/practice/hint", {
  session_id: 123,
  problem_id: 456,
});
// Returns: hint_index: 0, hints_used_count: 1

// Request second hint
const hint2 = await api.post("/api/practice/hint", {
  session_id: 123,
  problem_id: 456,
});
// Returns: hint_index: 1, hints_used_count: 2

// Try to request beyond available hints
const hint4 = await api.post("/api/practice/hint", {
  session_id: 123,
  problem_id: 456,
});
// Error 400: "All hints have been used"
```

---

## Topic Extraction & Upload Routes (`/api`)

These routes enable the pipeline from uploaded documents to extracted topics and concepts.

### Upload Source Document

**POST** `/upload`

Upload a study document (PDF, DOCX, TXT, MD, image).

**Request (multipart/form-data):**

- `file`: Required

**Response (201):**

```json
{ "source_document_id": "doc_abc123" }
```

**Errors:** `400` invalid file, `422` parse failed

---

### Extract Topics from Document

**POST** `/extract-topics`

Run LLM topic extraction on an uploaded document.

**Request Body:**

```json
{ "source_document_id": "doc_abc123" }
```

**Response (200):**

```json
{
  "topics": [
    {
      "id": 101,
      "title": "Photosynthesis",
      "description": "Overview ...",
      "concepts": [
        { "id": 1001, "name": "Light Reactions", "summary": "..." },
        { "id": 1002, "name": "Calvin Cycle", "summary": "..." }
      ]
    }
  ]
}
```

---

### List Topics

**GET** `/topics`

List topics with confidence and mastery state.

**Response (200):**

```json
[
  {
    "id": 101,
    "title": "Photosynthesis",
    "confidence": 0.62,
    "mastered": false
  }
]
```

---

### Start Practice Session for Topic

**POST** `/practice/sessions`

Start a session for a single topic.

**Request Body:**

```json
{ "topic_id": 101 }
```

**Response (201):**

```json
{
  "session_id": 555,
  "problem": {
    /* see Problem type below */
  }
}
```

---

### Next Problem (Adaptive)

**POST** `/practice/{session_id}/next`

Return the next adaptively selected problem.

**Response (200):**

```json
{
  "problem": {
    /* see Problem type below */
  }
}
```

---

### Evaluate Answer

**POST** `/practice/{session_id}/evaluate`

Evaluate an answer via LLM, update confidence.

**Request Body:**

```json
{ "problem_id": 987, "user_answer": "..." }
```

**Response (200):**

```json
{
  "correct": true,
  "score": 0.9,
  "feedback": "Great explanation of the Calvin Cycle.",
  "concept_ids": [1002],
  "confidence_delta": 0.08
}
```

---

### Complete Topic (Optional)

**POST** `/topics/{topic_id}/complete`

Check mastery and finalize.

**Response (200):**

```json
{ "mastered": true, "confidence": 0.87 }
```

---

### Types

```json
// Problem
{
  "id": 987,
  "topic_id": 101,
  "type": "multiple_choice" | "short" | "long",
  "question_text": "Describe the chloroplast structure.",
  "options": ["A", "B", "C", "D"],
  "explanation": null,
  "metadata": { "difficulty": 0.5, "concept_ids": [1002] }
}
```

## Progress Routes (`/api/progress`)

### Get Progress Overview

**GET** `/progress/overview`

Get overall progress statistics.

**Response (200):**

```json
{
  "overview": {
    "total_study_guides": 3,
    "total_practice_sessions": 15,
    "completed_sessions": 12,
    "total_problems_attempted": 150,
    "total_correct_answers": 120,
    "overall_accuracy": 80.0,
    "topics_mastered": 8,
    "total_topics": 15,
    "mastery_percentage": 53.33,
    "recent_activity": {
      "sessions_last_7_days": 5,
      "problems_last_7_days": 45
    },
    "average_session_accuracy": 78.5
  }
}
```

---

### Get Guide Progress

**GET** `/progress/guide/<guide_id>`

Get progress per topic for a specific guide.

**Response (200):**

```json
{
  "guide": {
    "id": 1,
    "title": "Introduction to Python",
    ...
  },
  "progress": {
    "topics": [
      {
        "id": 1,
        "user_id": 1,
        "topic_id": 1,
        "problems_attempted": 10,
        "problems_correct": 8,
        "current_confidence": 0.85,
        "mastered": true,
        "last_practiced": "2025-12-02T10:00:00",
        "accuracy": 80.0,
        "topic": {
          "id": 1,
          "name": "Variables",
          "description": "...",
          "problem_count": 5
        }
      }
    ],
    "overall_accuracy": 75.5,
    "topics_mastered": 3,
    "total_topics": 5,
    "mastery_percentage": 60.0
  }
}
```

**Errors:**

- `404`: Guide not found

---

### Get Practice History

**GET** `/progress/history`

Get recent practice sessions.

**Query Parameters:**

- `limit`: Number of sessions (default: 10, max: 50)
- `offset`: Offset for pagination (default: 0)

**Response (200):**

```json
{
  "history": [
    {
      "id": 1,
      "user_id": 1,
      "study_guide_id": 1,
      "started_at": "2025-12-02T10:00:00",
      "ended_at": "2025-12-02T10:30:00",
      "attempt_count": 10,
      "guide": {
        "id": 1,
        "title": "Introduction to Python"
      },
      "stats": {
        "total_problems": 10,
        "correct_answers": 8,
        "accuracy": 80.0,
        "duration_minutes": 30.0
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Descriptive error message"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication token is missing"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "An error occurred"
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- File uploads limited to 16MB
- JWT tokens expire after 7 days
- Confidence ratings: 1 (low), 2 (medium), 3 (high)
- Problem weighting: Lower confidence topics appear more frequently

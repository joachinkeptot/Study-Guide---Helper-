# Database Models Migration Summary

## ✅ Successfully Created

### Models Created (7 total)

1. **User**

   - `id` (Primary Key)
   - `email` (Unique, Indexed)
   - `password_hash`
   - `created_at`
   - Relationships: study_guides, practice_sessions, topic_progress

2. **StudyGuide**

   - `id` (Primary Key)
   - `user_id` (Foreign Key → User)
   - `title`
   - `original_filename`
   - `parsed_content` (JSON)
   - `created_at`
   - Relationships: topics, practice_sessions

3. **Topic**

   - `id` (Primary Key)
   - `study_guide_id` (Foreign Key → StudyGuide)
   - `name`
   - `description`
   - `order_index`
   - Relationships: problems, topic_progress
   - Index: `(study_guide_id, order_index)`

4. **Problem**

   - `id` (Primary Key)
   - `topic_id` (Foreign Key → Topic)
   - `question_text`
   - `problem_type` (Enum: multiple_choice, short_answer, free_response)
   - `options` (JSON, nullable)
   - `correct_answer`
   - `explanation`
   - Relationships: attempts

5. **PracticeSession**

   - `id` (Primary Key)
   - `user_id` (Foreign Key → User)
   - `study_guide_id` (Foreign Key → StudyGuide)
   - `started_at`
   - `ended_at` (nullable)
   - Relationships: problem_attempts
   - Index: `(user_id, started_at)`

6. **ProblemAttempt**

   - `id` (Primary Key)
   - `session_id` (Foreign Key → PracticeSession)
   - `problem_id` (Foreign Key → Problem)
   - `user_answer`
   - `is_correct`
   - `confidence_rating` (1-3, with CHECK constraint)
   - `feedback`
   - `attempted_at`
   - Indexes: `(session_id, attempted_at)`, `(problem_id, attempted_at)`

7. **TopicProgress**
   - `id` (Primary Key)
   - `user_id` (Foreign Key → User)
   - `topic_id` (Foreign Key → Topic)
   - `problems_attempted`
   - `problems_correct`
   - `current_confidence` (0.0-1.0)
   - `mastered` (boolean)
   - `last_practiced`
   - Unique Constraint: `(user_id, topic_id)`
   - Index: `(user_id, mastered)`

## Database Features

- ✅ All foreign keys with CASCADE delete
- ✅ Strategic indexes for query performance
- ✅ JSON fields for flexible data storage
- ✅ Enum type for problem types
- ✅ CHECK constraint for confidence rating validation
- ✅ Unique constraints where needed
- ✅ Composite indexes for common queries

## API Endpoints Created

### Users (`/api/users`)

- GET `/api/users` - List all users
- GET `/api/users/<id>` - Get specific user
- POST `/api/users` - Create user (with password hashing)
- PUT `/api/users/<id>` - Update user
- DELETE `/api/users/<id>` - Delete user

### Study Guides (`/api/study-guides`)

- GET `/api/study-guides?user_id=<id>` - List guides (filtered by user)
- GET `/api/study-guides/<id>?include_topics=true` - Get guide with topics
- POST `/api/study-guides` - Create guide
- PUT `/api/study-guides/<id>` - Update guide
- DELETE `/api/study-guides/<id>` - Delete guide

### Topics (`/api/topics`)

- GET `/api/topics?study_guide_id=<id>` - List topics (filtered by guide)
- GET `/api/topics/<id>?include_problems=true` - Get topic with problems
- POST `/api/topics` - Create topic (auto-orders)
- PUT `/api/topics/<id>` - Update topic
- DELETE `/api/topics/<id>` - Delete topic

### Problems (`/api/problems`)

- GET `/api/problems?topic_id=<id>&include_answer=true` - List problems
- GET `/api/problems/<id>?include_answer=true` - Get problem
- POST `/api/problems` - Create problem (validates type)
- PUT `/api/problems/<id>` - Update problem
- DELETE `/api/problems/<id>` - Delete problem

### Practice (`/api/practice-sessions`, `/api/problem-attempts`, `/api/topic-progress`)

- GET `/api/practice-sessions?user_id=<id>` - List sessions
- GET `/api/practice-sessions/<id>?include_attempts=true` - Get session
- POST `/api/practice-sessions` - Start session
- PUT `/api/practice-sessions/<id>/end` - End session
- POST `/api/problem-attempts` - Record attempt (auto-updates progress)
- GET `/api/topic-progress?user_id=<id>&topic_id=<id>` - Get progress

## Migration File

Location: `/backend/migrations/versions/0cb828d9c9e0_initial_migration_with_all_models.py`

## Database File

Location: `/backend/app.db` (SQLite)

## Smart Features

1. **Auto-ordering**: Topics auto-assign order_index
2. **Progress tracking**: Problem attempts automatically update TopicProgress
3. **Mastery detection**: Automatically sets mastered flag based on accuracy and confidence
4. **Password security**: Uses Werkzeug password hashing
5. **Cascading deletes**: Clean data removal when parents are deleted
6. **Flexible queries**: Optional includes for nested data

## To Run the Server

```bash
cd backend
./venv/bin/python run.py
```

**Note**: Port 5000 is currently in use. To use a different port, modify `run.py`:

```python
app.run(host='0.0.0.0', port=5001)  # Change to any available port
```

Or disable AirPlay Receiver in macOS System Settings.

## Next Steps

1. Test the API endpoints using curl or Postman
2. Integrate with the frontend
3. Add authentication/authorization (JWT tokens)
4. Add file upload for study guides
5. Implement spaced repetition algorithm
6. Add analytics and reporting

---

## 🚀 Proposed Additions for Upload → Topic → Practice Pipeline

These additions align with `ARCHITECTURE.md` and extended `API_DOCUMENTATION.md`.

### New Models

8. **SourceDocument**

   - `id` (Primary Key)
   - `user_id` (Foreign Key → User)
   - `original_filename`
   - `mime_type`
   - `content_hash` (Indexed, for deduplication)
   - `text_excerpt` (Text, first N chars for preview)
   - `created_at`
   - Index: `(user_id, created_at)`

9. **KeyConcept**

   - `id` (Primary Key)
   - `topic_id` (Foreign Key → Topic)
   - `name`
   - `summary` (Text)
   - Index: `(topic_id, name)`

10. **AdaptiveProblemMeta** (optional, to track generation context)

- `id` (Primary Key)
- `problem_id` (Foreign Key → Problem)
- `generated_by` (Enum: llm|curated)
- `prompt_signature` (Text or hash)
- `target_concepts` (JSON: [concept_ids])
- `target_difficulty` (Float 0–1)
- `model_version` (String)
- Index: `(problem_id)`

11. **ConceptConfidence** (optional, per-concept tracking)

- `id` (Primary Key)
- `user_id` (Foreign Key → User)
- `concept_id` (Foreign Key → KeyConcept)
- `ema_confidence` (Float 0.0–1.0)
- `last_updated`
- Unique: `(user_id, concept_id)`

### Changes to Existing Models

- **Topic**: add `confidence_score` (Float), `mastered_at` (Datetime, nullable)
- **Problem**: add `metadata` (JSON) with `{ difficulty: float, concept_ids: [int] }`
- **ProblemAttempt**: add `hints_used_count` (Integer, default 0)

### Migration Outline

- Create tables: `source_document`, `key_concept` (+ FKs, indexes)
- Add columns: `topic.confidence_score`, `topic.mastered_at`, `problem.metadata`, `problem_attempt.hints_used_count`
- Optional tables: `adaptive_problem_meta`, `concept_confidence`

### Confidence & Mastery Logic

- Topic confidence updated via EMA after each `ProblemAttempt`
- Mastery when rolling confidence ≥ threshold (e.g., 0.85) sustained over last K attempts and coverage across concepts ≥ minimum

### Endpoint Mapping

- `POST /api/upload` → creates `SourceDocument`
- `POST /api/extract-topics` → persists `Topic` + `KeyConcept`
- `POST /api/practice/sessions` → existing, topic-based
- `POST /api/practice/{session_id}/evaluate` → updates `ProblemAttempt`, `TopicProgress`, and `Topic.confidence_score`

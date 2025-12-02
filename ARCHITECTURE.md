# Study Guide Helper — Practice Pipeline Architecture

This document outlines the end-to-end pipeline for transforming uploaded study materials into adaptive practice sessions that build topic mastery.

## High-Level Flow

1. User uploads document (PDF/notes)
2. Backend extracts raw text
3. LLM analyzes text, identifies topics and key concepts
4. Topics + concepts saved to DB
5. User starts practicing a topic
6. LLM generates problems on-the-fly for that topic
7. User answers → LLM evaluates → feedback + confidence updated
8. System prioritizes weakest topics; marks topic mastered at threshold

## Services & Responsibilities

- `frontend` (SvelteKit):
  - Upload UI, topic list, practice session UI (`ProblemDisplay.svelte`), feedback loop.
- `backend` (Flask):
  - Document ingestion & text extraction (`document_parser.py`)
  - LLM orchestration (`llm_adapter.py`)
  - Problem selection & prioritization (`problem_selector.py`)
  - REST API surface (`app/api/*.py`, `app/routes/*.py`)
  - Persistence via SQLAlchemy and Alembic migrations.

## Data Model Overview

- `User`: id, name/email, settings.
- `Topic`: id, user_id(optional), title, description, source_id, confidence_score, mastered_at.
- `KeyConcept`: id, topic_id, name, summary.
- `Problem`: id, topic_id, type (mcq/short/long), prompt, metadata (difficulty, concept_ids).
- `PracticeSession`: id, user_id, topic_id, started_at, finished_at, status.
- `Response`: id, session_id, problem_id, user_answer, evaluation, feedback, score, created_at.
- `SourceDocument`: id, user_id, filename, mime_type, text_excerpt/hash, created_at.

Confidence can be tracked per topic (and optionally per concept) with exponential moving average and mastery threshold (e.g., >= 0.85 sustained over N recent problems).

## Core API Endpoints (Proposed)

- `POST /api/upload` → upload file; returns `source_document_id`.
- `POST /api/extract-topics` → body: `source_document_id`; returns list of topics + concepts; persists.
- `GET /api/topics` → list topics with confidence/mastery flags.
- `POST /api/practice/sessions` → start a session: topic_id → returns session_id + first problem.
- `POST /api/practice/:session_id/next` → returns next problem (LLM-generated or from bank) based on weakness.
- `POST /api/practice/:session_id/evaluate` → body: problem_id, user_answer → returns evaluation + feedback; persists response and updates confidence.
- `POST /api/topics/:topic_id/complete` → optionally finish session; checks/sets mastered.

## LLM Adapter Contracts

`llm_adapter.py` should expose:

- `extract_topics(raw_text) -> List[TopicCandidate]`
  - Input: raw text string.
  - Output: topics with title, description, concepts.
- `generate_problems(topic, user_profile, recent_performance) -> List[ProblemSpec]`
  - Input: topic and signals about weak concepts/difficulty.
  - Output: 1–3 problems suitable for immediate practice.
- `evaluate_response(problem, user_answer) -> Evaluation`
  - Output: correctness, rubric feedback, concept tagging, difficulty adjustment suggestion, confidence delta.

Intermediate schemas should be simple dicts to ease JSON serialization.

## Problem Selection Logic

- Inputs: topic confidence, per-concept weak scores, recent streak, difficulty calibration.
- Strategy: prioritize lowest-confidence concepts, mix problem types, apply spaced repetition.
- Output: next problem request to LLM (or reuse curated bank when available).

## Text Extraction

- Accepts PDFs and plain text.
- For PDFs: use `pdfminer.six` or `pypdf` to extract; normalize whitespace; chunk into sections for LLM.
- Persist `SourceDocument` with a content hash to dedupe.

## Mastery Criteria

- Topic mastered when rolling confidence >= threshold (e.g., 0.85) over last K responses and minimum coverage across concepts achieved.
- Confidence update: EMA with decay, larger delta for high-quality answers; penalties for incorrect.

## Frontend Integration Points

- Upload page calls `/api/upload` then `/api/extract-topics`.
- Dashboard shows topics with `mastered`/`in-progress` states.
- Topic page: "Start Practicing" triggers session creation and renders `ProblemDisplay.svelte`.
- `ProblemDisplay.svelte`:
  - Shows prompt, captures answer, calls `/evaluate`, renders feedback, and requests `/next`.
  - Displays confidence progress and concept badges.

## Observability & Metrics

- Log LLM prompts/responses metadata (token counts, latency, model version) with privacy safeguards.
- Track per-user practice pace, time-to-mastery, topic revisit intervals.

## Future Enhancements

- Curated problem bank fallback and hybrid generation.
- Concept graphs to guide remediation.
- Multi-modal inputs (images/diagrams) and extraction.

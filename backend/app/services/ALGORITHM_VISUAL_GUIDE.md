# Spaced Repetition Algorithm - Visual Flow

## Problem Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    get_next_problem()                        │
│                                                              │
│  Input: user_id, session_id, topic_ids, exclude_ids        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Exclude problems     │
          │  from current session │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Select topic using   │
          │  weighted confidence  │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Random choice:       │
          │  New or Review?       │
          │  (30% / 70%)          │
          └─────┬────────┬────────┘
                │        │
         NEW    │        │    REVIEW
                │        │
                ▼        ▼
    ┌──────────────┐  ┌──────────────┐
    │ Get unattempt│  │ Get problem   │
    │ ed problem   │  │ with wrong    │
    │              │  │ answers       │
    └──────┬───────┘  └──────┬────────┘
           │                 │
           └────────┬────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Return (Problem,    │
         │         Topic)        │
         └──────────────────────┘
```

## Topic Selection Algorithm

```
For each topic in topic_ids:

  ┌─────────────────────────────────────────┐
  │  Get TopicProgress                      │
  └───────────────┬─────────────────────────┘
                  │
                  ▼
  ┌─────────────────────────────────────────┐
  │  Calculate base weight:                 │
  │  weight = (1 - confidence) + 0.1        │
  │                                         │
  │  Example:                               │
  │  - 0% confidence → weight = 1.1         │
  │  - 50% confidence → weight = 0.6        │
  │  - 90% confidence → weight = 0.2        │
  └───────────────┬─────────────────────────┘
                  │
                  ▼
  ┌─────────────────────────────────────────┐
  │  Apply time boost:                      │
  │  If not practiced recently,             │
  │  weight *= (1 + time_factor)           │
  │                                         │
  │  time_factor = days_since / 7          │
  │  (capped at 1.0)                       │
  └───────────────┬─────────────────────────┘
                  │
                  ▼
          Store (topic_id, weight)

┌─────────────────────────────────────────────┐
│  Weighted Random Selection                  │
│  Higher weight = higher chance              │
└─────────────────────────────────────────────┘
```

## Confidence Update Flow

```
┌─────────────────────────────────────────────────────┐
│          update_confidence()                         │
│                                                      │
│  Input: user_id, topic_id, was_correct,            │
│         user_confidence (1-3)                       │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Get/Create          │
          │  TopicProgress       │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Update counters:    │
          │  attempts++          │
          │  if correct: count++ │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Calculate change:   │
          │  ✓ → +0.15          │
          │  ✗ → -0.10          │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Apply user          │
          │  confidence weight:  │
          │  1 → ×0.7           │
          │  2 → ×1.0           │
          │  3 → ×1.3           │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Apply EMA:          │
          │  new = old + 0.3×Δ  │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Clamp to [0, 1]     │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Update mastered:    │
          │  confidence ≥ 0.75   │
          └──────────┬────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Set last_practiced  │
          │  to current time     │
          └──────────┬────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │  Return TopicProgress │
         └──────────────────────┘
```

## Example Confidence Evolution

```
User practices "Linear Algebra" topic:

Initial: confidence = 0.0 (new topic)

Attempt 1: Correct, confident (3)
  change = +0.15 × 1.3 = +0.195
  new = 0.0 + 0.3 × 0.195 = 0.0585 (5.9%)

Attempt 2: Correct, confident (3)
  change = +0.15 × 1.3 = +0.195
  new = 0.0585 + 0.3 × 0.195 = 0.1170 (11.7%)

Attempt 3: Incorrect, not confident (1)
  change = -0.10 × 0.7 = -0.07
  new = 0.1170 + 0.3 × (-0.07) = 0.0960 (9.6%)

Attempt 4: Correct, neutral (2)
  change = +0.15 × 1.0 = +0.15
  new = 0.0960 + 0.3 × 0.15 = 0.1410 (14.1%)

... continues until confidence ≥ 0.75 (mastered) ...
```

## Topic Weight Examples

```
Three topics with different states:

Topic A: "Calculus"
  confidence = 0.2 (20%)
  last_practiced = 10 days ago

  base_weight = (1 - 0.2) + 0.1 = 0.9
  time_boost = min(10/7, 1.0) = 1.0
  final_weight = 0.9 × (1 + 1.0) = 1.8  ← High priority!

Topic B: "Statistics"
  confidence = 0.5 (50%)
  last_practiced = today

  base_weight = (1 - 0.5) + 0.1 = 0.6
  time_boost = min(0/7, 1.0) = 0.0
  final_weight = 0.6 × (1 + 0.0) = 0.6

Topic C: "Algebra"
  confidence = 0.85 (85%, mastered)
  last_practiced = today

  base_weight = (1 - 0.85) + 0.1 = 0.25
  time_boost = min(0/7, 1.0) = 0.0
  final_weight = 0.25 × (1 + 0.0) = 0.25  ← Low priority

Selection probability:
  Total = 1.8 + 0.6 + 0.25 = 2.65

  Topic A: 1.8 / 2.65 = 68% chance
  Topic B: 0.6 / 2.65 = 23% chance
  Topic C: 0.25 / 2.65 = 9% chance
```

## Review Problem Scoring

```
Problem has multiple attempts:

Problem X:
  - Total attempts: 5
  - Correct: 1
  - Incorrect: 4
  - Last attempt: 3 days ago

  incorrect_score = 4 × 2.0 = 8.0
  time_factor = min(3/7, 1.0) = 0.43
  base_score = 8.0 × (1 + 0.43) = 11.4

  Never correct bonus: 0 (was correct once)
  final_score = 11.4

Problem Y:
  - Total attempts: 3
  - Correct: 0
  - Incorrect: 3
  - Last attempt: 7 days ago

  incorrect_score = 3 × 2.0 = 6.0
  time_factor = min(7/7, 1.0) = 1.0
  base_score = 6.0 × (1 + 1.0) = 12.0

  Never correct bonus: ×1.5
  final_score = 12.0 × 1.5 = 18.0  ← Higher priority!
```

## Session Flow Example

```
User starts practice session on "Calculus Study Guide"

1. Start Session
   ↓
   Creates PracticeSession record
   ↓
   GET /practice/next-problem

2. First Problem
   ↓
   get_next_problem() → Topic: "Derivatives", Problem: "What is d/dx(x²)?"
   ↓
   User answers: "2x" (correct, confidence: 3)
   ↓
   POST /practice/submit-answer
   ↓
   update_confidence() → confidence: 0% → 5.9%

3. Next Problem
   ↓
   get_next_problem() → Topic: "Integrals", Problem: "What is ∫x dx?"
   ↓
   User answers: "x²/2 + C" (correct, confidence: 2)
   ↓
   update_confidence() → confidence: 0% → 4.5%

4. Next Problem (review)
   ↓
   get_next_problem() → Topic: "Derivatives", Problem: "Find d/dx(sin x)"
   ↓
   User answers: "sin x" (incorrect, confidence: 1)
   ↓
   update_confidence() → confidence: 5.9% → 4.8%

   ... continues ...

5. End Session
   ↓
   POST /practice/end-session
   ↓
   Returns summary: 15 problems, 12 correct, 80% accuracy
```

---

This visual guide helps understand:

- ✅ How topics are selected (weighted by confidence)
- ✅ How problems are chosen (new vs review)
- ✅ How confidence evolves (EMA with user input)
- ✅ How the algorithm prioritizes weak areas
- ✅ How time affects selection probability

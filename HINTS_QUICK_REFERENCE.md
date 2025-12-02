# Hints System - Quick Reference Guide

## For Backend Developers

### Adding Hints to Problems Programmatically

```python
from app.models import Problem
from app import db

# Create problem with hints
problem = Problem(
    topic_id=1,
    question_text="What is the capital of France?",
    problem_type=ProblemType.SHORT_ANSWER,
    correct_answer="Paris",
    explanation="Paris has been the capital since...",
    hints=[
        "Think about famous European cities",
        "This city is known for the Eiffel Tower",
        "It's located in France"
    ],
    hint_penalty=0.1  # 10% reduction per hint
)
db.session.add(problem)
db.session.commit()
```

### Tracking Hints in Problem Attempts

```python
from app.models import ProblemAttempt

attempt = ProblemAttempt(
    session_id=session_id,
    problem_id=problem_id,
    user_answer=user_answer,
    is_correct=True,
    confidence_rating=2,
    hints_used=[0, 1]  # Used hints at indices 0 and 1
)
```

### API Endpoint Usage

```bash
# Get next hint
curl -X POST http://localhost:5000/api/practice/hint \
  -H "Content-Type: application/json" \
  -d '{"session_id": 123, "problem_id": 456}'

# Response
{
  "hint": "Think about the key concept...",
  "hint_index": 0,
  "hints_used_count": 1,
  "total_hints": 3,
  "penalty_applied": 0.1
}
```

## For Frontend Developers

### Component Props

**ProblemDisplay.svelte**

```javascript
<ProblemDisplay
  problem={currentProblem}
  revealedHints={["hint 1", "hint 2"]}
  isLoadingHint={false}
  disabled={false}
  on:submit={handleSubmit}
  on:requestHint={handleHintRequest}
/>
```

**FeedbackDisplay.svelte**

```javascript
<FeedbackDisplay
  feedback={{
    is_correct: true,
    explanation: "...",
    hints_used: 2, // Number of hints used
  }}
  on:next={handleNext}
/>
```

### API Integration

```javascript
import { api } from "$lib/api";

// Request a hint
async function requestHint(sessionId, problemId) {
  try {
    const response = await api.post("/api/practice/hint", {
      session_id: sessionId,
      problem_id: problemId,
    });

    // Add hint to UI
    revealedHints = [...revealedHints, response.hint];
  } catch (error) {
    if (error.message.includes("All hints have been used")) {
      // Handle all hints used
    } else if (error.message.includes("No hints available")) {
      // Handle no hints for this problem
    }
  }
}

// Submit answer with hints
async function submitAnswer(sessionId, problemId, answer, hintsUsed) {
  await api.post("/api/problem-attempts", {
    session_id: sessionId,
    problem_id: problemId,
    user_answer: answer,
    is_correct: checkAnswer(answer),
    confidence_rating: userConfidence,
    hints_used: Array.from({ length: hintsUsed }, (_, i) => i),
  });
}
```

## Database Migration

```bash
# Apply the hints migration
cd backend
flask db upgrade

# To rollback (if needed)
flask db downgrade
```

## Confidence Calculation

```python
# In problem_selector.py
def calculate_confidence_with_hints(
    base_boost: float,
    user_confidence: int,
    hints_used_count: int
) -> float:
    """
    Calculate confidence boost with hint penalty.

    Args:
        base_boost: Base confidence change (0.15 for correct, -0.10 for incorrect)
        user_confidence: User's self-reported confidence (1-3)
        hints_used_count: Number of hints used

    Returns:
        Final confidence boost/penalty
    """
    # Apply user confidence weight
    weight = USER_CONFIDENCE_WEIGHTS.get(user_confidence, 1.0)
    confidence_change = base_boost * weight

    # Apply hint penalty (only for correct answers)
    if hints_used_count > 0 and base_boost > 0:
        hint_penalty = 1.0 - (hints_used_count * 0.25)
        hint_penalty = max(0.25, hint_penalty)  # Min 25% retained
        confidence_change *= hint_penalty

    return confidence_change
```

## Common Issues & Solutions

### Issue: Hints not showing up

**Check:**

- Problem has `hints` field populated (not null or empty)
- Problem has `hint_count > 0`
- Frontend is passing correct problem object

### Issue: Hint button always disabled

**Check:**

- `isLoadingHint` is not stuck at `true`
- `revealedHints.length < problem.hint_count`
- Component is not in `disabled` state

### Issue: Hints not tracked in attempts

**Check:**

- `hints_used` array is included in POST request
- Array contains correct indices (0-based)
- Migration has been applied

### Issue: Confidence not affected by hints

**Check:**

- `hints_used` is being passed to confidence calculation
- Hint penalty logic is applied correctly
- User submitted correct answer (penalty only on correct)

## Testing Commands

```bash
# Run backend tests
cd backend
python -m pytest tests/test_problem_selector.py -v

# Test hint endpoint
curl -X POST http://localhost:5000/api/practice/hint \
  -H "Content-Type: application/json" \
  -d '{"session_id": 1, "problem_id": 1}'

# Check database
sqlite3 instance/app.db
> SELECT hints, hint_penalty FROM problems LIMIT 5;
> SELECT hints_used FROM problem_attempts LIMIT 5;
```

## Color Scheme

Hints use amber/yellow theme for visibility:

- Border: `border-amber-200`
- Background: `bg-amber-50` or `bg-amber-100`
- Text: `text-amber-700` or `text-amber-900`
- Hover: `hover:bg-amber-200`

## Keyboard Shortcuts

No keyboard shortcuts added for hints (intentional design choice):

- Hints require explicit button click
- Prevents accidental hint reveal
- Encourages thoughtful hint usage

## Performance Considerations

- Hints are loaded with problem (no extra API call)
- Hint request is lightweight (single hint returned)
- Hints tracked in memory until submission
- No polling or real-time updates needed

## Security Considerations

- Hints are only revealed one at a time
- Backend validates hint indices
- Prevents accessing hints beyond available count
- Session validation prevents cross-user hint access

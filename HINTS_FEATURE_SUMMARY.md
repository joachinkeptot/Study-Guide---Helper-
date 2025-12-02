# Hints Feature Implementation Summary

## Overview

The hints system has been successfully implemented to help students by providing progressive hints during problem-solving while tracking hint usage and adjusting confidence scores accordingly.

## Changes Made

### 1. Backend Models (`backend/app/models.py`)

#### Problem Model

- **Added Fields:**

  - `hints`: JSON array storing 2-3 progressive hints per problem
  - `hint_penalty`: Float (default 0.1) - reduces confidence score per hint used

- **Updated Methods:**
  - `to_dict()`: Added `hint_count` to show number of hints available
  - Added optional `include_hints` parameter to reveal hints when needed

#### ProblemAttempt Model

- **Added Field:**
  - `hints_used`: JSON array tracking indices of hints that were revealed

### 2. Problem Generation (`backend/app/services/llm_adapter.py`)

Updated `PROBLEM_GENERATION_PROMPT` to require 2-3 progressive hints per problem:

- **Hint 1**: Gentle nudge (e.g., "Think about the key concept involved...")
- **Hint 2**: More specific guidance (e.g., "Consider applying [formula/method]...")
- **Hint 3**: Strong hint without giving full solution (e.g., "The first step is to...")

### 3. API Endpoints (`backend/app/api/practice.py`)

#### New Endpoint: POST `/api/practice/hint`

Returns the next unused hint for the current problem.

**Request Body:**

```json
{
  "session_id": 123,
  "problem_id": 456
}
```

**Response:**

```json
{
  "hint": "Think about the relationship between...",
  "hint_index": 0,
  "hints_used_count": 1,
  "total_hints": 3,
  "penalty_applied": 0.1
}
```

**Features:**

- Tracks hints in ProblemAttempt
- Returns next hint progressively
- Prevents accessing hints beyond available count
- Returns appropriate error messages

#### Updated Endpoint: POST `/api/problem-attempts`

- Now accepts `hints_used` array in request body
- Factors hint usage into confidence calculations

### 4. Confidence Calculations

#### In `backend/app/api/practice.py`:

```python
# Apply hint penalty if hints were used
if hints_used and len(hints_used) > 0:
    hint_penalty_multiplier = 1.0 - (len(hints_used) * problem.hint_penalty)
    hint_penalty_multiplier = max(0.3, hint_penalty_multiplier)  # Min 30% boost
    confidence_score *= hint_penalty_multiplier
```

#### In `backend/app/services/problem_selector.py`:

Updated `update_confidence()` function:

- Added `hints_used_count` parameter
- Reduces confidence boost by 25% per hint used
- Maintains minimum of 25% of the original confidence boost

### 5. Frontend Components

#### ProblemDisplay Component (`frontend/src/lib/components/ProblemDisplay.svelte`)

**New Features:**

- Hints section with visual card design
- "Need a hint?" button
- Progressive hint reveal (one at a time)
- Shows count: "X of Y hints used"
- Visual indicator when hints reduce confidence score
- Amber/yellow color scheme for hints
- Disabled state when all hints used

**Props Added:**

- `revealedHints`: Array of hint strings
- `isLoadingHint`: Boolean for loading state

**Events Added:**

- `requestHint`: Dispatched when user clicks hint button

#### FeedbackDisplay Component (`frontend/src/lib/components/FeedbackDisplay.svelte`)

**New Features:**

- Displays hint usage summary after answer submission
- Shows "X hints used" with confidence adjustment note
- Amber-colored badge for visibility

**Props Updated:**

- `feedback.hints_used`: Number of hints used

#### PracticeSession Component (`frontend/src/lib/components/PracticeSession.svelte`)

**New State:**

- `revealedHints`: Tracks hints shown for current problem
- `isLoadingHint`: Loading state for hint requests

**New Methods:**

- `addHint(hint)`: Adds hint to revealed hints
- `setHintLoading(loading)`: Controls loading state
- `handleHintRequest(event)`: Handles hint button clicks

**Updated Methods:**

- `handleSubmit()`: Includes `hintsUsed` count in submission
- `handleNext()`: Resets hints for next problem
- `showProblem()`: Resets hints when showing new problem

### 6. Database Migration

Created migration: `backend/migrations/versions/add_hints_to_problems.py`

**Adds:**

- `problems.hints` (JSON, nullable)
- `problems.hint_penalty` (Float, default 0.1)
- `problem_attempts.hints_used` (JSON, nullable)

**To apply migration:**

```bash
cd backend
flask db upgrade
```

## User Experience Flow

1. **Problem Display:**

   - User sees problem with "Need a hint?" section if hints are available
   - Shows hint count available (e.g., "0 of 3 hints used")

2. **Requesting Hints:**

   - User clicks "Show Hint 1" button
   - Hint appears in amber-colored card
   - Button updates to "Show Hint 2"
   - Process repeats until all hints used

3. **Hint Impact:**

   - Each hint reduces confidence boost by 25%
   - Minimum 25% of boost is retained
   - Visual indicator shows hints affect score

4. **Answer Submission:**

   - Hints used count is included in submission
   - Confidence calculation factors in hint usage

5. **Feedback Display:**
   - Shows amber badge: "X hints used"
   - Note: "Confidence score adjusted accordingly"

## Confidence Calculation Examples

### Example 1: Correct Answer, No Hints

- Base confidence boost: +0.15
- User confidence: 3 (very confident) → weight: 1.3
- Final boost: +0.15 × 1.3 = **+0.195**

### Example 2: Correct Answer, 1 Hint Used

- Base confidence boost: +0.15
- User confidence: 3 → weight: 1.3
- Hint penalty: 1 - (1 × 0.25) = 0.75
- Final boost: +0.15 × 1.3 × 0.75 = **+0.146**

### Example 3: Correct Answer, 3 Hints Used

- Base confidence boost: +0.15
- User confidence: 2 → weight: 1.0
- Hint penalty: 1 - (3 × 0.25) = 0.25 (max penalty)
- Final boost: +0.15 × 1.0 × 0.25 = **+0.0375**

## API Integration Example

```javascript
// Request a hint
const response = await api.post("/api/practice/hint", {
  session_id: currentSessionId,
  problem_id: currentProblemId,
});

// Response contains:
// - hint: "The text of the hint"
// - hint_index: 0 (first hint)
// - hints_used_count: 1
// - total_hints: 3
// - penalty_applied: 0.1

// Submit answer with hints used
await api.post("/api/problem-attempts", {
  session_id: sessionId,
  problem_id: problemId,
  user_answer: userAnswer,
  is_correct: isCorrect,
  confidence_rating: confidence,
  hints_used: [0, 1], // Array of hint indices used
});
```

## Testing Checklist

- [ ] Generate problems with LLM - verify hints are included
- [ ] Request hints via API endpoint
- [ ] Verify progressive hint reveal (one at a time)
- [ ] Check hint tracking in ProblemAttempt
- [ ] Verify confidence penalty calculation
- [ ] Test UI hint button and display
- [ ] Verify hint count indicator
- [ ] Test "all hints used" state
- [ ] Check feedback display shows hints used
- [ ] Verify hint reset between problems
- [ ] Run database migration
- [ ] Test edge cases (no hints available, etc.)

## Configuration

Default hint penalty can be adjusted per problem:

- Stored in `problems.hint_penalty` field
- Default: 0.1 (10% reduction per hint)
- Can be customized per problem during generation

## Future Enhancements

Potential improvements for future iterations:

1. Allow hints to have different penalty weights
2. Add hint quality ratings from students
3. Track which hints are most helpful
4. Generate adaptive hints based on student's specific mistake
5. Add hint preview/teaser text
6. Implement timed hint unlocking
7. Add achievement system for solving without hints

## Notes

- Hints are optional - problems without hints work normally
- Hint penalty applies only to correct answers
- Minimum confidence boost is always retained (25%)
- Hints are reset when moving to next problem
- Frontend handles hint state locally until submission
- Backend persists hints_used in ProblemAttempt model

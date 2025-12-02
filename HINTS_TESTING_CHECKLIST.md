# Hints Feature - Testing Checklist

## Pre-Testing Setup

- [ ] Run database migration: `flask db upgrade`
- [ ] Restart backend server
- [ ] Restart frontend dev server
- [ ] Clear browser cache/storage
- [ ] Have test user account ready

## Backend Testing

### Model Tests

- [ ] Create a problem with hints programmatically
- [ ] Verify hints field accepts JSON array
- [ ] Verify hint_penalty field has default value (0.1)
- [ ] Create ProblemAttempt with hints_used array
- [ ] Verify Problem.to_dict() includes hint_count
- [ ] Verify Problem.to_dict(include_hints=True) returns hints

### API Endpoint Tests

#### GET Hint Endpoint

- [ ] Request first hint for a problem
  - Verify hint text is returned
  - Verify hint_index is 0
  - Verify hints_used_count is 1
  - Verify total_hints is correct
- [ ] Request second hint
  - Verify hint_index increments to 1
  - Verify hints_used_count is 2
- [ ] Request beyond available hints
  - Verify 400 error: "All hints have been used"
- [ ] Request hint for problem without hints
  - Verify 404 error: "No hints available"
- [ ] Request hint with invalid session_id
  - Verify 404 error: "Practice session not found"
- [ ] Request hint with invalid problem_id
  - Verify 404 error: "Problem not found"

#### Submit Answer with Hints

- [ ] Submit answer with no hints used
  - Verify hints_used is empty array in database
- [ ] Submit answer with 1 hint used
  - Verify hints_used is [0] in database
  - Verify confidence calculation applies penalty
- [ ] Submit answer with all hints used
  - Verify hints_used contains all indices
  - Verify maximum penalty is applied

### Confidence Calculation Tests

- [ ] Correct answer, no hints
  - Base boost: +0.15
  - Expected: full boost applied
- [ ] Correct answer, 1 hint (user confidence: 2)
  - Base boost: +0.15 × 1.0 (confidence weight)
  - Hint penalty: 0.75
  - Expected: +0.15 × 1.0 × 0.75 = +0.1125
- [ ] Correct answer, 3 hints (user confidence: 3)
  - Base boost: +0.15 × 1.3 (confidence weight)
  - Hint penalty: 0.25 (minimum)
  - Expected: +0.15 × 1.3 × 0.25 = +0.04875
- [ ] Incorrect answer with hints
  - Verify hint penalty NOT applied to penalty
  - Expected: -0.10 (no hint adjustment)

### Problem Generation Tests

- [ ] Generate problems using LLM adapter
- [ ] Verify each problem has 2-3 hints
- [ ] Verify hints are progressive (increasing specificity)
- [ ] Verify hints don't give away complete answer

## Frontend Testing

### ProblemDisplay Component

#### Initial State

- [ ] Problem with hints shows hint section
- [ ] Shows "0 of X hints used"
- [ ] "Show Hint 1" button is enabled
- [ ] Amber/yellow color scheme for hint section

#### Requesting Hints

- [ ] Click "Show Hint 1" button
  - Hint appears in white card
  - Button changes to "Show Hint 2"
  - Counter updates: "1 of X hints used"
  - Loading state shows during request
- [ ] Request all available hints
  - All hints displayed in separate cards
  - Button disabled when all used
  - Shows "All hints used" message

#### Error Handling

- [ ] Handle network error gracefully
- [ ] Handle "all hints used" error
- [ ] Handle "no hints available" error
- [ ] Loading state clears on error

#### Visual States

- [ ] Hint section not shown if hint_count is 0
- [ ] Disabled state when isSubmitting is true
- [ ] Loading state shows "Loading..." text

### FeedbackDisplay Component

- [ ] Shows hints used indicator when hints > 0
- [ ] Indicator shows correct count: "X hints used"
- [ ] Shows note: "Confidence score adjusted accordingly"
- [ ] Amber color scheme matches hint section
- [ ] No indicator shown when no hints used

### PracticeSession Component

#### State Management

- [ ] revealedHints array starts empty
- [ ] Hints added to array on successful request
- [ ] Hints reset when moving to next problem
- [ ] isLoadingHint state managed correctly

#### Event Handling

- [ ] Receives requestHint event from ProblemDisplay
- [ ] Dispatches requestHint to parent page
- [ ] Includes hintsUsed count in submit event
- [ ] Adds hint via addHint() method

### Practice Page Integration

#### Full Flow

- [ ] Start practice session
- [ ] Load problem with hints
- [ ] Request hint successfully
- [ ] Request multiple hints
- [ ] Submit answer with hints used
- [ ] Verify feedback shows hints used
- [ ] Move to next problem
- [ ] Verify hints reset for new problem

#### API Integration

- [ ] Hint request calls POST /api/practice/hint
- [ ] Request includes correct session_id and problem_id
- [ ] Response parsed correctly
- [ ] Hint added to component state
- [ ] Error messages displayed appropriately

## Edge Cases

### No Hints Available

- [ ] Problem with hint_count = 0
  - No hint section shown
  - Submit works normally
- [ ] Problem with null hints
  - No hint section shown
  - No errors thrown

### Rapid Clicking

- [ ] Click hint button multiple times rapidly
  - Only one request sent (button disabled)
  - No duplicate hints added

### Submit Before Hints Load

- [ ] Request hint, submit before response
  - Verify no race condition
  - Verify hints_used count is accurate

### Session Transitions

- [ ] Request hint, then end session
  - Verify no errors
- [ ] Request hint, refresh page
  - Verify state recovers correctly

### Multiple Problems

- [ ] Use hints on problem 1
- [ ] Submit and move to problem 2
- [ ] Verify problem 2 starts with 0 hints used
- [ ] Use different number of hints on problem 2
- [ ] Verify both tracked separately in database

## Database Verification

After completing practice session:

```sql
-- Check hints in problems table
SELECT id, question_text, hints, hint_penalty
FROM problems
WHERE id IN (SELECT DISTINCT problem_id FROM problem_attempts);

-- Check hints_used in attempts
SELECT id, problem_id, is_correct, hints_used, confidence_rating
FROM problem_attempts
ORDER BY attempted_at DESC
LIMIT 10;

-- Verify JSON structure
SELECT hints_used FROM problem_attempts WHERE hints_used IS NOT NULL;
```

Expected:

- [ ] hints is valid JSON array in problems
- [ ] hint_penalty is float (0.1 default)
- [ ] hints_used is valid JSON array in attempts
- [ ] hints_used contains only valid indices

## Performance Testing

- [ ] Request hints on slow connection
  - Loading state works
  - Timeout handling
- [ ] Multiple users requesting hints simultaneously
  - No race conditions
  - Correct hint tracking per user

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces hints
- [ ] Color contrast meets standards
- [ ] Focus indicators visible

## Browser Compatibility

Test in:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Regression Testing

Verify existing functionality still works:

- [ ] Problems without hints work normally
- [ ] Confidence calculations without hints unchanged
- [ ] Submit answer without requesting hints
- [ ] Session summary calculations correct
- [ ] Progress tracking accurate
- [ ] Topic mastery logic intact

## Documentation Testing

- [ ] API documentation is accurate
- [ ] Code examples work as written
- [ ] Quick reference guide is correct
- [ ] Summary document reflects implementation

## Migration Testing

- [ ] Run migration on fresh database
- [ ] Run migration on existing database with data
- [ ] Verify existing problems not affected
- [ ] Verify rollback works: `flask db downgrade`
- [ ] Re-run upgrade after rollback

## Load Testing

- [ ] Generate 100 problems with hints
- [ ] Create 50 practice sessions
- [ ] Request hints 500 times
- [ ] Monitor response times
- [ ] Check for memory leaks

## Security Testing

- [ ] Cannot access hints from different user's session
- [ ] Cannot request hints beyond available count
- [ ] SQL injection attempts fail
- [ ] XSS attempts in hint text fail
- [ ] CSRF protection works

## Success Criteria

All checkboxes must be checked, and:

- ✅ No critical bugs found
- ✅ All API endpoints respond correctly
- ✅ UI is responsive and intuitive
- ✅ Database migrations work both ways
- ✅ Documentation is complete
- ✅ Performance is acceptable (< 500ms hint requests)
- ✅ No regression in existing features

# Problem Selector Service Documentation

The problem selector service implements a spaced repetition algorithm to intelligently select practice problems for users based on their performance history and confidence levels.

## Overview

This service provides an adaptive learning experience by:

- Prioritizing topics where the user has lower confidence
- Selecting problems the user hasn't seen or got wrong previously
- Applying spaced repetition to optimize retention
- Avoiding immediate repetition of the same problems
- Tracking and updating user confidence using exponential moving average

## Configuration Constants

### `SpacedRepetitionConfig`

| Constant                       | Default                  | Description                                                                     |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------- |
| `MASTERY_THRESHOLD`            | 0.75                     | Confidence level (0-1) at which a topic is considered mastered                  |
| `EMA_ALPHA`                    | 0.3                      | Weight for new results in exponential moving average (higher = more responsive) |
| `TIME_DECAY_DAYS`              | 7                        | Number of days for time decay factor in problem selection                       |
| `NEW_PROBLEM_RATIO`            | 0.3                      | Proportion of new vs review problems (0.3 = 30% new, 70% review)                |
| `CONFIDENCE_BOOST_CORRECT`     | 0.15                     | Base confidence increase for correct answers                                    |
| `CONFIDENCE_PENALTY_INCORRECT` | 0.10                     | Base confidence decrease for incorrect answers                                  |
| `USER_CONFIDENCE_WEIGHTS`      | {1: 0.7, 2: 1.0, 3: 1.3} | Multipliers based on user's self-reported confidence (1-3 scale)                |
| `MIN_REPEAT_INTERVAL`          | 30                       | Minimum minutes before a problem can be repeated                                |

## Core Functions

### `get_next_problem(user_id, session_id, topic_ids, exclude_problem_ids=None)`

Selects the next problem for a user based on spaced repetition logic.

**Parameters:**

- `user_id` (int): ID of the user
- `session_id` (int): ID of the current practice session
- `topic_ids` (List[int]): List of topic IDs to choose from
- `exclude_problem_ids` (List[int], optional): Problem IDs to exclude from selection

**Returns:**

- `Tuple[Problem, Topic]` or `None`: Selected problem with its topic, or None if no suitable problem found

**Algorithm:**

1. Excludes problems already attempted in the current session
2. Selects a topic based on weighted confidence (lower confidence = higher priority)
3. Decides whether to select a new or review problem based on `NEW_PROBLEM_RATIO`
4. For new problems: selects problems the user has never attempted
5. For review problems: prioritizes problems the user got wrong, with time decay
6. Falls back to any available problem if specific criteria can't be met

**Example:**

```python
from app.services.problem_selector import get_next_problem

# Get next problem for user in a practice session
problem, topic = get_next_problem(
    user_id=1,
    session_id=5,
    topic_ids=[10, 11, 12]
)

if problem:
    print(f"Next problem: {problem.question_text}")
    print(f"From topic: {topic.name}")
```

### `update_confidence(user_id, topic_id, was_correct, user_confidence=None)`

Updates topic confidence using exponential moving average based on user performance.

**Parameters:**

- `user_id` (int): ID of the user
- `topic_id` (int): ID of the topic
- `was_correct` (bool): Whether the user answered correctly
- `user_confidence` (int, optional): User's self-reported confidence (1-3 scale)

**Returns:**

- `TopicProgress`: Updated topic progress record

**Algorithm:**

1. Gets or creates a TopicProgress record for the user-topic pair
2. Updates attempt and correctness counters
3. Calculates confidence change based on correctness and user confidence
4. Applies exponential moving average: `new_conf = old_conf + alpha * change`
5. Clamps confidence between 0.0 and 1.0
6. Updates mastered flag if confidence exceeds threshold
7. Records current timestamp as last_practiced

**Exponential Moving Average (EMA):**

- Formula: `EMA(t) = EMA(t-1) + α × (observation - EMA(t-1))`
- Gives more weight to recent performance while maintaining historical context
- Alpha of 0.3 means 30% weight on new result, 70% on historical average

**Example:**

```python
from app.services.problem_selector import update_confidence

# Update after a correct answer with high user confidence
progress = update_confidence(
    user_id=1,
    topic_id=10,
    was_correct=True,
    user_confidence=3  # Very confident
)

print(f"New confidence: {progress.current_confidence:.2f}")
print(f"Mastered: {progress.mastered}")
```

### `get_topic_weights(user_id, topic_ids)`

Gets the selection weights for topics (useful for debugging and visualization).

**Parameters:**

- `user_id` (int): ID of the user
- `topic_ids` (List[int]): List of topic IDs

**Returns:**

- `dict`: Mapping of topic_id to selection weight

**Example:**

```python
from app.services.problem_selector import get_topic_weights

weights = get_topic_weights(user_id=1, topic_ids=[10, 11, 12])
# Result: {10: 1.5, 11: 0.8, 12: 2.3}
```

## Internal Functions

### `_select_topic_by_confidence(user_id, topic_ids)`

Selects a topic using weighted random selection based on inverse confidence.

**Selection Logic:**

- Topics with lower confidence get higher weight
- New topics (no progress) get highest weight (2.0)
- Topics not practiced recently get time-based boost
- Uses weighted random selection, not deterministic "lowest confidence"

### `_get_new_problem(user_id, topic_id, exclude_problem_ids)`

Retrieves a problem the user has never attempted from the specified topic.

**Returns:**

- Problems the user has no attempt history for
- Random selection to provide variety

### `_get_review_problem(user_id, topic_id, exclude_problem_ids)`

Retrieves a problem for review, prioritizing incorrect answers and old attempts.

**Prioritization Factors:**

1. **Incorrect Answers:** Problems answered incorrectly get higher priority (2x weight)
2. **Never Correct:** Problems never answered correctly get extra boost (1.5x)
3. **Time Decay:** Older attempts get higher priority (based on `TIME_DECAY_DAYS`)
4. **Minimum Interval:** Problems attempted within `MIN_REPEAT_INTERVAL` are excluded

## Integration Example

Here's how to integrate the problem selector into a practice session API endpoint:

```python
from flask import Blueprint, request, jsonify
from app import db
from app.models import PracticeSession, ProblemAttempt
from app.services.problem_selector import get_next_problem, update_confidence

api = Blueprint('practice', __name__)

@api.route('/practice/next-problem', methods=['POST'])
def next_problem():
    data = request.json
    user_id = data['user_id']
    session_id = data['session_id']
    topic_ids = data['topic_ids']

    # Get next problem
    result = get_next_problem(user_id, session_id, topic_ids)

    if not result:
        return jsonify({'message': 'No more problems available'}), 404

    problem, topic = result

    return jsonify({
        'problem': problem.to_dict(),
        'topic': topic.to_dict()
    })


@api.route('/practice/submit-answer', methods=['POST'])
def submit_answer():
    data = request.json
    user_id = data['user_id']
    session_id = data['session_id']
    problem_id = data['problem_id']
    user_answer = data['user_answer']
    user_confidence = data.get('confidence_rating')  # 1-3 scale

    # Get problem and check answer
    problem = Problem.query.get(problem_id)
    is_correct = problem.correct_answer.strip().lower() == user_answer.strip().lower()

    # Record attempt
    attempt = ProblemAttempt(
        session_id=session_id,
        problem_id=problem_id,
        user_answer=user_answer,
        is_correct=is_correct,
        confidence_rating=user_confidence
    )
    db.session.add(attempt)
    db.session.commit()

    # Update confidence
    progress = update_confidence(
        user_id=user_id,
        topic_id=problem.topic_id,
        was_correct=is_correct,
        user_confidence=user_confidence
    )

    return jsonify({
        'is_correct': is_correct,
        'explanation': problem.explanation,
        'new_confidence': progress.current_confidence,
        'mastered': progress.mastered
    })
```

## Tuning the Algorithm

### Making it More Aggressive (faster mastery)

```python
SpacedRepetitionConfig.MASTERY_THRESHOLD = 0.65  # Lower threshold
SpacedRepetitionConfig.CONFIDENCE_BOOST_CORRECT = 0.20  # Larger boosts
SpacedRepetitionConfig.EMA_ALPHA = 0.4  # More responsive
```

### Making it More Conservative (slower, more thorough)

```python
SpacedRepetitionConfig.MASTERY_THRESHOLD = 0.85  # Higher threshold
SpacedRepetitionConfig.CONFIDENCE_BOOST_CORRECT = 0.10  # Smaller boosts
SpacedRepetitionConfig.EMA_ALPHA = 0.2  # Less responsive
```

### Focusing on Review

```python
SpacedRepetitionConfig.NEW_PROBLEM_RATIO = 0.1  # 10% new, 90% review
```

### Focusing on Coverage

```python
SpacedRepetitionConfig.NEW_PROBLEM_RATIO = 0.5  # 50% new, 50% review
```

## Performance Considerations

- **Database Queries:** Most functions use optimized queries with proper indexing
- **Session Exclusion:** Problems attempted in the current session are cached in memory
- **Randomization:** Uses Python's `random` module for weighted selection
- **Memory:** Minimal memory footprint, suitable for concurrent users

## Testing

Comprehensive test suite available in `tests/test_problem_selector.py`:

```bash
# Run all problem selector tests
pytest tests/test_problem_selector.py -v

# Run specific test class
pytest tests/test_problem_selector.py::TestGetNextProblem -v

# Run with coverage
pytest tests/test_problem_selector.py --cov=app.services.problem_selector
```

## Future Enhancements

Potential improvements to consider:

1. **Difficulty Levels:** Add problem difficulty and adjust selection based on user performance
2. **Learning Curves:** Track learning velocity and adapt algorithm parameters per user
3. **Topic Dependencies:** Respect prerequisite relationships between topics
4. **Session Goals:** Allow users to set session goals (e.g., "focus on weak areas")
5. **Forgetting Curve:** Implement more sophisticated time-based confidence decay
6. **A/B Testing:** Support multiple algorithm variants for experimentation
7. **Analytics:** Track algorithm effectiveness and user learning outcomes

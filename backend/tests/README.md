# Backend Tests

This directory contains the test suite for the Study Guide Helper backend.

## Running Tests

### Install test dependencies:

```bash
pip install -r requirements.txt
```

### Run all tests:

```bash
pytest
```

### Run specific test file:

```bash
pytest tests/test_problem_selector.py
```

### Run with coverage:

```bash
pytest --cov=app --cov-report=html
```

### Run specific test class or function:

```bash
pytest tests/test_problem_selector.py::TestGetNextProblem
pytest tests/test_problem_selector.py::TestGetNextProblem::test_returns_problem_from_requested_topics
```

## Test Organization

- `test_problem_selector.py` - Tests for spaced repetition and problem selection logic

## Test Database

Tests use an in-memory SQLite database (`sqlite:///:memory:`) to ensure:

- Fast test execution
- No pollution of development database
- Clean state for each test run

## Writing Tests

All tests should:

1. Use the `app` fixture for application context
2. Use the `sample_data` fixture for common test data
3. Be independent and not rely on execution order
4. Clean up after themselves (handled by fixtures)
5. Have descriptive names explaining what they test

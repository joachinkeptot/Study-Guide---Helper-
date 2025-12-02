#!/bin/bash

# Test runner script for Study Guide Helper backend

echo "========================================"
echo "Study Guide Helper - Test Runner"
echo "========================================"
echo ""

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "⚠️  Virtual environment not activated."
    echo "Attempting to activate..."
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        echo "✅ Virtual environment activated"
    elif [ -f "../.venv/bin/activate" ]; then
        source ../.venv/bin/activate
        echo "✅ Virtual environment activated"
    else
        echo "❌ Could not find virtual environment."
        echo "Please activate your virtual environment first:"
        echo "  source venv/bin/activate"
        exit 1
    fi
fi

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest not found. Installing test dependencies..."
    pip install pytest pytest-flask
fi

echo ""
echo "Running tests..."
echo ""

# Run tests based on argument
case "$1" in
    "selector")
        echo "📝 Running problem selector tests..."
        pytest tests/test_problem_selector.py -v
        ;;
    "coverage")
        echo "📊 Running tests with coverage..."
        pytest --cov=app --cov-report=term-missing --cov-report=html
        echo ""
        echo "✅ Coverage report generated in htmlcov/index.html"
        ;;
    "quick")
        echo "⚡ Running quick test (first failure stops)..."
        pytest -x
        ;;
    "verbose")
        echo "📢 Running all tests in verbose mode..."
        pytest -vv
        ;;
    *)
        echo "🧪 Running all tests..."
        pytest -v
        ;;
esac

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
fi

exit $TEST_EXIT_CODE

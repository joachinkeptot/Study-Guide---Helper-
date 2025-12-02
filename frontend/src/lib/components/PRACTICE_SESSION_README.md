# Practice Session Components Documentation

## Overview

The practice session UI provides an interactive, chat-style learning experience with keyboard shortcuts, smooth animations, and comprehensive feedback.

---

## Components

### 1. ProblemDisplay.svelte

Displays practice problems with different input types based on the problem type.

**Props:**

- `problem` - Problem object with properties:
  - `id` (number)
  - `question_text` (string)
  - `problem_type` (string) - 'multiple_choice', 'short_answer', or 'free_response'
  - `options` (any, optional) - Array of options for multiple choice
- `disabled` (boolean, default: false) - Disables input when answer is being submitted

**Features:**

- **Multiple Choice**: Radio button selection with visual feedback
- **Short Answer**: Single-line text input
- **Free Response**: Multi-line textarea
- Keyboard shortcuts:
  - `Enter` to submit (except in textarea)
  - `1-4` for multiple choice options
- Visual state management (selected, disabled, focus)
- Helpful keyboard shortcut tips

**Events:**

- `submit` - Dispatched when answer is submitted, includes `{ problemId: number, answer: string }`

**Usage:**

```svelte
<ProblemDisplay
  {problem}
  {disabled}
  on:submit={handleSubmit}
/>
```

---

### 2. FeedbackDisplay.svelte

Shows feedback after answer submission with confidence rating.

**Props:**

- `feedback` - Feedback object with properties:
  - `is_correct` (boolean)
  - `explanation` (string, optional)
  - `correct_answer` (string, optional)
  - `user_answer` (string, optional)
- `disabled` (boolean, default: false)

**Features:**

- Color-coded result (green for correct, red for incorrect)
- Answer comparison when incorrect
- Detailed explanation with highlighted section
- 3-level confidence rating with emojis:
  - 😰 Not Confident (1)
  - 😐 Somewhat Confident (2)
  - 😊 Very Confident (3)
- Keyboard shortcuts:
  - `1-3` to select confidence level
  - `Enter` to proceed to next problem

**Events:**

- `next` - Dispatched when "Next Problem" is clicked, includes `{ confidence: number }`

**Usage:**

```svelte
<FeedbackDisplay
  {feedback}
  on:next={handleNext}
/>
```

---

### 3. PracticeSession.svelte

Main container that orchestrates the practice session flow.

**Props:**

- `currentTopic` (string, default: 'General')
- `totalProblems` (number, default: 0)
- `currentProblemIndex` (number, default: 0)

**Features:**

- **Sticky Header** with:
  - Current topic display
  - Problem counter (e.g., "Problem 3 of 10")
  - Session timer (MM:SS format)
  - Progress bar
  - End Session button
- **State Management**:
  - Question state
  - Feedback state
- **Smooth Animations**: Slide-in transitions between states
- **Timer**: Auto-starts on mount, auto-stops on destroy

**Methods (Exposed):**

- `showProblem(problem)` - Display a new problem
- `showFeedback(feedback)` - Display feedback for submitted answer

**Events:**

- `submitAnswer` - Includes `{ problemId: number, answer: string }`
- `nextProblem` - Includes `{ confidence: number }`
- `endSession` - User clicked end session button

**Usage:**

```svelte
<PracticeSession
  bind:this={sessionComponent}
  {currentTopic}
  {totalProblems}
  {currentProblemIndex}
  on:submitAnswer={handleSubmit}
  on:nextProblem={handleNext}
  on:endSession={handleEnd}
/>
```

---

### 4. SessionSummary.svelte

Displays comprehensive session results when practice session ends.

**Props:**

- `summary` - Summary object with properties:
  - `total_problems` (number)
  - `correct_count` (number)
  - `time_spent` (number, optional) - in seconds
  - `topics_practiced` (string[], optional)
  - `accuracy` (number, optional) - percentage

**Features:**

- **Performance Feedback**:
  - Emoji and message based on accuracy
  - ≥80%: 🎉 "Excellent work!"
  - ≥60%: 👏 "Good progress!"
  - <60%: 💪 "Keep practicing!"
- **Stats Grid** with gradient cards:
  - Problems attempted
  - Correct answers
  - Accuracy percentage
  - Time spent
- **Animated Progress Bar**:
  - Color-coded by performance level
  - Smooth width transition
- **Topics List**: Shows all topics practiced
- **Motivational Message**: Tailored to performance level
- **Action Buttons**:
  - Continue Studying
  - Back to Dashboard

**Events:**

- `continue` - User wants to continue studying
- `dashboard` - User wants to return to dashboard

**Usage:**

```svelte
<SessionSummary
  {summary}
  on:continue={handleContinue}
  on:dashboard={handleDashboard}
/>
```

---

## Page Integration

### practice/[sessionId]/+page.svelte

Main practice session page that ties all components together.

**Flow:**

1. Load session data on mount
2. Fetch first problem
3. Display problem using `PracticeSession` → `ProblemDisplay`
4. User submits answer
5. Show feedback using `FeedbackDisplay`
6. User rates confidence
7. Load next problem (repeat 3-7)
8. When session ends, show `SessionSummary`

**API Endpoints Used:**

- `GET /api/practice/session/:id` - Load session info
- `GET /api/practice/session/:id/next` - Get next problem
- `POST /api/practice/session/:id/submit` - Submit answer
- `POST /api/practice/session/:id/confidence` - Save confidence rating (optional)
- `POST /api/practice/session/:id/end` - End session
- `GET /api/practice/session/:id/summary` - Get session summary

---

## Keyboard Shortcuts

| Key           | Action          | Context                  |
| ------------- | --------------- | ------------------------ |
| `Enter`       | Submit answer   | Short answer problems    |
| `Enter`       | Next problem    | After rating confidence  |
| `1-4`         | Select option   | Multiple choice problems |
| `1-3`         | Rate confidence | Feedback screen          |
| `Shift+Enter` | New line        | Free response textarea   |

---

## Design Features

### Visual Feedback

- ✅ Correct answers: Green border and background
- ❌ Incorrect answers: Red border and background
- 💡 Explanations: Blue informational boxes
- 🎯 Progress indicators with smooth animations

### Accessibility

- Full keyboard navigation
- Clear visual states (hover, focus, selected, disabled)
- Descriptive ARIA labels and roles
- Color-coded with icons (not color alone)

### Responsiveness

- Mobile-first design
- Sticky header stays visible while scrolling
- Responsive grid layouts
- Touch-friendly button sizes

### Animations

- Slide-in transitions between states (0.3s ease-out)
- Progress bar width transitions (1s ease-out)
- Smooth opacity changes
- No jarring state changes

---

## Chat-Style Layout

The practice session uses a conversation-style interface where:

- Problems appear as distinct cards
- Feedback slides in after submission
- History is preserved in scroll
- Visual hierarchy guides the eye
- Ample whitespace for focus

This creates a more engaging, game-like learning experience compared to traditional form layouts.

---

## Color Scheme

- **Primary**: Indigo (600/700) - Actions, progress
- **Success**: Green (500/600) - Correct answers, high performance
- **Warning**: Yellow/Amber (500/600) - Medium performance
- **Error**: Red (500/600) - Incorrect answers
- **Info**: Blue (50/800) - Explanations, tips
- **Neutral**: Gray (50-900) - Text, borders, backgrounds

---

## Performance Considerations

- Timer runs independently in component lifecycle
- Minimal re-renders with targeted state updates
- Smooth animations use CSS transitions
- Lazy problem loading (one at a time)
- Efficient event handling with proper cleanup

# Simple Study App - Streamlined Version

## What We're Building

A dead-simple study app where:

1. Enter topic → AI generates problem → Answer → Get feedback → Repeat

## Removing (Too Complex)

- ❌ Study guides / PDF uploads
- ❌ Topics system
- ❌ Practice sessions tracking
- ❌ Hints system
- ❌ Streaks & confidence scores
- ❌ Progress tracking
- ❌ User stats

## Keeping (Essential)

- ✅ Basic auth (login/register)
- ✅ Simple topic input
- ✅ AI problem generation (Claude API)
- ✅ Multiple choice questions only
- ✅ Instant feedback
- ✅ "Next problem" button

## New Simple Flow

### Page 1: Login

- Email/password
- That's it

### Page 2: Practice (Only Page Needed)

```
┌─────────────────────────────────┐
│  Topic: [Calculus Derivatives]  │  ← You type here
│         [Generate Problem]       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Question: What is d/dx of x²?  │
│                                  │
│  ○ A) 2x          ← Click one   │
│  ○ B) x²                         │
│  ○ C) 2                          │
│  ○ D) x                          │
│                                  │
│  [Submit Answer]                 │
└─────────────────────────────────┘

After submit:
┌─────────────────────────────────┐
│  ✓ Correct!                      │
│  Explanation: The power rule...  │
│                                  │
│  [Next Problem] [Change Topic]   │
└─────────────────────────────────┘
```

## Files to Create/Modify

1. `/frontend/src/routes/practice-simple/+page.svelte` - New simple practice page
2. Simplify Supabase function to just generate problems
3. Remove all other routes except login

## Supabase Function (Simplified)

```javascript
// Input: { topic: "Calculus derivatives" }
// Output: {
//   question: "What is...",
//   options: ["A", "B", "C", "D"],
//   correct: "A",
//   explanation: "..."
// }
```

## Estimated Time

- 1 hour to build
- Actually works, no bugs
- You can study tonight

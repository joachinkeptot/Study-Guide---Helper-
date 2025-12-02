# Study Guide Helper - Component Documentation

## Components Overview

This document describes the Svelte components created for the Study Guide Helper application.

## Components

### 1. FileUpload.svelte

A drag-and-drop file upload component with validation and progress tracking.

**Features:**

- Drag and drop zone for file uploads
- File type validation (PDF, TXT, DOCX, PNG, JPG, JPEG)
- File size validation (max 10MB)
- Upload progress indicator
- Error handling and display
- Accessible with proper ARIA roles

**Events:**

- `upload` - Dispatched when a file is ready to upload, includes `{ file: File, formData: FormData }`

**Usage:**

```svelte
<FileUpload on:upload={handleUpload} />
```

---

### 2. GuideCard.svelte

Displays a study guide as a card with title, stats, progress, and action buttons.

**Props:**

- `guide` - Study guide object with properties:
  - `id` (number)
  - `title` (string)
  - `created_at` (string)
  - `topic_count` (number, optional)
  - `mastery_percentage` (number, optional)

**Features:**

- Shows guide title and upload date
- Displays topic count and mastery percentage
- Color-coded progress bar (green ≥80%, yellow ≥50%, indigo <50%)
- Action buttons: Study Now, View Details, Delete
- Responsive card design with hover effects

**Events:**

- `study` - Dispatched when "Study Now" is clicked, includes `{ guideId: number }`
- `viewDetails` - Dispatched when view details is clicked, includes `{ guideId: number }`
- `delete` - Dispatched when delete is clicked (with confirmation), includes `{ guideId: number }`

**Usage:**

```svelte
<GuideCard
  {guide}
  on:study={handleStudy}
  on:viewDetails={handleViewDetails}
  on:delete={handleDelete}
/>
```

---

### 3. GuideDetail.svelte

Displays detailed information about a study guide including topics and recent sessions.

**Props:**

- `guide` - Study guide object with properties:
  - `id` (number)
  - `title` (string)
  - `topics` (array, optional) - List of topics
  - `sessions` (array, optional) - Recent practice sessions
- `loading` (boolean, default: false) - Shows loading spinner

**Features:**

- Lists all topics with individual progress bars
- Checkbox selection for individual topics or "select all"
- Shows recent practice session history (last 5)
- Back button to return to dashboard
- Start practice with selected topics or all topics
- Session status badges (Completed/In Progress)

**Events:**

- `startPractice` - Dispatched when practice is started, includes `{ guideId: number, topicIds: number[] }`
- `back` - Dispatched when back button is clicked

**Usage:**

```svelte
<GuideDetail
  {guide}
  {loading}
  on:startPractice={handleStartPractice}
  on:back={handleBack}
/>
```

---

## Dashboard Page

The main dashboard page (`/routes/dashboard/+page.svelte`) combines all three components:

**Layout:**

1. **Upload Section** (top)

   - FileUpload component for adding new study materials
   - Error display for upload failures

2. **Study Guides Grid** (middle)

   - Grid of GuideCard components (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
   - Empty state for new users with helpful guidance

3. **Detail View** (when guide is selected)
   - GuideDetail component replaces the grid view
   - Shows all topics and sessions for the selected guide

**Features:**

- Responsive grid layout
- Empty state with welcome message and feature highlights
- Loading states for data fetching
- Error handling and display
- Seamless navigation between list and detail views
- Integration with backend API endpoints

**API Integration:**

- `GET /api/study-guides` - Load all guides
- `POST /api/study-guides/upload` - Upload new document
- `GET /api/study-guides/:id` - Load guide details
- `DELETE /api/study-guides/:id` - Delete guide
- `POST /api/practice/start` - Start practice session

---

## Styling

All components use:

- **Tailwind CSS** for styling
- **Indigo** as the primary color theme
- **Responsive design** with mobile-first approach
- **Smooth transitions** for hover and state changes
- **Accessibility features** (ARIA roles, keyboard navigation)
- **Emojis** for visual enhancement (📚, 📝, 🎯, etc.)

## Responsive Breakpoints

- Mobile: < 768px (1 column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3 columns)

## Color Scheme

- **Primary**: Indigo (600/700)
- **Success**: Green (for high mastery ≥80%)
- **Warning**: Yellow (for medium mastery 50-79%)
- **Error**: Red (for errors and delete actions)
- **Neutral**: Gray (for text and borders)

# Storage Bucket Setup Instructions

## Issue: Upload Errors - "Failed to fetch"

The upload was failing because the app was trying to connect to a backend server that doesn't exist. I've updated the code to use Supabase Storage instead.

## Required: Create Storage Bucket

You need to create a storage bucket in your Supabase project:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/ybcrtgdzmziclaohvjaz/storage/buckets
2. Click **"New bucket"**
3. Set:
   - **Name**: `study-materials`
   - **Public**: OFF (unchecked)
   - **File size limit**: 10MB
   - **Allowed MIME types**: `application/pdf`, `text/plain`, `text/markdown`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg`
4. Click **"Create bucket"**
5. Click on the `study-materials` bucket
6. Go to **"Policies"** tab
7. Click **"New policy"** and add these policies:

#### Policy 1: Allow authenticated users to upload

- **Name**: Users can upload files
- **Policy definition**: Custom
- **Target roles**: `authenticated`
- **Operation**: INSERT
- **Policy**: `true` (or customize per user)

#### Policy 2: Allow authenticated users to read

- **Name**: Users can read files
- **Policy definition**: Custom
- **Target roles**: `authenticated`
- **Operation**: SELECT
- **Policy**: `true`

#### Policy 3: Allow authenticated users to delete

- **Name**: Users can delete files
- **Policy definition**: Custom
- **Target roles**: `authenticated`
- **Operation**: DELETE
- **Policy**: `true`

### Option 2: Via SQL Editor

1. Go to: https://supabase.com/dashboard/project/ybcrtgdzmziclaohvjaz/sql/new
2. Paste and run:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-materials',
  'study-materials',
  false,
  10485760,
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'study-materials');

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'study-materials');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'study-materials');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'study-materials');
```

## What Was Fixed

1. ✅ Changed file upload from backend API to Supabase Storage
2. ✅ Updated all API calls to use Supabase API instead of Flask backend
3. ✅ Added proper error logging to console
4. ✅ Files are now uploaded directly to Supabase Storage

## Testing After Setup

1. Refresh your browser at http://localhost:5173/dashboard
2. Try uploading a file (PDF, TXT, etc.)
3. Check browser console (F12) for any errors
4. The file should upload successfully and create a study guide

## Note

Currently, the app just stores the file but doesn't process it yet. To generate practice problems, you'll need to:

1. Add content processing logic
2. Set up the Claude Edge Function with your API key
3. Create topics and problems from the uploaded content

Let me know if you encounter any errors after setting up the storage bucket!

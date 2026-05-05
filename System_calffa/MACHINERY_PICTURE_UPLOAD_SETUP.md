# Machinery Picture Upload - Complete Setup Guide

## ✅ What Has Been Fixed

### Database ✅
- Column `machinery_picture` exists in `machinery_inventory` table
- Data type: VARCHAR(255) to store image file paths

### Backend API ✅
- Endpoint: `POST /api/machinery/inventory/:id/picture`
- **Important:** Now includes `verifyToken` middleware for security
- Multer file upload handler configured
- Directory: `/uploads/machinery/` auto-created
- File size limit: 10MB max
- Allowed formats: JPEG, PNG, GIF, WebP
- Old pictures auto-deleted when replaced

### Frontend ✅
- MachineryManagementPage.vue:
  - Picture preview form with "Upload Picture" button
  - Proper error handling with detailed console logs
  - Supports both new files (data URLs) and existing paths
  - Better feedback messages for success/errors

- MachineryBookingPage.vue:
  - Displays machinery pictures in machinery cards
  - Shows placeholder when no picture available

## 🚀 How to Use (Step by Step)

### Step 1: Go to Machinery Management Page
1. Login as Admin or President
2. Click "Machinery Management" in sidebar
3. You should see the list of machinery

### Step 2: Edit or Add Machinery
**To Add New Machinery:**
1. Click "Add Machinery" button
2. Fill in machinery details (Name, Type, Prices, etc.)
3. Scroll down to "📷 Machinery Picture" section
4. Click "⬆️ Upload Picture" button
5. Select an image file (JPEG, PNG, GIF, or WebP)
6. The preview should appear immediately
7. Click "Add" button to save machinery AND upload picture

**To Edit Existing Machinery:**
1. Click "Edit" button on an existing machinery
2. Form loads with all existing data
3. Scroll down to "📷 Machinery Picture" section
4. If there's already a picture, it will show in a preview
5. To change picture:
   - Click "🗑️ Remove" to remove current picture
   - Click "⬆️ Upload Picture" to select new image
   - Preview appears
6. Click "Update" button to save and upload new picture

### Step 3: Verify Picture Upload
**In Browser Console:**
1. Open Developer Tools (Press F12)
2. Go to Console tab
3. When you upload, you should see:
   ```
   🖼️ Starting picture upload for machinery: [ID]
   File: [Filename] [Size] bytes
   📤 Uploading to: /api/machinery/inventory/[ID]/picture
   ```
4. After successful upload:
   ```
   ✅ Upload successful: {
     success: true,
     machinery_picture: "/uploads/machinery/machinery-xxx.jpg"
   }
   ```

**In Network Tab:**
1. Go to Network tab
2. Upload a picture
3. Look for a request like `inventory/16/picture` (POST method)
4. Status should be 200
5. Response should show the uploaded path

### Step 4: View Picture in Booking Page
1. Switch to farmer account (non-admin)
2. Go to "🚜 Machinery Booking" page
3. Browse available machinery
4. Your uploaded pictures should appear in the machinery cards
5. Each machinery card shows a preview image (or placeholder)

## 📊 Database Values

After uploading successfully, the machinery record will have:
```json
{
  "id": 16,
  "machinery_name": "Harvester",
  "machinery_picture": "/uploads/machinery/machinery-1773029544211-507125482.jpg"
}
```

The `machinery_picture` field will contain the relative /path/to/file, not a full URL.

## 🔍 Debugging Guide

If pictures don't show, check:

1. **File Directory Exists:**
   ```
   C:\xampp\htdocs\calffa_blockchain_integrated\CALLFA\System_calffa\backend\uploads\machinery\
   ```
   Should contain uploaded files like: `machinery-1773029544211-507125482.jpg`

2. **Database Updated:**
   - Open phpMyAdmin or MySQL client
   - Query: `SELECT id, machinery_name, machinery_picture FROM machinery_inventory LIMIT 5;`
   - Should show picture paths like `/uploads/machinery/machinery-xxxxx.jpg`

3. **API Endpoint Responding:**
   - The upload endpoint should return:
   ```json
   {
     "success": true,
     "message": "Machinery picture uploaded successfully",
     "machinery_picture": "/uploads/machinery/machinery-xxxx.jpg",
     "machinery_id": 16
   }
   ```

4. **File Accessible:**
   - Open image URL in browser: `http://localhost:3000/uploads/machinery/machinery-xxxx.jpg`
   - Should display the image or show download dialog
   - Status should be 200

## 📋 Tested Components

✅ Database Schema - Column exists
✅ Backend Upload API - Tested with real file (status 200)
✅ File Storage - Files saved correctly to disk
✅ Static File Serving - Images accessible via `/uploads/` path
✅ Database Updates - Picture paths stored in machinery_picture column
✅ Frontend Form - Upload button and preview UI ready
✅ Error Handling - Console logs show detailed errors
✅ Authentication - Upload endpoint requires valid JWT token

## ⚠️ Common Issues & Solutions

**Issue: "No image uploaded"**
- Cause: Picture file not selected
- Solution: Click "⬆️ Upload Picture" button and select a file

**Issue: "File size must be less than 10MB"**
- Cause: Selected file is too large
- Solution: Compress image or select smaller file

**Issue: "Only JPEG, PNG, GIF, or WebP images are allowed"**
- Cause: Wrong file format (e.g., BMP, TIFF)
- Solution: Convert to JPG/PNG first

**Issue: Picture uploads but doesn't appear**
- Cause: Frontend API URL incorrect or CORS issue
- Solution: Check browser Network tab (should see POST request to `/api/machinery/inventory/XX/picture`)

**Issue: Console shows upload success but database is NULL**
- Cause: Database update query failed
- Solution: Check MySQL logs, verify machinery ID exists

## 🏁 Final Verification Checklist

- [ ] Created machinery with picture upload - picture appears in form
- [ ] Edited machinery - existing picture shows in preview
- [ ] Uploaded new picture - file appears in `/uploads/machinery/` directory
- [ ] Database updated - `machinery_picture` column has path
- [ ] Booking page displays picture in machinery card
- [ ] Removed picture - old file deleted, database updated to NULL
- [ ] Multiple pictures - uploaded multiple different images
- [ ] File types - tested JPG, PNG, GIF formats
- [ ] Error handling - tried uploading invalid file (saw validation error)

---

## Technical Summary

**The complete setup is now:**
1. Database column present ✅
2. Backend upload handler secured with JWT ✅
3. Directory created and writable ✅
4. Frontend form provides full UX ✅
5. Image serving configured ✅
6. Error handling and logging added ✅

**Ready for full testing!** 🎉

# Sub-strands Management Feature

## Overview

A dedicated admin interface has been added for admins, headteachers, and teachers to manage curriculum sub-strands across all learning areas.

## Features

### 1. **Dedicated Management Page**
- New "Manage Sub-strands" navigation button for:
  - Teachers
  - Headteachers
  - Deputy Headteachers
  - Superadmins

### 2. **Learning Areas Overview**
- View all learning areas in the system
- See statistics for each learning area:
  - Total number of strands
  - Total number of sub-strands
- Quick access to manage sub-strands for each learning area

### 3. **Sub-strands Management Interface**
- View all strands and sub-strands for a selected learning area
- Add new sub-strands to any strand
- Edit existing sub-strands (name, code, indicators)
- Delete sub-strands
- See indicator counts and previews

### 4. **Add Sub-strand Functionality**
- Select strand from dropdown
- Enter sub-strand code (e.g., SS1.1, SS2.3)
- Enter sub-strand name
- Add learning indicators (code and description)
- Define rubrics (4 levels with names, descriptions, and scores)

### 5. **Edit Sub-strand Functionality**
- Update sub-strand name
- Update sub-strand code
- Add/remove/edit learning indicators
- Maintain existing rubrics

## Access

### Navigation
1. Login as admin/headteacher/teacher
2. Click "Manage Sub-strands" in the navigation menu
3. Select a learning area to manage
4. View, add, edit, or delete sub-strands

### Permissions
- **Teachers**: Can manage sub-strands for all learning areas
- **Headteachers**: Can manage sub-strands for all learning areas
- **Deputy Headteachers**: Can manage sub-strands for all learning areas
- **Superadmins**: Can manage sub-strands for all learning areas

## API Endpoints

### New Endpoint
- `GET /api/substrands/learning-areas` - Get all learning areas with substrand statistics
  - Requires authentication
  - Requires role: teacher, headteacher, deputy_headteacher, or superadmin
  - Returns: Array of learning areas with strand/substrand counts

### Existing Endpoints (Used)
- `GET /api/substrands/learning-area/:id` - Get strands and sub-strands for a learning area
- `POST /api/substrands/learning-area/:learningAreaId/strand/:strandCode/substrand` - Create sub-strand
- `PUT /api/substrands/learning-area/:learningAreaId/strand/:strandCode/substrand/:subStrandCode` - Update sub-strand
- `DELETE /api/substrands/learning-area/:learningAreaId/strand/:strandCode/substrand/:subStrandCode` - Delete sub-strand

## Frontend Functions

### New Functions
- `loadManageSubstrands()` - Loads the main management page with all learning areas
- `viewLearningAreaSubstrands(learningAreaId, learningAreaName)` - Shows sub-strands for a specific learning area
- `showAddSubstrandToLearningArea(learningAreaId, learningAreaName, preselectedStrandCode)` - Opens form to add sub-strand
- `editSubstrand(learningAreaId, strandCode, subStrandCode, learningAreaName)` - Opens form to edit sub-strand
- `deleteSubstrand(learningAreaId, strandCode, subStrandCode, learningAreaName)` - Deletes a sub-strand
- `saveEditedSubstrand(e, learningAreaId, strandCode, subStrandCode)` - Saves edited sub-strand
- `addIndicatorInputEdit()` - Adds indicator input field in edit form
- `closeEditSubstrandModal()` - Closes the edit modal

### Updated Functions
- `showCreateSubstrandForm()` - Now accepts optional `preselectedStrandCode` parameter
- `saveSubstrand()` - Now handles both course view and admin page contexts

## User Interface

### Main Management Page
- Grid layout showing all learning areas
- Each card displays:
  - Learning area name and code
  - Total strands count
  - Total sub-strands count
  - "Manage Sub-strands" button

### Learning Area Detail Page
- List of all strands
- Each strand shows:
  - Strand name and code
  - All sub-strands in that strand
  - "Add Sub-strand" button per strand
  - Edit/Delete buttons per sub-strand
- Sub-strand cards show:
  - Sub-strand name and code
  - Preview of indicators (first 3, with count if more)
  - Action buttons

### Forms
- **Add Sub-strand Form**: Full form with strand selection, code, name, indicators, and rubrics
- **Edit Sub-strand Form**: Simplified form focusing on name, code, and indicators

## Usage Examples

### Adding a Sub-strand
1. Navigate to "Manage Sub-strands"
2. Click on a learning area
3. Click "Add Sub-strand" (either at top or for a specific strand)
4. Select strand (if not pre-selected)
5. Enter sub-strand code (e.g., SS1.1)
6. Enter sub-strand name
7. Add indicators (optional)
8. Define rubrics (optional)
9. Click "Create Sub-strand"

### Editing a Sub-strand
1. Navigate to "Manage Sub-strands"
2. Click on a learning area
3. Find the sub-strand to edit
4. Click "Edit" button
5. Update fields
6. Click "Save Changes"

### Deleting a Sub-strand
1. Navigate to "Manage Sub-strands"
2. Click on a learning area
3. Find the sub-strand to delete
4. Click "Delete" button
5. Confirm deletion

## Integration

This feature integrates with the existing curriculum structure:
- Sub-strands are stored in the `learning_areas.strands` JSONB column
- Changes are immediately reflected in course curriculum views
- Teachers can still add sub-strands from course views (existing functionality preserved)

## Benefits

1. **Centralized Management**: All sub-strands can be managed from one place
2. **Better Organization**: Easy to see which learning areas have sub-strands configured
3. **Quick Access**: Direct access without navigating through courses
4. **Bulk Operations**: Can manage multiple learning areas efficiently
5. **Statistics**: See at a glance how many strands and sub-strands each learning area has

## Technical Notes

- Uses existing API endpoints (no new database changes required)
- Frontend uses existing modal and form patterns
- Maintains backward compatibility with course-based sub-strand creation
- All operations require proper authentication and authorization

## Future Enhancements

Potential improvements:
- Bulk import/export of sub-strands
- Search and filter functionality
- Copy sub-strands between strands or learning areas
- Version history for sub-strand changes
- Drag-and-drop reordering of sub-strands












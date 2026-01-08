# Grade Selection System

## Overview
The system now supports multiple grades (Grade 10, Grade 11, etc.). Users must select a grade after logging in to access the system.

## What's Been Added

### 1. Database Changes
- **New Table: `grade_levels`** - Stores available grades (Grade 10, Grade 11, etc.)
- **Updated Table: `courses`** - Now includes `grade_id` to associate courses with specific grades
- **Initial Grades**: Grade 10 and Grade 11 are automatically created

### 2. Authentication Flow Changes

#### Login Process
1. User logs in with username/password
2. System returns:
   - Authentication token (without grade)
   - User information
   - List of available grades
   - Flag: `requires_grade_selection: true`

#### Grade Selection
After login, user must select a grade:
- **Endpoint**: `POST /api/auth/select-grade`
- **Body**: `{ "grade_id": 1 }`
- **Response**: New token with `grade_id` included

### 3. API Endpoints

#### Authentication Endpoints
- `GET /api/auth/grades` - Get all available grades (requires authentication)
- `POST /api/auth/select-grade` - Select a grade and get updated token
- `GET /api/auth/me` - Get current user profile (includes current grade if selected)

#### Admin Endpoints (Superadmin Only)
- `GET /api/admin/grade-levels` - Get all grades
- `GET /api/admin/grade-levels/:id` - Get specific grade
- `POST /api/admin/grade-levels` - Create new grade
- `PUT /api/admin/grade-levels/:id` - Update grade
- `DELETE /api/admin/grade-levels/:id` - Deactivate grade

### 4. Course Filtering
- Courses are automatically filtered by the selected grade
- Users only see courses for their selected grade
- This applies to all course-related endpoints

## Usage

### For Users
1. **Login**: Use existing login endpoint
2. **Select Grade**: After login, call `/api/auth/select-grade` with the desired `grade_id`
3. **Use System**: All subsequent requests will be filtered by the selected grade

### For Superadmin
1. **View Grades**: `GET /api/admin/grade-levels`
2. **Add New Grade**: 
   ```json
   POST /api/admin/grade-levels
   {
     "grade_number": 12,
     "name": "Grade 12",
     "description": "Grade 12 - Form 4 equivalent"
   }
   ```
3. **Update Grade**: `PUT /api/admin/grade-levels/:id`
4. **Deactivate Grade**: `DELETE /api/admin/grade-levels/:id`

## Example Login Flow

### Step 1: Login
```bash
POST /api/auth/login
{
  "username": "student1",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "student1",
    "email": "student1@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe"
  },
  "available_grades": [
    {
      "id": 1,
      "grade_number": 10,
      "name": "Grade 10",
      "description": "Grade 10 - Form 1 equivalent"
    },
    {
      "id": 2,
      "grade_number": 11,
      "name": "Grade 11",
      "description": "Grade 11 - Form 2 equivalent"
    }
  ],
  "requires_grade_selection": true
}
```

### Step 2: Select Grade
```bash
POST /api/auth/select-grade
Authorization: Bearer <token_from_step_1>
{
  "grade_id": 1
}
```

**Response:**
```json
{
  "message": "Grade selected successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "grade": {
    "id": 1,
    "grade_number": 10,
    "name": "Grade 10",
    "description": "Grade 10 - Form 1 equivalent"
  }
}
```

### Step 3: Use System
All subsequent API calls should use the new token from Step 2. The system will automatically filter data by the selected grade.

## Frontend Integration

The frontend should:
1. Show grade selection screen after successful login
2. Store the new token (with grade_id) after grade selection
3. Use the new token for all subsequent API calls
4. Optionally allow users to switch grades (requires new login or grade selection)

## Migration Notes

- Existing courses are automatically associated with Grade 10
- All existing data remains intact
- The system is backward compatible - if no grade is selected, courses may show all grades (depending on implementation)

## Database Schema

### grade_levels Table
```sql
CREATE TABLE grade_levels (
    id SERIAL PRIMARY KEY,
    grade_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### courses Table (Updated)
```sql
ALTER TABLE courses 
ADD COLUMN grade_id INTEGER REFERENCES grade_levels(id) ON DELETE SET NULL;
```


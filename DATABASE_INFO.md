# Database Choice: PostgreSQL

## Why PostgreSQL?

For this Grade 10 Learning Management System, **PostgreSQL** was chosen as the database solution for the following reasons:

### 1. **Relational Data Structure**
Educational systems have many interconnected relationships:
- Students enroll in multiple courses
- Courses have multiple modules, assignments, and grades
- Users have hierarchical relationships (parents → students, teachers → courses)
- Grades link students, courses, and assignments

PostgreSQL's robust relational model handles these complex relationships efficiently with foreign keys, joins, and constraints.

### 2. **ACID Compliance**
Educational data requires:
- **Atomicity**: Transactions complete fully or not at all (e.g., grade submission)
- **Consistency**: Data integrity is maintained (e.g., final grade calculations)
- **Isolation**: Concurrent operations don't interfere (multiple teachers grading simultaneously)
- **Durability**: Data is never lost (critical for academic records)

PostgreSQL provides full ACID compliance, ensuring data reliability.

### 3. **Excellent Node.js Integration**
The `pg` library (node-postgres) is:
- Well-maintained and widely used
- Supports connection pooling for performance
- Provides parameterized queries (SQL injection protection)
- Works seamlessly with async/await

### 4. **Advanced Features**
- **JSON/JSONB support**: Store flexible data (attachments, settings) alongside structured data
- **Full-text search**: Search courses, assignments, messages
- **Triggers and stored procedures**: Automate tasks (e.g., update final grades)
- **Enums**: Type-safe role definitions (student, teacher, etc.)
- **Transactions**: Complex operations (bulk attendance marking, grade calculations)

### 5. **Performance**
- Excellent query optimizer
- Indexes for fast lookups (enrollment checks, grade retrieval)
- Connection pooling handles concurrent users
- Efficient handling of complex JOIN queries

### 6. **Scalability**
- Can handle thousands of students and courses
- Supports read replicas for high-traffic scenarios
- Horizontal scaling options available
- Partitioning for large tables (attendance, messages)

### 7. **Open Source & Production-Ready**
- Free and open source
- Mature, stable, and well-tested
- Large community and extensive documentation
- Used by major companies worldwide

## Database Schema Overview

### Core Tables

1. **users** - All system users with role-based access
2. **courses** - Course/subject definitions
3. **course_enrollments** - Many-to-many relationship between students and courses
4. **learning_modules** - Customizable learning modules (created by teachers)
5. **module_content** - Documents, videos, links within modules
6. **assignments** - Assignment definitions
7. **assignment_submissions** - Student submissions
8. **attendance** - Daily attendance records
9. **grades** - Individual assignment/quiz grades
10. **final_grades** - Calculated final course grades
11. **messages** - Internal messaging system
12. **grade_scale** - Configurable letter grade scale

### Key Relationships

```
users (students) ←→ course_enrollments ←→ courses
courses ←→ learning_modules ←→ module_content
courses ←→ assignments ←→ assignment_submissions ←→ users (students)
courses + users (students) ←→ attendance
courses + users (students) ←→ grades
courses + users (students) ←→ final_grades
users (parents) ←→ parent_student_relationships ←→ users (students)
users ←→ messages (sender/recipient)
```

## Alternative Database Considerations

### MongoDB (NoSQL)
**Why not chosen:**
- Educational data is highly relational
- Need for complex joins and aggregations (grade calculations, attendance stats)
- ACID transactions required (final grade calculations)
- Data structure is well-defined, not requiring flexibility

**When MongoDB would be suitable:**
- If storing unstructured learning content
- If requirements change frequently
- If horizontal scaling is primary concern

### MySQL/MariaDB
**Why PostgreSQL over MySQL:**
- Better JSON/JSONB support (attachments stored as JSON)
- More advanced features (arrays, custom types)
- Better handling of complex queries
- Free advanced features (MySQL has paid enterprise features)
- Stronger consistency guarantees

## Performance Considerations

### Indexes
The schema includes strategic indexes on:
- User roles (faster role-based queries)
- Course enrollments (quick student-course lookups)
- Assignment due dates (filtering upcoming assignments)
- Attendance records (date-based queries)
- Message recipients (fast inbox loading)

### Connection Pooling
The application uses connection pooling (configured in `config/database.js`):
- Max 20 connections
- Prevents connection exhaustion
- Improves performance under load

### Query Optimization
- Uses parameterized queries (prevents SQL injection, allows query plan caching)
- Limits data retrieval (pagination where appropriate)
- Uses JOINs efficiently (single queries instead of multiple round trips)

## Data Integrity

### Constraints
- Foreign keys ensure referential integrity
- Unique constraints prevent duplicates (enrollments, attendance per day)
- NOT NULL constraints on required fields
- Check constraints on valid values (attendance status)

### Transactions
Used for:
- Bulk operations (bulk attendance marking)
- Final grade calculations (ensure all grades are calculated together)
- Complex updates (maintain consistency)

## Security

### SQL Injection Prevention
All queries use parameterized queries with placeholders (`$1, $2, etc.`), preventing SQL injection attacks.

### Access Control
- Database user should have limited privileges (not superuser)
- Application-level role-based access control (RBAC)
- Sensitive data (passwords) are hashed (bcrypt)

## Backup and Recovery

### Recommended Practices
1. Regular automated backups (daily recommended)
2. Transaction log archiving (point-in-time recovery)
3. Test restore procedures regularly
4. Store backups off-site

### Backup Commands
```bash
# Create backup
pg_dump -U postgres grade10_lms > backup.sql

# Restore backup
psql -U postgres grade10_lms < backup.sql
```

## Conclusion

PostgreSQL is the ideal choice for this LMS because it:
- Handles complex relational data efficiently
- Ensures data integrity for critical academic records
- Provides the features needed (JSON, transactions, advanced queries)
- Scales well as the system grows
- Integrates seamlessly with Node.js
- Is production-ready and reliable

The database design balances flexibility (teacher customization) with structure (data integrity), making it both powerful and maintainable.


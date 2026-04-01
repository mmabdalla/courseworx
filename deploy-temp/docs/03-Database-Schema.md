# CourseWorx Database Schema Documentation

## 📋 Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024-12-19
- **Author**: AI Assistant
- **Status**: Draft - Ready for Review

## 🎯 Database Overview

CourseWorx uses PostgreSQL as the primary database with Sequelize ORM for data modeling and query management. The database is designed to support a comprehensive Learning Management System with user management, course creation, content delivery, and progress tracking.

## 🗄️ Database Configuration

### Connection Settings
```javascript
{
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'courseworx',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}
```

### Environment Variables
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=courseworx
DB_USER=mabdalla
DB_PASSWORD=7ouDa-123q
```

## 📊 Core Tables

### 1. Users Table
**Purpose**: Store user authentication and profile information
**Table Name**: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique user identifier |
| `firstName` | VARCHAR(50) | NOT NULL, LENGTH(2,50) | User's first name |
| `lastName` | VARCHAR(50) | NOT NULL, LENGTH(2,50) | User's last name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, EMAIL | User's email address |
| `password` | VARCHAR(255) | NOT NULL, LENGTH(6,100) | Hashed password |
| `role` | ENUM | NOT NULL, DEFAULT 'trainee' | User role (super_admin, trainer, trainee) |
| `phone` | VARCHAR(20) | NULL | User's phone number |
| `avatar` | VARCHAR(255) | NULL | Profile picture URL |
| `isActive` | BOOLEAN | DEFAULT true | Account status |
| `lastLogin` | TIMESTAMP | NULL | Last login timestamp |
| `requiresPasswordChange` | BOOLEAN | DEFAULT false | Password change flag |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Unique: `email`
- Performance: `role`, `isActive`

**Hooks**:
- `beforeCreate`: Hash password with bcrypt
- `beforeUpdate`: Hash password if changed

**Instance Methods**:
- `comparePassword(candidatePassword)`: Compare password with hash
- `getFullName()`: Return full name string

### 2. Courses Table
**Purpose**: Store course information and metadata
**Table Name**: `courses`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique course identifier |
| `trainerId` | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| `title` | VARCHAR(200) | NOT NULL, LENGTH(3,200) | Course title |
| `description` | TEXT | NOT NULL | Course description |
| `shortDescription` | VARCHAR(500) | NULL, LENGTH(0,500) | Brief course summary |
| `thumbnail` | VARCHAR(255) | NULL | Course thumbnail image URL |
| `price` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00, MIN(0) | Course price |
| `duration` | INTEGER | NULL | Course duration in minutes |
| `level` | ENUM | NOT NULL, DEFAULT 'beginner' | Difficulty level |
| `category` | VARCHAR(100) | NULL | Course category |
| `tags` | TEXT[] | NULL, DEFAULT [] | Course tags array |
| `isPublished` | BOOLEAN | DEFAULT false | Publication status |
| `isFeatured` | BOOLEAN | DEFAULT false | Featured course flag |
| `maxStudents` | INTEGER | NULL | Maximum enrollment capacity |
| `startDate` | DATE | NULL | Course start date |
| `endDate` | DATE | NULL | Course end date |
| `requirements` | TEXT | NULL | Prerequisites |
| `learningOutcomes` | TEXT | NULL | Expected learning results |
| `curriculum` | JSONB | NULL, DEFAULT [] | Course structure |
| `rating` | DECIMAL(3,2) | NULL, MIN(0), MAX(5) | Average course rating |
| `enrollmentCount` | INTEGER | DEFAULT 0 | Current enrollment count |
| `completionCount` | INTEGER | DEFAULT 0 | Completed enrollments |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `trainerId` → `users.id`
- Performance: `isPublished`, `category`, `level`, `trainerId`

**Enums**:
- `level`: ['beginner', 'intermediate', 'advanced']

### 3. Course Sections Table
**Purpose**: Organize course content into logical sections
**Table Name**: `course_sections`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique section identifier |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `title` | VARCHAR(200) | NOT NULL | Section title |
| `description` | TEXT | NULL | Section description |
| `order` | INTEGER | NOT NULL, DEFAULT 0 | Section display order |
| `isPublished` | BOOLEAN | DEFAULT true | Publication status |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `courseId` → `courses.id`
- Performance: `courseId`, `order`

### 4. Course Content Table
**Purpose**: Store individual learning content items
**Table Name**: `course_contents`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique content identifier |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `sectionId` | UUID | NULL, FOREIGN KEY | Reference to course_sections table |
| `title` | VARCHAR(200) | NOT NULL, LENGTH(1,200) | Content title |
| `description` | TEXT | NULL | Content description |
| `type` | ENUM | NOT NULL | Content type |
| `content` | JSONB | NULL, DEFAULT {} | Content metadata |
| `fileUrl` | VARCHAR(255) | NULL | File storage URL |
| `fileSize` | INTEGER | NULL | File size in bytes |
| `fileType` | VARCHAR(50) | NULL | File MIME type |
| `duration` | INTEGER | NULL | Content duration in seconds |
| `order` | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| `isPublished` | BOOLEAN | DEFAULT true | Publication status |
| `isRequired` | BOOLEAN | DEFAULT true | Completion requirement |
| `points` | INTEGER | NULL, DEFAULT 0 | Points value |
| `quizData` | JSONB | NULL, DEFAULT {} | Quiz-specific data |
| `articleContent` | TEXT | NULL | Article text content |
| `certificateTemplate` | JSONB | NULL, DEFAULT {} | Certificate data |
| `metadata` | JSONB | NULL, DEFAULT {} | Additional metadata |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `courseId` → `courses.id`
- Foreign Key: `sectionId` → `course_sections.id`
- Performance: `courseId`, `sectionId`, `type`, `order`

**Enums**:
- `type`: ['document', 'image', 'video', 'article', 'quiz', 'certificate']

### 5. Quiz Questions Table
**Purpose**: Store quiz questions and answers
**Table Name**: `quiz_questions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique question identifier |
| `contentId` | UUID | NOT NULL, FOREIGN KEY | Reference to course_contents table |
| `question` | TEXT | NOT NULL | Question text |
| `questionType` | ENUM | NOT NULL | Question type |
| `options` | TEXT[] | NULL | Answer options array |
| `correctAnswer` | TEXT | NOT NULL | Correct answer |
| `points` | INTEGER | NOT NULL, DEFAULT 1 | Points value |
| `explanation` | TEXT | NULL | Answer explanation |
| `order` | INTEGER | NOT NULL, DEFAULT 0 | Question order |
| `isActive` | BOOLEAN | DEFAULT true | Question status |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `contentId` → `course_contents.id`
- Performance: `contentId`, `order`

**Enums**:
- `questionType`: ['single_choice', 'multiple_choice', 'true_false', 'text']

### 6. Enrollments Table
**Purpose**: Track student course enrollments
**Table Name**: `enrollments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique enrollment identifier |
| `userId` | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `status` | ENUM | NOT NULL, DEFAULT 'enrolled' | Enrollment status |
| `enrolledAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Enrollment date |
| `completedAt` | TIMESTAMP | NULL | Completion date |
| `progress` | DECIMAL(5,2) | DEFAULT 0.00 | Progress percentage |
| `grade` | VARCHAR(2) | NULL | Final grade |
| `notes` | TEXT | NULL | Admin notes |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `userId` → `users.id`
- Foreign Key: `courseId` → `courses.id`
- Performance: `userId`, `courseId`, `status`
- Unique: `userId` + `courseId` (composite)

**Enums**:
- `status`: ['enrolled', 'completed', 'dropped', 'suspended']

### 7. Lesson Completion Table
**Purpose**: Track individual content completion
**Table Name**: `lesson_completions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique completion identifier |
| `userId` | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `contentId` | UUID | NOT NULL, FOREIGN KEY | Reference to course_contents table |
| `completed` | BOOLEAN | NOT NULL, DEFAULT false | Completion status |
| `completedAt` | TIMESTAMP | NULL | Completion timestamp |
| `timeSpent` | INTEGER | NULL | Time spent in seconds |
| `score` | INTEGER | NULL | Quiz score (if applicable) |
| `attempts` | INTEGER | DEFAULT 1 | Number of attempts |
| `notes` | TEXT | NULL | User notes |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `userId` → `users.id`
- Foreign Key: `courseId` → `courses.id`
- Foreign Key: `contentId` → `course_contents.id`
- Performance: `userId`, `courseId`, `contentId`
- Unique: `userId` + `contentId` (composite)

### 8. Assignments Table
**Purpose**: Store course assignments and submissions
**Table Name**: `assignments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique assignment identifier |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `trainerId` | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| `title` | VARCHAR(200) | NOT NULL | Assignment title |
| `description` | TEXT | NOT NULL | Assignment description |
| `dueDate` | TIMESTAMP | NULL | Due date and time |
| `points` | INTEGER | NOT NULL, DEFAULT 0 | Maximum points |
| `isPublished` | BOOLEAN | DEFAULT false | Publication status |
| `allowLateSubmission` | BOOLEAN | DEFAULT false | Late submission policy |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `courseId` → `courses.id`
- Foreign Key: `trainerId` → `users.id`
- Performance: `courseId`, `trainerId`, `isPublished`

### 9. Attendance Table
**Purpose**: Track course attendance
**Table Name**: `attendance`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique attendance identifier |
| `userId` | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `sessionDate` | DATE | NOT NULL | Session date |
| `signInTime` | TIMESTAMP | NULL | Sign-in timestamp |
| `signOutTime` | TIMESTAMP | NULL | Sign-out timestamp |
| `duration` | INTEGER | NULL | Session duration in minutes |
| `status` | ENUM | NOT NULL, DEFAULT 'present' | Attendance status |
| `notes` | TEXT | NULL | Additional notes |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `userId` → `users.id`
- Foreign Key: `courseId` → `courses.id`
- Performance: `userId`, `courseId`, `sessionDate`
- Unique: `userId` + `courseId` + `sessionDate` (composite)

**Enums**:
- `status`: ['present', 'absent', 'late', 'excused']

### 10. Course Statistics Table
**Purpose**: Store aggregated course performance data
**Table Name**: `course_stats`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique stats identifier |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `totalEnrollments` | INTEGER | DEFAULT 0 | Total enrollments |
| `activeEnrollments` | INTEGER | DEFAULT 0 | Current active enrollments |
| `completedEnrollments` | INTEGER | DEFAULT 0 | Completed enrollments |
| `averageProgress` | DECIMAL(5,2) | DEFAULT 0.00 | Average progress percentage |
| `averageScore` | DECIMAL(5,2) | DEFAULT 0.00 | Average assignment score |
| `completionRate` | DECIMAL(5,2) | DEFAULT 0.00 | Course completion rate |
| `totalRevenue` | DECIMAL(10,2) | DEFAULT 0.00 | Total course revenue |
| `lastUpdated` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `courseId` → `courses.id`
- Performance: `courseId`

### 11. User Notes Table
**Purpose**: Store user personal notes and annotations
**Table Name**: `user_notes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique note identifier |
| `userId` | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| `courseId` | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| `contentId` | UUID | NULL, FOREIGN KEY | Reference to course_contents table |
| `content` | TEXT | NOT NULL | Note content |
| `isPrivate` | BOOLEAN | DEFAULT true | Note visibility |
| `tags` | TEXT[] | NULL, DEFAULT [] | Note tags |
| `createdAt` | TIMESTAMP | NOT NULL | Record creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | Record update time |

**Indexes**:
- Primary Key: `id`
- Foreign Key: `userId` → `users.id`
- Foreign Key: `courseId` → `courses.id`
- Foreign Key: `contentId` → `course_contents.id`
- Performance: `userId`, `courseId`, `contentId`

## 🔗 Database Relationships

### Entity Relationship Diagram (ERD)
```
Users (1) ←→ (Many) Courses (as Trainer)
Users (1) ←→ (Many) Enrollments (as Trainee)
Users (1) ←→ (Many) Assignments (as Trainer)
Users (1) ←→ (Many) Attendance
Users (1) ←→ (Many) LessonCompletions
Users (1) ←→ (Many) UserNotes

Courses (1) ←→ (Many) CourseSections
Courses (1) ←→ (Many) CourseContent
Courses (1) ←→ (Many) Enrollments
Courses (1) ←→ (Many) Assignments
Courses (1) ←→ (Many) Attendance
Courses (1) ←→ (Many) LessonCompletions
Courses (1) ←→ (Many) UserNotes
Courses (1) ←→ (1) CourseStats

CourseSections (1) ←→ (Many) CourseContent

CourseContent (1) ←→ (Many) QuizQuestions
CourseContent (1) ←→ (Many) LessonCompletions
CourseContent (1) ←→ (Many) UserNotes
```

### Foreign Key Constraints
```sql
-- Users relationships
ALTER TABLE courses ADD CONSTRAINT fk_courses_trainer FOREIGN KEY (trainerId) REFERENCES users(id);
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_user FOREIGN KEY (userId) REFERENCES users(id);
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_trainer FOREIGN KEY (trainerId) REFERENCES users(id);
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_user FOREIGN KEY (userId) REFERENCES users(id);
ALTER TABLE lesson_completions ADD CONSTRAINT fk_lesson_completions_user FOREIGN KEY (userId) REFERENCES users(id);
ALTER TABLE user_notes ADD CONSTRAINT fk_user_notes_user FOREIGN KEY (userId) REFERENCES users(id);

-- Course relationships
ALTER TABLE course_sections ADD CONSTRAINT fk_course_sections_course FOREIGN KEY (courseId) REFERENCES courses(id);
ALTER TABLE course_content ADD CONSTRAINT fk_course_content_course FOREIGN KEY (courseId) REFERENCES courses(id);
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_course FOREIGN KEY (courseId) REFERENCES courses(id);
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_course FOREIGN KEY (courseId) REFERENCES courses(id);
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_course FOREIGN KEY (courseId) REFERENCES courses(id);
ALTER TABLE lesson_completions ADD CONSTRAINT fk_lesson_completions_course FOREIGN KEY (courseId) REFERENCES courses(id);
ALTER TABLE user_notes ADD CONSTRAINT fk_user_notes_course FOREIGN KEY (courseId) REFERENCES courses(id);
ALTER TABLE course_stats ADD CONSTRAINT fk_course_stats_course FOREIGN KEY (courseId) REFERENCES courses(id);

-- Section relationships
ALTER TABLE course_content ADD CONSTRAINT fk_course_content_section FOREIGN KEY (sectionId) REFERENCES course_sections(id);

-- Content relationships
ALTER TABLE quiz_questions ADD CONSTRAINT fk_quiz_questions_content FOREIGN KEY (contentId) REFERENCES course_content(id);
ALTER TABLE lesson_completions ADD CONSTRAINT fk_lesson_completions_content FOREIGN KEY (contentId) REFERENCES course_content(id);
ALTER TABLE user_notes ADD CONSTRAINT fk_user_notes_content FOREIGN KEY (contentId) REFERENCES course_content(id);
```

## 📊 Database Performance

### Indexing Strategy
1. **Primary Keys**: All tables use UUID primary keys
2. **Foreign Keys**: Indexed for join performance
3. **Search Fields**: Email, course titles, user names
4. **Order Fields**: Section and content ordering
5. **Status Fields**: Publication and enrollment status

### Query Optimization
1. **Selective Queries**: Use specific field selection
2. **Pagination**: Implement LIMIT and OFFSET
3. **Eager Loading**: Use Sequelize includes for related data
4. **Database Views**: Consider for complex aggregations

### Connection Pooling
- **Max Connections**: 5 concurrent connections
- **Idle Timeout**: 10 seconds
- **Acquire Timeout**: 30 seconds

## 🔒 Data Security

### Encryption
- **Passwords**: bcrypt hashing with salt rounds 12
- **JWT Tokens**: Secure random secret keys
- **File Uploads**: Secure file type validation

### Access Control
- **Row-Level Security**: Not implemented (future consideration)
- **Column-Level Security**: Sensitive data filtering
- **Audit Logging**: Not implemented (future consideration)

### Data Validation
- **Input Sanitization**: Express-validator middleware
- **Type Validation**: Sequelize data type constraints
- **Business Logic**: Application-level validation

## 📈 Database Maintenance

### Backup Strategy
- **Daily Backups**: Automated PostgreSQL backups
- **Point-in-Time Recovery**: WAL archiving (not configured)
- **Backup Testing**: Regular restore testing required

### Monitoring
- **Connection Monitoring**: Active connection tracking
- **Query Performance**: Slow query logging (not configured)
- **Storage Monitoring**: Disk space and growth tracking

---

**Next Steps**:
1. Review and validate database schema
2. Implement proper indexing strategy
3. Add database migration scripts
4. Create database backup procedures

# CourseWorx API Contract Documentation

## 📋 Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024-12-19
- **Author**: AI Assistant
- **Status**: Draft - Ready for Review

## 🎯 API Overview

CourseWorx provides a RESTful API for course management, user administration, and learning tracking. All endpoints require authentication via JWT tokens unless explicitly marked as public.

## 🔐 Authentication

### JWT Token Format
```
Authorization: Bearer <jwt_token>
```

### Token Structure
```json
{
  "userId": "uuid",
  "iat": "issued_at_timestamp",
  "exp": "expiration_timestamp"
}
```

### Public Endpoints
- `GET /api/auth/setup-status`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `POST /api/auth/trainee-login`

## 📊 Response Format Standards

### Success Response
```json
{
  "status": "success",
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error category",
  "message": "Human-readable message",
  "details": "Technical details (dev only)"
}
```

### Pagination Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🔑 Authentication API

### Base Path: `/api/auth`

#### `GET /api/auth/setup-status`
**Description**: Check if system setup is required
**Access**: Public
**Response**:
```json
{
  "setupRequired": true,
  "superAdminCount": 0
}
```

#### `POST /api/auth/setup`
**Description**: First-time system setup
**Access**: Public (only when no super admin exists)
**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string"
}
```

#### `POST /api/auth/login`
**Description**: User authentication
**Access**: Public
**Request Body**:
```json
{
  "identifier": "email_or_phone",
  "password": "string"
}
```
**Response**:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "super_admin|trainer|trainee"
  }
}
```

#### `POST /api/auth/trainee-login`
**Description**: Trainee-specific authentication
**Access**: Public
**Request Body**:
```json
{
  "identifier": "email_or_phone",
  "password": "string"
}
```

#### `GET /api/auth/me`
**Description**: Get current user information
**Access**: Authenticated users
**Response**: User object with profile information

#### `PUT /api/auth/change-password`
**Description**: Change user password
**Access**: Authenticated users
**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

## 👥 Users API

### Base Path: `/api/users`

#### `GET /api/users`
**Description**: Get all users with pagination
**Access**: Super Admin, Trainer
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role
- `search`: Search by name or email

#### `GET /api/users/:id`
**Description**: Get user by ID
**Access**: Super Admin, Trainer, Self
**Response**: User object

#### `POST /api/users`
**Description**: Create new user
**Access**: Super Admin
**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "role": "trainer|trainee",
  "phone": "string"
}
```

#### `PUT /api/users/:id`
**Description**: Update user
**Access**: Super Admin, Self
**Request Body**: Partial user object

#### `DELETE /api/users/:id`
**Description**: Delete user
**Access**: Super Admin
**Response**: Success message

#### `POST /api/users/import`
**Description**: Bulk import users from CSV
**Access**: Super Admin
**Request**: Multipart form with CSV file

## 📚 Courses API

### Base Path: `/api/courses`

#### `GET /api/courses`
**Description**: Get all courses with filtering
**Access**: Public (limited data), Authenticated (full data)
**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `category`: Filter by category
- `level`: Filter by difficulty level
- `trainer`: Filter by trainer ID
- `published`: Filter by publication status

#### `GET /api/courses/:id`
**Description**: Get course by ID
**Access**: Public (limited data), Authenticated (full data)
**Response**: Course object with sections and content

#### `POST /api/courses`
**Description**: Create new course
**Access**: Super Admin, Trainer
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "shortDescription": "string",
  "price": "decimal",
  "level": "beginner|intermediate|advanced",
  "category": "string",
  "tags": ["string"],
  "requirements": "string",
  "learningOutcomes": "string"
}
```

#### `PUT /api/courses/:id`
**Description**: Update course
**Access**: Super Admin, Course Trainer
**Request Body**: Partial course object

#### `DELETE /api/courses/:id`
**Description**: Delete course
**Access**: Super Admin, Course Trainer
**Response**: Success message

#### `PUT /api/courses/:id/publish`
**Description**: Publish/unpublish course
**Access**: Super Admin, Course Trainer
**Request Body**:
```json
{
  "isPublished": true
}
```

#### `POST /api/courses/:courseName/image`
**Description**: Upload course image
**Access**: Super Admin, Course Trainer
**Request**: Multipart form with image file

## 🎓 Course Content API

### Base Path: `/api/course-content`

#### `GET /api/course-content/:courseId/content`
**Description**: Get all content for a course
**Access**: Authenticated users
**Query Parameters**:
- `sectionId`: Filter by section
- `type`: Filter by content type
- `published`: Filter by publication status

#### `GET /api/course-content/:courseId/content/:contentId`
**Description**: Get specific content item
**Access**: Authenticated users
**Response**: Content object with metadata

#### `POST /api/course-content/:courseId/content`
**Description**: Create new content
**Access**: Super Admin, Course Trainer
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "type": "document|image|video|article|quiz|certificate",
  "sectionId": "uuid",
  "order": "integer",
  "points": "integer",
  "isRequired": "boolean",
  "isPublished": "boolean"
}
```

#### `PUT /api/course-content/:courseId/content/:contentId`
**Description**: Update content
**Access**: Super Admin, Course Trainer
**Request Body**: Partial content object

#### `DELETE /api/course-content/:courseId/content/:contentId`
**Description**: Delete content
**Access**: Super Admin, Course Trainer

#### `POST /api/course-content/:courseId/content/:contentType/upload`
**Description**: Upload file for content
**Access**: Super Admin, Course Trainer
**Request**: Multipart form with file

## 📚 Course Sections API

### Base Path: `/api/course-sections`

#### `GET /api/course-sections/:courseId`
**Description**: Get all sections for a course
**Access**: Authenticated users
**Response**: Array of section objects

#### `POST /api/course-sections/:courseId`
**Description**: Create new section
**Access**: Super Admin, Course Trainer
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "order": "integer"
}
```

#### `PUT /api/course-sections/:sectionId`
**Description**: Update section
**Access**: Super Admin, Course Trainer
**Request Body**: Partial section object

#### `DELETE /api/course-sections/:sectionId`
**Description**: Delete section
**Access**: Super Admin, Course Trainer

## 🎓 Enrollments API

### Base Path: `/api/enrollments`

#### `GET /api/enrollments`
**Description**: Get all enrollments (admin view)
**Access**: Super Admin
**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by enrollment status
- `courseId`: Filter by course

#### `GET /api/enrollments/my`
**Description**: Get user's enrollments
**Access**: Authenticated users
**Query Parameters**:
- `status`: Filter by enrollment status

#### `POST /api/enrollments`
**Description**: Create enrollment
**Access**: Super Admin, Trainer
**Request Body**:
```json
{
  "userId": "uuid",
  "courseId": "uuid",
  "status": "enrolled|completed|dropped"
}
```

#### `PUT /api/enrollments/:id/status`
**Description**: Update enrollment status
**Access**: Super Admin, Trainer
**Request Body**:
```json
{
  "status": "enrolled|completed|dropped",
  "notes": "string"
}
```

## 📊 Lesson Completion API

### Base Path: `/api/lesson-completion`

#### `GET /api/lesson-completion/:courseId/progress`
**Description**: Get user's progress for a course
**Access**: Authenticated users
**Response**:
```json
{
  "courseId": "uuid",
  "totalContent": "integer",
  "completedContent": "integer",
  "progress": "percentage",
  "lastCompleted": "timestamp"
}
```

#### `POST /api/lesson-completion/:courseId/:contentId`
**Description**: Mark content as completed
**Access**: Authenticated users
**Request Body**:
```json
{
  "completed": true,
  "timeSpent": "integer (seconds)",
  "score": "integer (if applicable)"
}
```

## 📈 Course Statistics API

### Base Path: `/api/course-stats`

#### `GET /api/course-stats/:courseId`
**Description**: Get course statistics
**Access**: Super Admin, Course Trainer
**Response**:
```json
{
  "courseId": "uuid",
  "totalEnrollments": "integer",
  "activeEnrollments": "integer",
  "completionRate": "percentage",
  "averageScore": "decimal",
  "totalRevenue": "decimal"
}
```

## 📝 User Notes API

### Base Path: `/api/user-notes`

#### `GET /api/user-notes/:courseId`
**Description**: Get user notes for a course
**Access**: Authenticated users
**Query Parameters**:
- `userId`: User ID (for trainers viewing student notes)

#### `POST /api/user-notes/:courseId`
**Description**: Create new note
**Access**: Authenticated users
**Request Body**:
```json
{
  "content": "string",
  "contentId": "uuid (optional)",
  "isPrivate": "boolean"
}
```

## 🚨 Error Codes

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `422`: Unprocessable Entity
- `500`: Internal Server Error

### Common Error Messages
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 📱 Mobile API Considerations

### Endpoint: `/api/mobile-test`
**Description**: Mobile connectivity test
**Access**: Public
**Response**: Connection status and device information

### Mobile-Specific Headers
- `User-Agent`: Device identification
- `Accept`: Content type preferences
- `Authorization`: JWT token

## 🔄 API Versioning

### Current Version: v1
- **Base Path**: `/api`
- **Version Header**: Not currently implemented
- **Deprecation Policy**: Not currently implemented

### Future Versioning Strategy
- **URL Versioning**: `/api/v2/`
- **Header Versioning**: `Accept: application/vnd.courseworx.v2+json`
- **Backward Compatibility**: Maintain v1 for 12 months after v2 release

## 📊 API Performance

### Response Time Targets
- **Simple Queries**: < 100ms
- **Complex Queries**: < 500ms
- **File Uploads**: < 5s (depending on file size)
- **Bulk Operations**: < 10s

### Rate Limiting
- **Current**: Not implemented
- **Planned**: 100 requests per minute per user
- **File Uploads**: 10 uploads per minute per user

## 🔒 Security Considerations

### Input Validation
- **SQL Injection**: Prevented by Sequelize ORM
- **XSS**: Input sanitization required
- **File Upload**: Type and size validation
- **JWT Security**: Secure token storage and transmission

### Data Privacy
- **PII Protection**: Email and phone number encryption
- **Role-Based Access**: Strict permission controls
- **Audit Logging**: Not currently implemented

---

**Next Steps**:
1. Review and validate API contracts
2. Implement comprehensive testing
3. Add rate limiting and security headers
4. Create API documentation for developers

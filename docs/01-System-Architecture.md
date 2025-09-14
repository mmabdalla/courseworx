# CourseWorx System Architecture Documentation

## 📋 Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024-12-19
- **Author**: AI Assistant
- **Status**: Draft - Ready for Review

## 🎯 Executive Summary

CourseWorx is a comprehensive Learning Management System (LMS) built with a modern full-stack architecture. The system supports three user roles (Super Admin, Trainer, Trainee) and provides comprehensive course management, content delivery, and learning tracking capabilities.

## 🏗️ System Overview

### Architecture Pattern
- **Frontend**: Single Page Application (SPA) with React
- **Backend**: RESTful API with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based with role-based access control
- **File Storage**: Local file system with organized uploads

### Technology Stack
```
Frontend Layer:
├── React 18 (UI Framework)
├── React Router (Routing)
├── React Query (State Management)
├── Tailwind CSS (Styling)
├── Heroicons (Icon System)
└── Axios (HTTP Client)

Backend Layer:
├── Node.js (Runtime)
├── Express.js (Web Framework)
├── Sequelize (ORM)
├── JWT (Authentication)
├── bcryptjs (Security)
└── Multer (File Uploads)

Data Layer:
├── PostgreSQL (Primary Database)
├── Sequelize Models (Data Models)
└── File System (Content Storage)
```

## 🔐 Security Architecture

### Authentication Flow
1. **Login**: User credentials → bcrypt validation → JWT token generation
2. **Authorization**: JWT token → Role verification → Route access control
3. **Session Management**: Token expiration → Automatic logout → Secure storage

### Role-Based Access Control (RBAC)
```
Super Admin:
├── Full system access
├── User management
├── Course oversight
└── System configuration

Trainer:
├── Course creation/management
├── Student management
├── Content management
└── Progress tracking

Trainee:
├── Course enrollment
├── Content consumption
├── Progress tracking
└── Assignment submission
```

## 📊 Data Flow Architecture

### User Journey Flow
```
1. Authentication → JWT Token Generation
2. Role Verification → Route Access Control
3. Data Request → API Validation → Database Query
4. Response Processing → Frontend State Update
5. UI Rendering → User Interaction
```

### API Request Flow
```
Frontend → API Gateway → Route Handler → Middleware → Controller → Model → Database
Response: Database → Model → Controller → Middleware → Route Handler → API Gateway → Frontend
```

## 🗄️ Database Architecture

### Database Schema Overview
- **Users**: Authentication, roles, profiles
- **Courses**: Course metadata, structure, settings
- **CourseSections**: Course organization units
- **CourseContent**: Learning materials, files, quizzes
- **Enrollments**: Student-course relationships
- **LessonCompletion**: Progress tracking
- **Assignments**: Task management
- **Attendance**: Session tracking
- **UserNotes**: Personal annotations

### Data Relationships
```
User (1) ←→ (Many) Course (as Trainer)
User (1) ←→ (Many) Enrollment (as Trainee)
Course (1) ←→ (Many) CourseSection
CourseSection (1) ←→ (Many) CourseContent
Course (1) ←→ (Many) CourseContent
User (1) ←→ (Many) LessonCompletion
CourseContent (1) ←→ (Many) LessonCompletion
```

## 🚀 Performance Architecture

### Caching Strategy
- **Frontend**: React Query for API response caching
- **Backend**: No current caching implementation
- **Database**: PostgreSQL query optimization

### Scalability Considerations
- **Horizontal Scaling**: Stateless API design
- **Database Scaling**: Connection pooling, query optimization
- **File Storage**: Organized directory structure for scalability

## 🔧 Configuration Management

### Environment Variables
```
Server Configuration:
├── PORT (Server port)
├── NODE_ENV (Environment)
└── CORS_ORIGIN (Allowed origins)

Database Configuration:
├── DB_HOST (Database host)
├── DB_PORT (Database port)
├── DB_NAME (Database name)
├── DB_USER (Database user)
└── DB_PASSWORD (Database password)

Security Configuration:
├── JWT_SECRET (JWT signing key)
└── JWT_EXPIRES_IN (Token expiration)
```

## 📱 Frontend Architecture

### Component Structure
```
App.js
├── AuthProvider (Context)
├── Routes
│   ├── Public Routes
│   └── Private Routes
│       ├── Layout Component
│       └── Page Components
└── Global State Management
```

### State Management
- **React Context**: Authentication state
- **React Query**: Server state management
- **Local State**: Component-specific state
- **URL State**: Route parameters and query strings

## 🔌 Backend Architecture

### API Structure
```
/api
├── /auth (Authentication)
├── /users (User management)
├── /courses (Course management)
├── /course-content (Content management)
├── /course-sections (Section management)
├── /enrollments (Enrollment management)
├── /attendance (Attendance tracking)
├── /assignments (Assignment management)
├── /lesson-completion (Progress tracking)
├── /course-stats (Statistics)
└── /user-notes (Personal notes)
```

### Middleware Stack
```
Request → CORS → Helmet → JSON Parser → Route Handler → Error Handler → Response
```

## 🚨 Critical Issues Identified

### 1. Large Components
- **CourseContent.js**: 1736 lines - Needs immediate refactoring
- **CourseContentViewer.js**: 835 lines - Should be split
- **Users.js**: 496 lines - Mixed concerns

### 2. No Testing Infrastructure
- **Unit Tests**: Not implemented
- **Integration Tests**: Not implemented
- **API Tests**: Not implemented
- **End-to-End Tests**: Not implemented

### 3. Documentation Gaps
- **API Documentation**: Incomplete
- **Component Documentation**: Missing
- **Development Guidelines**: Not established

### 4. Security Concerns
- **Input Validation**: Inconsistent implementation
- **File Upload Security**: Basic validation only
- **Error Handling**: Exposes internal details

## 🔮 Future Architecture Considerations

### Planned Improvements
1. **Microservices**: Break down monolithic API
2. **Message Queue**: Async processing for file uploads
3. **CDN Integration**: Content delivery optimization
4. **Real-time Features**: WebSocket for live updates
5. **Mobile App**: React Native or Flutter

### Technical Debt
1. **Large Components**: Immediate refactoring needed
2. **Testing Infrastructure**: Critical missing piece
3. **Documentation**: Limited technical documentation
4. **Code Quality**: Mixed concerns in components

---

**Next Steps**: 
1. Review and validate this architecture document
2. Create detailed API documentation
3. Establish testing infrastructure
4. Implement development workflow improvements

# CourseWorx - Course Management Platform

A comprehensive full-stack course management application built with React, Node.js, and PostgreSQL. CourseWorx enables trainers to create and manage courses while trainees can enroll, track attendance, and complete assignments.

## 🚀 Features

### For Super Admins
- **User Management**: Create and manage trainers and trainees
- **System Overview**: View comprehensive statistics and system health
- **Course Oversight**: Monitor all courses and their performance
- **Dashboard**: Real-time insights into platform usage

### For Trainers
- **Course Creation**: Create and manage courses with rich content
- **Student Management**: Track student enrollments and progress
- **Assignment Management**: Create and grade assignments
- **Attendance Tracking**: Monitor student attendance
- **Content Management**: Add course materials and curriculum

### For Trainees
- **Course Discovery**: Browse and enroll in available courses
- **Progress Tracking**: Monitor course progress and completion
- **Attendance Management**: Sign in/out for course sessions
- **Assignment Submission**: Complete and submit assignments
- **Personal Dashboard**: View enrolled courses and statistics

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client
- **Heroicons** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Sequelize** - ORM for database management
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CourseWorx
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

1. **Create PostgreSQL Database**
   ```sql
   CREATE DATABASE courseworx;
   ```

2. **Configure Environment Variables**
   ```bash
   cd backend
   cp env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=courseworx
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. **Setup Database and Create Default Users**
   ```bash
   cd backend
   npm run setup-db
   ```

### 4. Start the Application

#### Development Mode
```bash
# From the root directory
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000) servers.

#### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start
```

## 👥 Default Users

After running the database setup, you can login with these default accounts:

### Super Admin
- **Email**: admin@courseworx.com
- **Password**: admin123

### Trainer
- **Email**: trainer@courseworx.com
- **Password**: trainer123

### Trainee
- **Email**: trainee@courseworx.com
- **Password**: trainee123

## 📁 Project Structure

```
CourseWorx/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Database configuration
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── scripts/            # Database setup scripts
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.js          # Main app component
│   └── public/             # Static assets
├── package.json            # Root package.json
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Users (Super Admin Only)
- `GET /api/users` - Get all users
- `POST /api/auth/register` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments/my` - Get user enrollments
- `PUT /api/enrollments/:id/status` - Update enrollment status

### Attendance
- `POST /api/attendance/sign-in` - Sign in for session
- `POST /api/attendance/sign-out` - Sign out from session
- `GET /api/attendance/my` - Get attendance history

### Assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/course/:courseId` - Get course assignments
- `PUT /api/assignments/:id` - Update assignment

## 🎨 UI Components

The application uses a consistent design system with:

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Built-in theme support
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Server-side validation with express-validator
- **CORS Protection**: Configured CORS for security
- **Helmet**: Security headers middleware

## 🚀 Deployment

### Backend Deployment
1. Set up a PostgreSQL database
2. Configure environment variables
3. Run `npm install` and `npm start`

### Frontend Deployment
1. Run `npm run build`
2. Serve the `build` folder with a web server
3. Configure API proxy or CORS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify database connection
3. Ensure all environment variables are set
4. Check if all dependencies are installed

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Video conferencing integration
- [ ] Payment gateway integration
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] File upload system
- [ ] Email notifications

---

**CourseWorx** - Empowering education through technology 
# CourseWorx - Course Management Platform

A comprehensive full-stack course management application built with React, Node.js, and PostgreSQL. CourseWorx enables trainers to create and manage courses while trainees can enroll, track attendance, and complete assignments.

## ⚡ Quick Installation

```bash
# Clone the repository
git clone https://github.com/mmabdalla/courseworx.git
cd courseworx

# Install all dependencies
npm run install-all

# Setup database (requires PostgreSQL)
cd backend
cp env.example .env
# Edit .env with your database credentials
npm run setup-db

# Start the application
cd ..
npm run dev
```

**Access the app at:** `http://localhost:3000`

**Default login credentials:**
- Super Admin: `admin@courseworx.com` / `admin123`
- Trainer: `trainer@courseworx.com` / `trainer123`
- Trainee: `trainee@courseworx.com` / `trainee123`

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

## 🚀 Installation & Setup

### Prerequisites

Before installing CourseWorx, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/mmabdalla/courseworx.git
cd courseworx
```

### Step 2: Install Dependencies

#### Option A: Install All Dependencies at Once
```bash
npm run install-all
```

#### Option B: Install Dependencies Manually
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 3: Database Setup

#### 3.1 Create PostgreSQL Database

1. **Open PostgreSQL command line or pgAdmin**
2. **Create the database:**
   ```sql
   CREATE DATABASE courseworx;
   ```

#### 3.2 Configure Environment Variables

1. **Copy the environment template:**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edit the `.env` file with your database credentials:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=courseworx
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

#### 3.3 Initialize Database and Create Default Users

```bash
cd backend
npm run setup-db
```

This will:
- Create all database tables
- Set up relationships between models
- Create default users (Super Admin, Trainer, Trainee)

### Step 4: Start the Application

#### Development Mode (Recommended for first-time setup)

```bash
# From the root directory
npm run dev
```

This command will:
- Start the backend server on port 5000
- Start the frontend development server on port 3000
- Open the application in your browser at `http://localhost:3000`

#### Alternative: Start Services Separately

```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm start
```

### Step 5: Access the Application

1. **Open your browser** and go to `http://localhost:3000`
2. **Login with default credentials:**

   **Super Admin:**
   - Email: `admin@courseworx.com`
   - Password: `admin123`

   **Trainer:**
   - Email: `trainer@courseworx.com`
   - Password: `trainer123`

   **Trainee:**
   - Email: `trainee@courseworx.com`
   - Password: `trainee123`

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Ensure PostgreSQL is running
- Check your database credentials in `.env`
- Verify the database `courseworx` exists

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
- Change the port in `.env` file
- Or kill the process using the port

#### 3. Node Modules Not Found
```
Error: Cannot find module 'express'
```
**Solution:**
- Run `npm install` in the respective directory
- Or run `npm run install-all` from root

#### 4. Frontend Build Errors
```
Error: Module not found
```
**Solution:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if all dependencies are properly installed

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | localhost | Yes |
| `DB_PORT` | PostgreSQL port | 5432 | Yes |
| `DB_NAME` | Database name | courseworx | Yes |
| `DB_USER` | Database username | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d | No |
| `PORT` | Backend server port | 5000 | No |
| `NODE_ENV` | Environment mode | development | No |

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
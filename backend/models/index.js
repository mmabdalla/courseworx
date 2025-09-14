const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Attendance = require('./Attendance');
const Assignment = require('./Assignment');
const CourseContent = require('./CourseContent');
const CourseSection = require('./CourseSection');
const QuizQuestion = require('./QuizQuestion');
const LessonCompletion = require('./LessonCompletion');
const ClassroomSession = require('./ClassroomSession');
const AttendanceRecord = require('./AttendanceRecord');

// Initialize models that use the factory pattern
const { sequelize } = require('../config/database');
const CourseStats = require('./CourseStats')(sequelize);
const UserNotes = require('./UserNotes')(sequelize);

// User associations
User.hasMany(Course, { as: 'createdCourses', foreignKey: 'trainerId' });
User.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'userId' });
User.hasMany(Attendance, { as: 'attendance', foreignKey: 'userId' });
User.hasMany(Assignment, { as: 'createdAssignments', foreignKey: 'trainerId' });
User.hasMany(LessonCompletion, { as: 'lessonCompletions', foreignKey: 'userId' });
User.hasMany(UserNotes, { as: 'notes', foreignKey: 'userId' });

// Course associations
Course.belongsTo(User, { as: 'trainer', foreignKey: 'trainerId' });
Course.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'courseId' });
Course.hasMany(Attendance, { as: 'attendance', foreignKey: 'courseId' });
Course.hasMany(Assignment, { as: 'assignments', foreignKey: 'courseId' });
Course.hasMany(CourseSection, { as: 'sections', foreignKey: 'courseId' });
Course.hasMany(LessonCompletion, { as: 'lessonCompletions', foreignKey: 'courseId' });
Course.hasOne(CourseStats, { as: 'stats', foreignKey: 'courseId' });
Course.hasMany(UserNotes, { as: 'notes', foreignKey: 'courseId' });

// Course Section associations
CourseSection.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
CourseSection.hasMany(CourseContent, { as: 'contents', foreignKey: 'sectionId' });

// Enrollment associations
Enrollment.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Enrollment.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });

// Attendance associations
Attendance.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Attendance.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });

// Assignment associations
Assignment.belongsTo(User, { as: 'trainer', foreignKey: 'trainerId' });
Assignment.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });

// Course Content associations
Course.hasMany(CourseContent, { as: 'contents', foreignKey: 'courseId' });
CourseContent.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
CourseContent.belongsTo(CourseSection, { as: 'section', foreignKey: 'sectionId' });
CourseContent.hasMany(LessonCompletion, { as: 'lessonCompletions', foreignKey: 'contentId' });

// Quiz Question associations
CourseContent.hasMany(QuizQuestion, { as: 'questions', foreignKey: 'contentId' });
QuizQuestion.belongsTo(CourseContent, { as: 'content', foreignKey: 'contentId' });

// Lesson Completion associations
LessonCompletion.belongsTo(User, { as: 'user', foreignKey: 'userId' });
LessonCompletion.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
LessonCompletion.belongsTo(CourseContent, { as: 'content', foreignKey: 'contentId' });

// Course Stats associations
CourseStats.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });

// User Notes associations
UserNotes.belongsTo(User, { as: 'user', foreignKey: 'userId' });
UserNotes.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
UserNotes.belongsTo(CourseContent, { as: 'content', foreignKey: 'contentId' });

// Classroom Session associations
ClassroomSession.belongsTo(Course, { as: 'Course', foreignKey: 'courseId' });
Course.hasMany(ClassroomSession, { as: 'sessions', foreignKey: 'courseId' });

// Attendance Record associations
AttendanceRecord.belongsTo(ClassroomSession, { as: 'ClassroomSession', foreignKey: 'sessionId' });
AttendanceRecord.belongsTo(User, { as: 'User', foreignKey: 'traineeId' });
ClassroomSession.hasMany(AttendanceRecord, { as: 'attendance', foreignKey: 'sessionId' });
User.hasMany(AttendanceRecord, { as: 'attendanceRecords', foreignKey: 'traineeId' });

module.exports = {
  User,
  Course,
  Enrollment,
  Attendance,
  Assignment,
  CourseContent,
  CourseSection,
  QuizQuestion,
  LessonCompletion,
  CourseStats,
  UserNotes,
  ClassroomSession,
  AttendanceRecord
}; 
const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Attendance = require('./Attendance');
const Assignment = require('./Assignment');
const CourseContent = require('./CourseContent');
const QuizQuestion = require('./QuizQuestion');

// User associations
User.hasMany(Course, { as: 'createdCourses', foreignKey: 'trainerId' });
User.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'userId' });
User.hasMany(Attendance, { as: 'attendance', foreignKey: 'userId' });
User.hasMany(Assignment, { as: 'createdAssignments', foreignKey: 'trainerId' });

// Course associations
Course.belongsTo(User, { as: 'trainer', foreignKey: 'trainerId' });
Course.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'courseId' });
Course.hasMany(Attendance, { as: 'attendance', foreignKey: 'courseId' });
Course.hasMany(Assignment, { as: 'assignments', foreignKey: 'courseId' });

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

// Quiz Question associations
CourseContent.hasMany(QuizQuestion, { as: 'questions', foreignKey: 'contentId' });
QuizQuestion.belongsTo(CourseContent, { as: 'content', foreignKey: 'contentId' });

module.exports = {
  User,
  Course,
  Enrollment,
  Attendance,
  Assignment,
  CourseContent,
  QuizQuestion
}; 
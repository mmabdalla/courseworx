const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Attendance = require('./Attendance');
const Assignment = require('./Assignment');

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

module.exports = {
  User,
  Course,
  Enrollment,
  Attendance,
  Assignment
}; 
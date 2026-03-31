/**
 * Test Data Factories
 * Creates REAL data in the database - NO MOCKS, NO FAKE DATA
 */

const { User, Course, Enrollment, Assignment, CourseContent, CourseSection } = require('../../models');
const { generateTestUser, generateTestCourse, generateTestEnrollment } = global.testUtils;

const createTestUser = async (overrides = {}) => {
  const userData = generateTestUser(overrides);
  return await User.create(userData);
};

const createTestCourse = async (overrides = {}) => {
  let trainerId = overrides.trainerId;
  if (!trainerId) {
    const trainer = await createTestUser({ role: 'trainer' });
    trainerId = trainer.id;
  }
  const courseData = generateTestCourse({ trainerId, ...overrides });
  return await Course.create(courseData);
};

const createTestEnrollment = async (overrides = {}) => {
  let userId = overrides.userId;
  let courseId = overrides.courseId;

  if (!userId) {
    const user = await createTestUser({ role: 'trainee' });
    userId = user.id;
  }
  if (!courseId) {
    const course = await createTestCourse();
    courseId = course.id;
  }

  const enrollmentData = generateTestEnrollment({ userId, courseId, ...overrides });
  return await Enrollment.create(enrollmentData);
};

const createTestAssignment = async (overrides = {}) => {
  let courseId = overrides.courseId;
  let trainerId = overrides.trainerId;

  if (!courseId) {
    const course = await createTestCourse();
    courseId = course.id;
    trainerId = course.trainerId;
  } else if (!trainerId) {
    const course = await Course.findByPk(courseId);
    trainerId = course.trainerId;
  }

  const assignmentData = {
    title: 'Test Assignment',
    description: 'Description for test assignment',
    courseId,
    trainerId,
    maxScore: 100,
    weight: 20,
    type: 'homework',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    ...overrides
  };
  return await Assignment.create(assignmentData);
};

const createTestCourseSection = async (overrides = {}) => {
  let courseId = overrides.courseId;
  if (!courseId) {
    const course = await createTestCourse();
    courseId = course.id;
  }
  const sectionData = {
    title: 'Test Section',
    order: 1,
    courseId,
    ...overrides
  };
  return await CourseSection.create(sectionData);
};

const createTestCourseContent = async (overrides = {}) => {
  let courseId = overrides.courseId;
  let sectionId = overrides.sectionId;

  if (!courseId) {
    const course = await createTestCourse();
    courseId = course.id;
  }
  if (!sectionId) {
    const section = await createTestCourseSection({ courseId });
    sectionId = section.id;
  }

  const contentData = {
    title: 'Test Content',
    type: 'video',
    url: 'http://example.com/test.mp4',
    duration: 120,
    order: 1,
    isPublished: true,
    courseId,
    sectionId,
    ...overrides
  };
  return await CourseContent.create(contentData);
};

module.exports = {
  createTestUser,
  createTestCourse,
  createTestEnrollment,
  createTestAssignment,
  createTestCourseSection,
  createTestCourseContent
};
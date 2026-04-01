const { sequelize } = require('../config/database');
const { LessonCompletion, CourseSection, Course } = require('../models');

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database...');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');
    
    // Create lesson_completions table if it doesn't exist
    try {
      await LessonCompletion.sync({ alter: true });
      console.log('✅ Lesson completions table created/updated');
    } catch (error) {
      console.log('⚠️ Lesson completions table already exists or error:', error.message);
    }

    // Create course_sections table if it doesn't exist
    try {
      await CourseSection.sync({ alter: true });
      console.log('✅ Course sections table created/updated');
    } catch (error) {
      console.log('⚠️ Course sections table already exists or error:', error.message);
    }

    // Create/update courses table with Course Type fields
    try {
      await Course.sync({ alter: true });
      console.log('✅ Courses table created/updated with Course Type fields');
      console.log('   - courseType (online/classroom/hybrid)');
      console.log('   - location (for classroom/hybrid courses)');
      console.log('   - allowRecording, recordForReplay, recordForFutureStudents');
    } catch (error) {
      console.log('⚠️ Courses table already exists or error:', error.message);
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('🚀 Course Type system is now available:');
    console.log('   • Online Courses: Pre-recorded, self-paced learning');
    console.log('   • Classroom Courses: Physical location + live trainer');
    console.log('   • Hybrid Courses: Live classroom + online streaming');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase(); 
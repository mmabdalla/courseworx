const { sequelize } = require('../config/database');
const { Course } = require('../models');

const verifyCourseType = async () => {
  try {
    console.log('🔍 Verifying Course Type implementation...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get Course model attributes
    const courseAttributes = Object.keys(Course.rawAttributes);
    console.log('📋 Course table attributes:');
    courseAttributes.forEach(attr => console.log(`   - ${attr}`));
    
    // Check for specific Course Type fields
    const requiredFields = [
      'courseType',
      'location', 
      'allowRecording',
      'recordForReplay',
      'recordForFutureStudents'
    ];
    
    console.log('\n🔍 Checking Course Type fields:');
    requiredFields.forEach(field => {
      if (courseAttributes.includes(field)) {
        console.log(`   ✅ ${field} - Found`);
      } else {
        console.log(`   ❌ ${field} - Missing`);
      }
    });
    
    // Check ENUM values for courseType
    const courseTypeField = Course.rawAttributes.courseType;
    if (courseTypeField && courseTypeField.type.values) {
      console.log(`\n📝 Course Type ENUM values: ${courseTypeField.type.values.join(', ')}`);
    }
    
    console.log('\n🎉 Course Type verification completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
};

verifyCourseType();

const path = require('path');

/**
 * Creates a safe directory name from a course title
 * @param {string} title - The course title
 * @param {string} language - The course language
 * @returns {string} - Safe directory name
 */
const createSafeDirectoryName = (title, language = 'english') => {
  if (!title || typeof title !== 'string') {
    return 'course-' + Date.now();
  }

  let safeName;
  
  if (language === 'arabic') {
    // For Arabic courses, use first three words separated by hyphens
    const words = title.trim().split(/\s+/).filter(word => word.length > 0);
    safeName = words.slice(0, 3).join('-');
    
    // Clean up any remaining special characters
    safeName = safeName.replace(/[^\p{L}\p{N}\s-]/gu, '');
    
    // If still empty, use fallback
    if (!safeName || safeName.trim() === '') {
      safeName = 'arabic-course-' + Date.now();
    }
  } else {
    // For other languages, use the first 3 words approach
    const words = title.trim().split(/\s+/).filter(word => word.length > 0);
    safeName = words.slice(0, 3).join('-');
    
    // Clean up special characters
    safeName = safeName
      .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep letters (including non-Latin), numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100); // Limit length to prevent path issues
    
    // If the result is empty, use a fallback
    if (!safeName || safeName.trim() === '') {
      safeName = 'course-' + Date.now();
    }
  }
  
  return safeName;
};

module.exports = {
  createSafeDirectoryName
};


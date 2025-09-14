/**
 * Media Utilities
 * Clean, secure media URL handling for CourseWorx
 * Supports future video security and anti-theft measures
 */

// Utility function to get secure media URL from relative path
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get authentication token for media access
  const token = localStorage.getItem('token');
  
  // Convert to secure media endpoint
  if (imagePath.startsWith('/uploads/')) {
    // Use relative path from frontend origin
    const relativePath = imagePath.replace('/uploads/', '');
    const baseUrl = `/api/media/${relativePath}`;
    // Add token as query parameter for authentication
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  }
  
  // If it's just a filename, construct secure media URL
  const baseUrl = `/api/media/courses/${imagePath}`;
  // Add token as query parameter for authentication
  return token ? `${baseUrl}?token=${token}` : baseUrl;
};

// Utility function for all media types (images, videos, documents)
export const getMediaUrl = (mediaPath) => {
  return getImageUrl(mediaPath); // Same logic for all media types
};

// Legacy compatibility functions (to fix compilation errors)
export const getFileServingUrl = (filePath) => {
  return getImageUrl(filePath); // Use same secure endpoint for all files
};

export const getBestImageUrl = (imagePath) => {
  return getImageUrl(imagePath); // Use same secure endpoint for images
};

// Utility function to get thumbnail URL from thumbnail string
export const getThumbnailUrl = (thumbnailPath) => {
  if (!thumbnailPath) return null;
  return getImageUrl(thumbnailPath);
};

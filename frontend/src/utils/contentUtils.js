import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

// Get icon for content type
export const getContentTypeIcon = (type) => {
  switch (type) {
    case 'document':
      return DocumentIcon;
    case 'image':
      return PhotoIcon;
    case 'video':
      return VideoCameraIcon;
    case 'article':
      return DocumentTextIcon;
    case 'quiz':
      return QuestionMarkCircleIcon;
    case 'certificate':
      return AcademicCapIcon;
    default:
      return DocumentIcon;
  }
};

// Get display label for content type
export const getContentTypeLabel = (type) => {
  switch (type) {
    case 'document':
      return 'Document';
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    case 'article':
      return 'Article';
    case 'quiz':
      return 'Quiz';
    case 'certificate':
      return 'Certificate';
    default:
      return 'Unknown';
  }
};

// Get content type color for styling
export const getContentTypeColor = (type) => {
  switch (type) {
    case 'document':
      return 'text-blue-600 bg-blue-100';
    case 'image':
      return 'text-green-600 bg-green-100';
    case 'video':
      return 'text-purple-600 bg-purple-100';
    case 'article':
      return 'text-orange-600 bg-orange-100';
    case 'quiz':
      return 'text-red-600 bg-red-100';
    case 'certificate':
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

// Get file type acceptance string for input
export const getFileAcceptString = (contentType) => {
  switch (contentType) {
    case 'document':
      return '.pdf,.doc,.docx,.txt,.ppt,.pptx';
    case 'image':
      return 'image/*';
    case 'video':
      return 'video/*';
    default:
      return '*/*';
  }
};

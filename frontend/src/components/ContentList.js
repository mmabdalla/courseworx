import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { PencilIcon, TrashIcon, EyeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { getContentTypeIcon, getContentTypeLabel, getContentTypeColor, formatFileSize } from '../utils/contentUtils';
import { getFileServingUrl } from '../utils/imageUtils';



const ContentList = ({
  contentItems,
  courseId,
  handleEditContentClick,
  handleDeleteContent,
  openQuizQuestionsModal
}) => {
  if (!contentItems || contentItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No content available in this section</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contentItems.map((content, index) => (
        <ContentItem
          key={content.id}
          content={content}
          courseId={courseId}
          index={index}
          handleEditContentClick={handleEditContentClick}
          handleDeleteContent={handleDeleteContent}
          openQuizQuestionsModal={openQuizQuestionsModal}
        />
      ))}
    </div>
  );
};

const ContentItem = ({
  content,
  courseId,
  index,
  handleEditContentClick,
  handleDeleteContent,
  openQuizQuestionsModal
}) => {
  const IconComponent = getContentTypeIcon(content.type);
  const typeLabel = getContentTypeLabel(content.type);
  const typeColor = getContentTypeColor(content.type);

  return (
    <Draggable
      key={`content-${content.id}`}
      draggableId={content.id}
      index={index}
      type="content"
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`border rounded-lg p-4 transition-all duration-200 ${
            snapshot.isDragging 
              ? 'bg-white border-blue-300 shadow-lg transform rotate-1' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            {/* Content Info */}
            <div className="flex items-start space-x-3 flex-1">
              {/* Drag Handle */}
              <div className="w-6 h-6 text-gray-400 cursor-move mt-1" {...provided.dragHandleProps}>
                ⋮⋮
              </div>

              {/* Content Icon */}
              <div className={`p-2 rounded-lg ${typeColor}`}>
                <IconComponent className="h-5 w-5" />
              </div>

              {/* Content Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {content.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                    {typeLabel}
                  </span>
                  {content.isRequired && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Required
                    </span>
                  )}
                  {!content.isPublished && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      Draft
                    </span>
                  )}
                </div>

                {content.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {content.description}
                  </p>
                )}

                {/* Content Metadata */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {content.points > 0 && (
                    <span>Points: {content.points}</span>
                  )}
                  {content.fileSize && (
                    <span>Size: {formatFileSize(content.fileSize)}</span>
                  )}
                  {content.duration && (
                    <span>Duration: {Math.floor(content.duration / 60)}m {content.duration % 60}s</span>
                  )}
                  <span>Order: {content.order}</span>
                </div>

                {/* File URL or Article Preview */}
                {content.fileUrl && (
                  <div className="mt-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Use the API file serving endpoint
                        const fileUrl = getFileServingUrl(content.fileUrl);
                        window.open(fileUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View File
                    </button>
                  </div>
                )}

                {content.type === 'article' && content.articleContent && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 line-clamp-3">
                    {content.articleContent.substring(0, 150)}
                    {content.articleContent.length > 150 && '...'}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Link
                to={`/courses/${courseId}/lessons/${content.id}`}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Details"
              >
                <InformationCircleIcon className="h-4 w-4" />
              </Link>
              
              {content.type === 'quiz' && (
                <button
                  onClick={() => openQuizQuestionsModal(content)}
                  className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Manage Quiz Questions"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => handleEditContentClick(content)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                title="Edit Content"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handleDeleteContent(content.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Content"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default ContentList;

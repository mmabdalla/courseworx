import React from 'react';
import { getFileAcceptString } from '../../utils/contentUtils';
import RichTextEditor from '../RichTextEditor';

const EditContentModal = ({
  showModal,
  onClose,
  editingContent,
  contentForm,
  handleContentFormChange,
  handleEditContent,
  sectionsData,
  selectedFile,
  handleFileChange,
  handleFileUpload,
  updateContentMutation,
  uploadFileMutation
}) => {
  if (!showModal || !editingContent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Content</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleEditContent} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                name="type"
                value={contentForm.type}
                onChange={handleContentFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="document">Document</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="quiz">Quiz</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={contentForm.title}
                onChange={handleContentFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter content title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={contentForm.description}
                onChange={handleContentFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter content description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <input
                type="number"
                name="order"
                value={contentForm.order}
                onChange={handleContentFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                name="points"
                value={contentForm.points}
                onChange={handleContentFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isRequired"
                  checked={contentForm.isRequired}
                  onChange={handleContentFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Required</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={contentForm.isPublished}
                  onChange={handleContentFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Published</span>
              </label>
            </div>

            {/* Section Assignment */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Section
              </label>
              <select
                name="sectionId"
                value={contentForm.sectionId || ''}
                onChange={handleContentFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No Section (Uncategorized)</option>
                {sectionsData?.sections?.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Article Content */}
          {contentForm.type === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Content
              </label>
              <RichTextEditor
                value={contentForm.articleContent}
                onChange={(content) => {
                  // Create a synthetic event to match the expected format
                  const syntheticEvent = {
                    target: {
                      name: 'articleContent',
                      value: content
                    }
                  };
                  handleContentFormChange(syntheticEvent);
                }}
                placeholder="Write your article content here..."
                height="300px"
              />
            </div>
          )}

          {/* File Upload for Document, Image, Video */}
          {['document', 'image', 'video'].includes(contentForm.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New File
              </label>
              {editingContent.fileUrl && (
                <div className="mb-2 text-sm text-gray-600">
                  Current file: {editingContent.fileUrl.split('/').pop()}
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept={getFileAcceptString(contentForm.type)}
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Selected: {selectedFile.name} (will be uploaded when content is updated)
                </div>
              )}
              {contentForm.fileUrl && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ File uploaded successfully
                </div>
              )}
            </div>
          )}

          {/* URL Input for Image/Video */}
          {(contentForm.type === 'image' || contentForm.type === 'video') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter URL
              </label>
              <input
                type="url"
                name="url"
                value={contentForm.url}
                onChange={handleContentFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${contentForm.type} URL`}
              />
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateContentMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {updateContentMutation.isLoading ? 'Updating...' : 'Update Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContentModal;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { courseContentAPI, courseSectionAPI } from '../services/api';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { DragDropContext } from 'react-beautiful-dnd';
import LoadingSpinner from '../components/LoadingSpinner';

// Custom Hooks
import { useContentManagement } from '../hooks/useContentManagement';
import { useSectionManagement } from '../hooks/useSectionManagement';
import { useFileUpload } from '../hooks/useFileUpload';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

// Components
import AddContentModal from '../components/modals/AddContentModal';
import EditContentModal from '../components/modals/EditContentModal';
import QuizQuestionsModal from '../components/modals/QuizQuestionsModal';
import SectionManager from '../components/SectionManager';
import ContentList from '../components/ContentList';

const CourseContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTrainer, isSuperAdmin } = useAuth();

  // Modal states
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [showQuizQuestionsModal, setShowQuizQuestionsModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);

  // Custom Hooks
  const contentManagement = useContentManagement(id);
  const sectionManagement = useSectionManagement(id);
  const fileUpload = useFileUpload(id, contentManagement.setContentForm, contentManagement.setSelectedFile);
  
  // Data fetching
  const { data: sectionsData, isLoading: sectionsLoading, error: sectionsError } = useQuery(
    ['course-sections', id],
    () => courseSectionAPI.getAll(id),
    {
      enabled: !!id,
      onError: (error) => {
        console.error('Error fetching sections:', error);
      }
    }
  );

  const { data: contentData, isLoading: contentLoading, error: contentError } = useQuery(
    ['course-content', id],
    () => courseContentAPI.getAll(id),
    {
      enabled: !!id,
      onError: (error) => {
        console.error('Error fetching content:', error);
      }
    }
  );

  const dragAndDrop = useDragAndDrop(id, sectionsData, contentData);

  // Initialize expanded sections
  useEffect(() => {
    if (sectionsData?.sections) {
      sectionManagement.initializeExpandedSections(sectionsData.sections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsData]);

  // Modal handlers
  const handleCloseAddContentModal = () => {
    setShowAddContentModal(false);
    contentManagement.resetContentForm();
  };

  const handleCloseEditContentModal = () => {
    setShowEditContentModal(false);
    contentManagement.setEditingContent(null);
    contentManagement.resetContentForm();
  };

  const handleEditContentClick = (content) => {
    contentManagement.handleEditContentClick(content);
    setShowEditContentModal(true);
  };

  const handleCloseQuizQuestionsModal = () => {
    setShowQuizQuestionsModal(false);
  };

  const openQuizQuestionsModal = (content) => {
    contentManagement.setEditingContent(content);
    setShowQuizQuestionsModal(true);
  };

  const handleCloseAddSectionModal = () => {
    setShowAddSectionModal(false);
    sectionManagement.resetSectionForm();
  };

  const handleCloseEditSectionModal = () => {
    setShowEditSectionModal(false);
    sectionManagement.setEditingSection(null);
    sectionManagement.resetSectionForm();
  };

  const handleEditSectionClick = (section) => {
    sectionManagement.handleEditSectionClick(section);
    setShowEditSectionModal(true);
  };

  // Access control
  if (!isTrainer && !isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to manage course content.</p>
      </div>
    );
  }

  // Loading states
  if (contentLoading || sectionsLoading) {
    return <LoadingSpinner size="lg" className="mt-8" />;
  }

  // Error states
  if (contentError || sectionsError) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error loading content or sections: {contentError?.message || sectionsError?.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Content</h1>
                <p className="text-sm text-gray-500">Manage course materials</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddContentModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Content
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DragDropContext onDragEnd={dragAndDrop.handleDragEnd}>
          <SectionManager
            sectionsData={sectionsData}
            expandedSections={sectionManagement.expandedSections}
            toggleSection={sectionManagement.toggleSection}
            handleEditSectionClick={handleEditSectionClick}
            handleDeleteSection={sectionManagement.handleDeleteSection}
            onAddSection={() => setShowAddSectionModal(true)}
          >
            {(sectionId) => (
              <ContentList
                contentItems={dragAndDrop.getContentForSection(sectionId)}
                courseId={id}
                handleEditContentClick={handleEditContentClick}
                handleDeleteContent={contentManagement.handleDeleteContent}
                openQuizQuestionsModal={openQuizQuestionsModal}
              />
            )}
          </SectionManager>
        </DragDropContext>
      </div>

      {/* Modals */}
      <AddContentModal
        showModal={showAddContentModal}
        onClose={handleCloseAddContentModal}
        contentForm={contentManagement.contentForm}
        handleContentFormChange={contentManagement.handleContentFormChange}
        handleAddContent={contentManagement.handleAddContent}
        sectionsData={sectionsData}
        selectedFile={contentManagement.selectedFile}
        handleFileChange={fileUpload.handleFileChange}
        handleFileUpload={fileUpload.handleFileUpload}
        createContentMutation={contentManagement.createContentMutation}
        uploadFileMutation={fileUpload.uploadFileMutation}
      />

      <EditContentModal
        showModal={showEditContentModal}
        onClose={handleCloseEditContentModal}
        editingContent={contentManagement.editingContent}
        contentForm={contentManagement.contentForm}
        handleContentFormChange={contentManagement.handleContentFormChange}
        handleEditContent={async (e) => {
          try {
            await contentManagement.handleEditContent(e, contentManagement.selectedFile, fileUpload.uploadFileMutation);
            setShowEditContentModal(false);
          } catch (error) {
            console.error('Error editing content:', error);
            // Modal stays open on error
          }
        }}
        sectionsData={sectionsData}
        selectedFile={contentManagement.selectedFile}
        handleFileChange={fileUpload.handleFileChange}
        handleFileUpload={fileUpload.handleFileUpload}
        updateContentMutation={contentManagement.updateContentMutation}
        uploadFileMutation={fileUpload.uploadFileMutation}
      />

      <QuizQuestionsModal
        showModal={showQuizQuestionsModal}
        onClose={handleCloseQuizQuestionsModal}
        editingContent={contentManagement.editingContent}
        addQuizQuestionsMutation={contentManagement.addQuizQuestionsMutation}
      />

      {/* Section Modals */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Section</h2>
              <button
                onClick={handleCloseAddSectionModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={sectionManagement.handleAddSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={sectionManagement.sectionForm.title}
                  onChange={sectionManagement.handleSectionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter section title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={sectionManagement.sectionForm.description}
                  onChange={sectionManagement.handleSectionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the purpose of this section"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={sectionManagement.sectionForm.order}
                  onChange={sectionManagement.handleSectionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAddSectionModal}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionManagement.createSectionMutation.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {sectionManagement.createSectionMutation.isLoading ? 'Adding...' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSectionModal && sectionManagement.editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Section</h2>
              <button
                onClick={handleCloseEditSectionModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={sectionManagement.handleUpdateSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={sectionManagement.sectionForm.title}
                  onChange={sectionManagement.handleSectionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter section title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={sectionManagement.sectionForm.description}
                  onChange={sectionManagement.handleSectionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the purpose of this section"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={sectionManagement.sectionForm.order}
                  onChange={sectionManagement.handleSectionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditSectionModal}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionManagement.updateSectionMutation.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {sectionManagement.updateSectionMutation.isLoading ? 'Updating...' : 'Update Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContent;

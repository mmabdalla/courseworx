import React from 'react';
import { PlusIcon, ChevronRightIcon, ChevronDownIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Droppable, Draggable } from 'react-beautiful-dnd';

const SectionManager = ({
  sectionsData,
  expandedSections,
  toggleSection,
  handleEditSectionClick,
  handleDeleteSection,
  onAddSection,
  children // This will be the content items
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ChevronRightIcon className="h-5 w-5 mr-2 text-gray-500" />
        Course Sections
        {sectionsData?.sections && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({sectionsData.sections.length} sections)
          </span>
        )}
        <button
          onClick={onAddSection}
          className="ml-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Section
        </button>
      </h2>

      {sectionsData?.sections && sectionsData.sections.length > 0 ? (
        <Droppable key="sections-droppable" droppableId="sections" type="section">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 transition-all duration-200 ${
                snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
              }`}
            >
              {sectionsData.sections.map((section, index) => (
                <Draggable
                  key={`section-${section.id}`}
                  draggableId={section.id}
                  index={index}
                  type="section"
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        snapshot.isDragging 
                          ? 'bg-blue-50 border-blue-300 shadow-lg transform rotate-2' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 text-gray-400 cursor-move" {...provided.dragHandleProps}>
                              ⋮⋮
                            </div>
                            <ChevronDownIcon
                              className={`h-6 w-6 text-gray-600 cursor-pointer transition-transform duration-200 ${
                                expandedSections.has(section.id) ? 'rotate-90' : ''
                              }`}
                              onClick={() => toggleSection(section.id)}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Section {index + 1}: {section.title}
                            </h3>
                            <p className="text-sm text-gray-500">{section.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditSectionClick(section)}
                            className="p-2 text-gray-600 hover:text-gray-800"
                            title="Edit Section"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Delete Section"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {expandedSections.has(section.id) && (
                        <Droppable
                          key={`section-${section.id}-droppable`}
                          droppableId={section.id}
                          type="content"
                        >
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`mt-4 min-h-[100px] rounded-lg border-2 border-dashed transition-all duration-200 ${
                                snapshot.isDraggingOver 
                                  ? 'border-blue-400 bg-blue-50' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="p-4">
                                {children && children(section.id)}
                              </div>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {/* Uncategorized Content Section */}
              <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChevronDownIcon
                      className={`h-6 w-6 text-gray-600 cursor-pointer transition-transform duration-200 ${
                        expandedSections.has('uncategorized') ? 'rotate-90' : ''
                      }`}
                      onClick={() => toggleSection('uncategorized')}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">Uncategorized Content</h3>
                      <p className="text-sm text-gray-500">Content not assigned to any section</p>
                    </div>
                  </div>
                </div>
                
                {expandedSections.has('uncategorized') && (
                  <Droppable
                    key="uncategorized-droppable"
                    droppableId="uncategorized"
                    type="content"
                  >
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`mt-4 min-h-[100px] rounded-lg border-2 border-dashed transition-all duration-200 ${
                          snapshot.isDraggingOver 
                            ? 'border-yellow-400 bg-yellow-100' 
                            : 'border-yellow-300'
                        }`}
                      >
                        <div className="p-4">
                          {children && children('uncategorized')}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            </div>
          )}
        </Droppable>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No sections available. Add a section to start managing content.</p>
        </div>
      )}

      {/* Section Modals */}
      <AddSectionModal />
      <EditSectionModal />
    </div>
  );
};

// Add Section Modal Component
const AddSectionModal = ({
  showModal,
  onClose,
  sectionForm,
  handleSectionFormChange,
  handleAddSection,
  createSectionMutation
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add New Section</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleAddSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              name="title"
              value={sectionForm.title}
              onChange={handleSectionFormChange}
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
              value={sectionForm.description}
              onChange={handleSectionFormChange}
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
              value={sectionForm.order}
              onChange={handleSectionFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

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
              disabled={createSectionMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {createSectionMutation.isLoading ? 'Adding...' : 'Add Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Section Modal Component
const EditSectionModal = ({
  showModal,
  onClose,
  editingSection,
  sectionForm,
  handleSectionFormChange,
  handleUpdateSection,
  updateSectionMutation
}) => {
  if (!showModal || !editingSection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Section</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleUpdateSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              name="title"
              value={sectionForm.title}
              onChange={handleSectionFormChange}
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
              value={sectionForm.description}
              onChange={handleSectionFormChange}
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
              value={sectionForm.order}
              onChange={handleSectionFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

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
              disabled={updateSectionMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {updateSectionMutation.isLoading ? 'Updating...' : 'Update Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SectionManager;

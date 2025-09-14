import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { courseSectionAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useSectionManagement = (courseId) => {
  const queryClient = useQueryClient();
  
  // Section form state
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    order: 0
  });

  const [editingSection, setEditingSection] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Mutations
  const createSectionMutation = useMutation(
    (data) => courseSectionAPI.create(courseId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-sections', courseId]);
        resetSectionForm();
        toast.success('Section created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create section');
      },
    }
  );

  const updateSectionMutation = useMutation(
    ({ sectionId, data }) => courseSectionAPI.update(sectionId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-sections', courseId]);
        setEditingSection(null);
        resetSectionForm();
        toast.success('Section updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update section');
      },
    }
  );

  const deleteSectionMutation = useMutation(
    (sectionId) => courseSectionAPI.delete(sectionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-sections', courseId]);
        toast.success('Section deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete section');
      },
    }
  );

  // Handlers
  const handleSectionFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setSectionForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const resetSectionForm = useCallback(() => {
    setSectionForm({
      title: '',
      description: '',
      order: 0
    });
  }, []);

  const handleAddSection = useCallback(async (e) => {
    e.preventDefault();
    return new Promise((resolve, reject) => {
      createSectionMutation.mutate(sectionForm, {
        onSuccess: (response) => {
          console.log('✅ Section created successfully in handler:', response);
          resolve(response);
        },
        onError: (error) => {
          console.error('❌ Error in handleAddSection:', error);
          reject(error);
        }
      });
    });
  }, [sectionForm, createSectionMutation]);

  const handleEditSectionClick = useCallback((section) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      description: section.description,
      order: section.order
    });
  }, []);

  const handleUpdateSection = useCallback(async (e) => {
    e.preventDefault();
    updateSectionMutation.mutate({
      sectionId: editingSection.id,
      data: sectionForm
    });
  }, [editingSection, sectionForm, updateSectionMutation]);

  const handleDeleteSection = useCallback((sectionId) => {
    if (window.confirm('Are you sure you want to delete this section? All content in this section will be moved to uncategorized.')) {
      deleteSectionMutation.mutate(sectionId);
    }
  }, [deleteSectionMutation]);

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  }, []);

  const initializeExpandedSections = useCallback((sections) => {
    if (sections && sections.length > 0) {
      const initialExpanded = new Set(sections.map(section => section.id));
      initialExpanded.add('uncategorized'); // Always show uncategorized content
      setExpandedSections(initialExpanded);
    }
  }, []);

  return {
    // State
    sectionForm,
    setSectionForm,
    editingSection,
    setEditingSection,
    expandedSections,
    setExpandedSections,
    
    // Mutations
    createSectionMutation,
    updateSectionMutation,
    deleteSectionMutation,
    
    // Handlers
    handleSectionFormChange,
    resetSectionForm,
    handleAddSection,
    handleEditSectionClick,
    handleUpdateSection,
    handleDeleteSection,
    toggleSection,
    initializeExpandedSections
  };
};

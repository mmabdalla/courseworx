import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { courseContentAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useContentManagement = (courseId) => {
  const queryClient = useQueryClient();
  
  // Content form state
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    type: 'document',
    order: 0,
    points: 0,
    isRequired: true,
    isPublished: true,
    articleContent: '',
    url: '',
    sectionId: null
  });

  const [editingContent, setEditingContent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Debug selectedFile changes
  useEffect(() => {
    console.log('📁 useContentManagement: selectedFile changed:', selectedFile?.name || 'null');
    // Log the stack trace to see what's causing the reset
    if (selectedFile === null) {
      console.trace('🔍 selectedFile reset to null - stack trace:');
    }
  }, [selectedFile]);

  // Mutations
  const createContentMutation = useMutation(
    (data) => {
      console.log('🔄 createContentMutation called with data:', data);
      return courseContentAPI.create(courseId, data);
    },
    {
      onSuccess: (response) => {
        console.log('✅ Content created successfully:', response);
        queryClient.invalidateQueries(['course-content', courseId]);
        queryClient.invalidateQueries(['course-sections', courseId]);
        resetContentForm();
        toast.success('Content added successfully!');
      },
      onError: (error) => {
        console.error('❌ Content creation failed:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error data:', error.response?.data);
        
        // Show validation errors if available
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          const validationErrors = error.response.data.errors;
          console.error('❌ Validation errors:', validationErrors);
          
          // Show first validation error to user
          const firstError = validationErrors[0];
          toast.error(`Validation failed: ${firstError.msg || firstError.error || 'Invalid data'}`);
        } else {
          toast.error(error.response?.data?.error || 'Failed to add content');
        }
      },
    }
  );

  const updateContentMutation = useMutation(
    ({ contentId, data }) => courseContentAPI.update(courseId, contentId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', courseId]);
        queryClient.invalidateQueries(['course-sections', courseId]);
        setEditingContent(null);
        resetContentForm();
        toast.success('Content updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update content');
      },
    }
  );

  const deleteContentMutation = useMutation(
    (contentId) => courseContentAPI.delete(courseId, contentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', courseId]);
        queryClient.invalidateQueries(['course-sections', courseId]);
        toast.success('Content deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete content');
      },
    }
  );

  const addQuizQuestionsMutation = useMutation(
    ({ contentId, questions }) => courseContentAPI.addQuizQuestions(courseId, contentId, questions),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-content', courseId]);
        toast.success('Quiz questions added successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add quiz questions');
      },
    }
  );

  // Handlers
  const handleContentFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setContentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const resetContentForm = useCallback(() => {
    setContentForm({
      title: '',
      description: '',
      type: 'document',
      order: 0,
      points: 0,
      isRequired: true,
      isPublished: true,
      articleContent: '',
      url: '',
      sectionId: null
    });
    // Don't reset selectedFile here - it should persist until content is created
    console.log('🔄 resetContentForm called - selectedFile preserved:', selectedFile?.name || 'null');
  }, [selectedFile]);

  const handleAddContent = useCallback(async (e, selectedFileParam = null, uploadFileMutation = null) => {
    e.preventDefault();
    console.log('🚀 handleAddContent called');
    console.log('📋 Form data:', contentForm);
    console.log('📁 Selected file parameter:', selectedFileParam);
    console.log('📁 Selected file from state:', selectedFile);
    console.log('📁 Upload mutation available:', !!uploadFileMutation);
    console.log('📁 Content type:', contentForm.type);
    console.log('📁 File upload required:', ['document', 'image', 'video'].includes(contentForm.type));
    
    // Use parameter if provided, otherwise use state
    const fileToUpload = selectedFileParam || selectedFile;
    console.log('📁 File to upload (final decision):', fileToUpload?.name || 'null');
    
    let data = { ...contentForm };
    
    // Clean up sectionId - convert empty string to null
    if (data.sectionId === '') {
      data.sectionId = null;
    }
    
    // Transform articleContent to content field for articles
    if (contentForm.type === 'article' && contentForm.articleContent) {
      data.content = contentForm.articleContent;
      delete data.articleContent; // Remove the form field
    }
    
    // If image/video and url is provided, set fileUrl
    if ((contentForm.type === 'image' || contentForm.type === 'video') && contentForm.url) {
      data.fileUrl = contentForm.url;
    }
    
    console.log('📤 Sending data to API:', data);
    console.log('🔗 Course ID:', courseId);
    console.log('📏 Title length:', data.title?.length || 0);
    console.log('🔍 Data validation check:', {
      title: data.title,
      type: data.type,
      order: typeof data.order,
      points: typeof data.points,
      sectionId: data.sectionId
    });
    
    try {
      return new Promise((resolve, reject) => {
        createContentMutation.mutate(data, {
          onSuccess: async (response) => {
            console.log('✅ Content created successfully:', response);
            
            // Extract content ID from response (handle different response structures)
            console.log('🔍 Response structure debug:', {
              response: response,
              responseContent: response.content,
              responseId: response.id,
              responseData: response.data,
              responseDataContent: response.data?.content,
              responseDataId: response.data?.id
            });
            
            const contentId = response.content?.id || response.id || response.data?.id || response.data?.content?.id;
            if (!contentId) {
              console.error('❌ No content ID found in response:', response);
              console.error('❌ Response structure:', JSON.stringify(response, null, 2));
              reject(new Error('Server response format error: No content ID found'));
              return;
            }

            // Invalidate queries to refresh the page data
            console.log('🔄 Invalidating queries to refresh page data...');
            queryClient.invalidateQueries(['course-content', courseId]);
            queryClient.invalidateQueries(['course-sections', courseId]);
            queryClient.invalidateQueries(['courses', courseId]);
            
            // If there's a file to upload and we have the upload mutation
          console.log('🔍 File upload check:', {
            hasSelectedFile: !!fileToUpload,
            hasUploadMutation: !!uploadFileMutation,
            contentType: contentForm.type,
            requiresFileUpload: ['document', 'image', 'video'].includes(contentForm.type),
            willUploadFile: !!(fileToUpload && uploadFileMutation && ['document', 'image', 'video'].includes(contentForm.type))
          });
          
          if (fileToUpload && uploadFileMutation && ['document', 'image', 'video'].includes(contentForm.type)) {
              console.log('📤 Uploading file for content:', {
                contentId,
                fileName: fileToUpload.name,
                fileType: fileToUpload.type,
                contentType: contentForm.type
              });
              
              try {
                // Upload file with the newly created content ID
                const uploadResponse = await new Promise((uploadResolve, uploadReject) => {
                  uploadFileMutation.mutate({
                    file: fileToUpload,
                    contentType: contentForm.type,
                    contentId: contentId
                  }, {
                    onSuccess: (uploadData) => {
                      console.log('✅ File uploaded successfully:', uploadData);
                      uploadResolve(uploadData);
                    },
                    onError: (uploadError) => {
                      console.error('❌ File upload failed:', uploadError);
                      uploadReject(uploadError);
                    }
                  });
                });
                
                console.log('✅ Content creation and file upload completed');
                // Reset selectedFile after successful upload
                setSelectedFile(null);
                resolve({ ...response, uploadData: uploadResponse });
              } catch (uploadError) {
                console.error('❌ File upload failed, but content was created:', uploadError);
                // Still resolve with content creation success, but log the upload failure
                resolve(response);
              }
            } else {
              console.log('✅ Content created without file upload');
              resolve(response);
            }
          },
          onError: (error) => {
            console.error('❌ Error in handleAddContent:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error in handleAddContent:', error);
      throw error;
    }
  }, [contentForm, courseId, createContentMutation, queryClient, setSelectedFile, selectedFile]);

  const handleEditContent = useCallback(async (e, selectedFile = null, uploadFileMutation = null) => {
    e.preventDefault();
    
    let data = { ...contentForm };
    
    // Transform articleContent to content field for articles
    if (contentForm.type === 'article' && contentForm.articleContent) {
      data.content = contentForm.articleContent;
    }
    
    // Always remove articleContent from the data sent to backend
    // since it's only used in the frontend form
    delete data.articleContent;
    
    try {
      return new Promise((resolve, reject) => {
        updateContentMutation.mutate({
          contentId: editingContent.id,
          data: data
        }, {
          onSuccess: async (response) => {
            console.log('✅ Content updated successfully:', response);
            
            // If there's a selected file and upload mutation, upload the file after updating content
            if (selectedFile && uploadFileMutation && ['document', 'image', 'video'].includes(contentForm.type)) {
              console.log('📤 Uploading file for updated content:', {
                file: selectedFile.name,
                contentType: contentForm.type,
                contentId: editingContent.id
              });
              
              try {
                const uploadResponse = await new Promise((uploadResolve, uploadReject) => {
                  uploadFileMutation.mutate({
                    file: selectedFile,
                    contentType: contentForm.type,
                    contentId: editingContent.id
                  }, {
                    onSuccess: (uploadData) => {
                      console.log('✅ File uploaded successfully:', uploadData);
                      uploadResolve(uploadData);
                    },
                    onError: (uploadError) => {
                      console.error('❌ File upload failed:', uploadError);
                      uploadReject(uploadError);
                    }
                  });
                });
                resolve({ ...response, uploadData: uploadResponse });
              } catch (uploadError) {
                console.error('❌ File upload failed, but content update succeeded:', uploadError);
                resolve(response); // Still resolve content update, log upload failure
              }
            } else {
              resolve(response);
            }
          },
          onError: (error) => {
            console.error('❌ Error in handleEditContent:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error in handleEditContent:', error);
      throw error;
    }
  }, [editingContent, contentForm, updateContentMutation]);

  const handleDeleteContent = useCallback((contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteContentMutation.mutate(contentId);
    }
  }, [deleteContentMutation]);

  const handleEditContentClick = useCallback((content) => {
    setEditingContent(content);
    setContentForm({
      title: content.title,
      description: content.description,
      type: content.type,
      order: content.order,
      points: content.points,
      isRequired: content.isRequired,
      isPublished: content.isPublished,
      articleContent: content.content || content.articleContent || '',
      url: content.fileUrl || '',
      sectionId: content.sectionId
    });
  }, []);

  return {
    // State
    contentForm,
    setContentForm,
    editingContent,
    setEditingContent,
    selectedFile,
    setSelectedFile,
    
    // Mutations
    createContentMutation,
    updateContentMutation,
    deleteContentMutation,
    addQuizQuestionsMutation,
    
    // Handlers
    handleContentFormChange,
    resetContentForm,
    handleAddContent,
    handleEditContent,
    handleDeleteContent,
    handleEditContentClick
  };
};

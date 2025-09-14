import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { courseContentAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useFileUpload = (courseId, setContentForm, setSelectedFile) => {
  const uploadFileMutation = useMutation(
    ({ file, contentType, contentId }) => courseContentAPI.uploadFile(courseId, contentType, file, contentId),
    {
      onSuccess: (data) => {
        setContentForm(prev => ({
          ...prev,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          fileType: data.fileType
        }));
        setSelectedFile(null);
        toast.success('File uploaded successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to upload file');
      },
    }
  );

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    console.log('📁 useFileUpload: File selected:', file?.name);
    if (file) {
      setSelectedFile(file);
      console.log('📁 useFileUpload: File set in state');
    }
  }, [setSelectedFile]);

  const handleFileUpload = useCallback(async (contentType, selectedFile) => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    
    uploadFileMutation.mutate({
      file: selectedFile,
      contentType,
      contentId: null
    });
  }, [uploadFileMutation]);

  return {
    uploadFileMutation,
    handleFileChange,
    handleFileUpload,
    selectedFile: null // This should be managed by the parent hook
  };
};

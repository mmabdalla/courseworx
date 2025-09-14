import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI } from '../services/api';
import {
  AcademicCapIcon,
  ClockIcon,
  BookOpenIcon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
  PhotoIcon,
  PlusIcon,
  CreditCardIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import TrainerAssignmentModal from '../components/TrainerAssignmentModal';
import CourseCurrencyConfig from '../components/CourseCurrencyConfig';
import RichTextEditor from '../components/RichTextEditor';
import toast from 'react-hot-toast';

const CourseManagement = () => {
  const { id } = useParams(); // Will be undefined for create mode
  const navigate = useNavigate();
  const { isTrainer, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Determine if we're in create or edit mode
  const isEditMode = !!id;
  const pageTitle = isEditMode ? 'Edit Course' : 'Create Course';
  const pageSubtitle = isEditMode ? 'Update the details below and save your changes.' : 'Fill in the details below to create a new course.';

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Wizard steps configuration - Independent tabs
  const steps = [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Course title, description, and basic details',
      icon: BookOpenIcon
    },
    {
      id: 'pricing',
      title: 'Pricing',
      description: 'Course pricing and multi-currency options',
      icon: CreditCardIcon
    },
    {
      id: 'duration',
      title: 'Duration',
      description: 'Course timing and scheduling details',
      icon: ClockIcon
    },
    {
      id: 'attendees',
      title: 'Attendees',
      description: 'Student management and attendee configuration',
      icon: UsersIcon
    },
    {
      id: 'details',
      title: 'Details',
      description: 'Requirements, outcomes, and tags',
      icon: TagIcon
    },
    {
      id: 'options',
      title: 'Options',
      description: 'Location and recording settings',
      icon: AcademicCapIcon
    },
    {
      id: 'publish',
      title: 'Publish',
      description: 'Image upload and publishing options',
      icon: PhotoIcon
    }
  ];

  // Step rendering functions
  const renderBasicInformationStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Enter course title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Type *
            </label>
            <select
              name="courseType"
              value={formData.courseType}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="online">Online</option>
              <option value="classroom">Classroom</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language *
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="english">English</option>
              <option value="arabic">Arabic</option>
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
              <option value="german">German</option>
              <option value="chinese">Chinese</option>
              <option value="japanese">Japanese</option>
              <option value="korean">Korean</option>
              <option value="hindi">Hindi</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Brief description (max 1000 characters)"
              maxLength={1000}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Description *
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => handleInputChange({ target: { name: 'description', value } })}
              placeholder="Provide a detailed description of the course..."
              height="200px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., Programming, Design, Business"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level *
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderPricingStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isFree"
              checked={formData.isFree}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">
              This is a free course
            </label>
          </div>
          
        </div>

        {/* Multi-Currency Configuration */}
        {!formData.isFree && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Multi-Currency Options</h3>
            <div className="text-sm text-gray-600 mb-4">
              Configure which currencies students can use to pay for this course. 
              You can set a base currency and allow payments in multiple currencies with custom exchange rates.
            </div>
            <CourseCurrencyConfig 
              courseId={isEditMode ? id : null} 
              onSave={handleCurrencySave}
              isCreationMode={!isEditMode}
            />
          </div>
        )}
      </div>
    );
  };

  const renderDurationStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Duration (minutes)
            </label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="e.g., 120"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Total course duration in minutes</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Hours
            </label>
            <div className="relative">
              <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="creditHours"
                value={formData.creditHours || ''}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="e.g., 2.5"
                min="0"
                step="0.5"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Professional development credit hours</p>
          </div>
        </div>

        {(formData.courseType === 'hybrid' || formData.courseType === 'classroom') && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Classroom Session Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classroom Hours
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="classroomHours"
                    value={formData.classroomHours || ''}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="e.g., 8"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Hours spent in physical classroom</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Online Hours
                </label>
                <div className="relative">
                  <BookOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="onlineHours"
                    value={formData.onlineHours || ''}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="e.g., 4"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Hours spent in online learning</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStudentsStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Students
            </label>
            <div className="relative">
              <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="e.g., 30"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Maximum number of students allowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Students
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="minStudents"
                value={formData.minStudents || ''}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="e.g., 5"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum students required to run course</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Pre-Enrolled Students</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Import Students from CSV</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a CSV file with student information to pre-enroll them in this course.
              Students will receive login credentials and invoices automatically.
            </p>
            <div className="mt-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
                id="csv-import"
              />
              <label
                htmlFor="csv-import"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Import Students CSV
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              CSV should include: First Name, Last Name, Email, Phone (optional)
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              className="input-field"
              rows={3}
              placeholder="What students need to know before taking this course"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Outcomes
            </label>
            <textarea
              name="learningOutcomes"
              value={formData.learningOutcomes}
              onChange={handleInputChange}
              className="input-field"
              rows={3}
              placeholder="What students will learn from this course"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderClassroomStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., Training Center, Room 101, 123 Main St"
            />
            <p className="text-xs text-gray-500 mt-1">Physical location for classroom sessions</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recording Options
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allowRecording"
                  checked={formData.allowRecording || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">Allow course recording</span>
              </label>
              
              {formData.allowRecording && (
                <div className="ml-6 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="recordForReplay"
                      checked={formData.recordForReplay || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Make recordings available for replay</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="recordForFutureStudents"
                      checked={formData.recordForFutureStudents || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Allow future students to access recordings</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPublishingStep = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Publish course immediately
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Feature this course
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Course Thumbnail
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x630px</p>
        </div>

        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Course preview"
              className="h-32 w-32 object-cover rounded-lg"
            />
          </div>
        )}

        {imageFile && (
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploadingImage}
            className="btn-secondary"
          >
            {uploadingImage ? 'Uploading...' : 'Upload Image'}
          </button>
        )}
      </div>
    );
  };

  // Wizard navigation functions
  const nextStep = () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const isStepCompleted = (stepIndex) => {
    return completedSteps.has(stepIndex);
  };

  const markStepCompleted = (stepIndex) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  // All steps are always valid - no validation restrictions
  const isStepValid = (stepIndex) => {
    return true;
  };

  // Course image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Trainer assignment modal state (only for edit mode)
  const [showTrainerModal, setShowTrainerModal] = useState(false);

  // Initial form data for create mode
  const initialFormData = {
    title: '',
    description: '',
    shortDescription: '',
    courseType: 'online',
    language: 'english',
    // Basic pricing
    price: 0,
    isFree: false,
    // Payment models
    paymentModel: 'one-time', // one-time, installments, subscription
    // Installment options
    installmentPlans: [],
    // Subscription options
    subscriptionInterval: 'monthly', // monthly, quarterly, yearly
    subscriptionPrice: 0,
    // Discount options
    discounts: [],
    // Pricing tiers
    pricingTiers: [],
    // Advanced pricing
    earlyBirdDiscount: {
      enabled: false,
      percentage: 0,
      endDate: ''
    },
    groupDiscount: {
      enabled: false,
      minStudents: 0,
      percentage: 0
    },
    // Course settings
    duration: '',
    creditHours: '',
    classroomHours: '',
    onlineHours: '',
    level: 'beginner',
    category: '',
    tags: '',
    requirements: '',
    learningOutcomes: '',
    maxStudents: '',
    minStudents: '',
    startDate: '',
    endDate: '',
    location: '',
    allowRecording: false,
    recordForReplay: false,
    recordForFutureStudents: false,
    isPublished: false,
    isFeatured: false,
    // Imported students
    importedStudents: [],
  };

  const [formData, setFormData] = useState(() => {
    // Try to load from localStorage for creation mode
    if (!isEditMode) {
      const saved = localStorage.getItem('courseFormData');
      if (saved) {
        try {
          return { ...initialFormData, ...JSON.parse(saved) };
        } catch (error) {
          console.error('Error parsing saved form data:', error);
        }
      }
    }
    return initialFormData;
  });

  // All steps are always visible - no filtering needed
  const visibleSteps = steps;


  // Fetch course data for edit mode
  const { data: courseData, isLoading, error } = useQuery(
    ['course', id],
    () => coursesAPI.getById(id),
    { enabled: isEditMode && !!id }
  );

  // Load course data into form for edit mode (only once)
  useEffect(() => {
    if (isEditMode && courseData && courseData.course && !formDataLoaded) {
      const c = courseData.course;
      setFormData({
        title: c.title || '',
        description: c.description || '',
        shortDescription: c.shortDescription || '',
        courseType: c.courseType || 'online',
        language: c.language || 'english',
        price: c.price || 0,
        isFree: c.price === 0,
        duration: c.duration || '',
        creditHours: c.creditHours || '',
        classroomHours: c.classroomHours || '',
        onlineHours: c.onlineHours || '',
        level: c.level || 'beginner',
        category: c.category || '',
        tags: c.tags ? c.tags.join(', ') : '',
        requirements: c.requirements || '',
        learningOutcomes: c.learningOutcomes || '',
        maxStudents: c.maxStudents || '',
        minStudents: c.minStudents || '',
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
        endDate: c.endDate ? c.endDate.slice(0, 10) : '',
        location: c.location || '',
        allowRecording: c.allowRecording || false,
        recordForReplay: c.recordForReplay || false,
        recordForFutureStudents: c.recordForFutureStudents || false,
        isPublished: c.isPublished || false,
        isFeatured: c.isFeatured || false,
        // Imported students
        importedStudents: [],
      });
      setFormDataLoaded(true);
    }
  }, [isEditMode, courseData, formDataLoaded]);

  // Auto-save function for edit mode
  const handleAutoSave = useCallback(async () => {
    if (!isEditMode || !id) return;
    
    try {
      const courseData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        duration: formData.duration ? parseInt(formData.duration) : null,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        minStudents: formData.minStudents ? parseInt(formData.minStudents) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        // Only include location and recording options for classroom/hybrid courses
        ...(formData.courseType !== 'online' && {
          location: formData.location,
          allowRecording: formData.allowRecording,
          recordForReplay: formData.recordForReplay,
          recordForFutureStudents: formData.recordForFutureStudents
        })
      };
      
      await coursesAPI.update(id, courseData);
      // Don't show toast for auto-save to avoid spam
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error toast for auto-save failures
    }
  }, [formData, isEditMode, id]);

  // Auto-save form data to database and localStorage
  useEffect(() => {
    // Save to localStorage for creation mode
    if (!isEditMode) {
      localStorage.setItem('courseFormData', JSON.stringify(formData));
    }
    
    // Auto-save to database for edit mode
    if (isEditMode && formDataLoaded && formData.title) {
      const timeoutId = setTimeout(() => {
        handleAutoSave();
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isEditMode, formDataLoaded, handleAutoSave]);

  // Currency configuration save callback
  const handleCurrencySave = useCallback((currencyData) => {
    setFormData(prev => ({
      ...prev,
      currencyConfig: currencyData,
      price: currencyData.basePrice || prev.price
    }));
    toast.success('Currency configuration saved successfully!');
  }, []);

  // Image handling
  const handleImageChange = (e) => {
    const f = e.target.files[0];
    setImageFile(f);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  };

  const handleImageUpload = async () => {
    if (!imageFile || !formData?.title) return;
    setUploadingImage(true);
    try {
      if (isEditMode) {
        await coursesAPI.uploadCourseThumbnail(id, imageFile);
        toast.success('Course image uploaded!');
        queryClient.invalidateQueries(['course', id]);
      } else {
        // For create mode, we'll handle this in the form submission
        toast.success('Image ready for upload!');
      }
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Form input handling
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // CSV Import handling
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate CSV format
      const requiredHeaders = ['first name', 'last name', 'email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`CSV missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const students = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        return {
          firstName: values[headers.indexOf('first name')] || '',
          lastName: values[headers.indexOf('last name')] || '',
          email: values[headers.indexOf('email')] || '',
          phone: headers.includes('phone') ? values[headers.indexOf('phone')] || '' : ''
        };
      }).filter(student => student.email); // Only include students with email

      if (students.length === 0) {
        toast.error('No valid students found in CSV');
        return;
      }

      // Store imported students in form data
      setFormData(prev => ({
        ...prev,
        importedStudents: students
      }));

      toast.success(`Successfully imported ${students.length} students from CSV`);
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error('Failed to import CSV file');
    }
  };


  // Form submission
  const createCourseMutation = useMutation(
    (data) => coursesAPI.create(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['courses']);
        toast.success('Course created successfully!');
        // Clear saved form data after successful creation
        localStorage.removeItem('courseFormData');
        navigate(`/courses/${data.course.id}`);
      },
      onError: (error) => {
        toast.error('Failed to create course');
        console.error('Create course error:', error);
      }
    }
  );

  const updateCourseMutation = useMutation(
    (data) => coursesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['courses']);
        queryClient.invalidateQueries(['course', id]);
        toast.success('Course updated successfully!');
        navigate(`/courses/${id}`);
      },
      onError: (error) => {
        toast.error('Failed to update course');
        console.error('Update course error:', error);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (createCourseMutation.isLoading || updateCourseMutation.isLoading) {
      return;
    }
    
    if (isEditMode) {
      const courseData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: formData.duration ? parseInt(formData.duration) : null,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        minStudents: formData.minStudents ? parseInt(formData.minStudents) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        // Only include location and recording options for classroom/hybrid courses
        ...(formData.courseType !== 'online' && {
          location: formData.location,
          allowRecording: formData.allowRecording,
          recordForReplay: formData.recordForReplay,
          recordForFutureStudents: formData.recordForFutureStudents
        })
      };
      updateCourseMutation.mutate(courseData);
    } else {
      const courseData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: formData.duration ? parseInt(formData.duration) : null,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        minStudents: formData.minStudents ? parseInt(formData.minStudents) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        // Only include location and recording options for classroom/hybrid courses
        ...(formData.courseType !== 'online' && {
          location: formData.location,
          allowRecording: formData.allowRecording,
          recordForReplay: formData.recordForReplay,
          recordForFutureStudents: formData.recordForFutureStudents
        })
      };
      createCourseMutation.mutate(courseData);
    }
  };

  // Handle wizard step completion
  const handleStepComplete = () => {
    markStepCompleted(currentStep);
    if (currentStep < visibleSteps.length - 1) {
      nextStep();
    } else {
      // Last step - submit the form only if not already submitting
      if (!createCourseMutation.isLoading && !updateCourseMutation.isLoading) {
        handleSubmit(new Event('submit'));
      }
    }
  };

  // Loading and error states
  if (isEditMode && isLoading) {
    return <LoadingSpinner />;
  }

  if (isEditMode && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!isTrainer && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to {isEditMode ? 'edit' : 'create'} courses.</p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const isSubmitting = createCourseMutation.isLoading || updateCourseMutation.isLoading;

  // Render step content
  const renderStepContent = () => {
    const step = visibleSteps[currentStep];
    if (!step) return null;

    switch (step.id) {
      case 'basics':
        return renderBasicInformationStep();
      case 'pricing':
        return renderPricingStep();
      case 'duration':
        return renderDurationStep();
      case 'attendees':
        return renderStudentsStep();
      case 'details':
        return renderDetailsStep();
      case 'options':
        return renderClassroomStep();
      case 'publish':
        return renderPublishingStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            {isEditMode ? (
              <BookOpenIcon className="h-8 w-8 mr-3 text-primary-600" />
            ) : (
              <PlusIcon className="h-8 w-8 mr-3 text-primary-600" />
            )}
            {isEditMode && courseData?.course?.title ? courseData.course.title : pageTitle}
          </h1>
          <p className="mt-2 text-gray-600">{pageSubtitle}</p>
        </div>

        {/* Wizard Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex items-center space-x-1 min-w-max">
              {visibleSteps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = isStepCompleted(index);
                
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? 'border-primary-600 text-primary-600'
                        : isCompleted
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {step.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              {React.createElement(visibleSteps[currentStep]?.icon, { className: "h-5 w-5 mr-2" })}
              {visibleSteps[currentStep]?.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {visibleSteps[currentStep]?.description}
            </p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
            </form>
          </div>
        </div>

        {/* Wizard Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="btn-secondary"
            >
              Cancel
            </button>
            
            {currentStep < visibleSteps.length - 1 ? (
              <button
                type="button"
                onClick={handleStepComplete}
                disabled={!isStepValid(currentStep)}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStepComplete}
                disabled={isSubmitting}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Course')}
              </button>
            )}
          </div>
        </div>

        {/* Trainer Assignment Modal (Edit Mode Only) */}
        {isEditMode && showTrainerModal && (
          <TrainerAssignmentModal
            courseId={id}
            onClose={() => setShowTrainerModal(false)}
          />
        )}
      </div>
    </div>
  );
};


export default CourseManagement;

import React, { useState } from 'react';
import { PlusIcon, XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const QuizQuestionsModal = ({
  showModal,
  onClose,
  editingContent,
  addQuizQuestionsMutation
}) => {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    questionType: 'single_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
    order: 0
  });

  if (!showModal || !editingContent) return null;

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (currentQuestion.questionType !== 'text' && !currentQuestion.correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    if ((currentQuestion.questionType === 'single_choice' || currentQuestion.questionType === 'multiple_choice')) {
      const validOptions = currentQuestion.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast.error('Please provide at least 2 options');
        return;
      }
    }

    const newQuestion = {
      ...currentQuestion,
      order: quizQuestions.length
    };

    setQuizQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestion({
      question: '',
      questionType: 'single_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: '',
      order: 0
    });
  };

  const removeQuestion = (index) => {
    setQuizQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddQuizQuestions = () => {
    if (quizQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    addQuizQuestionsMutation.mutate({
      contentId: editingContent.id,
      questions: quizQuestions
    }, {
      onSuccess: () => {
        setQuizQuestions([]);
        setCurrentQuestion({
          question: '',
          questionType: 'single_choice',
          options: ['', '', '', ''],
          correctAnswer: '',
          points: 1,
          explanation: '',
          order: 0
        });
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Add Quiz Questions for "{editingContent.title}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Question Form */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Question</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question
              </label>
              <textarea
                name="question"
                value={currentQuestion.question}
                onChange={handleQuestionFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter your question..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                name="questionType"
                value={currentQuestion.questionType}
                onChange={handleQuestionFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="text">Text Answer</option>
              </select>
            </div>

            {/* Options for single/multiple choice */}
            {(currentQuestion.questionType === 'single_choice' || currentQuestion.questionType === 'multiple_choice') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer
              </label>
              {currentQuestion.questionType === 'true_false' ? (
                <select
                  name="correctAnswer"
                  value={currentQuestion.correctAnswer}
                  onChange={handleQuestionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select correct answer</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : currentQuestion.questionType === 'text' ? (
                <input
                  type="text"
                  name="correctAnswer"
                  value={currentQuestion.correctAnswer}
                  onChange={handleQuestionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sample correct answer (optional)"
                />
              ) : (
                <select
                  name="correctAnswer"
                  value={currentQuestion.correctAnswer}
                  onChange={handleQuestionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select correct answer</option>
                  {currentQuestion.options.filter(opt => opt.trim()).map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                name="points"
                value={currentQuestion.points}
                onChange={handleQuestionFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (Optional)
              </label>
              <textarea
                name="explanation"
                value={currentQuestion.explanation}
                onChange={handleQuestionFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Explain why this is the correct answer..."
              />
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 w-full flex items-center justify-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Question
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Questions ({quizQuestions.length})
            </h3>
            
            {quizQuestions.length > 0 ? (
              <div className="space-y-3">
                {quizQuestions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Type: {question.questionType.replace('_', ' ')} | Points: {question.points}
                    </p>
                    {question.options && question.options.filter(opt => opt.trim()).length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Options:</p>
                        <ul className="list-disc list-inside">
                          {question.options.filter(opt => opt.trim()).map((option, optIndex) => (
                            <li key={optIndex} className={option === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {question.explanation && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <QuestionMarkCircleIcon className="h-12 w-12 mx-auto mb-4" />
                <p>No questions added yet</p>
              </div>
            )}

            {quizQuestions.length > 0 && (
              <button
                onClick={handleAddQuizQuestions}
                disabled={addQuizQuestionsMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 w-full"
              >
                {addQuizQuestionsMutation.isLoading ? 'Saving...' : 'Save Questions'}
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestionsModal;

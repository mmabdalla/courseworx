# CourseContent Refactoring - Testing Plan

## 🧪 Manual Testing Checklist

### **Prerequisites**
1. Start both backend and frontend servers
2. Login as a Trainer or Super Admin user
3. Navigate to a course and click "Manage Content"

### **🔍 Core Functionality Tests**

#### **1. Page Loading & Access Control**
- [ ] Page loads without console errors
- [ ] Proper access control (only Trainers/Super Admins can access)
- [ ] Loading spinner displays while fetching data
- [ ] Error handling works if API fails

#### **2. Section Management**
- [ ] **Add Section**:
  - [ ] Click "Add Section" button
  - [ ] Modal opens correctly
  - [ ] Fill in title, description, order
  - [ ] Submit creates new section
  - [ ] Modal closes and form resets
  - [ ] New section appears in list
- [ ] **Edit Section**:
  - [ ] Click edit icon on existing section
  - [ ] Modal opens with pre-filled data
  - [ ] Modify fields and submit
  - [ ] Changes are saved and displayed
- [ ] **Delete Section**:
  - [ ] Click delete icon
  - [ ] Confirmation dialog appears
  - [ ] Section is removed after confirmation
  - [ ] Content moves to "Uncategorized"
- [ ] **Section Expansion**:
  - [ ] Click chevron to expand/collapse sections
  - [ ] Content shows/hides correctly

#### **3. Content Management**
- [ ] **Add Content**:
  - [ ] Click "Add Content" button
  - [ ] Modal opens with all content type options
  - [ ] Test each content type:
    - [ ] Document (with file upload)
    - [ ] Image (with file upload or URL)
    - [ ] Video (with file upload or URL)
    - [ ] Article (with text content)
    - [ ] Quiz (placeholder for questions)
    - [ ] Certificate
  - [ ] Section assignment dropdown works
  - [ ] Required/Published checkboxes work
  - [ ] Points and order fields work
  - [ ] Submit creates content successfully
- [ ] **Edit Content**:
  - [ ] Click edit icon on content
  - [ ] Modal opens with current data
  - [ ] Modify and save changes
  - [ ] Changes reflect immediately
- [ ] **Delete Content**:
  - [ ] Click delete icon
  - [ ] Confirmation dialog works
  - [ ] Content is removed

#### **4. File Upload**
- [ ] **Document Upload**:
  - [ ] Select PDF, DOC, DOCX files
  - [ ] Upload progress/success feedback
  - [ ] File URL is set correctly
- [ ] **Image Upload**:
  - [ ] Select image files
  - [ ] Upload works correctly
  - [ ] Alternative URL input works
- [ ] **Video Upload**:
  - [ ] Select video files
  - [ ] Upload functionality works
  - [ ] Alternative URL input works

#### **5. Quiz Questions**
- [ ] **Quiz Content**:
  - [ ] Create quiz content
  - [ ] Click "Manage Questions" button
  - [ ] Quiz questions modal opens
- [ ] **Add Questions**:
  - [ ] Add single choice questions
  - [ ] Add multiple choice questions
  - [ ] Add true/false questions
  - [ ] Add text answer questions
  - [ ] Set correct answers
  - [ ] Add explanations
  - [ ] Set points per question
- [ ] **Question Management**:
  - [ ] Remove questions works
  - [ ] Questions display correctly
  - [ ] Save questions functionality

#### **6. Drag & Drop**
- [ ] **Content Reordering**:
  - [ ] Drag content within same section
  - [ ] Content order updates
  - [ ] Drag content between sections
  - [ ] Content moves to new section
  - [ ] Drag to "Uncategorized" works
- [ ] **Visual Feedback**:
  - [ ] Drag handles are visible
  - [ ] Drop zones highlight correctly
  - [ ] Animations work smoothly

#### **7. UI/UX Tests**
- [ ] **Responsive Design**:
  - [ ] Works on desktop (1920x1080)
  - [ ] Works on tablet (768px width)
  - [ ] Works on mobile (375px width)
- [ ] **Visual Elements**:
  - [ ] Icons display correctly
  - [ ] Content type badges show
  - [ ] Required/Draft badges work
  - [ ] Colors and styling consistent
- [ ] **Navigation**:
  - [ ] Back button works
  - [ ] Modal close buttons work
  - [ ] Keyboard navigation (Tab, Enter, Escape)

### **🚨 Error Scenarios**
- [ ] Network errors during API calls
- [ ] Large file uploads
- [ ] Invalid form submissions
- [ ] Concurrent user modifications
- [ ] Browser refresh during operations

### **⚡ Performance Tests**
- [ ] Page loads quickly (<2 seconds)
- [ ] Smooth animations and transitions
- [ ] No memory leaks during extended use
- [ ] Efficient re-renders (check React DevTools)

### **🔧 Development Tests**
- [ ] No console errors or warnings
- [ ] No linting errors
- [ ] All imports resolve correctly
- [ ] TypeScript compilation (if applicable)

## 🤖 Automated Testing Commands

```bash
# Run linting
npm run lint

# Check for unused dependencies
npm run analyze

# Build test
npm run build

# Start development server
npm start
```

## 📊 Performance Monitoring

Use React DevTools Profiler to check:
- Component render times
- Unnecessary re-renders
- Memory usage
- State updates frequency

## ✅ Sign-off Criteria

**All tests must pass before considering the refactoring complete:**
- ✅ Zero console errors
- ✅ All functionality works as before
- ✅ Performance is same or better
- ✅ Code is clean and maintainable
- ✅ No accessibility regressions

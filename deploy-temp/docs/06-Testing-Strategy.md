# CourseWorx Testing Strategy

## 📋 Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024-12-19
- **Author**: AI Assistant
- **Status**: Draft - Ready for Review

## 🎯 Testing Philosophy

CourseWorx testing strategy is built on the foundation of:
- **Quality Assurance**: Prevent bugs before they reach production
- **Confidence**: Ensure changes don't break existing functionality
- **Documentation**: Tests serve as living documentation
- **Automation**: Reduce manual testing overhead
- **Fast Feedback**: Quick identification of issues

## 🏗️ Testing Architecture

### Testing Pyramid
```
                    E2E Tests (5%)
                 ┌─────────────────┐
                 │   User Journeys │
                 │   Critical Flows │
                 └─────────────────┘
            
              Integration Tests (25%)
         ┌─────────────────────────────┐
         │      API Endpoints          │
         │   Database Integration      │
         │  Component Integration      │
         └─────────────────────────────┘

                Unit Tests (70%)
    ┌─────────────────────────────────────────┐
    │           Component Logic               │
    │          Utility Functions              │
    │         Business Logic                  │
    │          API Services                   │
    └─────────────────────────────────────────┘
```

## 🧪 Testing Framework Setup

### Frontend Testing Stack
```javascript
// package.json dependencies
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/user-event": "^14.5.2",
    "jest": "^27.5.1",
    "msw": "^1.3.2",
    "cypress": "^12.17.4"
  }
}
```

### Backend Testing Stack
```javascript
// package.json dependencies
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "factory-bot": "^1.0.0",
    "@types/jest": "^29.5.8"
  }
}
```

## 🔧 Unit Testing Strategy

### 1. Component Testing
```javascript
// Example: LoadingSpinner.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading spinner with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders custom loading message', () => {
    render(<LoadingSpinner message="Saving your data..." />);
    expect(screen.getByText('Saving your data...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    expect(screen.getByRole('status')).toHaveClass('custom-spinner');
  });
});
```

### 2. Hook Testing
```javascript
// Example: useAuth.test.js
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../contexts/AuthContext';

describe('useAuth', () => {
  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeTruthy();
    expect(result.current.user.email).toBe('test@example.com');
  });
});
```

### 3. Utility Function Testing
```javascript
// Example: imageUtils.test.js
import { validateImageFile, resizeImage } from '../utils/imageUtils';

describe('imageUtils', () => {
  describe('validateImageFile', () => {
    it('should accept valid image files', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(validFile)).toBe(true);
    });

    it('should reject non-image files', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(validateImageFile(invalidFile)).toBe(false);
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      expect(validateImageFile(largeFile)).toBe(false);
    });
  });
});
```

## 🔗 Integration Testing Strategy

### 1. API Integration Testing
```javascript
// Example: auth.integration.test.js
import request from 'supertest';
import app from '../../server';
import { User } from '../../models';

describe('Authentication API', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create test user
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'trainee'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeTruthy();
    });
  });
});
```

### 2. Database Integration Testing
```javascript
// Example: course.integration.test.js
import { Course, User } from '../../models';
import { sequelize } from '../../config/database';

describe('Course Model Integration', () => {
  let trainer;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    trainer = await User.create({
      firstName: 'John',
      lastName: 'Trainer',
      email: 'trainer@example.com',
      password: 'password123',
      role: 'trainer'
    });
  });

  afterEach(async () => {
    await Course.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
  });

  it('should create course with valid data', async () => {
    const courseData = {
      trainerId: trainer.id,
      title: 'Test Course',
      description: 'Test course description',
      price: 99.99,
      level: 'beginner'
    };

    const course = await Course.create(courseData);
    
    expect(course.id).toBeTruthy();
    expect(course.title).toBe('Test Course');
    expect(course.trainerId).toBe(trainer.id);
  });

  it('should validate required fields', async () => {
    await expect(Course.create({
      trainerId: trainer.id,
      description: 'Test course description'
      // Missing required title
    })).rejects.toThrow();
  });
});
```

## 🌐 End-to-End Testing Strategy

### 1. Critical User Journeys
```javascript
// Example: user-registration.e2e.js
describe('User Registration Flow', () => {
  it('should allow new user to register and login', () => {
    cy.visit('/');
    
    // Navigate to registration
    cy.get('[data-testid="register-button"]').click();
    
    // Fill registration form
    cy.get('[data-testid="first-name"]').type('John');
    cy.get('[data-testid="last-name"]').type('Doe');
    cy.get('[data-testid="email"]').type('john.doe@example.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="confirm-password"]').type('password123');
    
    // Submit registration
    cy.get('[data-testid="register-submit"]').click();
    
    // Verify success
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-name"]').should('contain', 'John Doe');
  });
});
```

### 2. Course Management Flow
```javascript
// Example: course-creation.e2e.js
describe('Course Creation Flow', () => {
  beforeEach(() => {
    cy.loginAsTrainer();
  });

  it('should create a new course successfully', () => {
    cy.visit('/courses/create');
    
    // Fill course form
    cy.get('[data-testid="course-title"]').type('Advanced React Development');
    cy.get('[data-testid="course-description"]').type('Learn advanced React concepts');
    cy.get('[data-testid="course-price"]').type('199.99');
    cy.get('[data-testid="course-level"]').select('advanced');
    
    // Upload thumbnail
    cy.get('[data-testid="course-thumbnail"]').selectFile('cypress/fixtures/course-thumbnail.jpg');
    
    // Submit course
    cy.get('[data-testid="create-course-submit"]').click();
    
    // Verify creation
    cy.url().should('match', /\/courses\/[a-f0-9-]+$/);
    cy.get('[data-testid="course-title"]').should('contain', 'Advanced React Development');
  });
});
```

## 📊 Test Data Management

### 1. Test Factories
```javascript
// Example: factories/userFactory.js
import { User } from '../../models';

export const createUser = async (overrides = {}) => {
  const defaultData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'trainee',
    isActive: true
  };

  return await User.create({ ...defaultData, ...overrides });
};

export const createTrainer = async (overrides = {}) => {
  return await createUser({ ...overrides, role: 'trainer' });
};

export const createSuperAdmin = async (overrides = {}) => {
  return await createUser({ ...overrides, role: 'super_admin' });
};
```

### 2. Test Database Setup
```javascript
// Example: setup/testDatabase.js
import { sequelize } from '../../config/database';

export const setupTestDatabase = async () => {
  // Use separate test database
  process.env.DB_NAME = 'courseworx_test';
  
  // Sync database schema
  await sequelize.sync({ force: true });
};

export const cleanupTestDatabase = async () => {
  await sequelize.drop();
  await sequelize.close();
};

// Jest setup file
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});
```

## 🎭 Mocking Strategy

### 1. API Mocking with MSW
```javascript
// Example: mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { identifier, password } = req.body;
    
    if (identifier === 'test@example.com' && password === 'password123') {
      return res(
        ctx.json({
          token: 'mock-jwt-token',
          user: {
            id: '1',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            role: 'trainee'
          }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),

  // Courses endpoints
  rest.get('/api/courses', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: '1',
            title: 'React Fundamentals',
            description: 'Learn React basics',
            price: 99.99,
            level: 'beginner'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      })
    );
  })
];
```

### 2. Component Mocking
```javascript
// Example: __mocks__/react-router-dom.js
export const useNavigate = () => jest.fn();
export const useParams = () => ({ id: 'test-id' });
export const Link = ({ children, to }) => <a href={to}>{children}</a>;
```

## 📈 Test Coverage Strategy

### 1. Coverage Requirements
- **New Features**: 80% minimum coverage
- **Bug Fixes**: Add regression tests
- **Critical Paths**: 95% coverage (auth, payments)
- **Utilities**: 90% coverage

### 2. Coverage Reporting
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## 🚀 Continuous Integration Testing

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: courseworx_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run backend tests
        run: cd backend && npm test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: courseworx_test
          DB_USER: postgres
          DB_PASSWORD: postgres
      
      - name: Run frontend tests
        run: cd frontend && npm test -- --coverage --watchAll=false
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

## 🐛 Testing Best Practices

### 1. Test Organization
- **Describe Blocks**: Group related tests
- **Descriptive Names**: Clear test descriptions
- **AAA Pattern**: Arrange, Act, Assert
- **Single Assertion**: One assertion per test when possible

### 2. Test Maintenance
- **DRY Principle**: Avoid duplicate test code
- **Test Utilities**: Create helper functions
- **Regular Cleanup**: Remove obsolete tests
- **Documentation**: Comment complex test logic

### 3. Performance Testing
```javascript
// Example: performance test
describe('Course List Performance', () => {
  it('should render 1000 courses within 100ms', async () => {
    const largeCourseList = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      title: `Course ${i}`,
      description: `Description ${i}`
    }));

    const startTime = performance.now();
    render(<CourseList courses={largeCourseList} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
  });
});
```

---

**Next Steps**:
1. Set up testing infrastructure
2. Write tests for critical components
3. Implement CI/CD pipeline
4. Establish coverage requirements
5. Train team on testing practices

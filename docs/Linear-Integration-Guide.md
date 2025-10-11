# Linear Integration Guide for CourseWorx

## 🚀 Linear + GitHub Integration Setup

This guide shows how to integrate your new Linear account with CourseWorx for advanced project management, replacing traditional GitHub Issues with Linear's powerful workflow system.

## 🎯 Why Linear for CourseWorx?

Linear provides superior project management compared to GitHub Issues:
- **Spec Management**: Better than GitHub's basic issue templates
- **Sprint Planning**: Advanced roadmap and milestone tracking
- **Team Collaboration**: Superior to GitHub Projects
- **Issue Tracking**: More sophisticated than GitHub Issues
- **Requirements Management**: Perfect for spec kit workflows

## 📋 Linear Setup Steps

### 1. Initial Linear Configuration

#### Connect Linear to GitHub
1. **Go to Linear Settings**: https://linear.app/settings/integrations
2. **Add GitHub Integration**: 
   - Click "Add Integration" → GitHub
   - Authorize Linear to access your repositories
   - Select your CourseWorx repository

#### Configure Linear Workspace
```markdown
Workspace Name: CourseWorx Development
Team Name: CourseWorx Team
Projects: 
  - CourseWorx Core Platform
  - Mobile Development
  - Feature Specifications
```

### 2. Linear Project Structure

#### Teams Setup
```yaml
Teams:
  - CourseWorx Core:
      Description: Main platform development
      Key: CW
      
  - Mobile Team:
      Description: Mobile and cross-platform work  
      Key: MOB
      
  - Specifications:
      Description: Requirements and spec management
      Key: SPEC
```

#### Issue Types Configuration
```yaml
Issue Types:
  - Epic: 🎯 Large features or initiatives
  - Feature: ✨ New functionality 
  - Bug: 🐛 Issues and fixes
  - Improvement: 🔧 Enhancements
  - Spec: 📋 Requirements and specifications
  - Mobile: 📱 Mobile-specific work
  - Backend: ⚙️ Server-side development
  - Frontend: 🎨 UI/UX development
```

#### Labels Setup
```yaml
Priority Labels:
  - Critical: 🔴 System down, blocking
  - High: 🟠 Important for current sprint  
  - Medium: 🟡 Standard priority
  - Low: 🟢 Nice to have

Component Labels:
  - authentication: 🔐 Auth system
  - courses: 📚 Course management
  - enrollment: 👥 Student enrollment
  - attendance: 📅 Attendance tracking
  - assignments: 📝 Assignment system
  - ui-ux: 🎨 User interface
  - database: 💾 Data layer
  - api: 🔌 Backend API
  - mobile: 📱 Mobile features
  - security: 🛡️ Security related
```

### 3. Workflow States

#### Standard Workflow
```yaml
States:
  Todo: 📋 Ready for development
  In Progress: 🔄 Currently being worked on  
  In Review: 👀 Code review or testing
  Testing: 🧪 QA and testing phase
  Done: ✅ Completed and deployed
  Cancelled: ❌ No longer needed
```

#### Spec-Specific Workflow  
```yaml
Spec States:
  Draft: 📝 Initial requirements gathering
  Review: 🔍 Stakeholder review
  Approved: ✅ Ready for development
  In Development: 🔧 Being implemented
  Testing: 🧪 Spec validation
  Complete: 🎯 Spec fully implemented
```

### 4. Linear CLI Setup

#### Installation
```bash
# Install Linear CLI
npm install -g @linear/cli

# Authenticate with Linear
linear auth

# Set up for CourseWorx repository
cd /workspace
linear init
```

#### Basic Commands
```bash
# Create issue from command line
linear issue create --title "Add mobile responsive header" --team CW

# Link commits to Linear issues
git commit -m "CW-123: Implement mobile header responsive design"

# View current sprint
linear issues --status "In Progress"

# Create spec issue
linear issue create --title "User Authentication Specification" --team SPEC --type Spec
```

### 5. GitHub Integration Configuration

#### Automatic Issue Linking
Linear automatically links GitHub commits and PRs when you:

```bash
# Use Linear issue ID in commit messages
git commit -m "CW-45: Fix mobile navigation bug"

# Use Linear ID in PR titles
"CW-67: Add course enrollment mobile UI"

# Use Linear ID in branch names
git checkout -b "feature/CW-89-mobile-attendance"
```

#### Linear Bot Configuration
Add to your GitHub repository settings:
```yaml
# .github/linear.yml
linear:
  webhook_url: "https://webhook.linear.app/github"
  auto_assign: true
  sync_labels: true
  close_on_merge: true
```

### 6. Spec Management Workflow

#### Creating Specifications
```markdown
# Linear Issue Template for Specs

Title: [SPEC] Mobile Attendance System Requirements
Type: Spec
Team: Specifications
Priority: High

## Overview
Brief description of the feature/system

## User Stories
- As a trainee, I want to check in via mobile...
- As a trainer, I want to view attendance on mobile...

## Acceptance Criteria  
- [ ] Mobile UI is responsive on all devices
- [ ] QR code scanning works in mobile browsers
- [ ] Offline attendance tracking capability

## Technical Requirements
- React Native components
- PWA offline support  
- Integration with existing backend

## Dependencies
- Relates to: CW-23 (Backend attendance API)
- Blocks: CW-45 (Mobile dashboard)

## Design Assets
- Link to Figma designs
- Screenshots or mockups
```

#### Spec Review Process
1. **Create Spec Issue**: Use SPEC team in Linear
2. **Stakeholder Review**: Assign to product owner
3. **Technical Review**: Assign to lead developer  
4. **Approval**: Move to "Approved" state
5. **Break Down**: Create development issues (CW-xxx)
6. **Track Progress**: Monitor implementation

### 7. Integration with CourseWorx Development

#### Project Cycles
```yaml
Cycles (2-week sprints):
  Sprint 1: Mobile UI Foundation
    - CW-101: Responsive navigation 
    - CW-102: Mobile course cards
    - CW-103: Touch-friendly buttons
    
  Sprint 2: Mobile Attendance
    - CW-201: QR code scanner
    - CW-202: Offline attendance
    - CW-203: Sync functionality

  Sprint 3: Mobile Course Management  
    - CW-301: Mobile course creation
    - CW-302: Content upload on mobile
    - CW-303: Assignment management
```

#### Roadmap Planning
```markdown
Roadmap Items:
  Q1 2024: Mobile Platform Foundation
    - Complete responsive design
    - Implement PWA features  
    - Basic mobile functionality
    
  Q2 2024: Advanced Mobile Features
    - Offline capabilities
    - Push notifications
    - Advanced touch interactions
    
  Q3 2024: Cross-Platform Optimization
    - Performance improvements
    - Desktop-mobile sync
    - Advanced collaboration tools
```

### 8. Linear Shortcuts and Productivity

#### Keyboard Shortcuts
```markdown
Essential Shortcuts:
  C: Create new issue
  /: Search issues
  K: Command palette  
  G + I: Go to issues
  G + R: Go to roadmap
  G + P: Go to projects
```

#### Quick Actions
```markdown
Issue Management:
  Ctrl/Cmd + Enter: Create issue
  E: Edit current issue
  A: Assign to someone
  L: Add labels
  S: Change status
  P: Set priority
```

### 9. Reporting and Analytics

#### Linear Insights
```markdown
Track Progress:
  - Velocity: Issues completed per sprint
  - Cycle time: Time from start to completion  
  - Team performance: Individual and team metrics
  - Burndown: Sprint progress visualization
```

#### Custom Views
```markdown
Useful Views:
  - My Mobile Issues: assigned:me label:mobile
  - Current Sprint: cycle:"Current Sprint"  
  - Specs Pending: team:SPEC state:"Review"
  - High Priority: priority:high
  - Mobile Bugs: type:bug label:mobile
```

### 10. Migration from GitHub Issues

#### Export Existing Issues
```bash
# If you have existing GitHub issues to migrate
# Use Linear's GitHub import feature:
# 1. Go to Settings > Import > GitHub Issues  
# 2. Select your CourseWorx repository
# 3. Choose which issues to import
# 4. Map labels and assignees
```

#### Maintaining GitHub Issues Temporarily
```markdown
Parallel Usage:
- Use GitHub Issues for: Bug reports from users
- Use Linear for: Development planning, specs, sprints
- Eventually: Migrate all to Linear as team adopts it
```

## 🎯 Next Steps

1. **Set up Linear Account**: Create workspace and teams
2. **Configure GitHub Integration**: Connect repositories  
3. **Import Existing Work**: Migrate current issues/projects
4. **Create First Spec**: Start with mobile attendance feature
5. **Team Onboarding**: Train team on Linear workflow
6. **Iterate**: Refine workflow based on usage

## 💡 Linear Best Practices for CourseWorx

### Issue Naming Convention
```markdown
Format: [Component] Brief description
Examples:
  - [Mobile] Add responsive navigation header
  - [Auth] Implement mobile login flow
  - [Spec] Course enrollment requirements  
  - [API] Mobile attendance endpoints
```

### Issue Relationships
```markdown
Use Relations:
  - Blocks: This issue prevents another from starting
  - Relates to: Connected but not dependent
  - Duplicates: Same issue reported multiple times
  - Parent/Child: Epic breakdown structure
```

### Estimation
```markdown
Story Points (Fibonacci):
  - 1: Small bug fix or minor UI tweak
  - 2: Small feature, few hours of work
  - 3: Medium feature, half day of work  
  - 5: Large feature, full day of work
  - 8: Complex feature, multiple days
  - 13: Epic that should be broken down
```

---
*Linear provides the perfect project management foundation for CourseWorx's cross-platform development workflow.*
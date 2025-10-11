#!/bin/bash

# CourseWorx Mobile-Desktop Development Setup Script
# This script helps set up your development environment for cross-platform work

echo "🚀 CourseWorx Mobile-Desktop Development Setup"
echo "=============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Linear CLI
install_linear_cli() {
    echo "📋 Installing Linear CLI..."
    if command_exists npm; then
        npm install -g @linear/cli
        echo "✅ Linear CLI installed successfully"
    else
        echo "❌ npm not found. Please install Node.js first."
        exit 1
    fi
}

# Function to set up GitHub Codespaces configuration
setup_codespaces() {
    echo "☁️ Setting up GitHub Codespaces configuration..."
    
    mkdir -p .devcontainer
    
    cat > .devcontainer/devcontainer.json << 'EOF'
{
    "name": "CourseWorx Development",
    "image": "mcr.microsoft.com/vscode/devcontainers/typescript-node:16",
    "features": {
        "ghcr.io/devcontainers/features/github-cli:1": {},
        "ghcr.io/devcontainers/features/node:1": {
            "version": "18"
        }
    },
    "forwardPorts": [3000, 5000],
    "postCreateCommand": "npm run install-all",
    "customizations": {
        "vscode": {
            "extensions": [
                "ms-vscode.vscode-typescript-next",
                "bradlc.vscode-tailwindcss",
                "ms-vscode.vscode-json",
                "GitHub.copilot",
                "esbenp.prettier-vscode"
            ],
            "settings": {
                "terminal.integrated.shell.linux": "/bin/bash"
            }
        }
    },
    "remoteEnv": {
        "NODE_ENV": "development"
    }
}
EOF

    echo "✅ Codespaces configuration created"
}

# Function to create mobile development branch
create_mobile_branch() {
    echo "📱 Setting up mobile development branch..."
    
    # Check if we're in a git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        # Create and switch to mobile development branch
        git checkout -b feature/mobile-development 2>/dev/null || git checkout feature/mobile-development
        echo "✅ Mobile development branch ready"
    else
        echo "⚠️ Not in a git repository. Skipping branch creation."
    fi
}

# Function to set up Linear integration
setup_linear() {
    echo "🔗 Setting up Linear integration..."
    
    # Create Linear configuration
    cat > .linear.yml << 'EOF'
# Linear Configuration for CourseWorx
workspace: courseworx-development
default_team: CW

# Issue templates
templates:
  feature: |
    ## Description
    Brief description of the feature
    
    ## Acceptance Criteria
    - [ ] Requirement 1
    - [ ] Requirement 2
    
    ## Technical Notes
    Any technical considerations
    
  bug: |
    ## Description
    What is the bug?
    
    ## Steps to Reproduce
    1. Step 1
    2. Step 2
    
    ## Expected Behavior
    What should happen?
    
    ## Actual Behavior
    What actually happens?
    
  spec: |
    ## Overview
    High-level description of the specification
    
    ## User Stories
    - As a [user type], I want [goal] so that [benefit]
    
    ## Acceptance Criteria
    - [ ] Criteria 1
    - [ ] Criteria 2
    
    ## Technical Requirements
    - System requirements
    - Integration points
    
    ## Dependencies
    - Depends on: [Issue IDs]
    - Blocks: [Issue IDs]
EOF

    echo "✅ Linear configuration created"
}

# Function to create mobile-friendly npm scripts
setup_mobile_scripts() {
    echo "📱 Setting up mobile-friendly development scripts..."
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        # Backup original package.json
        cp package.json package.json.bak
        
        # Add mobile development scripts using Node.js
        node << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add mobile development scripts
pkg.scripts = pkg.scripts || {};
pkg.scripts['dev:mobile'] = 'concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" "npm run server" "npm run client:mobile"';
pkg.scripts['client:mobile'] = 'cd frontend && BROWSER=none npm start';
pkg.scripts['preview:mobile'] = 'cd frontend && npm run build && npx serve -s build -p 3000';
pkg.scripts['test:mobile'] = 'cd frontend && npm test -- --watchAll=false';
pkg.scripts['lint:mobile'] = 'cd frontend && npx eslint src/ --ext .js,.jsx';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Mobile scripts added to package.json');
EOF
    else
        echo "⚠️ package.json not found. Skipping mobile scripts setup."
    fi
}

# Function to create mobile testing configuration
setup_mobile_testing() {
    echo "🧪 Setting up mobile testing configuration..."
    
    mkdir -p frontend/src/__tests__/mobile
    
    cat > frontend/src/__tests__/mobile/responsive.test.js << 'EOF'
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Mobile Responsive Tests', () => {
  beforeEach(() => {
    // Mock mobile viewport
    global.innerWidth = 375;
    global.innerHeight = 667;
    global.dispatchEvent(new Event('resize'));
  });

  test('should render mobile-friendly layout', () => {
    // Add your mobile-specific component tests here
    expect(true).toBe(true); // Placeholder test
  });
  
  test('should handle touch events', () => {
    // Add touch event tests here
    expect(true).toBe(true); // Placeholder test
  });
});
EOF

    echo "✅ Mobile testing configuration created"
}

# Function to create workflow documentation
create_workflow_docs() {
    echo "📚 Creating workflow documentation..."
    
    cat > MOBILE_WORKFLOW.md << 'EOF'
# Mobile-Desktop Development Workflow

## Quick Start Commands

### Mobile Development
```bash
# Start mobile-optimized development server
npm run dev:mobile

# Test mobile responsiveness
npm run test:mobile

# Build and preview mobile version
npm run preview:mobile
```

### Git Workflow for Mobile-Desktop Sync
```bash
# Start mobile work
git checkout feature/mobile-development
git pull origin main

# Make changes on mobile (via Codespaces/GitPod)
# Commit with Linear integration
git commit -m "CW-123: Add mobile navigation component"

# Push changes
git push origin feature/mobile-development

# Continue on desktop
git checkout feature/mobile-development
git pull origin feature/mobile-development
npm run dev
```

### Linear Integration Commands
```bash
# Create issue from CLI
linear issue create --title "Mobile: Fix responsive header"

# View current mobile issues
linear issues --label mobile

# Link commits to Linear
git commit -m "CW-456: Implement mobile touch gestures"
```

## Development Environment URLs

- **Local Development**: http://localhost:3000
- **Mobile Testing**: Use browser dev tools or access via local IP
- **Codespaces**: Forwarded port will be provided
- **GitPod**: Workspace URL will be provided

## Mobile Testing Checklist

- [ ] Test on actual mobile devices
- [ ] Check responsive breakpoints
- [ ] Verify touch interactions
- [ ] Test offline functionality (if applicable)
- [ ] Validate performance on mobile networks
- [ ] Check accessibility on mobile screen readers

EOF

    echo "✅ Workflow documentation created"
}

# Main setup function
main() {
    echo "Starting CourseWorx mobile-desktop development setup..."
    echo ""
    
    # Check prerequisites
    echo "🔍 Checking prerequisites..."
    
    if ! command_exists git; then
        echo "❌ Git not found. Please install Git first."
        exit 1
    fi
    
    if ! command_exists node; then
        echo "❌ Node.js not found. Please install Node.js first."
        exit 1
    fi
    
    if ! command_exists npm; then
        echo "❌ npm not found. Please install npm first."
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
    echo ""
    
    # Run setup steps
    setup_codespaces
    echo ""
    
    create_mobile_branch
    echo ""
    
    setup_linear
    echo ""
    
    setup_mobile_scripts
    echo ""
    
    setup_mobile_testing
    echo ""
    
    create_workflow_docs
    echo ""
    
    # Optional: Install Linear CLI
    read -p "📋 Install Linear CLI? (y/n): " install_linear
    if [[ $install_linear =~ ^[Yy]$ ]]; then
        install_linear_cli
    fi
    
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "Next Steps:"
    echo "1. 📱 Push changes to enable Codespaces: git add . && git commit -m 'Add mobile dev setup' && git push"
    echo "2. ☁️ Create Codespace: Go to GitHub → Code → Codespaces → Create"
    echo "3. 🔗 Set up Linear: Visit linear.app and follow the Linear Integration Guide"
    echo "4. 🚀 Start Development: npm run dev:mobile"
    echo ""
    echo "📖 Read the documentation:"
    echo "   - docs/Mobile-Desktop-Development-Guide.md"
    echo "   - docs/Linear-Integration-Guide.md" 
    echo "   - MOBILE_WORKFLOW.md"
    echo ""
    echo "Happy coding! 🚀"
}

# Run main function
main "$@"
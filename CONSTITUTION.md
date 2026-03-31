# CourseWorx Project Constitution

**Version**: 1.0.1 (SemVer)
**Status**: ACTIVE
**Last Updated**: 2026-03-31

## 1. Governance & Standards

### 1.1 Versioning
The project adheres strictly to [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).
- Format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Incompatible API changes.
- **MINOR**: New functionality in a backwards-compatible manner.
- **PATCH**: Backwards-compatible bug fixes.

### 1.2 Development Workflow
- **Main Branch**: `main` (Production stable).
- **Development Branch**: `develop` (Integration branch).
- **Feature/Fix Branches**: All work must be performed on `feature/` or `fix/` branches branched from `develop`.
- **Merge Requirements**: PRs to `develop` must pass all backend tests and a successful production build.
- **Action Logging**: Always append summarizing actions to `version.txt` at the end of each significant change.

### 1.3 Documentation & Comments
- **Code Comments**: NEVER remove functional or explanatory comments. High-quality inline documentation is mandatory.
- **Changelog**: All changes must be recorded in `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) format.
- **Bash/PowerShell**: Maintain strict syntax and ensure cross-platform compatibility where applicable.

## 2. Technical Standards

### 2.1 Networking & Environment
- **Standard IP**: `10.0.0.50` for local area network development.
- **Frontend Port**: `3050` (Standardized from 3000).
- **Backend Port**: `5000`.
- **Environment Variables**: Prefer `.env` files. Use `switch-to-courseworx.bat` to swap environments safely.

### 2.2 Frontend (React 18)
- **Aesthetics**: UI must be premium, modern, and high-performance. Avoid generic styles.
- **Data Policy**: **ZERO MOCK DATA** in production-destined code. All data must come from the PostgreSQL backend.
- **Build Quality**: Aim for zero warnings in production builds.

### 2.3 Backend (Node.js/Sequelize)
- **Database**: PostgreSQL (Production/Dev), SQLite (Legacy/Optional tests).
- **Migrations**: Maintain schema integrity via Sequelize migrations.
- **Security**: Strict JWT validation and input sanitization.

## 3. Communication & Honesty
- AI agents must be honest about limitations. If a task is complex or risks breaking legacy code, a plan must be approved first.
- Always verify functional integrity after refactoring.

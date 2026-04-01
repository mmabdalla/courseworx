# CourseWorx CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.7] - 2026-04-01
### Added
- Universal Role-based Notification System:
    - Notification drawer and bell in the primary header.
    - Automatic notifications for enrollments, course creation, and assignment assignments.
    - Global error synchronization alerting Super Admins of backend failures.
- Super Admin System Logs Page:
    - Real-time backend log streaming (`system.log`) with role-based activity colors.
    - Administrative capability to clear logs via UI.
- Premium Header Refactor:
    - Refactored user profile menu to show only initials/icon by default.
    - Name, role, and logout moved to a premium dropdown for a cleaner, modern look.

### Changed
- Networking Model:
    - Fully configurable environment-driven IP addressing (Purged all `10.0.0.96` references).
    - Dynamic CORS addressing based on configurable `SERVER_IP` variables.

### Fixed
- User Management Modal: Resolved "Failed to save user" issue when updating passwords.

## [2.0.6] - 2026-03-31

## [1.0.1] - 2026-03-31
### Added
- `CONSTITUTION.md`: Unified project rules and governance.
- `ROADMAP.md`: Consolidated project history and future development phases.
- `CHANGELOG.md`: This file.
- Backend testing suite: Added Jest and Supertest with real PostgreSQL support.

### Changed
- Local development IP migrated from `10.0.0.96` to `10.0.0.50`.
- Standardized backend and frontend ports to be configurable via environment variables (Default: Backend 5000, Frontend 3050).
- Consolidated all project rules into `CONSTITUTION.md`.
- Consolidated all development phases into `ROADMAP.md`.

### Fixed
- Re-applied linting and stability fixes to various frontend components with strict preservation of code comments and documentation.
- Restored `togglePictureInPicture` and other critical video player methods in `ProfessionalVideoPlayer.js`.
- Fixed `User-simple.test.js` to ensure proper database isolation between test runs.
- Resolved `react-query` dependency issues in frontend to enable successful production builds.
- Fixed `bounce.bat` and `switch-to-courseworx.bat` to correctly use port 3050.

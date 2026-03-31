# CourseWorx CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

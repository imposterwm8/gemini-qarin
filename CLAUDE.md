# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building and Development
- `npm run build` - Build the entire project
- `npm run start` - Start the CLI locally  
- `npm run debug` - Start with debugging enabled
- `npm run preflight` - Run complete validation suite (build, test, typecheck, lint) - **always run before submitting changes**

### Testing
- `npm run test` - Run all tests across workspaces
- `npm run test:ci` - Run tests for CI with coverage
- `npm run test:e2e` - Run end-to-end integration tests
- `npm run test:integration:all` - Run all integration tests (with different sandbox configurations)

### Linting and Type Checking
- `npm run lint` - Run ESLint on codebase
- `npm run lint:fix` - Fix lintable issues automatically
- `npm run typecheck` - Run TypeScript type checking across workspaces

### Sandbox and Specialized Builds
- `npm run build:sandbox` - Build sandbox environment
- `npm run build:vscode` - Build VS Code companion extension

## Architecture Overview

Gemini CLI is organized as a monorepo with two main packages:

### Core Packages
1. **`packages/cli`** - User-facing terminal interface
   - Handles input processing, history, display rendering
   - React-based UI using Ink framework
   - Theme and configuration management
   - Slash commands and user interaction

2. **`packages/core`** - Backend engine
   - Gemini API client and communication
   - Tool registration and execution logic
   - Prompt construction and state management
   - File system, shell, and web tools

3. **`packages/vscode-ide-companion`** - VS Code integration
   - IDE companion extension for enhanced development workflow

### Key Architectural Patterns
- **CLI → Core interaction**: CLI sends user input to Core, which orchestrates Gemini API calls and tool execution
- **Tool system**: Modular tools in `packages/core/src/tools/` extend Gemini's capabilities
- **User approval flow**: Destructive operations require explicit user confirmation
- **ES Module architecture**: Uses modern ES modules with TypeScript throughout

## Technology Stack

### Core Technologies
- **TypeScript** with strict configuration
- **Node.js 20+** as runtime requirement
- **React + Ink** for terminal UI
- **Vitest** as testing framework
- **ESBuild** for fast bundling
- **ESLint** with comprehensive rules

### Testing Framework (Vitest)
- Tests co-located with source files (`*.test.ts`, `*.test.tsx`)
- Use `vi.mock()` for mocking ES modules
- Mock critical dependencies (`fs`, `os`, external SDKs) at top of test files
- React component testing uses `ink-testing-library`
- Async testing with `async/await` and fake timers

## Code Standards and Conventions

### TypeScript Guidelines
- **Prefer plain objects over classes** with TypeScript interfaces
- **Avoid `any` types** - use `unknown` for truly unknown values
- Use type narrowing with `switch` statements and the `checkExhaustive` helper
- Leverage ES module syntax (`import`/`export`) for encapsulation over class privacy

### React Patterns (Ink-based UI)
- **Functional components with Hooks only** - no class components
- Keep components pure and side-effect-free during rendering
- Use `useState`/`useReducer` for state, `useEffect` only for synchronization
- Follow Rules of Hooks - call unconditionally at top level
- Prefer composition and small, reusable components

### Code Style
- Use hyphenated flag names (`--my-flag` not `--my_flag`)
- Embrace functional array operators (`.map()`, `.filter()`, `.reduce()`)
- Minimal comments - focus on high-value documentation only
- Apache 2.0 license headers required on all source files

## Development Workflow

### Before Submitting Changes
Always run the complete validation suite:
```bash
npm run preflight
```

This single command runs: clean, install, format, lint, build, typecheck, and tests.

### Git Workflow
- Main branch: `main`
- Create feature branches for new work
- All changes must pass preflight checks

### File Organization
- Tests co-located with source files
- Configuration files in workspace roots
- Shared utilities in appropriate package directories
- Documentation in `/docs` with comprehensive guides

## Key Configuration Files

- `package.json` - Workspace configuration and scripts
- `tsconfig.json` - TypeScript compiler settings
- `eslint.config.js` - ESLint rules and configuration
- `vitest.config.ts` - Test configuration per package
- `esbuild.config.js` - Build configuration

## Testing Considerations

### Mocking Strategy
- Mock Node.js built-ins (`fs`, `os`, `path`, `child_process`) 
- Mock external SDKs (`@google/genai`, `@modelcontextprotocol/sdk`)
- Use `vi.hoisted()` for functions needed in mock factories
- Place critical mocks at very top of test files

### Component Testing
- Use `render()` from `ink-testing-library`
- Assert with `lastFrame()` for terminal output
- Wrap components in required context providers
- Mock complex child components and custom hooks

## Project Structure

This is a TypeScript monorepo using workspaces. Key directories:
- `/packages/cli` - Terminal interface and user experience
- `/packages/core` - Core engine and tool system
- `/packages/vscode-ide-companion` - IDE integration
- `/integration-tests` - End-to-end test scenarios
- `/docs` - Comprehensive documentation
- `/scripts` - Build and automation scripts
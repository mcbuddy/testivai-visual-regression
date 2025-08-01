# Project Brief: testivAI Visual Regression

## Project Overview
testivAI Visual Regression is a TypeScript SDK designed to simplify and enhance visual regression testing with Playwright. It provides a unified approach to capturing, comparing, and managing screenshots for visual regression testing.

## Core Requirements

1. Create a TypeScript SDK for visual regression testing
2. Store baseline screenshots in `.testivai/visual-regression/baseline`
3. Support Playwright testing framework
4. Implement Git branch-based comparison
5. Generate interactive HTML reports for reviewing visual differences
6. Provide a configuration system for customization
7. Design for future AI integration capabilities

## Key Features

### Screenshot Management
- Capture screenshots during test execution
- Store baseline screenshots in a standardized location
- Compare new screenshots against baselines
- Organize screenshots by branch and test case

### Playwright Integration
- Hook into test events from Playwright
- Provide Playwright-specific plugin for seamless integration
- Optimize for Playwright's capabilities

### Git Integration
- Detect current Git branch
- Store comparison screenshots in branch-specific directories
- Support workflow for reviewing and accepting changes

### Reporting
- Generate HTML reports showing visual differences
- Provide Accept/Reject buttons for baseline updates
- Commit accepted changes to Git

### Configuration
- Support customization of test folders
- Allow configuration of diff thresholds
- Enable customization of report output directory

### Future Expansion
- Include placeholder for external AI model integration
- Design architecture to support future enhancements

## Target Users
- Frontend developers
- QA engineers
- DevOps teams
- UI/UX designers

## Success Criteria
- Seamless integration with Playwright
- Minimal configuration required for basic usage
- Clear, actionable visual difference reports
- Efficient workflow for reviewing and accepting changes
- Extensible architecture for future enhancements

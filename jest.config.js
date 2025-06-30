/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true
};

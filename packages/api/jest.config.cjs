module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@declarativeforms/types$': '<rootDir>/../types/src',
  },
};

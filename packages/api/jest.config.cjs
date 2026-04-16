module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@faker-js/faker$': '<rootDir>/src/test/faker.mock.ts',
    '^@declarativeforms/common$': '<rootDir>/../common/src',
    '^@declarativeforms/types$': '<rootDir>/../types/src',
  },
};

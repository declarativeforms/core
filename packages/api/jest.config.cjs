module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@faker-js/faker$': '<rootDir>/src/test/faker.mock.ts',
    '^@declarativeforms/engine$': '<rootDir>/../engine/src',
  },
};

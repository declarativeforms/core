module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@declarativeforms/core$': '<rootDir>/../core/src/index.ts',
    '\\.(css|png)$': '<rootDir>/test-file-stub.cjs',
  },
};

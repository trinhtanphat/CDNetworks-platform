import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.test.ts'],
  moduleNameMapper: {
    // Map alias @ của console app
    '^@/(.*)$': '<rootDir>/../../apps/console/src/$1',
  },
};

export default config;

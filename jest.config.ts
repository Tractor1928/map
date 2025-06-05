import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testMatch: [
    "**/__tests__/**/*.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)"
  ]
};

export default config; 
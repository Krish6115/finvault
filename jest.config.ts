/**
 * ──────────────────────────────────────────────
 * FinVault — Jest Configuration
 * ──────────────────────────────────────────────
 * 
 * Configures Jest to work with TypeScript using
 * ts-jest. Tests are located in the tests/ directory.
 * ──────────────────────────────────────────────
 */

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
  coverageDirectory: 'coverage',
  verbose: true,
};

export default config;

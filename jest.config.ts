import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    transform: { '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }] },
};

export default config;
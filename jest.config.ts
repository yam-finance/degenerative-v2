import type { InitialOptionsTsJest } from 'ts-jest/dist/types';
import { defaults as tsjPreset } from 'ts-jest/presets';

const configure: InitialOptionsTsJest = {
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
  transform: {
    ...tsjPreset.transform,
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|svg|pdf|jpg|jpeg)$': '<rootDir>/tests/__mocks__/fileMock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
};

export default configure;

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['dist', 'node_modules', 'index.js'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  }
);

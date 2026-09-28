import { nodeConfig } from '@cera/config/eslint/node';

export default [{ ignores: ['src/gql/**', 'migrations/**'] }, ...nodeConfig];

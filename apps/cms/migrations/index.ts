import * as migration_20260928_061546_initial_schema from './20260928_061546_initial_schema';
import * as migration_20261003_194817 from './20261003_194817';

export const migrations = [
  {
    up: migration_20260928_061546_initial_schema.up,
    down: migration_20260928_061546_initial_schema.down,
    name: '20260928_061546_initial_schema',
  },
  {
    up: migration_20261003_194817.up,
    down: migration_20261003_194817.down,
    name: '20261003_194817',
  },
];

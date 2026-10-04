import * as migration_20260928_061546_initial_schema from './20260928_061546_initial_schema';
import * as migration_20261003_194817 from './20261003_194817';
import * as migration_20261004_143519_layout_block_db_names from './20261004_143519_layout_block_db_names';
import * as migration_20261004_225944_service_presentation_missing_blocks from './20261004_225944_service_presentation_missing_blocks';

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
  {
    up: migration_20261004_143519_layout_block_db_names.up,
    down: migration_20261004_143519_layout_block_db_names.down,
    name: '20261004_143519_layout_block_db_names',
  },
  {
    up: migration_20261004_225944_service_presentation_missing_blocks.up,
    down: migration_20261004_225944_service_presentation_missing_blocks.down,
    name: '20261004_225944_service_presentation_missing_blocks',
  },
];

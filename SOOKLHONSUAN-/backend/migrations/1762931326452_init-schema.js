/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(100)', unique: true, notNull: true },
    password: { type: 'varchar(200)', notNull: true },
    plan_type: { type: 'varchar(20)' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('farms', {
    id: 'id',
    user_id: { type: 'integer', references: 'users(id)' },
    name: { type: 'varchar(100)' },
    location: { type: 'varchar(255)' },
    area_rai: { type: 'float' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('crops', {
    id: 'id',
    farm_id: { type: 'integer', references: 'farms(id)' },
    crop_type: { type: 'varchar(100)', notNull: true },
    plant_date: { type: 'date' },
    tree_count: { type: 'integer' },
    tree_age: { type: 'float' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('calculations', {
    id: 'id',
    crop_id: { type: 'integer', references: 'crops(id)' },
    calc_date: { type: 'date' },
    estimated_yield: { type: 'float' },
    actual_yield: { type: 'float' },
    condition: { type: 'varchar(20)' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('history', {
    id: 'id',
    crop_id: { type: 'integer', references: 'crops(id)' },
    date: { type: 'date' },
    notes: { type: 'text' },
    value: { type: 'float' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('history');
  pgm.dropTable('calculations');
  pgm.dropTable('crops');
  pgm.dropTable('farms');
  pgm.dropTable('users');
};

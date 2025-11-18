/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */

export const up = (pgm) => {
  pgm.createTable('province_monthly', {
    id: {
      type: 'serial',
      primaryKey: true
    },
    crop_type_id: {
      type: 'integer',
      references: 'crop_types(id)',
      notNull: true,
      onDelete: 'cascade'
    },
    province: {
      type: 'varchar(100)',
      notNull: true
    },
    month: {
      type: 'integer',
      notNull: true,
      check: 'month >= 1 AND month <= 12'
    },
    percent: {
      type: 'float',
      notNull: true,
      check: 'percent >= 0'
    },
    year: {
      type: 'integer',
      default: 2563
    },
    source: {
      type: 'text'
    }
  });

  pgm.addConstraint('province_monthly', 'province_monthly_unique_key', {
    unique: ['crop_type_id', 'province', 'month']
  });

  pgm.createIndex('province_monthly', ['province']);
  pgm.createIndex('province_monthly', ['crop_type_id']);
  pgm.createIndex('province_monthly', ['month']);
};

export const down = (pgm) => {
  pgm.dropIndex('province_monthly', ['month']);
  pgm.dropIndex('province_monthly', ['crop_type_id']);
  pgm.dropIndex('province_monthly', ['province']);
  pgm.dropConstraint('province_monthly', 'province_monthly_unique_key');
  pgm.dropTable('province_monthly');
};

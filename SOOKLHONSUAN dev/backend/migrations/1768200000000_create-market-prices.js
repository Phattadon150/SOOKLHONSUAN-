/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable('market_prices', {
    id: 'id',
    crop_type_id: {
      type: 'integer',
      notNull: true,
      references: '"crop_types"(id)',
      onDelete: 'cascade'
    },
    province: {
      type: 'varchar(100)',
      notNull: false    // null = ราคาทั่วประเทศ
    },
    price_avg: {
      type: 'numeric(10,2)',
      notNull: true
    },
    price_min: {
      type: 'numeric(10,2)',
      notNull: false
    },
    price_max: {
      type: 'numeric(10,2)',
      notNull: false
    },
    unit: {
      type: 'varchar(20)',
      notNull: true,
      default: 'THB/kg'
    },
    source: {
      type: 'varchar(255)',
      notNull: false
    },
    effective_date: {
      type: 'date',
      notNull: true
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // เพิ่ม Constraint ให้คู่ (พืช, จังหวัด, วันที่) ห้ามซ้ำกัน
  pgm.addConstraint('market_prices', 'market_prices_unique_per_day', {
    unique: ['crop_type_id', 'province', 'effective_date']
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('market_prices');
};
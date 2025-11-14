/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.createTable('province_yields', {
    id: 'id',
    crop_type_id: { type: 'integer', notNull: true, references: 'crop_types(id)' },
    province:     { type: 'varchar(100)', notNull: true }, // เช่น "เชียงใหม่"
    year:         { type: 'integer', notNull: true },      // เช่น 2024
    avg_yield_rai:{ type: 'float',   notNull: true },      // กก./ไร่
    source:       { type: 'varchar(255)' },
    created_at:   { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.addConstraint('province_yields', 'uniq_crop_province_year', {
    unique: ['crop_type_id', 'province', 'year']
  });

};

export const down = (pgm) => {
  pgm.dropTable('province_yields');
};

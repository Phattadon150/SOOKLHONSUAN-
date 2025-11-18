/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.createTable('crop_types', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true, unique: true },
    description: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.addColumn('farms', {
    crop_type_id: { type: 'integer', references: 'crop_types(id)' }
  });

  pgm.dropColumns('farms', ['location', 'area_rai']);

  pgm.sql(`
    INSERT INTO crop_types (name, description) VALUES
      ('ลำไย', 'ผลไม้เศรษฐกิจภาคเหนือ'),
      ('มะม่วง', 'ผลไม้ฤดูร้อน'),
      ('กล้วย', 'พืชที่ปลูกง่าย โตเร็ว');
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.addColumns('farms', {
    location: { type: 'varchar(255)' },
    area_rai: { type: 'float' }
  });
  pgm.dropColumn('farms', 'crop_type_id');
  pgm.dropTable('crop_types');
};

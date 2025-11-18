/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.addColumn('calculations', {
    farm_id:       { type: 'integer', references: 'farms(id)', notNull: false },
    crop_type_id:  { type: 'integer', references: 'crop_types(id)', notNull: false },
    location:      { type: 'varchar(100)' }, // จังหวัด
    area_rai:      { type: 'float' }
  });
  pgm.createIndex('calculations', ['farm_id']);
  pgm.createIndex('calculations', ['crop_type_id']);
  pgm.createIndex('calculations', ['location']);
};

export const down = (pgm) => {
  pgm.dropIndex('calculations', ['location']);
  pgm.dropIndex('calculations', ['crop_type_id']);
  pgm.dropIndex('calculations', ['farm_id']);
  pgm.dropColumns('calculations', ['farm_id','crop_type_id','location','area_rai']);
};

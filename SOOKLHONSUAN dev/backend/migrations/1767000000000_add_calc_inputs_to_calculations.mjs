/* eslint-disable camelcase */

/** @type {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  // เพิ่ม 2 คอลัมน์ (harvest_month และ tree_age_avg)
  // ที่จำเป็นสำหรับบันทึกผลการคำนวณ (ตาม calculation.Controller.js)
  pgm.addColumns('calculations', {
    harvest_month: { 
      type: 'integer', 
      notNull: false 
    },
    tree_age_avg: { 
      type: 'float', 
      notNull: false 
    }
  });
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropColumns('calculations', [
    'harvest_month', 
    'tree_age_avg'
  ]);
};
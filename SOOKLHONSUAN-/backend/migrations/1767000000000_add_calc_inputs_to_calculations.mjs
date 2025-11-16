/* eslint-disable camelcase */

/** @type {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {

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
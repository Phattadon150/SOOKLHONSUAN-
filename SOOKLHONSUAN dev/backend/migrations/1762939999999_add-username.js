/** @type {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.addColumn('users', {
    username: { type: 'varchar(50)', notNull: true, unique: true }
  });
  pgm.createIndex('users', 'username', { unique: true });
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropIndex('users', 'username', { ifExists: true });
  pgm.dropColumn('users', 'username');
};

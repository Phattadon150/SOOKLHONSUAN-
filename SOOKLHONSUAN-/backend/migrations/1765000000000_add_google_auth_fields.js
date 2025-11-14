/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */

export const up = (pgm) => {
  pgm.addColumns('users', {
    google_id: {
      type: 'varchar(255)',
      notNull: false
    },
    provider: {
      type: 'varchar(50)',
      notNull: false,
      default: 'local'
    },
    picture: {
      type: 'text',
      notNull: false
    },
    email_verified: {
      type: 'boolean',
      notNull: false,
      default: false
    }
  });

  pgm.createIndex('users', ['google_id']);
  pgm.createIndex('users', ['provider']);
};

export const down = (pgm) => {
  pgm.dropIndex('users', ['provider']);
  pgm.dropIndex('users', ['google_id']);

  pgm.dropColumns('users', ['google_id', 'provider', 'picture', 'email_verified']);
};

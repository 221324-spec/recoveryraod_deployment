const cleanDatabase = require('./cleanup_database');

cleanDatabase().catch((err) => {
  console.error('Failed to clean database:', err);
  process.exit(1);
});

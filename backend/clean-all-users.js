const cleanDatabase = require('./scripts/cleanup_database');

cleanDatabase().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

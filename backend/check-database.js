/* Robust loader for AppDataSource: try built dist first, fallback to ts-node + src */
require('reflect-metadata');
const { DataSource } = require('typeorm');
let AppDataSource;
(function loadDataSource() {
  try {
    // Nest build outputs to dist/src/...
    ({ AppDataSource } = require('./dist/src/database/data-source'));
    return;
  } catch (e1) {
    try {
      // Fallback to older path just in case
      ({ AppDataSource } = require('./dist/database/data-source'));
      return;
    } catch (e2) {
      // Load TS at runtime
      try {
        require('ts-node/register/transpile-only');
        require('tsconfig-paths/register');
        ({ AppDataSource } = require('./src/database/data-source'));
        return;
      } catch (e3) {
        console.error('Failed to load AppDataSource from dist or src:', e1?.message || e1, e2?.message || e2, e3?.message || e3);
        process.exit(1);
      }
    }
  }
})();

let ds;
async function checkDatabase() {
  try {
    // Create a safe DataSource instance that ignores TS migrations patterns
    const options = { ...AppDataSource.options, migrations: [] };
    ds = new DataSource(options);

    await ds.initialize();
    console.log('Database connected successfully');

    const users = await ds.query('SELECT id, email, "subscriptionStatus" FROM users ORDER BY id DESC LIMIT 20');
    console.log('Users in database:', users);
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    try {
      if (ds?.isInitialized) {
        await ds.destroy();
      }
    } catch {}
  }
}

checkDatabase();
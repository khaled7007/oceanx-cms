import fs from 'fs';
import path from 'path';
import { query } from '../config/database';

async function migrate() {
  const migrationPath = path.join(__dirname, '../../migrations/001_initial.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Running migrations...');
  await query(sql);
  console.log('✅ Migrations complete');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

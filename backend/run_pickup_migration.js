import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'backend',
    database: process.env.MYSQL_DATABASE || 'easygo_db',
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, 'migrations'),
  },
};

const db = knex(config);

async function runMigration() {
  try {
    console.log('🔄 Running Pickup Management migration...');
    
    const result = await db.migrate.latest();
    const completed = Array.isArray(result) ? result[0] : result;
    
    if (!completed || completed.length === 0) {
      console.log('✅ All migrations are already up to date.');
    } else {
      console.log('✅ Successfully ran migrations:');
      if (Array.isArray(completed)) {
        completed.forEach(migration => {
          console.log(`   - ${migration}`);
        });
      } else {
        console.log(`   - ${completed}`);
      }
    }
    
    console.log('✨ Pickup management tables created successfully!');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await db.destroy().catch(() => {});
    process.exit(1);
  }
}

runMigration();

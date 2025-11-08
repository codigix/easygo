import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'admin',
      password: process.env.MYSQL_PASSWORD || 'yourpassword',
      database: process.env.MYSQL_DATABASE || 'easygo_db'
    });

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = 'easygo_db'
       ORDER BY ORDINAL_POSITION`
    );

    console.log('Users table columns:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (Null: ${col.IS_NULLABLE}, Default: ${col.COLUMN_DEFAULT})`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTable();

import mysql from 'mysql2/promise';

async function checkTable() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'admin',
      password: 'yourpassword',
      database: 'easygo_db'
    });

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'franchises' AND TABLE_SCHEMA = 'easygo_db'
       ORDER BY ORDINAL_POSITION`
    );

    console.log('Franchises table columns:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (Null: ${col.IS_NULLABLE})`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTable();

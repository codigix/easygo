import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'admin',
      password: 'yourpassword',
      database: 'easygo_db'
    });

    console.log('🔄 Creating test data...\n');

    // Clean up existing test data
    try {
      await connection.query('DELETE FROM users WHERE username = ?', ['admin']);
      await connection.query('DELETE FROM franchises WHERE franchise_code = ?', ['FR001']);
      console.log('✅ Cleaned up existing test data');
    } catch (e) {
      // Ignore errors if tables are empty
    }

    // Create a franchise first
    const franchiseQuery = `
      INSERT INTO franchises (
        franchise_code,
        franchise_name,
        owner_name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        status,
        subscription_status,
        subscription_start_date,
        subscription_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
    `;

    const [franchiseResult] = await connection.query(franchiseQuery, [
      'FR001',
      'Test Franchise',
      'Manager Name',
      'admin@test.com',
      '9876543210',
      '123 Test Street',
      'Test City',
      'TS',
      '123456',
      'active',
      'active'
    ]);

    const franchiseId = franchiseResult.insertId;
    console.log(`✅ Franchise created with ID: ${franchiseId}`);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test@123', salt);

    // Create user
    const userQuery = `
      INSERT INTO users (
        franchise_id,
        username,
        email,
        password,
        full_name,
        role,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [userResult] = await connection.query(userQuery, [
      franchiseId,
      'admin',
      'admin@test.com',
      hashedPassword,
      'Test Admin',
      'admin',
      'active'
    ]);

    console.log(`✅ User created with ID: ${userResult.insertId}`);

    console.log('\n📝 Test Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Test@123');

    await connection.end();
    console.log('\n✨ Test data created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();

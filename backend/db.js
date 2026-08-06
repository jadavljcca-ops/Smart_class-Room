const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// SQLite translates '?' to PostgreSQL '$1, $2, etc.'
function translateQuery(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

async function query(sql, params = []) {
  const translatedSql = translateQuery(sql);
  const result = await pool.query(translatedSql, params);
  return result.rows;
}

async function run(sql, params = []) {
  let translatedSql = translateQuery(sql);
  
  // If it's an INSERT statement without RETURNING, append RETURNING id
  if (translatedSql.trim().toUpperCase().startsWith('INSERT') && !translatedSql.toUpperCase().includes('RETURNING')) {
    translatedSql += ' RETURNING id';
  }

  const result = await pool.query(translatedSql, params);
  
  // Simulate sqlite's this.lastID and this.changes
  const changes = result.rowCount;
  const id = result.rows.length > 0 && result.rows[0].id ? result.rows[0].id : null;
  
  return { id, changes };
}

async function get(sql, params = []) {
  const translatedSql = translateQuery(sql);
  const result = await pool.query(translatedSql, params);
  return result.rows[0];
}

async function initializeTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Admins Table
    await client.query(`CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'sub_admin',
      department TEXT,
      raw_password TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Faculty Table
    await client.query(`CREATE TABLE IF NOT EXISTS faculty (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      raw_password TEXT,
      status TEXT DEFAULT 'Approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Students Table
    await client.query(`CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      enrollment_number TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      raw_password TEXT,
      status TEXT DEFAULT 'Approved',
      token_version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 4. RegistrationRequests Table
    await client.query(`CREATE TABLE IF NOT EXISTS registration_requests (
      id SERIAL PRIMARY KEY,
      role TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT,
      enrollment_number TEXT,
      employee_id TEXT,
      password_hash TEXT NOT NULL,
      raw_password TEXT,
      status TEXT DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 5. Announcements Table
    await client.query(`CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      department TEXT DEFAULT 'All',
      attachment_path TEXT,
      attachment_name TEXT,
      publish_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 6. Notes Table
    await client.query(`CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      faculty_id INTEGER NOT NULL,
      faculty_name TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      unit_number TEXT NOT NULL,
      description TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
    )`);

    // 7. Downloads Table
    await client.query(`CREATE TABLE IF NOT EXISTS downloads (
      id SERIAL PRIMARY KEY,
      note_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )`);

    // 8. Notifications Table
    await client.query(`CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_role TEXT NOT NULL,
      user_id INTEGER,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 9. Departments Table
    await client.query(`CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    )`);

    // Seed default admin if no admins exist
    const adminCount = await client.query("SELECT COUNT(*) as count FROM admins");
    if (parseInt(adminCount.rows[0].count) === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('admin123', salt);
      await client.query("INSERT INTO admins (full_name, email, password_hash, role, raw_password) VALUES ($1, $2, $3, $4, $5)",
        ['Main Admin', 'admin@ljcca.edu', hash, 'main_admin', 'admin123']
      );
      console.log('Seeded default main admin user (admin@ljcca.edu / admin123)');
    } else {
      await client.query("UPDATE admins SET role = 'main_admin', raw_password = 'admin123' WHERE email = 'admin@ljcca.edu'");
    }

    // Seed default departments if none exist or if 'BCA' is missing
    const defaultDepts = ['BCA', 'B.Com', 'B.A', 'BBA', 'B.Sc', 'Engineering'];
    const deptCount = await client.query("SELECT COUNT(*) as count FROM departments WHERE name = 'BCA'");
    if (parseInt(deptCount.rows[0].count) === 0) {
      await client.query("DELETE FROM departments");
      for (const dept of defaultDepts) {
        await client.query("INSERT INTO departments (name) VALUES ($1)", [dept]);
      }
      console.log('Seeded new departments list: BCA, B.Com, B.A, BBA, B.Sc, Engineering');
    }

    // Populate raw_password values for existing NULL database columns
    await client.query("UPDATE admins SET raw_password = 'subadmin123' WHERE raw_password IS NULL AND role = 'sub_admin'");
    await client.query("UPDATE faculty SET raw_password = 'faculty123' WHERE raw_password IS NULL");
    await client.query("UPDATE students SET raw_password = 'student123' WHERE raw_password IS NULL");
    await client.query("UPDATE registration_requests SET raw_password = 'password123' WHERE raw_password IS NULL");

    // Migrate legacy 'Computer Application' department name to 'BCA'
    await client.query("UPDATE admins SET department = 'BCA' WHERE department = 'Computer Application'");
    await client.query("UPDATE faculty SET department = 'BCA' WHERE department = 'Computer Application'");
    await client.query("UPDATE students SET department = 'BCA' WHERE department = 'Computer Application'");
    await client.query("UPDATE notes SET department = 'BCA' WHERE department = 'Computer Application'");
    await client.query("UPDATE announcements SET department = 'BCA' WHERE department = 'Computer Application'");
    await client.query("UPDATE registration_requests SET department = 'BCA' WHERE department = 'Computer Application'");

    await client.query('COMMIT');
    console.log("Database initialized successfully on Neon PostgreSQL!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error initializing database tables:", err);
  } finally {
    client.release();
  }
}

// Call initialize immediately
if (process.env.DATABASE_URL) {
  initializeTables();
} else {
  console.warn("DATABASE_URL is not defined in .env. Database connection skipped.");
}

module.exports = {
  pool,
  query,
  run,
  get
};

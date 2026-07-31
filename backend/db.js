const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeTables();
  }
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function initializeTables() {
  db.serialize(() => {
    // 1. Admins Table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Faculty Table
    db.run(`CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      status TEXT DEFAULT 'Approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Students Table
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      enrollment_number TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      status TEXT DEFAULT 'Approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 4. RegistrationRequests Table (Pending student/faculty requests)
    db.run(`CREATE TABLE IF NOT EXISTS registration_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL, -- 'student' or 'faculty'
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT, -- Null for faculty
      enrollment_number TEXT, -- Null for faculty
      employee_id TEXT, -- Null for student
      password_hash TEXT NOT NULL,
      status TEXT DEFAULT 'Pending', -- 'Pending', 'Rejected'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 5. Announcements Table
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      department TEXT DEFAULT 'All', -- 'All' or specific department
      attachment_path TEXT,
      attachment_name TEXT,
      publish_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 6. Notes Table
    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id INTEGER NOT NULL,
      faculty_name TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      unit_number TEXT NOT NULL,
      description TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL, -- 'pdf', 'docx', 'ppt', 'zip', etc.
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
    )`);

    // 7. Downloads Table
    db.run(`CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )`);

    // 8. Notifications Table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_role TEXT NOT NULL, -- 'Admin', 'Faculty', 'Student'
      user_id INTEGER, -- Null for general broadcast, or specific user ID
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0, -- 0 for false, 1 for true
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 9. Departments Table
    db.run(`CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);

    // Seed default admin if no admins exist
    db.get("SELECT COUNT(*) as count FROM admins", [], (err, row) => {
      if (err) {
        console.error('Error checking admins count:', err);
        return;
      }
      if (row.count === 0) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('admin123', salt);
        db.run("INSERT INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)",
          ['Main Admin', 'admin@ljcca.edu', hash],
          (err2) => {
            if (err2) {
              console.error('Error seeding admin:', err2);
            } else {
              console.log('Seeded default admin user (admin@ljcca.edu / admin123)');
            }
          }
        );
      }
    });

    // Seed default departments if none exist
    db.get("SELECT COUNT(*) as count FROM departments", [], (err, row) => {
      if (err) {
        console.error('Error checking departments count:', err);
        return;
      }
      if (row.count === 0) {
        const defaultDepts = [
          'Computer Engineering',
          'Information Technology',
          'Civil Engineering',
          'Mechanical Engineering',
          'Electrical Engineering',
          'Science & Humanities'
        ];
        const stmt = db.prepare("INSERT INTO departments (name) VALUES (?)");
        defaultDepts.forEach((dept) => {
          stmt.run(dept, (err2) => {
            if (err2) console.error(`Error seeding department ${dept}:`, err2);
          });
        });
        stmt.finalize();
        console.log('Seeded default departments list.');
      }
    });
  });
}

module.exports = {
  db,
  query,
  run,
  get
};

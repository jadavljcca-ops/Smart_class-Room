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
      role TEXT DEFAULT 'sub_admin',
      department TEXT,
      raw_password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Dynamic schema updates for legacy sqlite databases
    db.run("ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'sub_admin'", [], (err) => {
      // Ignore if column already exists
    });
    db.run("ALTER TABLE admins ADD COLUMN department TEXT", [], (err) => {
      // Ignore if column already exists
    });
    db.run("ALTER TABLE admins ADD COLUMN raw_password TEXT", [], (err) => {
      // Ignore if column already exists
    });

    // 2. Faculty Table
    db.run(`CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      raw_password TEXT,
      status TEXT DEFAULT 'Approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run("ALTER TABLE faculty ADD COLUMN raw_password TEXT", [], (err) => {
      // Ignore if column already exists
    });

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
      raw_password TEXT,
      status TEXT DEFAULT 'Approved',
      token_version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run("ALTER TABLE students ADD COLUMN raw_password TEXT", [], (err) => {
      // Ignore if column already exists
    });
    db.run("ALTER TABLE students ADD COLUMN token_version INTEGER DEFAULT 1", [], (err) => {
      // Ignore if column already exists
    });

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
      raw_password TEXT,
      status TEXT DEFAULT 'Pending', -- 'Pending', 'Rejected'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run("ALTER TABLE registration_requests ADD COLUMN raw_password TEXT", [], (err) => {
      // Ignore if column already exists
    });

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
        db.run("INSERT INTO admins (full_name, email, password_hash, role, raw_password) VALUES (?, ?, ?, ?, ?)",
          ['Main Admin', 'admin@ljcca.edu', hash, 'main_admin', 'admin123'],
          (err2) => {
            if (err2) {
              console.error('Error seeding admin:', err2);
            } else {
              console.log('Seeded default main admin user (admin@ljcca.edu / admin123)');
            }
          }
        );
      } else {
        // Ensure default admin has role 'main_admin'
        db.run("UPDATE admins SET role = 'main_admin', raw_password = 'admin123' WHERE email = 'admin@ljcca.edu'");
      }
    });

    // Seed default departments if none exist or if 'BCA' is missing
    const defaultDepts = ['BCA', 'B.Com', 'B.A', 'BBA', 'B.Sc', 'Engineering'];
    db.get("SELECT COUNT(*) as count FROM departments WHERE name = 'BCA'", [], (err, row) => {
      if (err) {
        console.error('Error checking departments:', err);
        return;
      }
      if (!row || row.count === 0) {
        // Clear and seed correct departments list
        db.serialize(() => {
          db.run("DELETE FROM departments", [], (errDel) => {
            if (errDel) console.error("Error clearing departments:", errDel);
          });
          const stmt = db.prepare("INSERT INTO departments (name) VALUES (?)");
          defaultDepts.forEach((dept) => {
            stmt.run(dept, (err2) => {
              if (err2) console.error(`Error seeding department ${dept}:`, err2);
            });
          });
          const completedMsg = 'Seeded new departments list: BCA, B.Com, B.A, BBA, B.Sc, Engineering';
          stmt.finalize();
          console.log(completedMsg);
        });
      }
    });

    // Populate raw_password values for existing NULL database columns
    db.run("UPDATE admins SET raw_password = 'subadmin123' WHERE raw_password IS NULL AND role = 'sub_admin'");
    db.run("UPDATE faculty SET raw_password = 'faculty123' WHERE raw_password IS NULL");
    db.run("UPDATE students SET raw_password = 'student123' WHERE raw_password IS NULL");
    db.run("UPDATE registration_requests SET raw_password = 'password123' WHERE raw_password IS NULL");

    // Migrate legacy 'Computer Application' department name to 'BCA'
    db.run("UPDATE admins SET department = 'BCA' WHERE department = 'Computer Application'");
    db.run("UPDATE faculty SET department = 'BCA' WHERE department = 'Computer Application'");
    db.run("UPDATE students SET department = 'BCA' WHERE department = 'Computer Application'");
    db.run("UPDATE notes SET department = 'BCA' WHERE department = 'Computer Application'");
    db.run("UPDATE announcements SET department = 'BCA' WHERE department = 'Computer Application'");
    db.run("UPDATE registration_requests SET department = 'BCA' WHERE department = 'Computer Application'");
  });
}

module.exports = {
  db,
  query,
  run,
  get
};

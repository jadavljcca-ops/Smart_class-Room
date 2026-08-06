const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  db.all("SELECT id, subject_name, department, semester, faculty_name FROM notes", (err, notes) => {
    console.log("=== NOTES ===");
    console.log(notes);
    
    db.all("SELECT id, full_name, department, semester FROM students LIMIT 5", (err, students) => {
      console.log("=== STUDENTS ===");
      console.log(students);
      db.close();
    });
  });
});

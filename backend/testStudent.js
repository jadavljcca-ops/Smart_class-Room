const jwt = require('jsonwebtoken');
const { get, query } = require('./db');

async function test() {
  const student = await get("SELECT * FROM students WHERE full_name = 'JD'");
  console.log("Student:", student);
  
  const token = jwt.sign({
    id: student.id,
    role: 'student',
    department: student.department,
    semester: student.semester
  }, 'supersecret_jwt_key_123', { expiresIn: '1d' });
  
  console.log("Mock Token:", token);
  
  const list = await query(
      `SELECT id, faculty_id, faculty_name, subject_name, department, semester, unit_number, description, file_name, file_type, upload_date 
       FROM notes 
       WHERE department = ? 
       ORDER BY upload_date DESC`,
      [student.department]
  );
  console.log("Notes returned from DB for dept:", student.department);
  console.log(list);
}
test();

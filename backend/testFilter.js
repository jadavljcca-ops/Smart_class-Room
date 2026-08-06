const notes = [
  {
    id: 17,
    faculty_id: 4,
    faculty_name: 'Parth Josi',
    subject_name: 'Python',
    department: 'BCA',
    semester: '5',
    unit_number: '1',
    description: 'Unit 1 Notes\r\n',
    file_name: 'DMC PRACTICAL PART-1.pdf',
    file_type: 'pdf',
    upload_date: '2026-08-02 09:08:26'
  }
];

const user = { department: 'BCA', semester: '5' };
const subjectQuery = '';
const facultyQuery = '';
const deptFilter = user.department;
const semFilter = user.semester;
const notesQuery = '';

const filteredNotes = notes.filter((n) => {
    const matchesSubject = (n.subject_name || '').toLowerCase().includes(subjectQuery.toLowerCase()) || (n.description || '').toLowerCase().includes(subjectQuery.toLowerCase());
    const matchesFaculty = (n.faculty_name || '').toLowerCase().includes(facultyQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || n.department === deptFilter;
    const matchesSem = semFilter === 'all' || String(n.semester) === String(semFilter);
    const matchesGeneral = notesQuery === '' || 
      (n.subject_name || '').toLowerCase().includes(notesQuery.toLowerCase()) || 
      (n.faculty_name || '').toLowerCase().includes(notesQuery.toLowerCase()) ||
      (n.description || '').toLowerCase().includes(notesQuery.toLowerCase());

    console.log({ matchesSubject, matchesFaculty, matchesDept, matchesSem, matchesGeneral });
    return matchesSubject && matchesFaculty && matchesDept && matchesSem && matchesGeneral;
});
console.log("Filtered length:", filteredNotes.length);

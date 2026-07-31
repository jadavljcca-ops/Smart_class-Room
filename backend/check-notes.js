const { db, query, run } = require('./db');

async function fixNotes() {
  try {
    const notes = await query("SELECT id, file_name FROM notes");
    for (const note of notes) {
      const decoded = Buffer.from(note.file_name, 'latin1').toString('utf8');
      console.log(`Fixing note ${note.id}: "${note.file_name}" -> "${decoded}"`);
      await run("UPDATE notes SET file_name = ? WHERE id = ?", [decoded, note.id]);
    }
    
    const announcements = await query("SELECT id, attachment_name FROM announcements WHERE attachment_name IS NOT NULL");
    for (const ann of announcements) {
      const decoded = Buffer.from(ann.attachment_name, 'latin1').toString('utf8');
      console.log(`Fixing announcement ${ann.id}: "${ann.attachment_name}" -> "${decoded}"`);
      await run("UPDATE announcements SET attachment_name = ? WHERE id = ?", [decoded, ann.id]);
    }
  } catch (err) {
    console.error("Fix error:", err);
  }
}

fixNotes().then(() => {
  console.log("Database repair complete.");
  process.exit(0);
});

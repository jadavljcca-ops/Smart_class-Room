/**
 * Format any date string or Date object into DD/MM/YYYY
 * @param {string|Date} dateVal 
 * @returns {string} e.g. "30/08/2026"
 */
export function formatDate(dateVal) {
  if (!dateVal) return '-';
  try {
    // If already in YYYY-MM-DD format
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
      const [y, m, d] = dateVal.trim().split('-');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    
    // For timestamp or full ISO strings
    const str = typeof dateVal === 'string' && !dateVal.endsWith('Z') && (dateVal.includes('-') || dateVal.includes('T')) && !dateVal.includes('+')
      ? dateVal.replace(' ', 'T') + 'Z'
      : dateVal;
    const d = new Date(str);
    if (isNaN(d.getTime())) return String(dateVal);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateVal);
  }
}

/**
 * Format any date string or Date object into DD/MM/YYYY, hh:mm A
 * @param {string|Date} dateVal 
 * @returns {string} e.g. "30/08/2026, 03:15 PM"
 */
export function formatDateTime(dateVal) {
  if (!dateVal) return '-';
  try {
    const str = typeof dateVal === 'string' && !dateVal.endsWith('Z') && (dateVal.includes('-') || dateVal.includes('T')) && !dateVal.includes('+')
      ? dateVal.replace(' ', 'T') + 'Z'
      : dateVal;
    const d = new Date(str);
    if (isNaN(d.getTime())) return formatDate(dateVal);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
  } catch (e) {
    return formatDate(dateVal);
  }
}

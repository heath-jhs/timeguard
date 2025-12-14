/**
 * Convert 24-hour time (HH:mm) to 12-hour format (h:mm AM/PM)
 */
export function format12Hour(time24) {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Convert 12-hour time (h:mm AM/PM) to 24-hour format (HH:mm)
 */
export function format24Hour(time12) {
  if (!time12) return '';
  
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time12;
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}
'use strict';

const DAYS      = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const FULL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const today     = new Date();
const todayIdx  = today.getDay() === 0 ? 6 : today.getDay() - 1;

function getWeekStart() {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay() + weekOffset * 7);
  return d.toISOString().split('T')[0];
}

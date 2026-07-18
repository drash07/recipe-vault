'use strict';

function renderWeekGrid() {
  const prevBtn   = document.getElementById('prev-week-btn');
  const weekLabel = document.getElementById('week-label');
  if (prevBtn) {
    prevBtn.disabled      = weekOffset <= 0;
    prevBtn.style.opacity = weekOffset <= 0 ? '0.3' : '1';
    prevBtn.style.cursor  = weekOffset <= 0 ? 'default' : 'pointer';
  }
  if (weekLabel) {
    if (weekOffset === 0)      weekLabel.textContent = 'This week';
    else if (weekOffset === 1) weekLabel.textContent = 'Next week';
    else {
      const ws = new Date(today); ws.setDate(today.getDate() - todayIdx + weekOffset * 7);
      const we = new Date(ws);   we.setDate(ws.getDate() + 6);
      const M  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      weekLabel.textContent = M[ws.getMonth()] + ' ' + ws.getDate() + ' – ' + M[we.getMonth()] + ' ' + we.getDate();
    }
  }

  const mealTypes = userProfile?.meal_types || ['breakfast','dinner'];
  const grid      = document.getElementById('week-grid');
  grid.innerHTML  = '';
  DAYS.forEach((d, i) => {
    const date     = new Date(today);
    date.setDate(today.getDate() - todayIdx + i + weekOffset * 7);
    const hasMeals = mealPlan[i] && mealTypes.some(m => mealPlan[i][m]);
    const isToday  = weekOffset === 0 && i === todayIdx;
    const pill     = document.createElement('button');
    pill.className = 'day-pill' + (i===selectedDay?' active':'') + (hasMeals?' has-meals':'') + (isToday&&i!==selectedDay?' today':'');
    pill.innerHTML = '<span class="day-name">' + d + '</span><span class="day-num">' + date.getDate() + '</span><span class="dot"></span>';
    pill.onclick   = () => { selectedDay = i; renderWeekGrid(); renderMealSlots(); };
    grid.appendChild(pill);
  });
}

async function changeWeek(delta) {
  const newOffset = weekOffset + delta;
  if (newOffset < 0) return;
  weekOffset  = newOffset;
  selectedDay = weekOffset === 0 ? todayIdx : 0;
  await loadMealPlan();
  if (document.getElementById('screen-grocery').classList.contains('active')) await loadGroceries();
}

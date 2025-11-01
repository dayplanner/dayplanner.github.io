const planner = document.getElementById('planner');
const dayTabs = document.querySelectorAll('.day-tab');

const startHour = 0;   // 00:00
const endHour = 23;    // 23:00
const slotMinutes = 30; // half-hour slots

let currentDay = 'sunday';

const STORAGE_KEY = "DayPlanner";

// Load all tasks (object with day keys)
const weeklyTasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

// --- Helpers ---
function formatTime(hour, minute) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${ampm}`;
}

function getTimeStatus(hour, minute) {
  const current = new Date();
  const currentHour = current.getHours();
  const currentMinute = current.getMinutes();
  const slotTime = hour * 60 + minute;
  const nowTime = currentHour * 60 + currentMinute;

  if (slotTime + 30 <= nowTime) return 'past';
  if (slotTime <= nowTime && nowTime < slotTime + 30) return 'present';
  return 'future';
}

function renderPlanner() {
  planner.innerHTML = '';

  const dayTasks = weeklyTasks[currentDay] || {};

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotMinutes) {
      const key = `${hour}-${minute}`;
      const status = getTimeStatus(hour, minute);
      const taskText = dayTasks[key] || '';

      const isEarly = null;

      const block = document.createElement('div');
      block.className =
        'flex flex-col p-0 transition ' +
        (isEarly ? 'opacity-70 bg-gray-50 ' : 'bg-white ');

      // --- Label row container ---
      const labelRow = document.createElement('div');
      labelRow.className = 'border border-white flex justify-between items-center bg-[#444] text-white p-1 px-2 rounded-t';

      const label = document.createElement('div');
      label.className = 'text-lg font-semibold';
      label.textContent = formatTime(hour, minute);

      // --- Save button (hidden by default) ---
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className =
        'hidden text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded transition';
      saveBtn.addEventListener('click', () => saveSingleTask(key));

      labelRow.append(label, saveBtn);

      const input = document.createElement('textarea');
      input.className =
        'flex-1 p-1 pt-0 pl-1.5 resize-none text-3xl focus:outline-none focus:ring-2 transition ' +
        (status === 'past'
          ? 'bg-gray-200 border-red-200 border italic text-gray-600'
          : status === 'present'
          ? 'bg-green-100'
          : 'bg-white');

      if (isEarly) input.classList.add('text-gray-500');

      input.rows = 3;
      input.value = taskText;
      input.dataset.key = key;

      // --- Show/hide save button depending on content ---
      input.addEventListener('input', () => {
        const hasContent = input.value.trim().length > 0;
        if (hasContent) {
          saveBtn.classList.remove('hidden');
        } else {
          saveBtn.classList.add('hidden');
        }
      });

      // --- Accessibility / Tab order improvement ---
      input.tabIndex = 1; // default sequence
      saveBtn.tabIndex = 0; // focus before textarea when visible

      // When user presses Tab, move focus to Save button first if content exists
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && !e.shiftKey) {
          const hasContent = input.value.trim().length > 0;
          if (hasContent) {
            e.preventDefault();
            saveBtn.focus();
          }
        }
      });



      block.append(labelRow, input);
      planner.appendChild(block);
    }
  }
}
function saveSingleTask(key) {
  const textarea = planner.querySelector(`textarea[data-key="${key}"]`);
  if (!textarea) return;

  const dayTasks = weeklyTasks[currentDay] || {};
  dayTasks[key] = textarea.value.trim();
  weeklyTasks[currentDay] = dayTasks;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklyTasks));

  // Give feedback
  const saveBtn = textarea.previousElementSibling.querySelector('button');
  if (saveBtn) {
    saveBtn.textContent = 'Saved ✓';
    saveBtn.disabled = true;
    setTimeout(() => {
      saveBtn.textContent = 'Save';
      saveBtn.disabled = false;
      saveBtn.classList.add('hidden');
    }, 1500);
  }
}



// --- Export Tasks ---
const exportBtn = document.getElementById('exportBtn');
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(weeklyTasks, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `day-planner-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  exportBtn.textContent = 'Exported ✓';
  setTimeout(() => (exportBtn.textContent = 'Export'), 1500);
});


// --- Import Tasks ---
const importInput = document.getElementById('importInput');
importInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);

      if (typeof importedData === 'object' && importedData !== null) {
        Object.assign(weeklyTasks, importedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklyTasks));
        renderPlanner();

        alert('Data imported successfully!');
      } else {
        alert('Invalid data format in file.');
      }
    } catch (err) {
      alert('Failed to import: Invalid JSON file.');
    }
  };
  reader.readAsText(file);

  // Reset the file input for next use
  importInput.value = '';
});


// --- Clear All ---
const clearAllBtn = document.getElementById('clearAllBtn');
clearAllBtn.addEventListener('click', () => {
  const confirmClear = confirm(
    "Are you sure you want to delete ALL tasks from every day and time slot?\n\nThis action cannot be undone."
  );

  if (!confirmClear) return;

  // Clear everything
  localStorage.removeItem(STORAGE_KEY);
  for (const key in weeklyTasks) delete weeklyTasks[key];

  renderPlanner();

  clearAllBtn.textContent = 'All Cleared ✓';
  setTimeout(() => (clearAllBtn.textContent = 'Clear All'), 1500);
});


// --- Clear Current Day ---
const clearDayBtn = document.getElementById('clearDayBtn');
clearDayBtn.addEventListener('click', () => {
  const confirmClearDay = confirm(
    `Are you sure you want to delete all tasks for ${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}?\n\nThis cannot be undone.`
  );

  if (!confirmClearDay) return;

  // Remove only this day's data
  delete weeklyTasks[currentDay];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklyTasks));

  renderPlanner();

  clearDayBtn.textContent = `${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)} Cleared ✓`;
  setTimeout(() => (clearDayBtn.textContent = 'Clear Day'), 1500);
});


// --- Switch Days ---
dayTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    currentDay = tab.dataset.day;

    // highlight active tab
    dayTabs.forEach(t => t.classList.remove('bg-indigo-500', 'text-white'));
    tab.classList.add('bg-indigo-500', 'text-white');

    renderPlanner();
  });
});

// --- Initialize ---
const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
const todayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][todayIndex];
currentDay = todayName;

// Highlight current day tab
dayTabs.forEach((t) => {
  if (t.dataset.day === currentDay) {
    t.classList.add('<bg-indigo-40></bg-indigo-40>0', 'text-white');
  }
});

renderPlanner();

// Optional: refresh color states every 5 min
setInterval(renderPlanner, 5 * 60 * 1000);



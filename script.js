const planner = document.getElementById('planner');
const saveAllBtn = document.getElementById('saveAllBtn');
const dayTabs = document.querySelectorAll('.day-tab');

const startHour = 0;   // 00:00
const endHour = 23;    // 23:00
const slotMinutes = 30; // half-hour slots

let currentDay = 'sunday';

// Load all tasks (object with day keys)
const weeklyTasks = JSON.parse(localStorage.getItem('weeklyPlannerTasks')) || {};

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

      // Early-morning flag (00:00–08:00)
      const isEarly = hour < 8;

      const block = document.createElement('div');
      block.className =
        'flex flex-col p-0 transition ' +
        (isEarly ? 'opacity-70 bg-gray-50 ' : 'bg-white ');

      const label = document.createElement('div');
      label.className =
        'text-lg font-semibold pl-1 m-1 ' +
        (isEarly
          ? 'bg-gray-600 text-gray-100'
          : 'bg-[#444] text-white');

      label.textContent = formatTime(hour, minute);

      const input = document.createElement('textarea');
      input.className =
        'flex-1 p-1 pt-0 pl-1.5 resize-none text-lg focus:outline-none focus:ring-2 transition ' +
        (status === 'past'
          ? 'bg-gray-200 border-red-200 border italic text-gray-600'
          : status === 'present'
          ? 'bg-green-100'
          : 'bg-white');

      // Optional: soften text color for early slots
      if (isEarly) input.classList.add('text-gray-500');

      input.rows = 3;
      input.value = taskText;
      input.dataset.key = key;

      block.append(label, input);
      planner.appendChild(block);
    }
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
        localStorage.setItem('weeklyPlannerTasks', JSON.stringify(weeklyTasks));
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


// --- Save All ---
function saveTasks(silent = false) {
  const textareas = planner.querySelectorAll('textarea');
  const dayTasks = {};
  textareas.forEach((ta) => {
    const key = ta.dataset.key;
    dayTasks[key] = ta.value.trim();
  });
  weeklyTasks[currentDay] = dayTasks;
  localStorage.setItem('weeklyPlannerTasks', JSON.stringify(weeklyTasks));

  if (!silent) {
    saveAllBtn.textContent = 'All Saved ✓';
    setTimeout(() => (saveAllBtn.textContent = 'Save'), 1500);
  }
}

saveAllBtn.addEventListener('click', () => saveTasks());

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
    t.classList.add('bg-indigo-400', 'text-white');
  }
});

renderPlanner();

// --- Auto Save every 1 minutes ---
setInterval(() => saveTasks(true), 1 * 60 * 1000);

// Optional: refresh color states every 5 min
setInterval(renderPlanner, 5 * 60 * 1000);



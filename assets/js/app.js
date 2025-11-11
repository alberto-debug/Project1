// App logic for the prototype

// Simple in-memory auth/session
const Session = {
  role: null, // 'admin' | 'lecturer'
  username: null,
  lecturerUnits: [] // e.g., ['CS101','CS202']
};

// Seed contacts
(function seedContacts(){
  const departments = ['Computer Science', 'Business', 'Law', 'Education'];
  const courses = {
    'Computer Science': ['CS101', 'CS202', 'CS305', 'AI401'],
    'Business': ['BUS110', 'MKT220', 'FIN330'],
    'Law': ['LAW100', 'LAW210'],
    'Education': ['EDU120', 'EDU230']
  };
  const roles = ['Student','Student','Student','Staff'];
  const contacts = [];
  let id = 1;
  departments.forEach(dept => {
    for (let y=1; y<=4; y++){
      courses[dept].forEach(course => {
        for (let i=0; i<6; i++){
          const role = roles[Math.floor(Math.random()*roles.length)];
          contacts.push({
            id: (id++).toString(),
            name: role === 'Staff' ? `${dept} Staff ${i+1}` : `${dept} Student ${y}${i+1}`,
            role,
            department: dept,
            year: role === 'Staff' ? '' : y.toString(),
            course,
            phone: `+2547${Math.floor(10000000 + Math.random()*8999999)}`
          });
        }
      })
    }
  });
  MockStore.contacts = contacts;
})();

// Seed lecturer assignments (for demo)
const LecturerAssignments = {
  lecture: ['CS101','CS202','FIN330'] // username -> units
};

// Login handling
const loginScreen = document.getElementById('login');
const appShell = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');

function applyRoleUI(){
  // Gate sidebar items by role
  document.querySelectorAll('.sidebar .nav-item').forEach(el => {
    const roles = (el.getAttribute('data-roles')||'').split(',').map(s=>s.trim()).filter(Boolean);
    const show = roles.length===0 || roles.includes(Session.role);
    el.style.display = show ? '' : 'none';
  });
  // Toggle lecturer unit block
  const unitBlock = document.getElementById('lecturerUnitBlock');
  unitBlock.hidden = Session.role !== 'lecturer';
  // Topbar badge
  userBadge.textContent = Session.role === 'admin' ? 'Admin' : (Session.role === 'lecturer' ? 'Lecturer' : 'User');
}

function resetSelection(){
  document.getElementById('filterDepartment').value = '';
  document.getElementById('filterYear').value = '';
  document.getElementById('filterCourse').value = '';
  const unitSelect = document.getElementById('lecturerUnitSelect');
  if (unitSelect) unitSelect.value = '';
}

loginBtn.addEventListener('click', () => {
  const u = document.getElementById('loginUser').value.trim().toLowerCase();
  // any password is accepted for prototype
  if (u === 'admin') {
    Session.role = 'admin'; Session.username = 'admin'; Session.lecturerUnits = [];
  } else if (u === 'lecture' || u === 'lecturer') {
    Session.role = 'lecturer'; Session.username = 'lecture';
    Session.lecturerUnits = LecturerAssignments['lecture'] || [];
  } else {
    alert('Use admin or lecture');
    return;
  }
  loginScreen.hidden = true; appShell.hidden = false;
  applyRoleUI();
  populateLecturerUnits();
  renderContacts();
  renderContactsFull();
  renderSchedule();
  renderReports();
});

logoutBtn.addEventListener('click', () => {
  Session.role = null; Session.username = null; Session.lecturerUnits = [];
  appShell.hidden = true; loginScreen.hidden = false;
  resetSelection();
});

// Populate filters
const deptSelect = document.getElementById('filterDepartment');
const yearSelect = document.getElementById('filterYear');
const courseSelect = document.getElementById('filterCourse');
const unique = (arr) => [...new Set(arr)];

function refreshFilterOptions(){
  const depts = unique(MockStore.contacts.map(c => c.department));
  deptSelect.innerHTML = '<option value="">All</option>' + depts.map(d=>`<option>${d}</option>`).join('');
  const courses = unique(MockStore.contacts.map(c => c.course));
  courseSelect.innerHTML = '<option value="">All</option>' + courses.map(c=>`<option>${c}</option>`).join('');
}
refreshFilterOptions();

// Navigation
const panels = document.querySelectorAll('.panel');
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(btn => btn.addEventListener('click', () => {
  navItems.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById(btn.dataset.target).classList.add('active');
  if (btn.dataset.target === 'reports') renderReports();
  if (btn.dataset.target === 'contacts') renderContactsFull();
}));

// Contacts table with selection
const contactsTbody = document.querySelector('#contactsTable tbody');
const toggleAll = document.getElementById('toggleAll');
const selectAll = document.getElementById('selectAll');
const clearAll = document.getElementById('clearAll');

function filterContacts(){
  const d = deptSelect.value;
  const y = yearSelect.value;
  const c = courseSelect.value;
  let base = MockStore.contacts;
  // If lecturer role, restrict to assigned unit if selected, else union of all their units
  if (Session.role === 'lecturer') {
    const unitSel = document.getElementById('lecturerUnitSelect');
    const chosen = unitSel && unitSel.value ? [unitSel.value] : Session.lecturerUnits;
    base = base.filter(ct => ct.role === 'Student' && chosen.includes(ct.course));
  }
  return base.filter(ct =>
    (d? ct.department===d : true) &&
    (y? ct.year===y : (ct.role==='Staff'? true : true)) &&
    (c? ct.course===c : true)
  );
}

function renderContacts(){
  const rows = filterContacts().map(ct => `
    <tr>
      <td><input type="checkbox" class="ct-check" data-id="${ct.id}"></td>
      <td>${ct.name}</td>
      <td>${ct.role}</td>
      <td>${ct.department}</td>
      <td>${ct.year || '-'}</td>
      <td>${ct.course}</td>
      <td>${ct.phone}</td>
    </tr>
  `).join('');
  contactsTbody.innerHTML = rows;
}

function renderContactsFull(){
  const tbody = document.querySelector('#contactsTableFull tbody');
  const rows = MockStore.contacts.slice(0, 400).map(ct => `
    <tr>
      <td>${ct.name}</td>
      <td>${ct.role}</td>
      <td>${ct.department}</td>
      <td>${ct.year || '-'}</td>
      <td>${ct.course}</td>
      <td>${ct.phone}</td>
    </tr>
  `).join('');
  tbody.innerHTML = rows;
}

[deptSelect, yearSelect, courseSelect].forEach(el => el.addEventListener('change', () => {
  renderContacts();
}));

function populateLecturerUnits(){
  const sel = document.getElementById('lecturerUnitSelect');
  if (!sel) return;
  if (Session.role !== 'lecturer') { sel.innerHTML = '<option value="">Select unit</option>'; return; }
  const options = Session.lecturerUnits.map(u=>`<option value="${u}">${u}</option>`).join('');
  sel.innerHTML = '<option value="">Select unit</option>' + options;
  sel.addEventListener('change', () => {
    // When a unit is chosen, also set course filter for clarity
    courseSelect.value = sel.value || '';
    renderContacts();
  });
}

toggleAll.addEventListener('change', () => {
  document.querySelectorAll('.ct-check').forEach(ch => ch.checked = toggleAll.checked);
});

selectAll.addEventListener('click', () => {
  document.querySelectorAll('.ct-check').forEach(ch => ch.checked = true);
});
clearAll.addEventListener('click', () => {
  document.querySelectorAll('.ct-check').forEach(ch => ch.checked = false);
  toggleAll.checked = false;
});

renderContacts();
renderContactsFull();

// Templates and char count
const tpl = document.getElementById('template');
const msg = document.getElementById('message');
const charCount = document.getElementById('charCount');

tpl.addEventListener('change', () => {
  if (tpl.value) msg.value = tpl.value;
  updateChar();
});
msg.addEventListener('input', updateChar);
function updateChar(){ charCount.textContent = msg.value.length; }
updateChar();

// Sending
function getSelectedRecipients(){
  const ids = Array.from(document.querySelectorAll('.ct-check:checked')).map(ch => ch.getAttribute('data-id'));
  let selected = MockStore.contacts.filter(c => ids.includes(c.id));
  if (selected.length === 0 && Session.role === 'lecturer') {
    // Default to all filtered students (assigned units) if none manually selected
    selected = filterContacts();
  }
  return selected;
}

function preview(text){
  const f = filterContacts()[0];
  if (!f) return text;
  return text
    .replace('{time}', '10:00')
    .replace('{course}', f.course)
    .replace('{date}', 'Fri 3 Nov')
    .replace('{event}', 'ANU Chapel')
    .replace('{venue}', 'Main Hall');
}

async function sendNow(){
  const recipients = getSelectedRecipients();
  if (recipients.length === 0) { alert('Select at least one recipient'); return; }
  if (!msg.value.trim()) { alert('Enter a message'); return; }
  // Enforce lecturer rule: only students in assigned unit(s)
  if (Session.role === 'lecturer') {
    const unitSel = document.getElementById('lecturerUnitSelect');
    const allowed = unitSel && unitSel.value ? [unitSel.value] : Session.lecturerUnits;
    const invalid = recipients.filter(r => r.role !== 'Student' || !allowed.includes(r.course));
    if (invalid.length) {
      alert('Lecturers can only message students in their assigned units.');
      return;
    }
  }
  const text = preview(msg.value);
  await SmsGateway.sendBulk(recipients, text);
  renderMessages();
  renderReports();
  alert('Message queued for sending (simulated).');
}

document.getElementById('sendNowBtn').addEventListener('click', sendNow);
document.getElementById('sendNowBtnTop').addEventListener('click', sendNow);

// Schedule
const scheduleModal = document.getElementById('scheduleModal');
const openSchedule = document.getElementById('openSchedule');
const confirmSchedule = document.getElementById('confirmSchedule');
const closeModal = document.getElementById('closeModal');

openSchedule.addEventListener('click', () => {
  scheduleModal.hidden = false;
});
closeModal.addEventListener('click', () => scheduleModal.hidden = true);

confirmSchedule.addEventListener('click', async () => {
  const d = document.getElementById('modalDate').value;
  const t = document.getElementById('modalTime').value;
  const recipients = getSelectedRecipients();
  if (recipients.length === 0) { alert('Select at least one recipient'); return; }
  if (!msg.value.trim()) { alert('Enter a message'); return; }
  if (!d || !t) { alert('Select date and time'); return; }
  const when = new Date(`${d}T${t}`);
  if (when < new Date()) { alert('Time must be in the future'); return; }
  if (Session.role === 'lecturer') {
    const unitSel = document.getElementById('lecturerUnitSelect');
    const allowed = unitSel && unitSel.value ? [unitSel.value] : Session.lecturerUnits;
    const invalid = recipients.filter(r => r.role !== 'Student' || !allowed.includes(r.course));
    if (invalid.length) { alert('Lecturers can only schedule to their assigned units.'); return; }
  }
  const text = preview(msg.value);
  await SmsGateway.schedule(recipients, text, when);
  scheduleModal.hidden = true;
  renderSchedule();
  renderReports();
});

// Schedule page manual add
const addSchedule = document.getElementById('addSchedule');
addSchedule.addEventListener('click', async () => {
  const d = document.getElementById('schedDate').value;
  const t = document.getElementById('schedTime').value;
  // For lecturer: all filtered students (their assigned unit(s)); for admin, use all filtered
  const recipients = Session.role === 'lecturer' ? filterContacts() : filterContacts();
  if (!msg.value.trim()) { alert('Enter a message in Compose first'); return; }
  if (!d || !t) { alert('Select date and time'); return; }
  const when = new Date(`${d}T${t}`);
  if (when < new Date()) { alert('Time must be in the future'); return; }
  await SmsGateway.schedule(recipients, preview(msg.value), when);
  renderSchedule();
  renderReports();
});

function renderSchedule(){
  const tbody = document.querySelector('#scheduleTable tbody');
  const rows = MockStore.schedules.slice().sort((a,b)=>a.sendAt-b.sendAt).map(s => {
    const rec = s.recipients.length;
    const st = s.status;
    return `
      <tr>
        <td>${new Date(s.sendAt).toLocaleString()}</td>
        <td>${rec}</td>
        <td>${s.text.slice(0, 60)}</td>
        <td>${st}</td>
        <td>${st==='scheduled'? `<button class="btn small" data-cancel="${s.id}">Cancel</button>`:''}</td>
      </tr>
    `;
  }).join('');
  tbody.innerHTML = rows || '<tr><td colspan="5">No schedules yet</td></tr>';
  tbody.querySelectorAll('button[data-cancel]').forEach(b => b.addEventListener('click', () => {
    const id = b.getAttribute('data-cancel');
    if (SmsGateway.cancelSchedule(id)) renderSchedule();
    renderReports();
  }))
}

setInterval(()=>{ // auto-refresh schedule and reports
  renderSchedule();
  renderReports(false); // quiet refresh
  renderMessages(false);
}, 2000);

// Reports
let deptChart;
function renderReports(showAnimation=true){
  const { sent, delivered, failed, scheduled } = Analytics.getKpis();
  document.getElementById('kpiSent').textContent = sent;
  document.getElementById('kpiDelivered').textContent = delivered;
  document.getElementById('kpiFailed').textContent = failed;
  document.getElementById('kpiScheduled').textContent = scheduled;

  const ctx = document.getElementById('deptChart').getContext('2d');
  const data = Analytics.deliveryByDepartment();
  const labels = Object.keys(data);
  const deliveredArr = labels.map(l => data[l].delivered);
  const failedArr = labels.map(l => data[l].failed);
  if (deptChart) deptChart.destroy();
  deptChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Delivered', data: deliveredArr, backgroundColor: '#22c55e' },
        { label: 'Failed', data: failedArr, backgroundColor: '#ef4444' }
      ]
    },
    options: { responsive: true, animation: showAnimation ? {} : false, scales: { x: { stacked: true }, y: { stacked: true } } }
  });
}

// Messages table
function renderMessages(showToast=true){
  const tbody = document.querySelector('#messagesTable tbody');
  const rows = MockStore.messages.slice(0, 20).map(m => {
    const rec = m.recipients.length;
    const delivered = Object.values(m.perRecipient).filter(s=>s==='delivered').length;
    const failed = Object.values(m.perRecipient).filter(s=>s==='failed').length;
    const status = m.status;
    return `
      <tr>
        <td>${new Date(m.time).toLocaleTimeString()}</td>
        <td>${delivered}/${rec} delivered ${failed? '('+failed+' failed)':''}</td>
        <td>${status}</td>
        <td>${m.text.slice(0, 80)}</td>
      </tr>
    `;
  }).join('');
  tbody.innerHTML = rows;
}

renderSchedule();
renderReports();
renderMessages();

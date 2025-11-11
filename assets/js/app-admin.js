// Admin page logic: imports the shared mock and reuses much of app behavior
// Admin has full access; reuse functions adapted from previous app.js

// Utilities and seeding
const unique = (arr) => [...new Set(arr)];

(function seedContacts(){
  if (window.MockStore.contacts && window.MockStore.contacts.length>0) return;
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

// Filters
const deptSelect = document.getElementById('filterDepartment');
const yearSelect = document.getElementById('filterYear');
const courseSelect = document.getElementById('filterCourse');

function refreshFilterOptions(){
  const depts = unique(MockStore.contacts.map(c => c.department));
  deptSelect.innerHTML = '<option value="">All</option>' + depts.map(d=>`<option>${d}</option>`).join('');
  const courses = unique(MockStore.contacts.map(c => c.course));
  courseSelect.innerHTML = '<option value="">All</option>' + courses.map(c=>`<option>${c}</option>`).join('');
  // Scheduler filters
  const sDept = document.getElementById('schedDept');
  const sCourse = document.getElementById('schedCourse');
  if (sDept) sDept.innerHTML = '<option value="">All</option>' + depts.map(d=>`<option>${d}</option>`).join('');
  if (sCourse) sCourse.innerHTML = '<option value="">All</option>' + courses.map(c=>`<option>${c}</option>`).join('');
}
refreshFilterOptions();

// Nav
const panels = Array.from(document.querySelectorAll('.panel'));
const navItems = Array.from(document.querySelectorAll('.nav-item'));
function activatePanel(target){
  navItems.forEach(b=>b.classList.remove('active'));
  const match = navItems.find(b=>b.dataset.target===target);
  if (match) match.classList.add('active');
  panels.forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(target);
  if (panel) panel.classList.add('active');
  if (target === 'reports') renderReports();
  if (target === 'contacts') renderContactsFull();
}
navItems.forEach(btn => btn.addEventListener('click', (e) => {
  e.preventDefault(); e.stopPropagation();
  const t = btn.dataset.target; if (!t) return;
  activatePanel(t);
}));

// Contacts render
const contactsTbody = document.querySelector('#contactsTable tbody');
const toggleAll = document.getElementById('toggleAll');
const selectAll = document.getElementById('selectAll');
const clearAll = document.getElementById('clearAll');

function filterContacts(){
  const d = deptSelect.value; const y = yearSelect.value; const c = courseSelect.value;
  return MockStore.contacts.filter(ct =>
    (d? ct.department===d : true) &&
    (y? ct.year===y : (ct.role==='Staff'? true : true)) &&
    (c? ct.course===c : true)
  );
}

function renderContacts(){
  const rows = filterContacts().map(ct => `
    <tr>
      <td><input type="checkbox" class="ct-check" data-id="${ct.id}"></td>
      <td>${ct.name}</td><td>${ct.role}</td><td>${ct.department}</td><td>${ct.year || '-'}</td><td>${ct.course}</td><td>${ct.phone}</td>
    </tr>`).join('');
  contactsTbody.innerHTML = rows;
}

function renderContactsFull(){
  const tbody = document.querySelector('#contactsTableFull tbody');
  const editMode = document.body.getAttribute('data-contacts-edit') === '1';
  const rows = MockStore.contacts.slice(0, 400).map(ct => `
    <tr>
      <td>${ct.name}</td>
      <td>${ct.role}</td>
      <td>${ct.department}</td>
      <td>${ct.year || '-'}</td>
      <td>${ct.course}</td>
      <td>${ct.phone}</td>
      <td style="${editMode? '' : 'display:none'}">
        <button class="btn small" data-edit="${ct.id}">Edit</button>
        <button class="btn small" data-del="${ct.id}">Delete</button>
      </td>
    </tr>`).join('');
  tbody.innerHTML = rows;
  // bind actions when in edit mode
  if (editMode) {
    tbody.querySelectorAll('button[data-edit]')?.forEach(b => b.addEventListener('click', ()=> openContactModal(b.getAttribute('data-edit'))));
    tbody.querySelectorAll('button[data-del]')?.forEach(b => b.addEventListener('click', ()=> deleteContact(b.getAttribute('data-del'))));
  }
}

[deptSelect, yearSelect, courseSelect].forEach(el => el.addEventListener('change', renderContacts));

toggleAll.addEventListener('change', () => {
  document.querySelectorAll('.ct-check').forEach(ch => ch.checked = toggleAll.checked);
});
selectAll.addEventListener('click', () => { document.querySelectorAll('.ct-check').forEach(ch => ch.checked = true); });
clearAll.addEventListener('click', () => { document.querySelectorAll('.ct-check').forEach(ch => ch.checked = false); toggleAll.checked = false; });

renderContacts();
renderContactsFull();

// Templates and char count
const tpl = document.getElementById('template');
const msg = document.getElementById('message');
const charCount = document.getElementById('charCount');

tpl.addEventListener('change', () => { if (tpl.value) msg.value = tpl.value; updateChar(); });
msg.addEventListener('input', updateChar);
function updateChar(){ charCount.textContent = msg.value.length; }
updateChar();

function getSelectedRecipients(){
  const ids = Array.from(document.querySelectorAll('.ct-check:checked')).map(ch => ch.getAttribute('data-id'));
  return MockStore.contacts.filter(c => ids.includes(c.id));
}

function preview(text){
  const f = filterContacts()[0];
  if (!f) return text;
  return text.replace('{time}','10:00').replace('{course}', f.course).replace('{date}','Fri 3 Nov').replace('{event}','ANU Chapel').replace('{venue}','Main Hall');
}

async function sendNow(){
  const recipients = getSelectedRecipients();
  if (recipients.length === 0) { alert('Select at least one recipient'); return; }
  if (!msg.value.trim()) { alert('Enter a message'); return; }
  await SmsGateway.sendBulk(recipients, preview(msg.value));
  renderMessages(); renderReports(); alert('Message queued (simulated).');
}

document.getElementById('sendNowBtn').addEventListener('click', sendNow);

document.getElementById('sendNowBtnTop').addEventListener('click', sendNow);

// Schedule modal
const scheduleModal = document.getElementById('scheduleModal');
const openSchedule = document.getElementById('openSchedule');
const confirmSchedule = document.getElementById('confirmSchedule');
const closeModal = document.getElementById('closeModal');
openSchedule.addEventListener('click', ()=> scheduleModal.hidden=false);
closeModal.addEventListener('click', ()=> scheduleModal.hidden=true);
confirmSchedule.addEventListener('click', async ()=>{
  const d = document.getElementById('modalDate').value; const t = document.getElementById('modalTime').value;
  const recipients = getSelectedRecipients();
  if (recipients.length === 0) return alert('Select at least one recipient');
  if (!msg.value.trim()) return alert('Enter a message');
  if (!d || !t) return alert('Select date and time');
  const when = new Date(`${d}T${t}`); if (when < new Date()) return alert('Time must be in the future');
  await SmsGateway.schedule(recipients, preview(msg.value), when);
  scheduleModal.hidden=true; renderSchedule(); renderReports();
});

// Schedule page quick add
const addSchedule = document.getElementById('addSchedule');
addSchedule.addEventListener('click', async ()=>{
  const d = document.getElementById('schedDate').value; const t = document.getElementById('schedTime').value;
  const schedMsg = (document.getElementById('schedMessage')?.value || '').trim();
  const baseMessage = msg.value.trim() || schedMsg;
  if (!baseMessage) return alert('Enter a message (Compose or Scheduler message)');
  if (!d || !t) return alert('Select date and time');
  const when = new Date(`${d}T${t}`); if (when < new Date()) return alert('Time must be in the future');
  // Apply scheduler-specific filters if provided
  const sDept = document.getElementById('schedDept')?.value || '';
  const sYear = document.getElementById('schedYear')?.value || '';
  const sCourse = document.getElementById('schedCourse')?.value || '';
  let recipients = MockStore.contacts;
  recipients = recipients.filter(ct =>
    (sDept? ct.department===sDept : true) &&
    (sYear? ct.year===sYear : (ct.role==='Staff'? true : true)) &&
    (sCourse? ct.course===sCourse : true)
  );
  await SmsGateway.schedule(recipients, preview(baseMessage), when);
  renderSchedule(); renderReports();
});

function renderSchedule(){
  const tbody = document.querySelector('#scheduleTable tbody');
  const rows = MockStore.schedules.slice().sort((a,b)=>a.sendAt-b.sendAt).map(s=>{
    const rec = s.recipients.length; const st = s.status;
    return `<tr><td>${new Date(s.sendAt).toLocaleString()}</td><td>${rec}</td><td>${s.text.slice(0,60)}</td><td>${st}</td><td>${st==='scheduled'?`<button class="btn small" data-cancel="${s.id}">Cancel</button>`:''}</td></tr>`;
  }).join('');
  tbody.innerHTML = rows || '<tr><td colspan="5">No schedules yet</td></tr>';
  tbody.querySelectorAll('button[data-cancel]')?.forEach(b=> b.addEventListener('click',()=>{ if (SmsGateway.cancelSchedule(b.getAttribute('data-cancel'))) renderSchedule(); renderReports(); }));
}

setInterval(()=>{ renderSchedule(); renderReports(false); renderMessages(false); }, 2000);

let deptChart, overallChart;
function renderReports(){
  const { sent, delivered, failed, scheduled } = Analytics.getKpis();
  document.getElementById('kpiSent').textContent = sent;
  document.getElementById('kpiDelivered').textContent = delivered;
  document.getElementById('kpiFailed').textContent = failed;
  document.getElementById('kpiScheduled').textContent = scheduled;
  // Department 100% stacked horizontal bar
  const ctx = document.getElementById('deptChart').getContext('2d');
  const data = Analytics.deliveryByDepartment();
  const labels = Object.keys(data);
  const deliveredArr = labels.map(l => data[l].delivered);
  const failedArr = labels.map(l => data[l].failed);
  const totals = labels.map((_,i)=> (deliveredArr[i] + failedArr[i]) || 1);
  const deliveredPct = deliveredArr.map((v,i)=> Math.round((v / totals[i]) * 100));
  const failedPct = failedArr.map((v,i)=> 100 - deliveredPct[i]);
  if (deptChart) deptChart.destroy();
  deptChart = new Chart(ctx, { type:'bar', data:{ labels, datasets:[{label:'Delivered %',data:deliveredPct, backgroundColor:'#16a34a'},{label:'Failed %',data:failedPct, backgroundColor:'#ef4444'}]}, options:{indexAxis:'y', responsive:true, plugins:{tooltip:{callbacks:{label:(ctx)=> `${ctx.dataset.label}: ${ctx.parsed.x}%`}}, legend:{position:'bottom'}}, scales:{x:{stacked:true, max:100, ticks:{callback:(v)=> v + '%'}}, y:{stacked:true}}} });

  // Overall donut
  const octx = document.getElementById('overallChart').getContext('2d');
  if (overallChart) overallChart.destroy();
  overallChart = new Chart(octx, { type:'doughnut', data:{ labels:['Delivered','Failed','Scheduled'], datasets:[{ data:[delivered, failed, scheduled], backgroundColor:['#16a34a','#ef4444','#f59e0b'] }]}, options:{ responsive:true, plugins:{legend:{position:'bottom'}}} });
}

function renderMessages(){
  const tbody = document.querySelector('#messagesTable tbody');
  const rows = MockStore.messages.slice(0, 20).map(m => {
    const rec = m.recipients.length;
    const delivered = Object.values(m.perRecipient).filter(s=>s==='delivered').length;
    const failed = Object.values(m.perRecipient).filter(s=>s==='failed').length;
    const status = m.status;
    return `<tr><td>${new Date(m.time).toLocaleTimeString()}</td><td>${delivered}/${rec} delivered ${failed? '('+failed+' failed)':''}</td><td>${status}</td><td>${m.text.slice(0,80)}</td></tr>`;
  }).join('');
  tbody.innerHTML = rows;
}

renderSchedule(); renderReports(); renderMessages();

// Edit mode functionality
const editToggle = document.getElementById('contactsEditToggle');
const addContactBtn = document.getElementById('addContactBtn');
const actionsHead = document.getElementById('contactsActionsHead');
const contactModal = document.getElementById('contactModal');

editToggle?.addEventListener('click', () => {
  const on = document.body.getAttribute('data-contacts-edit') === '1';
  document.body.setAttribute('data-contacts-edit', on ? '0' : '1');
  editToggle.textContent = on ? 'Enter Edit Mode' : 'Exit Edit Mode';
  if (actionsHead) actionsHead.style.display = on ? 'none' : '';
  if (addContactBtn) addContactBtn.style.display = on ? 'none' : '';
  renderContactsFull();
});

addContactBtn?.addEventListener('click', ()=> openContactModal(null));

function openContactModal(id){
  const title = document.getElementById('contactModalTitle');
  const name = document.getElementById('contactName');
  const role = document.getElementById('contactRole');
  const phone = document.getElementById('contactPhone');
  const dept = document.getElementById('contactDept');
  const year = document.getElementById('contactYear');
  const course = document.getElementById('contactCourse');
  const hiddenId = document.getElementById('contactId');
  if (id){
    const ct = MockStore.contacts.find(c => c.id === id);
    if (!ct) return;
    title.textContent = 'Edit Contact';
    name.value = ct.name; role.value = ct.role; phone.value = ct.phone; dept.value = ct.department; year.value = ct.year || ''; course.value = ct.course; hiddenId.value = id;
  } else {
    title.textContent = 'Add Contact';
    name.value = ''; role.value = 'Student'; phone.value = ''; dept.value=''; year.value=''; course.value=''; hiddenId.value='';
  }
  contactModal.hidden = false;
}

document.getElementById('contactCancelBtn')?.addEventListener('click', ()=> contactModal.hidden = true);
document.getElementById('contactSaveBtn')?.addEventListener('click', ()=>{
  const name = document.getElementById('contactName').value.trim();
  const role = document.getElementById('contactRole').value;
  const phone = document.getElementById('contactPhone').value.trim();
  const department = document.getElementById('contactDept').value.trim();
  const year = (document.getElementById('contactYear').value || '').toString();
  const course = document.getElementById('contactCourse').value.trim();
  const id = document.getElementById('contactId').value;
  if (!name || !phone || !department || !course) { alert('Name, Phone, Department, and Course are required.'); return; }
  if (!/^\+?\d{10,15}$/.test(phone)){ alert('Enter a valid phone number (e.g., +2547xxxxxxxx).'); return; }
  if (id){
    const idx = MockStore.contacts.findIndex(c => c.id === id);
    if (idx>=0){ MockStore.contacts[idx] = { ...MockStore.contacts[idx], name, role, phone, department, year: role==='Student' ? (year || '') : '', course }; }
  } else {
    const newId = (Math.max(0, ...MockStore.contacts.map(c=>parseInt(c.id,10)||0)) + 1).toString();
    MockStore.contacts.unshift({ id: newId, name, role, phone, department, year: role==='Student' ? (year || '') : '', course });
  }
  contactModal.hidden = true;
  refreshFilterOptions();
  renderContacts();
  renderContactsFull();
});

function deleteContact(id){
  if (!confirm('Delete this contact?')) return;
  const idx = MockStore.contacts.findIndex(c => c.id === id);
  if (idx>=0) MockStore.contacts.splice(idx,1);
  refreshFilterOptions();
  renderContacts();
  renderContactsFull();
}

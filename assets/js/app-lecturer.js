// Lecturer page logic: enforces sending to assigned units

const LecturerAssignments = { lecture: ['CS101','CS202','FIN330'] };
const lecturerUnits = LecturerAssignments.lecture;
const unique = (arr)=>[...new Set(arr)];

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
          contacts.push({ id:(id++).toString(), name: role==='Staff'? `${dept} Staff ${i+1}` : `${dept} Student ${y}${i+1}`, role, department:dept, year: role==='Staff'? '' : y.toString(), course, phone: `+2547${Math.floor(10000000 + Math.random()*8999999)}`});
        }
      })
    }
  });
  MockStore.contacts = contacts;
})();

// Populate lecturer units (Compose and Scheduler)
const unitSelect = document.getElementById('lecturerUnitSelect');
const schedUnitSelect = document.getElementById('schedUnitSelect');
const unitOptions = '<option value="">Select unit</option>' + lecturerUnits.map(u=>`<option value="${u}">${u}</option>`).join('');
if (unitSelect) unitSelect.innerHTML = unitOptions;
if (schedUnitSelect) schedUnitSelect.innerHTML = unitOptions;

const contactsTbody = document.querySelector('#contactsTable tbody');
const toggleAll = document.getElementById('toggleAll');
const selectAll = document.getElementById('selectAll');
const clearAll = document.getElementById('clearAll');

function allowedBase(){
  const chosenUnit = unitSelect.value || schedUnitSelect?.value || '';
  const chosen = chosenUnit ? [chosenUnit] : lecturerUnits;
  return MockStore.contacts.filter(ct => ct.role==='Student' && chosen.includes(ct.course));
}

function filterContacts(){
  return allowedBase();
}

function renderContacts(){
  const rows = filterContacts().map(ct => `
    <tr>
      <td><input type="checkbox" class="ct-check" data-id="${ct.id}" checked></td>
      <td>${ct.name}</td><td>${ct.role}</td><td>${ct.department}</td><td>${ct.year || '-'}</td><td>${ct.course}</td><td>${ct.phone}</td>
    </tr>`).join('');
  contactsTbody.innerHTML = rows;
}

unitSelect.addEventListener('change', renderContacts);

toggleAll.addEventListener('change', () => { document.querySelectorAll('.ct-check').forEach(ch => ch.checked = toggleAll.checked); });
selectAll.addEventListener('click', () => { document.querySelectorAll('.ct-check').forEach(ch => ch.checked = true); });
clearAll.addEventListener('click', () => { document.querySelectorAll('.ct-check').forEach(ch => ch.checked = false); toggleAll.checked = false; });

renderContacts();
// Sidebar navigation
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
}
navItems.forEach(btn => btn.addEventListener('click', (e) => {
  e.preventDefault(); e.stopPropagation();
  const t = btn.dataset.target; if (!t) return;
  activatePanel(t);
}));


// Message form
const tpl = document.getElementById('template');
const msg = document.getElementById('message');
const charCount = document.getElementById('charCount');

tpl.addEventListener('change', () => { if (tpl.value) msg.value = tpl.value; updateChar(); });
msg.addEventListener('input', updateChar);
function updateChar(){ charCount.textContent = msg.value.length; } updateChar();

function getSelectedRecipients(){
  const ids = Array.from(document.querySelectorAll('.ct-check:checked')).map(ch => ch.getAttribute('data-id'));
  let selected = MockStore.contacts.filter(c => ids.includes(c.id));
  if (selected.length === 0) selected = filterContacts();
  return selected;
}

function preview(text){
  const f = filterContacts()[0];
  if (!f) return text;
  return text.replace('{time}','10:00').replace('{course}', f.course).replace('{date}','Fri 3 Nov').replace('{event}','ANU Chapel').replace('{venue}','Main Hall');
}

async function sendNow(){
  const recipients = getSelectedRecipients();
  if (recipients.length === 0) return alert('No recipients');
  if (!msg.value.trim()) return alert('Enter a message');
  // Enforce lecturer restriction
  const chosen = unitSelect.value ? [unitSelect.value] : lecturerUnits;
  const invalid = recipients.filter(r => r.role !== 'Student' || !chosen.includes(r.course));
  if (invalid.length) return alert('You can only message students in your assigned units.');
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
  const chosenUnit = unitSelect.value || schedUnitSelect?.value || '';
  const chosen = chosenUnit ? [chosenUnit] : lecturerUnits;
  const invalid = recipients.filter(r => r.role !== 'Student' || !chosen.includes(r.course));
  if (invalid.length) return alert('You can only schedule to your assigned units.');
  await SmsGateway.schedule(recipients, preview(msg.value), when);
  scheduleModal.hidden=true; renderSchedule(); renderReports();
});

// Schedule quick add
const addSchedule = document.getElementById('addSchedule');
addSchedule.addEventListener('click', async ()=>{
  const d = document.getElementById('schedDate').value; const t = document.getElementById('schedTime').value;
  const schedMsg = (document.getElementById('schedMessage')?.value || '').trim();
  const baseMessage = msg.value.trim() || schedMsg;
  if (!baseMessage) return alert('Enter a message (Compose or Scheduler message)');
  if (!d || !t) return alert('Select date and time');
  const when = new Date(`${d}T${t}`); if (when < new Date()) return alert('Time must be in the future');
  const recipients = filterContacts();
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

let wavesChart;
function renderReports(){
  const { sent, delivered, failed, scheduled } = Analytics.getKpis();
  document.getElementById('kpiSent').textContent = sent;
  document.getElementById('kpiDelivered').textContent = delivered;
  document.getElementById('kpiFailed').textContent = failed;
  document.getElementById('kpiScheduled').textContent = scheduled;
  // Compact waves (area) chart for Sent vs Failed over last 30 mins
  const ctx = document.getElementById('wavesChart').getContext('2d');
  const now = Date.now();
  const buckets = Array.from({length:20}, (_,i)=> now - (19-i)*60*1000);
  const labels = buckets.map(ts => new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
  const seriesSent = new Array(buckets.length).fill(0);
  const seriesFailed = new Array(buckets.length).fill(0);
  MockStore.messages.forEach(m => {
    const idx = buckets.findIndex(ts => new Date(m.time).getTime() <= ts);
    const bi = idx === -1 ? 0 : idx;
    const total = m.recipients.length;
    const failedCount = Object.values(m.perRecipient).filter(s=>s==='failed').length;
    seriesSent[bi] += total; seriesFailed[bi] += failedCount;
  });
  if (wavesChart) wavesChart.destroy();
  wavesChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[
      { label:'Sent', data:seriesSent, tension:0.45, fill:true, backgroundColor:'rgba(239,68,68,0.14)', borderColor:'#ef4444', pointRadius:0 },
      { label:'Failed', data:seriesFailed, tension:0.45, fill:true, backgroundColor:'rgba(220,38,38,0.22)', borderColor:'#dc2626', pointRadius:0 }
    ]},
    options:{
      responsive:true,
      plugins:{ legend:{ display:false } },
      scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true, ticks:{ maxTicksLimit:4 } } },
      elements:{ line:{ borderWidth:2 } }
    }
  });
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

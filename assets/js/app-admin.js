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

// Initialize templates storage
if (!window.MockStore.templates) {
  window.MockStore.templates = [
    {
      id: '1',
      name: 'Class Reminder',
      category: 'Academic',
      content: 'Reminder: {course} class at {time} in {venue}. Please arrive 10 minutes early.',
      variables: ['{course}', '{time}', '{venue}'],
      createdAt: new Date(),
      createdBy: 'admin'
    },
    {
      id: '2',
      name: 'Assignment Due',
      category: 'Academic',
      content: 'Assignment for {course} is due on {date}. Please submit before deadline.',
      variables: ['{course}', '{date}'],
      createdAt: new Date(),
      createdBy: 'admin'
    },
    {
      id: '3',
      name: 'Meeting Notice',
      category: 'Administrative',
      content: 'Department meeting scheduled for {date} at {time}. Attendance required.',
      variables: ['{date}', '{time}'],
      createdAt: new Date(),
      createdBy: 'admin'
    },
    {
      id: '4',
      name: 'Event Announcement',
      category: 'Events',
      content: 'Join us for {event} on {date} at {venue}. Registration required.',
      variables: ['{event}', '{date}', '{venue}'],
      createdAt: new Date(),
      createdBy: 'admin'
    }
  ];
}

const toastContainer = document.getElementById('toastContainer');

function showToast(type, message){
  const colors = {
    success: { bg: '#ecfdf5', border:'#10b981', text:'#064e3b' },
    error: { bg: '#fef2f2', border:'#ef4444', text:'#7f1d1d' },
    info: { bg: '#eef2ff', border:'#6366f1', text:'#1e3a8a' }
  };
  const c = colors[type] || colors.info;
  const el = document.createElement('div');
  el.style.background = c.bg;
  el.style.border = `1px solid ${c.border}`;
  el.style.color = c.text;
  el.style.borderRadius = '10px';
  el.style.padding = '12px 14px';
  el.style.marginBottom = '10px';
  el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.gap = '10px';
  el.style.fontFamily = 'Inter, sans-serif';
  el.style.fontSize = '14px';
  el.innerHTML = `<span style="font-weight:700">${type==='success'?'✓':type==='error'?'⨯':'ℹ'}</span><span>${message}</span>`;
  toastContainer?.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .4s'; setTimeout(()=> el.remove(), 400); }, 3000);
}

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

// Initialize templates
populateTemplateSelector();
renderTemplates();

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
  if (recipients.length === 0) { showToast('error','Please select at least one recipient.'); return; }
  if (!msg.value.trim()) { showToast('error','Please enter a message before sending.'); return; }
  
  // Show loading state
  const sendBtn = document.getElementById('sendNowBtn');
  const sendBtnTop = document.getElementById('sendNowBtnTop');
  const originalText = sendBtn.textContent;
  const originalTextTop = sendBtnTop.textContent;
  
  sendBtn.classList.add('loading');
  sendBtnTop.classList.add('loading');
  sendBtn.disabled = true;
  sendBtnTop.disabled = true;
  
  try {
    await SmsGateway.sendBulk(recipients, preview(msg.value));
    renderMessages(); renderReports();
    
    // Wait a bit to check final delivery status
    setTimeout(() => {
      const latestMessage = MockStore.messages[0];
      if (latestMessage) {
        const failedCount = Object.values(latestMessage.perRecipient).filter(s => s === 'failed').length;
        const totalCount = Object.values(latestMessage.perRecipient).length;
        
        if (failedCount === 0) {
          showToast('success', 'All messages delivered successfully.');
        } else if (failedCount === totalCount) {
          showToast('error', 'All messages failed to deliver.');
        } else {
          showToast('info', `${totalCount - failedCount} delivered, ${failedCount} failed.`);
        }
      }
      
      // Remove loading state
      sendBtn.classList.remove('loading');
      sendBtnTop.classList.remove('loading');
      sendBtn.disabled = false;
      sendBtnTop.disabled = false;
      sendBtn.textContent = originalText;
      sendBtnTop.textContent = originalTextTop;
    }, 2000);
    
  } catch (err) {
    showToast('error', 'Failed to send message.');
    
    // Remove loading state on error
    sendBtn.classList.remove('loading');
    sendBtnTop.classList.remove('loading');
    sendBtn.disabled = false;
    sendBtnTop.disabled = false;
    sendBtn.textContent = originalText;
    sendBtnTop.textContent = originalTextTop;
  }
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
  if (recipients.length === 0) return showToast('error','Please select at least one recipient.');
  if (!msg.value.trim()) return showToast('error','Please enter a message to schedule.');
  if (!d || !t) return showToast('error','Please select date and time.');
  const when = new Date(`${d}T${t}`); if (when < new Date()) return alert('Time must be in the future');
  await SmsGateway.schedule(recipients, preview(msg.value), when);
  scheduleModal.hidden=true; renderSchedule(); renderReports();
  showToast('success','Message scheduled successfully.');
});

// Schedule page quick add
const addSchedule = document.getElementById('addSchedule');
addSchedule.addEventListener('click', async ()=>{
  const d = document.getElementById('schedDate').value; const t = document.getElementById('schedTime').value;
  const schedMsg = (document.getElementById('schedMessage')?.value || '').trim();
  const baseMessage = msg.value.trim() || schedMsg;
  if (!baseMessage) return showToast('error','Enter a message (Compose or Scheduler message).');
  if (!d || !t) return showToast('error','Please select date and time.');
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
  showToast('success','Message scheduled successfully.');
});

function renderSchedule(){
  const tbody = document.querySelector('#scheduleTable tbody');
  const rows = MockStore.schedules.slice().sort((a,b)=>a.sendAt-b.sendAt).map(s=>{
    const rec = s.recipients.length; const st = s.status;
    return `<tr><td>${new Date(s.sendAt).toLocaleString()}</td><td>${rec}</td><td>${s.text.slice(0,60)}</td><td>${st}</td><td>${st==='scheduled'?`<button class="btn small" data-cancel="${s.id}">Cancel</button>`:''}</td></tr>`;
  }).join('');
  tbody.innerHTML = rows || '<tr><td colspan="5">No schedules yet</td></tr>';
  tbody.querySelectorAll('button[data-cancel]')?.forEach(b=> b.addEventListener('click',()=>{ if (SmsGateway.cancelSchedule(b.getAttribute('data-cancel'))) { renderSchedule(); renderReports(); showToast('info','Scheduled message cancelled.'); } }));
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
  const palette = {
    delivered: '#10b981', // emerald
    failed: '#f43f5e',    // rose  
    scheduled: '#3b82f6'  // blue
  };
  
  // Compact department performance as line chart
  if (deptChart) deptChart.destroy();
  deptChart = new Chart(ctx, {
    type:'line',
    data:{ 
      labels, 
      datasets:[{
        label:'Success Rate',
        data:deliveredPct, 
        borderColor:palette.delivered,
        backgroundColor:palette.delivered + '40',
        fill:true,
        tension:0.3,
        pointRadius:5,
        pointHoverRadius:8,
        pointBackgroundColor:'#ffffff',
        pointBorderColor:palette.delivered,
        pointBorderWidth:3,
        borderWidth:3
      }]
    },
    options:{
      responsive:true, 
      maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{enabled:true, mode:'index', displayColors:false}
      },
      scales:{
        x:{display:true, grid:{display:false}, ticks:{color:'#9ca3af', font:{size:10}}},
        y:{display:true, grid:{color:'#f3f4f6'}, ticks:{color:'#9ca3af', font:{size:10}}, min:0, max:100}
      },
      elements:{point:{hoverRadius:8}},
      layout:{padding:5}
    }
  });

  // Overall donut
  const octx = document.getElementById('overallChart').getContext('2d');
  if (overallChart) overallChart.destroy();
  // Minimal status doughnut
  if (overallChart) overallChart.destroy();
  overallChart = new Chart(octx, {
    type:'doughnut',
    data:{ 
      labels:['Delivered','Failed','Scheduled'], 
      datasets:[{
        data:[delivered, failed, scheduled],
        backgroundColor:[palette.delivered, palette.failed, palette.scheduled],
        borderWidth:0,
        cutout:'70%'
      }]
    },
    options:{ 
      responsive:true, 
      maintainAspectRatio:false,
      plugins:{ 
        legend:{display:false}, 
        tooltip:{enabled:true}
      },
      layout:{padding:0}
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

// Template Management Functions
function renderTemplates() {
  const tbody = document.querySelector('#templatesTable tbody');
  if (!tbody) return;
  
  const templates = MockStore.templates || [];
  const rows = templates.map(t => `
    <tr>
      <td>${t.name}</td>
      <td><span class="template-category">${t.category}</span></td>
      <td class="template-preview">${t.content.slice(0, 80)}${t.content.length > 80 ? '...' : ''}</td>
      <td class="template-variables">${t.variables.join(', ')}</td>
      <td>
        <button class="btn small" onclick="useTemplate('${t.id}')">Use</button>
        <button class="btn small" onclick="editTemplate('${t.id}')">Edit</button>
        <button class="btn small" onclick="deleteTemplate('${t.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
  
  tbody.innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:#666;">No templates found</td></tr>';
}

function useTemplate(templateId) {
  const template = MockStore.templates.find(t => t.id === templateId);
  if (!template) return;
  
  const msgTextarea = document.getElementById('message');
  if (msgTextarea) {
    msgTextarea.value = template.content;
    updateChar();
    showToast('success', `Template "${template.name}" loaded successfully.`);
    
    // Switch to compose panel if not already there
    activatePanel('compose');
  }
}

function editTemplate(templateId) {
  const template = MockStore.templates.find(t => t.id === templateId);
  if (!template) return;
  
  openTemplateModal(template);
}

function deleteTemplate(templateId) {
  if (!confirm('Are you sure you want to delete this template?')) return;
  
  const index = MockStore.templates.findIndex(t => t.id === templateId);
  if (index >= 0) {
    const template = MockStore.templates[index];
    MockStore.templates.splice(index, 1);
    renderTemplates();
    showToast('info', `Template "${template.name}" deleted.`);
  }
}

function openTemplateModal(template = null) {
  const modal = document.getElementById('templateModal');
  if (!modal) return;
  
  const form = modal.querySelector('#templateForm');
  const title = modal.querySelector('#templateModalTitle');
  
  if (template) {
    title.textContent = 'Edit Template';
    form.templateId.value = template.id;
    form.templateName.value = template.name;
    form.templateCategory.value = template.category;
    form.templateContent.value = template.content;
  } else {
    title.textContent = 'Create New Template';
    form.templateId.value = '';
    form.templateName.value = '';
    form.templateCategory.value = 'Academic';
    form.templateContent.value = '';
  }
  
  modal.hidden = false;
}

function saveTemplate() {
  const form = document.getElementById('templateForm');
  const templateId = form.templateId.value;
  const name = form.templateName.value.trim();
  const category = form.templateCategory.value;
  const content = form.templateContent.value.trim();
  
  if (!name || !content) {
    showToast('error', 'Template name and content are required.');
    return;
  }
  
  // Extract variables from content
  const variables = [...new Set(content.match(/\{[^}]+\}/g) || [])];
  
  const templateData = {
    name,
    category,
    content,
    variables,
    createdAt: new Date(),
    createdBy: 'admin'
  };
  
  if (templateId) {
    // Update existing template
    const index = MockStore.templates.findIndex(t => t.id === templateId);
    if (index >= 0) {
      MockStore.templates[index] = { ...MockStore.templates[index], ...templateData };
      showToast('success', 'Template updated successfully.');
    }
  } else {
    // Create new template
    const newId = (Math.max(0, ...MockStore.templates.map(t => parseInt(t.id) || 0)) + 1).toString();
    MockStore.templates.push({ id: newId, ...templateData });
    showToast('success', 'Template created successfully.');
  }
  
  document.getElementById('templateModal').hidden = true;
  renderTemplates();
  populateTemplateSelector();
}

function populateTemplateSelector() {
  const selector = document.getElementById('template');
  if (!selector) return;
  
  const templates = MockStore.templates || [];
  const options = templates.map(t => 
    `<option value="${t.content}" data-template-id="${t.id}">${t.name} (${t.category})</option>`
  ).join('');
  
  selector.innerHTML = `<option value="">Select a template...</option>${options}`;
}

// Template search and filter
function filterTemplates() {
  const searchTerm = document.getElementById('templateSearch')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('templateCategoryFilter')?.value || '';
  
  const tbody = document.querySelector('#templatesTable tbody');
  if (!tbody) return;
  
  let templates = MockStore.templates || [];
  
  if (searchTerm) {
    templates = templates.filter(t => 
      t.name.toLowerCase().includes(searchTerm) || 
      t.content.toLowerCase().includes(searchTerm)
    );
  }
  
  if (categoryFilter) {
    templates = templates.filter(t => t.category === categoryFilter);
  }
  
  const rows = templates.map(t => `
    <tr>
      <td>${t.name}</td>
      <td><span class="template-category">${t.category}</span></td>
      <td class="template-preview">${t.content.slice(0, 80)}${t.content.length > 80 ? '...' : ''}</td>
      <td class="template-variables">${t.variables.join(', ')}</td>
      <td>
        <button class="btn small" onclick="useTemplate('${t.id}')">Use</button>
        <button class="btn small" onclick="editTemplate('${t.id}')">Edit</button>
        <button class="btn small" onclick="deleteTemplate('${t.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
  
  tbody.innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:#666;">No templates match your criteria</td></tr>';
}

// Reports interactions
document.getElementById('refreshReports')?.addEventListener('click', ()=> renderReports());
document.getElementById('reportRange')?.addEventListener('change', ()=> renderReports());

// Export Reports PDF
document.getElementById('exportReportsPdf')?.addEventListener('click', () => {
  try {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF){ showToast('error', 'PDF library not loaded.'); return; }
    
    const range = document.getElementById('reportRange')?.value || 'all';
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 50;
    let y = margin;
    
    // Colors
    const colors = {
      primary: [220, 38, 38],    // Red
      secondary: [107, 114, 128], // Gray
      success: [16, 185, 129],   // Green
      danger: [239, 68, 68],     // Red
      info: [59, 130, 246]       // Blue
    };
    
    // Header with background
    doc.setFillColor(50, 50, 50);
    doc.rect(0, 0, 595, 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ANU SMS SYSTEM', margin, 35);
    doc.setFontSize(14);
    doc.text('Analytics & Performance Report', margin, 55);
    
    y = 100;
    doc.setTextColor(0, 0, 0);
    
    // Report info box
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, 495, 40, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, 495, 40, 'S');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin + 15, y + 18);
    doc.text(`Time Range: ${range.toUpperCase()}`, margin + 15, y + 32);
    
    y += 60;
    
    // KPIs Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('KEY PERFORMANCE INDICATORS', margin, y);
    y += 25;
    
    const { sent, delivered, failed, scheduled } = Analytics.getKpis();
    const deliveryRate = sent > 0 ? Math.round((delivered/sent)*100) : 0;
    
    const kpis = [
      { label: 'Total Messages', value: sent },
      { label: 'Delivered', value: delivered },
      { label: 'Failed', value: failed },
      { label: 'Scheduled', value: scheduled }
    ];
    
    let x = margin;
    kpis.forEach((kpi, i) => {
      // KPI Box - Simple border only
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(x, y, 110, 60, 'S');
      
      // KPI Value
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value.toString(), x + 55, y + 25, { align: 'center' });
      
      // KPI Label
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, x + 55, y + 45, { align: 'center' });
      
      x += 120;
    });
    
    y += 80;
    
    // Success Rate highlight
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(1);
    doc.rect(margin, y, 495, 30, 'S');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Success Rate: ${deliveryRate}%`, margin + 20, y + 20);
    
    y += 50;
    
    // Department Performance Table
    const deptData = Analytics.deliveryByDepartment();
    if (Object.keys(deptData).length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DEPARTMENT PERFORMANCE', margin, y);
      y += 25;
      
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, 495, 25, 'F');
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, 495, 25, 'S');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Department', margin + 15, y + 17);
      doc.text('Delivered', margin + 200, y + 17);
      doc.text('Failed', margin + 300, y + 17);
      doc.text('Success Rate', margin + 400, y + 17);
      
      y += 25;
      
      // Table rows
      let rowIndex = 0;
      Object.entries(deptData).forEach(([dept, stats]) => {
        const total = stats.delivered + stats.failed;
        const rate = total > 0 ? Math.round((stats.delivered/total)*100) : 0;
        
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, 495, 20, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(dept, margin + 15, y + 14);
        doc.text(stats.delivered.toString(), margin + 200, y + 14);
        doc.text(stats.failed.toString(), margin + 300, y + 14);
        
        // Success rate in black
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${rate}%`, margin + 400, y + 14);
        
        y += 20;
        rowIndex++;
      });
      
      // Table border
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(1);
      doc.rect(margin, y - (rowIndex * 20) - 25, 495, (rowIndex * 20) + 25, 'S');
      
      y += 20;
    }
    
    // Recent Messages
    if (MockStore.messages.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RECENT MESSAGE ACTIVITY', margin, y);
      y += 25;
      
      const messages = MockStore.messages.slice(0, 8);
      messages.forEach((m, i) => {
        if (y > 700) {
          doc.addPage();
          y = margin;
        }
        
        const delivered = Object.values(m.perRecipient).filter(s=>s==='delivered').length;
        const failed = Object.values(m.perRecipient).filter(s=>s==='failed').length;
        const total = Object.values(m.perRecipient).length;
        
        // Message box
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.rect(margin, y, 495, 35, 'S');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(new Date(m.time).toLocaleString(), margin + 10, y + 15);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Recipients: ${total} | Delivered: ${delivered} | Failed: ${failed}`, margin + 10, y + 27);
        
        const preview = m.text.slice(0, 60) + (m.text.length > 60 ? '...' : '');
        doc.text(`"${preview}"`, margin + 300, y + 21);
        
        y += 40;
      });
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(50, 50, 50);
    doc.rect(0, pageHeight - 30, 595, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('ANU SMS System - Confidential Report', 50, pageHeight - 10);
    doc.text(`Page 1 of 1`, 545, pageHeight - 10, { align: 'right' });
    
    doc.save(`anu-sms-report-${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('success', 'Professional report exported successfully.');
    
  } catch (err) {
    console.error(err);
    showToast('error', 'Failed to export report.');
  }
});

// Edit mode functionality
const editToggle = document.getElementById('contactsEditToggle');
const addContactBtn = document.getElementById('addContactBtn');
const actionsHead = document.getElementById('contactsActionsHead');
const contactModal = document.getElementById('contactModal');
const csvInput = document.getElementById('contactsCsvInput');
const exportPdfBtn = document.getElementById('exportPdfBtn');

editToggle?.addEventListener('click', () => {
  const on = document.body.getAttribute('data-contacts-edit') === '1';
  document.body.setAttribute('data-contacts-edit', on ? '0' : '1');
  editToggle.textContent = on ? 'Enter Edit Mode' : 'Exit Edit Mode';
  if (actionsHead) actionsHead.style.display = on ? 'none' : '';
  if (addContactBtn) addContactBtn.style.display = on ? 'none' : '';
  renderContactsFull();
});

addContactBtn?.addEventListener('click', ()=> openContactModal(null));

// CSV Import
csvInput?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const rows = parseCsv(text);
    const added = importContactsFromRows(rows);
      showToast('success', `Imported ${added.added} contacts${added.skipped ? `, skipped ${added.skipped} duplicates/invalid` : ''}.`);
    refreshFilterOptions();
    renderContacts();
    renderContactsFull();
  } catch (err) {
    console.error(err);
    alert('Failed to import CSV. Please check the file format.');
  } finally {
    e.target.value = '';
  }
});

function parseCsv(text){
  // Simple CSV parser: supports comma-separated with optional quotes
  const lines = text.replace(/\r/g,'').split('\n').filter(l=>l.trim().length>0);
  if (lines.length===0) return [];
  const header = splitCsvLine(lines[0]).map(h=>h.trim().toLowerCase());
  const map = (name) => header.indexOf(name);
  const idx = {
    name: map('name'),
    phone: map('phone'),
    department: map('department'),
    role: map('role'),
    year: map('year'),
    course: map('course')
  };
  const rows = [];
  for (let i=1;i<lines.length;i++){
    const cols = splitCsvLine(lines[i]);
    const get = (k) => idx[k] >= 0 ? (cols[idx[k]]||'').trim() : '';
    rows.push({
      name: get('name'),
      phone: get('phone'),
      department: get('department'),
      role: get('role') || 'Student',
      year: get('year'),
      course: get('course')
    });
  }
  return rows;
}

function splitCsvLine(line){
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i=0;i<line.length;i++){
    const ch = line[i];
    if (ch==='"'){
      if (inQuotes && line[i+1]==='"'){ cur+='"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch===',' && !inQuotes){
      result.push(cur); cur='';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function importContactsFromRows(rows){
  let added=0, skipped=0;
  const existingPhones = new Set(MockStore.contacts.map(c=>c.phone));
  const maxId = Math.max(0, ...MockStore.contacts.map(c=>parseInt(c.id,10)||0));
  let nextId = maxId + 1;
  rows.forEach(r => {
    if (!r.name || !r.phone || !r.department || !r.course){ skipped++; return; }
    if (!/^\+?\d{10,15}$/.test(r.phone)){ skipped++; return; }
    if (existingPhones.has(r.phone)){ skipped++; return; }
    const role = (r.role==='Staff'||r.role==='Student') ? r.role : 'Student';
    const year = role==='Student' ? (r.year||'') : '';
    MockStore.contacts.unshift({
      id: (nextId++).toString(),
      name: r.name,
      role,
      phone: r.phone,
      department: r.department,
      year,
      course: r.course
    });
    existingPhones.add(r.phone);
    added++;
  });
  return { added, skipped };
}

// Export PDF
exportPdfBtn?.addEventListener('click', () => {
  try {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF){ alert('PDF library not loaded.'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;
    doc.setFontSize(14);
    doc.text('Contacts Export', margin, y);
    y += 20;
    doc.setFontSize(10);
    const headers = ['Name','Role','Department','Year','Course','Phone'];
    const colWidths = [140,60,110,40,90,100];
    // header row
    let x = margin;
    headers.forEach((h, i)=>{ doc.text(h, x, y); x += colWidths[i]; });
    y += 12;
    doc.setLineWidth(0.5);
    doc.line(margin, y, 595 - margin, y);
    y += 8;
    // rows
    const rows = MockStore.contacts.slice(0, 1000); // cap for safety
    rows.forEach(ct => {
      x = margin;
      const vals = [ct.name, ct.role, ct.department, ct.year || '-', ct.course, ct.phone];
      // Wrap text per column width
      const wrapped = vals.map((v,i)=> doc.splitTextToSize(String(v), colWidths[i]-6));
      const rowHeight = Math.max(...wrapped.map(arr => arr.length)) * 12;
      // New page if needed
      if (y + rowHeight > 812 - margin){
        doc.addPage(); y = margin;
        x = margin; headers.forEach((h, i)=>{ doc.text(h, x, y); x += colWidths[i]; });
        y += 12; doc.line(margin, y, 595 - margin, y); y += 8;
      }
      x = margin;
      wrapped.forEach((arr,i)=>{ doc.text(arr, x, y); x += colWidths[i]; });
      y += rowHeight;
    });
    doc.save('contacts.pdf');
  } catch (err){
    console.error(err);
    alert('Failed to export PDF.');
  }
});

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
  if (!name || !phone || !department || !course) { showToast('error','Name, Phone, Department, and Course are required.'); return; }
  if (!/^\+?\d{10,15}$/.test(phone)){ showToast('error','Enter a valid phone number (e.g., +2547xxxxxxxx).'); return; }
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
  showToast('success', id ? 'Contact updated successfully.' : 'Contact added successfully.');
});

function deleteContact(id){
  if (!confirm('Delete this contact?')) return;
  const idx = MockStore.contacts.findIndex(c => c.id === id);
  if (idx>=0) MockStore.contacts.splice(idx,1);
  refreshFilterOptions();
  renderContacts();
  renderContactsFull();
  showToast('info','Contact deleted.');
}

// Template Modal Event Listeners
document.getElementById('createTemplateBtn')?.addEventListener('click', () => openTemplateModal());
document.getElementById('templateCancelBtn')?.addEventListener('click', () => {
  document.getElementById('templateModal').hidden = true;
});
document.getElementById('templateSaveBtn')?.addEventListener('click', saveTemplate);
document.getElementById('templateSearch')?.addEventListener('input', filterTemplates);
document.getElementById('templateCategoryFilter')?.addEventListener('change', filterTemplates);

// Make functions globally accessible
window.useTemplate = useTemplate;
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;

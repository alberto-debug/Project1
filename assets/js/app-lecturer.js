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
      createdBy: 'lecturer'
    },
    {
      id: '2',
      name: 'Assignment Due',
      category: 'Academic',
      content: 'Reminder: {course} assignment "{assignment}" is due on {date}. Please submit through the learning portal.',
      variables: ['{course}', '{assignment}', '{date}'],
      createdAt: new Date(),
      createdBy: 'lecturer'
    },
    {
      id: '3',
      name: 'Exam Notification',
      category: 'Academic',
      content: 'Important: {course} exam scheduled for {date} at {time} in {venue}. Please bring your student ID and calculator.',
      variables: ['{course}', '{date}', '{time}', '{venue}'],
      createdAt: new Date(),
      createdBy: 'lecturer'
    },
    {
      id: '4',
      name: 'Class Cancellation',
      category: 'Administrative',
      content: 'Notice: {course} class on {date} at {time} has been cancelled. Makeup class will be announced soon.',
      variables: ['{course}', '{date}', '{time}'],
      createdAt: new Date(),
      createdBy: 'lecturer'
    },
    {
      id: '5',
      name: 'Event Invitation',
      category: 'Events',
      content: 'You are invited to {event} on {date} at {time} in {venue}. RSVP by replying to this message.',
      variables: ['{event}', '{date}', '{time}', '{venue}'],
      createdAt: new Date(),
      createdBy: 'lecturer'
    }
  ];
}

// Global element references
const unitSelect = document.getElementById('lecturerUnitSelect');
const schedUnitSelect = document.getElementById('schedUnitSelect');
const unitOptions = '<option value="">Select unit</option>' + lecturerUnits.map(u=>`<option value="${u}">${u}</option>`).join('');
if (unitSelect) unitSelect.innerHTML = unitOptions;
if (schedUnitSelect) schedUnitSelect.innerHTML = unitOptions;

const contactsTbody = document.querySelector('#contactsTable tbody');
const toggleAll = document.getElementById('toggleAll');
const selectAll = document.getElementById('selectAll');
const clearAll = document.getElementById('clearAll');
const msg = document.getElementById('message');
const tpl = document.getElementById('template');
const charCount = document.getElementById('charCount');

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
  if (target === 'templates') renderTemplates();
}
navItems.forEach(btn => btn.addEventListener('click', (e) => {
  e.preventDefault(); e.stopPropagation();
  const t = btn.dataset.target; if (!t) return;
  activatePanel(t);
}));


// Message form setup
if (tpl && msg && charCount) {
  tpl.addEventListener('change', () => { if (tpl.value) msg.value = tpl.value; updateChar(); });
  msg.addEventListener('input', updateChar);
  function updateChar(){ charCount.textContent = msg.value.length; } 
  updateChar();
}

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
  console.log('sendNow called');
  
  const recipients = getSelectedRecipients();
  console.log('recipients:', recipients);
  
  if (recipients.length === 0) { 
    showToast('error','Please select at least one recipient.'); 
    return; 
  }
  if (!msg || !msg.value.trim()) { 
    showToast('error','Please enter a message before sending.'); 
    return; 
  }
  
  // Enforce lecturer restriction
  const chosen = unitSelect?.value ? [unitSelect.value] : lecturerUnits;
  const invalid = recipients.filter(r => r.role !== 'Student' || !chosen.includes(r.course));
  if (invalid.length) { 
    showToast('error','You can only message students in your assigned units.'); 
    return; 
  }
  
  // Show loading state
  const sendBtn = document.getElementById('sendNowBtn');
  const sendBtnTop = document.getElementById('sendNowBtnTop');
  const originalText = sendBtn?.textContent || 'Send Now';
  const originalTextTop = sendBtnTop?.textContent || 'Send Now';
  
  // Update button states
  if (sendBtn) {
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;
  }
  if (sendBtnTop) {
    sendBtnTop.textContent = 'Sending...';
    sendBtnTop.disabled = true;
  }
  
  try {
    console.log('Calling SmsGateway.sendBulk with:', recipients, preview(msg.value));
    await SmsGateway.sendBulk(recipients, preview(msg.value));
    
    console.log('Message sent, updating UI...');
    renderMessages(); 
    renderReports();
    
    showToast('success', 'Message sent successfully!');
    
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
    }, 2500);
    
  } catch (err) {
    console.error('Error sending message:', err);
    showToast('error', 'Failed to send message. Please try again.');
  } finally {
    // Always restore button state
    setTimeout(() => {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
      }
      if (sendBtnTop) {
        sendBtnTop.disabled = false;
        sendBtnTop.textContent = originalTextTop;
      }
    }, 1000);
  }
}

// Send button event listeners
console.log('Setting up send button event listeners...');

// Use DOMContentLoaded to ensure elements are available
document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.getElementById('sendNowBtn');
  const sendBtnTop = document.getElementById('sendNowBtnTop');
  
  console.log('DOM loaded - sendBtn:', sendBtn, 'sendBtnTop:', sendBtnTop);
  
  if (sendBtn) {
    sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('sendNowBtn clicked');
      sendNow();
    });
    console.log('sendNowBtn event listener attached');
  } else {
    console.error('sendNowBtn not found in DOM');
  }

  if (sendBtnTop) {
    sendBtnTop.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('sendNowBtnTop clicked');
      sendNow();
    });
    console.log('sendNowBtnTop event listener attached');
  } else {
    console.error('sendNowBtnTop not found in DOM');
  }
});

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
  const when = new Date(`${d}T${t}`); if (when < new Date()) return showToast('error','Time must be in the future.');
  const chosenUnit = unitSelect.value || schedUnitSelect?.value || '';
  const chosen = chosenUnit ? [chosenUnit] : lecturerUnits;
  const invalid = recipients.filter(r => r.role !== 'Student' || !chosen.includes(r.course));
  if (invalid.length) return showToast('error','You can only schedule to your assigned units.');
  await SmsGateway.schedule(recipients, preview(msg.value), when);
  scheduleModal.hidden=true; renderSchedule(); renderReports();
  showToast('success','Message scheduled successfully.');
});

// Template modal event listeners
document.getElementById('createTemplateBtn')?.addEventListener('click', () => openTemplateModal());
document.getElementById('templateCancelBtn')?.addEventListener('click', () => {
  document.getElementById('templateModal').style.display = 'none';
});
document.getElementById('templateSaveBtn')?.addEventListener('click', saveTemplate);
document.getElementById('templateSearch')?.addEventListener('input', filterTemplates);
document.getElementById('templateCategoryFilter')?.addEventListener('change', filterTemplates);

// Schedule quick add
const addSchedule = document.getElementById('addSchedule');
addSchedule.addEventListener('click', async ()=>{
  const d = document.getElementById('schedDate').value; const t = document.getElementById('schedTime').value;
  const schedMsg = (document.getElementById('schedMessage')?.value || '').trim();
  const baseMessage = msg.value.trim() || schedMsg;
  if (!baseMessage) return showToast('error','Enter a message (Compose or Scheduler message).');
  if (!d || !t) return showToast('error','Please select date and time.');
  const when = new Date(`${d}T${t}`); if (when < new Date()) return showToast('error','Time must be in the future.');
  const recipients = filterContacts();
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
  
  // Course Performance Chart (line chart for lecturer's assigned courses)
  const ctx = document.getElementById('deptChart').getContext('2d');
  const data = Analytics.deliveryByDepartment();
  const lecturerCourseData = {};
  
  // Filter data for lecturer's assigned units only
  Object.entries(data).forEach(([dept, stats]) => {
    const deptCourses = MockStore.contacts
      .filter(c => c.department === dept && lecturerUnits.includes(c.course))
      .map(c => c.course);
    if (deptCourses.length > 0) {
      lecturerCourseData[dept] = stats;
    }
  });
  
  const labels = Object.keys(lecturerCourseData);
  const deliveredArr = labels.map(l => lecturerCourseData[l].delivered);
  const failedArr = labels.map(l => lecturerCourseData[l].failed);
  const totals = labels.map((_,i)=> (deliveredArr[i] + failedArr[i]) || 1);
  const deliveredPct = deliveredArr.map((v,i)=> Math.round((v / totals[i]) * 100));
  
  const palette = {
    delivered: '#10b981', // emerald
    failed: '#f43f5e',    // rose  
    scheduled: '#3b82f6'  // blue
  };
  
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

  // Overall Status Donut Chart
  const octx = document.getElementById('overallChart').getContext('2d');
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

// Template Library Functions
function renderTemplates() {
  const tbody = document.querySelector('#templatesTable tbody');
  if (!tbody) return;

  const searchTerm = document.getElementById('templateSearch')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('templateCategoryFilter')?.value || '';

  const filteredTemplates = MockStore.templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm) || 
                         template.content.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const rows = filteredTemplates.map(template => `
    <tr>
      <td><strong>${template.name}</strong></td>
      <td><span class="badge">${template.category}</span></td>
      <td>${template.content.slice(0, 60)}${template.content.length > 60 ? '...' : ''}</td>
      <td>${template.variables ? template.variables.join(', ') : 'None'}</td>
      <td>
        <button class="btn small" onclick="useTemplate('${template.id}')">Use</button>
        <button class="btn small" onclick="editTemplate('${template.id}')">Edit</button>
        <button class="btn small danger" onclick="deleteTemplate('${template.id}')">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:#666;">No templates found</td></tr>';
}

function useTemplate(templateId) {
  const template = MockStore.templates.find(t => t.id === templateId);
  if (template) {
    const messageField = document.getElementById('message');
    if (messageField) {
      messageField.value = template.content;
      // Trigger the character count update
      const event = new Event('input');
      messageField.dispatchEvent(event);
    }
    // Switch to compose panel
    activatePanel('compose');
    showToast('success', 'Template loaded into message field');
  }
}

function editTemplate(templateId) {
  const template = MockStore.templates.find(t => t.id === templateId);
  if (template) {
    openTemplateModal(template);
  }
}

function deleteTemplate(templateId) {
  if (confirm('Are you sure you want to delete this template?')) {
    MockStore.templates = MockStore.templates.filter(t => t.id !== templateId);
    renderTemplates();
    populateTemplateSelector(); // Update the template dropdown
    showToast('success', 'Template deleted successfully');
  }
}

function openTemplateModal(template = null) {
  const modal = document.getElementById('templateModal');
  const form = document.getElementById('templateForm');
  const title = document.getElementById('templateModalTitle');

  if (template) {
    // Edit mode
    title.textContent = 'Edit Template';
    form.templateName.value = template.name;
    form.templateCategory.value = template.category;
    form.templateContent.value = template.content;
    form.templateId.value = template.id;
  } else {
    // Create mode
    title.textContent = 'Create New Template';
    form.reset();
    form.templateId.value = '';
  }

  modal.style.display = 'flex';
}

function saveTemplate() {
  const form = document.getElementById('templateForm');
  const formData = new FormData(form);

  const templateData = {
    name: formData.get('templateName'),
    category: formData.get('templateCategory'),
    content: formData.get('templateContent'),
  };

  if (!templateData.name || !templateData.category || !templateData.content) {
    alert('Please fill in all fields');
    return;
  }

  // Extract variables from content
  const variables = [...new Set(templateData.content.match(/\{[^}]+\}/g) || [])];
  templateData.variables = variables;

  const templateId = formData.get('templateId');

  if (templateId) {
    // Update existing template
    const index = MockStore.templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      MockStore.templates[index] = { ...MockStore.templates[index], ...templateData };
      showToast('success', 'Template updated successfully');
    }
  } else {
    // Create new template
    templateData.id = Date.now().toString();
    templateData.createdAt = new Date();
    templateData.createdBy = 'lecturer';
    MockStore.templates.push(templateData);
    showToast('success', 'Template created successfully');
  }

  document.getElementById('templateModal').style.display = 'none';
  renderTemplates();
  populateTemplateSelector(); // Update the template dropdown
}

function populateTemplateSelector() {
  const select = document.getElementById('template');
  if (select) {
    const options = MockStore.templates.map(t => 
      `<option value="${t.content}">${t.name}</option>`
    ).join('');
    select.innerHTML = '<option value="">Select a template</option>' + options;
  }
}

function filterTemplates() {
  renderTemplates();
}

function showToast(type, message) {
  let toastContainer = document.getElementById('toastContainer');
  
  // Create toast container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
    document.body.appendChild(toastContainer);
  }

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
  el.style.maxWidth = '350px';
  el.style.wordWrap = 'break-word';
  el.innerHTML = `<span style="font-weight:700">${type==='success'?'✓':type==='error'?'⨯':'ℹ'}</span><span>${message}</span>`;
  toastContainer.appendChild(el);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      if (el.parentNode) {
        el.remove();
      }
    }, 400);
  }, 4000);
}

// Initialize templates
populateTemplateSelector();

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
    doc.text('Lecturer Performance Report', margin, 55);
    
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
    doc.text(`Time Range: ${range.toUpperCase()} | Course Units: ${lecturerUnits.join(', ')}`, margin + 15, y + 32);
    
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
    
    // Course Performance Table
    const deptData = Analytics.deliveryByDepartment();
    const lecturerCourseData = {};
    Object.entries(deptData).forEach(([dept, stats]) => {
      const deptCourses = MockStore.contacts
        .filter(c => c.department === dept && lecturerUnits.includes(c.course))
        .map(c => c.course);
      if (deptCourses.length > 0) {
        lecturerCourseData[dept] = stats;
      }
    });
    
    if (Object.keys(lecturerCourseData).length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COURSE PERFORMANCE', margin, y);
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
      Object.entries(lecturerCourseData).forEach(([dept, stats]) => {
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
    doc.text('ANU SMS System - Lecturer Report', 50, pageHeight - 10);
    doc.text(`Page 1 of 1`, 545, pageHeight - 10, { align: 'right' });
    
    doc.save(`anu-sms-lecturer-report-${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('success', 'Lecturer report exported successfully.');
    
  } catch (err) {
    console.error(err);
    showToast('error', 'Failed to export report.');
  }
});

renderSchedule(); renderReports(); renderMessages();

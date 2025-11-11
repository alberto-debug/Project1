// Simple in-browser mock SMS gateway and store
// Simulates sending, delivery, and failure with random delays

const MockStore = {
  contacts: [],       // seeded externally
  messages: [],       // {id, time, recipients:[ids], text, status: 'queued'|'sent'|'delivered'|'failed', perRecipient: {id: status}}
  schedules: []       // {id, sendAt: Date, recipients:[ids], text, status: 'scheduled'|'sent'|'canceled'}
};

let _id = 1; const genId = () => (_id++).toString();

const SmsGateway = {
  sendBulk(recipients, text) {
    const id = genId();
    const created = new Date();
    const msg = {
      id,
      time: created,
      recipients: recipients.map(r => r.id),
      text,
      status: 'sent',
      perRecipient: {}
    };
    MockStore.messages.unshift(msg);

    recipients.forEach((r, idx) => {
      msg.perRecipient[r.id] = 'sent';
      // Simulate delivery vs failure
      const delay = 400 + Math.random()*1200 + idx*60;
      setTimeout(() => {
        const delivered = Math.random() > 0.08; // 92% success
        msg.perRecipient[r.id] = delivered ? 'delivered' : 'failed';
        // Update overall status rolling
        const vals = Object.values(msg.perRecipient);
        if (vals.every(s => s === 'delivered')) msg.status = 'delivered';
        else if (vals.some(s => s === 'failed')) msg.status = 'partial';
      }, delay);
    });

    return Promise.resolve({ id, created });
  },

  schedule(recipients, text, when) {
    const id = genId();
    const item = { id, sendAt: new Date(when), recipients: recipients.map(r => r.id), text, status: 'scheduled' };
    MockStore.schedules.push(item);
    return Promise.resolve({ id });
  },

  cancelSchedule(id) {
    const idx = MockStore.schedules.findIndex(s => s.id === id);
    if (idx >= 0) {
      MockStore.schedules[idx].status = 'canceled';
      return true;
    }
    return false;
  }
};

// Scheduler tick
setInterval(() => {
  const now = new Date();
  const due = MockStore.schedules.filter(s => s.status === 'scheduled' && s.sendAt <= now);
  if (due.length === 0) return;
  due.forEach(s => {
    const recips = MockStore.contacts.filter(c => s.recipients.includes(c.id));
    SmsGateway.sendBulk(recips, s.text);
    s.status = 'sent';
  });
}, 1000);

// Lightweight analytics helpers
function getKpis(){
  const sent = MockStore.messages.length;
  const delivered = MockStore.messages.filter(m => m.status === 'delivered').length;
  const failed = MockStore.messages.filter(m => Object.values(m.perRecipient).some(s => s === 'failed')).length;
  const scheduled = MockStore.schedules.filter(s => s.status === 'scheduled').length;
  return { sent, delivered, failed, scheduled };
}

function deliveryByDepartment(){
  const byDept = {};
  MockStore.messages.forEach(m => {
    m.recipients.forEach(id => {
      const contact = MockStore.contacts.find(c => c.id === id);
      if (!contact) return;
      const dept = contact.department;
      byDept[dept] = byDept[dept] || { delivered:0, failed:0 };
      const status = m.perRecipient[id];
      if (status === 'delivered') byDept[dept].delivered++;
      if (status === 'failed') byDept[dept].failed++;
    });
  });
  return byDept;
}

window.MockStore = MockStore;
window.SmsGateway = SmsGateway;
window.Analytics = { getKpis, deliveryByDepartment };

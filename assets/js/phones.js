// Simple client-side endpoint to show messages on mock phones
(function(){
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from') || 'ANU';
  const msg = params.get('msg') || '';

  const A = document.getElementById('messagesA');
  const B = document.getElementById('messagesB');
  const simForm = document.getElementById('simForm');
  const simFrom = document.getElementById('simFrom');
  const simMsg = document.getElementById('simMsg');

  function addMsg(container, text, isMe=false){
    const wrap = document.createElement('div');
    const bubble = document.createElement('div'); bubble.className = 'bubble' + (isMe? ' me' : ''); bubble.textContent = text;
    const time = document.createElement('div'); time.className = 'time'; time.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    wrap.appendChild(bubble); wrap.appendChild(time); container.appendChild(wrap); container.scrollTop = container.scrollHeight;
  }

  function pushToPhones(sender, text){
    const full = sender ? `${sender}: ${text}` : text;
    addMsg(A, full, false);
    setTimeout(()=> addMsg(B, full, false), 500);
  }

  // Use query params once on load
  if (msg) pushToPhones(from, msg);

  // Simulate form
  simForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const s = simFrom.value.trim();
    const m = simMsg.value.trim();
    if (!m) return;
    pushToPhones(s, m);
    simMsg.value = '';
  });
})();

// Simple login redirector for prototype
(function(){
  const btn = document.getElementById('loginBtn');
  const user = document.getElementById('loginUser');
  const pass = document.getElementById('loginPass');

  btn.addEventListener('click', () => {
    const u = (user.value || '').trim().toLowerCase();
    // any password allowed
    if (u === 'admin') {
      window.location.href = 'admin.html';
    } else if (u === 'lecture' || u === 'lecturer') {
      window.location.href = 'lecturer.html';
    } else {
      alert('Use admin or lecture');
    }
  });

  // Enter key submission
  [user, pass].forEach(el => el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  }));
})();

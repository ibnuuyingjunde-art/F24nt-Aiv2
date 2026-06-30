/**
 * ui.js
 * -------------------------
 * Mengatur UI: sidebar, modal,
 * dropdown, loading, theme,
 * profile, settings.
 */

// ── SIDEBAR ──
function toggleSb() {
  document.getElementById('sb').classList.toggle('open');
  document.getElementById('sbov').classList.toggle('on');
}

function closeSb() {
  document.getElementById('sb').classList.remove('open');
  document.getElementById('sbov').classList.remove('on');
}

function setNavAct(id) {
  document.querySelectorAll('.ni').forEach(el => { if (el.id !== 'n-incog') el.classList.remove('act'); });
  const el = document.getElementById(id);
  if (el) el.classList.add('act');
  const inc = document.getElementById('n-incog');
  if (inc) inc.classList.toggle('act', G.isIncog);
}

function closeAllPanels() {
  closePanel('p-star');
  closePanel('p-proj');
  closePanel('p-tools');
  closePanel('p-stg');
}

function showChats() { setNavAct('n-chats'); closeAllPanels(); }
function showStarred() { setNavAct('n-star'); closeAllPanels(); openPanel('p-star'); renderStarred(); }
function showProjects() { setNavAct('n-proj'); closeAllPanels(); openPanel('p-proj'); renderProjects(); }
function showTools() { setNavAct('n-tools'); closeAllPanels(); openPanel('p-tools'); switchAnimeTab('anime'); }

function openPanel(id) { document.getElementById(id).classList.add('open'); }
function closePanel(id) { document.getElementById(id).classList.remove('open'); }

// ── MODAL ──
function openModal(id) { document.getElementById(id).classList.add('on'); }
function closeModal(id) { document.getElementById(id).classList.remove('on'); }

// ── PROFILE ──
function openProfile() {
  document.getElementById('pp').classList.add('on');
  updateProfileStats();
}
function closeProfile() { document.getElementById('pp').classList.remove('on'); }
function ppBgClick(e) { if (e.target === document.getElementById('pp')) closeProfile(); }

function updateProfileStats() {
  const s = Object.values(cs()).filter(c => c.starred).length;
  const p = Object.values(G.projects).length;
  document.getElementById('pp-star-sub').textContent = `${s} starred`;
  document.getElementById('pp-proj-sub').textContent = `${p} project${p !== 1 ? 's' : ''}`;
  updateUsageUI();
}

function editProfile() {
  openModal('epm');
  const nm = G.user?.displayName || G.user?.name || '';
  document.getElementById('epni').value = nm;
  setTimeout(() => document.getElementById('epni').focus(), 300);
}

function saveProfile() {
  const nm = document.getElementById('epni').value.trim();
  if (!nm) { showToast('Enter a name'); return; }
  if (G.user) { G.user.displayName = nm;
    G.user.name = nm; }
  sessionStorage.setItem('f24t-su', JSON.stringify(G.user || {}));
  ['unm', 'ppnm'].forEach(id => document.getElementById(id).textContent = nm);
  ['uav', 'ppav'].forEach(id => document.getElementById(id).childNodes[0].textContent = nm[0].toUpperCase());
  closeModal('epm');
  closeProfile();
  showToast('Profile updated!');
}

function exportChats() {
  if (G.isIncog) { showToast('Export tidak tersedia di mode Incognito', 'warning'); return; }
  const d = JSON.stringify({ chats: G.chats, projects: G.projects, exported: new Date().toISOString() }, null, 2);
  const b = new Blob([d], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'f24nt-ai-export.json';
  a.click();
  showToast('Exported!', 'success');
}

// ── CONTEXT MENU ──
function openCtx(e, id) {
  G.ctxId = id;
  const m = document.getElementById('ctx');
  m.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
  m.style.top = Math.min(e.clientY, window.innerHeight - 130) + 'px';
  m.classList.add('on');
  const s = cs()[id]?.starred;
  document.getElementById('ctx-star').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="${s ? 'var(--clay)' : 'none'}" stroke="${s ? 'var(--clay)' : 'currentColor'}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${s ? 'Unstar' : 'Star'}`;
  document.addEventListener('click', closeCtxOnce);
}

function closeCtxOnce() {
  document.getElementById('ctx').classList.remove('on');
  document.removeEventListener('click', closeCtxOnce);
}

function ctxStar() {
  const store = cs();
  if (!G.ctxId || !store[G.ctxId]) return;
  store[G.ctxId].starred = !store[G.ctxId].starred;
  if (!G.isIncog) save();
  renderHist();
  renderStarred();
  updateProfileStats();
  showToast(store[G.ctxId].starred ? 'Ditandai sebagai favorit' : 'Tanda favorit dihapus', store[G.ctxId].starred ? 'success' : 'info');
}

function ctxRename() {
  const store = cs();
  if (!G.ctxId || !store[G.ctxId]) return;
  const n = prompt('Rename:', store[G.ctxId].title);
  if (n && n.trim()) { store[G.ctxId].title = n.trim(); if (!G.isIncog) save();
    renderHist(); }
}

function ctxDel() {
  const store = cs();
  if (!G.ctxId || !store[G.ctxId]) return;
  if (G.activeChatId === G.ctxId) newChat();
  delete store[G.ctxId];
  if (!G.isIncog) save();
  renderHist();
  renderStarred();
  updateProfileStats();
  showToast('Percakapan dihapus', 'info');
}

// ── SHARE ──
function openShareModal() {
  const id = G.activeChatId || 'demo';
  document.getElementById('share-url').textContent = `https://f24nt.ai/share/${id.slice(0, 12)}`;
  openModal('share-modal');
}

function copyShareLink() {
  navigator.clipboard.writeText(document.getElementById('share-url').textContent)
    .then(() => showToast('Link copied!'));
}

// ── THEME ──
function applyTheme(t) {
  G.theme = t;
  const html = document.documentElement;
  const dk = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches);
  if (t === 'dark') html.setAttribute('data-theme', 'dark');
  else if (t === 'light') html.setAttribute('data-theme', 'light');
  else html.removeAttribute('data-theme');
  document.getElementById('hljs-light').disabled = dk;
  document.getElementById('hljs-dark').disabled = !dk;
  save();
}

function setTheme(t) { applyTheme(t);
  updateThemeUI();
  showToast({ auto: 'Tema otomatis', light: 'Tema terang', dark: 'Tema gelap' } [t], 'info'); }

function toggleTheme() { const ts = ['auto', 'light', 'dark'];
  setTheme(ts[(ts.indexOf(G.theme) + 1) % 3]); }

function updateThemeUI() {
  ['a', 'l', 'd'].forEach((k, i) => {
    const el = document.getElementById('th-' + k);
    if (el) el.classList.toggle('sel', G.theme === ['auto', 'light', 'dark'][i]);
  });
}

// ── SETTINGS ──
function toggleHL() { G.hlOn = !G.hlOn;
  updateHLToggle();
  showToast(G.hlOn ? 'Syntax highlighting aktif' : 'Syntax highlighting nonaktif', 'info');
  save(); }

function updateHLToggle() { const t = document.getElementById('hltog'); if (t) t.classList.toggle('on', G.hlOn); }

function confirmClear() { openModal('cm'); }

function clearAll() {
  if (G.isIncog) { G.incogChats = {}; } else { G.chats = {};
    save(); }
  G.activeChatId = null;
  renderHist();
  renderStarred();
  updateProfileStats();
  closeModal('cm');
  newChat();
  showToast(G.isIncog ? 'Riwayat incognito dibersihkan' : 'Semua percakapan dihapus', 'info');
}

// ── NEW CHAT ──
function newChat() {
  G.activeChatId = null;
  document.getElementById('wlc').style.display = '';
  const msgsEl = document.getElementById('msgs');
  msgsEl.style.display = 'none';
  msgsEl.innerHTML = '';
  const ta = document.getElementById('ita');
  ta.value = '';
  ta.style.height = 'auto';
  G.attachedFiles = [];
  const ap = document.getElementById('ap');
  ap.innerHTML = '';
  ap.classList.remove('show');
  document.querySelectorAll('.ci').forEach(el => el.classList.remove('act'));
  document.getElementById('share-btn').style.display = 'none';
  G.isBusy = false;
  updateSend();
  setNavAct('n-chats');
}

// ── INCOGNITO ──
function toggleIncog() {
  G.isIncog = !G.isIncog;
  const sb = document.getElementById('sb');
  const main = document.getElementById('main');
  const badge = document.getElementById('incog-badge');
  const tbPill = document.getElementById('incog-tb-pill');
  if (sb) sb.classList.toggle('incog', G.isIncog);
  if (main) main.classList.toggle('incog', G.isIncog);
  if (badge) badge.classList.toggle('on', G.isIncog);
  if (tbPill) tbPill.classList.toggle('on', G.isIncog);
  if (G.isIncog) {
    G._savedChatId = G.activeChatId;
    G.activeChatId = null;
    showToast('Mode Incognito aktif — riwayat tidak disimpan', 'info');
  } else {
    G.activeChatId = G._savedChatId || null;
    G._savedChatId = null;
    showToast('Mode Incognito nonaktif', 'info');
  }
  closePanel('p-star');
  closePanel('p-proj');
  closePanel('p-tools');
  closePanel('p-stg');
  if (G.activeChatId && cs()[G.activeChatId]) { loadChat(G.activeChatId); } else { newChat(); }
  renderHist();
  setNavAct(G.isIncog ? 'n-incog' : 'n-chats');
}

// ── NEKOPOI UNLOCK ──
function unlockNekopoi() {
  G.nekopoiClickCount++;
  if (G.nekopoiClickCount >= 5) {
    G.nekopoiUnlocked = true;
    G.nekopoiClickCount = 0;
    save();
    document.getElementById('nekopoi-tab-btn').style.display = '';
    showToast('NekoPoi Unlocked!', 'success');
  } else {
    showToast(`${5 - G.nekopoiClickCount} klik lagi untuk buka NekoPoi`, 'info');
  }
}

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === '5') {
    e.preventDefault();
    G.nekopoiUnlocked = true;
    save();
    document.getElementById('nekopoi-tab-btn').style.display = '';
    showToast('NekoPoi Unlocked!', 'success');
  }
  if (e.key === 'Escape') {
    closeModal('share-modal');
    closeModal('pm');
    closeModal('cm');
    closeModal('epm');
    closeModal('code-modal');
    closeModal('gokil-modal');
    closeModal('aicoder-modal');
    closeUpgrade();
    closeMDD();
    closeProfile();
    document.getElementById('ctx').classList.remove('on');
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
    e.preventDefault();
    var t = document.getElementById('ita');
    if (t) t.focus();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
    e.preventDefault();
    newChat();
  }
});

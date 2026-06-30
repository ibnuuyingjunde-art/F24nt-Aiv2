/**
 * app.js
 * -------------------------
 * Inisialisasi aplikasi,
 * state management,
 * storage, boot.
 */

// ── STATE ──
let G = {
  user: null,
  isSignup: false,
  isBusy: false,
  hlOn: true,
  searchOn: false,
  theme: 'auto',
  model: 'Claude Opus 4.5',
  modelEp: 'claude-opus-45',
  chats: {},
  projects: {},
  activeChatId: null,
  ctxId: null,
  attachedFiles: [],
  usage: 0,
  usageStart: 0,
  isAbyz: false,
  abyzUser: null,
  isGokil: false,
  isIncog: false,
  incogChats: {},
  _savedChatId: null,
  activeTool: null,
  gokilApis: [],
  aiName: 'F24nT ai',
  aiPersonality: 'helpful',
  sysPrompt: '',
  resetTimer: null,
  nekopoiClickCount: 0,
  nekopoiUnlocked: false,
  sessionId: 'f24nt-' + Date.now()
};

// ── STORAGE ──
function save() {
  try {
    localStorage.setItem('f24t-c', JSON.stringify(G.chats));
    localStorage.setItem('f24t-p', JSON.stringify(G.projects));
    localStorage.setItem('f24t-th', G.theme);
    localStorage.setItem('f24t-md', G.model);
    localStorage.setItem('f24t-ep', G.modelEp);
    localStorage.setItem('f24t-hl', String(G.hlOn));
    localStorage.setItem('f24t-u', String(G.usage));
    localStorage.setItem('f24t-us', String(G.usageStart));
    localStorage.setItem('f24t-abyz', G.isAbyz ? G.abyzUser : '');
    localStorage.setItem('f24t-gokil', G.isGokil ? '1' : '');
    localStorage.setItem('f24t-gset', JSON.stringify({ apis: G.gokilApis, name: G.aiName, pers: G.aiPersonality, sys: G.sysPrompt }));
    localStorage.setItem('f24t-nlock', String(G.nekopoiUnlocked));
  } catch (e) {}
}

function load() {
  try {
    G.chats = JSON.parse(localStorage.getItem('f24t-c') || '{}');
    G.projects = JSON.parse(localStorage.getItem('f24t-p') || '{}');
    G.theme = localStorage.getItem('f24t-th') || 'auto';
    G.model = localStorage.getItem('f24t-md') || 'Claude Opus 4.5';
    G.modelEp = localStorage.getItem('f24t-ep') || 'claude-opus-45';
    G.hlOn = localStorage.getItem('f24t-hl') !== 'false';
    G.usage = parseInt(localStorage.getItem('f24t-u') || '0') || 0;
    G.usageStart = parseInt(localStorage.getItem('f24t-us') || '0') || 0;
    const ab = localStorage.getItem('f24t-abyz') || '';
    if (ab) { G.isAbyz = true;
      G.abyzUser = ab; }
    G.isGokil = !!localStorage.getItem('f24t-gokil');
    if (G.isGokil) G.isAbyz = true;
    const gs = JSON.parse(localStorage.getItem('f24t-gset') || '{}');
    if (gs.apis) G.gokilApis = gs.apis;
    if (gs.name) G.aiName = gs.name;
    if (gs.pers) G.aiPersonality = gs.pers;
    if (gs.sys) G.sysPrompt = gs.sys;
    G.nekopoiUnlocked = localStorage.getItem('f24t-nlock') === 'true';
    if (G.usageStart && Date.now() - G.usageStart > RESET_MS) { G.usage = 0;
      G.usageStart = 0; }
  } catch (e) {}
}

// ── RATE LIMIT ──
function checkUsage() {
  if (G.isAbyz) return true;
  if (!G.usageStart) G.usageStart = Date.now();
  if (Date.now() - G.usageStart > RESET_MS) { G.usage = 0;
    G.usageStart = Date.now(); }
  if (G.usage >= MAX_USAGE) { showRateLimit(); return false; }
  return true;
}

function showRateLimit() {
  document.getElementById('rate-overlay').classList.add('on');
  const remaining = Math.max(0, RESET_MS - (Date.now() - G.usageStart));
  let secs = Math.ceil(remaining / 1000);
  const el = document.getElementById('ro-timer');
  clearInterval(G.resetTimer);
  G.resetTimer = setInterval(() => {
    secs--;
    const m = Math.floor(secs / 60),
      s = secs % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (secs <= 0) { clearInterval(G.resetTimer);
      G.usage = 0;
      G.usageStart = 0;
      save();
      closeRateLimit();
      showToast('Pesan sudah direset!'); }
  }, 1000);
}

function closeRateLimit() {
  document.getElementById('rate-overlay').classList.remove('on');
  clearInterval(G.resetTimer);
}

function updateUsageUI() {
  const $ = id => document.getElementById(id);
  if (G.isAbyz) {
    if ($('usage-txt')) $('usage-txt').textContent = '∞';
    if ($('usage-pill')) $('usage-pill').className = '';
    if ($('pp-usage')) $('pp-usage').textContent = 'Unlimited';
    if ($('pp-ubar')) $('pp-ubar').style.width = '0%';
    return;
  }
  const pct = Math.min(100, (G.usage / MAX_USAGE) * 100);
  if ($('usage-txt')) $('usage-txt').textContent = `${G.usage}/${MAX_USAGE}`;
  if ($('pp-usage')) $('pp-usage').textContent = `${G.usage} / ${MAX_USAGE}`;
  if ($('pp-ubar')) $('pp-ubar').style.width = pct + '%';
  if ($('usage-pill')) $('usage-pill').className = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : '';
}

// ── ABYZ UI ──
function applyAbyzUI() {
  const $ = id => document.getElementById(id);
  const badge = $('sb-abyz-badge');
  const upgradeCta = $('pp-upgrade-cta');
  const abyzInfo = $('pp-abyz-info');
  const ppplan = $('ppplan');
  const stgStatus = $('stg-abyz-status');
  const upgradeTopBtn = $('upgrade-topbtn');
  const resetNote = $('pp-reset-note');
  if (G.isAbyz) {
    const planName = G.isGokil ? 'Gokil Plan' : 'Abyz Plan';
    if (badge) { badge.style.display = 'inline-flex';
      badge.textContent = G.isGokil ? 'GOKIL' : 'ABYZ'; }
    if (upgradeCta) upgradeCta.style.display = 'none';
    if (abyzInfo) {
      abyzInfo.style.display = 'block';
      abyzInfo.innerHTML = `<div style="display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--abyz)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>${planName} aktif
      </div><div style="font-size:12px;color:rgb(var(--tx3));margin-top:4px">Akun: ${esc(G.abyzUser || '-')}</div>`;
    }
    if (ppplan) { ppplan.className = 'ppplan abyz';
      ppplan.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${planName}`; }
    if (stgStatus) stgStatus.textContent = `${planName} aktif`;
    if (upgradeTopBtn) upgradeTopBtn.style.display = 'none';
    if (resetNote) resetNote.textContent = 'Unlimited — tanpa batas pesan';
    document.querySelectorAll('.mo-lock').forEach(el => el.style.display = 'none');
    const gokilBtn = $('sb-gokil-btn');
    if (gokilBtn) gokilBtn.style.display = G.isGokil ? 'flex' : 'none';
  } else {
    if (badge) badge.style.display = 'none';
    if (upgradeCta) upgradeCta.style.display = '';
    if (abyzInfo) abyzInfo.style.display = 'none';
    if (ppplan) { ppplan.className = 'ppplan';
      ppplan.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Free Plan`; }
    if (stgStatus) stgStatus.textContent = 'Upgrade to Abyz Plan';
    if (upgradeTopBtn) upgradeTopBtn.style.display = '';
    if (resetNote) resetNote.textContent = 'Resets every 30 minutes';
    document.querySelectorAll('.mo-lock').forEach(el => el.style.display = '');
    const gokilBtn = $('sb-gokil-btn');
    if (gokilBtn) gokilBtn.style.display = 'none';
  }
  updateUsageUI();
}

// ── LOGIN ──
function onLogin(u) {
  const authEl = document.getElementById('auth');
  if (authEl) authEl.style.display = 'none';
  const app = document.getElementById('app');
  if (app) app.classList.add('on');
  const nm = u.displayName || u.name || u.email || 'Guest';
  const initial = nm[0].toUpperCase();
  ['unm', 'ppnm'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = nm; });
  ['uav', 'ppav'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    let tn = null;
    el.childNodes.forEach(n => { if (n.nodeType === 3 && !tn) tn = n; });
    if (tn) tn.textContent = initial;
    else el.prepend(document.createTextNode(initial));
  });
  const em = document.getElementById('ppem');
  if (em) em.textContent = u.email || 'Guest session';
  if (u.photoURL) {
    ['uav', 'ppav'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.backgroundImage = `url(${u.photoURL})`;
      el.style.backgroundSize = 'cover';
      el.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = ''; });
    });
  }
  applyAbyzUI();
  renderHist();
  updateThemeUI();
  updateHLToggle();
  updateUsageUI();
  updateProfileStats();
  document.querySelectorAll('.mo').forEach(el => {
    const isThis = el.dataset.m === G.model;
    el.classList.toggle('sel', isThis);
    const old = el.querySelector('.mochk');
    if (old) old.remove();
    if (isThis) {
      const chk = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chk.setAttribute('class', 'mochk');
      chk.setAttribute('width', '13');
      chk.setAttribute('height', '13');
      chk.setAttribute('viewBox', '0 0 24 24');
      chk.setAttribute('fill', 'none');
      chk.setAttribute('stroke', 'currentColor');
      chk.setAttribute('stroke-width', '2.5');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      p.setAttribute('points', '20 6 9 17 4 12');
      chk.appendChild(p);
      el.appendChild(chk);
    }
  });
  const mn = document.getElementById('mnm');
  if (mn) mn.textContent = G.model;
  updateModelUI();
}

function showAuth() {
  document.getElementById('auth').style.display = 'flex';
}

// ── MODEL DROPDOWN ──
function toggleMDD() {
  document.getElementById('mdd').classList.toggle('on');
  document.getElementById('mddov').classList.toggle('on');
}

function closeMDD() {
  document.getElementById('mdd').classList.remove('on');
  document.getElementById('mddov').classList.remove('on');
}

function selModel(el) {
  const isPro = el.dataset.pro === '1';
  if (isPro && !G.isAbyz) { openUpgrade();
    closeMDD();
    showToast('⚡ Model ini hanya untuk Abyz Plan!'); return; }
  document.querySelectorAll('.mo').forEach(m => { m.classList.remove('sel'); const c = m.querySelector('.mochk'); if (c) c.remove(); });
  el.classList.add('sel');
  const chk = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chk.setAttribute('class', 'mochk');
  chk.setAttribute('width', '13');
  chk.setAttribute('height', '13');
  chk.setAttribute('viewBox', '0 0 24 24');
  chk.setAttribute('fill', 'none');
  chk.setAttribute('stroke', 'currentColor');
  chk.setAttribute('stroke-width', '2.5');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  p.setAttribute('points', '20 6 9 17 4 12');
  chk.appendChild(p);
  el.appendChild(chk);
  G.model = el.dataset.m;
  G.modelEp = el.dataset.ep;
  document.getElementById('mnm').textContent = G.model;
  updateModelUI();
  closeMDD();
  save();
  showToast('Switched to ' + G.model);
}

function updateModelUI() {
  const isPro = document.querySelector(`.mo[data-m="${CSS.escape(G.model)}"]`)?.dataset.pro === '1';
  document.getElementById('mdot').className = isPro ? 'mdot pro-dot' : 'mdot';
  const moEl = document.querySelector(`.mo[data-m="${CSS.escape(G.model)}"]`);
  const dc = moEl?.querySelector('.modc')?.textContent || G.model;
  document.getElementById('stg-provider').textContent = dc;
}

// ── AI CODER ──
function openAiCoder() {
  document.getElementById('aicoder-result').style.display = 'none';
  document.getElementById('aicoder-result').innerHTML = '';
  document.getElementById('aicoder-status').style.display = 'none';
  openModal('aicoder-modal');
  setTimeout(() => document.getElementById('aicoder-prompt').focus(), 250);
}

async function runAiCoderV2() {
  const promptEl = document.getElementById('aicoder-prompt');
  const prompt = promptEl.value.trim();
  if (!prompt) { showToast('Tulis deskripsi proyek terlebih dahulu.', 'warning'); return; }
  const statusEl = document.getElementById('aicoder-status');
  const statusTxt = document.getElementById('aicoder-status-txt');
  const resultEl = document.getElementById('aicoder-result');
  const genBtn = document.getElementById('aicoder-gen-btn');
  resultEl.style.display = 'none';
  resultEl.innerHTML = '';
  statusEl.style.display = 'flex';
  statusTxt.textContent = 'Menghubungi AI Coder V2...';
  genBtn.disabled = true;
  genBtn.style.opacity = '.6';
  try {
    const url = `${API_ENDPOINTS.synox}/ai-coder?prompt=${encodeURIComponent(prompt)}&session=${G.sessionId}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const data = await r.json();
    if (data.status && data.result) {
      const files = data.result.files || [];
      if (files.length === 0) { throw new Error('Tidak ada file yang dihasilkan.'); }
      statusEl.style.display = 'none';
      resultEl.style.display = 'block';
      let filesHtml = files.map(f => `<div style="font-size:12.5px;font-family:monospace;color:rgb(var(--tx2));padding:4px 8px;border-bottom:1px solid rgba(var(--br1),.3)">📄 ${esc(f.path)}</div>`).join('');
      resultEl.innerHTML = `<div style="padding:12px 14px;border-radius:10px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:rgb(22,163,74);margin-bottom:6px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Selesai! ${files.length} file dibuat
        </div>
        <div style="font-size:12px;color:rgb(var(--tx3))">Session: ${G.sessionId}</div>
      </div>
      <div style="max-height:200px;overflow-y:auto;border:1px solid rgba(var(--br1),.6);border-radius:10px;background:rgba(var(--bg1),1);padding:4px 0;margin-bottom:10px">${filesHtml}</div>
      <button class="bprim" style="width:100%" onclick='showToast("Download ZIP - fitur ini sedang dalam pengembangan","info")'>Download ZIP</button>`;
      if (!G.activeChatId) { G.activeChatId = createChat(prompt);
        renderHist(); }
      const summary = `**AiCoder V2** menghasilkan ${files.length} file untuk: "${prompt}"\n\n${files.map(f => `- \`${f.path}\``).join('\n')}`;
      const wlc = document.getElementById('wlc');
      const msgsEl = document.getElementById('msgs');
      if (wlc) wlc.style.display = 'none';
      if (msgsEl) msgsEl.style.display = 'flex';
      renderAssist(summary, 'AI Coder V2');
      addToChat('assistant', summary, 'AI Coder V2');
    } else {
      throw new Error(data.message || 'Gagal generate code');
    }
  } catch (e) {
    statusEl.style.display = 'none';
    resultEl.style.display = 'block';
    resultEl.innerHTML = `<div style="padding:12px 14px;border-radius:10px;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.2);font-size:13px;color:rgb(220,38,38)">❌ ${esc(e.message || 'Terjadi error')}</div>`;
  } finally {
    genBtn.disabled = false;
    genBtn.style.opacity = '1';
  }
}

// ── GOKIL SETTINGS ──
const API_PROVIDERS = ['OpenAI', 'Gemini', 'Claude', 'Groq', 'Together', 'Mistral', 'Custom'];

function openGokilSettings() {
  if (!G.isGokil) { showToast('Fitur ini khusus untuk Gokil Plan', 'warning');
    openUpgrade(); return; }
  const nameInp = document.getElementById('ai-name-inp');
  if (nameInp) nameInp.value = G.aiName || '';
  const sysTa = document.getElementById('sys-prompt-ta');
  if (sysTa) sysTa.value = G.sysPrompt || '';
  const sysCount = document.getElementById('sys-prompt-count');
  if (sysCount) sysCount.textContent = `${(G.sysPrompt || '').length} / 1000`;
  document.querySelectorAll('.pers-opt').forEach(b => b.classList.toggle('sel', b.dataset.v === G.aiPersonality));
  const rows = document.getElementById('api-rows');
  if (rows) {
    rows.innerHTML = '';
    const apis = G.gokilApis && G.gokilApis.length ? G.gokilApis : [{ provider: 'OpenAI', key: '' }];
    apis.forEach(a => addApiRow(a.provider, a.key));
  }
  if (sysTa) sysTa.oninput = () => { if (sysCount) sysCount.textContent = `${sysTa.value.length} / 1000`; };
  const persOpts = document.getElementById('pers-opts');
  if (persOpts && !persOpts._wired) {
    persOpts._wired = true;
    persOpts.addEventListener('click', e => {
      const btn = e.target.closest('.pers-opt');
      if (!btn) return;
      document.querySelectorAll('.pers-opt').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
    });
  }
  openModal('gokil-modal');
}

function addApiRow(provider, key) {
  const rows = document.getElementById('api-rows');
  if (!rows) return;
  const row = document.createElement('div');
  row.className = 'api-row';
  const opts = API_PROVIDERS.map(p => `<option value="${p}"${p === (provider || 'OpenAI') ? ' selected' : ''}>${p}</option>`).join('');
  row.innerHTML = `<select>${opts}</select>
    <input type="text" placeholder="Masukkan API key…" value="${esc(key || '')}" autocomplete="off"/>
    <button class="api-del" onclick="this.closest('.api-row').remove()" title="Hapus">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  rows.appendChild(row);
}

function saveGokilSettings() {
  if (!G.isGokil) { showToast('Fitur ini khusus untuk Gokil Plan', 'warning'); return; }
  const apis = [];
  document.querySelectorAll('#api-rows .api-row').forEach(row => {
    const provider = row.querySelector('select')?.value || 'OpenAI';
    const key = row.querySelector('input')?.value.trim() || '';
    if (key) apis.push({ provider, key });
  });
  G.gokilApis = apis;
  const nameInp = document.getElementById('ai-name-inp');
  G.aiName = (nameInp?.value.trim()) || 'F24nT ai';
  const selPers = document.querySelector('.pers-opt.sel');
  G.aiPersonality = selPers?.dataset.v || 'helpful';
  const sysTa = document.getElementById('sys-prompt-ta');
  G.sysPrompt = (sysTa?.value.trim()) || '';
  save();
  closeModal('gokil-modal');
  showToast('Pengaturan Gokil berhasil disimpan', 'success');
  const mn = document.getElementById('mnm');
  if (mn && G.aiName) mn.textContent = G.model;
}

// ── MODAL BACKDROP CLICKS ──
['share-modal', 'pm', 'cm', 'epm', 'aicoder-modal'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('click', function(e) { if (e.target === el) closeModal(id); });
});
var um = document.getElementById('upgrade-modal');
if (um) um.addEventListener('click', function(e) { if (e.target === um) closeUpgrade(); });
var cm2 = document.getElementById('code-modal');
if (cm2) cm2.addEventListener('click', function(e) { if (e.target === cm2) closeModal('code-modal'); });

// ── ENTER KEY ──
(function() {
  var ta = document.getElementById('ita');
  if (ta) {
    ta.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        var btn = document.getElementById('send');
        if (btn && !btn.disabled) sendMsg();
      }
    });
  }
})();

// ── BOOT ──
window.addEventListener('DOMContentLoaded', () => {
  load();
  applyTheme(G.theme);
  const mn = document.getElementById('mnm');
  if (mn) mn.textContent = G.model;
  if (G.nekopoiUnlocked) {
    document.getElementById('nekopoi-tab-btn').style.display = '';
  }
  if (fbOk && auth) {
    auth.onAuthStateChanged(u => { if (u) { G.user = u;
        onLogin(u); } else showAuth(); });
  } else {
    const su = sessionStorage.getItem('f24t-su');
    if (su) { const u = JSON.parse(su);
      G.user = u;
      onLogin(u); } else showAuth();
  }
  setTimeout(() => {
    const ls = document.getElementById('ls');
    ls.classList.add('out');
    setTimeout(() => { ls.style.display = 'none'; }, 500);
  }, 1600);
});

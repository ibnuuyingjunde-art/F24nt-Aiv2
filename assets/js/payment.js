/**
 * payment.js
 * -------------------------
 * XentralPay integration, plans,
 * upgrade activation.
 */

// ── PLANS ──
const ABYZ_CREDS = [
  { user: 'admin', pass: 'F24nTAI2407', plan: 'abyz' },
  { user: 'yoe', pass: 'F24nTAIyoeN07', plan: 'abyz' }
];

const GOKIL_CREDS = [
  { user: 'admin', pass: 'F24nTAI2407', plan: 'gokil' },
  { user: 'yoe', pass: 'F24nTAIyoeN07', plan: 'gokil' }
];

let _activatingPlan = 'abyz';

// ── UPGRADE MODAL ──
function openUpgrade() {
  document.getElementById('upgrade-modal').classList.add('on');
}

function closeUpgrade() {
  document.getElementById('upgrade-modal').classList.remove('on');
}

function openCodeModal(plan) {
  _activatingPlan = plan || 'abyz';
  closeUpgrade();
  const t = document.getElementById('code-modal-title');
  const d = document.getElementById('code-modal-desc');
  const b = document.getElementById('code-activate-btn');
  if (_activatingPlan === 'gokil') {
    t.textContent = 'Aktifkan Gokil Plan';
    d.textContent = 'Masukkan username dan password yang diberikan admin untuk Gokil Plan.';
    b.textContent = 'Aktifkan';
    b.style.background = 'linear-gradient(135deg,rgb(245,158,11),rgb(234,88,12))';
  } else {
    t.textContent = 'Aktifkan Abyz Plan';
    d.textContent = 'Masukkan username dan password yang diberikan admin.';
    b.textContent = 'Aktifkan';
    b.style.background = '';
  }
  document.getElementById('abyz-user-inp').value = '';
  document.getElementById('abyz-pass-inp').value = '';
  document.getElementById('code-modal').classList.add('on');
  setTimeout(() => document.getElementById('abyz-user-inp').focus(), 200);
}

function activatePlan() {
  const uEl = document.getElementById('abyz-user-inp');
  const pEl = document.getElementById('abyz-pass-inp');
  if (!uEl || !pEl) return;
  const uname = uEl.value.trim().toLowerCase();
  const pass = pEl.value.trim();
  if (!uname || !pass) {
    showToast('Isi username dan password terlebih dahulu.', 'warning');
    return;
  }
  const creds = _activatingPlan === 'gokil' ? GOKIL_CREDS : ABYZ_CREDS;
  const match = creds.find(c => c.user === uname && c.pass === pass);
  if (!match) {
    showToast('Username atau password salah.', 'error');
    return;
  }
  G.isAbyz = true;
  G.abyzUser = uname;
  G.usage = 0;
  G.isGokil = _activatingPlan === 'gokil';
  localStorage.setItem('f24t-adm-username', uname);
  if (G.isGokil) localStorage.setItem('f24t-gokil', '1');
  else localStorage.removeItem('f24t-gokil');
  closeModal('code-modal');
  applyAbyzUI();
  showToast(`${G.isGokil ? 'Gokil' : 'Abyz'} Plan aktif! Selamat datang, ${uname}.`, 'success');
  save();
}

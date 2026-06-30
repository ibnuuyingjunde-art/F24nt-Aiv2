/**
 * firebase.js
 * -------------------------
 * Firebase Auth integration.
 * Login, logout, session management.
 */

let auth = null;
let fbOk = false;

// ── INIT FIREBASE ──
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  auth = firebase.auth();
  fbOk = true;
} catch (e) {
  console.warn('Firebase init failed, demo mode');
}

// ── AUTH FUNCTIONS ──
function loginGoogle() {
  if (fbOk && auth) {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(e => showToast(e.message, 'error'));
  } else {
    dLogin({ displayName: 'Google User', email: 'user@gmail.com' });
  }
}

function loginGithub() {
  if (fbOk && auth) {
    auth.signInWithPopup(new firebase.auth.GithubAuthProvider())
      .catch(e => showToast(e.message, 'error'));
  } else {
    dLogin({ displayName: 'GitHub User', email: 'user@github.com' });
  }
}

function loginGuest() {
  if (fbOk && auth) {
    auth.signInAnonymously().catch(e => showToast(e.message, 'error'));
  } else {
    dLogin({ displayName: 'Guest', email: null });
  }
}

function loginEmail() {
  const em = document.getElementById('ae').value.trim();
  const pw = document.getElementById('ap').value;
  if (!em || !pw) { setErr('Isi semua kolom.'); return; }
  setErr('');
  setSub(true);
  if (fbOk && auth) {
    if (G.isSignup) {
      auth.createUserWithEmailAndPassword(em, pw)
        .catch(e => { setErr(e.message); setSub(false); });
    } else {
      auth.signInWithEmailAndPassword(em, pw)
        .catch(e => { setErr(e.message); setSub(false); });
    }
  } else {
    setTimeout(() => {
      dLogin({ displayName: em.split('@')[0], email: em });
      setSub(false);
    }, 700);
  }
}

function dLogin(u) {
  G.user = u;
  sessionStorage.setItem('f24t-su', JSON.stringify(u));
  onLogin(u);
}

function doSignOut() {
  closeProfile();
  if (fbOk && auth) auth.signOut();
  sessionStorage.removeItem('f24t-su');
  location.reload();
}

// ── TOGGLE SIGNUP ──
function toggleMode() {
  G.isSignup = !G.isSignup;
  document.getElementById('ah').textContent = G.isSignup ? 'Create account' : 'Welcome back';
  document.getElementById('asub').textContent = G.isSignup ? 'Join F24nT ai today' : 'Sign in to continue';
  document.getElementById('atgt').textContent = G.isSignup ? 'Already have an account?' : "Don't have an account?";
  document.getElementById('atgl').textContent = G.isSignup ? ' Sign in' : ' Sign up';
  document.getElementById('asb').textContent = G.isSignup ? 'Create account' : 'Sign in';
  setErr('');
}

function setErr(m) {
  const e = document.getElementById('aerr');
  e.textContent = m;
  e.style.display = m ? 'block' : 'none';
}

function setSub(b) {
  const s = document.getElementById('asb');
  s.disabled = b;
  s.textContent = b ? 'Processing...' : (G.isSignup ? 'Create account' : 'Sign in');
}

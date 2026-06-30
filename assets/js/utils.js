/**
 * utils.js
 * -------------------------
 * Helper functions, formatter,
 * markdown helper, copy, esc, toast.
 */

// ── ESCAPE HTML ──
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── COPY TEXT ──
function copyTxt(t) {
  const text = String(t || '');
  if (!text) { showToast('Tidak ada teks untuk disalin', 'warning'); return; }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Teks berhasil disalin', 'success'))
      .catch(() => _execCopy(text));
  } else { _execCopy(text); }
}

function _execCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(ok ? 'Teks berhasil disalin' : 'Tekan Ctrl+C untuk menyalin', ok ? 'success' : 'info');
  } catch (_) { showToast('Tekan Ctrl+C untuk menyalin', 'info'); }
}

// ── SCROLL BOTTOM ──
function scrollBot() {
  const ca = document.getElementById('ca');
  setTimeout(() => { ca.scrollTop = ca.scrollHeight; }, 30);
}

// ── LOGO SVG ──
function logoSVG(sz) {
  return `<svg class="ma-logo" width="${sz}" height="${sz}" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="44" stroke="rgb(207,100,58)" stroke-width="7" stroke-linecap="round" stroke-dasharray="210 60" opacity=".9"/>
    <circle cx="50" cy="50" r="30" stroke="rgb(195,85,40)" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="140 38" opacity=".7"/>
    <circle cx="50" cy="50" r="16" stroke="rgb(207,100,58)" stroke-width="4" stroke-linecap="round" stroke-dasharray="78 18"/>
    <circle cx="50" cy="50" r="7" fill="rgb(207,100,58)" opacity=".85"/>
  </svg>`;
}

// ── MARKDOWN ──
function fmtMd(text) {
  const cbs = [];
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const i = cbs.length;
    cbs.push({ lang: lang || 'plaintext', code: code.trim() });
    return `\x00CB${i}\x00`;
  });
  let h = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  h = h.replace(/^---$/gm, '<hr>');
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/!\[(.*?)\]\((https?:\/\/[^\)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener"><img src="$2" alt="$1" style="max-width:100%;border-radius:12px;border:1px solid rgba(var(--br1),.5);margin:6px 0;display:block"/></a>');
  h = h.replace(/^[-*+] (.+)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul>${m}</ul>`);
  h = h.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  h = h.replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  h = h.replace(/\n\n+/g, '</p><p>');
  h = h.replace(/\n/g, '<br>');
  if (!h.match(/^<[hup]/)) h = `<p>${h}</p>`;
  h = h.replace(/\x00CB(\d+)\x00/g, (_, i) => {
    const { lang, code } = cbs[+i];
    const e = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="cb"><div class="cb-h"><span class="cb-l">${lang}</span>
      <button class="cb-c" onclick="this.classList.add('copied');copyTxt(${JSON.stringify(code)});setTimeout(()=>this.classList.remove('copied'),1500)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg> Copy
      </button></div>
      <pre><code class="language-${lang}">${e}</code></pre>
    </div>`;
  });
  return h;
}

// ── TOAST ──
const TOAST_ICONS = {
  success: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  warning: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

function showToast(msg, type = 'info', dur = 2800) {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const cleanMsg = String(msg).replace(/^[✅❌⚠️👍👎🎉🔥⚡💾📖🔍⭐]+\s*/, '').replace(/\s*[✅❌⚠️👍👎🎉🔥⚡💾📖🔍⭐]+$/, '');
  let t = type;
  if (msg.startsWith('✅') || msg.startsWith('👍')) t = 'success';
  else if (msg.startsWith('❌')) t = 'error';
  else if (msg.startsWith('⚠️')) t = 'warning';
  const item = document.createElement('div');
  item.className = 'toast-item';
  item.innerHTML = `<div class="toast-ic ${t}">${TOAST_ICONS[t] || TOAST_ICONS.info}</div>
    <span class="toast-msg">${esc(cleanMsg || msg)}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </span>`;
  wrap.appendChild(item);
  requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add('show')));
  const hide = () => { item.classList.add('out'); setTimeout(() => item.remove(), 280); };
  const tid = setTimeout(hide, dur);
  item.querySelector('.toast-close').addEventListener('click', () => { clearTimeout(tid); item.remove(); });
}

// ── TEXT TO FILE (10K+ chars) ──
function textToFile(text) {
  if (text.length <= 500) return text;
  const filename = `message_${Date.now()}.txt`;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  return `📄 **File:** ${filename}\n📥 [Download](${url})\n\n📝 **Preview:**\n${text.substring(0,500)}...\n\n*(File lengkap ${text.length} karakter. Klik download untuk melihat semua)*`;
}

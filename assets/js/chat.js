/**
 * chat.js
 * -------------------------
 * Mengatur seluruh logika chat:
 * kirim pesan, render, history, AI.
 */

// ── AI ENDPOINTS ──
const AI_ENDPOINTS = {
  'claude-opus-45': { path: '/claude-opus-4.5', param: 'pesan' },
  'claude-opus-46': { path: '/claude-opus-4.6', param: 'pesan' },
  'claude-opus-47': { path: '/claude-opus-4.7', param: 'pesan' },
  'claude-opus-48': { path: '/claude-opus-4.8', param: 'pesan' },
  'claude-sonnet-46': { path: '/claude-sonnet-4.6', param: 'pesan' },
  'deepseek-r1': { path: '/deepseek-r1', param: 'q' },
  'deepseek-v32-thinking': { path: '/deepseek-v3.2-thinking', param: 'pesan', extra: 'session=' },
  'deepseek-v4-flash': { path: '/deepseek-v4-flash', param: 'pesan', extra: 'session=' },
  'feelbetter-ai': { path: '/feelbetter-ai', param: 'pesan', extra: 'session=' },
  'grok-41': { path: '/x.ai-grok-4.1', param: 'pesan' },
  'unlimited-ai': { path: '/unlimited-ai', param: 'prompt', extra: 'session=user123' },
  'uncensored-ai': { path: '/uncensored-ai', param: 'pesan' },
  'turboseek-ai': { path: '/turboseek-ai', param: 'q' },
  'llama4-maverick': { path: '/llama4-maverick', param: 'pesan' },
  'llama4-scout': { path: '/llama-4-scout', param: 'pesan', extra: 'history=%5B%5D' },
  'gpt-55': { path: '/gpt-5.5', param: 'pesan' },
  'gemini-31-flash': { path: '/gemini-3.1-flash-lite-preview', param: 'pesan', extra: 'session=' },
  'ai-coder-v2': { path: '/ai-coder', param: 'prompt', extra: 'session=' }
};

// ── CALL SYNOX AI ──
async function callSynoxAI(endpointKey, query, sessionId) {
  const ep = AI_ENDPOINTS[endpointKey];
  if (!ep) return null;
  const param = ep.param || 'pesan';
  let extra = ep.extra || '';
  if (extra.includes('session=') && sessionId) {
    extra = extra.replace('session=', 'session=' + sessionId);
  }
  const url = `${API_ENDPOINTS.synox}${ep.path}?${param}=${encodeURIComponent(query)}${extra ? '&' + extra : ''}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch (e) {
      if (text && text.trim().length > 10 && !text.includes('<!DOCTYPE')) {
        return text.trim();
      }
      return null;
    }
    let answer = data.result?.reply || data.result?.answer || data.answer || data.response || data.message || data.text || data.data?.answer || data.data?.response || data.result || null;
    if (answer && typeof answer === 'string' && answer.trim()) {
      let result = answer;
      if (data.result?.related && data.result.related.length) {
        result += '\n\n💡 **Saran pertanyaan:**\n' + data.result.related.slice(0, 5).map((q, i) => `${i+1}. ${q}`).join('\n');
      }
      if (data.result?.references && data.result.references.length) {
        result += '\n\n📚 **Referensi:**\n' + data.result.references.slice(0, 5).map(ref => `- [${ref.name||ref.title}](${ref.url})`).join('\n');
      }
      return result;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ── CALL CMNTY AI ──
async function callCMNTY(endpoint, params) {
  try {
    const url = `${API_ENDPOINTS.cmnty}${endpoint}?${params}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (endpoint.includes('text2image') || endpoint.includes('ektp')) {
      const blob = await r.blob();
      return { image: URL.createObjectURL(blob) };
    } else {
      return await r.json();
    }
  } catch (e) {
    return { error: e.message };
  }
}

// ── CALL AI (MAIN) ──
async function callAI(prompt, epKey, sessionId) {
  if (prompt.length > 500) {
    prompt = textToFile(prompt);
  }

  // Tools
  if (G.activeTool) {
    if (G.activeTool === 'text2image') {
      const result = await callCMNTY('/ai/text2image', `prompt=${encodeURIComponent(prompt)}&style=photorealistic&resolution=1024x1024&aspectRatio=square&numImages=1`);
      if (result.image) return `🖼️ **Hasil Text2Image:**\n\n![Gambar](${result.image})\n\n📝 Prompt: ${prompt}`;
      return `❌ Gagal generate gambar: ${result.error}`;
    }
    if (G.activeTool === 'image2prompt') {
      const result = await callCMNTY('/ai/image2prompt', `url=${encodeURIComponent(prompt)}`);
      if (result.prompt || result.data) return `📝 **Hasil Image2Prompt:**\n\n${JSON.stringify(result, null, 2)}`;
      return `❌ Gagal memproses gambar: ${JSON.stringify(result)}`;
    }
    if (G.activeTool === 'ektp') {
      const params = prompt.split('&').filter(p => p.includes('=')).join('&');
      if (!params.includes('nama')) return '❌ Format E-KTP: provinsi=...&kota=...&nik=...&nama=...&ttl=...&alamat=...\nContoh: provinsi=JAWA+BARAT&kota=BANDUNG&nik=1234567890123456&nama=John+Doe&ttl=Bandung%2C+01-01-1990&alamat=Jl.+Contoh+No.+123';
      const result = await callCMNTY('/canvas/ektp', params);
      if (result.image) return `🆔 **Hasil E-KTP:**\n\n![E-KTP](${result.image})\n\nData berhasil diproses.`;
      return `❌ Gagal generate E-KTP: ${result.error}`;
    }
  }

  const synoxResult = await callSynoxAI(epKey, prompt, sessionId);
  if (synoxResult) return synoxResult;
  return '❌ Tidak ada respons dari AI. Coba pilih model lain.';
}

// ── SEND MESSAGE ──
async function sendMsg() {
  const ta = document.getElementById('ita');
  if (!ta) return;
  const txt = ta.value.trim();
  if (!txt || G.isBusy) return;
  if (!checkUsage()) return;

  const wlc = document.getElementById('wlc');
  const msgsEl = document.getElementById('msgs');
  const shareBtn = document.getElementById('share-btn');
  if (wlc) wlc.style.display = 'none';
  if (msgsEl) msgsEl.style.display = 'flex';

  if (!G.activeChatId) {
    G.activeChatId = createChat(txt || 'Chat');
    renderHist();
    if (shareBtn) shareBtn.style.display = 'flex';
  }

  renderUser(txt, true, null);
  addToChat('user', txt, '', null);

  ta.value = '';
  ta.style.height = 'auto';
  updateSend();

  if (G.activeChatId && cs()[G.activeChatId]) {
    const chat = cs()[G.activeChatId];
    if (chat.msgs.filter(m => m.role === 'user').length === 1) {
      chat.title = (txt || 'Chat').slice(0, 50);
      if (!G.isIncog) save();
      renderHist();
    }
  }

  G.isBusy = true;
  updateSend();
  showTyping();

  const ep = G.modelEp || 'claude-opus-45';
  const sessionId = G.activeChatId || G.sessionId;

  let response = '';
  try {
    response = await callAI(txt, ep, sessionId);
    if (!response || response.trim() === '') response = 'Tidak ada respons dari AI.';
  } catch (e) {
    response = `Error: ${e.message}`;
  }

  const tg = document.getElementById('typing-g');
  if (tg) tg.remove();

  renderAssist(response, G.model);
  addToChat('assistant', response, G.model);

  G.isBusy = false;
  if (!G.isAbyz) {
    G.usage++;
    if (!G.usageStart) G.usageStart = Date.now();
    if (G.usage === 80) showToast('20 pesan tersisa. Upgrade untuk unlimited.', 'warning');
  }
  save();
  updateUsageUI();
  updateSend();
  clearTool();
}

// ── RENDER FUNCTIONS ──
function renderUser(txt, animate = true, images = null) {
  const msgsEl = document.getElementById('msgs');
  const g = document.createElement('div');
  g.className = 'mg';
  if (!animate) g.style.animation = 'none';
  let imgHtml = '';
  if (images && images.length) {
    imgHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-bottom:6px">
      ${images.map(im => {
        const src = typeof im === 'string' ? im : (im.dataUrl || '');
        return `<img src="${src}" alt="" style="max-width:160px;max-height:160px;border-radius:12px;object-fit:cover;border:1px solid rgba(var(--br1),.5)"/>`;
      }).join('')}
    </div>`;
  }
  g.innerHTML = `<div class="mu">${imgHtml}${txt ? `<div class="mu-b">${esc(txt)}</div>` : ''}</div>
    <div class="mu-ac">
      <button class="ab" onclick="copyTxt(${JSON.stringify(txt)})">
        <span class="abt">Copy</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>`;
  msgsEl.appendChild(g);
  scrollBot();
}

function renderAssist(txt, src = '', animate = true) {
  const msgsEl = document.getElementById('msgs');
  if (!msgsEl) return;
  const safeText = txt && txt.trim() ? txt : 'Tidak ada respons dari AI.';
  const g = document.createElement('div');
  g.className = 'mg';
  if (!animate) g.style.animation = 'none';
  g.innerHTML = `<div class="ma">
    <div class="ma-hd">${logoSVG(22)}<span class="ma-nm">F24nT ai</span>${src ? `<span class="ma-src">${esc(src)}</span>` : ''}</div>
    <div class="ma-ct" style="color:rgb(var(--tx1))">${fmtMd(safeText)}</div>
    <div class="ma-ac">
      <button class="ab" onclick="_cpAssist(this)"><span class="abt">Copy</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button class="ab" onclick="regenLast()"><span class="abt">Retry</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.35"/>
        </svg>
      </button>
      <button class="ab" onclick="thumbUp(this)"><span class="abt">Good</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
      </button>
      <button class="ab" onclick="thumbDown(this)"><span class="abt">Bad</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
        </svg>
      </button>
      <button class="ab" onclick="starCurrent()"><span class="abt">Star</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    </div>
  </div>`;
  msgsEl.appendChild(g);
  if (G.hlOn) g.querySelectorAll('pre code').forEach(b => { try { hljs.highlightElement(b); } catch (_) {} });
  scrollBot();
}

function _cpAssist(btn) {
  const ct = btn.closest('.mg')?.querySelector('.ma-ct');
  if (ct) copyTxt(ct.innerText || ct.textContent || '');
}

function showTyping() {
  const msgsEl = document.getElementById('msgs');
  const g = document.createElement('div');
  g.className = 'mg';
  g.id = 'typing-g';
  g.innerHTML = `<div class="ma">
    <div class="ma-hd">${logoSVG(22)}<span class="ma-nm">F24nT ai</span><span class="ma-src">${G.model}</span></div>
    <div class="tw">
      <svg class="t-svg" viewBox="0 0 32 32" fill="none">
        <g class="tr1"><circle cx="16" cy="16" r="14" stroke="rgb(207,100,58)" stroke-width="2" stroke-linecap="round" stroke-dasharray="56 32" opacity=".9"/></g>
        <g class="tr2"><circle cx="16" cy="16" r="10" stroke="rgb(195,85,40)" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="36 27" opacity=".7"/></g>
        <g class="tr3"><circle cx="16" cy="16" r="6" stroke="rgb(207,100,58)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="18 20" opacity=".85"/></g>
        <circle class="tcore" cx="16" cy="16" r="3" fill="rgb(207,100,58)" opacity=".8"/>
      </svg>
      <span class="tlbl">Mengetik...</span>
    </div>
  </div>`;
  msgsEl.appendChild(g);
  scrollBot();
}

function regenLast() {
  if (G.isBusy || !G.activeChatId) return;
  const msgs = document.getElementById('msgs');
  const last = msgs.querySelector('.mg:last-child .ma');
  if (last) {
    msgs.querySelector('.mg:last-child').remove();
    if (cs()[G.activeChatId]) cs()[G.activeChatId].msgs.pop();
  }
  const lastUser = msgs.querySelector('.mg:last-child .mu-b');
  if (lastUser) {
    G.isBusy = true;
    updateSend();
    showTyping();
    const sessionId = G.activeChatId || G.sessionId;
    callAI(lastUser.textContent, G.modelEp || 'claude-opus-45', sessionId).then(resp => {
      const tg = document.getElementById('typing-g');
      if (tg) tg.remove();
      renderAssist(resp, G.model);
      addToChat('assistant', resp, G.model);
      G.isBusy = false;
      updateSend();
    });
  }
}

function thumbUp(btn) {
  btn.querySelector('svg').setAttribute('fill', 'currentColor');
  btn.style.color = 'rgb(34,197,94)';
  showToast('Respons bagus, terima kasih!', 'success');
}

function thumbDown(btn) {
  btn.querySelector('svg').setAttribute('fill', 'currentColor');
  btn.style.color = 'rgb(239,68,68)';
  showToast('Feedback diterima, terima kasih!', 'info');
}

function starCurrent() {
  if (G.activeChatId && cs()[G.activeChatId]) {
    G.ctxId = G.activeChatId;
    ctxStar();
  }
}

// ── INPUT FUNCTIONS ──
function onInput(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 280) + 'px';
  updateSend();
}

function updateSend() {
  const ta = document.getElementById('ita');
  const hasText = ta && ta.value.trim();
  document.getElementById('send').disabled = (!hasText) || G.isBusy;
}

function insertCode() {
  const ta = document.getElementById('ita');
  const s = ta.selectionStart,
    en = ta.selectionEnd;
  const sel = ta.value.substring(s, en);
  ta.value = ta.value.substring(0, s) + '```\n' + (sel || '// your code here') + '\n```' + ta.value.substring(en);
  onInput(ta);
  ta.focus();
}

function toggleSearch() {
  G.searchOn = !G.searchOn;
  document.getElementById('srch-btn').classList.toggle('active-t', G.searchOn);
  showToast(G.searchOn ? 'Mode pencarian aktif' : 'Mode pencarian nonaktif', 'info');
}

function usePill(btn) {
  const ta = document.getElementById('ita');
  ta.value = btn.textContent.trim();
  onInput(ta);
  ta.focus();
}

function useTool(tool) {
  G.activeTool = tool;
  const banner = document.getElementById('tools-active-banner');
  if (banner) {
    banner.style.display = 'block';
    const names = { text2image: 'Text2Image - Generate gambar dari teks', image2prompt: 'Image2Prompt - Upload gambar → prompt', ektp: 'E-KTP Generator' };
    banner.innerHTML = `<strong>${names[tool] || tool}</strong> aktif — Kirim prompt/url di chat <button onclick="clearTool()" style="margin-left:6px;color:var(--clay);font-weight:600;text-decoration:underline;background:none;border:none;cursor:pointer;font-size:inherit">Batal</button>`;
  }
  const ta = document.getElementById('ita');
  if (ta) {
    const ph = { text2image: 'Tulis deskripsi gambar... (contoh: photorealistic futuristic city)', image2prompt: 'Masukkan URL gambar...', ektp: 'Masukkan data: provinsi=...&kota=...&nama=...' };
    ta.placeholder = ph[tool] || 'Message...';
    ta.focus();
  }
  showToast(`${names[tool] || tool} aktif`, 'info');
}

function clearTool() {
  G.activeTool = null;
  const banner = document.getElementById('tools-active-banner');
  if (banner) banner.style.display = 'none';
  const ta = document.getElementById('ita');
  if (ta) ta.placeholder = 'Message F24nT ai…';
}

// ─────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────
let currentMode    = "single";   // "single" | "conversation"
let currentTurn    = 1;          // 1 | 2  (conversation mode)
let isListening    = false;
let autoPlayTimer  = null;
let autoSwitchTimer = null;
let turnStopped = false;

// Single mode state
let singleTranslated = "";
let singleLang       = "hi";
let singleHistory    = [];

// Conversation mode state
let convoTranslated  = "";
let convoMessages    = [];

// ─────────────────────────────────────────
// DOM
// ─────────────────────────────────────────
const statusPill   = document.getElementById("statusPill");
const statusText   = document.getElementById("statusText");

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────
function setStatus(state, text) {
  statusPill.className = "status-pill " + state;
  statusText.textContent = text;
}

function showShimmer(el) {
  el.innerHTML = '<div class="shimmer"></div>';
  el.classList.remove("filled");
}

function escapeHTML(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function getLangName(code) {
  const sel = document.getElementById("targetLangSingle");
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === code) return sel.options[i].text;
  }
  return code;
}

function getLangNameFrom(selectId, code) {
  const sel = document.getElementById(selectId);
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === code) return sel.options[i].text;
  }
  return code;
}

// ─────────────────────────────────────────
// MODE SWITCHING
// ─────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("btnSingle").classList.toggle("active", mode === "single");
  document.getElementById("btnConvo").classList.toggle("active",  mode === "conversation");
  document.getElementById("singleMode").style.display = mode === "single"       ? "block" : "none";
  document.getElementById("convoMode").style.display  = mode === "conversation" ? "block" : "none";
  setStatus("", "Ready");
}

// ─────────────────────────────────────────
// ══════════ SINGLE MODE ══════════
// ─────────────────────────────────────────
async function startSingle() {
  if (isListening) return;
  isListening = true;
  singleTranslated = "";

  const micBtn          = document.getElementById("micBtnSingle");
  const micHint         = document.getElementById("micHintSingle");
  const originalText    = document.getElementById("originalTextSingle");
  const translatedText  = document.getElementById("translatedTextSingle");
  const speakBtn        = document.getElementById("speakBtnSingle");
  const panelOriginal   = document.getElementById("panelOriginalSingle");
  const panelTranslated = document.getElementById("panelTranslatedSingle");
  const detectedLang    = document.getElementById("detectedLangSingle");

  micBtn.classList.add("listening");
  micHint.textContent = "Listening...";
  setStatus("listening", "Listening");
  speakBtn.disabled = true;
  panelOriginal.classList.add("active");
  panelTranslated.classList.remove("active");
  showShimmer(originalText);
  translatedText.textContent = "Translation will appear here...";
  translatedText.classList.remove("filled");
  detectedLang.textContent = "—";

  try {
    const res  = await fetch("/start", { method: "POST" });
    const data = await res.json();

    if (!data.success) { showError(data.error, "single"); return; }

    originalText.textContent = data.text;
    originalText.classList.add("filled");
    detectedLang.textContent = "Detected";
    panelOriginal.classList.remove("active");

    await translateSingle(data.text);
  } catch (e) {
    showError("Network error. Is Flask running?", "single");
  } finally {
    isListening = false;
    micBtn.classList.remove("listening");
    micHint.textContent = "Tap to speak";
  }
}

async function translateSingle(text) {
  singleLang = document.getElementById("targetLangSingle").value;
  const translatedText  = document.getElementById("translatedTextSingle");
  const panelTranslated = document.getElementById("panelTranslatedSingle");
  const speakBtn        = document.getElementById("speakBtnSingle");

  setStatus("processing", "Translating");
  panelTranslated.classList.add("active");
  showShimmer(translatedText);

  try {
    const res  = await fetch("/translate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ text, target_lang: singleLang })
    });
    const data = await res.json();

    if (!data.success) { showError(data.error, "single"); return; }

    singleTranslated = data.translated;
    translatedText.textContent = singleTranslated;
    translatedText.classList.add("filled");
    panelTranslated.classList.remove("active");
    speakBtn.disabled = false;
    setStatus("done", "Done");

    addSingleHistory(text, singleTranslated, singleLang);
    await speakSingle();
  } catch (e) {
    showError("Translation failed.", "single");
  }
}

async function speakSingle() {
  if (!singleTranslated) return;
  const speakBtn   = document.getElementById("speakBtnSingle");
  const audioEl    = document.getElementById("audioSingle");

  speakBtn.classList.add("playing");
  speakBtn.disabled = true;
  setStatus("processing", "Generating Audio");

  try {
    const res = await fetch("/speak", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ text: singleTranslated, lang: singleLang })
    });
    if (!res.ok) { showError("Audio failed.", "single"); speakBtn.classList.remove("playing"); speakBtn.disabled=false; return; }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    audioEl.src = url;
    audioEl.onended = () => { speakBtn.classList.remove("playing"); speakBtn.disabled=false; setStatus("done","Done"); URL.revokeObjectURL(url); };
    audioEl.onerror = () => { showError("Playback failed.", "single"); speakBtn.classList.remove("playing"); speakBtn.disabled=false; };
    audioEl.play();
    setStatus("done", "Playing");
  } catch (e) {
    showError("Audio request failed.", "single");
    speakBtn.classList.remove("playing"); speakBtn.disabled=false;
  }
}

function addSingleHistory(original, translated, lang) {
  const langName = getLangNameFrom("targetLangSingle", lang);
  const now      = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  singleHistory.unshift({ original, translated, langName, time: now });
  const section  = document.getElementById("historySingle");
  section.style.display = "flex";
  const list = document.getElementById("historyListSingle");
  list.innerHTML = "";
  singleHistory.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<div class="h-original">${escapeHTML(item.original)}</div><div class="h-translated">${escapeHTML(item.translated)}</div><div class="h-meta">${item.langName} · ${item.time}</div>`;
    list.appendChild(div);
  });
}

function clearHistory(mode) {
  if (mode === "single") {
    singleHistory = [];
    document.getElementById("historySingle").style.display = "none";
    document.getElementById("historyListSingle").innerHTML = "";
  }
}

// ─────────────────────────────────────────
// ══════════ CONVERSATION MODE ══════════
// ─────────────────────────────────────────

function getConvoLangs() {
  return {
    lang1: document.getElementById("langUser1").value,
    lang2: document.getElementById("langUser2").value,
    name1: getLangNameFrom("langUser1", document.getElementById("langUser1").value),
    name2: getLangNameFrom("langUser2", document.getElementById("langUser2").value),
  };
}

function updateTurnUI(autoStart = false) {
  cancelAutoPlay();
  cancelAutoSwitch();
  const { name1, name2 } = getConvoLangs();
  const indicator  = document.getElementById("turnIndicator");
  const avatar     = document.getElementById("turnAvatar");
  const label      = document.getElementById("turnLabel");
  const sublabel   = document.getElementById("turnSublabel");
  const card       = document.getElementById("convoCard");
  const switchBtn  = document.getElementById("switchTurnBtn");
  const micHint    = document.getElementById("micHintConvo");

  if (currentTurn === 1) {
    indicator.className = "turn-indicator user1";
    avatar.textContent  = "1";
    label.textContent   = "USER 1'S TURN";
    sublabel.textContent = `Speak in ${name1} → Translated to ${name2}`;
    card.className      = "main-card convo-card user1-active";
    switchBtn.textContent = "";
    switchBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" fill="none"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Switch to User 2's Turn`;
    switchBtn.className = "switch-turn-btn";
  } else {
    indicator.className = "turn-indicator user2";
    avatar.textContent  = "2";
    label.textContent   = "USER 2'S TURN";
    sublabel.textContent = `Speak in ${name2} → Translated to ${name1}`;
    card.className      = "main-card convo-card user2-active";
    switchBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" fill="none"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Switch to User 1's Turn`;
    switchBtn.className = "switch-turn-btn user2-next";
  }

  micHint.textContent = "Tap to speak";

  // Reset panels
  const originalText   = document.getElementById("originalTextConvo");
  const translatedText = document.getElementById("translatedTextConvo");
  const speakBtn       = document.getElementById("speakBtnConvo");
  originalText.textContent   = "Waiting for speech...";
  translatedText.textContent = "Translation will appear here...";
  originalText.classList.remove("filled");
  translatedText.classList.remove("filled");
  speakBtn.disabled = true;
  convoTranslated   = "";
  setStatus("", "Ready");

  // If this UI update was caused by a turn change, auto-start the convo mic
  if (autoStart && currentMode === "conversation" && !turnStopped) {
    // small delay so the UI state settles before starting
    setTimeout(() => { if (!isListening) startConvo(); }, 200);
  }
}

function cancelAutoPlay() {
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function cancelAutoSwitch() {
  if (autoSwitchTimer) {
    clearTimeout(autoSwitchTimer);
    autoSwitchTimer = null;
  }
}

function scheduleAutoPlay() {
  cancelAutoPlay();
  if (currentMode !== "conversation") return;

  const micHint = document.getElementById("micHintConvo");
  micHint.textContent = "Auto-playing in 5 seconds...";

  autoPlayTimer = setTimeout(() => {
    autoPlayTimer = null;
    if (currentMode !== "conversation") return;
    speakConvo();
  }, 5000);
}

function scheduleAutoSwitch() {
  cancelAutoSwitch();
  if (currentMode !== "conversation") return;

  const micHint = document.getElementById("micHintConvo");
  const switchBtn = document.getElementById("switchTurnBtn");
  micHint.textContent = "Switching turn in 5 seconds...";
  switchBtn.disabled = true;

  autoSwitchTimer = setTimeout(() => {
    autoSwitchTimer = null;
    if (currentMode !== "conversation") return;
    currentTurn = currentTurn === 1 ? 2 : 1;
    updateTurnUI(true);
    setStatus("done", "Turn switched");
  }, 5000);
}

function switchTurn() {
  cancelAutoPlay();
  cancelAutoSwitch();
  currentTurn = currentTurn === 1 ? 2 : 1;
  // switching turn should clear user-initiated stop so auto-start works
  turnStopped = false;
  updateTurnUI(true);
  document.getElementById("switchTurnBtn").disabled = true;
}

async function startConvo() {
  if (isListening) return;
  // user is actively starting convo — clear any previous stop request
  turnStopped = false;
  cancelAutoSwitch();
  isListening = true;
  convoTranslated = "";

  const micBtn          = document.getElementById("micBtnConvo");
  const micHint         = document.getElementById("micHintConvo");
  const originalText    = document.getElementById("originalTextConvo");
  const translatedText  = document.getElementById("translatedTextConvo");
  const speakBtn        = document.getElementById("speakBtnConvo");
  const panelOriginal   = document.getElementById("panelOriginalConvo");
  const panelTranslated = document.getElementById("panelTranslatedConvo");
  const badge           = document.getElementById("convoOriginalBadge");
  const { lang1, lang2, name1, name2 } = getConvoLangs();

  // Who is speaking and to whom
  const speakLang    = currentTurn === 1 ? lang1 : lang2;
  const speakName    = currentTurn === 1 ? name1 : name2;
  const translateTo  = currentTurn === 1 ? lang2 : lang1;

  micBtn.classList.add("listening");
  micHint.textContent = "Listening...";
  setStatus("listening", "Listening");
  speakBtn.disabled = true;
  panelOriginal.classList.add("active");
  panelTranslated.classList.remove("active");
  showShimmer(originalText);
  translatedText.textContent = "Translation will appear here...";
  translatedText.classList.remove("filled");
  badge.textContent = speakName;

  try {
    const res  = await fetch("/start", { method: "POST" });
    const data = await res.json();

    if (!data.success) { showError(data.error, "convo"); return; }

    originalText.textContent = data.text;
    originalText.classList.add("filled");
    panelOriginal.classList.remove("active");

    await translateConvo(data.text, translateTo, speakLang);
  } catch (e) {
    showError("Network error. Is Flask running?", "convo");
  } finally {
    isListening = false;
    micBtn.classList.remove("listening");
    micHint.textContent = "Tap to speak";
  }
}

async function translateConvo(text, translateTo, speakLang) {
  const translatedText  = document.getElementById("translatedTextConvo");
  const panelTranslated = document.getElementById("panelTranslatedConvo");
  const speakBtn        = document.getElementById("speakBtnConvo");
  const switchBtn       = document.getElementById("switchTurnBtn");

  setStatus("processing", "Translating");
  panelTranslated.classList.add("active");
  showShimmer(translatedText);

  try {
    const res  = await fetch("/translate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ text, target_lang: translateTo })
    });
    const data = await res.json();

    if (!data.success) { showError(data.error, "convo"); return; }

    convoTranslated = data.translated;
    translatedText.textContent = convoTranslated;
    translatedText.classList.add("filled");
    panelTranslated.classList.remove("active");
    speakBtn.disabled = false;
    switchBtn.disabled = false;
    setStatus("done", "Done");

    addConvoMessage(text, convoTranslated, translateTo, currentTurn);
    scheduleAutoPlay();
  } catch (e) {
    showError("Translation failed.", "convo");
  }
}

async function speakConvo() {
  if (!convoTranslated) return;
  cancelAutoPlay();
  const { lang1, lang2 } = getConvoLangs();
  const targetLang = currentTurn === 1 ? lang2 : lang1;
  const speakBtn   = document.getElementById("speakBtnConvo");
  const audioEl    = document.getElementById("audioConvo");

  speakBtn.classList.add("playing");
  speakBtn.disabled = true;
  setStatus("processing", "Generating Audio");

  try {
    const res = await fetch("/speak", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ text: convoTranslated, lang: targetLang })
    });
    if (!res.ok) { showError("Audio failed.", "convo"); speakBtn.classList.remove("playing"); speakBtn.disabled=false; return; }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    audioEl.src = url;
    audioEl.onended = () => {
      speakBtn.classList.remove("playing");
      speakBtn.disabled = false;
      setStatus("done","Done");
      URL.revokeObjectURL(url);
      scheduleAutoSwitch();
    };
    audioEl.onerror = () => { showError("Playback failed.", "convo"); speakBtn.classList.remove("playing"); speakBtn.disabled=false; };
    audioEl.play();
    setStatus("done", "Playing");
  } catch (e) {
    showError("Audio request failed.", "convo");
    speakBtn.classList.remove("playing"); speakBtn.disabled=false;
  }
}

function addConvoMessage(original, translated, toLang, turn) {
  const { name1, name2 } = getConvoLangs();
  const now   = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  const toLangName = getLangNameFrom(turn === 1 ? "langUser2" : "langUser1", toLang);

  convoMessages.push({ original, translated, toLangName, turn, time: now });

  const chatLog  = document.getElementById("chatLog");
  const messages = document.getElementById("chatMessages");
  chatLog.style.display = "flex";

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble user${turn}-bubble`;
  bubble.innerHTML = `
    <div class="bubble-meta">
      <span class="bubble-user-tag user${turn}-tag">User ${turn}</span>
      <span>${now}</span>
    </div>
    <div class="bubble-original">${escapeHTML(original)}</div>
    <div class="bubble-translated">${escapeHTML(translated)}</div>
    <div class="bubble-meta">→ ${toLangName}</div>
  `;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

function clearConvo() {
  convoMessages = [];
  document.getElementById("chatLog").style.display = "none";
  document.getElementById("chatMessages").innerHTML = "";
}

function stopTurnProcess() {
  // Prevent auto behaviors
  turnStopped = true;

  // Cancel timers
  cancelAutoPlay();
  cancelAutoSwitch();

  // Stop any playback
  try {
    const audioConvo = document.getElementById("audioConvo");
    if (audioConvo) { audioConvo.pause(); audioConvo.src = ""; }
    const audioSingle = document.getElementById("audioSingle");
    if (audioSingle) { audioSingle.pause(); audioSingle.src = ""; }
  } catch (e) {}

  // Reset UI and flags
  isListening = false;
  setStatus("", "Stopped");
  document.getElementById("micHintConvo").textContent = "Stopped";
  document.getElementById("micHintSingle").textContent = "Stopped";
  document.getElementById("micBtnConvo").classList.remove("listening");
  document.getElementById("micBtnSingle").classList.remove("listening");
  document.getElementById("speakBtnConvo").classList.remove("playing");
  document.getElementById("speakBtnSingle").classList.remove("playing");
}

// ─────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────
function showError(message, mode) {
  setStatus("error", "Error");
  isListening = false;

  if (mode === "single") {
    document.getElementById("micBtnSingle").classList.remove("listening");
    document.getElementById("micHintSingle").textContent = "Tap to try again";
    const el = document.getElementById("originalTextSingle");
    el.textContent = "⚠ " + message;
    el.classList.add("filled");
  } else {
    cancelAutoPlay();
    cancelAutoSwitch();
    document.getElementById("micBtnConvo").classList.remove("listening");
    document.getElementById("micHintConvo").textContent = "Tap to try again";
    const el = document.getElementById("originalTextConvo");
    el.textContent = "⚠ " + message;
    el.classList.add("filled");
  }

  setTimeout(() => {
    setStatus("", "Ready");
    if (mode === "single") document.getElementById("micHintSingle").textContent = "Tap to speak";
    else                   document.getElementById("micHintConvo").textContent  = "Tap to speak";
  }, 4000);
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  setStatus("processing", "Calibrating");
  document.getElementById("micBtnSingle").style.pointerEvents = "none";
  document.getElementById("micBtnConvo").style.pointerEvents  = "none";
  document.getElementById("micHintSingle").textContent = "Calibrating mic...";
  document.getElementById("micHintConvo").textContent  = "Calibrating mic...";

  try {
    const res  = await fetch("/calibrate", { method: "POST" });
    const data = await res.json();
    setStatus(data.success ? "done" : "error", data.success ? "Ready" : "Mic Error");
  } catch {
    setStatus("error", "Server Offline");
  } finally {
    document.getElementById("micBtnSingle").style.pointerEvents = "auto";
    document.getElementById("micBtnConvo").style.pointerEvents  = "auto";
    document.getElementById("micHintSingle").textContent = "Tap to speak";
    document.getElementById("micHintConvo").textContent  = "Tap to speak";
  }

  // Init conversation turn UI
  updateTurnUI();

  // Update turn label when language dropdowns change
  document.getElementById("langUser1").addEventListener("change", () => updateTurnUI(false));
  document.getElementById("langUser2").addEventListener("change", () => updateTurnUI(false));
});
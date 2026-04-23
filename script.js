/**
 * CyberShield FAQ Bot - Frontend
 * Communicates with Flask backend for FAQ logic
 */

// const API_BASE = 'http://127.0.0.1:5000/api';  // Local development
const API_BASE = 'https://cybershield-faq-bot.onrender.com/api';  // Production (Render)

// ============================================================================
// API FUNCTIONS (connects to Flask backend)
// ============================================================================

async function fetchHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.sessions || [];
  } catch (error) {
    console.warn('Could not fetch history from API:', error);
    return [];
  }
}

async function fetchSession(sessionId) {
  try {
    const response = await fetch(`${API_BASE}/history/${sessionId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.session || null;
  } catch (error) {
    console.warn('Could not fetch session:', error);
    return null;
  }
}

async function deleteSessionAPI(sessionId) {
  try {
    const response = await fetch(`${API_BASE}/history/${sessionId}`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.warn('Could not delete session:', error);
    return false;
  }
}

async function clearHistoryAPI() {
  try {
    const response = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.warn('Could not clear history:', error);
    return false;
  }
}

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const chatMessages = document.querySelector("#chatMessages");
const chatForm = document.querySelector("#chatForm");
const userInput = document.querySelector("#userInput");
const messageTemplate = document.querySelector("#messageTemplate");
const promptButtons = document.querySelectorAll("[data-prompt]");
const appShell = document.querySelector(".app-shell");
const workspace = document.querySelector(".workspace");
const sidebarToggle = document.querySelector("#sidebarToggle");
const newChatButton = document.querySelector("#newChatButton");
const mobileMenuButton = document.querySelector("#mobileMenuButton");
const sidebarOverlay = document.querySelector("#sidebarOverlay");
const appSkeleton = document.querySelector("#appSkeleton");
const chatHistory = document.querySelector("#chatHistory");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const confirmModal = document.querySelector("#confirmModal");
const confirmModalBackdrop = document.querySelector("#confirmModalBackdrop");
const confirmModalTitle = document.querySelector("#confirmModalTitle");
const confirmModalMessage = document.querySelector("#confirmModalMessage");
const confirmModalCancel = document.querySelector("#confirmModalCancel");
const confirmModalConfirm = document.querySelector("#confirmModalConfirm");
const STORAGE_KEY = "cybershield-faq-bot-state";

// ============================================================================
// STATE
// ============================================================================

let hasStartedConversation = false;
let currentChatTitle = "";
let lastUserPrompt = "";
let activeSessionId = null;
let nextSessionId = 1;
let pendingBotTimeouts = [];
let pendingConfirmAction = null;
let isRestoringSession = false;
const chatSessions = [];

// Quiz state (local)
const quizState = {
  active: false,
  currentIndex: 0,
  answers: []
};

const FALLBACK_SUGGESTIONS = ["Strong password tips", "How to report phishing", "Start the security quiz"];

async function sendChatMessage(message, sessionId = null) {
  const payload = {
    message: message,
    session_id: sessionId,
    quiz_active: quizState.active,
    quiz_index: quizState.currentIndex,
    quiz_answers: [...quizState.answers]
  };

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return getLocalBotReply(message);
  }
}

async function startQuiz(sessionId = null) {
  try {
    const response = await fetch(`${API_BASE}/quiz/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Quiz Start Error:', error);
    return null;
  }
}

async function submitQuizAnswer(score, sessionId = null) {
  try {
    const response = await fetch(`${API_BASE}/quiz/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        score: score, 
        session_id: sessionId,
        current_index: quizState.currentIndex
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Quiz Answer Error:', error);
    return null;
  }
}

async function restartQuiz(sessionId = null) {
  try {
    const response = await fetch(`${API_BASE}/quiz/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Quiz Restart Error:', error);
    return null;
  }
}

// ============================================================================
// LOCAL FALLBACK (when API is unavailable)
// ============================================================================

function getLocalBotReply(userText) {
  // Simplified local fallback
  const text = userText.toLowerCase();
  
  if (text.includes('phishing')) {
    return {
      type: 'text',
      response: [
        "Treat unexpected urgency, mismatched sender addresses, and requests for credentials or payments as phishing red flags.",
        "Hover over links before clicking, verify unusual requests through a second channel, and avoid opening unexpected attachments."
      ],
      suggestions: ["How can I browse safely?", "How do I report an incident?", "Start the security quiz"]
    };
  }
  
  if (text.includes('password')) {
    return {
      type: 'text',
      response: [
        "Use a unique passphrase for every account and store it in a password manager instead of reusing variations.",
        "Turn on MFA wherever possible, especially for email, banking, and admin tools."
      ],
      suggestions: ["How do I spot phishing emails?", "What should I do after a breach?", "Give me a security checklist"]
    };
  }
  
  if (text.includes('quiz') || text.includes('checkup')) {
    return { type: 'quiz-start' };
  }
  
  return {
    type: 'text',
    response: [
      "I'm not fully sure what you need from that message yet, but I can help with common cybersecurity FAQs.",
      "Try a direct question like \"How do I recognize phishing?\" or \"How do I protect my phone?\""
    ],
    suggestions: FALLBACK_SUGGESTIONS
  };
}

// ============================================================================
// NAVIGATION & UI
// ============================================================================

function syncNavigationState() {
  const isCollapsed = appShell.classList.contains("sidebar-collapsed");
  const isMobileOpen = appShell.classList.contains("sidebar-open");

  if (sidebarToggle) {
    const icon = isCollapsed ? "chevrons-right" : "chevrons-left";
    sidebarToggle.innerHTML = `<i data-feather="${icon}"></i>`;
    sidebarToggle.setAttribute("aria-label", isCollapsed ? "Expand menu" : "Retract menu");
    sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  }

  if (mobileMenuButton) {
    mobileMenuButton.setAttribute("aria-expanded", String(isMobileOpen));
  }

  if (sidebarOverlay) {
    sidebarOverlay.hidden = !isMobileOpen;
  }

  refreshIcons();
}

function refreshIcons() {
  if (window.feather) {
    window.feather.replace();
  }
}

function closeConfirmModal() {
  pendingConfirmAction = null;
  if (confirmModal) {
    confirmModal.setAttribute("hidden", "");
    confirmModal.setAttribute("aria-hidden", "true");
  }
}

function openConfirmModal({ title, message, confirmLabel, onConfirm }) {
  if (!confirmModal || !confirmModalTitle || !confirmModalMessage || !confirmModalConfirm) {
    onConfirm();
    return;
  }

  confirmModalTitle.textContent = title;
  confirmModalMessage.textContent = message;
  confirmModalConfirm.textContent = confirmLabel;
  pendingConfirmAction = onConfirm;
  confirmModal.removeAttribute("hidden");
  confirmModal.setAttribute("aria-hidden", "false");
  refreshIcons();
  confirmModalConfirm.focus();
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

function canUseStorage() {
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function setConversationMode(started) {
  hasStartedConversation = started;
  workspace.classList.toggle("chat-started", started);
}

function summarizeChatTitle(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 28 ? `${normalized.slice(0, 28)}...` : normalized;
}

function getSessionById(sessionId) {
  return chatSessions.find((session) => session.id === sessionId) || null;
}

function cancelPendingBotResponses() {
  pendingBotTimeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  pendingBotTimeouts = [];
  removeTypingIndicators();
}

function removeTypingIndicators() {
  chatMessages.querySelectorAll(".typing-indicator").forEach((indicator) => {
    indicator.closest(".message")?.remove();
  });
}

function syncActiveSessionState() {
  const activeSession = getSessionById(activeSessionId);
  if (!activeSession) {
    return;
  }

  activeSession.title = currentChatTitle;
  activeSession.lastUserPrompt = lastUserPrompt;
  activeSession.quizState = {
    active: quizState.active,
    currentIndex: quizState.currentIndex,
    answers: [...quizState.answers]
  };
  activeSession.messages = serializeMessages(chatMessages);
  persistSessions();
}

function serializeMessages(container) {
  return Array.from(container.children).map((messageElement) => serializeMessageElement(messageElement)).filter(Boolean);
}

function serializeMessageElement(messageElement) {
  const bubble = messageElement.querySelector(".message-bubble");
  if (!bubble) return null;

  const role = messageElement.classList.contains("user") ? "user" : "bot";

  if (bubble.querySelector(".quiz-card")) {
    return {
      role,
      type: "quiz-question",
      questionIndex: quizState.currentIndex
    };
  }

  if (bubble.querySelector(".score-card")) {
    return {
      role,
      type: "quiz-result",
      suggestions: getQuickReplyTexts(bubble)
    };
  }

  const parts = Array.from(bubble.children)
    .filter((child) => child.tagName === "P")
    .map((child) => child.textContent?.trim() || "")
    .filter(Boolean);

  return {
    role,
    type: "text",
    parts,
    suggestions: getQuickReplyTexts(bubble)
  };
}

function getQuickReplyTexts(container) {
  return Array.from(container.querySelectorAll(".quick-reply"))
    .map((button) => button.textContent?.trim() || "")
    .filter(Boolean);
}

function persistSessions() {
  if (!canUseStorage() || isRestoringSession) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeSessionId,
      nextSessionId,
      sessions: chatSessions.map((session) => ({
        id: session.id,
        title: session.title,
        lastUserPrompt: session.lastUserPrompt,
        quizState: session.quizState,
        messages: session.messages || []
      }))
    }));
  } catch {
    // Ignore storage failures
  }
}

function storeCurrentSessionNodes() {
  const activeSession = getSessionById(activeSessionId);
  if (!activeSession) return;

  activeSession.nodes = Array.from(chatMessages.children);
  activeSession.messages = serializeMessages(chatMessages);
  chatMessages.replaceChildren();
}

function createSession(title) {
  const session = {
    id: nextSessionId,
    title,
    lastUserPrompt: "",
    messages: [],
    nodes: [],
    quizState: {
      active: false,
      currentIndex: 0,
      answers: []
    }
  };

  nextSessionId += 1;
  chatSessions.unshift(session);
  activeSessionId = session.id;
  currentChatTitle = session.title;
  persistSessions();
  return session;
}

function restoreSessionNodes(session) {
  if (session.nodes?.length) {
    chatMessages.replaceChildren(...session.nodes);
    refreshIcons();
    scrollChatToBottom();
    return;
  }

  isRestoringSession = true;
  chatMessages.replaceChildren();

  const previousQuizState = { ...quizState };

  (session.messages || []).forEach((message) => {
    if (message.type === "quiz-question") {
      quizState.currentIndex = typeof message.questionIndex === "number" ? message.questionIndex : 0;
      addMessage(message.role, buildQuizQuestionCard());
      return;
    }

    if (message.type === "quiz-result") {
      quizState.answers = [...(session.quizState?.answers || [])];
      addMessage(message.role, buildQuizResultsCard(), { suggestions: message.suggestions });
      return;
    }

    addMessage(message.role, message.parts || [], { suggestions: message.suggestions });
  });

  Object.assign(quizState, previousQuizState);
  isRestoringSession = false;
}

function openSession(sessionId) {
  if (activeSessionId === sessionId) return;

  cancelPendingBotResponses();
  syncActiveSessionState();
  storeCurrentSessionNodes();

  const session = getSessionById(sessionId);
  if (!session) return;

  activeSessionId = session.id;
  currentChatTitle = session.title;
  lastUserPrompt = session.lastUserPrompt || "";
  quizState.active = session.quizState.active;
  quizState.currentIndex = session.quizState.currentIndex;
  quizState.answers = [...session.quizState.answers];
  setConversationMode((session.nodes?.length || 0) > 0 || (session.messages?.length || 0) > 0);
  restoreSessionNodes(session);
  renderHistory();
  persistSessions();
  userInput.focus();
}

function resetToBlankComposer() {
  chatMessages.replaceChildren();
  userInput.value = "";
  currentChatTitle = "";
  lastUserPrompt = "";
  quizState.active = false;
  quizState.currentIndex = 0;
  quizState.answers = [];
  activeSessionId = null;
  setConversationMode(false);
  renderHistory();
  persistSessions();
  userInput.focus();
}

function deleteSession(sessionId) {
  cancelPendingBotResponses();

  const sessionIndex = chatSessions.findIndex((session) => session.id === sessionId);
  if (sessionIndex === -1) return;

  const isActiveSession = activeSessionId === sessionId;
  chatSessions.splice(sessionIndex, 1);

  if (!isActiveSession) {
    renderHistory();
    persistSessions();
    return;
  }

  const nextSession = chatSessions[0] || null;
  if (!nextSession) {
    resetToBlankComposer();
    return;
  }

  activeSessionId = null;
  openSession(nextSession.id);
  persistSessions();
}

function clearAllSessions() {
  cancelPendingBotResponses();
  chatSessions.splice(0, chatSessions.length);
  resetToBlankComposer();
  persistSessions();
}

// ============================================================================
// CHAT HISTORY RENDERING
// ============================================================================

function renderHistory() {
  chatHistory.innerHTML = "";

  if (!chatSessions.length) {
    const empty = document.createElement("p");
    empty.className = "chat-history-empty";
    empty.textContent = "No conversations yet. Start with a quick question.";
    chatHistory.appendChild(empty);
    refreshIcons();
    return;
  }

  chatSessions.forEach((session) => {
    const row = document.createElement("div");
    row.className = "chat-history-row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `chat-history-item${session.id === activeSessionId ? " is-active" : ""}`;
    button.textContent = session.title;
    button.addEventListener("click", () => {
      openSession(session.id);
    });

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "chat-history-menu";
    menuButton.setAttribute("aria-label", "Delete chat");
    menuButton.innerHTML = '<i data-feather="trash-2"></i>';
    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openConfirmModal({
        title: "Delete this chat?",
        message: "This chat will be removed from your session history and cannot be recovered.",
        confirmLabel: "Delete chat",
        onConfirm: () => {
          deleteSession(session.id);
        }
      });
    });

    row.append(button, menuButton);
    chatHistory.appendChild(row);
  });

  refreshIcons();
}

// ============================================================================
// MESSAGE CREATION
// ============================================================================

function scrollChatToBottom() {
  const scrollToLatestMessage = () => {
    const latestMessage = chatMessages.lastElementChild;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (latestMessage instanceof HTMLElement) {
      latestMessage.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  };

  requestAnimationFrame(() => {
    scrollToLatestMessage();
    window.setTimeout(scrollToLatestMessage, 80);
  });
}

function createMessageElement(role) {
  const messageNode = messageTemplate.content.firstElementChild.cloneNode(true);
  messageNode.classList.add(role);
  return messageNode;
}

function createMessageMeta(role) {
  const meta = document.createElement("div");
  meta.className = "message-meta";

  const label = document.createElement("span");
  label.className = "message-label";
  const icon = document.createElement("span");
  icon.className = "message-label-icon";
  icon.setAttribute("aria-hidden", "true");

  if (role === "bot") {
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" class="bot-icon message-role-icon" focusable="false">
        <path d="M12 4v2"></path>
        <path d="M8.2 8.2h7.6c1.99 0 3.6 1.61 3.6 3.6v3.2c0 1.99-1.61 3.6-3.6 3.6H11l-3.8 2.4v-2.4H8.2c-1.99 0-3.6-1.61-3.6-3.6v-3.2c0-1.99 1.61-3.6 3.6-3.6Z"></path>
        <circle cx="9.6" cy="13.2" r="1"></circle>
        <circle cx="14.4" cy="13.2" r="1"></circle>
        <path d="M9.4 16h5.2"></path>
      </svg>
    `;
  } else {
    icon.innerHTML = '<i data-feather="user"></i>';
  }

  const labelText = document.createElement("span");
  labelText.textContent = role === "bot" ? "CyberShield" : "You";
  label.append(icon, labelText);

  const detail = document.createElement("span");
  detail.textContent = role === "bot" ? "Guided reply" : "User message";

  meta.append(label, detail);
  return meta;
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // Best-effort copy
  }
}

function addUtilityActions(container, role, contentText) {
  const utilities = document.createElement("div");
  utilities.className = "message-toolbar";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "utility-button";
  copyButton.setAttribute("aria-label", "Copy message");
  copyButton.innerHTML = '<i data-feather="copy"></i>';
  copyButton.addEventListener("click", () => {
    copyText(contentText);
    copyButton.classList.add("is-active");
    window.setTimeout(() => copyButton.classList.remove("is-active"), 900);
  });
  utilities.appendChild(copyButton);

  if (role === "bot") {
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "utility-button";
    retryButton.setAttribute("aria-label", "Regenerate response");
    retryButton.innerHTML = '<i data-feather="rotate-ccw"></i>';
    retryButton.addEventListener("click", () => {
      if (!lastUserPrompt) return;
      const existingMessage = container.closest(".message");
      if (existingMessage) existingMessage.remove();
      handleUserMessage(lastUserPrompt, true);
    });
    utilities.appendChild(retryButton);
  }

  return utilities;
}

function addFeedbackControls(container) {
  const actions = document.createElement("div");
  actions.className = "message-toolbar";

  ["thumbs-up", "thumbs-down"].forEach((iconName) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "feedback-button";
    button.setAttribute("aria-label", iconName === "thumbs-up" ? "Helpful response" : "Unhelpful response");
    button.innerHTML = `<i data-feather="${iconName}"></i>`;
    button.addEventListener("click", () => {
      actions.querySelectorAll(".feedback-button").forEach((item) => {
        item.classList.toggle("is-active", item === button && !button.classList.contains("is-active"));
      });
    });
    actions.appendChild(button);
  });

  return actions;
}

function addQuickReplies(container, suggestions) {
  if (!suggestions || !suggestions.length) return;

  const quickReplies = document.createElement("div");
  quickReplies.className = "quick-replies";

  suggestions.slice(0, 4).forEach((suggestion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-reply";
    button.textContent = suggestion;
    button.addEventListener("click", () => {
      handleUserMessage(suggestion);
    });
    quickReplies.appendChild(button);
  });

  container.appendChild(quickReplies);
}

function renderParagraphs(container, parts) {
  parts.forEach((part) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = part;
    container.appendChild(paragraph);
  });
}

function populateMessageElement(messageElement, role, content, options = {}) {
  const bubble = messageElement.querySelector(".message-bubble");
  bubble.innerHTML = "";
  bubble.prepend(createMessageMeta(role));
  let contentText = "";

  if (typeof content === "string") {
    contentText = content;
    renderParagraphs(bubble, content.split("\n").filter(Boolean));
  } else if (Array.isArray(content)) {
    contentText = content.join("\n");
    renderParagraphs(bubble, content);
  } else if (content instanceof HTMLElement) {
    bubble.appendChild(content);
  }

  if (options.suggestions) {
    addQuickReplies(bubble, options.suggestions);
  }

  if ((contentText && !options.hideUtilities) || (role === "bot" && !options.hideFeedback)) {
    const footer = document.createElement("div");
    footer.className = "message-footer";

    if (contentText && !options.hideUtilities) {
      footer.appendChild(addUtilityActions(bubble, role, contentText));
    }

    if (role === "bot" && !options.hideFeedback) {
      footer.appendChild(addFeedbackControls(bubble));
    }

    bubble.appendChild(footer);
  }
}

function addMessage(role, content, options = {}) {
  const messageElement = createMessageElement(role);
  populateMessageElement(messageElement, role, content, options);
  chatMessages.appendChild(messageElement);
  syncActiveSessionState();
  refreshIcons();
  scrollChatToBottom();
  return messageElement;
}

function replaceMessageContent(messageElement, role, content, options = {}) {
  if (!messageElement) return null;
  populateMessageElement(messageElement, role, content, options);
  syncActiveSessionState();
  refreshIcons();
  scrollChatToBottom();
  return messageElement;
}

function addTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.setAttribute("aria-label", "CyberShield is typing");
  indicator.innerHTML = "<span></span><span></span><span></span>";
  return addMessage("bot", indicator, { hideFeedback: true });
}

// ============================================================================
// QUIZ COMPONENTS
// ============================================================================

function buildQuizQuestionCard(questionData = null) {
  // If questionData provided, use it; otherwise use local state
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-card";

  const question = questionData?.question || `Question ${quizState.currentIndex + 1}`;
  const questionNumber = questionData?.questionNumber || quizState.currentIndex + 1;
  const totalQuestions = questionData?.totalQuestions || 6;
  const options = questionData?.options || [
    { label: "Option A", score: 2 },
    { label: "Option B", score: 1 },
    { label: "Option C", score: 0 }
  ];

  const meta = document.createElement("div");
  meta.className = "quiz-meta";
  meta.innerHTML = `<span>Security Checkup</span><span>Question ${questionNumber} of ${totalQuestions}</span>`;
  wrapper.appendChild(meta);

  const progress = document.createElement("div");
  progress.className = "quiz-progress";
  const progressBar = document.createElement("div");
  progressBar.className = "quiz-progress-bar";
  progressBar.style.width = `${(questionNumber / totalQuestions) * 100}%`;
  progress.appendChild(progressBar);
  wrapper.appendChild(progress);

  const prompt = document.createElement("p");
  prompt.className = "quiz-question";
  prompt.textContent = question;
  wrapper.appendChild(prompt);

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "quiz-options";

  options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = option.label;
    button.addEventListener("click", () => {
      handleQuizAnswer(option.score, index);
    });
    optionsContainer.appendChild(button);
  });

  wrapper.appendChild(optionsContainer);
  return wrapper;
}

function buildQuizResultsCard(resultsData = null) {
  const wrapper = document.createElement("div");
  wrapper.className = "score-card";

  // Use results data if available, otherwise use local state
  const headline = resultsData?.headline || "Quiz Complete";
  const totalScore = resultsData?.score ?? quizState.answers.reduce((sum, score) => sum + score, 0);
  const maxScore = resultsData?.maxScore ?? (quizState.answers.length * 2);
  const percentage = resultsData?.percentage ?? Math.round((totalScore / maxScore) * 100);
  const scoreBand = resultsData?.scoreBand || (percentage >= 75 ? "high" : percentage >= 45 ? "medium" : "low");
  const recommendations = resultsData?.recommendations || [];
  const suggestions = resultsData?.suggestions || ["Restart quiz", "Password security tips", "How do I report phishing?"];

  const summaryTexts = {
    high: "You already cover the main defensive habits. Keep refining your detection and recovery practices.",
    medium: "Your security posture is improving, but a few habits are still leaving room for avoidable risk.",
    low: "You have several high-value opportunities to reduce risk quickly with a few foundational changes."
  };

  const title = document.createElement("h3");
  title.textContent = headline;
  wrapper.appendChild(title);

  const badge = document.createElement("div");
  badge.className = `score-pill ${scoreBand}`;
  badge.textContent = `Score: ${totalScore}/${maxScore} (${percentage}%)`;
  wrapper.appendChild(badge);

  const summary = document.createElement("p");
  summary.textContent = resultsData?.summary || summaryTexts[scoreBand];
  wrapper.appendChild(summary);

  const list = document.createElement("ul");
  list.className = "score-list";

  const recsToShow = recommendations.length ? recommendations : [
    "Review your security habits regularly.",
    "Enable MFA on key accounts.",
    "Create reliable backups of important data."
  ];

  recsToShow.forEach((recommendation) => {
    const item = document.createElement("li");
    item.textContent = recommendation;
    list.appendChild(item);
  });
  wrapper.appendChild(list);

  // Store suggestions for after card is added
  wrapper.dataset.suggestions = JSON.stringify(suggestions);

  return wrapper;
}

// ============================================================================
// QUIZ HANDLING
// ============================================================================

async function handleQuizAnswer(score, optionIndex) {
  const currentMessage = chatMessages.lastElementChild;
  
  // Add answer to state
  quizState.answers.push(score);
  quizState.currentIndex += 1;

  // Try API first
  const apiResult = await submitQuizAnswer(score, activeSessionId);

  if (apiResult && apiResult.quiz_complete) {
    // Quiz finished
    quizState.active = false;
    replaceMessageContent(currentMessage, "bot", buildQuizResultsCard(apiResult.results), {
      suggestions: apiResult.results.suggestions
    });
  } else if (apiResult && apiResult.next_question) {
    // Next question from API
    replaceMessageContent(currentMessage, "bot", buildQuizQuestionCard(apiResult.next_question));
  } else {
    // Local fallback
    if (quizState.currentIndex >= 6) {
      quizState.active = false;
      replaceMessageContent(currentMessage, "bot", buildQuizResultsCard(), {
        suggestions: ["Restart quiz", "Password security tips", "How do I report phishing?"]
      });
    } else {
      // Use local quiz data as fallback
      const quizQuestions = [
        { question: "Do you use unique passwords for important accounts?", options: [{ label: "Yes, password manager", score: 2 }, { label: "Some unique", score: 1 }, { label: "Mostly reuse", score: 0 }] },
        { question: "How often do you enable MFA?", options: [{ label: "Almost always", score: 2 }, { label: "Some accounts", score: 1 }, { label: "Rarely", score: 0 }] },
        { question: "What do you do with unexpected links?", options: [{ label: "Verify first", score: 2 }, { label: "If familiar", score: 1 }, { label: "Usually click", score: 0 }] },
        { question: "How current are your updates?", options: [{ label: "Auto or quick", score: 2 }, { label: "Sometimes", score: 1 }, { label: "Postpone", score: 0 }] },
        { question: "How do you handle important files?", options: [{ label: "Back up and protect", score: 2 }, { label: "Back up some", score: 1 }, { label: "No backups", score: 0 }] },
        { question: "If compromised, what's your first move?", options: [{ label: "Isolate, report, reset", score: 2 }, { label: "Change password", score: 1 }, { label: "Not sure", score: 0 }] }
      ];
      replaceMessageContent(currentMessage, "bot", buildQuizQuestionCard(quizQuestions[quizState.currentIndex]));
    }
  }
}

async function startQuizFlow() {
  quizState.active = true;
  quizState.currentIndex = 0;
  quizState.answers = [];

  // Try API first
  const apiResult = await startQuiz(activeSessionId);

  if (apiResult && apiResult.quiz_intro && apiResult.first_question) {
    // Use API response
    addBotMessageWithDelay(() => {
      addMessage("bot", apiResult.quiz_intro.response);
      addMessage("bot", buildQuizQuestionCard(apiResult.first_question));
    });
  } else {
    // Local fallback
    addBotMessageWithDelay(() => {
      addMessage("bot", [
        "Let's run a quick security checkup. Pick the answer that sounds most like your current habits.",
        "I'll score the results and give you a few practical recommendations at the end."
      ]);
      addMessage("bot", buildQuizQuestionCard());
    });
  }
}

function addBotMessageWithDelay(callback) {
  const typingMessage = addTypingIndicator();
  const timeoutId = window.setTimeout(() => {
    pendingBotTimeouts = pendingBotTimeouts.filter((id) => id !== timeoutId);
    typingMessage.remove();
    callback();
  }, 600);
  pendingBotTimeouts.push(timeoutId);
}

// ============================================================================
// MAIN MESSAGE HANDLING
// ============================================================================

async function handleUserMessage(rawInput, isRegenerate = false) {
  const trimmedInput = rawInput.trim();
  if (!trimmedInput) {
    setConversationMode(true);
    addBotMessageWithDelay(() => {
      addMessage("bot", [
        "Type a cybersecurity question to get started.",
        "You can ask about phishing, passwords, device safety, or run the built-in security quiz."
      ], { suggestions: FALLBACK_SUGGESTIONS });
    });
    userInput.focus();
    return;
  }

  // Truncate to 500 chars
  const truncatedInput = trimmedInput.slice(0, 500);
  const normalizedInput = truncatedInput.toLowerCase();

  // Create new session if first message
  if (!hasStartedConversation) {
    currentChatTitle = summarizeChatTitle(truncatedInput);
    createSession(currentChatTitle);
    renderHistory();
  }

  setConversationMode(true);
  lastUserPrompt = truncatedInput;

  // Add user message
  addMessage("user", truncatedInput);
  userInput.value = "";

  // Check for quiz restart triggers
  const quizRestartTriggers = ["restart quiz", "retake quiz", "start quiz again", "start again"];
  if (quizState.active && quizRestartTriggers.some(trigger => normalizedInput.includes(trigger))) {
    const apiResult = await restartQuiz(activeSessionId);
    if (apiResult && apiResult.quiz_intro && apiResult.first_question) {
      quizState.active = true;
      quizState.currentIndex = 0;
      quizState.answers = [];
      addBotMessageWithDelay(() => {
        addMessage("bot", apiResult.quiz_intro.response);
        addMessage("bot", buildQuizQuestionCard(apiResult.first_question));
      });
    } else {
      startQuizFlow();
    }
    return;
  }

  // Handle active quiz interruption
  if (quizState.active) {
    addBotMessageWithDelay(() => {
      addMessage("bot", [
        "The security checkup is still in progress.",
        "Choose one of the answer buttons on the current question, or type \"restart quiz\" to begin again."
      ], { suggestions: ["Restart quiz"] });
    });
    return;
  }

  // Send to API
  const response = await sendChatMessage(truncatedInput, activeSessionId);

  if (!response || !response.reply) {
    // API failed, use fallback
    const fallback = getLocalBotReply(truncatedInput);
    handleBotReply(fallback, isRegenerate);
    return;
  }

  // Handle different reply types
  handleBotReply(response.reply, isRegenerate);
}

function handleBotReply(reply, isRegenerate = false) {
  if (reply.type === "quiz-start") {
    startQuizFlow();
    return;
  }

  if (reply.type === "text") {
    addBotMessageWithDelay(() => {
      addMessage("bot", reply.response, { suggestions: reply.suggestions });
    });
    return;
  }

  // Default fallback
  addBotMessageWithDelay(() => {
    addMessage("bot", reply.response || [
      "I'm here to help with cybersecurity questions.",
      "Try asking about phishing, passwords, or start the security quiz."
    ], { suggestions: FALLBACK_SUGGESTIONS });
  });
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function loadPersistedSessions() {
  if (!canUseStorage()) return false;

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) return false;

    const parsedState = JSON.parse(rawState);
    if (!parsedState || !Array.isArray(parsedState.sessions)) return false;

    isRestoringSession = true;
    chatSessions.splice(0, chatSessions.length);

    parsedState.sessions.forEach((session) => {
      chatSessions.push({
        id: session.id,
        title: session.title,
        lastUserPrompt: session.lastUserPrompt || "",
        messages: Array.isArray(session.messages) ? session.messages : [],
        nodes: [],
        quizState: {
          active: Boolean(session.quizState?.active),
          currentIndex: Number.isInteger(session.quizState?.currentIndex) ? session.quizState.currentIndex : 0,
          answers: Array.isArray(session.quizState?.answers) ? [...session.quizState.answers] : []
        }
      });
    });

    nextSessionId = Number.isInteger(parsedState.nextSessionId) ? parsedState.nextSessionId : (chatSessions.length + 1);
    activeSessionId = parsedState.activeSessionId;

    const activeSession = getSessionById(activeSessionId);
    if (!activeSession) {
      resetToBlankComposer();
      return chatSessions.length > 0;
    }

    currentChatTitle = activeSession.title;
    lastUserPrompt = activeSession.lastUserPrompt;
    quizState.active = activeSession.quizState.active;
    quizState.currentIndex = activeSession.quizState.currentIndex;
    quizState.answers = [...activeSession.quizState.answers];
    setConversationMode(activeSession.messages.length > 0);
    restoreSessionNodes(activeSession);
    renderHistory();
    return true;
  } catch {
    return false;
  } finally {
    isRestoringSession = false;
  }
}

function startNewConversation() {
  cancelPendingBotResponses();
  syncActiveSessionState();
  storeCurrentSessionNodes();
  resetToBlankComposer();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleUserMessage(userInput.value);
});

userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleUserMessage(userInput.value);
  }
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.closest(".sidebar-nav")) {
      startNewConversation();
    }
    handleUserMessage(button.dataset.prompt || "");
    appShell.classList.remove("sidebar-open");
    syncNavigationState();
  });
});

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    appShell.classList.toggle("sidebar-collapsed");
    syncNavigationState();
  });
}

if (mobileMenuButton) {
  mobileMenuButton.addEventListener("click", () => {
    appShell.classList.toggle("sidebar-open");
    syncNavigationState();
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", () => {
    appShell.classList.remove("sidebar-open");
    syncNavigationState();
  });
}

if (clearHistoryButton) {
  clearHistoryButton.addEventListener("click", () => {
    openConfirmModal({
      title: "Delete all chats?",
      message: "This will permanently remove every saved chat in this browser session. These chats cannot be recovered.",
      confirmLabel: "Delete all",
      onConfirm: () => {
        clearAllSessions();
      }
    });
  });
}

if (newChatButton) {
  newChatButton.addEventListener("click", () => {
    startNewConversation();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && confirmModal && !confirmModal.hidden) {
    closeConfirmModal();
    return;
  }
  if (event.key === "Escape" && appShell.classList.contains("sidebar-open")) {
    appShell.classList.remove("sidebar-open");
    syncNavigationState();
  }
});

if (confirmModalBackdrop) {
  confirmModalBackdrop.addEventListener("click", () => closeConfirmModal());
}

if (confirmModalCancel) {
  confirmModalCancel.addEventListener("click", () => closeConfirmModal());
}

if (confirmModalConfirm) {
  confirmModalConfirm.addEventListener("click", () => {
    const action = pendingConfirmAction;
    closeConfirmModal();
    if (typeof action === "function") {
      action();
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeApp() {
  syncNavigationState();
  
  // Try to load history from server first
  const serverSessions = await fetchHistory();
  
  if (serverSessions.length > 0) {
    // Use server sessions
    isRestoringSession = true;
    chatSessions.splice(0, chatSessions.length);
    
    // Fetch full details for each session
    for (const session of serverSessions) {
      const fullSession = await fetchSession(session.id);
      if (fullSession) {
        chatSessions.push({
          id: fullSession.id,
          title: fullSession.title,
          messages: fullSession.messages || [],
          nodes: [],
          quizState: fullSession.quiz_state || { active: false, index: 0, answers: [] },
          lastUserPrompt: fullSession.messages?.[0]?.content || ''
        });
      }
    }
    
    if (chatSessions.length > 0) {
      openSession(chatSessions[0].id);
    }
    
    isRestoringSession = false;
  } else {
    // Fall back to localStorage
    if (!loadPersistedSessions()) {
      renderHistory();
    }
  }
  
  refreshIcons();

  if (appSkeleton) {
    window.setTimeout(() => {
      appSkeleton.classList.add("is-hidden");
    }, 850);
  }

  // Check API availability
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (response.ok) {
      console.log('✓ CyberShield API connected');
    }
  } catch {
    console.warn('⚠ API not available - using local fallback mode');
  }
}

// Run initialization
initializeApp();
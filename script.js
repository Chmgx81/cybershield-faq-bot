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

let hasStartedConversation = false;
let currentChatTitle = "";
let lastUserPrompt = "";
let activeSessionId = null;
let nextSessionId = 1;
let pendingBotTimeouts = [];
let pendingConfirmAction = null;
let isRestoringSession = false;
const chatSessions = [];

const faqTopics = [
  {
    id: "password",
    label: "Password Security",
    keywords: {
      password: 4,
      passwords: 4,
      passphrase: 4,
      strong: 2,
      reset: 2,
      reuse: 3,
      reused: 3,
      manager: 3,
      vault: 2,
      multifactor: 3,
      mfa: 4,
      twofactor: 4,
      "2fa": 4,
      login: 2,
      credential: 3,
    },
    response: [
      "Use a unique passphrase for every account and store it in a password manager instead of reusing variations.",
      "Turn on MFA wherever possible, especially for email, banking, and admin tools, because it blocks many credential-stuffing attacks.",
      "If you think a password may be exposed, change it immediately and review recent account activity."
    ],
    suggestions: ["How do I spot phishing emails?", "What should I do after a breach?", "Give me a security checklist"]
  },
  {
    id: "phishing",
    label: "Phishing Awareness",
    keywords: {
      phishing: 5,
      email: 3,
      emails: 3,
      mailbox: 2,
      suspicious: 3,
      scam: 4,
      fake: 2,
      sender: 2,
      attachment: 3,
      link: 3,
      invoice: 2,
      urgent: 2,
      impersonation: 4,
      spoof: 4,
    },
    response: [
      "Treat unexpected urgency, mismatched sender addresses, and requests for credentials or payments as phishing red flags.",
      "Hover over links before clicking, verify unusual requests through a second channel, and avoid opening unexpected attachments.",
      "If a message feels off, report it instead of interacting with it."
    ],
    suggestions: ["How can I browse safely?", "How do I report an incident?", "Start the security quiz"]
  },
  {
    id: "browsing",
    label: "Safe Browsing",
    keywords: {
      browser: 3,
      browsing: 4,
      browse: 4,
      website: 3,
      https: 3,
      download: 3,
      downloads: 3,
      popup: 2,
      wifi: 3,
      public: 2,
      vpn: 2,
      certificate: 2,
      extension: 2,
      ads: 1,
      link: 2,
    },
    response: [
      "Keep your browser updated, prefer HTTPS sites, and avoid downloading software or documents from unknown sources.",
      "Be careful on public Wi-Fi and use a trusted VPN when handling sensitive accounts outside secure networks.",
      "Limit browser extensions to reputable tools because extensions can read a surprising amount of data."
    ],
    suggestions: ["How should I protect my data?", "What about mobile security?", "How do I create strong passwords?"]
  },
  {
    id: "data",
    label: "Data Protection",
    keywords: {
      data: 4,
      backup: 4,
      backups: 4,
      encrypt: 4,
      encryption: 4,
      privacy: 3,
      file: 2,
      files: 2,
      cloud: 2,
      share: 2,
      storage: 2,
      usb: 2,
      confidential: 3,
      leak: 3,
    },
    response: [
      "Back up important files using the 3-2-1 rule: three copies, two media types, one offline or offsite copy.",
      "Encrypt sensitive devices and documents, and only share confidential data through approved, access-controlled channels.",
      "Review who has access to shared folders regularly so old permissions do not become a quiet risk."
    ],
    suggestions: ["How do I avoid social engineering?", "What should I do if malware hits?", "Rate my security"]
  },
  {
    id: "social",
    label: "Social Engineering",
    keywords: {
      social: 4,
      engineering: 4,
      caller: 2,
      call: 2,
      phone: 2,
      impersonate: 4,
      impersonation: 4,
      tailgating: 4,
      badge: 2,
      trust: 1,
      verify: 3,
      pressure: 2,
      request: 1,
    },
    response: [
      "Social engineering succeeds by creating pressure and trust, so slow the interaction down and verify the request independently.",
      "Never share passwords, one-time codes, or sensitive details just because someone sounds legitimate or senior.",
      "For physical spaces, challenge unfamiliar visitors politely and follow badge or escort policies."
    ],
    suggestions: ["How do I stay safe on my phone?", "What are general security best practices?", "Give me a checklist"]
  },
  {
    id: "mobile",
    label: "Mobile Security",
    keywords: {
      mobile: 4,
      phone: 3,
      device: 2,
      android: 3,
      iphone: 3,
      app: 3,
      apps: 3,
      biometric: 2,
      lockscreen: 2,
      update: 2,
      updates: 2,
      bluetooth: 2,
      sms: 2,
      sim: 3,
      lost: 2,
      wipe: 2,
    },
    response: [
      "Protect phones with a strong device PIN or biometric unlock, and keep the operating system and apps updated.",
      "Install apps only from official stores, review permissions carefully, and disable Bluetooth or hotspot features when unused.",
      "Use remote locate and wipe features so a lost device is less likely to become a data-loss event."
    ],
    suggestions: ["How do I detect phishing texts?", "What should I do after losing a device?", "Start the security quiz"]
  },
  {
    id: "incident",
    label: "Incident Response",
    keywords: {
      incident: 5,
      breach: 5,
      hacked: 4,
      attack: 3,
      malware: 4,
      infected: 3,
      ransomware: 4,
      report: 3,
      compromised: 4,
      suspicious: 2,
      stolen: 2,
      leak: 3,
      urgent: 1,
      recovery: 2,
      wipe: 1,
    },
    response: [
      "If you suspect compromise, isolate the affected device or account first so the issue does not spread further.",
      "Report the incident quickly, preserve evidence such as screenshots or timestamps, and avoid deleting suspicious emails or files before review.",
      "Reset impacted passwords from a known-safe device and monitor for follow-on abuse."
    ],
    suggestions: ["How can I protect my data?", "What are the best daily habits?", "Assess my security"]
  },
  {
    id: "general",
    label: "General Best Practices",
    keywords: {
      security: 2,
      safe: 2,
      protect: 2,
      habits: 3,
      basics: 3,
      best: 3,
      practice: 3,
      general: 3,
      cybersecurity: 2,
      cyber: 2,
      tips: 3,
    },
    response: [
      "The strongest baseline is simple: update devices promptly, use unique passwords with MFA, and pause before trusting unexpected requests.",
      "Back up important data, lock devices when unattended, and keep work and personal accounts separated where possible.",
      "Security improves most when good habits are repeated consistently, not only after a scary incident."
    ],
    suggestions: ["How do I build strong passwords?", "How do I recognize phishing?", "Start the security quiz"]
  }
];

const quizQuestions = [
  {
    question: "Do you use unique passwords for important accounts?",
    options: [
      { label: "Yes, and I store them in a password manager", score: 2 },
      { label: "Some are unique, but I still reuse a few", score: 1 },
      { label: "I mostly reuse the same password", score: 0 }
    ]
  },
  {
    question: "How often do you enable MFA when it is available?",
    options: [
      { label: "Almost always", score: 2 },
      { label: "Only on a few key accounts", score: 1 },
      { label: "Rarely or never", score: 0 }
    ]
  },
  {
    question: "What do you do with unexpected links or attachments?",
    options: [
      { label: "Verify first and avoid opening suspicious content", score: 2 },
      { label: "I open them if they look familiar", score: 1 },
      { label: "I usually click without checking", score: 0 }
    ]
  },
  {
    question: "How current are your device and app updates?",
    options: [
      { label: "Automatic updates are enabled or I patch quickly", score: 2 },
      { label: "I update sometimes when I remember", score: 1 },
      { label: "I often postpone updates for a long time", score: 0 }
    ]
  },
  {
    question: "How do you handle important files or data?",
    options: [
      { label: "I back them up and protect sensitive data", score: 2 },
      { label: "I back up only a few things", score: 1 },
      { label: "I do not keep reliable backups", score: 0 }
    ]
  },
  {
    question: "If an account or device seems compromised, what is your first move?",
    options: [
      { label: "Isolate it, report it, and reset from a safe device", score: 2 },
      { label: "I would probably change a password and hope it is enough", score: 1 },
      { label: "I am not sure what I would do", score: 0 }
    ]
  }
];

const quizState = {
  active: false,
  currentIndex: 0,
  answers: []
};

const quizTriggers = ["quiz", "checklist", "assess", "score", "rate my security"];
const fallbackSuggestions = ["Strong password tips", "How to report phishing", "Start the security quiz"];
const quizRestartTriggers = ["restart quiz", "retake quiz", "start quiz again", "start again"];
const greetingTriggers = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"];
const helpTriggers = ["help", "assist", "support", "what can you do", "what do you do"];
const thanksTriggers = ["thanks", "thank you", "appreciate it"];
const identityTriggers = ["who are you", "what are you", "are you a bot", "are you chatbot", "what is cybershield"];
const normalizationRules = [
  [/\bwi[\s-]?fi\b/g, "wifi"],
  [/\bpass[\s-]?word\b/g, "password"],
  [/\bpass[\s-]?phrase\b/g, "passphrase"],
  [/\btwo[\s-]?factor\b/g, "twofactor"],
  [/\bmulti[\s-]?factor\b/g, "multifactor"],
  [/\b2[\s-]?fa\b/g, "2fa"],
  [/\bphising\b|\bphishng\b|\bfising\b/g, "phishing"],
  [/\blog[\s-]?in\b/g, "login"],
  [/\bback[\s-]?up\b/g, "backup"],
  [/\bweb[\s-]?site\b/g, "website"],
  [/\bcell[\s-]?phone\b/g, "phone"],
  [/\bsmart[\s-]?phone\b/g, "phone"],
  [/\btext message\b|\btext messages\b/g, "sms"],
  [/\bdata breach\b/g, "breach"],
  [/\bremote wipe\b/g, "wipe"],
];

function sanitizeForMatching(text) {
  let normalized = text.toLowerCase();

  normalizationRules.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  return normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTokenSet(normalizedText) {
  return new Set(normalizedText.split(" ").filter(Boolean));
}

function getTopicById(id) {
  return faqTopics.find((topic) => topic.id === id);
}

function truncateInput(text) {
  return text.slice(0, 500);
}

function scrollChatToBottom() {
  const scrollToLatestMessage = () => {
    const latestMessage = chatMessages.lastElementChild;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (latestMessage instanceof HTMLElement) {
      latestMessage.scrollIntoView({
        block: "end",
        behavior: "smooth"
      });
    }
  };

  requestAnimationFrame(() => {
    scrollToLatestMessage();
    window.setTimeout(scrollToLatestMessage, 80);
  });
}

function refreshIcons() {
  if (window.feather) {
    window.feather.replace();
  }
}

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

function canUseStorage() {
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function getQuickReplyTexts(container) {
  return Array.from(container.querySelectorAll(".quick-reply"))
    .map((button) => button.textContent?.trim() || "")
    .filter(Boolean);
}

function serializeMessageElement(messageElement) {
  const bubble = messageElement.querySelector(".message-bubble");
  if (!bubble) {
    return null;
  }

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

function serializeMessages(container) {
  return Array.from(container.children)
    .map((messageElement) => serializeMessageElement(messageElement))
    .filter(Boolean);
}

function persistSessions() {
  if (!canUseStorage() || isRestoringSession) {
    return;
  }

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
    // Ignore storage failures for this front-end-only project.
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

function removeTypingIndicators() {
  chatMessages.querySelectorAll(".typing-indicator").forEach((indicator) => {
    indicator.closest(".message")?.remove();
  });
}

function cancelPendingBotResponses() {
  pendingBotTimeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  pendingBotTimeouts = [];
  removeTypingIndicators();
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

function storeCurrentSessionNodes() {
  const activeSession = getSessionById(activeSessionId);
  if (!activeSession) {
    return;
  }

  activeSession.nodes = Array.from(chatMessages.children);
  activeSession.messages = serializeMessages(chatMessages);
  chatMessages.replaceChildren();
}

function restoreSessionNodes(session) {
  if (session.nodes?.length) {
    chatMessages.replaceChildren(...session.nodes);
    refreshIcons();
    scrollChatToBottom();
    return;
  }

  const previousQuizState = {
    active: quizState.active,
    currentIndex: quizState.currentIndex,
    answers: [...quizState.answers]
  };

  isRestoringSession = true;
  chatMessages.replaceChildren();

  (session.messages || []).forEach((message) => {
    if (message.type === "quiz-question") {
      quizState.currentIndex = typeof message.questionIndex === "number" ? message.questionIndex : 0;
      addMessage(message.role, buildQuizQuestionCard());
      return;
    }

    if (message.type === "quiz-result") {
      quizState.answers = [...(session.quizState?.answers || [])];
      addMessage(message.role, buildQuizResultsCard(), {
        suggestions: message.suggestions
      });
      return;
    }

    addMessage(message.role, message.parts || [], {
      suggestions: message.suggestions
    });
  });

  quizState.active = previousQuizState.active;
  quizState.currentIndex = previousQuizState.currentIndex;
  quizState.answers = previousQuizState.answers;
  isRestoringSession = false;
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

function openSession(sessionId) {
  if (activeSessionId === sessionId) {
    return;
  }

  cancelPendingBotResponses();
  syncActiveSessionState();
  storeCurrentSessionNodes();

  const session = getSessionById(sessionId);
  if (!session) {
    return;
  }

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

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // Best-effort copy only for this lightweight demo.
  }
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
    window.setTimeout(() => {
      copyButton.classList.remove("is-active");
    }, 900);
  });
  utilities.appendChild(copyButton);

  if (role === "bot") {
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "utility-button";
    retryButton.setAttribute("aria-label", "Regenerate response");
    retryButton.innerHTML = '<i data-feather="rotate-ccw"></i>';
    retryButton.addEventListener("click", () => {
      if (!lastUserPrompt) {
        return;
      }

      const existingMessage = container.closest(".message");
      if (existingMessage) {
        existingMessage.remove();
      }

      addBotMessageWithDelay(() => {
        const reply = getBotReply(lastUserPrompt);
        if (reply.type === "quiz-start") {
          startQuizFlow();
          return;
        }

        addMessage("bot", reply.response, {
          suggestions: reply.suggestions
        });
      });
    });
    utilities.appendChild(retryButton);
  }

  return utilities;
}

function createMessageElement(role) {
  const messageNode = messageTemplate.content.firstElementChild.cloneNode(true);
  messageNode.classList.add(role);
  return messageNode;
}

function addQuickReplies(container, suggestions) {
  if (!suggestions || !suggestions.length) {
    return;
  }

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
  if (!messageElement) {
    return null;
  }

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

function getTopicScore(topic, normalizedInput) {
  const tokens = buildTokenSet(normalizedInput);

  return Object.entries(topic.keywords).reduce((score, [keyword, weight]) => {
    const isPhrase = keyword.includes(" ");
    const hasMatch = isPhrase ? normalizedInput.includes(keyword) : tokens.has(keyword);

    if (hasMatch) {
      return score + weight;
    }
    return score;
  }, 0);
}

function findBestTopic(normalizedInput) {
  let bestTopic = null;
  let bestScore = 0;

  faqTopics.forEach((topic) => {
    const score = getTopicScore(topic, normalizedInput);
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  });

  return bestScore > 0 ? bestTopic : null;
}

function buildGreetingResponse() {
  return {
    response: [
      "Hi, I’m CyberShield, your cybersecurity FAQ assistant.",
      "I can give quick, practical answers on phishing, passwords, safe browsing, mobile security, incident response, and a short security checkup.",
      "Ask me something specific like “How do I spot phishing emails?” or use one of the suggested prompts below."
    ],
    suggestions: ["How do I spot phishing emails?", "Strong password tips", "Start the security quiz"]
  };
}

function buildHelpResponse() {
  return {
    response: [
      "I’m built to answer common cybersecurity FAQs with short, practical guidance.",
      "You can ask about password safety, phishing, suspicious links, phone security, data protection, or what to do after a possible breach.",
      "If you want a broader check, I can also run a quick security quiz and give recommendations."
    ],
    suggestions: ["Password security tips", "How do I report phishing?", "Start the security quiz"]
  };
}

function buildThanksResponse() {
  return {
    response: [
      "You’re welcome.",
      "If you want, keep going with another cybersecurity question and I’ll stay focused on practical next steps."
    ],
    suggestions: ["How can I browse safely?", "What should I do after a breach?", "Check my security habits"]
  };
}

function buildIdentityResponse() {
  return {
    response: [
      "I’m CyberShield, a rule-based cybersecurity FAQ chatbot for this project.",
      "I answer common questions about phishing, passwords, mobile safety, safe browsing, incident response, and basic security habits.",
      "I’m not a live human analyst, but I can give quick, practical guidance and run the built-in security checkup."
    ],
    suggestions: ["How do I spot phishing emails?", "What can you help me with?", "Start the security quiz"]
  };
}

function buildFallbackResponse() {
  return {
    response: [
      "I’m not fully sure what you need from that message yet, but I can help with common cybersecurity FAQs.",
      "Try a direct question like “How do I recognize phishing?”, “How do I protect my phone?”, or “What should I do after a breach?”",
      "You can also start the security quiz if you want a broader checkup."
    ],
    suggestions: fallbackSuggestions
  };
}

function getBotReply(userText) {
  const normalizedInput = sanitizeForMatching(userText);
  const tokens = buildTokenSet(normalizedInput);
  const asksHow = tokens.has("how") || tokens.has("what") || tokens.has("why");
  const hasGreeting = greetingTriggers.some((trigger) => normalizedInput === trigger || normalizedInput.startsWith(`${trigger} `));

  if (identityTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildIdentityResponse() };
  }

  if (hasGreeting && helpTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildHelpResponse() };
  }

  if (hasGreeting) {
    return { type: "faq", ...buildGreetingResponse() };
  }

  if (thanksTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildThanksResponse() };
  }

  if (helpTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildHelpResponse() };
  }

  if (
    quizTriggers.some((trigger) => normalizedInput.includes(trigger)) ||
    (tokens.has("checkup") && (tokens.has("security") || tokens.has("cybersecurity")))
  ) {
    return { type: "quiz-start" };
  }

  if (asksHow && tokens.has("password")) {
    const topic = getTopicById("password");
    return { type: "faq", response: topic.response, suggestions: topic.suggestions };
  }

  if ((tokens.has("phishing") || tokens.has("scam")) && (tokens.has("email") || tokens.has("emails") || tokens.has("message") || tokens.has("messages") || tokens.has("sms"))) {
    const topic = getTopicById("phishing");
    return { type: "faq", response: topic.response, suggestions: topic.suggestions };
  }

  const matchedTopic = findBestTopic(normalizedInput);
  if (!matchedTopic) {
    return { type: "faq", ...buildFallbackResponse() };
  }

  return {
    type: "faq",
    response: matchedTopic.response,
    suggestions: matchedTopic.suggestions
  };
}

function resetQuizState() {
  quizState.active = true;
  quizState.currentIndex = 0;
  quizState.answers = [];
}

function buildQuizQuestionCard() {
  const question = quizQuestions[quizState.currentIndex];
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-card";

  const meta = document.createElement("div");
  meta.className = "quiz-meta";
  meta.innerHTML = `<span>Security Checkup</span><span>Question ${quizState.currentIndex + 1} of ${quizQuestions.length}</span>`;
  wrapper.appendChild(meta);

  const progress = document.createElement("div");
  progress.className = "quiz-progress";
  const progressBar = document.createElement("div");
  progressBar.className = "quiz-progress-bar";
  progressBar.style.width = `${((quizState.currentIndex + 1) / quizQuestions.length) * 100}%`;
  progress.appendChild(progressBar);
  wrapper.appendChild(progress);

  const prompt = document.createElement("p");
  prompt.className = "quiz-question";
  prompt.textContent = question.question;
  wrapper.appendChild(prompt);

  const options = document.createElement("div");
  options.className = "quiz-options";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = option.label;
    button.addEventListener("click", () => {
      const currentMessage = button.closest(".message");
      quizState.answers.push(option.score);
      quizState.currentIndex += 1;

      if (quizState.currentIndex < quizQuestions.length) {
        replaceMessageContent(currentMessage, "bot", buildQuizQuestionCard());
      } else {
        quizState.active = false;
        replaceMessageContent(currentMessage, "bot", buildQuizResultsCard(), {
          suggestions: ["Restart quiz", "Password security tips", "How do I report phishing?"]
        });
      }
    });
    options.appendChild(button);
  });

  wrapper.appendChild(options);
  return wrapper;
}

function getQuizRecommendations(scoreBand) {
  if (scoreBand === "high") {
    return [
      "Keep that momentum by reviewing account access and backups regularly.",
      "Focus next on spotting more subtle phishing and business email compromise attempts.",
      "Test your recovery plan so you know what to do before an incident happens."
    ];
  }

  if (scoreBand === "medium") {
    return [
      "Prioritize MFA on email and finance-related accounts first.",
      "Move reused passwords into a password manager over the next few days.",
      "Turn on automatic updates and confirm you have at least one reliable backup."
    ];
  }

  return [
    "Start with the highest-impact fixes: unique passwords, MFA, and software updates.",
    "Create one dependable backup for important files and learn how to report suspicious messages.",
    "If a device or account feels off, isolate it and ask for help early rather than waiting."
  ];
}

function buildQuizResultsCard() {
  const totalScore = quizState.answers.reduce((sum, score) => sum + score, 0);
  const maxScore = quizQuestions.length * 2;
  const percentage = Math.round((totalScore / maxScore) * 100);

  let scoreBand = "low";
  let headline = "Needs Immediate Hardening";
  if (percentage >= 75) {
    scoreBand = "high";
    headline = "Strong Security Baseline";
  } else if (percentage >= 45) {
    scoreBand = "medium";
    headline = "Solid Start With Gaps";
  }

  const wrapper = document.createElement("div");
  wrapper.className = "score-card";

  const title = document.createElement("h3");
  title.textContent = headline;
  wrapper.appendChild(title);

  const badge = document.createElement("div");
  badge.className = `score-pill ${scoreBand}`;
  badge.textContent = `Score: ${totalScore}/${maxScore} (${percentage}%)`;
  wrapper.appendChild(badge);

  const summary = document.createElement("p");
  summary.textContent =
    scoreBand === "high"
      ? "You already cover the main defensive habits. Keep refining your detection and recovery practices."
      : scoreBand === "medium"
        ? "Your security posture is improving, but a few habits are still leaving room for avoidable risk."
        : "You have several high-value opportunities to reduce risk quickly with a few foundational changes.";
  wrapper.appendChild(summary);

  const list = document.createElement("ul");
  list.className = "score-list";
  getQuizRecommendations(scoreBand).forEach((recommendation) => {
    const item = document.createElement("li");
    item.textContent = recommendation;
    list.appendChild(item);
  });
  wrapper.appendChild(list);

  return wrapper;
}

function startQuizFlow() {
  resetQuizState();
  addBotMessageWithDelay(() => {
    addMessage("bot", [
      "Let’s run a quick security checkup. Pick the answer that sounds most like your current habits.",
      "I’ll score the results and give you a few practical recommendations at the end."
    ]);
    addMessage("bot", buildQuizQuestionCard());
  });
}

function addBotMessageWithDelay(callback) {
  const typingMessage = addTypingIndicator();
  const timeoutId = window.setTimeout(() => {
    pendingBotTimeouts = pendingBotTimeouts.filter((id) => id !== timeoutId);
    typingMessage.remove();
    callback();
  }, 500);
  pendingBotTimeouts.push(timeoutId);
}

function handleEmptyInput() {
  setConversationMode(true);
  addBotMessageWithDelay(() => {
    addMessage("bot", [
      "Type a cybersecurity question to get started.",
      "You can ask about phishing, passwords, device safety, or run the built-in security quiz."
    ], {
      suggestions: fallbackSuggestions
    });
  });
}

function startNewConversation() {
  cancelPendingBotResponses();
  syncActiveSessionState();
  storeCurrentSessionNodes();
  resetToBlankComposer();
}

function deleteSession(sessionId) {
  cancelPendingBotResponses();

  const sessionIndex = chatSessions.findIndex((session) => session.id === sessionId);
  if (sessionIndex === -1) {
    return;
  }

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

function loadPersistedSessions() {
  if (!canUseStorage()) {
    return false;
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return false;
    }

    const parsedState = JSON.parse(rawState);
    if (!parsedState || !Array.isArray(parsedState.sessions)) {
      return false;
    }

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

function handleUserMessage(rawInput) {
  const trimmedInput = truncateInput(rawInput).trim();
  const normalizedInput = sanitizeForMatching(trimmedInput);
  if (!trimmedInput) {
    handleEmptyInput();
    userInput.focus();
    return;
  }

  if (!hasStartedConversation) {
    currentChatTitle = summarizeChatTitle(trimmedInput);
    createSession(currentChatTitle);
    renderHistory();
  }

  setConversationMode(true);
  lastUserPrompt = trimmedInput;
  addMessage("user", trimmedInput);
  userInput.value = "";

  if (quizState.active && quizRestartTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    startQuizFlow();
    return;
  }

  if (quizState.active) {
    addBotMessageWithDelay(() => {
      addMessage("bot", [
        "The security checkup is still in progress.",
        "Choose one of the answer buttons on the current question, or type “restart quiz” to begin again."
      ], {
        suggestions: ["Restart quiz"]
      });
    });
    return;
  }

  const reply = getBotReply(trimmedInput);
  if (reply.type === "quiz-start") {
    startQuizFlow();
    return;
  }

  addBotMessageWithDelay(() => {
    addMessage("bot", reply.response, {
      suggestions: reply.suggestions
    });
  });
}

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
  confirmModalBackdrop.addEventListener("click", () => {
    closeConfirmModal();
  });
}

if (confirmModalCancel) {
  confirmModalCancel.addEventListener("click", () => {
    closeConfirmModal();
  });
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

syncNavigationState();
if (!loadPersistedSessions()) {
  renderHistory();
}
refreshIcons();

if (appSkeleton) {
  window.setTimeout(() => {
    appSkeleton.classList.add("is-hidden");
  }, 850);
}

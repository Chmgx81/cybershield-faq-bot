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
const scrollDownButton = document.querySelector("#scrollDownButton");
const confirmModal = document.querySelector("#confirmModal");
const modalTitle = document.querySelector("#modalTitle");
const modalMessage = document.querySelector("#modalMessage");
const modalIcon = document.querySelector("#modalIcon");
const modalCancel = document.querySelector("#modalCancel");
const modalConfirm = document.querySelector("#modalConfirm");

let modalResolve = null;

let isAtBottom = true;

let hasStartedConversation = false;
let currentChatTitle = "";
let lastUserPrompt = "";
let lastMatchedTopic = null;
let activeSessionId = null;
let nextSessionId = 1;
let pendingBotTimeouts = [];
const chatSessions = [];

const STORAGE_KEY = "cybershield_sessions";
const SESSION_NEXT_ID_KEY = "cybershield_next_id";

function loadSessionsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const nextId = localStorage.getItem(SESSION_NEXT_ID_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.forEach(session => {
        chatSessions.push(session);
      });
    }
    if (nextId) {
      nextSessionId = parseInt(nextId, 10);
    }
  } catch (e) {
    console.warn("Failed to load sessions from storage", e);
  }
}

function saveSessionsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions));
    localStorage.setItem(SESSION_NEXT_ID_KEY, String(nextSessionId));
  } catch (e) {
    console.warn("Failed to save sessions to storage", e);
  }
}

function clearSessionsFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_NEXT_ID_KEY);
  } catch (e) {
    console.warn("Failed to clear sessions from storage", e);
  }
}

loadSessionsFromStorage();

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
      forgot: 3,
      "forgot password": 5,
      "forgotten password": 5,
      "change password": 3,
      "reset password": 4,
      "password manager": 5,
      "unique password": 4,
      "same password": 3,
      generate: 2,
    },
    response: [
      "Use a unique passphrase for every account and store it in a password manager instead of reusing variations. Reused passwords are the leading cause of account breaches—when one service gets compromised, attackers use automated tools to try the same credentials everywhere.",
      "Turn on MFA wherever possible, especially for email, banking, and admin tools, because it blocks most credential-stuffing attacks. Even if someone steals your password, they cannot access your account without the second factor.",
      "If you think a password may be exposed, change it immediately and review recent account activity. Check for unknown devices or locations in your account's security settings, and enable alerts for new logins."
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
      "spam": 2,
      "junk": 1,
      "phish": 5,
      "fishing": 1,
      "is this safe": 4,
      "is this legitimate": 4,
      "real email": 3,
      "check email": 3,
      "verify email": 4,
    },
    response: [
      "Treat unexpected urgency, mismatched sender addresses, and requests for credentials or payments as phishing red flags. Attackers create false urgency to make you act without thinking—legitimate organizations rarely demand immediate action via email.",
      "Hover over links before clicking to see the actual URL destination, verify unusual requests through a second channel (call the company directly using their official number), and avoid opening unexpected attachments, especially Office documents or compressed files.",
      "If a message feels off, report it to your email provider or IT team instead of interacting with it. Most email platforms have easy reporting tools that help improve spam filters for everyone."
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
      "private browsing": 4,
      "incognito": 3,
      "ad blocker": 3,
      "pop up": 2,
      "suspicious website": 4,
    },
    response: [
      "Keep your browser updated, prefer HTTPS sites (look for the padlock icon in the address bar), and avoid downloading software or documents from unknown sources. Browser updates patch critical security vulnerabilities that attackers actively exploit.",
      "Be careful on public Wi-Fi and use a trusted VPN when handling sensitive accounts outside secure networks. Public Wi-Fi can be monitored by anyone nearby—avoid logging into banking or work accounts on untrusted networks.",
      "Limit browser extensions to reputable tools because extensions can read a surprising amount of data. Review extension permissions regularly and remove any you no longer use."
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
      "data loss": 3,
      "important files": 3,
      "sensitive": 2,
      "onedrive": 3,
      "google drive": 3,
      "dropbox": 3,
      "icloud": 3,
    },
    response: [
      "Back up important files using the 3-2-1 rule: three copies of your data, on two different types of media, with one copy stored offline or offsite. This protects against hardware failure, theft, ransomware, and natural disasters.",
      "Encrypt sensitive devices and documents, and only share confidential data through approved, access-controlled channels. Use built-in full-disk encryption (BitLocker on Windows, FileVault on Mac) and encrypted file sharing services.",
      "Review who has access to shared folders regularly so old permissions do not become a quiet risk. Remove access for people who no longer need it, especially when projects end or colleagues leave."
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
      "social engineering": 5,
      "pretexting": 4,
      "vishing": 4,
      "voice call": 2,
    },
    response: [
      "Social engineering succeeds by creating pressure and trust, so slow the interaction down and verify the request independently. Real urgency from legitimate sources can wait a few minutes for verification.",
      "Never share passwords, one-time codes, or sensitive details just because someone sounds legitimate or senior. Attackers often impersonate IT support, executives, or vendors to extract information.",
      "For physical spaces, challenge unfamiliar visitors politely and follow badge or escort policies. Someone with a uniform and a badge story may not be who they claim to be."
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
      "lost phone": 4,
      "stolen phone": 4,
      "phone security": 4,
      "mobile security": 4,
      "find my phone": 4,
    },
    response: [
      "Protect phones with a strong device PIN or biometric unlock (fingerprint or face), and keep the operating system and apps updated. Mobile devices are increasingly targeted by attackers.",
      "Install apps only from official stores (Google Play, Apple App Store), review permissions carefully, and disable Bluetooth or hotspot features when unused. Grant only the permissions each app actually needs.",
      "Use remote locate and wipe features so a lost device is less likely to become a data-loss event. Enable 'Find My Device' on Android or 'Find My iPhone' on iOS before you need it."
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
      "hacked account": 5,
      "compromised": 4,
      "virus": 3,
      "trojan": 3,
      "someone clicked": 4,
      "bad link": 4,
    },
    response: [
      "If you suspect compromise, isolate the affected device or account first by disconnecting from the network or changing the password immediately. This prevents the issue from spreading further.",
      "Report the incident quickly to your IT department or relevant authority, preserve evidence such as screenshots or timestamps, and avoid deleting suspicious emails or files before review.",
      "Reset impacted passwords from a known-safe device and monitor for follow-on abuse. Check for unauthorized transactions, new account registrations, or sent messages you did not write."
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
      "best practices": 4,
      "security tips": 4,
      "how to": 2,
    },
    response: [
      "The strongest baseline is simple: update devices promptly, use unique passwords with MFA, and pause before trusting unexpected requests. These three habits stop most attacks.",
      "Back up important data, lock devices when unattended, and keep work and personal accounts separated where possible. Physical security matters as much as digital security.",
      "Security improves most when good habits are repeated consistently, not only after a scary incident. Make security part of your routine rather than something you think about only when something goes wrong."
    ],
    suggestions: ["How do I build strong passwords?", "How do I recognize phishing?", "Start the security quiz"]
  },
  {
    id: "malware",
    label: "Malware Protection",
    keywords: {
      malware: 5,
      virus: 4,
      viruses: 4,
      ransomware: 5,
      trojan: 4,
      worm: 3,
      infected: 4,
      "virus scan": 4,
      "antivirus": 4,
      "malicious": 3,
      "infect": 3,
      "suspicious file": 3,
      "computer slow": 2,
      "popups": 2,
    },
    response: [
      "Malware includes viruses, ransomware, trojans, and other malicious software that can damage your system, steal data, or hold your files hostage. Ransomware has become especially prevalent, encrypting your files and demanding payment.",
      "Keep antivirus software active and updated, and run regular scans. Windows Defender is built into Windows and provides solid protection, but ensure real-time protection is enabled.",
      "If you suspect malware, disconnect from the internet immediately, run a full antivirus scan, and if the infection is severe, consider restoring from a clean backup. Do not pay ransomware demands—there's no guarantee you'll get your files back."
    ],
    suggestions: ["What should I do after malware hits?", "How do I prevent ransomware?", "Start the security quiz"]
  },
  {
    id: "wifi",
    label: "WiFi Security",
    keywords: {
      wifi: 5,
      wlan: 3,
      wireless: 3,
      vpn: 4,
      network: 2,
      hotspot: 4,
      "public wifi": 5,
      "free wifi": 4,
      "coffee shop": 2,
      "airport wifi": 3,
      "unsecure": 2,
      "secure network": 3,
      "home network": 3,
    },
    response: [
      "Public WiFi networks are often unencrypted and can be monitored by anyone nearby. Avoid accessing banking, work accounts, or entering passwords when on public WiFi unless you have a VPN.",
      "Use a reputable VPN when connecting to public networks—it encrypts your traffic so even if someone is watching, they cannot see your activity. Free VPNs often have questionable privacy practices, so choose a trusted paid service.",
      "At home, use WPA3 or WPA2 encryption for your WiFi, change the default router password, and keep router firmware updated. A weak or default WiFi password can let attackers into your entire network."
    ],
    suggestions: ["What is a VPN?", "How do I secure my home network?", "How do I browse safely?"]
  },
  {
    id: "socialmedia",
    label: "Social Media Security",
    keywords: {
      facebook: 3,
      fb: 2,
      instagram: 3,
      twitter: 3,
      x: 2,
      tiktok: 2,
      social: 4,
      socialmedia: 5,
      "social media": 5,
      post: 2,
      privacy: 3,
      "account hacked": 4,
      "fake account": 3,
      "social media privacy": 5,
    },
    response: [
      "Review privacy settings on social media accounts regularly—posts that are public can be seen by anyone, including potential employers, scammers, and identity thieves. Limit what strangers can see.",
      "Be cautious about what you share: avoid posting your address, phone number, vacation plans, or photos that reveal identifying information. Scammers use social media to gather personal details for targeted attacks.",
      "Watch for fake accounts impersonating friends or brands—if someone you know sends a suspicious link or request out of character, their account may be compromised. Report fake profiles to the platform."
    ],
    suggestions: ["How do I protect my privacy?", "What is phishing?", "Check my security habits"]
  },
  {
    id: "updates",
    label: "Software Updates",
    keywords: {
      update: 4,
      updates: 4,
      update: 3,
      patching: 4,
      patch: 4,
      outdated: 3,
      "software update": 4,
      "system update": 4,
      "install update": 4,
      "skip update": 2,
      "postpone update": 2,
    },
    response: [
      "Software updates often include critical security patches for vulnerabilities that attackers actively exploit. Delaying updates leaves your devices exposed—many ransomware attacks target systems with known, unpatched flaws.",
      "Enable automatic updates wherever possible so you don't have to remember to install them. For systems that can't update (like older software), consider isolating them from your main network.",
      "Update browsers, operating systems, and applications promptly. Even seemingly minor updates often address security issues that could be exploited if left unpatched."
    ],
    suggestions: ["Why are updates important?", "How do I enable automatic updates?", "What is patching?"]
  },
  {
    id: "twofactor",
    label: "Two-Factor Authentication",
    keywords: {
      "2fa": 5,
      twofactor: 5,
      "two factor": 5,
      mfa: 4,
      multifactor: 4,
      authenticator: 4,
      "google authenticator": 4,
      "authenticator app": 4,
      sms: 2,
      "verification code": 4,
      "security code": 3,
      "second factor": 4,
      "two-step": 4,
    },
    response: [
      "Two-factor authentication (2FA) adds a second verification step beyond your password. Even if an attacker steals your password, they cannot access your account without the second factor.",
      "Prefer authenticator apps (like Google Authenticator, Authy, or Microsoft Authenticator) over SMS verification—SMS can be intercepted through SIM swapping attacks. Hardware security keys (like YubiKey) provide the strongest protection.",
      "Enable 2FA on your most critical accounts first: email, banking, and any account that holds sensitive personal information. These are the most valuable targets for attackers."
    ],
    suggestions: ["What is the best 2FA method?", "How do I set up 2FA?", "Why use an authenticator app?"]
  },
  {
    id: "remote",
    label: "Remote Work Security",
    keywords: {
      remote: 4,
      wfh: 4,
      "work from home": 4,
      "working from home": 4,
      "home office": 3,
      "remote work": 4,
      vpn: 3,
      "work laptop": 3,
      "personal device": 2,
    },
    response: [
      "When working from home, always use your organization's VPN when accessing work resources. This encrypts your connection and protects sensitive company data from being intercepted.",
      "Keep your work and personal activities separated—use your work laptop only for work tasks, and avoid letting family members use it. Personal devices may not have the same security controls.",
      "Lock your screen when stepping away, even at home. A quick walk to the kitchen or bathroom is enough time for someone to access your work accounts if left unlocked."
    ],
    suggestions: ["How do I secure my home office?", "What is a work VPN?", "Security checklist for remote work"]
  },
  {
    id: "cloud",
    label: "Cloud Storage Security",
    keywords: {
      onedrive: 4,
      "one drive": 4,
      "google drive": 4,
      dropbox: 4,
      icloud: 4,
      cloud: 4,
      "cloud storage": 5,
      "file sharing": 3,
      "shared folder": 3,
      "sync": 2,
    },
    response: [
      "Cloud storage services like OneDrive, Google Drive, and Dropbox are convenient but introduce security considerations. Enable two-factor authentication on your cloud accounts and review active sessions regularly.",
      "Be careful when sharing files—use expiry dates for shared links and avoid making files publicly accessible unless necessary. Check who has access to shared folders and remove unnecessary collaborators.",
      "Understand that cloud storage can be accessed if your password is compromised. Use a strong, unique password and enable alerts for new device logins to catch unauthorized access quickly."
    ],
    suggestions: ["How do I secure my cloud storage?", "Is my cloud safe?", "Best practices for file sharing"]
  },
  {
    id: "browser",
    label: "Browser Security",
    keywords: {
      extension: 4,
      extensions: 4,
      cookie: 3,
      cookies: 3,
      "private browsing": 4,
      incognito: 3,
      "browsing history": 2,
      "clear cache": 3,
      "ad blocker": 4,
      "malicious extension": 4,
    },
    response: [
      "Browser extensions can read and modify web page content, so only install extensions from trusted developers. Review the permissions requested and remove extensions you no longer use.",
      "Use private or incognito mode for sensitive browsing that you don't want saved in history, but remember it doesn't make you anonymous—your activity can still be seen by your ISP and the websites you visit.",
      "Regularly clear your browser cache and cookies to reduce tracking. Consider using an ad blocker to reduce exposure to malicious ads, which are a common vector for malware."
    ],
    suggestions: ["How do I secure my browser?", "Are browser extensions safe?", "How to browse privately"]
  },
  {
    id: "iot",
    label: "Smart Device Security",
    keywords: {
      iot: 4,
      "smart home": 4,
      "smart device": 4,
      thermostat: 2,
      camera: 3,
      "security camera": 4,
      "smart tv": 3,
      "internet of things": 4,
      "connected device": 3,
      "device security": 3,
    },
    response: [
      "Smart devices (cameras, thermostats, TVs) often have weak security by default. Change default passwords immediately, enable automatic updates, and research the manufacturer's security reputation before buying.",
      "Place IoT devices on a separate network from your main computers—this limits damage if a device is compromised. Many routers support guest or IoT network features.",
      "Disable features you don't use, like remote access or voice assistants, to reduce the attack surface. Review privacy settings on smart devices and limit what data they collect."
    ],
    suggestions: ["How do I secure my smart home?", "Are smart cameras safe?", "IoT security tips"]
  }
];

const quizCategories = [
  {
    id: "general",
    name: "General Security",
    description: "Test your overall cybersecurity habits",
    questions: [
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
      }
    ]
  },
  {
    id: "phishing",
    name: "Phishing Awareness",
    description: "Test your ability to spot phishing attempts",
    questions: [
      {
        question: "What do you do when you receive an unexpected email asking for personal information?",
        options: [
          { label: "I verify by contacting the company directly through official channels", score: 2 },
          { label: "I check if the email looks legitimate before responding", score: 1 },
          { label: "I respond if it seems important", score: 0 }
        ]
      },
      {
        question: "How do you handle links in suspicious emails?",
        options: [
          { label: "I never click, I go directly to the website instead", score: 2 },
          { label: "I hover over them to check the URL first", score: 1 },
          { label: "I click if the subject line looks urgent", score: 0 }
        ]
      },
      {
        question: "What red flags do you look for in emails?",
        options: [
          { label: "Mismatched sender addresses, urgent language, and requests for credentials", score: 2 },
          { label: "Poor grammar and suspicious links", score: 1 },
          { label: "I don't really check for red flags", score: 0 }
        ]
      },
      {
        question: "If you receive an invoice you weren't expecting, what do you do?",
        options: [
          { label: "Verify with the sender through a different channel before opening", score: 2 },
          { label: "Check if I recognize the company first", score: 1 },
          { label: "Open it to see what it is", score: 0 }
        ]
      },
      {
        question: "How do you handle urgent emails demanding immediate action?",
        options: [
          { label: "I slow down and verify through official channels", score: 2 },
          { label: "I check if it's from someone I know", score: 1 },
          { label: "I act immediately because it seems important", score: 0 }
        ]
      }
    ]
  },
  {
    id: "password",
    name: "Password Security",
    description: "Test your password habits",
    questions: [
      {
        question: "How do you create passwords for important accounts?",
        options: [
          { label: "I use a unique passphrase for each account stored in a password manager", score: 2 },
          { label: "I create variations of the same password", score: 1 },
          { label: "I use the same password for most accounts", score: 0 }
        ]
      },
      {
        question: "What makes a strong password in your opinion?",
        options: [
          { label: "Long, unique phrases with special characters", score: 2 },
          { label: "A mix of letters, numbers, and symbols", score: 1 },
          { label: "Something easy to remember", score: 0 }
        ]
      },
      {
        question: "How do you store your passwords?",
        options: [
          { label: "Password manager", score: 2 },
          { label: "Written in a secure place or browser", score: 1 },
          { label: "In my head or on a note", score: 0 }
        ]
      },
      {
        question: "When should you change your password?",
        options: [
          { label: "When there's a breach or suspicious activity", score: 2 },
          { label: "Every 6-12 months routinely", score: 1 },
          { label: "Only when I can't log in", score: 0 }
        ]
      },
      {
        question: "What's your approach to password recovery questions?",
        options: [
          { label: "I use unique answers that aren't related to the real information", score: 2 },
          { label: "I give accurate but not easily guessable answers", score: 1 },
          { label: "I use real information that's easy to remember", score: 0 }
        ]
      }
    ]
  },
  {
    id: "mobile",
    name: "Mobile Security",
    description: "Test your mobile device security habits",
    questions: [
      {
        question: "How do you protect your phone from unauthorized access?",
        options: [
          { label: "Strong PIN/biometric and auto-lock enabled", score: 2 },
          { label: "PIN but sometimes I leave it unlocked", score: 1 },
          { label: "I don't use a lock", score: 0 }
        ]
      },
      {
        question: "Where do you install apps from?",
        options: [
          { label: "Only official app stores (Play Store, App Store)", score: 2 },
          { label: "Mostly official stores, occasionally APKs", score: 1 },
          { label: "I download from any website", score: 0 }
        ]
      },
      {
        question: "What do you do with apps you no longer use?",
        options: [
          { label: "I delete them and review permissions regularly", score: 2 },
          { label: "I delete them but don't check permissions", score: 1 },
          { label: "I just leave them on my phone", score: 0 }
        ]
      },
      {
        question: "How do you handle public WiFi on your phone?",
        options: [
          { label: "I use a VPN when on public networks", score: 2 },
          { label: "I'm careful but don't always use a VPN", score: 1 },
          { label: "I use it normally without precautions", score: 0 }
        ]
      },
      {
        question: "If your phone was lost/stolen, what would happen?",
        options: [
          { label: "I can remotely locate and wipe it", score: 2 },
          { label: "I could try to find it but can't wipe it", score: 1 },
          { label: "I'd lose all my data", score: 0 }
        ]
      }
    ]
  },
  {
    id: "socialmedia",
    name: "Social Media Security",
    description: "Test your social media privacy habits",
    questions: [
      {
        question: "Who can see your social media posts?",
        options: [
          { label: "Only friends, with privacy settings regularly reviewed", score: 2 },
          { label: "Friends of friends or public to some extent", score: 1 },
          { label: "Everyone/public", score: 0 }
        ]
      },
      {
        question: "What personal information do you share online?",
        options: [
          { label: "Minimal - no address, phone, or vacation plans", score: 2 },
          { label: "Some basic info but not sensitive details", score: 1 },
          { label: "I share a lot of personal information", score: 0 }
        ]
      },
      {
        question: "How do you handle friend requests from people you don't know?",
        options: [
          { label: "I decline - only connect with people I know", score: 2 },
          { label: "I check their profile before deciding", score: 1 },
          { label: "I accept most requests", score: 0 }
        ]
      },
      {
        question: "Do you use different passwords for different social media accounts?",
        options: [
          { label: "Yes, each has a unique password", score: 2 },
          { label: "Some are the same, some different", score: 1 },
          { label: "I use the same password for all", score: 0 }
        ]
      },
      {
        question: "What do you do with suspicious messages from friends?",
        options: [
          { label: "Verify through another channel - could be a hacked account", score: 2 },
          { label: "Ask them about it in the chat", score: 1 },
          { label: "Click the link if it looks interesting", score: 0 }
        ]
      }
    ]
  },
  {
    id: "wifi",
    name: "WiFi & Network Security",
    description: "Test your wireless security habits",
    questions: [
      {
        question: "What do you do when connecting to public WiFi?",
        options: [
          { label: "I always use a VPN", score: 2 },
          { label: "I'm careful about what I access", score: 1 },
          { label: "I use it normally for everything", score: 0 }
        ]
      },
      {
        question: "How secure is your home WiFi?",
        options: [
          { label: "WPA3/WPA2 with a strong unique password", score: 2 },
          { label: "WPA2 but default or weak password", score: 1 },
          { label: "WEP or no password", score: 0 }
        ]
      },
      {
        question: "Do you change your router's default admin credentials?",
        options: [
          { label: "Yes, immediately after setup", score: 2 },
          { label: "I planned to but haven't yet", score: 1 },
          { label: "No, I use the defaults", score: 0 }
        ]
      },
      {
        question: "When working remotely, how do you access company resources?",
        options: [
          { label: "Always through the company VPN", score: 2 },
          { label: "Usually, but not always", score: 1 },
          { label: "I just connect directly", score: 0 }
        ]
      },
      {
        question: "What do you do with unknown USB drives you find?",
        options: [
          { label: "Never plug them in - could be malicious", score: 2 },
          { label: "Scan with antivirus first", score: 1 },
          { label: "Plug in to see what's on them", score: 0 }
        ]
      }
    ]
  }
];

const quizQuestions = quizCategories.reduce((all, cat) => {
  return all.concat(cat.questions);
}, []);

const quizState = {
  active: false,
  currentIndex: 0,
  answers: [],
  selectedCategory: null
};

const quizTriggers = ["quiz", "checklist", "assess", "score", "rate my security", "security quiz", "take a quiz", "start quiz", "security checkup", "checkup", "take the quiz", "do a quiz"];
const fallbackSuggestions = ["Strong password tips", "How to report phishing", "Start the security quiz"];
const quizRestartTriggers = ["restart quiz", "retake quiz", "start quiz again", "start again"];
const greetingTriggers = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings", "good day"];
const helpTriggers = ["help", "assist", "support", "what can you do", "what do you do", "what can you help with"];
const thanksTriggers = ["thanks", "thank you", "appreciate it", "thx", "ty"];
const identityTriggers = ["who are you", "what are you", "are you a bot", "are you chatbot", "what is cybershield", "introduce yourself"];
const forgotPasswordTriggers = ["forgot password", "forgot my password", "forgotten password", "can't access my account", "lost my password", "password reset help"];
const hackedTriggers = ["hacked", "account hacked", "my account was hacked", "someone hacked", "got hacked", "compromised account", "someone got into my account"];
const clickedBadLinkTriggers = ["clicked bad link", "clicked suspicious link", "clicked wrong link", "clicked on phishing", "opened bad link", "opened suspicious link"];
const isEmailSafeTriggers = ["is this safe", "is this legitimate", "is this real", "is this email safe", "check this email", "verify this email", "is this a scam"];
const tipTriggers = ["tip", "did you know", "fun fact", "security tip", "give me a tip"];
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
  [/\banti[\s-]?virus\b/g, "antivirus"],
  [/\bvpn\b/g, "vpn"],
  [/\bmfa\b/g, "mfa"],
  [/\bsecurity code\b|\bverification code\b/g, "verification code"],
  [/\bhome network\b/g, "home network"],
  [/\bpublic network\b/g, "public wifi"],
  [/\bfree wifi\b/g, "public wifi"],
  [/\bwireless\b/g, "wifi"],
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

function scrollChatToBottom(force = false) {
  if (force || isAtBottom) {
    isAtBottom = true;
    if (scrollDownButton) {
      scrollDownButton.classList.remove("is-visible");
    }
    // Multiple attempts to ensure scroll happens after content renders
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 250);
    }
  }
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
}

function storeCurrentSessionNodes() {
  const activeSession = getSessionById(activeSessionId);
  if (!activeSession) {
    return;
  }

  // Store message data instead of DOM elements (they can't be serialized)
  const messages = [];
  chatMessages.querySelectorAll(".message").forEach((msg) => {
    const role = msg.classList.contains("user") ? "user" : "bot";
    const bubble = msg.querySelector(".message-bubble");
    if (!bubble) return;
    
    const paragraphs = [];
    bubble.querySelectorAll("p").forEach((p) => paragraphs.push(p.textContent));
    
    const suggestions = [];
    bubble.querySelectorAll(".quick-reply").forEach((btn) => suggestions.push(btn.textContent));
    
    const confidenceEl = bubble.querySelector(".confidence-badge");
    const confidence = confidenceEl ? confidenceEl.textContent.replace("Match: ", "") : null;
    
    messages.push({ role, content: paragraphs, suggestions, confidence });
  });
  
  activeSession.messages = messages;
  chatMessages.replaceChildren();
}

function restoreSessionNodes(session) {
  if (!session.messages || !session.messages.length) {
    renderHistory();
    return;
  }
  
  session.messages.forEach((msg) => {
    addMessage(msg.role, msg.content.join("\n"), {
      suggestions: msg.suggestions,
      confidence: msg.confidence
    });
  });
  
  refreshIcons();
  scrollChatToBottom();
  renderHistory();
}

function createSession(title) {
  const session = {
    id: nextSessionId,
    title,
    lastUserPrompt: "",
    nodes: [],
    quizState: {
      active: false,
      currentIndex: 0,
      answers: []
    }
  };

  nextSessionId += 1;
  chatSessions.unshift(session);
  saveSessionsToStorage();
  activeSessionId = session.id;
  currentChatTitle = session.title;
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
  setConversationMode(session.nodes.length > 0);
  restoreSessionNodes(session);
  renderHistory();
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
      deleteSession(session.id);
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

      // Remove all messages after the one being retried
      const existingMessage = container.closest(".message");
      if (existingMessage) {
        let nextSibling = existingMessage.nextElementSibling;
        while (nextSibling) {
          const toRemove = nextSibling;
          nextSibling = nextSibling.nextElementSibling;
          toRemove.remove();
        }
        existingMessage.remove();
      }

      // Reset quiz state if active
      if (quizState.active) {
        quizState.active = false;
        quizState.currentIndex = 0;
        quizState.answers = [];
      }

      addBotMessageWithDelay(() => {
        const reply = getBotReply(lastUserPrompt);
        if (reply.type === "quiz-start") {
          startQuizFlow(false);
          return;
        }

        addMessage("bot", reply.response, {
          suggestions: reply.suggestions,
          confidence: reply.confidence
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

function addMessage(role, content, options = {}) {
  const messageElement = createMessageElement(role);
  const bubble = messageElement.querySelector(".message-bubble");
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

  if (options.confidence && role === "bot") {
    const confidenceBadge = document.createElement("div");
    confidenceBadge.className = "confidence-badge";
    confidenceBadge.textContent = `Match: ${options.confidence}`;
    bubble.appendChild(confidenceBadge);
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

  chatMessages.appendChild(messageElement);
  syncActiveSessionState();
  refreshIcons();
  scrollChatToBottom(true);
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
  const greetingSets = [
    [
      "Hi, I'm CyberShield, your cybersecurity FAQ assistant.",
      "I can give quick, practical answers on phishing, passwords, safe browsing, mobile security, incidents, and practical everyday protection.",
      "Ask me something specific like \"How do I spot phishing emails?\" or use one of the suggested prompts below."
    ],
    [
      "Hello! I'm CyberShield, here to help with cybersecurity questions.",
      "I cover topics like password safety, phishing detection, safe browsing, mobile security, and more.",
      "Try asking \"How do I spot phishing emails?\" or click one of the suggestions below."
    ],
    [
      "Welcome! I'm your cybersecurity assistant, CyberShield.",
      "I can help you understand phishing, passwords, device security, and everyday protection practices.",
      "Feel free to ask questions like \"What makes a strong password?\" or use the quick options below."
    ],
    [
      "Hey there! I'm CyberShield, ready to answer your security questions.",
      "From spotting phishing to securing your devices, I've got practical advice to share.",
      "Ask me anything about cybersecurity or pick a topic from the suggestions."
    ]
  ];
  const selected = greetingSets[Math.floor(Math.random() * greetingSets.length)];
  return {
    response: selected,
    suggestions: ["How do I spot phishing emails?", "Strong password tips", "Start the security quiz"],
    confidence: "greeting pattern match"
  };
}

function buildHelpResponse() {
  return {
    response: [
      "I'm built to answer common cybersecurity FAQs with short, practical guidance.",
      "You can ask about password safety, phishing, suspicious links, phone security, data protection, software updates, social media privacy, WiFi security, remote work safety, and what to do after a possible breach.",
      "If you want a broader check, I can also run a quick security quiz and give recommendations."
    ],
    suggestions: ["Password security tips", "How do I report phishing?", "Start the security quiz"],
    confidence: "help keyword match"
  };
}

function buildThanksResponse() {
  const thanksSets = [
    [
      "You're welcome.",
      "If you want, keep going with another cybersecurity question and I'll stay focused on practical next steps."
    ],
    [
      "Happy to help!",
      "Let me know if you have more security questions or want to take the security quiz."
    ],
    [
      "No problem!",
      "Stay safe online! Feel free to ask more questions whenever you're ready."
    ],
    [
      "Anytime!",
      "Cybersecurity is important, so I'm glad to help. Keep those questions coming!"
    ]
  ];
  const selected = thanksSets[Math.floor(Math.random() * thanksSets.length)];
  return {
    response: selected,
    suggestions: ["How can I browse safely?", "What should I do after a breach?", "Check my security habits"],
    confidence: "thanks keyword match"
  };
}

function buildIdentityResponse() {
  return {
    response: [
      "I'm CyberShield, a rule-based cybersecurity FAQ chatbot for this school project.",
      "I answer common questions about phishing, passwords, mobile safety, safe browsing, incident response, malware, WiFi security, social media privacy, software updates, 2FA, remote work security, and basic security habits.",
      "I'm not a live human analyst, but I can give quick, practical guidance and run the built-in security checkup quiz."
    ],
    suggestions: ["How do I spot phishing emails?", "What can you help me with?", "Start the security quiz"],
    confidence: "identity keyword match"
  };
}

function buildForgotPasswordResponse() {
  return {
    response: [
      "If you've forgotten your password, most services have a 'Forgot Password' link on their login page to reset it. Use this rather than trying to guess or reuse old passwords.",
      "Before resetting, check that the email requesting your password change is legitimate—attackers often send fake password reset emails to steal credentials.",
      "Once you regain access, enable two-factor authentication to prevent future lockouts. Consider using a password manager to remember passwords securely."
    ],
    suggestions: ["How do I create strong passwords?", "What is 2FA?", "How do I spot phishing emails?"],
    confidence: "forgot password keyword match"
  };
}

function buildHackedResponse() {
  return {
    response: [
      "If you think your account was hacked, act quickly: change your password immediately from a different device, then enable two-factor authentication if not already active.",
      "Check your account for any unauthorized changes—review recent login activity, security settings, forwarded emails, or sent messages that weren't from you.",
      "Report the compromise to the service provider (many have dedicated security pages), and if financial information was exposed, contact your bank. Run a full virus scan on your devices."
    ],
    suggestions: ["What should I do after a breach?", "How do I secure my accounts?", "Start the security quiz"],
    confidence: "hacked keyword match"
  };
}

function buildClickedBadLinkResponse() {
  return {
    response: [
      "If you clicked a suspicious link, stop interacting with the page immediately. Do not enter any information, download files, or click further links.",
      "Disconnect from the internet if possible to prevent potential data exfiltration. Run a full antivirus scan on your device to check for malware.",
      "If you entered credentials on the fake site, change those passwords immediately from a clean device. Monitor your accounts for unusual activity in the following weeks."
    ],
    suggestions: ["What should I do after malware hits?", "How do I spot phishing emails?", "What is malware?"],
    confidence: "clicked bad link keyword match"
  };
}

function buildIsEmailSafeResponse() {
  return {
    response: [
      "To check if an email is safe, look for: mismatched sender addresses (the visible name doesn't match the actual email), urgency or threats, requests for personal information, and suspicious links or attachments.",
      "Hover over links to see the actual URL before clicking—if it looks strange or uses a different domain than the supposed sender, don't click.",
      "When in doubt, contact the sender through a different channel (call them or use their official website) to verify the email is legitimate."
    ],
    suggestions: ["How do I spot phishing emails?", "How do I report phishing?", "What is phishing?"],
    confidence: "is email safe keyword match"
  };
}

function buildEncouragementResponse() {
  return {
    response: [
      "Great question! Asking about security shows you care about protecting yourself online.",
      "Small consistent actions—like updating software, using unique passwords, and thinking before clicking—make a big difference over time.",
      "Keep learning and stay curious about security. You're building habits that will serve you well."
    ],
    suggestions: ["How do I spot phishing emails?", "Give me a security checklist", "Start the security quiz"],
    confidence: "encouragement pattern"
  };
}

const securityTips = [
  "Using a password manager reduces the risk of password reuse and makes it easy to use unique, strong passwords for every account.",
  "Most data breaches start with a phishing email—learning to spot red flags is one of the most valuable security skills.",
  "Enable automatic software updates so you don't have to remember to patch critical vulnerabilities.",
  "Using a VPN on public WiFi encrypts your traffic and protects sensitive data from potential eavesdroppers.",
  "Two-factor authentication (2FA) can stop most account takeovers even if your password gets compromised.",
  "Regularly backing up your files using the 3-2-1 rule protects you from both hardware failure and ransomware.",
  "Reviewing app permissions regularly helps limit what data apps can access on your devices.",
  "Using unique passwords for each account prevents a single breach from compromising multiple services.",
  "Checking the URL before entering credentials helps avoid fake login pages used in phishing attacks.",
  "Locking your computer when you step away prevents casual access to your files and accounts."
];

function buildTipResponse() {
  const randomTip = securityTips[Math.floor(Math.random() * securityTips.length)];
  return {
    response: [
      "Here's a security tip:",
      randomTip
    ],
    suggestions: ["Give me another tip", "How do I spot phishing?", "Start the security quiz"],
    confidence: "tip keyword match"
  };
}

function buildFallbackResponse() {
  return {
    response: [
      "I'm not fully sure what you need from that message yet, but I can help with common cybersecurity FAQs.",
      "Try a direct question like \"How do I recognize phishing?\", \"How do I protect my phone?\", or \"What should I do after a breach?\"",
      "You can also start the security quiz if you want a broader checkup."
    ],
    suggestions: fallbackSuggestions,
    confidence: "no keyword match (fallback)"
  };
}

const topicToCategoryMap = {
  password: "password",
  phishing: "phishing",
  mobile: "mobile",
  socialmedia: "socialmedia",
  wifi: "wifi",
  social: "phishing",
  browsing: "general",
  data: "general",
  incident: "general",
  general: "general",
  malware: "general",
  updates: "general",
  twofactor: "password",
  remote: "wifi",
  cloud: "general",
  browser: "general",
  iot: "wifi"
};

function getBotReply(userText) {
  const normalizedInput = sanitizeForMatching(userText);
  const tokens = buildTokenSet(normalizedInput);
  const asksHow = tokens.has("how") || tokens.has("what") || tokens.has("why");
  const hasGreeting = greetingTriggers.some((trigger) => normalizedInput === trigger || normalizedInput.startsWith(`${trigger} `));

  // Check for quiz trigger FIRST - before greeting/thanks can match
  if (
    quizTriggers.some((trigger) => normalizedInput.includes(trigger)) ||
    (tokens.has("checkup") && (tokens.has("security") || tokens.has("cybersecurity")))
  ) {
    return { type: "quiz-start", topic: null };
  }

  if (identityTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildIdentityResponse() };
  }

  if (forgotPasswordTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildForgotPasswordResponse() };
  }

  if (hackedTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildHackedResponse() };
  }

  if (clickedBadLinkTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildClickedBadLinkResponse() };
  }

  if (isEmailSafeTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildIsEmailSafeResponse() };
  }

  if (tipTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    return { type: "faq", ...buildTipResponse() };
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

  if (asksHow && tokens.has("password")) {
    const topic = getTopicById("password");
    lastMatchedTopic = "password";
    return { type: "faq", response: topic.response, suggestions: topic.suggestions, confidence: "keyword match: password" };
  }

  if ((tokens.has("phishing") || tokens.has("scam")) && (tokens.has("email") || tokens.has("emails") || tokens.has("message") || tokens.has("messages") || tokens.has("sms"))) {
    const topic = getTopicById("phishing");
    lastMatchedTopic = "phishing";
    return { type: "faq", response: topic.response, suggestions: topic.suggestions, confidence: "keyword match: phishing + email" };
  }

  const matchedTopic = findBestTopic(normalizedInput);
  if (!matchedTopic) {
    lastMatchedTopic = null;
    return { type: "faq", ...buildFallbackResponse() };
  }

  lastMatchedTopic = matchedTopic.id;
  return {
    type: "faq",
    response: matchedTopic.response,
    suggestions: matchedTopic.suggestions,
    confidence: `matched keywords: ${Object.keys(matchedTopic.keywords).slice(0, 3).join(", ")}`
  };
}

function resetQuizState() {
  quizState.active = true;
  quizState.currentIndex = 0;
  quizState.answers = [];
  quizState.selectedCategory = null;
}

function buildQuizQuestionCard() {
  const currentCategory = quizCategories[quizState.selectedCategory] || quizCategories[0];
  const categoryQuestions = currentCategory.questions;
  const questionIndex = quizState.currentIndex;
  
  const question = categoryQuestions[questionIndex];
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-card";

  const meta = document.createElement("div");
  meta.className = "quiz-meta";
  meta.innerHTML = `<span>${currentCategory.name}</span><span>Question ${questionIndex + 1} of ${categoryQuestions.length}</span>`;
  wrapper.appendChild(meta);

  const progress = document.createElement("div");
  progress.className = "quiz-progress";
  const progressBar = document.createElement("div");
  progressBar.className = "quiz-progress-bar";
  progressBar.style.width = `${((questionIndex + 1) / categoryQuestions.length) * 100}%`;
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
      quizState.answers.push(option.score);
      
      // Find and remove the current quiz card message
      const currentQuizMessage = wrapper.closest(".message");
      if (currentQuizMessage) {
        currentQuizMessage.remove();
      }
      
      quizState.currentIndex += 1;
      if (quizState.currentIndex < categoryQuestions.length) {
        addBotMessageWithDelay(() => {
          addMessage("bot", buildQuizQuestionCard());
        });
      } else {
        quizState.active = false;
        addBotMessageWithDelay(() => {
          addMessage("bot", buildQuizResultsCard(), {
            suggestions: ["Restart quiz", "Password security tips", "How do I report phishing?"]
          });
        });
      }
      scrollChatToBottom(true);
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
  const category = quizCategories[quizState.selectedCategory] || quizCategories[0];
  const categoryQuestions = category.questions;
  
  const totalScore = quizState.answers.reduce((sum, score) => sum + score, 0);
  const maxScore = categoryQuestions.length * 2;
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
  title.textContent = `${category.name}: ${headline}`;
  wrapper.appendChild(title);

  const badge = document.createElement("div");
  badge.className = `score-pill ${scoreBand}`;
  badge.textContent = `Score: ${totalScore}/${maxScore} (${percentage}%)`;
  wrapper.appendChild(badge);

  const summary = document.createElement("p");
  summary.textContent =
    scoreBand === "high"
      ? "You already cover the main defensive habits for this topic. Keep refining your practices."
      : scoreBand === "medium"
        ? "Your security knowledge for this topic is improving, but there's room for improvement."
        : "You have opportunities to strengthen your security habits in this area.";
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

function buildQuizCategoryCard() {
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-card";

  const meta = document.createElement("div");
  meta.className = "quiz-meta";
  meta.innerHTML = `<span>Security Checkup</span><span>Choose a category</span>`;
  wrapper.appendChild(meta);

  const prompt = document.createElement("p");
  prompt.className = "quiz-question";
  prompt.textContent = "Select a topic to test your security knowledge:";
  wrapper.appendChild(prompt);

  const options = document.createElement("div");
  options.className = "quiz-options quiz-category-grid";

  quizCategories.forEach((category, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-category-btn";
    button.innerHTML = `<span class="category-name">${category.name}</span><span class="category-desc">${category.questions.length} questions</span>`;
    button.addEventListener("click", () => {
      quizState.selectedCategory = index;
      quizState.currentIndex = 0;
      quizState.answers = [];
      
      // Remove the category selection card
      const currentMessage = wrapper.closest(".message");
      if (currentMessage) {
        currentMessage.remove();
      }
      
      addBotMessageWithDelay(() => {
        addMessage("bot", [
          `Great choice! Let's test your ${category.name} knowledge.`,
          "Answer each question based on your actual habits."
        ]);
        addMessage("bot", buildQuizQuestionCard());
      });
    });
    options.appendChild(button);
  });

  wrapper.appendChild(options);
  return wrapper;
}

function startQuizFlow(fromMenu = false) {
  resetQuizState();
  
  // Hide hero section without setting conversation mode
  workspace.classList.add("chat-started");
  
  // Clear any existing quiz/score cards before starting fresh
  chatMessages.querySelectorAll(".message").forEach((msg) => {
    const bubble = msg.querySelector(".message-bubble");
    if (bubble && (bubble.querySelector(".quiz-card") || bubble.querySelector(".score-card"))) {
      msg.remove();
    }
  });

  // If triggered from menu, show category selection
  // If triggered after a topic question, use that topic
  if (fromMenu) {
    addBotMessageWithDelay(() => {
      addMessage("bot", [
        "Let's run a security checkup!",
        "Choose a category below to test your knowledge."
      ]);
      addMessage("bot", buildQuizCategoryCard());
    });
    return;
  }

  // Use last matched topic if available
  const suggestedCategoryId = topicToCategoryMap[lastMatchedTopic];
  let suggestedCategoryIndex = 0;
  
  if (suggestedCategoryId) {
    suggestedCategoryIndex = quizCategories.findIndex(c => c.id === suggestedCategoryId);
    if (suggestedCategoryIndex === -1) suggestedCategoryIndex = 0;
  }

  const suggestedCategory = quizCategories[suggestedCategoryIndex];
  
  addBotMessageWithDelay(() => {
    addMessage("bot", [
      `Great! Let's test your ${suggestedCategory.name} knowledge.`,
      "Answer each question based on your actual habits."
    ]);
    quizState.selectedCategory = suggestedCategoryIndex;
    quizState.currentIndex = 0;
    quizState.answers = [];
    addMessage("bot", buildQuizQuestionCard());
  });
}

function addBotMessageWithDelay(callback) {
  const typingMessage = addTypingIndicator();
  const timeoutId = window.setTimeout(() => {
    pendingBotTimeouts = pendingBotTimeouts.filter((id) => id !== timeoutId);
    typingMessage.remove();
    callback();
    setTimeout(() => scrollChatToBottom(true), 10);
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
  
  createSession("New conversation");
  renderHistory();
  
  chatMessages.replaceChildren();
  userInput.value = "";
  lastUserPrompt = "";
  quizState.active = false;
  quizState.currentIndex = 0;
  quizState.answers = [];
  quizState.selectedCategory = null;
  setConversationMode(false);
  userInput.focus();
}

function showConfirmModal(options) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    
    modalTitle.textContent = options.title || "Confirm";
    modalMessage.textContent = options.message || "Are you sure?";
    
    modalConfirm.classList.remove("modal-btn-danger");
    if (options.danger) {
      modalConfirm.classList.add("modal-btn-danger");
      modalConfirm.textContent = options.dangerText || "Delete";
    } else {
      modalConfirm.textContent = options.confirmText || "Confirm";
    }
    
    modalConfirm.onclick = () => {
      confirmModal.close();
      modalResolve(true);
    };
    
    modalCancel.onclick = () => {
      confirmModal.close();
      modalResolve(false);
    };
    
    confirmModal.onclose = () => {
      if (modalResolve) {
        modalResolve(false);
        modalResolve = null;
      }
    };
    
    confirmModal.showModal();
  });
}

function deleteSession(sessionId) {
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) return;
  
  showConfirmModal({
    title: "Delete Chat",
    message: `Delete "${session.title}"?\n\nThis chat will be permanently removed.`,
    danger: true,
    dangerText: "Delete"
  }).then((confirmed) => {
    if (!confirmed) return;
    
    cancelPendingBotResponses();

    const sessionIndex = chatSessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      return;
    }

    chatSessions.splice(sessionIndex, 1);
    saveSessionsToStorage();

    const isActiveSession = activeSessionId === sessionId;
    if (!isActiveSession) {
      renderHistory();
      return;
    }

    const nextSession = chatSessions[0] || null;
    if (!nextSession) {
      resetToBlankComposer();
      return;
    }

    activeSessionId = null;
    openSession(nextSession.id);
  });
}

function clearAllSessions() {
  if (chatSessions.length === 0) return;
  
  showConfirmModal({
    title: "⚠️ Delete All Chats",
    message: "This action CANNOT be undone!\n\nAll your chat history will be permanently deleted and cannot be recovered.\n\nAre you absolutely sure you want to continue?",
    danger: true,
    dangerText: "Delete All"
  }).then((confirmed) => {
    if (!confirmed) return;
    
    cancelPendingBotResponses();
    chatSessions.splice(0, chatSessions.length);
    clearSessionsFromStorage();
    resetToBlankComposer();
  });
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
    const activeSession = getSessionById(activeSessionId);
    if (activeSession && activeSession.title === "New conversation") {
      currentChatTitle = summarizeChatTitle(trimmedInput);
      activeSession.title = currentChatTitle;
      currentChatTitle = activeSession.title;
      saveSessionsToStorage();
    } else {
      currentChatTitle = summarizeChatTitle(trimmedInput);
      createSession(currentChatTitle);
    }
    renderHistory();
  }

  setConversationMode(true);
  lastUserPrompt = trimmedInput;
  addMessage("user", trimmedInput);
  userInput.value = "";

  if (quizState.active && quizRestartTriggers.some((trigger) => normalizedInput.includes(trigger))) {
    // If we have a selected category, restart that; otherwise go to menu
    if (quizState.selectedCategory !== null && quizState.selectedCategory !== undefined) {
      startQuizFlow(false);
    } else {
      startQuizFlow(true);
    }
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
    startQuizFlow(false);
    return;
  }

  addBotMessageWithDelay(() => {
    addMessage("bot", reply.response, {
      suggestions: reply.suggestions,
      confidence: reply.confidence
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
    // Handle quiz menu trigger separately
    if (button.dataset.quizMenu === "true") {
      setConversationMode(true);
      startNewConversation();
      setTimeout(() => {
        startQuizFlow(true);
      }, 100);
      appShell.classList.remove("sidebar-open");
      syncNavigationState();
      return;
    }
    
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
    clearAllSessions();
  });
}

if (newChatButton) {
  newChatButton.addEventListener("click", () => {
    startNewConversation();
  });
}

if (chatMessages && scrollDownButton) {
  chatMessages.addEventListener("scroll", () => {
    const scrollBottom = chatMessages.scrollTop + chatMessages.clientHeight;
    const atBottom = scrollBottom >= chatMessages.scrollHeight - 30;
    if (atBottom) {
      isAtBottom = true;
      scrollDownButton.classList.remove("is-visible");
    } else {
      isAtBottom = false;
      scrollDownButton.classList.add("is-visible");
    }
  });
  
  scrollDownButton.addEventListener("click", () => {
    scrollChatToBottom(true);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey) {
    if (event.key === "n" || event.key === "N") {
      event.preventDefault();
      startNewConversation();
    }
    if (event.key === "k" || event.key === "K") {
      event.preventDefault();
      userInput.focus();
    }
  }
  
  if (event.key === "Escape" && appShell.classList.contains("sidebar-open")) {
    appShell.classList.remove("sidebar-open");
    syncNavigationState();
  }
});

syncNavigationState();
renderHistory();
refreshIcons();

if (appSkeleton) {
  window.setTimeout(() => {
    appSkeleton.classList.add("is-hidden");
  }, 850);
}

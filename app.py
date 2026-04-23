"""
CyberShield FAQ Bot - Flask Backend
Rule-based cybersecurity FAQ chatbot API

Deployment: Render.com (or any WSGI host)
"""

import os
import json
import re
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

# ============================================================================
# CONFIGURATION
# ============================================================================

DATA_DIR = Path("data")
CHATS_FILE = DATA_DIR / "chats.json"
os.makedirs(DATA_DIR, exist_ok=True)

# ============================================================================
# FLASK APP
# ============================================================================

app = Flask(__name__)
CORS(app)

# ============================================================================
# PERSISTENT STORAGE
# ============================================================================

def load_chats():
    """Load chats from JSON file."""
    try:
        if CHATS_FILE.exists():
            with open(CHATS_FILE, 'r') as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {"sessions": []}
        return {"sessions": []}
    except (json.JSONDecodeError, IOError):
        return {"sessions": []}

def save_chats(data):
    """Save chats to JSON file."""
    try:
        with open(CHATS_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except IOError as e:
        print(f"Error saving chats: {e}")
        return False

def add_chat_message(session_id, role, content, suggestions=None):
    """Add a message to a chat session."""
    data = load_chats()
    
    if "sessions" not in data:
        data["sessions"] = []
    
    # Find or create session
    session = None
    for s in data["sessions"]:
        if s["id"] == session_id:
            session = s
            break
    
    if not session:
        session = {
            "id": session_id,
            "title": content[:50] + "..." if len(content) > 50 else content,
            "created_at": datetime.now().isoformat(),
            "messages": [],
            "quiz_state": {"active": False, "index": 0, "answers": []}
        }
        data["sessions"].insert(0, session)
    
    # Add message
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.now().isoformat()
    }
    if suggestions:
        message["suggestions"] = suggestions
    
    session["messages"].append(message)
    session["updated_at"] = datetime.now().isoformat()
    
    # Limit stored messages per session (keep last 100)
    if len(session["messages"]) > 100:
        session["messages"] = session["messages"][-100:]
    
    # Limit total sessions (keep last 50)
    if len(data["sessions"]) > 50:
        data["sessions"] = data["sessions"][:50]
    
    return save_chats(data)

def get_chat_history():
    """Get list of all chat sessions (for sidebar)."""
    data = load_chats()
    sessions = data.get("sessions", [])
    return [
        {
            "id": s["id"],
            "title": s.get("title", "Untitled"),
            "created_at": s.get("created_at", ""),
            "message_count": len(s.get("messages", []))
        }
        for s in sessions
    ]

def get_chat_session(session_id):
    """Get full chat session with messages."""
    data = load_chats()
    for session in data.get("sessions", []):
        if session["id"] == session_id:
            return session
    return None

def delete_chat_session(session_id):
    """Delete a chat session."""
    data = load_chats()
    original_len = len(data["sessions"])
    data["sessions"] = [s for s in data["sessions"] if s["id"] != session_id]
    
    if len(data["sessions"]) < original_len:
        return save_chats(data)
    return False

def clear_all_chats():
    """Delete all chat sessions."""
    return save_chats({"sessions": []})

# ============================================================================
# FAQ TOPICS
# ============================================================================

FAQ_TOPICS = [
    {
        "id": "password",
        "label": "Password Security",
        "keywords": {
            "password": 4, "passwords": 4, "passphrase": 4, "strong": 2,
            "reset": 2, "reuse": 3, "reused": 3, "manager": 3, "vault": 2,
            "multifactor": 3, "mfa": 4, "twofactor": 4, "2fa": 4,
            "login": 2, "credential": 3
        },
        "response": [
            "Use a unique passphrase for every account and store it in a password manager instead of reusing variations.",
            "Turn on MFA wherever possible, especially for email, banking, and admin tools, because it blocks many credential-stuffing attacks.",
            "If you think a password may be exposed, change it immediately and review recent account activity."
        ],
        "suggestions": ["How do I spot phishing emails?", "What should I do after a breach?", "Give me a security checklist"]
    },
    {
        "id": "phishing",
        "label": "Phishing Awareness",
        "keywords": {
            "phishing": 5, "email": 3, "emails": 3, "mailbox": 2, "suspicious": 3,
            "scam": 4, "fake": 2, "sender": 2, "attachment": 3, "link": 3,
            "invoice": 2, "urgent": 2, "impersonation": 4, "spoof": 4
        },
        "response": [
            "Treat unexpected urgency, mismatched sender addresses, and requests for credentials or payments as phishing red flags.",
            "Hover over links before clicking, verify unusual requests through a second channel, and avoid opening unexpected attachments.",
            "If a message feels off, report it instead of interacting with it."
        ],
        "suggestions": ["How can I browse safely?", "How do I report an incident?", "Start the security quiz"]
    },
    {
        "id": "browsing",
        "label": "Safe Browsing",
        "keywords": {
            "browser": 3, "browsing": 4, "browse": 4, "website": 3, "https": 3,
            "download": 3, "downloads": 3, "popup": 2, "wifi": 3, "public": 2,
            "vpn": 2, "certificate": 2, "extension": 2, "ads": 1, "link": 2
        },
        "response": [
            "Keep your browser updated, prefer HTTPS sites, and avoid downloading software or documents from unknown sources.",
            "Be careful on public Wi-Fi and use a trusted VPN when handling sensitive accounts outside secure networks.",
            "Limit browser extensions to reputable tools because extensions can read a surprising amount of data."
        ],
        "suggestions": ["How should I protect my data?", "What about mobile security?", "How do I create strong passwords?"]
    },
    {
        "id": "data",
        "label": "Data Protection",
        "keywords": {
            "data": 4, "backup": 4, "backups": 4, "encrypt": 4, "encryption": 4,
            "privacy": 3, "file": 2, "files": 2, "cloud": 2, "share": 2,
            "storage": 2, "usb": 2, "confidential": 3, "leak": 3
        },
        "response": [
            "Back up important files using the 3-2-1 rule: three copies, two media types, one offline or offsite copy.",
            "Encrypt sensitive devices and documents, and only share confidential data through approved, access-controlled channels.",
            "Review who has access to shared folders regularly so old permissions do not become a quiet risk."
        ],
        "suggestions": ["How do I avoid social engineering?", "What should I do after malware hits?", "Rate my security"]
    },
    {
        "id": "social",
        "label": "Social Engineering",
        "keywords": {
            "social": 4, "engineering": 4, "caller": 2, "call": 2, "phone": 2,
            "impersonate": 4, "impersonation": 4, "tailgating": 4, "badge": 2,
            "trust": 1, "verify": 3, "pressure": 2, "request": 1
        },
        "response": [
            "Social engineering succeeds by creating pressure and trust, so slow the interaction down and verify the request independently.",
            "Never share passwords, one-time codes, or sensitive details just because someone sounds legitimate or senior.",
            "For physical spaces, challenge unfamiliar visitors politely and follow badge or escort policies."
        ],
        "suggestions": ["How do I stay safe on my phone?", "What are general security best practices?", "Give me a checklist"]
    },
    {
        "id": "mobile",
        "label": "Mobile Security",
        "keywords": {
            "mobile": 4, "phone": 3, "device": 2, "android": 3, "iphone": 3,
            "app": 3, "apps": 3, "biometric": 2, "lockscreen": 2, "update": 2,
            "updates": 2, "bluetooth": 2, "sms": 2, "sim": 3, "lost": 2, "wipe": 2
        },
        "response": [
            "Protect phones with a strong device PIN or biometric unlock, and keep the operating system and apps updated.",
            "Install apps only from official stores, review permissions carefully, and disable Bluetooth or hotspot features when unused.",
            "Use remote locate and wipe features so a lost device is less likely to become a data-loss event."
        ],
        "suggestions": ["How do I detect phishing texts?", "What should I do after losing a device?", "Start the security quiz"]
    },
    {
        "id": "incident",
        "label": "Incident Response",
        "keywords": {
            "incident": 5, "breach": 5, "hacked": 4, "attack": 3, "malware": 4,
            "infected": 3, "ransomware": 4, "report": 3, "compromised": 4,
            "suspicious": 2, "stolen": 2, "leak": 3, "urgent": 1, "recovery": 2, "wipe": 1
        },
        "response": [
            "If you suspect compromise, isolate the affected device or account first so the issue does not spread further.",
            "Report the incident quickly, preserve evidence such as screenshots or timestamps, and avoid deleting suspicious emails or files before review.",
            "Reset impacted passwords from a known-safe device and monitor for follow-on abuse."
        ],
        "suggestions": ["How can I protect my data?", "What are the best daily habits?", "Assess my security"]
    },
    {
        "id": "general",
        "label": "General Best Practices",
        "keywords": {
            "security": 2, "safe": 2, "protect": 2, "habits": 3, "basics": 3,
            "best": 3, "practice": 3, "general": 3, "cybersecurity": 2, "cyber": 2, "tips": 3
        },
        "response": [
            "The strongest baseline is simple: update devices promptly, use unique passwords with MFA, and pause before trusting unexpected requests.",
            "Back up important data, lock devices when unattended, and keep work and personal accounts separated where possible.",
            "Security improves most when good habits are repeated consistently, not only after a scary incident."
        ],
        "suggestions": ["How do I build strong passwords?", "How do I recognize phishing?", "Start the security quiz"]
    }
]

# ============================================================================
# QUIZ QUESTIONS
# ============================================================================

QUIZ_QUESTIONS = [
    {"question": "Do you use unique passwords for important accounts?", "options": [
        {"label": "Yes, and I store them in a password manager", "score": 2},
        {"label": "Some are unique, but I still reuse a few", "score": 1},
        {"label": "I mostly reuse the same password", "score": 0}
    ]},
    {"question": "How often do you enable MFA when it is available?", "options": [
        {"label": "Almost always", "score": 2},
        {"label": "Only on a few key accounts", "score": 1},
        {"label": "Rarely or never", "score": 0}
    ]},
    {"question": "What do you do with unexpected links or attachments?", "options": [
        {"label": "Verify first and avoid opening suspicious content", "score": 2},
        {"label": "I open them if they look familiar", "score": 1},
        {"label": "I usually click without checking", "score": 0}
    ]},
    {"question": "How current are your device and app updates?", "options": [
        {"label": "Automatic updates are enabled or I patch quickly", "score": 2},
        {"label": "I update sometimes when I remember", "score": 1},
        {"label": "I often postpone updates for a long time", "score": 0}
    ]},
    {"question": "How do you handle important files or data?", "options": [
        {"label": "I back them up and protect sensitive data", "score": 2},
        {"label": "I back up only a few things", "score": 1},
        {"label": "I do not keep reliable backups", "score": 0}
    ]},
    {"question": "If an account or device seems compromised, what is your first move?", "options": [
        {"label": "Isolate it, report it, and reset from a safe device", "score": 2},
        {"label": "I would probably change a password and hope it is enough", "score": 1},
        {"label": "I am not sure what I would do", "score": 0}
    ]}
]

# ============================================================================
# TRIGGER WORDS
# ============================================================================

QUIZ_TRIGGERS = ["quiz", "checklist", "assess", "score", "rate my security"]
GREETING_TRIGGERS = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
HELP_TRIGGERS = ["help", "assist", "support", "what can you do", "what do you do"]
THANKS_TRIGGERS = ["thanks", "thank you", "appreciate it"]
IDENTITY_TRIGGERS = ["who are you", "what are you", "are you a bot", "are you chatbot", "what is cybershield"]
QUIZ_RESTART_TRIGGERS = ["restart quiz", "retake quiz", "start quiz again", "start again"]

NORMALIZATION_RULES = [
    (r'\bwi[\s-]?fi\b', 'wifi'),
    (r'\bpass[\s-]?word\b', 'password'),
    (r'\bpass[\s-]?phrase\b', 'passphrase'),
    (r'\btwo[\s-]?factor\b', 'twofactor'),
    (r'\bmulti[\s-]?factor\b', 'multifactor'),
    (r'\b2[\s-]?fa\b', '2fa'),
    (r'\bphising\b|\bphishng\b|\bfising\b', 'phishing'),
    (r'\blog[\s-]?in\b', 'login'),
    (r'\bback[\s-]?up\b', 'backup'),
    (r'\bweb[\s-]?site\b', 'website'),
    (r'\bcell[\s-]?phone\b', 'phone'),
    (r'\bsmart[\s-]?phone\b', 'phone'),
    (r'\btext message\b|\btext messages\b', 'sms'),
    (r'\bdata breach\b', 'breach'),
    (r'\bremote wipe\b', 'wipe'),
]

FALLBACK_SUGGESTIONS = ["Strong password tips", "How to report phishing", "Start the security quiz"]

# ============================================================================
# TEXT PROCESSING
# ============================================================================

def sanitize_for_matching(text):
    normalized = text.lower()
    for pattern, replacement in NORMALIZATION_RULES:
        normalized = re.sub(pattern, replacement, normalized)
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

def build_token_set(normalized_text):
    return set(normalized_text.split())

def get_topic_by_id(topic_id):
    for topic in FAQ_TOPICS:
        if topic["id"] == topic_id:
            return topic
    return None

def get_topic_score(topic, normalized_input):
    tokens = build_token_set(normalized_input)
    score = 0
    for keyword, weight in topic["keywords"].items():
        is_phrase = " " in keyword
        has_match = keyword in normalized_input if is_phrase else keyword in tokens
        if has_match:
            score += weight
    return score

def find_best_topic(normalized_input):
    best_topic, best_score = None, 0
    for topic in FAQ_TOPICS:
        score = get_topic_score(topic, normalized_input)
        if score > best_score:
            best_score, best_topic = score, topic
    return best_topic if best_score > 0 else None

# ============================================================================
# RESPONSE BUILDERS
# ============================================================================

def build_greeting_response():
    return {
        "response": [
            "Hi, I'm CyberShield, your cybersecurity FAQ assistant.",
            "I can give quick, practical answers on phishing, passwords, safe browsing, mobile security, incident response, and a short security checkup.",
            "Ask me something specific like \"How do I spot phishing emails?\" or use one of the suggested prompts below."
        ],
        "suggestions": ["How do I spot phishing emails?", "Strong password tips", "Start the security quiz"]
    }

def build_help_response():
    return {
        "response": [
            "I'm built to answer common cybersecurity FAQs with short, practical guidance.",
            "You can ask about password safety, phishing, suspicious links, phone security, data protection, or what to do after a possible breach.",
            "If you want a broader check, I can also run a quick security quiz and give recommendations."
        ],
        "suggestions": ["Password security tips", "How do I report phishing?", "Start the security quiz"]
    }

def build_thanks_response():
    return {
        "response": [
            "You're welcome.",
            "If you want, keep going with another cybersecurity question and I'll stay focused on practical next steps."
        ],
        "suggestions": ["How can I browse safely?", "What should I do after a breach?", "Check my security habits"]
    }

def build_identity_response():
    return {
        "response": [
            "I'm CyberShield, a Python-powered cybersecurity FAQ chatbot for this project.",
            "I answer common questions about phishing, passwords, mobile safety, safe browsing, incident response, and basic security habits.",
            "I'm not a live human analyst, but I can give quick, practical guidance and run the built-in security checkup."
        ],
        "suggestions": ["How do I spot phishing emails?", "What can you help me with?", "Start the security quiz"]
    }

def build_fallback_response():
    return {
        "response": [
            "I'm not fully sure what you need from that message yet, but I can help with common cybersecurity FAQs.",
            "Try a direct question like \"How do I recognize phishing?\", \"How do I protect my phone?\", or \"What should I do after a breach?\"",
            "You can also start the security quiz if you want a broader checkup."
        ],
        "suggestions": FALLBACK_SUGGESTIONS
    }

def build_empty_input_response():
    return {
        "response": [
            "Type a cybersecurity question to get started.",
            "You can ask about phishing, passwords, device safety, or run the built-in security quiz."
        ],
        "suggestions": FALLBACK_SUGGESTIONS
    }

def build_quiz_interrupt_response():
    return {
        "response": [
            "The security checkup is still in progress.",
            "Choose one of the answer buttons on the current question, or type \"restart quiz\" to begin again."
        ],
        "suggestions": ["Restart quiz"]
    }

# ============================================================================
# QUIZ LOGIC
# ============================================================================

def calculate_score_band(total_score, max_score):
    percentage = round((total_score / max_score) * 100)
    if percentage >= 75:
        return "high", "Strong Security Baseline", percentage
    elif percentage >= 45:
        return "medium", "Solid Start With Gaps", percentage
    else:
        return "low", "Needs Immediate Hardening", percentage

def get_quiz_recommendations(score_band):
    if score_band == "high":
        return [
            "Keep that momentum by reviewing account access and backups regularly.",
            "Focus next on spotting more subtle phishing and business email compromise attempts.",
            "Test your recovery plan so you know what to do before an incident happens."
        ]
    elif score_band == "medium":
        return [
            "Prioritize MFA on email and finance-related accounts first.",
            "Move reused passwords into a password manager over the next few days.",
            "Turn on automatic updates and confirm you have at least one reliable backup."
        ]
    else:
        return [
            "Start with the highest-impact fixes: unique passwords, MFA, and software updates.",
            "Create one dependable backup for important files and learn how to report suspicious messages.",
            "If a device or account feels off, isolate it and ask for help early rather than waiting."
        ]

def build_quiz_question(question_index):
    if question_index >= len(QUIZ_QUESTIONS):
        return None
    question = QUIZ_QUESTIONS[question_index]
    return {
        "type": "quiz-question",
        "question": question["question"],
        "questionNumber": question_index + 1,
        "totalQuestions": len(QUIZ_QUESTIONS),
        "options": question["options"]
    }

def build_quiz_results(answers):
    total_score = sum(answers)
    max_score = len(QUIZ_QUESTIONS) * 2
    score_band, headline, percentage = calculate_score_band(total_score, max_score)
    summary_texts = {
        "high": "You already cover the main defensive habits. Keep refining your detection and recovery practices.",
        "medium": "Your security posture is improving, but a few habits are still leaving room for avoidable risk.",
        "low": "You have several high-value opportunities to reduce risk quickly with a few foundational changes."
    }
    return {
        "type": "quiz-results",
        "headline": headline,
        "score": total_score,
        "maxScore": max_score,
        "percentage": percentage,
        "scoreBand": score_band,
        "summary": summary_texts[score_band],
        "recommendations": get_quiz_recommendations(score_band),
        "suggestions": ["Restart quiz", "Password security tips", "How do I report phishing?"]
    }

# ============================================================================
# MAIN REPLY LOGIC
# ============================================================================

def get_bot_reply(user_text, quiz_active=False, quiz_answers=None):
    if not user_text or not user_text.strip():
        return {"type": "text", **build_empty_input_response()}
    
    normalized_input = sanitize_for_matching(user_text)
    tokens = build_token_set(normalized_input)
    asks_how = "how" in tokens or "what" in tokens or "why" in tokens
    is_greeting = any(normalized_input == trigger or normalized_input.startswith(f"{trigger} ") for trigger in GREETING_TRIGGERS)
    
    quiz_restart_triggers = ["restart quiz", "retake quiz", "start quiz again", "start again"]
    
    if quiz_active and any(trigger in normalized_input for trigger in quiz_restart_triggers):
        return {"type": "quiz-restart"}
    
    if quiz_active:
        return {"type": "quiz-interrupt", **build_quiz_interrupt_response()}
    
    if any(trigger in normalized_input for trigger in IDENTITY_TRIGGERS):
        return {"type": "text", **build_identity_response()}
    
    if is_greeting and any(trigger in normalized_input for trigger in HELP_TRIGGERS):
        return {"type": "text", **build_help_response()}
    
    if is_greeting:
        return {"type": "text", **build_greeting_response()}
    
    if any(trigger in normalized_input for trigger in THANKS_TRIGGERS):
        return {"type": "text", **build_thanks_response()}
    
    if any(trigger in normalized_input for trigger in HELP_TRIGGERS):
        return {"type": "text", **build_help_response()}
    
    quiz_triggered = any(trigger in normalized_input for trigger in QUIZ_TRIGGERS)
    if not quiz_triggered and "checkup" in tokens and ("security" in tokens or "cybersecurity" in tokens):
        quiz_triggered = True
    
    if quiz_triggered:
        return {"type": "quiz-start"}
    
    if asks_how and "password" in tokens:
        topic = get_topic_by_id("password")
        return {"type": "text", "response": topic["response"], "suggestions": topic["suggestions"]}
    
    if ("phishing" in tokens or "scam" in tokens) and any(w in tokens for w in ["email", "emails", "message", "messages", "sms"]):
        topic = get_topic_by_id("phishing")
        return {"type": "text", "response": topic["response"], "suggestions": topic["suggestions"]}
    
    matched_topic = find_best_topic(normalized_input)
    if matched_topic:
        return {"type": "text", "response": matched_topic["response"], "suggestions": matched_topic["suggestions"]}
    
    return {"type": "text", **build_fallback_response()}

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "CyberShield FAQ Bot",
        "version": "1.0.0"
    })

@app.route('/api/topics', methods=['GET'])
def get_topics():
    return jsonify({
        "topics": [{"id": t["id"], "label": t["label"]} for t in FAQ_TOPICS]
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    user_message = (data.get('message', '') or '').strip()[:500]
    session_id = data.get('session_id')
    quiz_active = data.get('quiz_active', False)
    quiz_index = data.get('quiz_index', 0)
    quiz_answers = data.get('quiz_answers', [])
    
    # Generate session ID if needed
    if not session_id:
        session_id = str(uuid.uuid4())[:8]
    
    # Save user message
    if user_message:
        add_chat_message(session_id, "user", user_message)
    
    # Generate reply
    reply = get_bot_reply(user_message, quiz_active, quiz_answers)
    
    # Save bot reply
    if reply.get("type") == "text":
        response_text = reply.get("response", [])
        if isinstance(response_text, list):
            response_text = " ".join(response_text)
        add_chat_message(session_id, "bot", response_text, reply.get("suggestions"))
    
    return jsonify({
        "session_id": session_id,
        "reply": reply,
        "message": user_message,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/quiz/start', methods=['POST'])
def quiz_start():
    data = request.get_json() or {}
    session_id = data.get('session_id') or str(uuid.uuid4())[:8]
    
    return jsonify({
        "session_id": session_id,
        "quiz_intro": {
            "type": "quiz-intro",
            "response": [
                "Let's run a quick security checkup. Pick the answer that sounds most like your current habits.",
                "I'll score the results and give you a few practical recommendations at the end."
            ],
            "suggestions": []
        },
        "first_question": build_quiz_question(0)
    })

@app.route('/api/quiz/answer', methods=['POST'])
def quiz_answer():
    data = request.get_json() or {}
    session_id = data.get('session_id')
    score = data.get('score', 0)
    
    # For now, we handle quiz state client-side
    # This endpoint could be expanded to track quiz state server-side
    
    return jsonify({
        "session_id": session_id,
        "quiz_complete": False,
        "next_question": build_quiz_question(1)  # Placeholder - real logic in frontend
    })

@app.route('/api/quiz/restart', methods=['POST'])
def quiz_restart():
    data = request.get_json() or {}
    session_id = data.get('session_id') or str(uuid.uuid4())[:8]
    
    return jsonify({
        "session_id": session_id,
        "quiz_intro": {
            "type": "quiz-intro",
            "response": [
                "Let's run a quick security checkup. Pick the answer that sounds most like your current habits.",
                "I'll score the results and give you a few practical recommendations at the end."
            ],
            "suggestions": []
        },
        "first_question": build_quiz_question(0)
    })

# ============================================================================
# CHAT HISTORY ENDPOINTS (NEW)
# ============================================================================

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get list of all chat sessions."""
    history = get_chat_history()
    return jsonify({"sessions": history, "count": len(history)})

@app.route('/api/history/<session_id>', methods=['GET'])
def get_session_history(session_id):
    """Get full chat session with messages."""
    session = get_chat_session(session_id)
    if session:
        return jsonify({"session": session})
    return jsonify({"error": "Session not found"}), 404

@app.route('/api/history/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a chat session."""
    if delete_chat_session(session_id):
        return jsonify({"success": True, "message": "Session deleted"})
    return jsonify({"error": "Session not found"}), 404

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    """Delete all chat sessions."""
    if clear_all_chats():
        return jsonify({"success": True, "message": "All chats cleared"})
    return jsonify({"error": "Failed to clear history"}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print("  CyberShield FAQ Bot")
    print(f"  Running on: http://0.0.0.0:{port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=True)
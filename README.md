# CyberShield FAQ Bot

A **Python-powered cybersecurity FAQ chatbot** with a premium dark web interface. Built as a school project using Flask (Python backend) + HTML/CSS/JS (frontend).

## 📋 Project Overview

- **Purpose**: Task 22 - Chatbot for FAQs
- **Tech Stack**: Python (Flask) + HTML/CSS/JavaScript
- **Type**: Rule-based FAQ chatbot (no AI/LLM)
- **Features**: FAQ answering, security quiz, chat history persistence

## 🚀 Quick Start

### Local Development

```bash
# 1. Create virtual environment
python3 -m venv venv

# 2. Activate it
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python app.py

# 5. Open in browser
# Navigate to: http://127.0.0.1:5000
# Then open index.html in a separate tab/window
```

### Using Gunicorn (Production)

```bash
pip install gunicorn
gunicorn wsgi:app --bind 0.0.0.0:5000
```

---

## 🌐 Deployment to Render.com

### Option 1: One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Click the button above or go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: (leave blank)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn wsgi:app --bind 0.0.0.0:$PORT`
4. Click **Deploy**

### Option 2: Manual Deploy via CLI

```bash
# 1. Install Render CLI
brew install render

# 2. Login
render auth login

# 3. Create service
render create service --name cybershield-faq-bot --type web --plan free

# 4. Deploy
render deploy
```

### After Deployment

1. Your app will be live at: `https://cybershield-faq-bot.onrender.com`
2. Update `script.js` to point to your deployed URL:

```javascript
// In script.js, change:
const API_BASE = 'http://127.0.0.1:5000/api';

// To your deployed URL:
const API_BASE = 'https://cybershield-faq-bot.onrender.com/api';
```

3. Open the frontend (`index.html`) in your browser to use the chatbot

---

## 💾 Chat Persistence

Chats are saved to a JSON file (`data/chats.json`) on the server.

### Features:
- ✅ Chats persist across server restarts
- ✅ View chat history via API
- ✅ Delete individual chats
- ✅ Clear all history

### API Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | List all chat sessions |
| GET | `/api/history/<id>` | Get full session with messages |
| DELETE | `/api/history/<id>` | Delete a specific chat |
| DELETE | `/api/history` | Clear all chats |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/topics` | List FAQ topics |
| POST | `/api/chat` | Send message, get reply |
| POST | `/api/quiz/start` | Start security quiz |
| POST | `/api/quiz/answer` | Submit quiz answer |
| POST | `/api/quiz/restart` | Restart quiz |

### Example Chat Request:

```bash
curl -X POST https://your-app.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I spot phishing emails?"}'
```

### Example Response:

```json
{
  "session_id": "abc12345",
  "reply": {
    "type": "text",
    "response": [
      "Treat unexpected urgency, mismatched sender addresses, and requests for credentials or payments as phishing red flags.",
      "Hover over links before clicking, verify unusual requests through a second channel, and avoid opening unexpected attachments.",
      "If a message feels off, report it instead of interacting with it."
    ],
    "suggestions": ["How can I browse safely?", "How do I report an incident?", "Start the security quiz"]
  },
  "timestamp": "2026-04-23T12:00:00.000000"
}
```

---

## 📁 Project Structure

```
cybershield-faq-bot/
├── app.py              # Flask backend (Python FAQ engine)
├── wsgi.py             # Gunicorn entry point
├── requirements.txt    # Python dependencies
├── render.yaml         # Render.com deployment config
├── data/               # Chat storage (auto-created)
│   └── chats.json     # Persisted chat sessions
├── index.html          # Web interface
├── styles.css          # Dark theme styling
├── script.js           # Frontend logic
├── README.md           # This file
└── SPEC.md             # Full specification
```

---

## 📚 FAQ Topics Covered

1. **Password Security** - MFA, password managers, credential reuse
2. **Phishing Awareness** - Email scams, spoofing detection
3. **Safe Browsing** - HTTPS, VPN, public Wi-Fi
4. **Data Protection** - Backups (3-2-1 rule), encryption
5. **Social Engineering** - Impersonation, tailgating
6. **Mobile Security** - Biometrics, app permissions
7. **Incident Response** - Breach handling, malware recovery
8. **General Best Practices** - Security hygiene

---

## 🔒 Security Quiz

A 6-question multiple choice quiz with scoring:

| Score | Band | Description |
|-------|------|-------------|
| ≥75% | High | Strong security baseline |
| ≥45% | Medium | Improving with gaps |
| <45% | Low | Needs attention |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `PYTHON_VERSION` | `3.11` | Python version |

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
pkill -f "python app.py"
# or specify a different port:
PORT=5001 python app.py
```

### "Module not found"
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Chat history not saving
- Check that the `data/` directory exists
- Verify write permissions

---

## 📝 License

This project was created for educational purposes as part of a school assignment.

---

## 👤 Author

CyberShield FAQ Bot - Task 22: Chatbot for FAQs
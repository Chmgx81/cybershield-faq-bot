# CyberShield FAQ Bot

CyberShield FAQ Bot is a premium dark-mode cybersecurity FAQ chatbot built as a school project using HTML, CSS, and vanilla JavaScript. It provides short, practical answers to common cybersecurity questions through a conversational interface and includes a built-in security checkup quiz.

## Project Purpose

The goal of this project is to turn static cybersecurity FAQ content into an interactive chat experience. Instead of reading a traditional FAQ page, users can ask questions naturally and receive guided responses inside a modern chatbot interface.

## Main Features

- Rule-based cybersecurity FAQ chatbot with weighted keyword matching
- Premium dark UI with responsive sidebar layout
- Multiple in-browser chat sessions with history management
- Chat history switching and deletion with confirmation dialogs
- **Persistent storage**: Chat sessions saved to localStorage and restored on reload
- Quick reply suggestions after bot responses
- Typing indicator for conversational feedback
- Startup skeleton loading screen
- Interactive security checkup quiz with scoring and personalized recommendations
- Text normalization for handling typos and variations
- Edge case handling for common scenarios
- Security tips feature ("Did you know?")
- Response variations for greetings and thanks (adds variety)
- Keyboard shortcuts:
  - `Ctrl+N` - New chat
  - `Ctrl+K` - Focus input
  - `Escape` - Close sidebar

## FAQ Topics Covered

### Core Topics
- Password Security
- Phishing Awareness
- Safe Browsing
- Data Protection
- Social Engineering
- Mobile Security
- Incident Response
- General Best Practices

### Extended Topics
- Malware Protection
- WiFi Security
- Social Media Security
- Software Updates
- Two-Factor Authentication
- Remote Work Security
- Cloud Storage Security
- Browser Security
- Smart Device Security

## Edge Cases Handled

- Forgotten password assistance
- Hacked account response
- Clicked bad link guidance
- "Is this email safe?" verification
- Security tips ("Give me a tip")

## How It Works

The chatbot does not use a live AI model or backend service. It works entirely in the browser using predefined cybersecurity knowledge and weighted keyword matching.

When a user submits a message:

1. The input is normalized (handles typos, variations, and common misspellings)
2. Keywords and phrases are matched against FAQ categories with weighted scoring
3. The most relevant topic is selected based on the highest score
4. A prepared response and follow-up suggestions are returned

If the input is unclear, the bot gives a guided fallback response instead of failing silently.

## Security Checkup Quiz

The app includes a 10-question rule-based quiz that assesses cybersecurity habits:

- Unique password usage
- Multi-factor authentication
- Link and attachment handling
- Software updates
- Data backup practices
- Incident response
- Public WiFi usage
- Social media privacy
- File downloading habits
- Browser extension management

At the end, it calculates a score and shows a recommendation card based on the user's result with practical next steps.

## Technical Implementation

- **Keyword Matching**: Weighted scoring system that considers keyword frequency and importance
- **Text Normalization**: Handles 20+ common typos and phrase variations
- **Session Management**: Multiple chat sessions with localStorage persistence
- **Quiz Scoring**: 0-2 scale per question, categorized into low/medium/high security posture
- **Keyboard Shortcuts**: Ctrl+N for new chat, Ctrl+K to focus input

## Files

- `index.html` - app structure
- `styles.css` - visual design and layout
- `script.js` - chatbot logic, quiz logic, FAQ topics, and session handling
- `SPEC.md` - final project specification
- `README.md` - project documentation

## GitHub Pages Deployment

This project is deployed and accessible at: **https://chmgx81.github.io/cybershield-faq-bot/**

## Limitations

- No backend or database
- Sessions stored in browser localStorage (cleared when browser data is cleared)
- No real AI or NLP model
- Responses are limited to predefined FAQ content and interaction rules

## Summary

CyberShield FAQ Bot demonstrates how a simple rule-based system can be presented in a polished, modern interface to create a strong chatbot experience for a school project. It combines practical cybersecurity guidance with a premium UI, comprehensive topic coverage, and lightweight front-end implementation. The project showcases understanding of NLP concepts, pattern matching, and interactive UI design.

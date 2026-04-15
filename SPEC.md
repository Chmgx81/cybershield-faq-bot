# CyberShield FAQ Bot - Final Specification

## 1. Project Overview

- **Project Name**: CyberShield FAQ Bot
- **Assignment Category**: Task 22 - Chatbot for FAQs
- **Project Type**: Single-page web application
- **Implementation Stack**: HTML, CSS, and vanilla JavaScript
- **Application Style**: Rule-based cybersecurity FAQ chatbot with premium dark UI
- **Primary Goal**: Help users ask common cybersecurity questions in a conversational interface and receive short, practical answers
- **Target Users**: Students, employees, individuals, and small business users who need basic cybersecurity guidance

---

## 2. Final Product Summary

CyberShield FAQ Bot is a browser-based chatbot that answers common cybersecurity questions using predefined FAQ content and weighted keyword matching. The application presents the experience in a polished, premium dark interface inspired by modern AI chat products, while remaining simple enough for a school assignment.

The app supports:

- FAQ-style question answering
- quick reply suggestions
- a built-in security checkup quiz
- multiple in-browser chat sessions
- local browser persistence for saved chats
- chat history switching and deletion
- typing feedback and loading skeleton states
- automatic scroll to the latest message
- responsive mobile interaction fixes for overlay, skeleton layout, and touch targets

No backend or online AI model is used. All logic runs in the browser.

---

## 3. UI/UX Specification

### 3.1 Layout Structure

The final layout is a full-screen two-panel interface:

- **Left Sidebar**:
  - CyberShield branding with chatbot icon
  - shortcut actions like `New FAQ Chat`, `Phishing FAQ`, and `Security Checkup`
  - chat history list
  - clear-history action
  - compact footer metadata
- **Main Workspace**:
  - top status bar
  - privacy/information banner on the landing view
  - landing hero area before chat starts
  - conversation thread after chat begins
  - fixed composer at the bottom during active chat

### 3.2 Interaction States

The app has two main interface states:

1. **Landing State**
   - hero headline is visible
   - centered composer is visible
   - suggested FAQ chips are shown
   - no chat thread is active yet

2. **Chat State**
   - chat thread becomes visible
   - composer docks into the active conversation layout
   - user and bot messages appear in distinct message bubbles
   - conversation area is given more space by removing the landing-only privacy banner from the active thread view

### 3.3 Visual Direction

- **Theme**: premium dark interface
- **Design Style**: restrained, modern, minimal, and editorial rather than playful
- **Typography**: `Plus Jakarta Sans`
- **Icons**:
  - Feather icons for interface controls
  - custom chatbot icon for CyberShield identity
- **Color Language**:
  - dark charcoal and near-black backgrounds
  - green accent for CyberShield branding and emphasis
  - soft gray typography
  - subtle green-tinted user bubble accent

### 3.4 Key UI Components

#### Sidebar

- retractable desktop sidebar
- mobile drawer behavior with overlay
- chat history list with active-state styling
- delete icon revealed per chat row

#### Top Bar

- project label
- demo label
- centered presentation similar to modern chat products

#### Privacy Banner

- short note explaining that the demo works in-browser and is not stored remotely

#### Hero Section

- brand-led FAQ heading
- supporting description of what the bot can answer
- primary composer
- suggested FAQ starter pills

#### Message Thread

- right-aligned user messages
- left-aligned bot messages
- distinct bubble styling for user and bot
- role labels and icons in message headers
- utility actions such as copy and regenerate
- feedback controls for bot replies

#### Composer

- text input with 500-character limit
- send button
- `FAQ Quiz` trigger chip

#### Skeleton Screen

- full-page loading skeleton on startup
- matches sidebar and main workspace structure
- fades out after initial load
- has mobile-specific layout adjustments so placeholder widths do not overflow small screens

---

## 4. Functional Specification

### 4.1 Core Functional Features

1. **Rule-Based FAQ Response Engine**
   - matches user input against topic keywords
   - scores likely topic relevance
   - returns the best FAQ response when a topic is matched
   - falls back to guided prompts when the request is unclear

2. **Conversation-Style Replies**
   - supports greetings such as `hello`
   - supports identity questions such as `what are you`
   - supports help-style prompts
   - supports thank-you responses

3. **Quick Reply Suggestions**
   - bot replies include clickable follow-up chips
   - suggestions help guide the user toward likely next questions

4. **Typing Indicator**
   - shows animated typing dots before bot responses
   - delay is simulated for better conversational feel

5. **Automatic Message Scrolling**
   - conversation view scrolls to the newest message automatically
   - helps keep bot replies and quiz cards visible without manual scrolling

6. **Security Checkup Quiz**
   - started from keywords or the quiz UI trigger
   - presents multiple-choice questions
   - tracks quiz progress
   - calculates a score at the end
   - displays a recommendation card based on the result

7. **Multi-Session Chat History**
   - each new conversation becomes its own in-memory chat session
   - sessions can be reopened from the sidebar
   - sessions can be deleted individually
   - all sessions can be cleared
   - sessions are restored from localStorage after page refresh

8. **Responsive Sidebar Behavior**
   - retract/expand on larger screens
   - open/close drawer behavior on smaller screens
   - close on overlay click or `Escape`
   - hidden mobile overlay does not block the interface
   - touch targets are enlarged for easier mobile interaction

### 4.2 FAQ Categories

The bot currently covers these FAQ topic groups:

1. Password Security
2. Phishing Awareness
3. Safe Browsing
4. Data Protection
5. Social Engineering
6. Mobile Security
7. Incident Response
8. General Best Practices
9. Security Checkup Quiz

### 4.3 Matching Logic

The response engine uses lightweight browser-side logic:

- input is normalized to lowercase
- punctuation is stripped for matching
- common phrase variations are normalized
- a token-based scoring approach is used for cleaner keyword matching
- the highest-scoring topic is selected
- if no topic is confident enough, fallback guidance is shown

Additional handling includes:

- common typos and term variants
- greeting/help/identity prompts
- quiz restart phrases
- guidance when the user types free text during an active quiz
- stronger auto-scroll after delayed bot responses render

### 4.4 Session Behavior

- `New FAQ Chat` starts a blank new thread without deleting older chats
- sidebar topic shortcuts such as `Phishing FAQ` and `Security Checkup` start a new chat session first
- homepage suggestion chips and in-chat suggestions continue the current session
- switching chat sessions restores that conversation in the message area

---

## 5. Quiz Specification

### 5.1 Quiz Trigger Phrases

The quiz may begin from prompts such as:

- `quiz`
- `checklist`
- `assess`
- `score`
- `rate my security`
- `security checkup`

### 5.2 Quiz Flow

- user starts the quiz
- bot introduces the checkup
- user answers each multiple-choice question
- progress indicator updates by question number
- final score card is shown
- recommendations are provided based on score band

### 5.3 Quiz Result Bands

- **High**: strong security baseline
- **Medium**: improving but still has gaps
- **Low**: needs immediate hardening

---

## 6. Edge Cases and Safeguards

- empty input returns a prompt to ask a cybersecurity question
- very long input is truncated to 500 characters
- unknown or vague input produces a guided fallback instead of a broken reply
- active quiz state is protected from unrelated free-text interruptions
- pending delayed bot responses are cleared when switching sessions
- startup skeleton has a non-blocking fallback so it does not trap clicks
- mobile overlay respects hidden state and does not block taps when closed
- stored chats remain available after reload in the same browser unless the user clears them

---

## 7. Non-Functional Requirements

- all behavior runs locally in the browser
- no backend is required
- no database is required
- no external AI inference is required
- the UI should remain readable and uncluttered on desktop and mobile
- interactions should feel polished, responsive, and visually consistent

---

## 8. Acceptance Criteria

- [x] App loads with a premium dark theme
- [x] CyberShield branding and chatbot icon are visible
- [x] Sidebar contains new-chat, shortcut, and chat-history controls
- [x] Landing screen shows hero content and suggested FAQ prompts
- [x] User can send messages with the button or Enter key
- [x] Bot returns relevant responses for supported FAQ topics
- [x] Greeting, help, identity, and fallback prompts are handled cleanly
- [x] Bot replies show typing feedback before appearing
- [x] Quick reply suggestions are clickable
- [x] Security quiz can be started, completed, and restarted
- [x] Quiz results display a score and recommendations
- [x] Multiple chat sessions can be created and revisited
- [x] Chat sessions persist after refresh in the same browser
- [x] Individual chats can be deleted
- [x] All chat history can be cleared
- [x] Sidebar shortcuts can start a new topic-based session
- [x] Mobile sidebar overlay and close behavior work
- [x] Startup skeleton screen appears and fades out
- [x] Mobile skeleton layout remains readable on small screens
- [x] User and bot messages are visually distinct
- [x] Conversation auto-scrolls to the latest response
- [x] UI remains functional without a backend

---

## 9. Known Limitations

- chat sessions are stored only in browser localStorage
- there is no backend persistence or database storage
- chats do not sync across different devices or browsers
- the chatbot is rule-based and not powered by a live AI model
- responses are limited to the predefined FAQ knowledge and interaction rules
- some behaviors depend on front-end timing and browser rendering, so final validation should still be done in the live deployed page

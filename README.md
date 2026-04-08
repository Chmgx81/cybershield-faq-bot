# CyberShield FAQ Bot

CyberShield FAQ Bot is a premium dark-mode cybersecurity FAQ chatbot built as a school project using HTML, CSS, and vanilla JavaScript. It provides short, practical answers to common cybersecurity questions through a conversational interface and includes a built-in security checkup quiz.

## Project Purpose

The goal of this project is to turn static cybersecurity FAQ content into an interactive chat experience. Instead of reading a traditional FAQ page, users can ask questions naturally and receive guided responses inside a modern chatbot interface.

## Main Features

- rule-based cybersecurity FAQ chatbot
- premium dark UI with responsive sidebar layout
- multiple in-browser chat sessions
- chat history switching and deletion
- quick reply suggestions after bot responses
- typing indicator for conversational feedback
- startup skeleton loading screen
- interactive security checkup quiz with score and recommendations
- greeting, help, identity, and fallback handling

## FAQ Topics Covered

- password security
- phishing awareness
- safe browsing
- data protection
- social engineering
- mobile security
- incident response
- general best practices

## How It Works

The chatbot does not use a live AI model or backend service. It works entirely in the browser using predefined cybersecurity knowledge and weighted keyword matching.

When a user submits a message:

1. the input is normalized
2. keywords and phrases are matched against FAQ categories
3. the most relevant topic is selected
4. a prepared response and follow-up suggestions are returned

If the input is unclear, the bot gives a guided fallback response instead of failing silently.

## Security Checkup Quiz

The app includes a short rule-based quiz that asks multiple-choice cybersecurity habit questions. At the end, it calculates a score and shows a recommendation card based on the user’s result.

## Files

- `index.html` - app structure
- `styles.css` - visual design and layout
- `script.js` - chatbot logic, quiz logic, and session handling
- `SPEC.md` - final project specification

## GitHub Pages Deployment

This project is ready to be deployed as a static site with GitHub Pages.

Basic steps:

1. create a new GitHub repository
2. upload `index.html`, `styles.css`, `script.js`, `README.md`, and `SPEC.md`
3. go to the repository `Settings`
4. open the `Pages` section
5. set the source to the main branch root
6. save and wait for GitHub to generate the live URL

After deployment, the app can be opened directly from the generated GitHub Pages link and shared by email with the lecturer.

## Limitations

- no backend or database
- no persistent storage across browser reloads
- no real AI or NLP model
- responses are limited to predefined FAQ content and interaction rules

## Summary

CyberShield FAQ Bot demonstrates how a simple rule-based system can be presented in a polished, modern interface to create a strong chatbot experience for a school project. It combines practical cybersecurity guidance with a premium UI and lightweight front-end implementation.

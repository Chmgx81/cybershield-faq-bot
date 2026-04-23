#!/usr/bin/env python3
"""
CyberShield FAQ Bot - Gunicorn Entry Point
For production deployment
"""
from app import app

if __name__ == "__main__":
    app.run()
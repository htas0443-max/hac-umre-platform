# Vercel Serverless Function Handler
# This file imports and exposes the FastAPI app for Vercel

import sys
import os

# Add backend and emergentintegrations directories to path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
emergent_path = os.path.join(backend_path, 'emergentintegrations')
sys.path.insert(0, backend_path)
sys.path.insert(0, emergent_path)

# Set environment variable for Vercel
os.environ.setdefault('ENVIRONMENT', 'production')

# Import the FastAPI app from backend
from server import app

# Vercel uses this as the handler
handler = app

#!/bin/bash
# NutriTrack – Quick Setup Script
set -e

echo "🥦 NutriTrack Setup"
echo "==================="

# Backend
echo ""
echo "📦 Setting up Django backend..."
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠️  Created .env — please add your OPENAI_API_KEY to backend/.env"
fi

pip install -r requirements.txt -q
python manage.py migrate
python manage.py loaddata foods_seed.json 2>/dev/null && echo "✅ Seed data loaded" || echo "ℹ️  Seed data already loaded or skipped"

echo ""
echo "✅ Backend ready. Start it with:"
echo "   cd backend && python manage.py runserver"

# Frontend
echo ""
echo "📦 Setting up React frontend..."
cd ../frontend
npm install -q

echo ""
echo "✅ Frontend ready. Start it with:"
echo "   cd frontend && npm run dev"
echo ""
echo "================================================"
echo "🚀 Open http://localhost:3000 in your browser"
echo "📚 API docs at http://localhost:8000/admin"
echo "================================================"

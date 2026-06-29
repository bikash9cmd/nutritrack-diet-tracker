# 🥦 NutriTrack – AI-Powered Diet Tracker

A full-stack health application featuring a **React frontend**, **Django REST Framework API**, and a **RAG (Retrieval-Augmented Generation) AI Nutrition Assistant** powered by GPT-4 + OpenAI Embeddings.

## 📸 Features

| Feature | Details |
|---|---|
| 🔐 Authentication | Token-based auth with DRF, register/login |
| 📊 Dashboard | Calorie ring, macro bars, 7-day sparkline |
| 🍽️ Food Logger | Search 20+ foods, log by meal, delete entries |
| 🤖 AI Assistant | RAG chatbot — GPT-4 with semantic food knowledge retrieval |
| ⚖️ Weight Tracker | Log and view weight history |
| 👤 Profile | TDEE calculator, goal setting |

## 🏗️ Architecture

```
diet-tracker/
├── backend/                    # Django + DRF
│   ├── core/                   # Settings, root URLs
│   ├── users/                  # CustomUser model, auth endpoints
│   ├── diet/                   # FoodItem, MealLog, DailySummary, WeightLog
│   ├── chatbot/                # ChatSession, ChatMessage, RAG pipeline
│   │   └── rag_service.py      # Embeddings + GPT-4 RAG logic
│   ├── foods_seed.json         # 20 pre-loaded foods (incl. Dal Bhat, Momo)
│   └── requirements.txt
└── frontend/                   # React + Vite
    └── src/
        └── App.jsx             # Full SPA (Auth, Dashboard, Logger, Chat, Profile)
```

## 🤖 How the RAG Works

```
User message
    │
    ▼
OpenAI text-embedding-3-small
    │  (embed the query)
    ▼
Cosine similarity vs 12 knowledge chunks
    │  (nutrition science knowledge base)
    ▼
Top-3 relevant chunks retrieved
    │
    ▼
GPT-4o with:
  - User's profile (goal, weight, calorie target)
  - Retrieved nutrition context
  - Last 10 conversation turns
    │
    ▼
Personalised nutrition advice
```

## 🚀 Quick Start

### 1. Clone and configure

```bash
git clone <your-repo>
cd diet-tracker
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata foods_seed.json
python manage.py runserver
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** 🎉

### Or use Docker

```bash
# Edit backend/.env with your OPENAI_API_KEY first
docker-compose up --build
```

## 🔌 API Endpoints

### Auth (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Create account → returns token |
| POST | `/login/` | Sign in → returns token |
| POST | `/logout/` | Invalidate token |
| GET/PATCH | `/profile/` | View/update profile |

### Diet (`/api/diet/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/foods/?search=chicken` | Search food database |
| POST | `/foods/` | Add custom food |
| GET/POST | `/logs/?date=2025-01-15` | Get/add meal logs |
| DELETE | `/logs/<id>/` | Remove a log entry |
| GET | `/summary/?date=2025-01-15` | Daily nutrition totals |
| GET | `/weekly/` | 7-day averages + sparkline data |
| GET/POST | `/weight/` | Weight log history |

### Chatbot (`/api/chatbot/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/` | Send message, get AI reply |
| GET | `/sessions/` | List chat sessions |
| GET | `/sessions/<id>/history/` | Full message history |

## 🛠️ Tech Stack

**Backend**
- Python 3.12, Django 4.2, Django REST Framework 3.15
- OpenAI SDK (`gpt-4o` + `text-embedding-3-small`)
- NumPy (cosine similarity for RAG retrieval)
- SQLite (dev) / PostgreSQL-ready

**Frontend**
- React 18, Vite 5
- Zero CSS frameworks — all custom inline styles
- Token auth via `localStorage`

## 📄 Key Files for Portfolio/CV

| File | What to highlight |
|---|---|
| `chatbot/rag_service.py` | Full RAG pipeline: embeddings → retrieval → GPT-4 |
| `diet/models.py` | Computed properties, TDEE logic |
| `users/models.py` | Custom AbstractUser, Mifflin-St Jeor BMR calc |
| `diet/views.py` | Class-based DRF views, aggregation |
| `frontend/src/App.jsx` | Full SPA: auth flow, dashboard ring, chat UI |

## 🔑 Environment Variables

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
OPENAI_API_KEY=sk-your-openai-key
```

## 🗺️ Future Improvements

- [ ] PostgreSQL + Redis caching for embeddings
- [ ] Nutritionix / USDA API integration for 500k+ foods
- [ ] Barcode scanner (React Native companion app)
- [ ] Meal plan generator (multi-turn agent)
- [ ] Export to CSV/PDF
- [ ] Streak tracking and gamification

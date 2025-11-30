# AI Learning Coach

Hệ thống luyện thi Toán 10 với AI cá nhân hóa.

## 🚀 Tech Stack

**Backend:**
- Python 3.11+ with FastAPI
- SQL Server Database
- SQLAlchemy ORM
- JWT Authentication
- Google Gemini AI

**Frontend:**
- Next.js 13+ with TypeScript
- React 18
- Tailwind CSS
- Recharts for visualizations

---

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- SQL Server 2019+
- Google Gemini API Key

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL
# - SECRET_KEY
# - GOOGLE_API_KEY

# Run migrations
python scripts/run_migrations.py

# Seed initial data
python scripts/seed_data.py

# Create admin account
python scripts/seed_admin.py

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

---

## 🔑 Default Credentials

**Admin:**
- Email: `admin@aicoach.com`
- Password: `123123`
- Login: http://localhost:3000/admin/login

**Student:**
- Register at: http://localhost:3000/register

---

## 📚 Features

### For Students
- ✅ **Placement Test** - 20 questions across 5 chapters
- ✅ **AI Analysis** - Personalized weakness detection
- ✅ **Learning Path** - Optimized study sequence
- ✅ **Exercise Practice** - AI-generated exercises
- ✅ **Progress Tracking** - Visual charts and stats
- ✅ **AI Assistant** - Chat support for math questions

### For Admins
- ✅ **Dashboard** - Platform statistics
- ✅ **Student Management** - View all students
- ✅ **Progress Monitoring** - Individual student tracking
- ✅ **Analytics** - Performance insights

---

## 📁 Project Structure

```
AI_Coach/
├── backend/
│   ├── app/
│   │   ├── ai/              # AI logic (Gemini, placement test)
│   │   ├── chat/            # Chat assistant
│   │   ├── routers/         # API endpoints
│   │   │   ├── auth.py      # Student authentication
│   │   │   ├── admin_auth.py # Admin authentication
│   │   │   ├── admin.py     # Admin endpoints
│   │   │   ├── progress.py  # Progress tracking
│   │   │   └── ...
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── dependencies.py  # Auth dependencies
│   │   └── main.py          # FastAPI app
│   ├── migrations/          # SQL migration scripts
│   ├── scripts/             # Utility scripts
│   └── requirements.txt
│
├── frontend/
│   ├── pages/               # Next.js pages
│   │   ├── admin/          # Admin portal
│   │   ├── index.tsx       # Student dashboard
│   │   ├── login.tsx       # Student login
│   │   ├── placement-test.tsx
│   │   ├── analysis.tsx
│   │   ├── learning-path.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   ├── components/         # React components
│   ├── utils/              # Helper functions
│   ├── styles/             # CSS styles
│   └── package.json
│
└── .gitignore
```

---

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - Student registration
- `POST /auth/login` - Student login
- `POST /admin/auth/login` - Admin login

### Student Features
- `GET /ai/placement-test/generate` - Generate placement test
- `POST /ai/placement-test/submit` - Submit answers
- `GET /analysis` - Get weakness analysis
- `POST /learning-path/generate` - Generate learning path
- `GET /progress/overview` - Get progress stats

### Admin Features
- `GET /admin/stats` - Platform statistics
- `GET /admin/students` - List all students
- `GET /admin/students/{id}` - Student details
- `GET /admin/students/{id}/progress` - Student progress

---

## 🗄️ Database Schema

### Key Tables
- `students` - Student accounts
- `admins` - Admin accounts (separate)
- `topics` - Math chapters/topics
- `diagnostic_results` - Placement test results
- `learning_path` - Personalized learning sequence
- `performances` - Exercise submission records

---

## 🛠️ Development

### Backend Hot Reload
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Hot Reload
```bash
cd frontend
npm run dev
```

### Run Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

---

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=mssql+pyodbc://user:pass@server/db?driver=ODBC+Driver+17+for+SQL+Server
SECRET_KEY=your-secret-key-here
GOOGLE_API_KEY=your-gemini-api-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### Backend won't start
1. Check database connection
2. Verify Python version (3.11+)
3. Ensure all migrations are run
4. Check `.env` file exists and is valid

### Frontend can't connect to API
1. Verify backend is running on port 8000
2. Check CORS settings in `backend/app/main.py`
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Database errors
1. Run migrations: `python scripts/run_migrations.py`
2. Check SQL Server is running
3. Verify database credentials

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Contributors

- Development Team

---

## 📞 Support

For issues or questions:
1. Check existing documentation
2. Review error logs
3. Contact development team

---

**Last Updated:** Nov 2025  
**Version:** 1.0.0


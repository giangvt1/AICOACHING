# 🎓 AI Learning Coach - Toán 10

Hệ thống trợ lý học tập thông minh sử dụng AI để cá nhân hóa việc học Toán lớp 10.

## 📋 Tổng quan

AI Learning Coach là một nền tảng học tập thông minh giúp học sinh lớp 10:
- 📊 Đánh giá năng lực qua bài kiểm tra chuẩn đoán
- 🎯 Tạo lộ trình học tập cá nhân hóa
- 🤖 Tạo bài tập tự động với AI (Gemini)
- 💬 Trợ lý giải đáp thắc mắc 24/7
- 📈 Theo dõi tiến độ học tập chi tiết

## 🏗️ Kiến trúc hệ thống

```
├── backend/          # FastAPI Backend
│   ├── app/         # Application code
│   ├── artifacts/   # Learning materials (JSON)
│   ├── migrations/  # Database migrations
│   └── scripts/     # Utility scripts
├── frontend/        # Next.js Frontend
│   ├── components/  # React components
│   ├── pages/       # Next.js pages
│   └── utils/       # Utilities
└── dataset/         # Raw learning materials
```

## 🚀 Cài đặt nhanh

### Yêu cầu hệ thống

- Python 3.10+
- Node.js 18+
- npm hoặc yarn

### 1️⃣ Cài đặt Backend

```bash
Active conda enviroment
conda active myenv

# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env
copy .env.example .env  # Windows
# hoặc
cp .env.example .env    # Linux/Mac

# Chỉnh sửa .env và thêm API keys
# GOOGLE_API_KEY=your_gemini_api_key_here
# SECRET_KEY=your_secret_key_here
```

### 2️⃣ Cài đặt Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env.local
copy .env.local.example .env.local  # Windows
# hoặc
cp .env.local.example .env.local    # Linux/Mac

# Chỉnh sửa .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

## ▶️ Chạy ứng dụng

### Chạy Backend

```bash
cd backend

# Kích hoạt môi trường ảo (nếu chưa)
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Chạy server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: http://localhost:8000

API Documentation: http://localhost:8000/docs

### Chạy Frontend

```bash
cd frontend

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## 🔑 Cấu hình API Keys

### Google Gemini API

1. Truy cập: https://makersuite.google.com/app/apikey
2. Tạo API key mới
3. Thêm vào file `backend/.env`:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

### Secret Key (JWT)

Tạo secret key ngẫu nhiên:

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Hoặc
openssl rand -base64 32
```

Thêm vào `backend/.env`:
```
SECRET_KEY=your_generated_secret_key
```

## 📦 Dependencies chính

### Backend (Python)

- **FastAPI** - Web framework hiện đại, nhanh
- **SQLAlchemy** - ORM cho database
- **Google Generative AI** - Tích hợp Gemini AI
- **PyJWT** - Authentication với JWT
- **PDFPlumber** - Xử lý file PDF
- **Uvicorn** - ASGI server

### Frontend (TypeScript/React)

- **Next.js 14** - React framework
- **TailwindCSS** - Utility-first CSS
- **React Big Calendar** - Lịch học tập
- **date-fns** - Date utilities

## 🗄️ Database

Hệ thống hỗ trợ 2 loại database:

### SQLite (Development - Mặc định)

Tự động tạo file `backend/ai_coach.db` khi chạy lần đầu.

### SQL Server (Production)

Cấu hình trong `backend/.env`:

```env
DATABASE_URL=mssql+pyodbc://USER:PASSWORD@SERVER/DATABASE?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes
```

## 🧪 Testing

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm run test
```

## 📚 API Endpoints chính

### Authentication
- `POST /auth/register` - Đăng ký học sinh
- `POST /auth/login` - Đăng nhập
- `GET /auth/me` - Thông tin user hiện tại

### Diagnostic
- `GET /diagnostic/topics` - Danh sách chủ đề
- `GET /diagnostic/questions/{topic_id}` - Câu hỏi kiểm tra
- `POST /diagnostic/submit` - Nộp bài kiểm tra

### Learning Path
- `GET /learning-path` - Lộ trình học tập cá nhân
- `POST /learning-path/generate` - Tạo lộ trình mới

### AI Features
- `POST /ai/generate` - Tạo bài tập với AI
- `POST /chat/explain` - Giải thích bài toán
- `GET /ai/exercises` - Danh sách bài tập đã tạo

### Admin
- `GET /admin/stats` - Thống kê hệ thống
- `GET /admin/students` - Danh sách học sinh
- `GET /admin/students/{id}/progress` - Tiến độ học sinh

## 🎯 Tính năng nổi bật

### 1. Placement Test
Đánh giá năng lực ban đầu của học sinh qua bài kiểm tra chuẩn hóa.

### 2. AI Exercise Generator
Tạo bài tập tự động dựa trên:
- Chủ đề học
- Độ khó mong muốn
- Định dạng (trắc nghiệm/tự luận)
- Ngữ cảnh từ tài liệu học

### 3. Smart Retrieval
Tìm kiếm thông tin liên quan từ kho tài liệu để hỗ trợ AI tạo câu hỏi chính xác.

### 4. Progress Tracking
Theo dõi chi tiết:
- Điểm số theo chương
- Thời gian học
- Độ chính xác
- Xu hướng tiến bộ

## 🛠️ Development

### Cấu trúc Backend

```
backend/app/
├── routers/          # API endpoints
│   ├── auth.py      # Authentication
│   ├── diagnostic.py # Diagnostic tests
│   ├── learning_path.py
│   └── ...
├── ai/              # AI features
│   ├── generator.py # Exercise generation
│   └── retriever.py # Document retrieval
├── chat/            # Chat features
│   ├── gemini_client.py
│   └── router.py
├── models.py        # Database models
├── schemas.py       # Pydantic schemas
├── security.py      # Auth utilities
└── main.py          # App entry point
```

### Cấu trúc Frontend

```
frontend/
├── pages/           # Next.js pages
│   ├── index.tsx   # Home
│   ├── login.tsx   # Login
│   ├── dashboard.tsx
│   └── ...
├── components/      # React components
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   └── ...
└── utils/          # Utilities
    └── api.ts      # API client
```

## 🐛 Troubleshooting

### Backend không khởi động được

```bash
# Kiểm tra Python version
python --version  # Cần >= 3.10

# Cài lại dependencies
pip install --upgrade -r requirements.txt

# Kiểm tra .env file
cat backend/.env  # Linux/Mac
type backend\.env  # Windows
```

### Frontend không kết nối được Backend

1. Kiểm tra Backend đang chạy: http://localhost:8000
2. Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local`
3. Kiểm tra CORS settings trong `backend/app/main.py`

### Database errors

```bash
# Reset database (SQLite)
cd backend
rm ai_coach.db
# Restart backend để tạo lại database
```

### AI không hoạt động

1. Kiểm tra `GOOGLE_API_KEY` trong `.env`
2. Kiểm tra quota API: https://console.cloud.google.com/
3. Xem logs trong terminal

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 👥 Contributors

- Development Team - AI Learning Coach

## 📞 Liên hệ

- Email: support@ailearningcoach.com
- GitHub: https://github.com/your-repo/ai-learning-coach

---

**Chúc bạn học tập hiệu quả! 🚀**

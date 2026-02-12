#!/bin/bash
echo "================================================"
echo "  🏠 RentEase - Property Management System"
echo "================================================"

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Python3 not found. Please install Python 3.8+"
  exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 16+"
  exit 1
fi

echo ""
echo "🐍 Setting up Backend..."
cd backend
pip install -r requirements.txt -q

if [ ! -f "rental_management.db" ]; then
  echo "📦 Initializing database..."
  python3 init_db.py
fi

echo "🚀 Starting Backend on http://localhost:5000..."
python3 app.py &
BACKEND_PID=$!

cd ../frontend
echo ""
echo "📦 Installing frontend dependencies..."
npm install -q

echo "⚛️  Starting Frontend on http://localhost:3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo "  ✅ RentEase is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "  Admin:    admin / admin123"
echo "================================================"
echo ""
echo "Press Ctrl+C to stop all servers"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

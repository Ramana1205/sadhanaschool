# School Management System - Full Setup Guide

This is a complete full-stack school management system with React frontend and Node.js backend, using MongoDB for persistence.

## Project Structure

```
school1/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores (to be replaced with API)
│   │   ├── lib/
│   │   │   ├── api.ts      # API client service (NEW)
│   │   │   └── utils.ts    # Utilities
│   │   └── types/          # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.local          # Frontend API URL (NEW)
│
└── backend/           # Node.js + Express + MongoDB
    ├── src/
    │   ├── config/     # Database config
    │   ├── models/     # Mongoose schemas
    │   ├── routes/     # API routes
    │   ├── middleware/ # Auth, error handling
    │   └── index.ts    # Entry point
    ├── package.json
    ├── tsconfig.json
    ├── README.md       # API documentation
    └── .env            # Environment variables
```

---

## Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (already configured)
- Git (optional)

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configuration

The MongoDB connection string is already in `.env`:
```
MONGODB_URI=mongodb+srv://Ramana:asdfasdf@cluster0.kbzr2iv.mongodb.net/?appName=Cluster0
```

### 3. Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

**Expected output:**
```
MongoDB connected successfully
Server is running on http://localhost:5000
```

### Verify Backend is Running

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{"status":"OK","message":"Server is running"}
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configuration

The API URL is configured in `.env.local`:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Start the Frontend Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Using the Application

### Default Test Credentials

The frontend has built-in demo credentials. You can now choose to:

**Option A: Use Demo Users (Client-side only)**
- Username: `admin` | Password: `admin123`
- Username: `faculty` | Password: `faculty123`

**Option B: Create New Users via API (Server-side persistence)**

Create a user by calling:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "name": "New User",
    "email": "newuser@example.com",
    "role": "admin"
  }'
```

Then login with the new credentials.

---

## Features

### ✅ Student Management
- Add, edit, delete students
- View all students with search and filter
- Student photos (base64 encoded)
- Class and section organization

### ✅ Payment Tracking
- Record student payments
- Track paid vs pending fees
- Payment receipts with unique numbers
- Payment history and statistics
- Support for cash and online payments

### ✅ Report Cards
- Create and manage report cards
- Track subject-wise marks
- Multiple terms support (Term 1, Term 2, Annual)

### ✅ Dashboard
- Overall statistics
- Recent transactions
- Class distribution
- Fee collection summary

### ✅ Authentication
- Secure login/registration
- JWT-based authentication
- Role-based access control (admin/faculty)
- Token-based API security

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Students (Protected)
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats/distribution` - Class distribution

### Payments (Protected)
- `GET /api/payments` - Get all payments
- `GET /api/payments/student/:studentId` - Get student payments
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/stats/summary` - Payment statistics

### Dashboard (Protected)
- `GET /api/dashboard` - Get dashboard statistics

### Report Cards (Protected)
- `GET /api/report-cards` - Get all report cards
- `GET /api/report-cards/student/:studentId` - Get student report cards
- `POST /api/report-cards` - Create report card
- `PUT /api/report-cards/:id` - Update report card
- `DELETE /api/report-cards/:id` - Delete report card

---

## Database Schema

### Users Collection
```javascript
{
  username: String (unique),
  password: String (hashed),
  email: String (unique, optional),
  role: String (admin/faculty),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Students Collection
```javascript
{
  name: String,
  class: String (Nursery to 10th),
  section: String (A-D),
  rollNumber: String (unique),
  contactNumber: String,
  address: String,
  totalFee: Number,
  photo: String (base64, optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Payments Collection
```javascript
{
  studentId: ObjectId (ref: Student),
  amount: Number,
  mode: String (cash/online),
  date: Date,
  receiptNumber: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```

### Report Cards Collection
```javascript
{
  studentId: ObjectId (ref: Student),
  term: String (Term 1/Term 2/Annual),
  subjects: [{
    name: String,
    maxMarks: Number,
    obtainedMarks: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## Development Workflow

### Running Both Services

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# http://localhost:5000
```

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm preview
```

---

## Connecting Frontend to Backend

The frontend API client is in `src/lib/api.ts`. It handles:
- Token-based authentication
- Request headers
- Error handling
- All API endpoints

**Example component using API:**
```typescript
import { studentsApi } from '@/lib/api';

export function StudentsList() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    studentsApi.getAll()
      .then(data => setStudents(data))
      .catch(error => console.error(error));
  }, []);

  return <div>{/* render students */}</div>;
}
```

---

## Troubleshooting

### Backend won't connect to MongoDB
- Verify internet connection
- Check MongoDB URI in `.env`
- Ensure IP whitelist includes your current IP in MongoDB Atlas
- Try connecting directly: `mongosh "mongodb+srv://Ramana:asdfasdf@cluster0.kbzr2iv.mongodb.net/"`

### CORS errors
- Backend already has CORS enabled
- Verify frontend API URL in `.env.local` matches backend URL
- Check browser console for exact error

### Frontend can't reach backend
- Ensure backend is running on port 5000
- Check if firewall is blocking port 5000
- Verify `VITE_API_URL` in frontend `.env.local`

### Authentication failures
- Clear browser localStorage: `localStorage.clear()`
- Ensure JWT_SECRET matches between app restarts
- Check token expiration (7 days)

---

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://Ramana:asdfasdf@cluster0.kbzr2iv.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Security Notes

⚠️ For production:
1. Change `JWT_SECRET` to a strong random string
2. Set `NODE_ENV=production`
3. Use HTTPS for API endpoints
4. Enable MongoDB IP whitelist properly
5. Implement rate limiting
6. Use environment-specific credentials
7. Add CORS restrictions to specific domains

---

## Next Steps

1. **Extend API** - Add more endpoints as needed
2. **Improve Frontend** - Replace Zustand stores with API calls
3. **Add Tests** - Unit and integration tests
4. **Deploy** - Deploy backend to a service like Heroku, Railway, or Vercel
5. **SSL Certificates** - Implement proper HTTPS for production
6. **Database Backups** - Configure MongoDB Atlas backups

---

## Support

Refer to individual README files:
- Backend: `backend/README.md` - Detailed API documentation
- Frontend: `frontend/README.md` - Frontend-specific setup


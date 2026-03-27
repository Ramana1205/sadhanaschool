# School Management System - Backend

A comprehensive backend API for managing students, payments, report cards, and hall tickets for a school.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://Ramana:asdfasdf@cluster0.kbzr2iv.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

### Running the Server

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

Check health: `GET http://localhost:5000/api/health`

---

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "faculty1",
  "password": "password123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "faculty"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "faculty1",
    "role": "faculty",
    "name": "John Doe"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "faculty1",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "faculty1",
    "role": "faculty",
    "name": "John Doe"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer jwt_token_here
```

---

### Students

#### Get All Students
```http
GET /api/students
Authorization: Bearer jwt_token_here
```

Response:
```json
[
  {
    "_id": "student_id",
    "name": "Aarav Sharma",
    "class": "Nursery",
    "section": "A",
    "rollNumber": "001",
    "contactNumber": "9876543210",
    "address": "123 Main Street",
    "totalFee": 30000,
    "photo": "base64_string_or_url",
    "createdAt": "2024-04-01T00:00:00Z",
    "updatedAt": "2024-04-01T00:00:00Z"
  }
]
```

#### Get Student by ID
```http
GET /api/students/:id
Authorization: Bearer jwt_token_here
```

#### Create Student
```http
POST /api/students
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "New Student",
  "class": "Nursery",
  "section": "A",
  "rollNumber": "101",
  "contactNumber": "9876543210",
  "address": "123 Main Street",
  "totalFee": 30000,
  "photo": "base64_string_optional"
}
```

#### Update Student
```http
PUT /api/students/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "Updated Name",
  "totalFee": 35000
}
```

#### Delete Student
```http
DELETE /api/students/:id
Authorization: Bearer jwt_token_here
```

#### Get Class Distribution
```http
GET /api/students/stats/distribution
Authorization: Bearer jwt_token_here
```

---

### Payments

#### Get All Payments
```http
GET /api/payments
Authorization: Bearer jwt_token_here
```

Response:
```json
[
  {
    "_id": "payment_id",
    "studentId": {
      "_id": "student_id",
      "name": "Aarav Sharma",
      "rollNumber": "001"
    },
    "amount": 15000,
    "mode": "online",
    "date": "2024-06-15T00:00:00Z",
    "receiptNumber": "RCP-K3MJBXP-A2K5",
    "createdAt": "2024-06-15T00:00:00Z",
    "updatedAt": "2024-06-15T00:00:00Z"
  }
]
```

#### Get Payments by Student
```http
GET /api/payments/student/:studentId
Authorization: Bearer jwt_token_here
```

#### Create Payment
```http
POST /api/payments
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "studentId": "student_id",
  "amount": 15000,
  "mode": "cash",
  "date": "2024-06-15"
}
```

#### Update Payment
```http
PUT /api/payments/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "amount": 20000,
  "mode": "online"
}
```

#### Delete Payment
```http
DELETE /api/payments/:id
Authorization: Bearer jwt_token_here
```

#### Get Payment Summary
```http
GET /api/payments/stats/summary
Authorization: Bearer jwt_token_here
```

---

### Dashboard

#### Get Dashboard Statistics
```http
GET /api/dashboard
Authorization: Bearer jwt_token_here
```

Response:
```json
{
  "totalStudents": 12,
  "totalFees": 429000,
  "totalCollected": 145000,
  "totalPending": 284000,
  "pendingPercentage": 66,
  "paymentCount": 5,
  "classDistribution": [
    {
      "_id": "Nursery",
      "count": 2
    }
  ],
  "recentPayments": [...],
  "recentStudents": [...]
}
```

---

### Report Cards

#### Get All Report Cards
```http
GET /api/report-cards
Authorization: Bearer jwt_token_here
```

#### Get Report Cards by Student
```http
GET /api/report-cards/student/:studentId
Authorization: Bearer jwt_token_here
```

#### Create Report Card
```http
POST /api/report-cards
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "studentId": "student_id",
  "term": "Term 1",
  "subjects": [
    {
      "name": "Mathematics",
      "maxMarks": 100,
      "obtainedMarks": 85
    },
    {
      "name": "English",
      "maxMarks": 100,
      "obtainedMarks": 78
    }
  ]
}
```

#### Update Report Card
```http
PUT /api/report-cards/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "subjects": [...]
}
```

#### Delete Report Card
```http
DELETE /api/report-cards/:id
Authorization: Bearer jwt_token_here
```

---

## Database Models

### User
- `username` (String, unique, required)
- `password` (String, hashed, required)
- `email` (String, unique, optional)
- `role` (enum: 'admin', 'faculty')
- `name` (String, required)
- `createdAt`, `updatedAt` (Timestamps)

### Student
- `name` (String, required)
- `class` (enum: Nursery to 10th)
- `section` (enum: A, B, C, D)
- `rollNumber` (String, unique, required)
- `contactNumber` (String, required)
- `address` (String, required)
- `totalFee` (Number, required)
- `photo` (String, base64 optional)
- `createdAt`, `updatedAt` (Timestamps)

### Payment
- `studentId` (ObjectId, ref: Student)
- `amount` (Number, required)
- `mode` (enum: 'cash', 'online')
- `date` (Date, required)
- `receiptNumber` (String, unique)
- `createdAt`, `updatedAt` (Timestamps)

### ReportCard
- `studentId` (ObjectId, ref: Student)
- `term` (enum: 'Term 1', 'Term 2', 'Annual')
- `subjects` (Array of {name, maxMarks, obtainedMarks})
- `createdAt`, `updatedAt` (Timestamps)

---

## Authentication

All protected routes require the `Authorization` header with a JWT token:
```
Authorization: Bearer <token>
```

Tokens expire in 7 days.

---

## Error Handling

All errors return appropriate HTTP status codes:
- `400` - Bad request / Validation error
- `401` - Unauthorized / Invalid credentials
- `403` - Forbidden / Insufficient permissions
- `404` - Resource not found
- `500` - Server error

Error response format:
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

---

## Notes

- MongoDB URI is pre-configured with your cluster
- JWT secret can be changed in `.env` for production
- All date fields accept ISO format strings
- Photo fields accept base64 encoded data (up to 50MB)

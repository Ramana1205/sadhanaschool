# API Testing Guide

Quick reference for testing the API endpoints.

## Prerequisites
- Backend running on `http://localhost:5000`
- Use Postman, cURL, or VS Code REST Client extension

---

## Quick Reference

### Get Token (for other requests)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Save the returned `token` value for other requests.

---

## Authentication Tests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "name": "Test User",
    "email": "test@example.com",
    "role": "faculty"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'
```

### Get Current User
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Students Tests

### Get All Students
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer $TOKEN"
```

### Create Student
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Kumar",
    "class": "5th",
    "section": "A",
    "rollNumber": "050",
    "contactNumber": "9999999999",
    "address": "Test Address",
    "totalFee": 42000
  }'
```

### Update Student
```bash
TOKEN="your_token_here"
STUDENT_ID="student_id_here"
curl -X PUT http://localhost:5000/api/students/$STUDENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalFee": 45000,
    "contactNumber": "9876543210"
  }'
```

### Delete Student
```bash
TOKEN="your_token_here"
STUDENT_ID="student_id_here"
curl -X DELETE http://localhost:5000/api/students/$STUDENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Get Class Distribution
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/students/stats/distribution \
  -H "Authorization: Bearer $TOKEN"
```

---

## Payments Tests

### Create Payment
```bash
TOKEN="your_token_here"
STUDENT_ID="student_id_here"
curl -X POST http://localhost:5000/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "'$STUDENT_ID'",
    "amount": 15000,
    "mode": "online",
    "date": "2024-06-15"
  }'
```

### Get All Payments
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/payments \
  -H "Authorization: Bearer $TOKEN"
```

### Get Payments by Student
```bash
TOKEN="your_token_here"
STUDENT_ID="student_id_here"
curl -X GET http://localhost:5000/api/payments/student/$STUDENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Get Payment Summary
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/payments/stats/summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## Dashboard Tests

### Get Dashboard Stats
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## Report Cards Tests

### Create Report Card
```bash
TOKEN="your_token_here"
STUDENT_ID="student_id_here"
curl -X POST http://localhost:5000/api/report-cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "'$STUDENT_ID'",
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
      },
      {
        "name": "Science",
        "maxMarks": 100,
        "obtainedMarks": 92
      }
    ]
  }'
```

### Get All Report Cards
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/report-cards \
  -H "Authorization: Bearer $TOKEN"
```

### Get Report Cards by Student
```bash
TOKEN="your_token_here"
STUDENT_ID="student_id_here"
curl -X GET http://localhost:5000/api/report-cards/student/$STUDENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Update Report Card
```bash
TOKEN="your_token_here"
REPORT_ID="report_id_here"
curl -X PUT http://localhost:5000/api/report-cards/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjects": [
      {
        "name": "Mathematics",
        "maxMarks": 100,
        "obtainedMarks": 88
      }
    ]
  }'
```

---

## Using Postman

1. Create a new collection
2. Add these environment variables:
   - `base_url` = `http://localhost:5000/api`
   - `token` = (set this after login)

3. Create requests using:
   ```
   {{base_url}}/endpoint
   Authorization Header: Bearer {{token}}
   ```

---

## Useful Commands

### Get last added student ID
```bash
TOKEN="your_token_here"
curl -s -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer $TOKEN" | grep -o '"_id":"[^"]*"' | head -1
```

### Clear all data (restart services)
1. Drop the database in MongoDB Atlas
2. Restart backend: `ctrl+c` then `npm run dev`

---

## Common Issues

### Missing Authorization
**Error:** `{"error":"Access token required"}`
**Fix:** Add `-H "Authorization: Bearer TOKEN"` header

### Invalid Token
**Error:** `{"error":"Invalid or expired token"}`
**Fix:** Generate new token via login endpoint

### CORS Errors
**Error:** `Access to XMLHttpRequest blocked by CORS policy`
**Fix:** Backend already has CORS enabled, check port numbers

### MongoDB Connection
**Error:** `MongoServerError`
**Fix:** 
- Check internet connection
- Verify MongoDB URI in `.env`
- Check IP whitelist in MongoDB Atlas

---

## Response Examples

### Success Response
```json
{
  "_id": "65abc123def456ghi789",
  "name": "Aarav Sharma",
  "class": "Nursery",
  "section": "A",
  "rollNumber": "001",
  "contactNumber": "9876543210",
  "address": "123 Main Street",
  "totalFee": 30000,
  "createdAt": "2024-04-01T00:00:00.000Z",
  "updatedAt": "2024-04-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Student not found",
  "statusCode": 404
}
```

---

## Testing Workflow

1. **Register/Login** → Get token
2. **Create Student** → Get student ID
3. **Add Payment** → Use student ID
4. **View Dashboard** → See updated stats
5. **Create Report Card** → Use student ID
6. **Verify Data** → Check all endpoints


# API Documentation

## 🔌 API Overview

The Land Clearing and Plantation Platform provides RESTful APIs for frontend applications and third-party integrations. All APIs use JSON for data exchange and JWT for authentication.

## 🌐 Base URLs

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`
- **ML API**: `http://localhost:5001`

## 🔐 Authentication

### **JWT Token Authentication**
All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### **Token Format**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "landowner|contractor|admin"
  }
}
```

## 👤 User Management APIs

### **User Registration**
```http
POST /api/users/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "landowner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "landowner"
  }
}
```

### **User Login**
```http
POST /api/users/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "landowner"
  }
}
```

### **Get User Profile**
```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "landowner",
    "profile": {
      "phone": "+1234567890",
      "address": "123 Main St",
      "photo": "photo_url",
      "rating": 4.5,
      "completedJobs": 10
    }
  }
}
```

### **Update User Profile**
```http
PUT /api/users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+1234567890",
  "address": "456 New St"
}
```

## 🏗️ Job Management APIs

### **Create Job Post**
```http
POST /api/jobs
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Land Clearing Project",
  "description": "Need to clear 5 acres of land",
  "workType": "land_clearing",
  "location": {
    "address": "123 Farm Road",
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  },
  "budget": {
    "min": 5000,
    "max": 10000
  },
  "timeline": "2024-02-01",
  "requirements": "Experience with heavy machinery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job posted successfully",
  "job": {
    "id": "job_id",
    "title": "Land Clearing Project",
    "status": "open",
    "postedBy": "user_id",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Get All Jobs**
```http
GET /api/jobs
```

**Query Parameters:**
- `status`: Filter by job status (open, in_progress, completed)
- `workType`: Filter by work type (land_clearing, plantation, both)
- `location`: Filter by location
- `budget`: Filter by budget range
- `page`: Page number for pagination
- `limit`: Number of items per page

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job_id",
      "title": "Land Clearing Project",
      "description": "Need to clear 5 acres of land",
      "workType": "land_clearing",
      "status": "open",
      "budget": {
        "min": 5000,
        "max": 10000
      },
      "location": {
        "address": "123 Farm Road",
        "coordinates": {
          "lat": 12.9716,
          "lng": 77.5946
        }
      },
      "postedBy": {
        "id": "user_id",
        "name": "John Doe"
      },
      "applications": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### **Get Job Details**
```http
GET /api/jobs/:jobId
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "job_id",
    "title": "Land Clearing Project",
    "description": "Need to clear 5 acres of land",
    "workType": "land_clearing",
    "status": "open",
    "budget": {
      "min": 5000,
      "max": 10000
    },
    "location": {
      "address": "123 Farm Road",
      "coordinates": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    },
    "postedBy": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "applications": [
      {
        "contractor": {
          "id": "contractor_id",
          "name": "Mike Smith",
          "rating": 4.5
        },
        "proposal": "I have 10 years experience...",
        "estimatedCost": 7500,
        "timeline": "3 weeks",
        "appliedAt": "2024-01-16T09:00:00Z"
      }
    ],
    "aiShortlist": [
      {
        "contractorId": "contractor_id",
        "overallScore": 85,
        "skillMatchScore": 90,
        "reliabilityScore": 88,
        "experienceScore": 82,
        "locationScore": 75,
        "budgetCompatibility": 80,
        "qualityScore": 85
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T09:00:00Z"
  }
}
```

## 🤖 AI Shortlist APIs

### **Generate AI Shortlist**
```http
POST /api/ai-shortlist/generate/:jobId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "AI shortlist generated successfully",
  "shortlist": [
    {
      "contractor": {
        "id": "contractor_id",
        "name": "Mike Smith",
        "rating": 4.5,
        "completedJobs": 25
      },
      "overallScore": 85,
      "skillMatchScore": 90,
      "reliabilityScore": 88,
      "experienceScore": 82,
      "locationScore": 75,
      "budgetCompatibility": 80,
      "qualityScore": 85,
      "explanation": "Excellent match based on skills and experience"
    }
  ]
}
```

### **Get AI Analytics**
```http
GET /api/ai-shortlist/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "overview": {
      "totalJobs": 150,
      "jobsWithAIShortlist": 120,
      "aiShortlistRate": 80,
      "totalContractors": 45,
      "successRate": 75
    },
    "metrics": {
      "avgAIScore": 78,
      "avgRating": 4.2,
      "avgCompletedJobs": 12
    },
    "topContractors": [
      {
        "name": "Mike Smith",
        "aiScore": 92,
        "rating": 4.8,
        "completedJobs": 30
      }
    ]
  }
}
```

## 💰 Payment APIs

### **Create Payment**
```http
POST /api/payments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "jobId": "job_id",
  "contractorId": "contractor_id",
  "amount": 7500,
  "description": "Payment for land clearing project"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "payment": {
    "id": "payment_id",
    "jobId": "job_id",
    "contractorId": "contractor_id",
    "amount": 7500,
    "status": "pending",
    "razorpayOrderId": "order_id",
    "createdAt": "2024-01-16T10:00:00Z"
  }
}
```

### **Get Payment Details**
```http
GET /api/payments/:paymentId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "payment_id",
    "jobId": "job_id",
    "contractorId": "contractor_id",
    "amount": 7500,
    "status": "completed",
    "razorpayOrderId": "order_id",
    "razorpayPaymentId": "payment_id",
    "completedAt": "2024-01-16T10:30:00Z",
    "createdAt": "2024-01-16T10:00:00Z"
  }
}
```

## 📝 Feedback APIs

### **Submit Feedback**
```http
POST /api/feedback
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "jobId": "job_id",
  "contractorId": "contractor_id",
  "rating": 5,
  "review": "Excellent work quality and communication",
  "qualityOfWork": 5,
  "communication": 5,
  "timeliness": 4,
  "professionalism": 5,
  "strengths": "Very professional and efficient",
  "areasForImprovement": "Could improve communication frequency",
  "wouldRecommend": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": "feedback_id",
    "jobId": "job_id",
    "contractorId": "contractor_id",
    "rating": 5,
    "review": "Excellent work quality and communication",
    "createdAt": "2024-01-16T11:00:00Z"
  }
}
```

### **Get Contractor Feedback**
```http
GET /api/feedback/contractor/:contractorId
```

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "id": "feedback_id",
      "jobId": "job_id",
      "landowner": {
        "id": "landowner_id",
        "name": "John Doe"
      },
      "rating": 5,
      "review": "Excellent work quality and communication",
      "qualityOfWork": 5,
      "communication": 5,
      "timeliness": 4,
      "professionalism": 5,
      "createdAt": "2024-01-16T11:00:00Z"
    }
  ]
}
```

## 🔔 Notification APIs

### **Get Notifications**
```http
GET /api/notifications
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `unread`: Filter unread notifications only

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_id",
      "type": "job_application",
      "title": "New Job Application",
      "message": "Mike Smith applied for your land clearing project",
      "data": {
        "jobId": "job_id",
        "contractorId": "contractor_id"
      },
      "isRead": false,
      "createdAt": "2024-01-16T09:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### **Mark Notification as Read**
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

## 👨‍💼 Admin APIs

### **Get Platform Analytics**
```http
GET /api/admin/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "users": {
      "total": 150,
      "landowners": 80,
      "contractors": 45,
      "admins": 5
    },
    "jobs": {
      "total": 200,
      "open": 30,
      "inProgress": 25,
      "completed": 145
    },
    "payments": {
      "total": 120,
      "pending": 10,
      "completed": 110,
      "totalAmount": 850000
    },
    "aiAnalytics": {
      "successRate": 75,
      "avgAIScore": 78,
      "topContractors": []
    }
  }
}
```

### **Get All Users (Admin)**
```http
GET /api/admin/users
Authorization: Bearer <token>
```

**Query Parameters:**
- `role`: Filter by user role
- `status`: Filter by user status
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "landowner",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z",
      "profile": {
        "rating": 4.5,
        "completedJobs": 10
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

## 🖼️ File Upload APIs

### **Upload Profile Photo**
```http
POST /api/upload/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
photo: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "photoUrl": "http://localhost:5000/uploads/photo_filename.jpg"
}
```

### **Upload Job Images**
```http
POST /api/upload/job-images
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
images: [files]
```

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "imageUrls": [
    "http://localhost:5000/uploads/image1.jpg",
    "http://localhost:5000/uploads/image2.jpg"
  ]
}
```

## 🔍 ML API Endpoints

### **Health Check**
```http
GET http://localhost:5001/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### **Make Prediction**
```http
POST http://localhost:5001/predict
Content-Type: application/json
```

**Request Body:**
```json
[
  {
    "job_work_type": "land_clearing",
    "contractor_experience": 5,
    "contractor_rating": 4.5,
    "distance": 25,
    "budget_match": 0.8,
    "skill_match": 0.9
  }
]
```

**Response:**
```json
{
  "predictions": [0.85]
}
```

## 📊 Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### **Common Error Codes**
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Invalid or missing token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Validation Error - Data validation failed
- `500`: Internal Server Error - Server error

### **Example Error Response**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

## 🔧 Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **File upload endpoints**: 20 requests per minute
- **Admin endpoints**: 50 requests per minute

## 📝 API Versioning

Current API version: `v1`

To specify version in requests:
```
GET /api/v1/jobs
```

## 🔒 Security

### **CORS Configuration**
- Allowed origins: `http://localhost:3000`, `https://your-domain.com`
- Allowed methods: GET, POST, PUT, DELETE
- Allowed headers: Content-Type, Authorization

### **Data Validation**
- All input data is validated using Joi schemas
- File uploads are validated for type and size
- SQL injection protection through parameterized queries

---

**Need API support?** Check our [Troubleshooting](Troubleshooting) guide or contact support. 
# Clientify API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not require authentication. In production, consider implementing JWT or session-based authentication.

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional additional details"
}
```

## Endpoints

### Business Management

#### Search Businesses
```http
GET /businesses?category={category}&location={location}
```

**Parameters:**
- `category` (string, required): Business category (e.g., "Restaurant")
- `location` (string, required): Location (e.g., "New York")

**Response:**
```json
[
  {
    "title": "Business Name",
    "address": "123 Main St, City",
    "phone": "(555) 123-4567",
    "website": "https://example.com",
    "email": "contact@example.com",
    "type": "Restaurant"
  }
]
```

#### Create Business
```http
POST /businesses
```

**Request Body:**
```json
{
  "name": "Business Name",
  "category": "Restaurant",
  "location": "New York",
  "phone": "(555) 123-4567",
  "website": "https://example.com",
  "email": "contact@example.com"
}
```

**Response:**
```json
{
  "id": "business_id",
  "name": "Business Name",
  "category": "Restaurant",
  "location": "New York",
  "phone": "(555) 123-4567",
  "website": "https://example.com",
  "email": "contact@example.com",
  "isScraped": false,
  "addedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Business
```http
DELETE /businesses/{id}
```

**Response:**
```json
{
  "success": true
}
```

### Lead Management

#### Get All Leads
```http
GET /leads
```

**Response:**
```json
[
  {
    "id": "lead_id",
    "businessId": "business_id",
    "business": {
      "id": "business_id",
      "name": "Business Name",
      "category": "Restaurant",
      "location": "New York",
      "phone": "(555) 123-4567",
      "website": "https://example.com",
      "email": "contact@example.com"
    },
    "status": "NEW",
    "emailSent": false,
    "notes": "Optional notes",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Lead
```http
POST /leads
```

**Request Body:**
```json
{
  "businessId": "business_id"
}
```

**Response:**
```json
{
  "id": "lead_id",
  "businessId": "business_id",
  "business": { ... },
  "status": "NEW",
  "emailSent": false,
  "notes": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Lead
```http
PATCH /leads/{id}
```

**Request Body:**
```json
{
  "status": "CONTACTED",
  "notes": "Updated notes",
  "emailSent": true
}
```

**Response:**
```json
{
  "id": "lead_id",
  "businessId": "business_id",
  "business": { ... },
  "status": "CONTACTED",
  "emailSent": true,
  "notes": "Updated notes",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Lead
```http
DELETE /leads/{id}
```

**Response:**
```json
{
  "success": true
}
```

### Email Management

#### Get Email Dashboard Data
```http
GET /emails
```

**Response:**
```json
[
  {
    "businessId": "business_id",
    "businessName": "Business Name",
    "website": "https://example.com",
    "isScraped": true,
    "leadStatus": "NEW",
    "emails": [
      {
        "id": "email_id",
        "address": "contact@example.com",
        "status": "NEW"
      }
    ]
  }
]
```

#### Update Email Status
```http
PATCH /emails/{id}
```

**Request Body:**
```json
{
  "status": "VERIFIED"
}
```

**Response:**
```json
{
  "id": "email_id",
  "address": "contact@example.com",
  "status": "VERIFIED",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Email
```http
DELETE /emails/{id}
```

**Response:**
```json
{
  "success": true
}
```

### Email Scraping

#### Scrape Emails for Business
```http
POST /scrape-emails
```

**Request Body:**
```json
{
  "businessId": "business_id",
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "emails": [
    {
      "id": "email_id",
      "address": "contact@example.com",
      "status": "NEW"
    }
  ]
}
```

#### Scrape Emails for Specific Business
```http
POST /businesses/{id}/scrape-emails
```

**Request Body:**
```json
{
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "count": 2
}
```

### Email Sending

#### Send Email
```http
POST /mail
```

**Request Body:**
```json
{
  "to": "contact@example.com",
  "businessName": "Business Name"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "email_message_id"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

## Rate Limiting

- Search requests: 10 requests per minute per IP
- Email sending: 5 emails per minute per user
- Scraping requests: 3 requests per minute per IP

## Examples

### Search for Restaurants in New York
```bash
curl "http://localhost:3000/api/businesses?category=Restaurant&location=New%20York"
```

### Create a Lead
```bash
curl -X POST "http://localhost:3000/api/leads" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "business_id"}'
```

### Update Lead Status
```bash
curl -X PATCH "http://localhost:3000/api/leads/lead_id" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONTACTED", "notes": "Called and left voicemail"}'
```

### Scrape Emails
```bash
curl -X POST "http://localhost:3000/api/scrape-emails" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "business_id", "force": false}'
```

# Clientify Architecture

## Overview
Clientify is a Next.js application for lead generation and management. It helps users find businesses, track leads, and manage email outreach campaigns.

## Project Structure

```
clientify/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── businesses/    # Business management endpoints
│   │   ├── leads/         # Lead management endpoints
│   │   ├── emails/        # Email management endpoints
│   │   └── mail/          # Email sending endpoints
│   ├── emails/            # Emails dashboard page
│   ├── leads/             # Leads dashboard page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Search.tsx        # Business search component
│   ├── Results.tsx       # Search results component
│   └── ErrorBoundary.tsx # Error handling component
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── api-utils.ts      # API helper functions
│   ├── ui-utils.ts       # UI helper functions
│   └── utils.ts          # General utilities
├── services/             # API service layer
├── types/                # TypeScript type definitions
├── prisma/               # Database schema
└── docs/                 # Documentation
```

## Key Features

### 1. Business Search
- Search for businesses by category and location using SerpAPI
- Mock data fallback when SerpAPI is not configured
- Duplicate prevention (hides already added businesses)

### 2. Lead Management
- Add businesses to leads
- Track lead status (NEW, CONTACTED, REPLIED, CLOSED)
- Add notes and manage lead information
- Delete leads

### 3. Email Management
- Scrape emails from business websites
- Track email status (NEW, VERIFIED, INVALID, BOUNCED, UNSUBSCRIBED)
- Send bulk emails to leads
- Email tracking (opens, clicks)

### 4. Dashboard Views
- **Emails Dashboard**: Manage businesses and their emails
- **Leads Dashboard**: Track and manage leads
- **Search Page**: Find new businesses

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **Email**: Nodemailer with Gmail SMTP
- **Web Scraping**: Cheerio for HTML parsing
- **External APIs**: SerpAPI for business search

## Data Models

### Business
- Basic business information (name, category, location, contact details)
- Scraping status and timestamps
- Relationships to leads and emails

### Lead
- Business relationship
- Status tracking
- Notes and communication history
- Email sending status

### Email
- Email address and status
- Engagement tracking (opens, clicks)
- Unsubscribe handling
- Source tracking for auditability

## API Design

### RESTful Endpoints
- `GET /api/businesses` - Search businesses
- `POST /api/businesses` - Create business
- `DELETE /api/businesses/[id]` - Delete business
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create lead
- `PATCH /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead
- `GET /api/emails` - Get email dashboard data
- `PATCH /api/emails/[id]` - Update email status
- `POST /api/scrape-emails` - Scrape emails for business

### Error Handling
- Standardized error responses
- Proper HTTP status codes
- Detailed error messages for debugging

## Performance Optimizations

### 1. Database
- Efficient queries with proper indexing
- Pagination for large datasets
- Connection pooling with Prisma

### 2. Frontend
- React.memo for component optimization
- useCallback and useMemo for expensive operations
- Debounced search inputs
- Lazy loading for large lists

### 3. Caching
- API response caching where appropriate
- Local storage for user preferences
- Static generation for public pages

## Security Considerations

### 1. Input Validation
- Server-side validation for all inputs
- SQL injection prevention with Prisma
- XSS protection with proper escaping

### 2. Rate Limiting
- API rate limiting to prevent abuse
- Search request throttling
- Email sending limits

### 3. Data Protection
- Secure environment variable handling
- Database connection security
- Email credential protection

## Development Guidelines

### 1. Code Organization
- Modular component structure
- Shared type definitions
- Reusable utility functions
- Consistent naming conventions

### 2. Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Proper logging for debugging

### 3. Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Component testing for UI

## Deployment

### Environment Variables
```env
DATABASE_URL="mongodb://localhost:27017/clientify"
SERPAPI_BASE_URL="https://serpapi.com/search"
SERPAPI_KEY="your_serpapi_key"
MAIL_USER="your_email@gmail.com"
MAIL_PASS="your_app_password"
```

### Build Process
1. Install dependencies: `npm install`
2. Generate Prisma client: `npx prisma generate`
3. Push database schema: `npx prisma db push`
4. Build application: `npm run build`
5. Start production server: `npm start`

## Future Enhancements

### 1. Features
- Advanced lead scoring
- Email template management
- Campaign analytics
- CRM integration
- Mobile app

### 2. Technical
- Redis caching
- Background job processing
- Real-time notifications
- Advanced search filters
- Data export/import

### 3. Scalability
- Microservices architecture
- Database sharding
- CDN integration
- Load balancing

# AI ThreadStash - Code Index

## Project Overview
AI ThreadStash is a comprehensive platform for capturing, organizing, and leveraging AI conversations. It consists of three main components:
- **Backend API** (NestJS + TypeORM + PostgreSQL)
- **Frontend Website** (Next.js + React + TailwindCSS)
- **Browser Extension** (Chrome Extension + Content Scripts)

## Directory Structure

### Backend (`backend/`)
```
backend/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   ├── auth.module.ts       # Auth module definition
│   │   ├── guards/              # Auth guards
│   │   └── strategies/          # Passport strategies
│   ├── conversations/           # Conversations module
│   │   ├── conversations.controller.ts
│   │   ├── conversations.service.ts
│   │   ├── conversations.module.ts
│   │   └── dto/                 # Data transfer objects
│   ├── database/                # Database module
│   │   ├── data-source.ts       # TypeORM data source
│   │   ├── database.module.ts
│   │   ├── user.entity.ts       # User entity
│   │   └── conversation.entity.ts # Conversation entity
│   ├── notion/                  # Notion integration
│   │   ├── notion.controller.ts
│   │   ├── notion.service.ts
│   │   └── notion.module.ts
│   ├── stripe/                  # Stripe payment integration
│   │   ├── stripe.controller.ts
│   │   ├── stripe.service.ts
│   │   └── stripe.module.ts
│   ├── migrations/              # Database migrations
│   ├── main.ts                  # Application entry point
│   └── app.module.ts            # Root module
├── package.json
├── tsconfig.json
├── jest.config.js
└── ormconfig.json
```

### Frontend Website (`frontend-website/`)
```
frontend-website/
├── src/
│   ├── app/
│   │   ├── page.tsx             # Home page
│   │   ├── layout.tsx           # Root layout
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   ├── dashboard/           # User dashboard
│   │   └── pricing/             # Pricing page
│   ├── lib/
│   │   └── api.ts               # API service client
│   ├── globals.css              # Global styles
│   └── __tests__/               # Test files
├── package.json
├── tsconfig.json
├── next.config.ts
└── jest.setup.js
```

### Browser Extension (`browser-extension/`)
```
browser-extension/
├── content-scripts/             # Content scripts for AI platforms
│   ├── chatgpt.js              # ChatGPT conversation parser

├── popup/                       # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   └── i18n.js                 # Internationalization
├── preview/                     # Conversation preview
│   ├── preview.html
│   ├── preview.css
│   ├── preview.js
│   └── libs/                   # Third-party libraries
├── background/                  # Background service worker
│   └── service-worker.js
├── locales/                     # Localization files
│   └── i18n.js
├── assets/                      # Extension icons
├── manifest.json                # Extension manifest
├── help.html                    # Help documentation
└── help.js                      # Help page logic
```

## Key Features

### Authentication System
- JWT-based authentication
- OAuth2 integration (GitHub, Google)
- User registration and login
- Password hashing with bcryptjs

### Conversation Management
- Save and organize AI conversations
- Support for multiple AI platforms (ChatGPT, Gemini, Claude, Perplexity)
- Conversation archiving and restoration
- Message management and statistics

### Notion Integration
- Connect to Notion workspaces
- Select Notion databases for export
- Save conversations to Notion pages
- Real-time synchronization status

### Payment System
- Stripe integration for subscriptions
- Pro feature access control
- Checkout and billing portal sessions
- Webhook handling for payment events

### Browser Extension
- One-click conversation export
- Support for multiple AI platforms
- Real-time content parsing
- Markdown, JSON, and PDF export formats
- Internationalization support

## Technology Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport.js
- **OAuth Providers**: GitHub, Google
- **Payment**: Stripe
- **Notion API**: @notionhq/client
- **Testing**: Jest

### Frontend
- **Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **Testing**: Jest + Testing Library

### Browser Extension
- **Manifest**: v3
- **Content Scripts**: Vanilla JavaScript
- **Internationalization**: Custom i18n system
- **Markdown Processing**: showdown.js
- **Syntax Highlighting**: Prism.js

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user
- `GET /auth/github` - GitHub OAuth
- `GET /auth/google` - Google OAuth

### Conversations
- `GET /conversations` - List conversations
- `GET /conversations/:id` - Get conversation
- `POST /conversations` - Create conversation
- `PATCH /conversations/:id` - Update conversation
- `DELETE /conversations/:id` - Delete conversation
- `POST /conversations/:id/archive` - Archive conversation
- `POST /conversations/:id/restore` - Restore conversation
- `GET /conversations/statistics` - Get statistics

### Notion Integration
- `POST /notion/connect` - Connect Notion account
- `POST /notion/database` - Select database
- `GET /notion/databases` - List databases
- `POST /notion/save` - Save to Notion
- `DELETE /notion/disconnect` - Disconnect Notion
- `GET /notion/status` - Get connection status

### Stripe Payments
- `POST /stripe/create-checkout-session` - Create checkout session
- `POST /stripe/create-portal-session` - Create billing portal session
- `POST /stripe/webhook` - Handle webhook events

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `email` (string) - User email
- `password` (string) - Hashed password
- `firstName` (string) - Optional
- `lastName` (string) - Optional
- `subscriptionStatus` (enum) - 'free' or 'pro'
- `stripeCustomerId` (string) - Stripe customer ID
- `stripeSubscriptionId` (string) - Stripe subscription ID
- `notionAccessToken` (string) - Notion OAuth token
- `notionWorkspaceId` (string) - Notion workspace ID
- `notionWorkspaceName` (string) - Notion workspace name
- `notionDatabaseId` (string) - Selected Notion database
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Conversations Table
- `id` (serial) - Primary key
- `title` (string) - Conversation title
- `summary` (text) - Optional summary
- `messages` (jsonb) - Array of message objects
- `tokenCount` (integer) - Total tokens
- `status` (enum) - 'active', 'archived', 'deleted'
- `model` (string) - AI model used
- `tags` (string) - Comma-separated tags
- `userId` (integer) - Foreign key to users
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/aithreadstash
JWT_SECRET=your-jwt-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development Setup

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend-website
npm install
npm run dev
```

### Browser Extension
1. Load the `browser-extension` directory as an unpacked extension in Chrome
2. Enable developer mode in Chrome extensions
3. Load the extension

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend-website
npm test
```

## Deployment

### Backend
- Built with `npm run build`
- Requires PostgreSQL database
- Environment variables must be set

### Frontend
- Built with `npm run build`
- Static export with Next.js

### Browser Extension
- Packaged as .crx file for distribution
- Requires manifest v3 compliance

## Security Considerations

- JWT tokens with secure secrets
- Password hashing with bcryptjs
- CORS configuration for trusted origins
- Input validation with class-validator
- Rate limiting (to be implemented)
- SQL injection prevention with TypeORM
- XSS protection in frontend and extension

## Future Enhancements

- Support for additional AI platforms
- Advanced search and filtering
- Collaboration features
- Mobile application
- API rate limiting
- Advanced analytics
- Bulk operations
- Webhook integrations
- Plugin system
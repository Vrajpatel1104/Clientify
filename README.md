# Clientify - Lead Generation App

A Next.js application for finding businesses, tracking leads, and sending outreach emails.

## Features

- 🔍 Search for businesses by category and location using SerpAPI
- 📊 Track leads with status management (NEW, CONTACTED, REPLIED, CLOSED)
- 📧 Send automated outreach emails to businesses
- 💾 Store business and lead data in MongoDB
- 🎨 Modern UI with Tailwind CSS

## Setup

1. **Install dependencies:**
```bash
npm install
# or
pnpm install
```

2. **Set up environment variables:**
Create a `.env.local` file in the root directory with:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/clientify"

# SerpAPI for business search
SERPAPI_BASE_URL="https://serpapi.com/search"
SERPAPI_KEY="your_serpapi_key_here"

# Email configuration (Gmail)
MAIL_USER="your_email@gmail.com"
MAIL_PASS="your_app_password_here"
```

3. **Set up MongoDB:**
- Install MongoDB locally or use MongoDB Atlas
- Update the DATABASE_URL in your .env.local file

4. **Get SerpAPI key:**
- Sign up at [SerpAPI](https://serpapi.com/)
- Get your API key and add it to .env.local

5. **Set up Gmail for emails:**
- Enable 2-factor authentication on your Gmail account
- Generate an app password
- Use your Gmail address and app password in .env.local

6. **Initialize the database:**
```bash
npx prisma generate
npx prisma db push
```

7. **Run the development server:**
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

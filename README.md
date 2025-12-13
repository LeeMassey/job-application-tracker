# Job Application Tracking System

## What this is and how it works:

This is a system that stores job post data from Indeed, and allows the user to view/edit the status of jobs interested in or applied to.

User can add/edit notes, change status (from interested --> applied, applied --> interview, applied --> rejected, etc).

The database is populated through a browser extension that pulls the data from whatever Indeed job posting page the user is currently on and inserts the data into the database.

Still working on the best way to deploy this for others to try/utilize for themselves.

Right now, the Next.js / DB parts of the system are run locally with npm run dev at the command line.

I will deploy on vercel with dummy data for people to play around with, and eventually package the browser extensions for others to install to get the full UX.

Still a work in progress.

#

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

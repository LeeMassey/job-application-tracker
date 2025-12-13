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

## To run locally:

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

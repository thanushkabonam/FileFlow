# FileFlow — Frontend-only React project

This version uses only React, JavaScript, CSS, browser LocalStorage and IndexedDB. It does not require Supabase, a database server, API keys or paid backend services.

## Run locally
1. Install Node.js LTS: https://nodejs.org/
2. Open this folder in VS Code.
3. In the terminal run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL printed by Vite (usually http://localhost:5173).

## Features
- Create account and login demo flow
- Responsive dashboard and navigation
- Upload files and keep their binary data in IndexedDB
- Download and delete uploaded files
- Create folders and categorize uploads
- Search files, recent activity and basic analytics
- Native device file sharing where the browser supports Web Share API

## Important limitations
- Accounts are demo-only. Credentials are stored in this browser and are not secure. Do not use real passwords.
- Files are saved only in the current browser/device. They are not uploaded to a server.
- The Share action opens the device's native share sheet if supported. Otherwise it downloads the file so you can attach it yourself. It does not create a public URL or provide cross-device sharing.
- Clearing browser site data may delete the locally stored accounts and files.
- Vercel hosting publishes the frontend application only; it does not make each visitor's local files available to other users.

## Deploy on Vercel
1. Push the project to GitHub.
2. Visit https://vercel.com/new and import your GitHub repository.
3. Select Vite (usually detected automatically).
4. Build command: `npm run build`; output directory: `dist`.
5. Deploy. No environment variables are required.

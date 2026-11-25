# FileFlow 2.0 — Frontend-only React application

## Run
```bash
npm install
npm run dev
```

## Demo administrator
Email: `admin@fileflow.demo`  
Password: `Admin@123`

Create regular users with Sign up. To demonstrate sharing:
1. Log in as a regular user and upload a file.
2. Click the Share icon and enter the second registered user's email.
3. Log out and log in as that recipient in the same browser.
4. Open Received to download the shared file.

## React concepts
- Reusable components and props: `FileCard`, `Stat`, `Layout`, `Upload`.
- React Router: page routes and nested role-protected layouts.
- Context API: `AuthProvider` and `useAuth`.
- Hooks: `useState`, `useEffect`, `useContext`.
- Controlled forms, conditional rendering, lists and keys.
- Role-based route guards for user and admin areas.

## Frontend-only limitations
Accounts and metadata use LocalStorage; file blobs use IndexedDB. Sharing is an in-app permission/record workflow between accounts in the same browser. It cannot transfer files across different devices/browsers. Demo credentials and roles are not secure: this is an educational frontend demonstration, not production authentication. A real cross-device sharing platform requires a backend/cloud service.

## Deploy
Push to your existing GitHub repository. Vercel should automatically redeploy. Build command `npm run build`, output folder `dist`. No environment variables required.

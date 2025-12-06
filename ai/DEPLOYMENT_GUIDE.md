# Displini Deployment Guide

## Project Structure

Your Displini project is now structured to serve both a landing page and a web app from the same domain:

```
Displini/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── App.tsx           # Main app with routing
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── landing/  # Landing page (/)
│   │   │   │   ├── todo/     # Todo app (/app/todo)
│   │   │   │   ├── calendar/ # Calendar app (/app/calendar)
│   │   │   │   ├── reminders/# Reminders app (/app/reminders)
│   │   │   │   ├── ai/       # AI assistant (/app/ai)
│   │   │   │   └── profile/  # Profile (/app/profile)
│   │   └── ...
│   └── public/               # Static assets
├── server/                   # Express backend
│   ├── index.ts             # Server entry point
│   ├── vite.ts              # Vite middleware & SPA fallback
│   └── routes.ts            # API routes
├── shared/                  # Shared types/schemas
└── package.json            # Root dependencies

```

## Routing Configuration

### Frontend Routes (React Router - Wouter)

**Public Routes (Not Authenticated):**
- `/` → Landing page
- `/app/*` → Redirects to `/` (landing)

**Authenticated Routes:**
- `/` → Landing page (accessible even when logged in)
- `/app` → Redirects to `/app/todo`
- `/app/todo` → Todo application
- `/app/calendar` → Calendar application
- `/app/reminders` → Reminders application
- `/app/ai` → AI assistant
- `/app/profile` → User profile

### Backend Routes (Express)

The server automatically handles:
- API routes: `/api/*`
- Static files: `/public/*`, `/assets/*`, `/images/*`, etc.
- **SPA Fallback**: All other routes serve `index.html` (React handles routing)

## How It Works

1. **Development Mode** (`npm run dev`):
   - Vite middleware serves the React app with HMR
   - Express serves API routes at `/api/*`
   - All non-API routes → React app (SPA fallback)

2. **Production Mode** (`npm run build && npm start`):
   - React app is built to `dist/public/`
   - Express serves static files from `dist/public/`
   - All non-API, non-static routes → `index.html` (SPA fallback)

3. **SPA Fallback Logic** (in `server/vite.ts`):
   ```typescript
   // Development
   app.use("*", async (req, res, next) => {
     const template = await fs.promises.readFile("client/index.html", "utf-8");
     const page = await vite.transformIndexHtml(url, template);
     res.status(200).set({ "Content-Type": "text/html" }).end(page);
   });

   // Production
   app.use("*", (_req, res) => {
     res.sendFile(path.resolve(distPath, "index.html"));
   });
   ```

## Deployment Steps

### 1. Build the Project

```bash
npm run build
```

This will:
- Build the React app with Vite → `dist/public/`
- Bundle the server code with esbuild → `dist/index.js`

### 2. Set Environment Variables

Create a `.env` file (or configure in your hosting platform):

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=your_database_url
# Add other env variables as needed
```

### 3. Start the Server

```bash
npm start
```

The server will:
- Serve the React app from `dist/public/`
- Handle API requests at `/api/*`
- Provide SPA fallback for all React routes

## Deployment Platforms

### Option 1: Traditional Server (VPS, EC2, etc.)

1. **Install Node.js** (v18+ recommended)
2. **Clone repository** and install dependencies:
   ```bash
   git clone <your-repo>
   cd Displini
   npm install
   ```
3. **Build the project**:
   ```bash
   npm run build
   ```
4. **Use PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start npm --name "displini" -- start
   pm2 save
   pm2 startup
   ```
5. **Set up Nginx** as reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Replit

Your project is already configured for Replit!

1. Push to GitHub
2. Import to Replit
3. Replit will automatically:
   - Run `npm install`
   - Start with `npm run dev` (development)
   - Or `npm run build && npm start` (deployment)

### Option 3: Render, Railway, or Fly.io

1. **Connect GitHub repository**
2. **Configure build command**: `npm run build`
3. **Configure start command**: `npm start`
4. **Set environment variables** in platform dashboard
5. **Deploy!**

### Option 4: Vercel or Netlify (Not Recommended)

⚠️ These platforms are optimized for static sites or serverless functions. Since Displini has a persistent Express backend, a traditional server platform (Render, Railway, Fly.io) is better suited.

## Domain Configuration

### Same Domain Setup (Current)

✅ **Already configured!** Both landing and app are on the same domain:
- `https://yourdomain.com/` → Landing page
- `https://yourdomain.com/app/*` → Web app

### Custom Domain

1. **Point your domain** to your server IP (A record)
2. **Set up SSL** with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## Testing Your Deployment

After deployment, test these URLs:

1. **Landing page**: `https://yourdomain.com/`
2. **Web app routes** (when authenticated):
   - `https://yourdomain.com/app/todo`
   - `https://yourdomain.com/app/calendar`
   - `https://yourdomain.com/app/reminders`
3. **API routes**: `https://yourdomain.com/api/*`
4. **Direct navigation**: Try refreshing on `/app/todo` → should work (SPA fallback)

## Troubleshooting

### Issue: Blank page on `/app/*` routes

**Solution**: Check that:
1. `dist/public/index.html` exists
2. Server is serving static files from `dist/public/`
3. SPA fallback is working (check `server/vite.ts`)

### Issue: 404 on page refresh

**Solution**: This means SPA fallback isn't working. Ensure:
```typescript
// In server/vite.ts (production)
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

### Issue: API routes returning HTML

**Solution**: Make sure API routes are registered BEFORE SPA fallback:
```typescript
// In server/index.ts
await registerRoutes(app);  // ← API routes first

if (app.get("env") === "development") {
  await setupVite(app, server);  // ← SPA fallback last
} else {
  serveStatic(app);  // ← SPA fallback last
}
```

## Performance Optimization

### 1. Enable Gzip Compression

```bash
npm install compression
```

```typescript
// In server/index.ts
import compression from 'compression';
app.use(compression());
```

### 2. Add Caching Headers

```typescript
// In server/vite.ts (production)
app.use(express.static(distPath, {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
```

### 3. Use CDN for Assets

Consider serving images, fonts, and other static assets from a CDN like Cloudflare or Vercel for faster global delivery.

## Coming Soon Features

The "Sign in" and "Get started" buttons currently show a "Coming Soon" popup. When ready to enable authentication:

1. **Update `Landing.tsx`**:
   ```typescript
   // Replace handleComingSoon with actual authentication
   const handleSignIn = () => {
     window.location.href = '/app/todo';
   };
   ```

2. **Implement authentication** in `hooks/useAuth.tsx`

3. **Remove ComingSoonDialog** from Header component

## Questions?

For more help, check:
- Express docs: https://expressjs.com/
- Vite docs: https://vitejs.dev/
- React Router (Wouter): https://github.com/molefrog/wouter


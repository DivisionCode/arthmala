# Arthmala

A boutique studio preserving four living Indian crafts — Lipan Art, Mandala, Embroidery and Crochet. Every piece made by hand, on commission.

## Project Structure
- `client/` - Vue + Vite frontend application.
- `server/` - Express + MongoDB backend application.
- `api/` - Vercel Serverless Function wrapper for the Express app.

## Local Development
To run the project locally, you will need to run both the frontend and backend servers.

### 1. Backend Server
```bash
cd server
npm install
npm run dev
```

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```

## Vercel Deployment Instructions
This repository is configured to deploy as a unified full-stack application on Vercel.

**IMPORTANT: To make the deployment work correctly, you must configure your Vercel Dashboard settings as follows:**

1. **Root Directory**: Set the root directory of your project to `./` (the default repository root, **not** `client`).
2. **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`
3. **Environment Variables**:
   - Make sure you define all necessary environment variables from `server/.env` inside the Vercel dashboard (e.g. `MONGO_URI`, `ADMIN_TOKEN`).
   - Remove or leave `VITE_API_URL` empty in Vercel to allow the frontend to use relative paths (`/api/*`) for backend communication.

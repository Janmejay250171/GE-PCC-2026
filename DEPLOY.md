# 🚀 SehatSure — Render Deployment Guide

This guide walks you through deploying **SehatSure** to [Render](https://render.com) in just a few minutes.

SehatSure is designed as a unified full-stack service: Express serves the production React/Vite frontend as static assets and hosts all REST APIs (`/api/*`) on a single port. This eliminates CORS complexities and fits comfortably within Render's free tier (512 MB RAM).

---

## 📋 Prerequisites Checklist

Before deploying, ensure you have:
1. **GitHub / GitLab Repository**: Your SehatSure code pushed to a Git repository.
2. **Render Account**: Free account at [render.com](https://render.com).
3. **MongoDB Atlas Database** (Free M0):
   - Sign up at [cloud.mongodb.com](https://cloud.mongodb.com).
   - Create a free **M0 Cluster** (Shared, 512MB free forever).
   - In **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
   - In **Database Access**, create a user and password.
   - Click **Connect** → **Drivers** → Copy your connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/sehatsure?retryWrites=true&w=majority
     ```
4. **Google Gemini API Key**:
   - Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Method 1: Deploy with Render Blueprint (Recommended — 1 Click)

The repository includes a preconfigured [render.yaml](file:///d:/BTECH/HACKMATRIX/render.yaml).

1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your Git repository (`HACKMATRIX-PCCOE` or your fork).
4. Render will detect `render.yaml` automatically:
   - **Service Name**: `sehatsure`
   - **Environment**: `Node`
   - **Plan**: `Free`
5. Render will prompt you for the required environment variables:
   - `MONGODB_URI`: Paste your MongoDB Atlas URI.
   - `GEMINI_API_KEY`: Paste your Google Gemini API Key.
6. Click **Apply**.
7. Render will build and start your application automatically!

---

## Method 2: Manual Web Service Deployment

If you prefer configuring via the Render web UI:

1. In Render Dashboard, click **New +** → **Web Service**.
2. Select your repository.
3. Configure the service settings:
   - **Name**: `sehatsure`
   - **Region**: Any (e.g., `Singapore`, `Frankfurt`, or `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty — runs from repository root)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run build:render
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free`

4. Click **Advanced** and configure:
   - **Health Check Path**: `/api/health`

5. Add **Environment Variables**:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `NODE_VERSION` | `20.18.0` | Locks Node runtime version |
   | `NODE_ENV` | `production` | Production mode |
   | `NODE_OPTIONS` | `--max-old-space-size=450` | Optimizes V8 GC for Render 512MB RAM |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key |
   | `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Default extraction model |

6. Click **Create Web Service**.

---

## 🔍 Verification & Health Check

Once deployment finishes:
- Open your Render URL (e.g. `https://sehatsure.onrender.com`).
- The frontend will load instantly.
- Test the health endpoint: `https://sehatsure.onrender.com/api/health`
  ```json
  {
    "status": "healthy",
    "service": "SehatSure Backend",
    "timestamp": "2026-..."
  }
  ```
- Upload or test demo policies on the UI.
- Verify hospital discovery searches.

---

## 🛠️ Key Optimizations Included

1. **Memory Cap Guard**: `--max-old-space-size=450` prevents Node from exceeding Render's 512MB memory limit.
2. **Stream-Parsed Hospital Dataset**: The 53,000+ hospital database indexes in under ~3 seconds and operates with a small ~168MB RSS footprint.
3. **Fail-Safe Build**: Build scripts use `--include=dev` and have build tools (`typescript`, `vite`) in explicit dependencies so builds never fail due to omitted devDependencies.
4. **Zero-CORS Unified Architecture**: The Express server serves both the compiled Vite assets and API endpoints under the same origin.
5. **Node Version Pinning**: `.node-version` locks the Node environment to `20.18.0`.

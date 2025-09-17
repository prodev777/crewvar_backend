# Vercel Backend Deployment Guide

This guide will help you deploy your Crewvar backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Database**: Set up a cloud MySQL database (PlanetScale, Railway, or similar)

## Step 1: Prepare Your Backend

### 1.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Login to Vercel
```bash
vercel login
```

## Step 2: Configure Environment Variables

### 2.1 Set up Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard and add these environment variables:

```env
# Database Configuration
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=crewvar
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Environment
NODE_ENV=production
```

## Step 3: Deploy to Vercel

### 3.1 Navigate to Backend Directory
```bash
cd backend
```

### 3.2 Build the Project
```bash
npm run build
```

### 3.3 Initialize Vercel Project
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name** → crewvar-backend (or your preferred name)
- **Directory** → ./
- **Override settings?** → No

### 3.4 Deploy
```bash
vercel --prod
```

## Step 4: Update Frontend Configuration

### 4.1 Update Frontend API URL

In your frontend's `.env` file, update the API URL:

```env
VITE_API_URL=https://your-backend-domain.vercel.app
```

### 4.2 Update Vite Config

In `frontend/vite.config.ts`, update the proxy target:

```typescript
server: {
    proxy: {
        '/api': {
            target: process.env.VITE_API_URL || 'https://your-backend-domain.vercel.app',
            changeOrigin: true,
            secure: true,
        }
    }
}
```

## Step 5: Test Your Deployment

### 5.1 Test Health Endpoint
Visit: `https://your-backend-domain.vercel.app/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "environment": "production"
}
```

### 5.2 Test API Endpoints
Visit: `https://your-backend-domain.vercel.app/`

You should see the API information page.

## Important Notes

### ⚠️ Limitations on Vercel

1. **No Socket.IO**: Real-time chat won't work on Vercel (serverless functions don't support WebSockets)
2. **File Uploads**: Limited to 4.5MB per request
3. **Execution Time**: Functions timeout after 30 seconds (Pro plan) or 10 seconds (Free plan)
4. **Cold Starts**: First request might be slower due to serverless nature

### 🔧 Alternative Solutions

For full functionality, consider these alternatives:

1. **Railway**: Better for traditional Node.js apps with Socket.IO
2. **Render**: Good for full-stack applications
3. **DigitalOcean App Platform**: Supports WebSockets
4. **AWS EC2**: Full control over server environment

### 📝 Database Setup

For production, use a cloud database service:

1. **PlanetScale**: MySQL-compatible, serverless
2. **Railway**: Easy MySQL setup
3. **AWS RDS**: Scalable MySQL
4. **Google Cloud SQL**: Managed MySQL

## Troubleshooting

### Common Issues

1. **404 Not Found**: Check your `vercel.json` configuration
2. **Database Connection Error**: Verify environment variables
3. **CORS Issues**: Update `FRONTEND_URL` environment variable
4. **Build Failures**: Check TypeScript compilation errors

### Debug Commands

```bash
# Check deployment logs
vercel logs

# Check function logs
vercel logs --follow

# Test locally
vercel dev
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `mysql.planetscale.com` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `crewvar` |
| `DB_USER` | Database username | `your-username` |
| `DB_PASSWORD` | Database password | `your-password` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email username | `your-email@gmail.com` |
| `EMAIL_PASS` | Email password | `your-app-password` |
| `FRONTEND_URL` | Frontend domain | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment | `production` |

## Next Steps

1. Set up your cloud database
2. Configure environment variables
3. Deploy to Vercel
4. Update frontend configuration
5. Test all endpoints
6. Consider migrating to a platform that supports WebSockets for full functionality

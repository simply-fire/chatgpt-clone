# 🚀 Render.com Deployment Guide

## Prerequisites
- GitHub account
- Render.com account (free tier available)
- Git repository with your code

## Step-by-Step Deployment

### 1. Push Code to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit for ChatGPT clone deployment"

# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/chatgpt-clone.git

# Push to GitHub
git push -u origin main
```

### 2. Create Web Service on Render

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub Repository**: 
   - Select your `chatgpt-clone` repository
   - Grant necessary permissions

### 3. Configure Build Settings

Use these exact settings:

| Setting | Value |
|---------|-------|
| **Name** | `chatgpt-clone` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (for testing) |
| **Auto-Deploy** | `Yes` |

### 4. Set Environment Variables

⚠️ **CRITICAL**: Add these environment variables in Render Dashboard:

1. Go to **Environment** tab in your service
2. Click **"Add from .env"** and upload your `.env.local` file, OR
3. Add manually:

```
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MEM0_API_KEY=your_mem0_api_key_here
NODE_ENV=production
```

### 5. Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (usually 2-5 minutes)
3. Your app will be live at: `https://your-service-name.onrender.com`

## Post-Deployment

### Health Check
- Visit your deployed URL
- Test chat functionality
- Verify file upload works
- Check memory features

### Monitoring
- Monitor logs in Render dashboard
- Set up alerts for downtime
- Check performance metrics

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

2. **Environment Variables Missing**
   - Ensure all required env vars are set
   - Check variable names match exactly
   - Verify API keys are valid

3. **App Crashes on Start**
   - Check start command is correct
   - Verify port configuration (Render auto-assigns PORT)
   - Review application logs

### Logs Access
```bash
# View logs in dashboard or via CLI
render logs --service=your-service-name
```

## Scaling & Performance

### Free Tier Limitations
- Service sleeps after 15 minutes of inactivity
- 750 hours/month (sufficient for development)
- 512 MB RAM, 0.5 CPU

### Upgrade Options
- **Starter**: $7/month - Always on, faster builds
- **Standard**: $25/month - More resources, better performance

## Custom Domain (Optional)

1. Go to **Settings** → **Custom Domains**
2. Add your domain
3. Configure DNS with your domain provider
4. SSL certificate auto-configured

## Security Best Practices

✅ **Implemented**:
- Environment variables stored securely
- API keys not in source code
- HTTPS enforced by default

🔒 **Additional Recommendations**:
- Regular API key rotation
- Monitor usage logs
- Set up rate limiting

## Support

- **Render Docs**: https://render.com/docs
- **Status Page**: https://status.render.com/
- **Community**: https://community.render.com/

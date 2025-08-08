# Ngrok Setup for Chat App Testing

This guide will help you set up ngrok to test your chat application with multiple users.

## Prerequisites

1. **Install ngrok**: Download from [ngrok.com](https://ngrok.com/download)
2. **Get ngrok auth token**: Sign up at [ngrok.com](https://ngrok.com) and get your auth token
3. **Authenticate ngrok**: Run `ngrok config add-authtoken YOUR_AUTH_TOKEN`

## Quick Setup

### Option 1: Use the setup script
```bash
chmod +x setup-ngrok.sh
./setup-ngrok.sh
```

### Option 2: Manual setup

1. **Start your chat application**:
   ```bash
   docker-compose up
   ```

2. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

3. **Copy the ngrok URL** (e.g., `https://d618f7d12ec2.ngrok-free.app`)

4. **Update docker-compose.yml**:
   ```yaml
   environment:
     - ALLOWED_ORIGINS=http://localhost:3000,https://d618f7d12ec2.ngrok-free.app
   ```

5. **Restart the backend**:
   ```bash
   docker-compose restart backend
   ```

## Testing with Multiple Users

1. **User 1**: Open `http://localhost:3000` in your browser
2. **User 2**: Open the ngrok URL (e.g., `https://d618f7d12ec2.ngrok-free.app`) in another browser or device
3. **Register accounts** for both users
4. **Start chatting** between the two users

## Troubleshooting

### "Invalid Host header" Error
- ✅ **Fixed**: The `DANGEROUSLY_DISABLE_HOST_CHECK=true` environment variable is now set
- ✅ **Fixed**: React dev server will accept any host header

### CORS Errors
- ✅ **Fixed**: Backend now supports multiple origins via `ALLOWED_ORIGINS` environment variable
- ✅ **Fixed**: Socket.IO server accepts connections from ngrok URLs

### Connection Issues
1. **Check ngrok status**: Visit `http://localhost:4040` to see tunnel status
2. **Verify backend restart**: Make sure you restarted the backend after updating `ALLOWED_ORIGINS`
3. **Check browser console**: Look for any JavaScript errors

## Security Notes

⚠️ **Important**: This setup is for testing only. In production:
- Don't use `DANGEROUSLY_DISABLE_HOST_CHECK=true`
- Use proper CORS configuration
- Implement proper authentication and authorization
- Use HTTPS in production

## Alternative: Use ngrok for both frontend and backend

If you want to expose both services:

1. **Frontend tunnel**:
   ```bash
   ngrok http 3000
   ```

2. **Backend tunnel**:
   ```bash
   ngrok http 8000
   ```

3. **Update frontend environment** to use the backend ngrok URL:
   ```yaml
   environment:
     - REACT_APP_API_URL=https://your-backend-ngrok-url
     - REACT_APP_WS_URL=wss://your-backend-ngrok-url
   ```

## Useful Commands

```bash
# Check ngrok tunnels
curl http://localhost:4040/api/tunnels

# View ngrok web interface
open http://localhost:4040

# Stop ngrok
pkill ngrok
```

## Next Steps

Once ngrok is working:
1. Test user registration and login
2. Test creating chats between users
3. Test real-time messaging
4. Test the abuse detection system
5. Test on different devices/browsers

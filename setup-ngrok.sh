#!/bin/bash

# Ngrok Setup Script for Chat App
# This script sets up ngrok tunnels for both frontend and backend

echo "🚀 Setting up ngrok tunnels for Chat App..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it from https://ngrok.com/download"
    exit 1
fi

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo "❌ ngrok is not authenticated. Please run: ngrok config add-authtoken YOUR_AUTH_TOKEN"
    exit 1
fi

echo "✅ ngrok is installed and authenticated"

# Kill any existing ngrok processes
echo "🔄 Stopping existing ngrok processes..."
pkill ngrok 2>/dev/null || true
sleep 2

# Start ngrok tunnel for frontend (port 3000)
echo "🌐 Starting ngrok tunnel for frontend (port 3000)..."
ngrok http 3000 --log=stdout > ngrok-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for the tunnel to start
sleep 3

# Get the frontend tunnel URL
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$FRONTEND_URL" ]; then
    echo "❌ Failed to get frontend tunnel URL"
    exit 1
fi

echo "✅ Frontend tunnel: $FRONTEND_URL"

# Start ngrok tunnel for backend (port 8000)
echo "🔧 Starting ngrok tunnel for backend (port 8000)..."
ngrok http 8000 --log=stdout > ngrok-backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for the tunnel to start
sleep 3

# Get the backend tunnel URL
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | tail -1 | cut -d'"' -f4)
if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to get backend tunnel URL"
    exit 1
fi

echo "✅ Backend tunnel: $BACKEND_URL"

# Update docker-compose.yml with the new URLs
echo "📝 Updating docker-compose.yml with ngrok URLs..."

# Create a backup of the original file
cp docker-compose.yml docker-compose.yml.backup

# Update the ALLOWED_ORIGINS in docker-compose.yml
sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:3000,$FRONTEND_URL|" docker-compose.yml

# Update the frontend environment variables
sed -i.bak "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$BACKEND_URL|" docker-compose.yml
sed -i.bak "s|REACT_APP_WS_URL=.*|REACT_APP_WS_URL=${BACKEND_URL/http/ws}|" docker-compose.yml

echo "✅ Updated docker-compose.yml"

# Restart the containers to apply the new configuration
echo "🔄 Restarting containers..."
docker-compose down
docker-compose up -d

echo ""
echo "🎉 Ngrok setup complete!"
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL: $BACKEND_URL"
echo ""
echo "📋 Instructions:"
echo "1. Open $FRONTEND_URL in your browser"
echo "2. Register/login with the app"
echo "3. Test the chat functionality"
echo ""
echo "📊 Monitor tunnels at: http://localhost:4040"
echo "📝 Logs: ngrok-frontend.log and ngrok-backend.log"
echo ""
echo "🛑 To stop: pkill ngrok && docker-compose down"
echo "🔄 To restart: ./setup-ngrok.sh"

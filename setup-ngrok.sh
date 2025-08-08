#!/bin/bash

echo "=== Chat App Ngrok Setup ==="
echo ""
echo "This script will help you set up ngrok for testing your chat application."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed."
    echo "Please install ngrok from: https://ngrok.com/download"
    echo ""
    echo "After installation, you'll need to authenticate with:"
    echo "ngrok config add-authtoken YOUR_AUTH_TOKEN"
    exit 1
fi

echo "✅ ngrok is installed"
echo ""

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo "❌ ngrok is not authenticated."
    echo "Please run: ngrok config add-authtoken YOUR_AUTH_TOKEN"
    echo "Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

echo "✅ ngrok is authenticated"
echo ""

echo "Starting ngrok tunnel for frontend (port 3000)..."
echo "This will create a public URL for your React app."
echo ""

# Start ngrok for frontend
ngrok http 3000 --log=stdout &
NGROK_PID=$!

# Wait a moment for ngrok to start
sleep 3

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL. Please check if ngrok is running properly."
    exit 1
fi

echo "✅ Ngrok tunnel started!"
echo "🌐 Frontend URL: $NGROK_URL"
echo ""

echo "Now you need to update your docker-compose.yml with the new ngrok URL:"
echo ""
echo "Update the ALLOWED_ORIGINS environment variable in docker-compose.yml:"
echo "  - ALLOWED_ORIGINS=http://localhost:3000,$NGROK_URL"
echo ""

echo "Then restart your backend:"
echo "  docker-compose restart backend"
echo ""

echo "You can now access your chat app at: $NGROK_URL"
echo ""
echo "To stop ngrok, press Ctrl+C or run: kill $NGROK_PID"
echo ""

# Keep the script running
wait $NGROK_PID

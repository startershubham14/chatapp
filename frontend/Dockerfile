FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable to suppress deprecation warnings
ENV NODE_OPTIONS=--no-deprecation

# Set environment variable to disable host check for ngrok
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true

# Start the development server
CMD ["npm", "start"]
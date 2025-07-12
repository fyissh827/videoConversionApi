# Use Node 18 Alpine as the base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the application's port
EXPOSE 9051

# Start the server
CMD ["node", "dist/index.js"]
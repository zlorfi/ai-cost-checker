# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the built app
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (default Vite port - actual value can be overridden via VITE_PORT)
EXPOSE 5173

# Run the app and honor VITE_PORT when provided
CMD ["sh", "-c", "serve -s dist -l ${VITE_PORT:-5173} --no-clipboard"]

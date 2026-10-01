# ==========================================
# React 18 + Three.js Production Frontend Dockerfile
# Multi-Stage Build: Node 20 Builder -> Nginx Alpine
# ==========================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with API & WebSocket reverse proxies
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

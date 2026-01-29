# Base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Environment variables should be passed at runtime, but we can set defaults
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start command (migrates DB then starts app)
# Note: In production, migrations are often run in a separate step/job, 
# but for simplicity in this container, we can include it or just run start.
# Using standard start command.
CMD ["npm", "start"]

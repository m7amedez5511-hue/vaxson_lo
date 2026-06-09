# Base Image
FROM node:25-alpine AS base
# -----------------------
# Development Stage
# -----------------------
FROM base AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Generate Prisma Client at build time
RUN npx prisma generate

# Fix line endings and permissions for the start script
RUN sed -i 's/\r$//' ./scripts/start.sh && chmod +x ./scripts/start.sh



EXPOSE 3000

CMD ["sh", "./scripts/start.sh"]

# -----------------------
# Production Stage
# -----------------------
FROM base AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy project files
COPY . . 

# Generate Prisma Client at build time
RUN npx prisma generate

# Fix line endings and permissions for the start script
RUN sed -i 's/\r$//' ./scripts/start.sh && chmod +x ./scripts/start.sh

EXPOSE 3000

CMD ["sh", "./scripts/start.sh"]
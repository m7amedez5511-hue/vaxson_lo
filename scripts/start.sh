#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "⏳ Starting Logistics API Initialization..."

if [ "$SKIP_PRISMA_GENERATE" = "true" ]; then
  echo "⏭️  Skipping prisma generate (SKIP_PRISMA_GENERATE=true)."
else
  echo "📦 Generating Prisma Client..."
  npx prisma generate
fi

echo "🔄 Syncing Database with Prisma schema..."
npx prisma migrate deploy

if [ "$RUN_DB_SEED" = "true" ]; then
  echo "🌱 Seeding initial data..."
  npx prisma db seed
else
  echo "⏭️  Skipping db seed (set RUN_DB_SEED=true to enable)."
fi

echo "🚀 Starting the server..."
if [ "$NODE_ENV" = "development" ]; then
  exec npm run dev
else
  exec npm start
fi

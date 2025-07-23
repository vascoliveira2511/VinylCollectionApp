# Database Setup Guide

This app uses PostgreSQL for production deployment on Vercel. Here are your options for setting up the database:

## Option 1: Neon (Recommended for Vercel)

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from your Neon dashboard
4. Update your `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@ep-example.us-east-1.aws.neon.tech/vinyl_collection?sslmode=require"
   ```

## Option 2: Supabase

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database and copy the connection string
4. Update your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:password@db.projectid.supabase.co:5432/postgres"
   ```

## Option 3: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `vinyl_collection`
3. Update your `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/vinyl_collection"
   ```

## Setting up the Database

After setting up your DATABASE_URL:

1. Run the migration:
   ```bash
   npm run db:migrate
   ```

2. Or push the schema directly:
   ```bash
   npm run db:push
   ```

## Vercel Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT tokens

## Troubleshooting

- Make sure your database service allows connections from Vercel
- Check that SSL is properly configured if required
- Verify your connection string format matches your provider's requirements
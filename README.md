# Vinyl Collection App

A comprehensive vinyl record collection management application built with Next.js, featuring social elements, Discogs integration, and advanced collection organization.

## Features

### Core Collection Management
*   **User Authentication:** Secure JWT-based login, signup, and logout functionality
*   **Multiple Collections:** Create and manage multiple custom collections with themes and privacy settings
*   **Advanced Vinyl Management:** Add, edit, delete, and organize vinyl records with detailed metadata
*   **Barcode Scanning:** Add records by scanning barcodes with built-in camera integration
*   **Import/Export:** Import and export collections in various formats

### Discogs Integration
*   **OAuth Authentication:** Secure connection to your Discogs account
*   **Auto-sync Collections:** Synchronize your Discogs collection and wantlist
*   **Release Information:** Fetch detailed album information, images, and tracklists
*   **Search & Suggestions:** Real-time search and artist/title suggestions
*   **Duplicate Management:** Automatic detection and cleanup of duplicate records

### Social Features
*   **Friends System:** Send and manage friend requests
*   **Recommendations:** Share vinyl recommendations with friends
*   **Public Collections:** Make collections public for others to browse
*   **Comments & Reviews:** Comment on and review vinyl releases
*   **User Profiles:** Browse other users' collections and profiles

### Advanced Features
*   **Vinyl Status Tracking:** Mark records as wanted, owned, or sold with priority levels
*   **Price Alerts:** Set target prices and get notified when records become available
*   **Spotify Integration:** Preview tracks directly in the app
*   **Statistics & Charts:** Comprehensive collection analytics with interactive charts
*   **Dark/Light Theme:** Toggle between themes with persistent preference
*   **Search & Filtering:** Advanced filtering by artist, title, genre, year, and more
*   **Infinite Scroll:** Smooth browsing experience for large collections

### User Customization
*   **Avatar Management:** Upload custom avatars or use generated ones
*   **Display Preferences:** Choose between grid and list views
*   **Collection Theming:** Customize collection colors and images
*   **Privacy Controls:** Control visibility of collections and profile information

## Technologies Used

*   **Next.js 14:** React framework with App Router and server-side rendering
*   **TypeScript:** Full type safety throughout the application
*   **Prisma:** Type-safe database ORM with PostgreSQL
*   **Authentication:** JWT-based auth with bcryptjs password hashing
*   **Chart.js & react-chartjs-2:** Interactive data visualizations
*   **Lucide React:** Modern icon library
*   **OAuth Integration:** Discogs OAuth 1.0a implementation
*   **Image Processing:** Advanced image handling and optimization

## Getting Started

### Prerequisites

Make sure you have Node.js and npm (or yarn) installed on your machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/vinyl-collection-app.git
    cd vinyl-collection-app
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Variables

Create a `.env.local` file in the root of the project and add the following:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vinyl_collection"

# Authentication
JWT_SECRET=your_super_secret_key_here
# IMPORTANT: Replace 'your_super_secret_key_here' with a strong, unique secret!

# Discogs API (Optional - for enhanced features)
DISCOGS_CONSUMER_KEY=your_discogs_consumer_key
DISCOGS_CONSUMER_SECRET=your_discogs_consumer_secret

# Spotify API (Optional - for music previews)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Email Service (Required for user verification and password reset)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

**Note:** 
- **Resend API** is required for email functionality (account verification, password reset, welcome emails)
- **Discogs and Spotify** integrations are optional but provide enhanced functionality
- **Google OAuth** is optional for social login

### Database Setup

This application uses PostgreSQL with Prisma ORM. To set up the database:

1. Make sure you have PostgreSQL installed and running
2. Create a database for the application
3. Run the Prisma migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Starting the Production Server

```bash
npm run start
# or
yarn start
```

## Project Structure

```
src/app/
├── api/                    # Backend API routes
│   ├── auth/              # Authentication endpoints
│   ├── collection/        # Individual vinyl management
│   ├── collections/       # Collection management
│   ├── discogs/          # Discogs integration
│   ├── friends/          # Social features
│   ├── spotify/          # Spotify integration
│   ├── stats/            # Analytics endpoints
│   └── users/            # User management
├── components/           # Reusable React components
│   ├── Avatar.tsx        # User avatar management
│   ├── BarcodeScanner.tsx # Barcode scanning functionality
│   ├── ChartComponent.tsx # Data visualization
│   ├── ThemeProvider.tsx  # Theme management
│   └── VinylCard.tsx     # Vinyl display components
├── hooks/                # Custom React hooks
├── (pages)/              # App routes
│   ├── add/              # Add new vinyl
│   ├── browse/           # Browse collections
│   ├── friends/          # Social features
│   ├── profile/          # User profile
│   ├── stats/            # Analytics dashboard
│   └── vinyl/[id]/       # Individual vinyl details
└── middleware.ts         # JWT authentication and route protection

prisma/
└── schema.prisma         # Database schema with comprehensive data models
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

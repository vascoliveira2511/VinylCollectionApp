# Vinyl Collection App

A retro-themed web application built with Next.js to help you manage and organize your vinyl record collection.

## Features

*   **User Authentication:** Secure login, signup, and logout functionality.
*   **Collection Management:** Add, edit, and delete vinyl records from your collection.
*   **Discogs Integration:**
    *   Fetch album details (artist, title, year, image, genre) directly from Discogs.
    *   Get suggestions for artists and titles while adding new records.
    *   Display Discogs user profile information and collection statistics.
*   **Filtering:** Easily filter your collection by artist, title, genre, and year.
*   **User Profile & Stats:** View your total records, top genres, and other collection statistics.

## Technologies Used

*   **Next.js:** React framework for building server-side rendered and static web applications.
*   **React:** JavaScript library for building user interfaces.
*   **TypeScript:** Superset of JavaScript that adds static types.
*   **bcryptjs:** For hashing passwords.
*   **jose:** JavaScript Object Signing and Encryption library for JWT authentication.
*   **Chart.js & react-chartjs-2:** For creating interactive charts to visualize collection statistics.

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
JWT_SECRET=your_super_secret_key_here
# IMPORTANT: Replace 'your_super_secret_key_here' with a strong, unique secret!
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

*   `src/app/`: Contains the main application pages and API routes.
    *   `api/`: Backend API routes for authentication, collection management, and Discogs integration.
    *   `components/`: Reusable React components (e.g., Navbar, ChartComponent).
    *   `login/`, `profile/`, `signup/`, `stats/`: Specific pages for user interaction.
*   `data/`: Placeholder for `collection.json` and `users.json` (likely for development/mock data).
*   `src/middleware.ts`: Handles JWT-based authentication and route protection.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

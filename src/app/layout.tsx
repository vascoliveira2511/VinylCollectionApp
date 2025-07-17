import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./reset.css"; // Import reset.css first
import "./globals.css";
import Navbar from "./components/Navbar";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "My Vinyl Collection",
  description: "A retro-themed app to manage your vinyls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={robotoMono.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
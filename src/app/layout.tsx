import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./reset.css"; // Import reset.css first
import "./globals.css";
import ConditionalNavbar from "./components/ConditionalNavbar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Vinyl Collection",
  description: "A beautiful app to manage your vinyl record collection",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <ConditionalNavbar />
        {children}
      </body>
    </html>
  );
}
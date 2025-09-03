import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clientify - Lead Generation App",
  description: "Find businesses, track leads, and send outreach emails with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-gray-900 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-300">
                  Clientify
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/leads"
                  className="text-gray-200 hover:text-gray-300 hover:bg-blue-700 px-3 py-2 bg-blue-600 rounded-md text-sm font-medium"
                >
                  Leads
                </Link>
                <Link
                  href="/emails"
                  className="text-gray-200 hover:text-gray-300 hover:bg-purple-700 px-3 py-2 bg-purple-600 rounded-md text-sm font-medium"
                >
                  Emails
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

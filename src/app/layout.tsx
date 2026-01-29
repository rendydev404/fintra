import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

import { GlobalNotifications } from "@/components/global-notifications";
import { UserPresenceTracker } from "@/components/user-presence";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["finance", "tracking", "budget", "expense", "income", "money", "keuangan", "anggaran"],
  authors: [{ name: "FinTra Team" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <UserPresenceTracker />
        <GlobalNotifications />
        {children}
      </body>
    </html>
  );
}

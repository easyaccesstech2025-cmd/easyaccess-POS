import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Easy Access POS — Web Dashboard",
  description: "Manage your POS system from anywhere. Products, inventory, reports, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#F1F5F9]`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}


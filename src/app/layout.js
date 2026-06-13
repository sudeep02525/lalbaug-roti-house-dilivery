import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotificationListener from "@/components/NotificationListener";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Delivery App",
  description: "Delivery Dashboard for Lalbaug Roti House",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-[var(--background)]`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster 
            position="top-center" 
            reverseOrder={false}
            toastOptions={{
              className: '',
              style: {
                background: '#E85D04', // Orange energetic delivery color
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '16px 24px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(232,93,4,0.3)',
              },
            }}
          />
          <NotificationListener />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

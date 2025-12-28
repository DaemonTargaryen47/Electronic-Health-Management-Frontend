"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "@/context/ThemeContext";
import ClientThemeWrapper from "@/context/ClientThemeWrapper";
import { useEffect } from 'react';
import { initSessionMonitoring } from '../utils/sessionUtils';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// Removed metadata export

export default function RootLayout({ children }) {
    useEffect(() => {
        // Initialize session monitoring
        initSessionMonitoring();
    }, []);

    return (
        <html lang='en'>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider>
                    <ClientThemeWrapper>
                        <div className='mx-auto min-h-screen max-w-7xl text-2xl'>
                            <Navbar />
                            {children}
                        </div>
                    </ClientThemeWrapper>
                </ThemeProvider>
            </body>
        </html>
    );
}

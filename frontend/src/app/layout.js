"use client";
import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';
import {AuthProvider} from "@/contexts/AuthContext";
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
              <AuthProvider>
                  {children}
              </AuthProvider>
          </ThemeProvider>
          <ToastContainer autoClose={3000} draggable={false}/>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
"use client";

import { useEffect } from "react";
import { ApiService } from "@/lib/api";
import { logger } from "@/lib/logger";

export default function AuthSuccess() {
  useEffect(() => {
    const handleAuthSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('accessToken') || urlParams.get('token');
      const refreshToken = urlParams.get('refreshToken');
       
       if (token) {
         // Store token
         ApiService.setAuthToken(token);
         // Persist refresh token if provided
         if (refreshToken) {
           try {
             localStorage.setItem('refreshToken', refreshToken);
             sessionStorage.setItem('refreshToken', refreshToken);
           } catch {}
         }
         
         // Check if this is running in a popup window
         const isPopup = window.opener && window.opener !== window;
         
         if (isPopup) {
           // If this is a popup, close it and let the parent window handle the redirect
           try {
             // Notify parent window of successful authentication
             window.opener.postMessage({ type: 'AUTH_SUCCESS', token, refreshToken }, window.location.origin);
           } catch (error) {
             logger.error('Failed to notify parent window:', error);
           }
           // Close the popup
           window.close();
         } else {
           // If not a popup, redirect normally
           window.location.href = '/dashboard';
         }
       } else {
         window.location.href = '/login?error=missing_token';
       }
     };

    handleAuthSuccess();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Signing you in...</p>
      </div>
    </div>
  );
}
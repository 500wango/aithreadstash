"use client";

import { useEffect } from 'react';
import { ApiService } from '@/lib/api';
import { logger } from '@/lib/logger';

// 为 Chrome 扩展 API 提供最小类型声明
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: <T = unknown, R = unknown>(
          message: T,
          callback?: (response: R) => void
        ) => void;
      };
    };
  }
}

export default function ExtensionAuth() {
  useEffect(() => {
    // Only run in browser extension environment
    // More strict check: ensure we're in a proper extension context
    const isExtensionEnvironment = window.chrome?.runtime && 
                                 typeof window.chrome.runtime === 'object' &&
                                 'id' in window.chrome.runtime &&
                                 window.chrome.runtime.sendMessage &&
                                 typeof window.chrome.runtime.sendMessage === 'function';
    
    if (!isExtensionEnvironment) {
      return;
    }
    
    // Check if user is authenticated and has tokens
    const checkAuth = async () => {
      try {
        if (ApiService.isAuthenticated()) {
          const accessToken = ApiService.getToken();
          const refreshToken = localStorage.getItem('refreshToken');
          
          // Send auth success message to extension
          if (accessToken && refreshToken) {
            try {
              window.chrome?.runtime?.sendMessage?.(
                {
                  action: 'auth_success',
                  tokens: {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                  }
                },
                (response?: { success?: boolean; error?: string }) => {
                  if (!(response && response.success)) {
                    logger.error('Extension auth sync failed:', response?.error);
                  }
                }
              );
            } catch (error) {
              logger.error('Failed to send auth to extension:', error);
            }
          }
        }
      } catch (error) {
        logger.error('Extension auth check failed:', error);
      }
    };

    checkAuth();
  }, []);

  return null;
}
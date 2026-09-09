import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getValidToken } from '@/services/core/checkValidityToken';

export interface AppNotification {
  id: string;
  title: string;
  priority: string;
  notice_id?: string;
  issue_id?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  isConnected: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearAll: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Request native notification permissions
  useEffect(() => {
    if (isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  // Update App Badge
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount).catch(console.error);
      } else {
        (navigator as any).clearAppBadge().catch(console.error);
      }
    }
  }, [unreadCount]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWebSocket = async () => {
      // 1. Get the current valid access token
      const token = await getValidToken();
      if (!token) return;

      // 2. Connect to Daphne WebSocket endpoint
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      ws = new WebSocket(`${wsUrl}/ws/notifications/`);

      ws.onopen = () => {
        setIsConnected(true);
        // 3. Send identify payload securely after connection is established
        ws?.send(
          JSON.stringify({
            type: 'identify',
            token: token,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'notice_published') {
            const title = payload.title || 'New Notice';
            
            // Add to notification list
            const newNotif: AppNotification = {
              id: Date.now().toString(),
              title: title,
              priority: payload.priority || 'Medium',
              notice_id: payload.notice_id,
              timestamp: new Date(),
              read: false,
            };
            
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Handle Foreground vs Background delivery
            if (document.visibilityState === 'visible') {
              showToast(`📣 New Notice: ${title}`, 'info');
            } else if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Apt App', {
                body: `New Notice: ${title}`,
                icon: '/favicon.svg' // Optional icon
              });
            }
            
            // Dispatch a global event so active tabs can refetch API data
            window.dispatchEvent(new CustomEvent('NOTICES_UPDATED', { detail: payload }));
          } else if (payload.type === 'issue_updated') {
            const title = payload.title || 'Issue Updated';
            
            // Add to notification list
            const newNotif: AppNotification = {
              id: Date.now().toString(),
              title: title,
              priority: 'High',
              issue_id: payload.issue_id,
              timestamp: new Date(),
              read: false,
            };
            
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Handle Foreground vs Background delivery
            if (document.visibilityState === 'visible') {
              showToast(`🔧 ${title}`, 'info');
            } else if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Apt App', {
                body: `${title}`,
                icon: '/favicon.svg'
              });
            }
            
            // Dispatch a global event so active tabs can refetch API data
            window.dispatchEvent(new CustomEvent('ISSUES_UPDATED', { detail: payload }));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Optional: Simple reconnect logic if we are still authenticated
        if (isAuthenticated) {
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        ws?.close();
      };
    };

    if (isAuthenticated) {
      connectWebSocket();
    }

    // Cleanup when component unmounts or user logs out
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [isAuthenticated, showToast]);

  return (
    <NotificationContext.Provider value={{ isConnected, notifications, unreadCount, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}

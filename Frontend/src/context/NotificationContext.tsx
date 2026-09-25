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

/**
 * Synthesize a modern, pleasant 2-tone notification chime using the browser's
 * Web Audio API. 100% offline, zero audio assets or external network calls needed.
 */
export const playNotificationChime = () => {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    const audioCtx = new AudioCtxClass();
    const now = audioCtx.currentTime;

    // Tone 1: Gentle pleasant harmonic (E5 - 659.25 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // Tone 2: Bright uplifting resolution chime (A5 - 880 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.14, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch {
    // Gracefully ignore browsers blocking audio before user interaction
  }
};

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
  markAsRead: () => { },
  clearAll: () => { },
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

      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

      // 2. Connect to daphne websocket using query string auth
      ws = new WebSocket(`${wsUrl}/ws/notifications/?token=${token}`);
      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'notice_published') {
            const title = payload.title || 'New Notice';

            // Play offline notification chime
            playNotificationChime();

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
          } else if (payload.type === 'visitor_requested') {
            const title = payload.title || 'Visitor Request';
            playNotificationChime();

            // Dispatch specifically to our intercept modal
            window.dispatchEvent(new CustomEvent('VISITOR_REQUESTED', {
              detail: {
                log_id: payload.visitor_id,
                title: title,
                body: payload.body || 'A visitor is at the gate.'
              }
            }));

          } else if (payload.type === 'visitor_approved' || payload.type === 'visitor_denied') {
            const title = payload.title || (payload.type === 'visitor_approved' ? 'Visitor Approved' : 'Visitor Denied');
            playNotificationChime();

            if (document.visibilityState === 'visible') {
              showToast(`👤 ${title}`, 'info');
            }

            window.dispatchEvent(new CustomEvent('VISITORS_UPDATED', { detail: payload }));

          } else if (payload.type === 'issue_updated') {
            const title = payload.title || 'Issue Updated';

            // Play offline notification chime
            playNotificationChime();

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
          } else if (payload.type === 'emergency_broadcast' || payload.type === 'emergency_resolved') {
            const isBroadcast = payload.type === 'emergency_broadcast';
            const title = payload.title || (isBroadcast ? 'EMERGENCY BROADCAST' : 'Emergency Resolved');
            playNotificationChime();
            
            if (isBroadcast) {
                // Add high priority notification
                const newNotif: AppNotification = {
                  id: Date.now().toString(),
                  title: title,
                  priority: 'Critical',
                  timestamp: new Date(),
                  read: false,
                };
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
            
            // Dispatch global event for the ActiveAlertBanner
            window.dispatchEvent(new CustomEvent('EMERGENCY_UPDATE', { detail: payload }));
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

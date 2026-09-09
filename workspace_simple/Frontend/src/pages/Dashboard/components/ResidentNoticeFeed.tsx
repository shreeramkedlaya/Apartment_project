import { useEffect, useState } from 'react';
import { noticeService } from '../tabs/NoticeBoard/services/notice.service';
import type { Notice } from '../tabs/NoticeBoard/services/notice.service';
import ResidentNoticeCard from './ResidentNoticeCard';
import { BellRing, Loader2 } from 'lucide-react';

export default function ResidentNoticeFeed() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotices = async () => {
    try {
      const data = await noticeService.getMyNotices();
      setNotices(data);
    } catch (error) {
      console.error("Failed to load resident notices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
    
    // Listen for WebSocket broadcasts to refetch if active
    const handleNoticeUpdate = () => {
      loadNotices();
    };
    
    window.addEventListener('NOTICES_UPDATED', handleNoticeUpdate);
    return () => {
      window.removeEventListener('NOTICES_UPDATED', handleNoticeUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-gray-500">Loading notices...</p>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center px-4">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
          <BellRing className="w-5 h-5 text-blue-500" />
        </div>
        <h4 className="text-gray-900 dark:text-gray-100 font-semibold mb-1">All Caught Up!</h4>
        <p className="text-sm text-gray-500 max-w-xs">There are no active notices or announcements for you at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map(notice => (
        <ResidentNoticeCard 
          key={notice.id} 
          notice={notice} 
          onAcknowledged={loadNotices} 
        />
      ))}
    </div>
  );
}

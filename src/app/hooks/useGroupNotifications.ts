import { useState, useEffect } from 'react';
import { apiCall } from '@/app/utils/supabase';
import { useApp } from '@/app/context/AppContext';

interface GroupNotification {
  groupId: string;
  groupName: string;
  hasPendingSubmission: boolean;
}

export function useGroupNotifications() {
  const { isAuthenticated, accessToken } = useApp();
  const [notifications, setNotifications] = useState<GroupNotification[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Only fetch if user is authenticated with Supabase (has access token)
    if (!isAuthenticated || !accessToken) return;

    const fetchNotifications = async () => {
      try {
        const { groups } = await apiCall('/groups');
        const today = new Date().toISOString().split('T')[0];
        
        const notifs: GroupNotification[] = [];
        
        for (const group of groups) {
          const { members } = await apiCall(`/groups/${group.id}`);
          const myMember = members.find((m: any) => m.userId);
          const hasSubmittedToday = myMember?.lastSubmission?.split('T')[0] === today;
          
          if (!hasSubmittedToday) {
            notifs.push({
              groupId: group.id,
              groupName: group.name,
              hasPendingSubmission: true,
            });
          }
        }
        
        setNotifications(notifs);
        setPendingCount(notifs.length);
      } catch (error) {
        // Silently fail if unauthorized (user is using localStorage auth)
        console.log('Group notifications not available (requires Supabase auth)');
      }
    };

    fetchNotifications();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, accessToken]);

  return { notifications, pendingCount };
}
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export const API_BASE = `${supabaseUrl}/functions/v1/server`;

// Helper to map camelCase to snake_case for DB
const toSnakeCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  return Object.keys(obj).reduce((acc: any, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

// Helper to map snake_case to camelCase for App
const toCamelCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj).reduce((acc: any, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
};

// Helper function to make authenticated API calls (ADAPTED FOR DIRECT DB ACCESS)
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User not authenticated');
  const userId = session.user.id;

  console.log(`[DB Adapter] Routing ${options.method || 'GET'} ${endpoint}`);

  // Common DB Handler
  const handleDBRequest = async (table: string, id: string | null = null, sortColumn: string = 'created_at') => {
    // 1. POST (Insert)
    if (options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      // Ensure userId is correctly mapped to user_id (overriding any body value)
      const dbData = toSnakeCase({ ...body, userId });

      const { data, error } = await supabase.from(table).insert(dbData).select().single();
      if (error) {
        console.error(`DB Insert Error (${table}):`, error);
        throw error;
      }
      return toCamelCase(data);
    }

    // 2. PATCH (Update)
    if (options.method === 'PATCH' && id) {
      const body = JSON.parse(options.body as string);
      const dbData = toSnakeCase(body);
      const { data, error } = await supabase.from(table).update(dbData).eq('id', id).eq('user_id', userId).select().single();
      if (error) {
        console.error(`DB Update Error (${table}):`, error);
        throw error;
      }
      return toCamelCase(data);
    }

    // 3. DELETE
    if (options.method === 'DELETE' && id) {
      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
      if (error) {
        console.error(`DB Delete Error (${table}):`, error);
        throw error;
      }
      return { success: true };
    }

    // 4. GET (Select All)
    const { data, error } = await supabase.from(table).select('*').order(sortColumn, { ascending: false });
    if (error) {
      console.error(`DB Select Error (${table}):`, error);
      throw error;
    }
    return toCamelCase(data);
  };

  try {
    // EXPENSES
    if (endpoint === '/expenses') {
      if (options.method === 'POST') return { expense: await handleDBRequest('expenses') };
      return { expenses: await handleDBRequest('expenses', null, 'date') };
    }
    if (endpoint.startsWith('/expenses/')) {
      const result = await handleDBRequest('expenses', endpoint.split('/')[2]);
      return options.method === 'DELETE' ? result : { expense: result };
    }

    // BUDGETS
    if (endpoint === '/budgets') {
      if (options.method === 'POST') return { budget: await handleDBRequest('budgets') };
      return { budgets: await handleDBRequest('budgets', null, 'start_date') };
    }
    if (endpoint.startsWith('/budgets/')) {
      const result = await handleDBRequest('budgets', endpoint.split('/')[2]);
      return options.method === 'DELETE' ? result : { budget: result };
    }

    // SAVINGS GOALS
    if (endpoint === '/savings-goals') {
      if (options.method === 'POST') return { goal: await handleDBRequest('savings_goals') };
      return { goals: await handleDBRequest('savings_goals', null, 'created_at') };
    }
    if (endpoint.startsWith('/savings-goals/')) {
      const result = await handleDBRequest('savings_goals', endpoint.split('/')[2]);
      return options.method === 'DELETE' ? result : { goal: result };
    }

    // GROUPS (KV Store Adapter)
    if (endpoint.startsWith('/groups') || endpoint === '/profile/update') {
      const KV_TABLE = 'kv_store_505a2c2e';

      const getKV = async (key: string) => {
        const { data } = await supabase.from(KV_TABLE).select('value').eq('key', key).maybeSingle();
        return data?.value || null;
      };

      const setKV = async (key: string, value: any) => {
        const { error } = await supabase.from(KV_TABLE).upsert({ key, value }).select();
        if (error) console.error('KV Set Error:', error);
      };

      // 1. POST /groups/create
      if (endpoint === '/groups/create' && options.method === 'POST') {
        const body = JSON.parse(options.body as string);
        const newGroup = {
          id: crypto.randomUUID(),
          name: body.name,
          dailyGoal: body.dailyGoal,
          inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          createdBy: userId,
          createdAt: new Date().toISOString(),
          members: [userId],
          currentStreak: 0,
          bestStreak: 0
        };

        let groups = await getKV('groups_list') || [];
        if (!Array.isArray(groups)) groups = [];
        groups.push(newGroup);
        await setKV('groups_list', groups);

        // Add creator as member
        let userName = session.user.user_metadata?.name;
        if (!userName || userName === 'User') {
          try {
            const localUser = localStorage.getItem('tipidbuddy_user');
            if (localUser) {
              userName = JSON.parse(localUser).name;
            }
          } catch (e) {
            console.warn('Could not fetch local user name');
          }
        }

        const newMember = {
          userId,
          name: userName || 'User',
          email: session.user.email,
          currentStreak: 0,
          totalContributions: 0,
          lastSubmission: null,
          joinedAt: new Date().toISOString()
        };

        let allMembers = await getKV('members_list') || [];
        if (!Array.isArray(allMembers)) allMembers = [];
        allMembers.push({ groupId: newGroup.id, ...newMember });
        await setKV('members_list', allMembers);

        return { group: newGroup };
      }

      // 2. POST /groups/join
      if (endpoint === '/groups/join' && options.method === 'POST') {
        const { inviteCode } = JSON.parse(options.body as string);
        const groups = await getKV('groups_list') || [];
        const group = groups.find((g: any) => g.inviteCode === inviteCode);

        if (!group) throw new Error('Invalid invite code');
        if (group.members.includes(userId)) throw new Error('Already a member');

        // Update group members list
        group.members.push(userId);
        await setKV('groups_list', groups);

        // Add to members list
        let userName = session.user.user_metadata?.name;
        if (!userName || userName === 'User') {
          try {
            const localUser = localStorage.getItem('tipidbuddy_user');
            if (localUser) {
              userName = JSON.parse(localUser).name;
            }
          } catch (e) {
            console.warn('Could not fetch local user name');
          }
        }

        const newMember = {
          userId,
          name: userName || 'User',
          email: session.user.email,
          currentStreak: 0,
          totalContributions: 0,
          lastSubmission: null,
          joinedAt: new Date().toISOString()
        };
        let allMembers = await getKV('members_list') || [];
        allMembers.push({ groupId: group.id, ...newMember });
        await setKV('members_list', allMembers);

        return { group };
      }

      // 3. GET /groups/:id (Details)
      if (endpoint.match(/\/groups\/[\w-]+$/)) {
        const groupId = endpoint.split('/')[2];
        const groups = await getKV('groups_list') || [];
        const group = groups.find((g: any) => g.id === groupId);

        if (!group) throw new Error('Group not found');

        const allMembers = await getKV('members_list') || [];
        const groupMembers = allMembers.filter((m: any) => m.groupId === groupId);

        return { group, members: groupMembers };
      }

      // 4. GET /groups (List)
      if (endpoint === '/groups') {
        const groups = await getKV('groups_list') || [];
        const myGroups = groups.filter((g: any) => g.members.includes(userId));
        return { groups: myGroups };
      }

      // 5. GET /groups/:id/leaderboard
      if (endpoint.match(/\/groups\/[\w-]+\/leaderboard$/)) {
        const groupId = endpoint.split('/')[2];
        const allMembers = await getKV('members_list') || [];
        const groupMembers = allMembers.filter((m: any) => m.groupId === groupId);

        const leaderboard = groupMembers
          .map((m: any) => ({
            userId: m.userId,
            name: m.name,
            currentStreak: m.currentStreak,
            totalContributions: m.totalContributions,
            lastSubmission: m.lastSubmission
          }))
          .sort((a: any, b: any) => b.totalContributions - a.totalContributions);

        return { leaderboard };
      }

      // 6. POST /groups/:id/submit
      if (endpoint.match(/\/groups\/[\w-]+\/submit$/) && options.method === 'POST') {
        const groupId = endpoint.split('/')[2];
        const { amount } = JSON.parse(options.body as string);
        const today = new Date().toISOString();
        const todayDate = today.split('T')[0];

        // Get Members
        let allMembers = await getKV('members_list') || [];
        const memberIndex = allMembers.findIndex((m: any) => m.groupId === groupId && m.userId === userId);

        if (memberIndex === -1) throw new Error('Member not found');

        const member = allMembers[memberIndex];
        const lastSubmissionDate = member.lastSubmission ? member.lastSubmission.split('T')[0] : null;

        if (lastSubmissionDate === todayDate) {
          throw new Error('Already submitted today');
        }

        // Update Member Stats
        member.lastSubmission = today;
        member.totalContributions += amount;

        // Simple streak logic: if last submission was yesterday, increment. Else reset to 1.
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        if (lastSubmissionDate === yesterdayDate) {
          member.currentStreak += 1;
        } else {
          member.currentStreak = 1;
        }

        allMembers[memberIndex] = member;
        await setKV('members_list', allMembers);

        // Check Group Streak (If all members submitted today)
        const groupMembers = allMembers.filter((m: any) => m.groupId === groupId);
        const allSubmitted = groupMembers.every((m: any) => m.lastSubmission && m.lastSubmission.split('T')[0] === todayDate);

        let groupStreakUpdated = false;
        let groupStreak = 0;

        if (allSubmitted) {
          let groups = await getKV('groups_list') || [];
          const groupIndex = groups.findIndex((g: any) => g.id === groupId);
          if (groupIndex !== -1) {
            groups[groupIndex].currentStreak += 1;
            if (groups[groupIndex].currentStreak > groups[groupIndex].bestStreak) {
              groups[groupIndex].bestStreak = groups[groupIndex].currentStreak;
            }
            groupStreak = groups[groupIndex].currentStreak;
            groupStreakUpdated = true;
            await setKV('groups_list', groups);
          }
        }

        return { success: true, groupStreakUpdated, groupStreak };
      }

      // 7. POST /groups/:id/leave
      if (endpoint.match(/\/groups\/[\w-]+\/leave$/) && options.method === 'POST') {
        const groupId = endpoint.split('/')[2];

        // Update Groups List (Remove from members array)
        let groups = await getKV('groups_list') || [];
        const groupIndex = groups.findIndex((g: any) => g.id === groupId);

        if (groupIndex === -1) throw new Error('Group not found');

        // Remove userId from members array
        groups[groupIndex].members = groups[groupIndex].members.filter((id: string) => id !== userId);

        // If group is empty, remove it entirely? 
        // For now, let's keep it but just empty. 
        // Or if we want to delete empty groups:
        if (groups[groupIndex].members.length === 0) {
          groups = groups.filter((g: any) => g.id !== groupId);
        }

        await setKV('groups_list', groups);

        // Update Members List (Remove member entry)
        let allMembers = await getKV('members_list') || [];
        allMembers = allMembers.filter((m: any) => !(m.groupId === groupId && m.userId === userId));
        await setKV('members_list', allMembers);

        return { success: true };
      }

      // 8. POST /profile/update
      if (endpoint === '/profile/update' && options.method === 'POST') {
        const { name } = JSON.parse(options.body as string);

        // Update Metadata in Auth (Handled by client usually, but good to have here if we were using real backend)
        // For KV Store Sync:

        let allMembers = await getKV('members_list') || [];
        let updatedCount = 0;

        // Update name in all group memberships
        allMembers = allMembers.map((m: any) => {
          if (m.userId === userId) {
            updatedCount++;
            return { ...m, name };
          }
          return m;
        });

        if (updatedCount > 0) {
          await setKV('members_list', allMembers);
        }

        return { success: true, updatedCount };
      }

      console.warn('Groups endpoint stubbed:', endpoint);
      return { groups: [], members: [], leaderboard: [] };
    }

    throw new Error(`Endpoint ${endpoint} not implemented in Direct DB Adapter`);

  } catch (error: any) {
    console.error(`DB Adapter Error [${endpoint}]:`, error);
    throw error;
  }
}

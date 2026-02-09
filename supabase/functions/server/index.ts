import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from "./kv_store.ts";
import { verifyUser, supabaseAdmin } from "./auth.ts";

const app = new Hono().basePath("/server");

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ AUTH ROUTES ============

// Sign up
app.post("/auth/signup", async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Sign up error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store additional user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      name,
      email,
      createdAt: new Date().toISOString(),
      dailyStreak: 0,
      lastSubmission: null
    });

    return c.json({
      user: {
        id: data.user.id,
        name,
        email
      }
    });
  } catch (error: any) {
    console.log(`Sign up error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Sign in
app.post("/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Sign in error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Get user profile from KV store
    let userProfile = await kv.get(`user:${data.user.id}`);

    // If profile missing or we want to ensure latest info, update it
    if (!userProfile) {
      userProfile = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        createdAt: new Date().toISOString(),
        dailyStreak: 0,
        lastSubmission: null
      };
      await kv.set(`user:${data.user.id}`, userProfile);
    }

    return c.json({
      session: data.session,
      user: userProfile
    });
  } catch (error: any) {
    console.log(`Sign in error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get current session
app.get("/auth/session", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      // Return 200 with null session so frontend doesn't error out
      return c.json({ session: null }, 200);
    }

    const userProfile = await kv.get(`user:${user.id}`);

    return c.json({
      session: { user },
      user: userProfile
    });
  } catch (error: any) {
    console.log(`Session error: ${error.message}`);
    return c.json({ session: null }, 200);
  }
});

// ============ GROUP ROUTES ============

// Create a new group
app.post("/groups/create", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      console.log('Auth error in /groups/create:', error);
      return c.json({ error: `Auth failed: ${error}` }, 401);
    }

    const { name, dailyGoal } = await c.req.json();

    // Generate unique 6-character invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupId = `group_${Date.now()}`;

    const group = {
      id: groupId,
      name,
      dailyGoal: Number(dailyGoal),
      inviteCode,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      members: [user.id],
      currentStreak: 0,
      bestStreak: 0
    };

    await kv.set(`group:${groupId}`, group);
    await kv.set(`invite:${inviteCode}`, groupId);

    // Add user to group members list
    await kv.set(`group:${groupId}:member:${user.id}`, {
      userId: user.id,
      joinedAt: new Date().toISOString(),
      currentStreak: 0,
      totalContributions: 0,
      lastSubmission: null
    });

    // Add group to user's groups
    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
    userGroups.push(groupId);
    await kv.set(`user:${user.id}:groups`, userGroups);

    return c.json({ group });
  } catch (error: any) {
    console.log(`Create group error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Join a group with invite code
app.post("/groups/join", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      return c.json({ error: `Auth failed: ${error}` }, 401);
    }

    const { inviteCode } = await c.req.json();

    // Find group by invite code
    const groupId = await kv.get(`invite:${inviteCode.toUpperCase()}`);

    if (!groupId) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }

    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if user is already a member
    if (group.members.includes(user.id)) {
      return c.json({ error: 'Already a member of this group' }, 400);
    }

    // Ensure user profile exists in KV (sync from Auth)
    await kv.set(`user:${user.id}`, {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      createdAt: new Date().toISOString(), // This might reset creation date if we overwrite, but better than missing profile
      dailyStreak: 0,
      lastSubmission: null,
      ...((await kv.get(`user:${user.id}`)) || {}) // Merge with existing if present to preserve fields
    });

    // Add user to group
    group.members.push(user.id);
    await kv.set(`group:${groupId}`, group);

    // Add member data
    await kv.set(`group:${groupId}:member:${user.id}`, {
      userId: user.id,
      joinedAt: new Date().toISOString(),
      currentStreak: 0,
      totalContributions: 0,
      lastSubmission: null
    });

    // Add group to user's groups
    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
    userGroups.push(groupId);
    await kv.set(`user:${user.id}:groups`, userGroups);

    return c.json({ group });
  } catch (error: any) {
    console.log(`Join group error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get user's groups
app.get("/groups", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      return c.json({ error: `Auth failed: ${error}` }, 401);
    }

    const userGroupIds = await kv.get(`user:${user.id}:groups`) || [];
    const groups = [];

    for (const groupId of userGroupIds) {
      const group = await kv.get(`group:${groupId}`);
      if (group) {
        groups.push(group);
      }
    }

    return c.json({ groups });
  } catch (error: any) {
    console.log(`Get groups error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get group details with members
app.get("/groups/:groupId", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      return c.json({ error: `Auth failed: ${error}` }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if user is a member
    if (!group.members.includes(user.id)) {
      console.log(`Debug 403: User ${user.id} not in members:`, group.members);
      // Automatically self-repair if creator
      if (group.createdBy === user.id) {
        console.log('Repairing group: Adding creator back to members');
        group.members.push(user.id);
        await kv.set(`group:${groupId}`, group);
        // Continue execution...
      } else {
        return c.json({ error: 'Not a member of this group' }, 403);
      }
    }

    // Get all member details
    const members = [];
    for (const memberId of group.members) {
      const memberData = await kv.get(`group:${groupId}:member:${memberId}`);
      let userProfile = await kv.get(`user:${memberId}`);

      // If profile missing in KV, fetch from Supabase Auth Admin
      if (!userProfile) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(memberId);
        if (userData?.user) {
          userProfile = {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
            createdAt: userData.user.created_at,
            dailyStreak: 0,
            lastSubmission: null
          };
          // Cache it to KV
          await kv.set(`user:${memberId}`, userProfile);
        } else {
          console.log(`Failed to fetch user ${memberId} from Auth:`, userError);
        }
      }

      if (memberData && userProfile) {
        members.push({
          ...memberData,
          name: userProfile.name,
          email: userProfile.email
        });
      }
    }

    return c.json({
      group,
      members
    });
  } catch (error: any) {
    console.log(`Get group details error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Submit daily savings
app.post("/groups/:groupId/submit", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      return c.json({ error: `Auth failed: ${error}` }, 401);
    }

    const groupId = c.req.param('groupId');
    const { amount } = await c.req.json();

    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.members.includes(user.id)) {
      console.log(`Debug 403: User ${user.id} not in members:`, group.members);
      if (group.createdBy === user.id) {
        console.log('Repairing group: Adding creator back to members');
        group.members.push(user.id);
        await kv.set(`group:${groupId}`, group);

        // Fix missing member data
        await kv.set(`group:${groupId}:member:${user.id}`, {
          userId: user.id,
          joinedAt: new Date().toISOString(),
          currentStreak: 0,
          totalContributions: 0,
          lastSubmission: null
        });
      } else {
        return c.json({ error: 'Not a member of this group' }, 403);
      }
    }

    let memberData = await kv.get(`group:${groupId}:member:${user.id}`);

    // Self-repair: Create member data if missing
    if (!memberData) {
      console.log(`Repairing member data for ${user.id} in group ${groupId}`);
      memberData = {
        userId: user.id,
        joinedAt: new Date().toISOString(),
        currentStreak: 0,
        totalContributions: 0,
        lastSubmission: null
      };
      await kv.set(`group:${groupId}:member:${user.id}`, memberData);
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already submitted today
    if (memberData.lastSubmission?.split('T')[0] === today) {
      return c.json({ error: 'Already submitted today' }, 400);
    }

    // Update member data
    memberData.currentStreak = (memberData.currentStreak || 0) + 1;
    memberData.totalContributions = (memberData.totalContributions || 0) + Number(amount);
    memberData.lastSubmission = new Date().toISOString();

    await kv.set(`group:${groupId}:member:${user.id}`, memberData);

    // Check if all members submitted today
    let allSubmittedToday = true;
    for (const memberId of group.members) {
      const member = await kv.get(`group:${groupId}:member:${memberId}`);
      if (!member.lastSubmission || member.lastSubmission.split('T')[0] !== today) {
        allSubmittedToday = false;
        break;
      }
    }

    // Update group streak if everyone submitted
    if (allSubmittedToday) {
      group.currentStreak = (group.currentStreak || 0) + 1;
      if (group.currentStreak > (group.bestStreak || 0)) {
        group.bestStreak = group.currentStreak;
      }
      await kv.set(`group:${groupId}`, group);
    }

    return c.json({
      success: true,
      memberData,
      groupStreakUpdated: allSubmittedToday,
      groupStreak: group.currentStreak
    });
  } catch (error: any) {
    console.log(`Submit daily savings error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get group leaderboard
app.get("/groups/:groupId/leaderboard", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      return c.json({ error: `Auth failed: ${error}` }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.members.includes(user.id)) {
      console.log(`Debug 403: User ${user.id} not in members:`, group.members);
      if (group.createdBy === user.id) {
        console.log('Repairing group: Adding creator back to members');
        group.members.push(user.id);
        await kv.set(`group:${groupId}`, group);

        // Fix missing member data
        await kv.set(`group:${groupId}:member:${user.id}`, {
          userId: user.id,
          joinedAt: new Date().toISOString(),
          currentStreak: 0,
          totalContributions: 0,
          lastSubmission: null
        });
      } else {
        return c.json({ error: 'Not a member of this group' }, 403);
      }
    }

    // Get all member stats
    const leaderboard = [];
    for (const memberId of group.members) {
      const memberData = await kv.get(`group:${groupId}:member:${memberId}`);
      let userProfile = await kv.get(`user:${memberId}`);

      // If profile missing in KV, fetch from Supabase Auth Admin
      if (!userProfile) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(memberId);
        if (userData?.user) {
          userProfile = {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
            createdAt: userData.user.created_at,
            dailyStreak: 0,
            lastSubmission: null
          };
          // Cache it to KV
          await kv.set(`user:${memberId}`, userProfile);
        }
      }

      if (memberData && userProfile) {
        leaderboard.push({
          userId: memberId,
          name: userProfile.name,
          currentStreak: memberData.currentStreak || 0,
          totalContributions: memberData.totalContributions || 0,
          lastSubmission: memberData.lastSubmission
        });
      }
    }

    // Sort by total contributions
    leaderboard.sort((a, b) => b.totalContributions - a.totalContributions);

    return c.json({ leaderboard });
  } catch (error: any) {
    console.log(`Get leaderboard error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Leave group
app.post("/groups/:groupId/leave", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { user, error } = await verifyUser(authHeader);

    if (error || !user) {
      return c.json({ error: `Auth failed: ${error}` }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Remove user from group members
    group.members = group.members.filter((id: string) => id !== user.id);
    await kv.set(`group:${groupId}`, group);

    // Remove member data
    await kv.del(`group:${groupId}:member:${user.id}`);

    // Remove group from user's groups
    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
    const updatedGroups = userGroups.filter((id: string) => id !== groupId);
    await kv.set(`user:${user.id}:groups`, updatedGroups);

    return c.json({ success: true });
  } catch (error: any) {
    console.log(`Leave group error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
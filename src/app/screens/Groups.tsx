import React, { useState, useEffect } from 'react';
import { Users, Plus, LogIn, TrendingUp, Trophy, Flame, Crown, Copy, LogOut, UserPlus, Award } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useApp } from '@/app/context/AppContext';
import { apiCall } from '@/app/utils/supabase';
import { getBackgroundForRank, getBackgroundForTotalSavings, getStreakBadge, getAchievements } from '@/app/utils/achievements';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  dailyGoal: number;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  members: string[];
  currentStreak: number;
  bestStreak: number;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  currentStreak: number;
  totalContributions: number;
  lastSubmission: string | null;
  joinedAt: string;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  currentStreak: number;
  totalContributions: number;
  lastSubmission: string | null;
}

export function Groups() {
  const { isDarkMode } = useTheme();
  const { user, accessToken } = useApp();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitAmount, setSubmitAmount] = useState('');

  console.log('GROUPS RENDER: User=', user?.email, 'Token=', accessToken ? 'YES' : 'NO');

  // Block offline users
  if (user?.isOffline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
        <div className="p-6 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <Users className="w-12 h-12 text-blue-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cloud Feature Locked
          </h2>
          <p className="text-muted-foreground">
            Savings Groups require a cloud-synced account to share progress with friends.
            <br className="mb-2" />
            Your current account is in <strong>Offline Mode</strong>.
          </p>
          <div className="pt-4">
            <Button
              onClick={() => {
                // Ideally logout or prompt to upgrade
                toast.info("Please logout and sign up with an internet connection.");
              }}
              variant="outline"
            >
              Sign Up for Cloud Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Only load groups if user has Supabase access token
    if (accessToken) {
      loadGroups();
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedGroup?.id && accessToken) {
      loadGroupDetails(selectedGroup.id);
      loadLeaderboard(selectedGroup.id);
    }
  }, [selectedGroup?.id, accessToken]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/groups');
      setGroups(data.groups);
      if (data.groups.length > 0 && !selectedGroup) {
        setSelectedGroup(data.groups[0]);
      }
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      if (error.message.includes('fetch') || error.message.includes('timed out') || error.message.includes('Internet')) {
        toast.error('You are offline. Savings Groups require an internet connection.');
        setLoading(false);
        return;
      }
      if (!error.message.includes('Unauthorized')) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      const data = await apiCall(`/groups/${groupId}`);
      setMembers(data.members);
      // Removed setSelectedGroup to prevent infinite loop with useEffect
    } catch (error: any) {
      console.error('Failed to load group details:', error);
      toast.error(error.message);
    }
  };

  const loadLeaderboard = async (groupId: string) => {
    try {
      const data = await apiCall(`/groups/${groupId}/leaderboard`);
      setLeaderboard(data.leaderboard);
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await apiCall('/groups/create', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName,
          dailyGoal: parseFloat(dailyGoal),
        }),
      });
      toast.success(`Group created! Invite code: ${data.group.inviteCode}`);
      setShowCreateDialog(false);
      setGroupName('');
      setDailyGoal('');
      await loadGroups();
      setSelectedGroup(data.group);
    } catch (error: any) {
      if (error.message.includes('timed out') || error.message.includes('fetch')) {
        toast.error("Network Error: Cannot create group while offline.");
        setShowCreateDialog(false);
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await apiCall('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });
      toast.success(`Joined ${data.group.name}!`);
      setShowJoinDialog(false);
      setInviteCode('');
      await loadGroups();
      setSelectedGroup(data.group);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      setLoading(true);
      const data = await apiCall(`/groups/${selectedGroup.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(submitAmount) }),
      });

      if (data.groupStreakUpdated) {
        toast.success(`🔥 Amazing! Everyone submitted today! Group streak: ${data.groupStreak} days!`);
      } else {
        toast.success('Daily savings submitted!');
      }

      setShowSubmitDialog(false);
      setSubmitAmount('');
      await loadGroupDetails(selectedGroup.id);
      await loadLeaderboard(selectedGroup.id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;

    if (!confirm(`Are you sure you want to leave ${selectedGroup.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiCall(`/groups/${selectedGroup.id}/leave`, {
        method: 'POST',
      });
      toast.success('Left group successfully');
      setSelectedGroup(null);
      await loadGroups();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.inviteCode);
      toast.success('Invite code copied!');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const myMemberData = members.find(m => m.userId === user?.id);
  const hasSubmittedToday = myMemberData?.lastSubmission?.split('T')[0] === today;

  // If user doesn't have Supabase access token, show upgrade message
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-8">
        {/* Header */}
        <div className="max-w-lg mx-auto px-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                Savings Groups
              </h1>
              <p className="text-muted-foreground text-sm">
                Save together, achieve together
              </p>
            </div>
            <div className="p-3 bg-primary/20 rounded-full text-primary">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-6">
          <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-8 text-center shadow-sm">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Groups Feature Requires New Account
            </h3>
            <p className="mb-4 text-muted-foreground">
              To use the collaboration features, you need to create a new account with our cloud sync system.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary">
                <strong>Why?</strong> Groups need cloud sync to work across devices and keep everyone connected in real-time.
              </p>
            </div>
            <div className="text-left space-y-2 mb-6 text-muted-foreground text-sm">
              <p className="font-medium text-gray-900 dark:text-white">✨ What you'll get:</p>
              <ul className="space-y-1 ml-4 list-disc pl-2">
                <li>Create & join savings groups</li>
                <li>Track group streaks together</li>
                <li>Compete on leaderboards</li>
                <li>Real-time notifications</li>
                <li>Multi-device sync</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground/50">
              Note: Your current data will remain saved locally. You can create a new account without losing your existing budget data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      {/* Header */}
      <div className="max-w-lg mx-auto px-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
              Savings Groups
            </h1>
            <p className="text-muted-foreground text-sm">
              Save together, achieve together
            </p>
          </div>
          <div className="p-3 bg-primary/20 rounded-full text-primary">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-3xl">
              <DialogHeader>
                <DialogTitle>Create Savings Group</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Start a new group and invite friends to save together
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-gray-900 dark:text-white">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., College Squad Savers"
                    required
                    className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyGoal" className="text-gray-900 dark:text-white">Daily Savings Goal (₱)</Label>
                  <Input
                    id="dailyGoal"
                    type="number"
                    step="0.01"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    placeholder="50.00"
                    required
                    className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-muted-foreground rounded-xl">
                <LogIn className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-3xl">
              <DialogHeader>
                <DialogTitle>Join a Group</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Enter the invite code shared by your friend
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinGroup} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-gray-900 dark:text-white">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    required
                    className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Group'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-8 text-center shadow-sm">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              You're not in any groups yet
            </p>
            <p className="text-sm text-muted-foreground/60">
              Create a group or join one with an invite code
            </p>
          </div>
        ) : (
          <>
            {/* Group Selector */}
            {groups.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors text-sm font-medium ${selectedGroup?.id === group.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-gray-200 dark:border-white/5 text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Group Details */}
            {selectedGroup && (
              <div className="space-y-4">
                {/* Group Info Card */}
                <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {selectedGroup.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {members.length} members • ₱{selectedGroup.dailyGoal}/day goal
                      </p>
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm transition-colors hover:bg-primary/20"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {selectedGroup.inviteCode}
                    </button>
                  </div>

                  {/* Streaks */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-200">
                          Current Streak
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedGroup.currentStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
                      </p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-200">
                          Best Streak
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedGroup.bestStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className={`w-full h-12 rounded-xl text-base ${hasSubmittedToday
                          ? 'bg-gray-100 dark:bg-white/5 text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/10'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                        disabled={hasSubmittedToday}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {hasSubmittedToday ? '✓ Submitted Today' : 'Submit Daily Savings'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-3xl">
                      <DialogHeader>
                        <DialogTitle>Submit Daily Savings</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Record how much you saved today (Goal: ₱{selectedGroup.dailyGoal})
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitSavings} className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="submitAmount" className="text-gray-900 dark:text-white">Amount Saved (₱)</Label>
                          <Input
                            id="submitAmount"
                            type="number"
                            step="0.01"
                            value={submitAmount}
                            onChange={(e) => setSubmitAmount(e.target.value)}
                            placeholder={selectedGroup.dailyGoal.toString()}
                            required
                            className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                          />
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl" disabled={loading}>
                          {loading ? 'Submitting...' : 'Submit'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Leaderboard */}
                <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                    Leaderboard
                  </h3>
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                      const isCurrentUser = entry.userId === user?.id;
                      const submittedToday = entry.lastSubmission?.split('T')[0] === today;

                      return (
                        <div
                          key={entry.userId}
                          className={`flex items-center justify-between p-3 rounded-2xl ${isCurrentUser
                            ? 'bg-primary/10 border border-primary/20'
                            : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {index === 0 && (
                              <Crown className="w-5 h-5 text-yellow-500" />
                            )}
                            {index > 0 && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white">
                                {index + 1}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {entry.name} {isCurrentUser && '(You)'}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">
                                  {entry.currentStreak} day streak
                                </span>
                                {submittedToday && (
                                  <span className="text-primary">✓ Today</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              ₱{entry.totalContributions.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                              total saved
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Members */}
                <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                    Members ({members.length})
                  </h3>
                  <div className="space-y-3">
                    {members.map((member) => {
                      const submittedToday = member.lastSubmission?.split('T')[0] === today;
                      const isCurrentUser = member.userId === user?.id;

                      // Get member's icon
                      const memberIcon = localStorage.getItem(`tipidbuddy_selected_icon_${member.userId}`) || 'default';
                      const SHOP_ITEMS = [
                        { id: 'default', emoji: '👤' },
                        { id: 'smile', emoji: '😊' },
                        { id: 'cat', emoji: '🐱' },
                        { id: 'dog', emoji: '🐶' },
                        { id: 'panda', emoji: '🐼' },
                        { id: 'tiger', emoji: '🐯' },
                        { id: 'monkey', emoji: '🐵' },
                        { id: 'penguin', emoji: '🐧' },
                        { id: 'pizza', emoji: '🍕' },
                        { id: 'burger', emoji: '🍔' },
                        { id: 'donut', emoji: '🍩' },
                        { id: 'icecream', emoji: '🍦' },
                        { id: 'sushi', emoji: '🍣' },
                        { id: 'fire', emoji: '🔥' },
                        { id: 'star', emoji: '⭐' },
                        { id: 'rainbow', emoji: '🌈' },
                        { id: 'lightning', emoji: '⚡' },
                        { id: 'moon', emoji: '🌙' },
                        { id: 'crown', emoji: '👑' },
                        { id: 'gem', emoji: '💎' },
                        { id: 'trophy', emoji: '🏆' },
                        { id: 'rocket', emoji: '🚀' },
                        { id: 'unicorn', emoji: '🦄' },
                      ];
                      const iconData = SHOP_ITEMS.find(i => i.id === memberIcon);
                      const displayIcon = iconData ? iconData.emoji : '👤';

                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${submittedToday ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-white/10 text-muted-foreground'
                              }`}>
                              {displayIcon}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {member.name} {isCurrentUser && '(You)'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {submittedToday ? '✓ Submitted today' : '⏳ Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.currentStreak}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leave Group Button */}
                <Button
                  onClick={handleLeaveGroup}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl h-12"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Group
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
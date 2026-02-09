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
      // Update selected group with latest data
      setSelectedGroup(data.group);
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
      toast.error(error.message);
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
      <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-green-600 to-blue-600' : 'bg-gradient-to-r from-green-500 to-blue-500'} text-white p-6 rounded-b-3xl shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Savings Groups</h1>
            <Users className="w-8 h-8" />
          </div>
          <p className="text-white/90 text-sm">
            Save together, achieve together
          </p>
        </div>

        <div className="p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 text-center shadow-md`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Groups Feature Requires New Account
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              To use the collaboration features, you need to create a new account with our cloud sync system.
            </p>
            <div className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl p-4 mb-6`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <strong>Why?</strong> Groups need cloud sync to work across devices and keep everyone connected in real-time.
              </p>
            </div>
            <div className={`text-left space-y-2 mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-sm">✨ What you'll get:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Create & join savings groups</li>
                <li>• Track group streaks together</li>
                <li>• Compete on leaderboards</li>
                <li>• Real-time notifications</li>
                <li>• Multi-device sync</li>
              </ul>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Note: Your current data will remain saved locally. You can create a new account without losing your existing budget data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gradient-to-r from-green-600 to-blue-600' : 'bg-gradient-to-r from-green-500 to-blue-500'} text-white p-6 rounded-b-3xl shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Savings Groups</h1>
          <Users className="w-8 h-8" />
        </div>
        <p className="text-white/90 text-sm">
          Save together, achieve together
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className={isDarkMode ? 'bg-gray-800 text-white' : ''}>
              <DialogHeader>
                <DialogTitle>Create Savings Group</DialogTitle>
                <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
                  Start a new group and invite friends to save together
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., College Squad Savers"
                    required
                    className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="dailyGoal">Daily Savings Goal (₱)</Label>
                  <Input
                    id="dailyGoal"
                    type="number"
                    step="0.01"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    placeholder="50.00"
                    required
                    className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className={isDarkMode ? 'border-gray-600 text-white' : ''}>
                <LogIn className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent className={isDarkMode ? 'bg-gray-800 text-white' : ''}>
              <DialogHeader>
                <DialogTitle>Join a Group</DialogTitle>
                <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
                  Enter the invite code shared by your friend
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    required
                    className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Group'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 text-center shadow-md`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
              You're not in any groups yet
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Create a group or join one with an invite code
            </p>
          </div>
        ) : (
          <>
            {/* Group Selector */}
            {groups.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedGroup?.id === group.id
                        ? 'bg-green-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-300'
                          : 'bg-white text-gray-700'
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
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedGroup.name}
                      </h2>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {members.length} members • ₱{selectedGroup.dailyGoal}/day goal
                      </p>
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      {selectedGroup.inviteCode}
                    </button>
                  </div>

                  {/* Streaks */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-orange-50'} p-4 rounded-xl`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Current Streak
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedGroup.currentStreak} days
                      </p>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'} p-4 rounded-xl`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Best Streak
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedGroup.bestStreak} days
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className={`w-full ${hasSubmittedToday ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
                        disabled={hasSubmittedToday}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {hasSubmittedToday ? '✓ Submitted Today' : 'Submit Daily Savings'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={isDarkMode ? 'bg-gray-800 text-white' : ''}>
                      <DialogHeader>
                        <DialogTitle>Submit Daily Savings</DialogTitle>
                        <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
                          Record how much you saved today (Goal: ₱{selectedGroup.dailyGoal})
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitSavings} className="space-y-4">
                        <div>
                          <Label htmlFor="submitAmount">Amount Saved (₱)</Label>
                          <Input
                            id="submitAmount"
                            type="number"
                            step="0.01"
                            value={submitAmount}
                            onChange={(e) => setSubmitAmount(e.target.value)}
                            placeholder={selectedGroup.dailyGoal.toString()}
                            required
                            className={isDarkMode ? 'bg-gray-700 text-white' : ''}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Submitting...' : 'Submit'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Leaderboard */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Leaderboard
                  </h3>
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                      const isCurrentUser = entry.userId === user?.id;
                      const submittedToday = entry.lastSubmission?.split('T')[0] === today;

                      return (
                        <div
                          key={entry.userId}
                          className={`flex items-center justify-between p-3 rounded-xl ${isCurrentUser
                              ? isDarkMode ? 'bg-green-900/30 border border-green-500/50' : 'bg-green-50 border border-green-200'
                              : isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {index === 0 && (
                              <Crown className="w-5 h-5 text-yellow-500" />
                            )}
                            {index > 0 && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {index + 1}
                              </div>
                            )}
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {entry.name} {isCurrentUser && '(You)'}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                  {entry.currentStreak} day streak
                                </span>
                                {submittedToday && (
                                  <span className="text-green-500">✓ Today</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              ₱{entry.totalContributions.toFixed(2)}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              total saved
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Members */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                          className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${submittedToday ? 'bg-green-500' : 'bg-gray-400'
                              }`}>
                              {displayIcon}
                            </div>
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {member.name} {isCurrentUser && '(You)'}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {submittedToday ? '✓ Submitted today' : '⏳ Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                  className={`w-full ${isDarkMode ? 'border-red-500 text-red-500 hover:bg-red-500/10' : 'border-red-500 text-red-500'}`}
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
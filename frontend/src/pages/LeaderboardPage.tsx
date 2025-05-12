import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, TrendingUp, Calendar, Award, Trash2, Utensils, Star } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CommunityChat from '../components/chat/CommunityChat';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'ecoPoints' | 'wasteRecycled' | 'mealsRescued'>('ecoPoints');
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all');
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [wasteData, setWasteData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [sortBy, timeFrame]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const leaderboardRef = collection(db, 'leaderboard');
      const q = query(
        leaderboardRef,
        orderBy(sortBy, 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc, index) => {
        const docData = doc.data();
        return {
          id: doc.id,
          userId: docData.userId || '',
          displayName: docData.displayName || 'Anonymous',
          email: docData.email || '',
          photoURL: docData.photoURL || '',
          ecoPoints: docData.ecoPoints || 0,
          wasteRecycled: docData.wasteRecycled || 0,
          mealsRescued: docData.mealsRescued || 0,
          rank: index + 1
        } as LeaderboardEntry;
      });
      
      setLeaderboardData(data);
      
      // Prepare waste data for the graph
      const wasteGraphData = data
        .slice(0, 10) // Show top 10 users
        .map(user => ({
          name: user.displayName,
          value: user.wasteRecycled
        }));
      setWasteData(wasteGraphData);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getUserAchievements = (user: LeaderboardEntry) => {
    const achievements = [];
    
    // Eco Points achievements
    if (user.ecoPoints >= 1000) achievements.push({ title: 'Eco Master', icon: <Trophy className="w-5 h-5 text-yellow-500" /> });
    else if (user.ecoPoints >= 500) achievements.push({ title: 'Eco Champion', icon: <Medal className="w-5 h-5 text-yellow-500" /> });
    else if (user.ecoPoints >= 100) achievements.push({ title: 'Eco Warrior', icon: <Star className="w-5 h-5 text-yellow-500" /> });
    
    // Waste recycling achievements
    if (user.wasteRecycled >= 100) achievements.push({ title: 'Waste Warrior', icon: <Trash2 className="w-5 h-5 text-green-500" /> });
    else if (user.wasteRecycled >= 50) achievements.push({ title: 'Recycling Hero', icon: <Trash2 className="w-5 h-5 text-green-500" /> });
    
    // Food donation achievements
    if (user.mealsRescued >= 50) achievements.push({ title: 'Food Hero', icon: <Utensils className="w-5 h-5 text-orange-500" /> });
    else if (user.mealsRescued >= 20) achievements.push({ title: 'Meal Rescuer', icon: <Utensils className="w-5 h-5 text-orange-500" /> });
    
    return achievements;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Eco Heroes Leaderboard</h1>
          <p className="text-lg text-gray-600">See who's making the biggest impact in our community</p>
        </div>

        {/* Time frame selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
            <button
              onClick={() => setTimeFrame('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeFrame === 'all' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFrame('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeFrame === 'month' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFrame('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeFrame === 'week' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard Section */}
          <div className="lg:col-span-2">
            {/* Waste Recycling Graph */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Waste Recyclers</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={wasteData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'Waste Recycled (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} kg`, 'Waste Recycled']}
                      labelFormatter={(label) => `User: ${label}`}
                    />
                    <Bar
                      dataKey="value"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    >
                      {wasteData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#059669' : index === 1 ? '#10B981' : index === 2 ? '#34D399' : '#6EE7B7'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Community Rankings</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSortBy('ecoPoints')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        sortBy === 'ecoPoints' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Points
                    </button>
                    <button
                      onClick={() => setSortBy('wasteRecycled')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        sortBy === 'wasteRecycled' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Waste
                    </button>
                    <button
                      onClick={() => setSortBy('mealsRescued')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        sortBy === 'mealsRescued' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Meals
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waste Recycled
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meals Rescued
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboardData.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.rank <= 3 ? (
                              <Trophy className={`w-5 h-5 ${
                                user.rank === 1 ? 'text-yellow-500' :
                                user.rank === 2 ? 'text-gray-400' :
                                'text-amber-600'
                              }`} />
                            ) : (
                              <span className="text-gray-500">{user.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.photoURL || 'https://via.placeholder.com/40'}
                                alt=""
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.displayName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.ecoPoints}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.wasteRecycled} kg</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.mealsRescued}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Community Chat Section */}
          <div className="lg:col-span-1">
            <CommunityChat
              chatId="leaderboardChat"
              title="Community Chat"
              description="Share your achievements and connect with other eco-warriors!"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
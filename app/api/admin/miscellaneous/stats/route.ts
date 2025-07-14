// app/api/admin/miscellaneous/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
import User from '@/models/User';
import BetaUsers from '@/models/Beta-Users';
import WaitList from '@/models/WaitList';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get basic counts
    const [totalUsers, totalBetaUsers, totalWaitlistUsers] = await Promise.all([
      User.countDocuments(),
      BetaUsers.countDocuments(),
      WaitList.countDocuments()
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get active users (if you have lastLogin tracking)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    // Get user growth trend (last 7 days)
    const growthTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const userCount = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      growthTrend.push({
        date: date.toISOString().split('T')[0],
        users: userCount
      });
    }

    return NextResponse.json({
      overview: {
        totalUsers,
        totalBetaUsers,
        totalWaitlistUsers,
        regularUsers: totalUsers - totalBetaUsers,
        recentUsers,
        activeUsers
      },
      growthTrend
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
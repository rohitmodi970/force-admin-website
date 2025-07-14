
// app/api/admin/beta-users/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
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
    const totalBetaUsers = await BetaUsers.countDocuments();
    const totalWaitlistUsers = await WaitList.countDocuments();

    // Get recent additions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBetaUsers = await BetaUsers.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentWaitlistUsers = await WaitList.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get growth trends (last 7 days)
    const growthTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const betaCount = await BetaUsers.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      const waitlistCount = await WaitList.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      growthTrends.push({
        date: date.toISOString().split('T')[0],
        betaUsers: betaCount,
        waitlistUsers: waitlistCount
      });
    }

    return NextResponse.json({
      overview: {
        totalBetaUsers,
        totalWaitlistUsers,
        recentBetaUsers,
        recentWaitlistUsers
      },
      growthTrends
    });
  } catch (error) {
    console.error('Error fetching beta users stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
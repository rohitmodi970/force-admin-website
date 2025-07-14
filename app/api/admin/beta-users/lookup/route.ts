// app/api/admin/beta-users/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
import User from '@/models/User';
import BetaUsers from '@/models/Beta-Users';
import WaitList from '@/models/WaitList';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, userId } = await request.json();

    if (!email && !userId) {
      return NextResponse.json({ 
        error: 'Either email or userId is required' 
      }, { status: 400 });
    }

    await connectDB();

    let user;
    let searchCriteria: any = {};

    if (email) {
      searchCriteria.email = email.toLowerCase();
    }
    if (userId) {
      searchCriteria.userId = userId;
    }

    // Find user by email or userId
    user = await User.findOne(searchCriteria).lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is in beta users list
    const betaUser = await BetaUsers.findOne({ email: (user as any).email })
      .populate('waitListId', 'formResponses createdAt userWaitlistId')
      .lean();
    
    // Check if user is in waitlist
    const waitListUser = await WaitList.findOne({ email: (user as any).email }).lean();

    const isBetaUser = !!betaUser;
    const isInWaitlist = !!waitListUser;

    // Get additional stats
    const stats = {
      totalBetaUsers: await BetaUsers.countDocuments(),
      totalWaitlistUsers: await WaitList.countDocuments(),
      userRegistrationDate: (user as any).createdAt,
      betaUserSince: (betaUser as any)?.createdAt || null,
      waitlistSince: (waitListUser as any)?.createdAt || null
    };

    return NextResponse.json({
      user,
      isBetaUser,
      isInWaitlist,
      betaUser,
      waitListUser,
      stats
    });
  } catch (error) {
    console.error('Error looking up user:', error);
    return NextResponse.json(
      { error: 'Failed to lookup user' },
      { status: 500 }
    );
  }
}

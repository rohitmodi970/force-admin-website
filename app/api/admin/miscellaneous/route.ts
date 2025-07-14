// app/api/admin/miscellaneous/route.ts
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const filter = searchParams.get('filter') || 'all'; // all, beta, waitlist, regular

    await connectDB();

    // Build base query
    let query: any = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
      
      // Add userId search if search is a number
      const parsedSearch = parseInt(search);
      if (!isNaN(parsedSearch) && isFinite(parsedSearch)) {
        query.$or.push({ userId: parsedSearch });
      }
    }

    // Add filter conditions
    if (filter === 'beta') {
      const betaUserEmails = await BetaUsers.distinct('email');
      query.email = { $in: betaUserEmails };
    } else if (filter === 'waitlist') {
      const waitlistEmails = await WaitList.distinct('email');
      const betaUserEmails = await BetaUsers.distinct('email');
      query.email = { $in: waitlistEmails, $nin: betaUserEmails };
    } else if (filter === 'regular') {
      const betaUserEmails = await BetaUsers.distinct('email');
      const waitlistEmails = await WaitList.distinct('email');
      query.email = { $nin: [...betaUserEmails, ...waitlistEmails] };
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Fetch paginated results
    const users = await User.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get beta and waitlist status for each user
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const [betaUser, waitListUser] = await Promise.all([
          BetaUsers.findOne({ email: user.email }).lean(),
          WaitList.findOne({ email: user.email }).lean()
        ]);

        return {
          ...user,
          isBetaUser: !!betaUser,
          isInWaitlist: !!waitListUser,
          betaUserSince: (betaUser as any)?.createdAt || null,
          waitlistSince: (waitListUser as any)?.createdAt || null
        };
      })
    );

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
// app/api/admin/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
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

    await connectDB();

    // Build query with search functionality
    const query = search 
      ? { 
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { userWaitlistId: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Get total count for pagination
    const total = await WaitList.countDocuments(query);

    // Fetch paginated results
    const waitlistUsers = await WaitList.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // console.log('Fetched waitlist users:', waitlistUsers);

    return NextResponse.json({ 
      users: waitlistUsers,
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
    console.error('Error fetching waitlist users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, formResponses } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await WaitList.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const newUser = new WaitList({
      email,
      formResponses: formResponses || {}
    });

    await newUser.save();

    return NextResponse.json({ 
      message: 'User added to waitlist successfully',
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding user to waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to add user to waitlist' },
      { status: 500 }
    );
  }
}
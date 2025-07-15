// app/api/admin/beta-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
import BetaUsers from '@/models/Beta-Users'; 
import WaitList from '@/models/WaitList';
import { sendTemplatedEmail } from '@/utilities/mailService';
import { EmailTemplate } from '@/utilities/mailService';

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

    await connectDB();

    // Build query with search functionality
    let query: any = {};
    
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchCriteria: any[] = [
        { email: searchRegex }
      ];
      
      // If search is a number, also search by userId
      const searchAsNumber = parseInt(search);
      if (!isNaN(searchAsNumber)) {
        searchCriteria.push({ userId: searchAsNumber });
      }
      
      query.$or = searchCriteria;
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await BetaUsers.countDocuments(query);

    // Fetch paginated results with population
    const betaUsers = await BetaUsers.find(query)
      .populate('waitListId', 'formResponses createdAt userWaitlistId')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      users: betaUsers,
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
    console.error('Error fetching beta users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta users' },
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

    const { email, userWaitlistId, sendEmail = false } = await request.json();

    if (!email || !userWaitlistId) {
      return NextResponse.json(
        { error: 'Email and userWaitlistId are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await connectDB();

    // Check if user is already in beta users
    const existingBetaUser = await BetaUsers.findOne({ email: email.toLowerCase() });
    if (existingBetaUser) {
      return NextResponse.json(
        { error: 'User already in beta users list' },
        { status: 409 }
      );
    }

    let emailSent = false;

    // Send welcome email if requested
    if (sendEmail) {
      try {
        emailSent = await sendTemplatedEmail(
          EmailTemplate.ONBOARDING_COMPLETE,
          {
            name: email.split('@')[0], // Extract name from email
            email: email,
            userId: userWaitlistId // You can use userWaitlistId or generate a new userId
          }
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    let waitListRecord;
    
    // If userWaitlistId is provided, find the waitlist record
    if (userWaitlistId) {
      waitListRecord = await WaitList.findOne({ userWaitlistId });
      if (!waitListRecord) {
        return NextResponse.json(
          { error: 'Waitlist record not found' },
          { status: 404 }
        );
      }
      
      // Check if this waitlist user is already a beta user
      const existingBetaUserByWaitlist = await BetaUsers.findOne({ 
        waitListId: waitListRecord._id 
      });
      if (existingBetaUserByWaitlist) {
        return NextResponse.json(
          { error: 'This waitlist user is already a beta user' },
          { status: 409 }
        );
      }
    } else {
      // Create a new waitlist record if not provided
      waitListRecord = new WaitList({
        email: email.toLowerCase(),
        formResponses: {}
      });
      await waitListRecord.save();
    }

    // Create new beta user with reference to waitlist
    const newBetaUser = new BetaUsers({
      email: email.toLowerCase(),
      waitListId: waitListRecord._id,
      formResponses: waitListRecord.formResponses || {}
    });
    
    await newBetaUser.save();
    // Populate the waitlist data for response
    await newBetaUser.populate('waitListId', 'formResponses createdAt userWaitlistId');
    
    return NextResponse.json({
      message: 'User added to beta users successfully',
      user: newBetaUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding user to beta:', error);
    return NextResponse.json(
      { error: 'Failed to add user to beta' },
      { status: 500 }
    );
  }
}
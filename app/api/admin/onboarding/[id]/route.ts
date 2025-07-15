// app/api/admin/onboarding/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
import User from '@/models/User';
import Onboarding from '@/models/Onboarding';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    // Find user by either MongoDB _id, custom userId, or email
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId
      user = await User.findById(id).lean();
    } else {
      // Custom userId or email
      const numericUserId = parseInt(id);
      const searchCriteria: any = { email: id };
      
      // If id is numeric, also search by userId
      if (!isNaN(numericUserId)) {
        searchCriteria.$or = [
          { userId: numericUserId },
          { email: id }
        ];
        delete searchCriteria.email;
      }
      
      user = await User.findOne(searchCriteria).lean();
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find onboarding data for this user
    const onboarding = await Onboarding.findOne({ 
      userId: (user as any)._id 
    }).lean();

    return NextResponse.json({
      user,
      onboarding
    });
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding data' },
      { status: 500 }
    );
  }
}
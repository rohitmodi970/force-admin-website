// app/api/admin/beta-users/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
import BetaUsers from '@/models/Beta-Users';
import WaitList from '@/models/WaitList';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, userIds, emails } = await request.json();

    if (!action || (!userIds && !emails)) {
      return NextResponse.json({ 
        error: 'Action and either userIds or emails are required' 
      }, { status: 400 });
    }

    await connectDB();

    let results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    if (action === 'promote_from_waitlist') {
      // Promote users from waitlist to beta users
      const waitlistUsers = emails 
        ? await WaitList.find({ email: { $in: emails } })
        : await WaitList.find({ userWaitlistId: { $in: userIds } });

      for (const waitlistUser of waitlistUsers) {
        try {
          // Check if already a beta user
          const existingBetaUser = await BetaUsers.findOne({ 
            email: waitlistUser.email 
          });
          
          if (existingBetaUser) {
            results.errors.push(`${waitlistUser.email} is already a beta user`);
            results.failed++;
            continue;
          }

          // Create new beta user
          const newBetaUser = new BetaUsers({
            email: waitlistUser.email,
            waitListId: waitlistUser._id,
            formResponses: waitlistUser.formResponses || {}
          });
          
          await newBetaUser.save();
          results.success++;
        } catch (error) {
          results.errors.push(`Failed to promote ${waitlistUser.email}: ${error}`);
          results.failed++;
        }
      }
    } else if (action === 'remove_from_beta') {
      // Remove users from beta users
      const betaUsers = emails 
        ? await BetaUsers.find({ email: { $in: emails } })
        : await BetaUsers.find({ userId: { $in: userIds } });

      for (const betaUser of betaUsers) {
        try {
          await BetaUsers.findByIdAndDelete(betaUser._id);
          results.success++;
        } catch (error) {
          results.errors.push(`Failed to remove ${betaUser.email}: ${error}`);
          results.failed++;
        }
      }
    }

    return NextResponse.json({
      message: `Bulk ${action} completed`,
      results
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

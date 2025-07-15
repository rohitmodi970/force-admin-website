// app/api/admin/beta-users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
import BetaUsers from '@/models/Beta-Users';
import WaitList from '@/models/WaitList';
import mongoose from 'mongoose';

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

    let betaUser;

    // Check if ID is a MongoDB ObjectId or a numeric userId
    if (mongoose.Types.ObjectId.isValid(id)) {
      betaUser = await BetaUsers.findById(id)
        .populate('waitListId', 'formResponses createdAt userWaitlistId')
        .lean();
    } else {
      // Try to parse as numeric userId
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
      }
      
      betaUser = await BetaUsers.findOne({ userId })
        .populate('waitListId', 'formResponses createdAt userWaitlistId')
        .lean();
    }

    if (!betaUser) {
      return NextResponse.json({ error: 'Beta user not found' }, { status: 404 });
    }

    return NextResponse.json({ user: betaUser });
  } catch (error) {
    console.error('Error fetching beta user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta user details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    await connectDB();

    // Remove fields that shouldn't be updated directly
    const { userId, waitListId, ...allowedUpdates } = updates;

    let updatedBetaUser;

    // Check if ID is a MongoDB ObjectId or a numeric userId
    if (mongoose.Types.ObjectId.isValid(id)) {
      updatedBetaUser = await BetaUsers.findByIdAndUpdate(
        id,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      ).populate('waitListId', 'formResponses createdAt userWaitlistId');
    } else {
      // Try to parse as numeric userId
      const userIdNum = parseInt(id);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
      }
      
      updatedBetaUser = await BetaUsers.findOneAndUpdate(
        { userId: userIdNum },
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      ).populate('waitListId', 'formResponses createdAt userWaitlistId');
    }

    if (!updatedBetaUser) {
      return NextResponse.json({ error: 'Beta user not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Beta user updated successfully',
      user: updatedBetaUser 
    });
  } catch (error) {
    console.error('Error updating beta user:', error);
    return NextResponse.json(
      { error: 'Failed to update beta user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const keepInWaitlist = searchParams.get('keepInWaitlist') === 'true';

    await connectDB();

    let betaUser;

    // Check if ID is a MongoDB ObjectId or a numeric userId
    if (mongoose.Types.ObjectId.isValid(id)) {
      betaUser = await BetaUsers.findById(id).populate('waitListId');
    } else {
      // Try to parse as numeric userId
      const userIdNum = parseInt(id);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
      }
      
      betaUser = await BetaUsers.findOne({ userId: userIdNum }).populate('waitListId');
    }
    
    if (!betaUser) {
      return NextResponse.json({ error: 'Beta user not found' }, { status: 404 });
    }

    // Store the waitlist reference before removing beta user
    const waitListRecord = betaUser.waitListId;

    // Remove from beta users
    await BetaUsers.findByIdAndDelete(betaUser._id);

    let restoredToWaitlist = false;

    if (keepInWaitlist) {
      // If waitlist record exists, it stays in waitlist (user goes back to waitlist)
      // If waitlist record doesn't exist, create a new one
      if (!waitListRecord) {
        const newWaitListRecord = new WaitList({
          email: betaUser.email,
          formResponses: betaUser.formResponses || {}
        });
        await newWaitListRecord.save();
        restoredToWaitlist = true;
      } else {
        restoredToWaitlist = true;
      }
    } else {
      // If not keeping in waitlist, remove from waitlist too
      if (waitListRecord) {
        await WaitList.findByIdAndDelete(waitListRecord._id);
      }
    }

    return NextResponse.json({
      message: restoredToWaitlist 
        ? 'User removed from beta users and restored to waitlist'
        : 'User removed from beta users completely',
      restoredToWaitlist
    });
  } catch (error) {
    console.error('Error removing beta user:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from beta users' },
      { status: 500 }
    );
  }
}

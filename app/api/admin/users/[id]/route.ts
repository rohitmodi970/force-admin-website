// app/api/admin/miscellaneous/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utilities/auth';
import connectDB from '@/models/connectDB';
import User from '@/models/User';
import BetaUsers from '@/models/Beta-Users'; // Fixed import name
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

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    await connectDB();

    // Find user by either MongoDB _id, custom userId, or email
    let user;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      // MongoDB ObjectId
      user = await User.findById(id).lean();
    } else {
      // Build query conditions based on what type of identifier we have
      const queryConditions = [];
      
      // Always allow email search (case-insensitive)
      queryConditions.push({ email: { $regex: `^${id}$`, $options: 'i' } });
      
      // Only add userId search if id is a valid number
      const parsedUserId = parseInt(id);
      if (!isNaN(parsedUserId) && isFinite(parsedUserId)) {
        queryConditions.push({ userId: parsedUserId });
      }
      
      // Add search by username if User model has username field
      if (id.length > 0) {
        queryConditions.push({ username: { $regex: `^${id}$`, $options: 'i' } });
      }
      
      user = await User.findOne({
        $or: queryConditions
      }).lean();
    }

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

    // Get user activity stats (if you have activity tracking)
    const userStats = {
      registeredDate: (user as any).createdAt,
      lastLogin: (user as any).lastLogin || null,
      isBetaUser,
      isInWaitlist,
      betaUserSince: (betaUser as any)?.createdAt || null,
      waitlistSince: (waitListUser as any)?.createdAt || null
    };

    // console.log('User found:', user);
    
    return NextResponse.json({
      user,
      isBetaUser,
      isInWaitlist,
      betaUser,
      waitListUser,
      stats: userStats
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
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

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    await connectDB();

    // Remove sensitive fields that shouldn't be updated directly
    const { password, _id, userId, createdAt, updatedAt, ...allowedUpdates } = updates;

    let user;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findByIdAndUpdate(
        id,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      ).lean();
    } else {
      // Build query conditions for finding the user
      const queryConditions = [];
      
      queryConditions.push({ email: { $regex: `^${id}$`, $options: 'i' } });
      
      const parsedUserId = parseInt(id);
      if (!isNaN(parsedUserId) && isFinite(parsedUserId)) {
        queryConditions.push({ userId: parsedUserId });
      }
      
      user = await User.findOneAndUpdate(
        { $or: queryConditions },
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      ).lean();
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
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
    const hardDelete = searchParams.get('hardDelete') === 'true';

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    await connectDB();

    let user;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    } else {
      const queryConditions = [];
      queryConditions.push({ email: { $regex: `^${id}$`, $options: 'i' } });
      
      const parsedUserId = parseInt(id);
      if (!isNaN(parsedUserId) && isFinite(parsedUserId)) {
        queryConditions.push({ userId: parsedUserId });
      }
      
      user = await User.findOne({ $or: queryConditions });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (hardDelete) {
      // Hard delete - remove user and all related data
      await Promise.all([
        User.findByIdAndDelete(user._id),
        BetaUsers.deleteMany({ email: user.email }),
        WaitList.deleteMany({ email: user.email })
      ]);
      
      return NextResponse.json({
        message: 'User and all related data deleted successfully'
      });
    } else {
      // Soft delete - just mark as deleted or disable account
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $set: { 
            isActive: false,
            deletedAt: new Date(),
            email: `deleted_${Date.now()}_${user.email}` // Anonymize email
          }
        },
        { new: true }
      );
      
      return NextResponse.json({
        message: 'User account deactivated successfully',
        user: updatedUser
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
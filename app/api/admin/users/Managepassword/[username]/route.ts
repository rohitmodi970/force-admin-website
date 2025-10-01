// app\api\admin\users\Managepassword\[username]\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Admin } from '@/models/AdminSchema';
import connectDB from '@/models/connectDB';

// GET - Fetch single user by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await params;
    const user = await Admin.findOne({ username }).select('-password -sessionToken');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await params;
    const body = await request.json();
    const { username: newUsername, name, email, status } = body;

    // Find existing user
    const existingUser = await Admin.findOne({ username });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if new username already exists (if username is being changed)
    if (newUsername && newUsername !== username) {
      const usernameExists = await Admin.findOne({ username: newUsername });
      if (usernameExists) {
        return NextResponse.json(
          { success: false, error: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // Check if new email already exists (if email is being changed)
    if (email && email !== existingUser.email) {
      const emailExists = await Admin.findOne({ email });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await Admin.findOneAndUpdate(
      { username },
      { 
        ...(newUsername && { username: newUsername }),
        ...(name && { name }),
        ...(email && { email }),
        ...(status && { status })
      },
      { new: true, runValidators: true }
    ).select('-password -sessionToken');

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await params;
    
    const deletedUser = await Admin.findOneAndDelete({ username });
    
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
// app\api\admin\users\Managepassword\[username]\password\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Admin } from '@/models/AdminSchema';
import connectDB from '@/models/connectDB';

// PUT - Update user password
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await params; // Await the params Promise
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const user = await Admin.findOne({ username });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    user.password = password;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update password' },
      { status: 500 }
    );
  }
}
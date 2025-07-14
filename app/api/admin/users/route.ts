// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Admin } from '@/models/AdminSchema';
import connectDB from '@/models/connectDB';

// GET - Fetch all users
export async function GET() {
  try {
    await connectDB();
    const users = await Admin.find({}).select('-password -sessionToken');
    return NextResponse.json({ 
      success: true, 
      data: users,
      total: users.length 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new admin user
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { username, password, name, email, status = 'active' } = body;
    
    // Validation
    if (!username || !password || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 400 }
      );
    }

    const newAdmin = new Admin({
      username,
      password,
      name,
      email,
      status
    });

    await newAdmin.save();
    
    // Return user without password
    const userResponse = await Admin.findById(newAdmin._id).select('-password -sessionToken');
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Admin user created successfully'
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
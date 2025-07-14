// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/models/connectDB';
import { Admin } from '@/models/AdminSchema';
import { z } from 'zod';

// Validation schema
const signUpSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Please enter a valid email address')
    .transform(email => email.toLowerCase()),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .transform(name => name.trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
});

// Helper function to validate IP address
function isValidIP(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === '0.0.0.0') return false;
  
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  // localhost variations
  if (ip === 'localhost' || ip === '::1' || ip === '127.0.0.1') return false; // Don't store localhost IPs
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input data
    const validatedData = signUpSchema.parse(body);
    
    // Connect to database
    await connectDB();
    
    // Check if admin with username already exists
    const existingUsername = await Admin.findOne({ 
      username: validatedData.username 
    });
    
    if (existingUsername) {
      return NextResponse.json(
        { 
          message: 'Username already exists. Please choose a different username.',
          success: false 
        },
        { status: 400 }
      );
    }
    
    // Check if admin with email already exists
    const existingEmail = await Admin.findOne({ 
      email: validatedData.email 
    });
    
    if (existingEmail) {
      return NextResponse.json(
        { 
          message: 'Email already registered. Please use a different email.',
          success: false 
        },
        { status: 400 }
      );
    }
    
    // Get client IP address using the IP detection service
    let clientIP = 'unknown';
    try {
      const ipResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-ip`, {
        method: 'GET',
        headers: {
          'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
          'x-real-ip': request.headers.get('x-real-ip') || '',
          'x-client-ip': request.headers.get('x-client-ip') || '',
          'cf-connecting-ip': request.headers.get('cf-connecting-ip') || '',
        },
      });
      
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        clientIP = ipData.ip || 'unknown';
      }
    } catch (ipError) {
      console.warn('Failed to fetch IP from service:', ipError);
      // Fallback to basic IP detection
      clientIP = request.ip || 
                request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                request.headers.get('x-real-ip') || 
                request.headers.get('cf-connecting-ip') || 
                request.headers.get('x-client-ip') ||
                'unknown';
    }
    
    // Only include IP address if it's valid
    const ipAddresses: string[] = [];
    if (isValidIP(clientIP)) {
      ipAddresses.push(clientIP);
    }
    
    // Create new admin
    const newAdmin = new Admin({
      username: validatedData.username,
      email: validatedData.email,
      name: validatedData.name,
      password: validatedData.password, // Will be hashed by pre-save middleware
      status: 'active',
      loginAttempts: 0,
      ipAddress: ipAddresses, // Only include valid IPs
      lastLogin: null,
      profileImage: null
    });
    
    // Save admin to database
    await newAdmin.save();
    
    // Log successful registration
    console.log(`New admin registered: ${validatedData.email} from IP: ${clientIP}`);
    
    return NextResponse.json(
      { 
        message: 'Account created successfully! You can now sign in.',
        success: true 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message);
      return NextResponse.json(
        { 
          message: errorMessages[0] || 'Validation error',
          success: false 
        },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors (MongoDB)
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys((error as any).keyValue)[0];
        const message = duplicateField === 'username' 
          ? 'Username already exists. Please choose a different username.'
          : 'Email already registered. Please use a different email.';
        
        return NextResponse.json(
          { 
            message,
            success: false 
          },
          { status: 400 }
        );
      }
    }
    
    // Handle mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const validationError = error as any;
      const errorMessages = Object.values(validationError.errors).map(
        (err: any) => err.message
      );
      
      return NextResponse.json(
        { 
          message: errorMessages[0] || 'Validation error',
          success: false 
        },
        { status: 400 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        message: 'An unexpected error occurred. Please try again.',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
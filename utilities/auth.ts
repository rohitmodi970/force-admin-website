// utilities/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/models/connectDB';
import { Admin } from '@/models/AdminSchema';

// Helper function to get IP address using the IP detection service
async function getClientIP(headers: Headers, baseUrl: string): Promise<string> {
  try {
    const ipResponse = await fetch(`${baseUrl}/api/auth/get-ip`, {
      method: 'GET',
      headers: {
        'x-forwarded-for': headers.get('x-forwarded-for') || '',
        'x-real-ip': headers.get('x-real-ip') || '',
        'x-client-ip': headers.get('x-client-ip') || '',
        'cf-connecting-ip': headers.get('cf-connecting-ip') || '',
      },
    });
    
    if (ipResponse.ok) {
      const ipData = await ipResponse.json();
      return ipData.ip || 'unknown';
    }
  } catch (error) {
    console.warn('Failed to fetch IP from service:', error);
  }
  
  // Fallback to basic IP detection
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         headers.get('x-real-ip') || 
         headers.get('cf-connecting-ip') || 
         headers.get('x-client-ip') ||
         'unknown';
}

// Helper function to validate IP address
function isValidIP(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === '0.0.0.0') return false;
  
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  // Don't store localhost IPs
  if (ip === 'localhost' || ip === '::1' || ip === '127.0.0.1') return false;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Please provide both username/email and password');
        }

        try {
          await connectDB();
          
          // Find admin by username or email
          const admin = await Admin.findOne({
            $or: [
              { username: credentials.identifier },
              { email: credentials.identifier }
            ]
          }).select('+password +loginAttempts +profileImage') as { _id: string; username: string; email: string; name: string; status: string; loginAttempts: number; comparePassword: (password: string) => Promise<boolean>; incLoginAttempts: () => Promise<void>; resetLoginAttempts: () => Promise<void>; addIpAddress: (ip: string) => Promise<void>; lastLogin?: Date; createdAt: Date; profileImage?: string };

          if (!admin) {
            throw new Error('Invalid credentials');
          }

          // Check if admin is suspended
          if (admin.status === 'suspended') {
            throw new Error('Account suspended. Please contact support.');
          }

          // Check if admin is inactive
          if (admin.status === 'inactive') {
            throw new Error('Account inactive. Please contact support.');
          }

          // Check login attempts (implement lockout if needed)
          if (admin.loginAttempts >= 5) {
            throw new Error('Account temporarily locked due to multiple failed attempts');
          }

          // Verify password
          const isPasswordValid = await admin.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            // Increment login attempts
            await admin.incLoginAttempts();
            throw new Error('Invalid credentials');
          }

          // Reset login attempts and update last login
          await admin.resetLoginAttempts();

          // Get IP address and add it if valid
          if (req && req.headers) {
            try {
              const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
              const clientIP = await getClientIP(req.headers as Headers, baseUrl);
              
              if (isValidIP(clientIP)) {
                await admin.addIpAddress(clientIP);
              }
            } catch (ipError) {
              console.warn('Failed to update IP address:', ipError);
            }
          }

          // Return admin data for session
          return {
            id: admin._id.toString(),
            username: admin.username,
            name: admin.name,
            email: admin.email,
            status: admin.status,
            profileImage: admin?.profileImage,
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error(error instanceof Error ? error.message : 'Authentication failed');
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
        token.email = user.email;
        token.status = user.status;
        token.profileImage = user.profileImage;
        token.lastLogin = user.lastLogin;
        token.createdAt = user.createdAt;
      }

      // Check if admin still exists and is active on each request
      if (token.id) {
        try {
          await connectDB();
          const admin = await Admin.findById(token.id);
          
          if (!admin || admin.status !== 'active') {
            // Admin was deleted or deactivated, invalidate token
            return {
              id: '',
              username: '',
              name: '',
              email: '',
              status: '',
              profileImage: undefined,
              lastLogin: undefined,
              createdAt: new Date(0),
            };
          }

          // Update token with latest admin data
          token.username = admin.username;
          token.name = admin.name;
          token.email = admin.email;
          token.status = admin.status;
          token.profileImage = admin.profileImage;
          token.lastLogin = admin.lastLogin;
        } catch (error) {
          console.error('Error checking admin status:', error);
          // On error, invalidate token for security
          return {
            id: '',
            username: '',
            name: '',
            email: '',
            status: '',
            profileImage: undefined,
            lastLogin: undefined,
            createdAt: new Date(0),
          };
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user = {
          id: token.id as string,
          username: token.username as string,
          name: token.name as string,
          email: token.email as string,
          status: token.status as string,
          profileImage: token.profileImage as string,
          lastLogin: token.lastLogin as Date,
          createdAt: token.createdAt as Date,
        };
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to admin dashboard after login
      if (url.startsWith('/')) return `${baseUrl}/admin/dashboard`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/error',
    signOut: '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign in
      console.log(`Admin signed in: ${user.email} at ${new Date()}`);
    },

    async signOut({ session, token }) {
      // Log sign out
      console.log(`Admin signed out: ${token?.email} at ${new Date()}`);
      
      // Clear session token if stored in database
      try {
        await connectDB();
        await Admin.findByIdAndUpdate(token?.id, {
          $unset: { sessionToken: 1, tokenExpiry: 1 }
        });
      } catch (error) {
        console.error('Error clearing session token:', error);
      }
    }
  }
};

// Extended user type for TypeScript
declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    status: string;
    profileImage?: string;
    lastLogin?: Date;
    createdAt: Date;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      email: string;
      status: string;
      profileImage?: string;
      lastLogin?: Date;
      createdAt: Date;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    name: string;
    email: string;
    status: string;
    profileImage?: string;
    lastLogin?: Date;
    createdAt: Date;
  }
}
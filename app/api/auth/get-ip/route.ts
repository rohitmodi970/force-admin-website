// \app\api\auth\get-ip\route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to get IP from request headers first
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = request.headers.get('x-client-ip');
    
    // Check various header sources
    let ip = forwarded?.split(',')[0] || realIp || clientIp;
    
    // If no IP found in headers, try external services
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.ip.sb/ip',
        'https://ipinfo.io/json'
      ];

      for (const service of ipServices) {
        try {
          const response = await fetch(service, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            },
            // Add timeout
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Handle different response formats
            if (typeof data === 'string') {
              ip = data;
            } else if (data.ip) {
              ip = data.ip;
            } else if (data.query) {
              ip = data.query;
            }
            
            if (ip) break;
          }
        } catch (serviceError) {
          console.warn(`Failed to fetch from ${service}:`, serviceError);
        }
      }
    }
    
    return NextResponse.json({ 
      ip: ip || '0.0.0.0',
      source: ip ? 'detected' : 'fallback'
    });
    
  } catch (error) {
    console.error('Error getting IP address:', error);
    return NextResponse.json({ 
      ip: '0.0.0.0',
      source: 'fallback',
      error: 'Failed to detect IP'
    });
  }
}
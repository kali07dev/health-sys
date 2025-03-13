// app/api/notifications/system/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check role authorization
  if (session.role !== 'admin' && session.role !== 'safety_officer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const type = searchParams.get('type') || '';

  try {
    // Construct the backend API URL with all parameters
    const apiUrl = `${process.env.BACKEND_API_URL}/api/v1/notifications/system?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}${type ? `&type=${type}` : ''}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch system notifications' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    return NextResponse.json(
      { error: 'Server error while fetching system notifications' },
      { status: 500 }
    );
  }
}
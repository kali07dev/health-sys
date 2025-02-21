// api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Backend logout failed');
    }

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
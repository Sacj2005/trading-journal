import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No account found for that username.' }, { status: 404 });
    }

    const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(profile.id);
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: 'Could not retrieve account details.' }, { status: 500 });
    }

    return NextResponse.json({ email: userData.user.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

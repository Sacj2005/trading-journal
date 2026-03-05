import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, answer } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const serviceSupabase = getServiceClient();

    if (action === 'get_question') {
      const { data: users } = await serviceSupabase.auth.admin.listUsers();
      const authUser = users?.users?.find(u => u.email === email);
      if (!authUser) {
        return NextResponse.json({ error: 'No account found for that email.' }, { status: 404 });
      }

      const { data: profile, error: profileError } = await serviceSupabase
        .from('user_profiles')
        .select('security_question')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
      }

      if (profile.security_question === 'google-oauth') {
        return NextResponse.json({
          google_oauth: true,
          message: 'This account uses Google Sign-In. Please use Continue with Google.',
        });
      }

      return NextResponse.json({ security_question: profile.security_question });
    }

    if (action === 'verify_answer') {
      if (!answer) {
        return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
      }

      const { data: users } = await serviceSupabase.auth.admin.listUsers();
      const authUser = users?.users?.find(u => u.email === email);
      if (!authUser) {
        return NextResponse.json({ error: 'No account found for that email.' }, { status: 404 });
      }

      const { data: profile, error: profileError } = await serviceSupabase
        .from('user_profiles')
        .select('security_answer_hash')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
      }

      const normalised = answer.trim().toLowerCase();
      const match = await bcrypt.compare(normalised, profile.security_answer_hash);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect answer.' }, { status: 401 });
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const { error: resetError } = await serviceSupabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${siteUrl}/auth/reset` },
      });

      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

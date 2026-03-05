import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { SECURITY_QUESTIONS } from '@/lib/auth-constants';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, username, security_question, security_answer } = body;

    if (action === 'ensure-google') {
      if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      const supabase = createServiceClient();
      const { data: existing } = await supabase.from('user_profiles').select('id').eq('id', userId).maybeSingle();
      if (!existing) {
        const email = body.email || '';
        const uname = email.split('@')[0] || 'user';
        const placeholderHash = await bcrypt.hash('google-oauth-placeholder', 10);
        await supabase.from('user_profiles').insert({
          id: userId,
          username: uname,
          security_question: 'google-oauth',
          security_answer_hash: placeholderHash,
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action !== 'create') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!userId || !username || !security_question || !security_answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(SECURITY_QUESTIONS as readonly string[]).includes(security_question)) {
      return NextResponse.json({ error: 'Invalid security question' }, { status: 400 });
    }

    const normalised = security_answer.trim().toLowerCase();
    const security_answer_hash = await bcrypt.hash(normalised, 10);

    const supabase = createServiceClient();
    const { error } = await supabase.from('user_profiles').insert({
      id: userId,
      username,
      security_question,
      security_answer_hash,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

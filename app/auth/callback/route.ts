import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Auto-create user_profiles row for Google OAuth users (first sign-in only)
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey) {
          const service = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey
          );
          const { data: existing } = await service
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!existing) {
            const username =
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              (data.user.email ? data.user.email.split('@')[0] : 'user');
            const placeholderHash = await bcrypt.hash('google-oauth-placeholder', 10);
            await service.from('user_profiles').insert({
              id: data.user.id,
              username,
              security_question: 'google-oauth',
              security_answer_hash: placeholderHash,
            });
          }
        }
      } catch {
        // Profile creation failed — don't block sign-in
        console.error('Failed to create user_profiles row for Google OAuth user');
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

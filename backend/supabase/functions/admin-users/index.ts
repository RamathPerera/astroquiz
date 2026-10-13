// Supabase Edge Function scaffold for privileged account provisioning.
// Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and deploy with: supabase functions deploy admin-users
// Never move this service-role key into a VITE_ frontend environment variable.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return new Response('Server is not configured', { status: 500 });
  const adminClient = createClient(url, serviceKey);
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return new Response('Unauthorized', { status: 401 });
  const { data: actor } = await adminClient.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (actor?.role !== 'admin' || !actor.is_active) return new Response('Forbidden', { status: 403 });
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const display_name = String(body.display_name ?? '').trim();
    const username = String(body.username ?? '').trim().toLowerCase();
    const role = body.role;
    if (!email || !display_name || !username || !['student','moderator','admin'].includes(role)) return new Response('Invalid input', { status: 400 });
    const { data, error } = await adminClient.auth.admin.createUser({ email, email_confirm: false, user_metadata: { display_name, username } });
    if (error || !data.user) return new Response(error?.message ?? 'Unable to create user', { status: 400 });
    const { error: profileError } = await adminClient.from('profiles').upsert({ id: data.user.id, username, display_name, role, is_active: true });
    if (profileError) { await adminClient.auth.admin.deleteUser(data.user.id); return new Response('Profile creation failed', { status: 500 }); }
    await adminClient.from('audit_logs').insert({ actor_id: user.id, action: 'user_created', target_user_id: data.user.id, metadata: { role } });
    return Response.json({ id: data.user.id, email: data.user.email }, { status: 201 });
  } catch { return new Response('Invalid request body', { status: 400 }); }
});

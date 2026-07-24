// Supabase Edge Function: admin-create-user
// Lets an already-authenticated Admin create a Doctor or Receptionist account
// without losing their own session (which is a limitation of client-side signUp).
//
// Deploy with:  supabase functions deploy admin-create-user
// Requires these secrets to be set in your Supabase project:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-available to edge functions),
//   and the caller's JWT is read from the Authorization header.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration: Missing Supabase environment variables' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Client scoped to the calling user, to verify they are an admin.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await callerClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const bodyText = await req.text()
    let body;
    try {
      body = JSON.parse(bodyText)
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { email, password, fullName, phone, role, specialization, department, dob, gender, bloodGroup, address } = body

    // Admins can create doctors, receptionists, or patients.
    // Receptionists can only register patients (front-desk registration).
    const callerRole = callerProfile?.role
    const isAllowed =
      (callerRole === 'admin' && ['doctor', 'receptionist', 'patient'].includes(role)) ||
      (callerRole === 'receptionist' && role === 'patient')

    if (!isAllowed) {
      return new Response(JSON.stringify({ success: false, error: 'You do not have permission to create this type of account' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!email || !password || !fullName || !phone) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields (email, password, fullName, phone)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client with service role key - bypasses RLS, doesn't affect caller's session.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role, phone },
    })

    if (createError) {
      return new Response(JSON.stringify({ success: false, error: createError.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const newUserId = created.user.id

    await adminClient.from('profiles').upsert({
      id: newUserId,
      email,
      full_name: fullName,
      role,
      phone,
    })

    if (role === 'doctor') {
      await adminClient.from('doctors').upsert({
        id: newUserId,
        specialization: specialization || null,
        department: department || null,
      })
    }

    if (role === 'patient') {
      await adminClient.from('patients').upsert({
        id: newUserId,
        date_of_birth: dob || null,
        gender: gender || null,
        blood_group: bloodGroup || null,
        address: address || null,
      })
    }

    return new Response(JSON.stringify({ success: true, id: newUserId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal server error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

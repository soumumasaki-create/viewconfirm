import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, password, name, company } = await req.json()

  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { error: dbError } = await supabaseAdmin
    .from('admins')
    .insert({
      email,
      name,
      company,
      can_view_all_companies: false,
      can_view_own_company: false,
      can_download_csv: false,
      can_manage_admin_permissions: false,
      can_reset_password: false,
      can_unlock_account: false,
      can_receive_security_mail: false,
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
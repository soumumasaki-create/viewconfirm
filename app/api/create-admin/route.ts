import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, password, name, company } = await req.json()

  // Supabase Authにユーザー作成
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // adminsテーブルに登録
  const { error: dbError } = await supabaseAdmin
    .from('admins')
    .insert({ email, name, company })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
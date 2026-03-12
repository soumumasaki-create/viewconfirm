import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { lastName, firstName, company } = await req.json()

  const email = `emp_${Date.now()}@viewconfirm.internal`

  // Supabase Authにユーザー作成（初回パスワード1234）
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: '1234',
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // employeesテーブルに登録
  const { error: dbError } = await supabaseAdmin
    .from('employees')
    .insert({ last_name: lastName, first_name: firstName, company })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
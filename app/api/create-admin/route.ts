import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, password, name, company } = await req.json()

  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedName = String(name || '').trim()
  const normalizedCompany = String(company || '').trim()
  const initialPassword = String(password || '1234')

  if (!normalizedEmail || !normalizedName || !normalizedCompany) {
    return NextResponse.json(
      { error: 'メールアドレス・氏名・所属会社をすべて入力してください' },
      { status: 400 }
    )
  }

  if (!initialPassword) {
    return NextResponse.json(
      { error: '初期パスワードを入力してください' },
      { status: 400 }
    )
  }

  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: initialPassword,
    email_confirm: true,
  })

  if (authError) {
    const message = authError.message || ''
    const lowerMessage = message.toLowerCase()

    const alreadyRegistered =
      lowerMessage.includes('already') ||
      lowerMessage.includes('registered') ||
      message.includes('A user with this email address has already been registered')

    if (!alreadyRegistered) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
  }

  const { data: existingAdmin, error: findError } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 400 })
  }

  if (existingAdmin) {
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        name: normalizedName,
        company: normalizedCompany,
      })
      .eq('id', existingAdmin.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: '既存の管理者情報を更新しました',
    })
  }

  const { error: dbError } = await supabaseAdmin.from('admins').insert({
    email: normalizedEmail,
    name: normalizedName,
    company: normalizedCompany,
    is_super_admin: false,
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

  return NextResponse.json({
    success: true,
    message: '管理者を登録しました',
  })
}
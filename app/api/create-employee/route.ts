import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { lastName, firstName, company, affiliation } = await req.json()

  if (!lastName || !firstName || !company || !affiliation) {
    return NextResponse.json(
      { error: '姓・名・会社名・所属をすべて入力してください' },
      { status: 400 }
    )
  }

  // 氏名ベースの内部メールアドレス生成
  const lastRoman = encodeURIComponent(lastName).replace(/%/g, '').toLowerCase()
  const firstRoman = encodeURIComponent(firstName).replace(/%/g, '').toLowerCase()
  const email = `${lastRoman}_${firstRoman}@viewconfirm.internal`

  // 既に同じ氏名が存在するか確認
  const { data: existing } = await supabaseAdmin
    .from('employees')
    .select('id')
    .eq('last_name', lastName)
    .eq('first_name', firstName)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: '同じ氏名の社員が既に登録されています' },
      { status: 400 }
    )
  }

  // Supabase Authにユーザー作成（初回パスワード1234）
  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
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
    .insert({
      last_name: lastName,
      first_name: firstName,
      company,
      affiliation,
      email,
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function createInternalEmail(lastName: string, firstName: string) {
  const lastRoman = encodeURIComponent(lastName).replace(/%/g, '').toLowerCase()
  const firstRoman = encodeURIComponent(firstName).replace(/%/g, '').toLowerCase()
  const uniqueSuffix = Date.now().toString()

  return `${lastRoman}_${firstRoman}_${uniqueSuffix}@viewconfirm.internal`
}

export async function POST(req: Request) {
  const { lastName, firstName, company, affiliation } = await req.json()

  if (!lastName || !firstName || !company || !affiliation) {
    return NextResponse.json(
      { error: '姓・名・会社名・所属をすべて入力してください' },
      { status: 400 }
    )
  }

  const { data: existingEmployee, error: existingEmployeeError } = await supabaseAdmin
    .from('employees')
    .select('id')
    .eq('last_name', lastName)
    .eq('first_name', firstName)
    .eq('company', company)
    .maybeSingle()

  if (existingEmployeeError) {
    return NextResponse.json(
      { error: '既存社員の確認に失敗しました' },
      { status: 400 }
    )
  }

  if (existingEmployee) {
    return NextResponse.json(
      { error: '同じ氏名・会社の社員が既に登録されています' },
      { status: 400 }
    )
  }

  const email = createInternalEmail(lastName, firstName)

  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: '1234',
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

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
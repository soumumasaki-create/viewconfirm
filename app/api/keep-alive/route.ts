import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Supabase environment variables are missing.',
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Supabase keep-alive failed.',
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Supabase keep-alive succeeded.',
      checked_at: new Date().toISOString(),
      count: data?.length || 0,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Unexpected keep-alive error.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
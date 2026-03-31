'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function EmployeeLoginPage() {
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employeeInfo, setEmployeeInfo] = useState<{ company: string; affiliation: string } | null>(null)

  const handleNameLookup = async (nextLastName: string, nextFirstName: string) => {
    if (!nextLastName || !nextFirstName) {
      setEmployeeInfo(null)
      return
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('company, affiliation')
      .eq('last_name', nextLastName)
      .eq('first_name', nextFirstName)
      .maybeSingle()

    if (emp) {
      setEmployeeInfo({
        company: emp.company || '',
        affiliation: emp.affiliation || '',
      })
    } else {
      setEmployeeInfo(null)
    }
  }

  const handleLogin = async () => {
    if (!lastName || !firstName || !password) {
      setError('姓・名・パスワードを入力してください')
      return
    }

    setLoading(true)
    setError('')

    const { data: emp, error: empError } = await supabase
      .from('employees')
      .select('email, company, affiliation')
      .eq('last_name', lastName)
      .eq('first_name', firstName)
      .single()

    if (empError || !emp?.email) {
      setError('氏名が正しくありません。管理者に登録を依頼してください。')
      setLoading(false)
      return
    }

    setEmployeeInfo({
      company: emp.company || '',
      affiliation: emp.affiliation || '',
    })

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: emp.email,
      password,
    })

    if (loginError) {
      setError('パスワードが正しくありません。')
      setLoading(false)
      return
    }

    window.location.href = '/watch'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          backgroundColor: '#1e3a5f',
          padding: '0 40px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#2563eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            📺
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>ViewConfirm</div>
            <div style={{ fontSize: '10px', color: '#93c5fd', letterSpacing: '0.1em' }}>
              MIRAI GROUP
            </div>
          </div>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '48px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#2563eb',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 16px',
              }}
            >
              👤
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#1e3a5f',
                marginBottom: '6px',
              }}
            >
              社員ログイン
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              氏名とパスワードを入力してください
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', color: '#1d4ed8', lineHeight: '1.6' }}>
              登録済みの氏名を入力すると、該当する場合は会社名と所属を確認できます。
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block',
                  fontWeight: '600',
                }}
              >
                姓
              </label>
              <input
                placeholder="例：山田"
                value={lastName}
                onChange={(e) => {
                  const value = e.target.value
                  setLastName(value)
                  handleNameLookup(value, firstName)
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block',
                  fontWeight: '600',
                }}
              >
                名
              </label>
              <input
                placeholder="例：太郎"
                value={firstName}
                onChange={(e) => {
                  const value = e.target.value
                  setFirstName(value)
                  handleNameLookup(lastName, value)
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div
            style={{
              backgroundColor: employeeInfo ? '#f0fdf4' : '#f8fafc',
              border: employeeInfo ? '1px solid #86efac' : '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>登録情報</div>

            {employeeInfo ? (
              <div>
                <div style={{ fontSize: '13px', color: '#166534', marginBottom: '4px' }}>
                  会社：{employeeInfo.company || '-'}
                </div>
                <div style={{ fontSize: '13px', color: '#166534' }}>
                  所属：{employeeInfo.affiliation || '-'}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                氏名を入力すると、登録されている会社名・所属がここに表示されます
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#475569',
                marginBottom: '6px',
                display: 'block',
                fontWeight: '600',
              }}
            >
              パスワード
            </label>
            <input
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>❌ {error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/login" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none' }}>
              管理者の方はこちら →
            </a>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type EmployeeLoginInfo = {
  id: number
  last_name: string
  first_name: string
  company: string | null
  affiliation: string | null
  is_active: boolean | null
  employee_password: string | null
  must_change_password: boolean | null
}

export default function EmployeeLoginPage() {
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLoginInfo | null>(null)
  const [employeeInfo, setEmployeeInfo] = useState<{ company: string; affiliation: string } | null>(null)

  const normalizeName = (value: string) => {
    return String(value || '')
      .replace(/\u3000/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const findEmployee = async (nextLastName: string, nextFirstName: string) => {
    const normalizedLastName = normalizeName(nextLastName)
    const normalizedFirstName = normalizeName(nextFirstName)

    if (!normalizedLastName || !normalizedFirstName) {
      return { employee: null, error: null }
    }

    const { data, error } = await supabase
      .from('employees')
      .select(
        'id, last_name, first_name, company, affiliation, is_active, employee_password, must_change_password'
      )
      .eq('last_name', normalizedLastName)
      .eq('first_name', normalizedFirstName)
      .limit(1)

    if (error) {
      return { employee: null, error }
    }

    const employee = Array.isArray(data) && data.length > 0 ? data[0] : null

    return {
      employee: employee as EmployeeLoginInfo | null,
      error: null,
    }
  }

  const clearEmployeeInfo = () => {
    setSelectedEmployee(null)
    setEmployeeInfo(null)
  }

  const handleNameLookup = async (nextLastName: string, nextFirstName: string) => {
    setError('')

    const normalizedLastName = normalizeName(nextLastName)
    const normalizedFirstName = normalizeName(nextFirstName)

    if (!normalizedLastName || !normalizedFirstName) {
      clearEmployeeInfo()
      return
    }

    const { employee } = await findEmployee(normalizedLastName, normalizedFirstName)

    if (employee) {
      setSelectedEmployee(employee)
      setEmployeeInfo({
        company: employee.company || '',
        affiliation: employee.affiliation || '',
      })
    } else {
      clearEmployeeInfo()
    }
  }

  const saveEmployeeToLocalStorage = (employee: EmployeeLoginInfo) => {
    localStorage.setItem(
      'viewconfirm_employee',
      JSON.stringify({
        id: employee.id,
        last_name: employee.last_name,
        first_name: employee.first_name,
        company: employee.company || '',
        affiliation: employee.affiliation || '',
        must_change_password: employee.must_change_password === true,
      })
    )
  }

  const handleLogin = async () => {
    const normalizedLastName = normalizeName(lastName)
    const normalizedFirstName = normalizeName(firstName)
    const normalizedPassword = String(password || '').trim()

    if (!normalizedLastName || !normalizedFirstName || !normalizedPassword) {
      setError('姓・名・パスワードを入力してください')
      return
    }

    setLoading(true)
    setError('')

    let employee = selectedEmployee

    const selectedEmployeeMatches =
      employee &&
      normalizeName(employee.last_name) === normalizedLastName &&
      normalizeName(employee.first_name) === normalizedFirstName

    if (!selectedEmployeeMatches) {
      const result = await findEmployee(normalizedLastName, normalizedFirstName)

      if (result.error) {
        setError('社員情報の確認中にエラーが発生しました。管理者に確認してください。')
        setLoading(false)
        return
      }

      employee = result.employee
    }

    if (!employee) {
      setError('氏名が正しくありません。管理者に登録を依頼してください。')
      setLoading(false)
      return
    }

    if (employee.is_active === false) {
      setError('この社員は現在利用できません。管理者に確認してください。')
      setLoading(false)
      return
    }

    const registeredPassword = String(employee.employee_password || '1234').trim()

    if (normalizedPassword !== registeredPassword) {
      setError('パスワードが正しくありません。')
      setLoading(false)
      return
    }

    setSelectedEmployee(employee)
    setEmployeeInfo({
      company: employee.company || '',
      affiliation: employee.affiliation || '',
    })

    saveEmployeeToLocalStorage(employee)

    if (employee.must_change_password === true) {
      window.location.href = '/employee-change-password'
      return
    }

    window.location.href = '/watch'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)',
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
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #dbeafe',
            borderRadius: '20px',
            padding: '40px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 10px 30px rgba(30, 58, 95, 0.08)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                margin: '0 auto 16px',
              }}
            >
              👤
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1e3a5f',
                margin: '0 0 8px 0',
              }}
            >
              社員ログイン
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', margin: 0 }}>
              氏名とパスワードを入力してください
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '24px',
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', color: '#1d4ed8', lineHeight: '1.7' }}>
              登録済みの氏名を入力すると、該当する場合は会社名と所属を確認できます。
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '18px',
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
                  borderRadius: '10px',
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
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {employeeInfo && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                fontSize: '13px',
                lineHeight: '1.7',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>登録情報</div>
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '8px',
                }}
              >
                会社：{employeeInfo.company || '-'}
              </div>
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}
              >
                所属：{employeeInfo.affiliation || '-'}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
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

            <div
              style={{
                display: 'flex',
                width: '100%',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="初期パスワード：1234"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin()
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '12px 14px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: 'transparent',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  width: '72px',
                  flexShrink: 0,
                  border: 'none',
                  borderLeft: '1px solid #cbd5e1',
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? '非表示' : '表示'}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
            }}
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>

          <div
            style={{
              textAlign: 'center',
              marginTop: '14px',
              color: '#94a3b8',
              fontSize: '12px',
              lineHeight: '1.7',
            }}
          >
            入力後、上の登録情報を確認してからログインしてください
          </div>

          <a
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '18px',
              color: '#64748b',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            トップに戻る
          </a>

          <a
            href="/login"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '14px',
              color: '#64748b',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            管理者の方はこちら →
          </a>
        </div>
      </div>

      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          padding: '20px 40px',
          textAlign: 'center',
          backgroundColor: '#fff',
        }}
      >
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
          © 2026 MIRAI Group. ViewConfirm.
        </p>
      </footer>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type StoredEmployee = {
  id: number
  last_name: string
  first_name: string
  company: string
  affiliation: string
  must_change_password?: boolean
}

export default function EmployeeChangePasswordPage() {
  const [employee, setEmployee] = useState<StoredEmployee | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('viewconfirm_employee')

    if (!raw) {
      window.location.href = '/employee-login'
      return
    }

    try {
      const parsed = JSON.parse(raw) as StoredEmployee

      if (!parsed.id) {
        window.location.href = '/employee-login'
        return
      }

      setEmployee(parsed)
    } catch {
      localStorage.removeItem('viewconfirm_employee')
      window.location.href = '/employee-login'
    }
  }, [])

  const handleChangePassword = async () => {
    if (!employee) {
      setError('社員情報が確認できません。もう一度ログインしてください。')
      return
    }

    const password = String(newPassword || '').trim()
    const passwordConfirm = String(confirmPassword || '').trim()

    if (!password || !passwordConfirm) {
      setError('新しいパスワードと確認用パスワードを入力してください。')
      return
    }

    if (password.length < 4) {
      setError('パスワードは4文字以上で入力してください。')
      return
    }

    if (password === '1234') {
      setError('初期パスワード1234以外のパスワードに変更してください。')
      return
    }

    if (password !== passwordConfirm) {
      setError('新しいパスワードと確認用パスワードが一致しません。')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { error: updateError } = await supabase
      .from('employees')
      .update({
        employee_password: password,
        must_change_password: false,
      })
      .eq('id', employee.id)

    if (updateError) {
      setError('パスワード変更に失敗しました。管理者に確認してください。')
      setLoading(false)
      return
    }

    const updatedEmployee = {
      ...employee,
      must_change_password: false,
    }

    localStorage.setItem('viewconfirm_employee', JSON.stringify(updatedEmployee))

    setMessage('パスワードを変更しました。視聴画面へ移動します。')

    setTimeout(() => {
      window.location.href = '/watch'
    }, 900)
  }

  const handleBackToLogin = () => {
    localStorage.removeItem('viewconfirm_employee')
    window.location.href = '/employee-login'
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
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
              ViewConfirm
            </div>
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
            maxWidth: '500px',
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
              🔐
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1e3a5f',
                margin: '0 0 8px 0',
              }}
            >
              パスワード変更
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', margin: 0 }}>
              初回ログインまたは初期化後は、新しいパスワードに変更してください。
            </p>
          </div>

          {employee && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                lineHeight: '1.7',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>社員情報</div>
              <div>
                氏名：{employee.last_name} {employee.first_name}
              </div>
              <div>会社：{employee.company || '-'}</div>
              <div>所属：{employee.affiliation || '-'}</div>
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
              新しいパスワード
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
                type={showNewPassword ? 'text' : 'password'}
                placeholder="4文字以上、1234以外"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                onClick={() => setShowNewPassword(!showNewPassword)}
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
                {showNewPassword ? '非表示' : '表示'}
              </button>
            </div>
          </div>

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
              新しいパスワード確認
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
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="もう一度入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleChangePassword()
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? '非表示' : '表示'}
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

          {message && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              ✅ {message}
            </div>
          )}

          <button
            onClick={handleChangePassword}
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
            {loading ? '変更中...' : 'パスワードを変更する'}
          </button>

          <button
            type="button"
            onClick={handleBackToLogin}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#fff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginTop: '12px',
            }}
          >
            社員ログインに戻る
          </button>
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
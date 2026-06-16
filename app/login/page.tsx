'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkPasswordRecovery = async () => {
      const url = new URL(window.location.href)
      const isResetUrl =
        url.searchParams.get('reset') === '1' ||
        url.searchParams.get('type') === 'recovery' ||
        window.location.hash.includes('type=recovery') ||
        window.location.hash.includes('access_token')

      if (isResetUrl) {
        setIsPasswordRecovery(true)
        setMessage('新しいパスワードを入力してください。')
      }

      const { data } = await supabase.auth.getSession()
      if (data.session && isResetUrl) {
        setIsPasswordRecovery(true)
      }
    }

    checkPasswordRecovery()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
        setMessage('新しいパスワードを入力してください。')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async () => {
    setError('')
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('メールアドレスまたはパスワードが違います')
    } else if (data.session) {
      window.location.replace('/')
    } else {
      setError('セッションが取得できませんでした')
    }
  }

  const handleResetPassword = async () => {
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('先にメールアドレスを入力してください')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=1`,
    })

    if (error) {
      setError('再設定メールを送信できませんでした')
      return
    }

    setMessage('パスワード再設定メールを送信しました。メールをご確認ください。')
  }

  const handleUpdatePassword = async () => {
    setError('')
    setMessage('')

    if (!newPassword.trim()) {
      setError('新しいパスワードを入力してください')
      return
    }

    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上で入力してください')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setError('確認用パスワードが一致しません')
      return
    }

    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      setError('再設定の有効期限が切れています。もう一度、再設定メールを送信してください。')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setError('パスワードを更新できませんでした。もう一度お試しください。')
      return
    }

    setNewPassword('')
    setNewPasswordConfirm('')
    setShowNewPassword(false)
    setShowNewPasswordConfirm(false)
    setIsPasswordRecovery(false)
    setMessage('パスワードを更新しました。新しいパスワードでログインしてください。')

    await supabase.auth.signOut()

    window.history.replaceState({}, document.title, '/login')
  }

  const normalInputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box' as const,
  }

  const passwordInputWrapperStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
  }

  const passwordInputStyle = {
    flex: 1,
    minWidth: 0,
    padding: '11px 14px',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box' as const,
  }

  const showButtonStyle = {
    width: '64px',
    flexShrink: 0,
    height: '43px',
    border: 'none',
    borderLeft: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#1e3a5f',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold' as const,
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
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
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                letterSpacing: '0.05em',
              }}
            >
              ViewConfirm
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#93c5fd',
                letterSpacing: '0.1em',
              }}
            >
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
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '48px',
            width: '380px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1e3a5f',
              marginBottom: '6px',
              textAlign: 'center',
            }}
          >
            {isPasswordRecovery ? 'パスワード再設定' : 'ログイン'}
          </h2>

          <p
            style={{
              color: '#94a3b8',
              fontSize: '13px',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            MIRAIグループ 人材教育プラットフォーム
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isPasswordRecovery ? (
              <>
                <div>
                  <label
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    新しいパスワード
                  </label>
                  <div style={passwordInputWrapperStyle}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="8文字以上で入力"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={passwordInputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={showButtonStyle}
                    >
                      {showNewPassword ? '非表示' : '表示'}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    新しいパスワード確認
                  </label>
                  <div style={passwordInputWrapperStyle}>
                    <input
                      type={showNewPasswordConfirm ? 'text' : 'password'}
                      placeholder="もう一度入力"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      style={passwordInputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                      style={showButtonStyle}
                    >
                      {showNewPasswordConfirm ? '非表示' : '表示'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                    {error}
                  </p>
                )}

                {message && (
                  <p style={{ color: '#16a34a', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                    {message}
                  </p>
                )}

                <button
                  onClick={handleUpdatePassword}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#1e3a5f',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    marginTop: '8px',
                  }}
                >
                  パスワードを更新する
                </button>

                <button
                  onClick={() => {
                    setIsPasswordRecovery(false)
                    setError('')
                    setMessage('')
                    setShowNewPassword(false)
                    setShowNewPasswordConfirm(false)
                    window.history.replaceState({}, document.title, '/login')
                  }}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    color: '#1e3a5f',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  ログイン画面に戻る
                </button>
              </>
            ) : (
              <>
                <div>
                  <label
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    placeholder="example@mirai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={normalInputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    パスワード
                  </label>
                  <div style={passwordInputWrapperStyle}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={passwordInputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={showButtonStyle}
                    >
                      {showPassword ? '非表示' : '表示'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                    {error}
                  </p>
                )}

                {message && (
                  <p style={{ color: '#16a34a', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                    {message}
                  </p>
                )}

                <button
                  onClick={handleLogin}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#1e3a5f',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    marginTop: '8px',
                  }}
                >
                  ログイン
                </button>

                <button
                  onClick={handleResetPassword}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    color: '#1e3a5f',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  パスワードをお忘れの場合
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <footer style={{ padding: '20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
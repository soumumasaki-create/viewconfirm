'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Admin = {
  id: number
  email: string
  name: string
  company: string
  created_at: string
  can_view_all_companies: boolean
  can_view_own_company: boolean
  can_download_csv: boolean
  can_manage_admin_permissions: boolean
  can_reset_password: boolean
  can_unlock_account: boolean
  can_receive_security_mail: boolean
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setCurrentEmail(user.email || '')
      fetchAdmins()
    }
    init()
  }, [])

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .order('id')

    if (data) setAdmins(data)
  }

  const handleAdd = async () => {
    if (!email || !name || !company) {
      setMessage('❌ 氏名・所属会社・メールアドレスをすべて入力してください')
      return
    }

    setLoading(true)
    setMessage('')

    const res = await fetch('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: '1234', name, company }),
    })

    const result = await res.json()

    if (!res.ok) {
      setMessage('❌ エラー: ' + result.error)
    } else {
      setMessage('✅ ' + name + ' さんを管理者に追加しました')
      setEmail('')
      setName('')
      setCompany('')
      await fetchAdmins()
    }

    setLoading(false)
  }

  const handleDelete = async (id: number, targetEmail: string) => {
    if (targetEmail === currentEmail) {
      alert('自分自身は削除できません')
      return
    }

    if (!confirm(targetEmail + ' を管理者から削除しますか？')) return

    await supabase.from('admins').delete().eq('id', id)
    await fetchAdmins()
  }

  const pillStyle = (enabled: boolean) => ({
    display: 'inline-block',
    minWidth: '52px',
    textAlign: 'center' as const,
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    color: enabled ? '#166534' : '#475569',
    backgroundColor: enabled ? '#dcfce7' : '#e2e8f0',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <header
        style={{
          backgroundColor: '#1e3a5f',
          padding: '0 40px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
        <a href="/" style={{ color: '#93c5fd', fontSize: '13px', textDecoration: 'none' }}>
          ← トップに戻る
        </a>
      </header>

      <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '32px' }}>
          👤 管理者ユーザー管理
        </h1>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '20px' }}>
            管理者を追加する
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            ※ 初回パスワードは「1234」が自動設定されます
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>
              氏名
            </label>
            <input
              placeholder="例：山田 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>
              所属会社
            </label>
            <input
              placeholder="例：株式会社MIRAI"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>
              メールアドレス
            </label>
            <input
              placeholder="example@mirai.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {message && (
            <p
              style={{
                color: message.startsWith('✅') ? '#16a34a' : '#ef4444',
                fontSize: '14px',
                marginBottom: '12px',
              }}
            >
              {message}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={loading}
            style={{
              padding: '10px 28px',
              backgroundColor: '#1e3a5f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
            }}
          >
            {loading ? '追加中...' : '管理者に追加する'}
          </button>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '16px' }}>
          管理者一覧
        </h2>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflowX: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1380px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>氏名</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>所属会社</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>メールアドレス</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>全社閲覧</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>自社閲覧</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>CSV</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>権限変更</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>再発行</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>ロック解除</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>通知メール</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    管理者がいません
                  </td>
                </tr>
              )}

              {admins.map((admin, i) => (
                <tr
                  key={admin.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <td style={{ padding: '14px 16px', color: '#1e3a5f', fontSize: '14px', fontWeight: '500' }}>
                    {admin.name || '-'}
                    {admin.email === currentEmail && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          borderRadius: '20px',
                        }}
                      >
                        自分
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '14px' }}>
                    {admin.company || '-'}
                  </td>

                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '14px' }}>
                    {admin.email}
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={pillStyle(admin.can_view_all_companies)}>
                      {admin.can_view_all_companies ? 'ON' : 'OFF'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={pillStyle(admin.can_view_own_company)}>
                      {admin.can_view_own_company ? 'ON' : 'OFF'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={pillStyle(admin.can_download_csv)}>
                      {admin.can_download_csv ? 'ON' : 'OFF'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={pillStyle(admin.can_manage_admin_permissions)}>
                      {admin.can_manage_admin_permissions ? 'ON' : 'OFF'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={pillStyle(admin.can_reset_password)}>
                      {admin.can_reset_password ? 'ON' : 'OFF'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={pillStyle(admin.can_unlock_account)}>
                      {admin.can_unlock_account ? 'ON' : 'OFF'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={pillStyle(admin.can_receive_security_mail)}>
                      {admin.can_receive_security_mail ? 'ON' : 'OFF'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <a
                        href={`/admin-users/${admin.id}/permissions`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                      >
                        権限変更
                      </a>

                      {admin.email !== currentEmail ? (
                        <button
                          onClick={() => handleDelete(admin.id, admin.email)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          削除
                        </button>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#94a3b8', padding: '6px 0' }}>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 40px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
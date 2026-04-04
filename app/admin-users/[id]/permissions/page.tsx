'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Admin = {
  id: number
  email: string
  name: string
  company: string
  can_view_all_companies: boolean
  can_view_own_company: boolean
  can_download_csv: boolean
  can_manage_admin_permissions: boolean
  can_reset_password: boolean
  can_unlock_account: boolean
  can_receive_security_mail: boolean
}

export default function AdminPermissionPage() {
  const params = useParams()
  const adminId = Array.isArray(params.id) ? params.id[0] : params.id

  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchAdmin = async () => {
      if (!adminId) {
        setMessage('管理者IDを取得できませんでした')
        setAdmin(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setMessage('')

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', Number(adminId))
        .single()

      if (error || !data) {
        setMessage('管理者情報を取得できませんでした')
        setAdmin(null)
      } else {
        setAdmin(data)
      }

      setLoading(false)
    }

    fetchAdmin()
  }, [adminId])

  const handlePermissionChange =
    (
      key: keyof Pick<
        Admin,
        | 'can_view_all_companies'
        | 'can_view_own_company'
        | 'can_download_csv'
        | 'can_manage_admin_permissions'
        | 'can_reset_password'
        | 'can_unlock_account'
        | 'can_receive_security_mail'
      >
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!admin) return

      setAdmin({
        ...admin,
        [key]: e.target.checked,
      })
    }

  const handleSave = async () => {
    if (!admin) return

    setSaving(true)
    setMessage('')

    const { data, error } = await supabase
      .from('admins')
      .update({
        can_view_all_companies: admin.can_view_all_companies,
        can_view_own_company: admin.can_view_own_company,
        can_download_csv: admin.can_download_csv,
        can_manage_admin_permissions: admin.can_manage_admin_permissions,
        can_reset_password: admin.can_reset_password,
        can_unlock_account: admin.can_unlock_account,
        can_receive_security_mail: admin.can_receive_security_mail,
      })
      .eq('id', admin.id)
      .select('id')

    if (error) {
      setMessage('❌ 保存に失敗しました')
    } else if (!data || data.length === 0) {
      setMessage('❌ 保存できませんでした（更新対象が見つかりません）')
    } else {
      setMessage('✅ 権限を保存しました')
    }

    setSaving(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'sans-serif',
        padding: '40px',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <a
          href="/admin-users"
          style={{
            display: 'inline-block',
            marginBottom: '24px',
            color: '#2563eb',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          ← 管理者一覧へ戻る
        </a>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1e3a5f',
              marginBottom: '20px',
            }}
          >
            管理者権限編集
          </h1>

          {loading ? (
            <p style={{ fontSize: '14px', color: '#64748b' }}>読み込み中です...</p>
          ) : admin ? (
            <>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>管理者ID</div>
                  <div style={{ fontSize: '16px', color: '#1e3a5f', fontWeight: 'bold' }}>{admin.id}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>氏名</div>
                  <div style={{ fontSize: '16px', color: '#1e3a5f', fontWeight: 'bold' }}>
                    {admin.name || '-'}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>所属会社</div>
                  <div style={{ fontSize: '16px', color: '#1e3a5f', fontWeight: 'bold' }}>
                    {admin.company || '-'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>メールアドレス</div>
                  <div style={{ fontSize: '16px', color: '#1e3a5f', fontWeight: 'bold' }}>{admin.email}</div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1e3a5f',
                    marginBottom: '20px',
                  }}
                >
                  権限設定
                </h2>

                <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={admin.can_view_all_companies}
                      onChange={handlePermissionChange('can_view_all_companies')}
                    />
                    全社閲覧
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={admin.can_view_own_company}
                      onChange={handlePermissionChange('can_view_own_company')}
                    />
                    自社閲覧
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={admin.can_download_csv}
                      onChange={handlePermissionChange('can_download_csv')}
                    />
                    CSVダウンロード
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={admin.can_manage_admin_permissions}
                      onChange={handlePermissionChange('can_manage_admin_permissions')}
                    />
                    管理者権限変更
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={admin.can_reset_password}
                      onChange={handlePermissionChange('can_reset_password')}
                    />
                    パスワード再発行
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={admin.can_unlock_account}
                      onChange={handlePermissionChange('can_unlock_account')}
                    />
                    アカウントロック解除
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={admin.can_receive_security_mail}
                      onChange={handlePermissionChange('can_receive_security_mail')}
                    />
                    セキュリティ通知メール受信
                  </label>
                </div>

                {message && (
                  <p
                    style={{
                      color: message.startsWith('✅') ? '#16a34a' : '#ef4444',
                      fontSize: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    {message}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#1e3a5f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {saving ? '保存中...' : '保存する'}
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '14px', color: '#ef4444' }}>{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
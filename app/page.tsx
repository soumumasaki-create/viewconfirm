'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email || '')
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '32px', color: '#1d4ed8' }}>ViewConfirm</h1>
      <p style={{ color: '#64748b', marginTop: '16px' }}>MIRAIグループ 人材教育プラットフォーム</p>
      <p style={{ marginTop: '24px' }}>ログイン中: {email}</p>
      <button
        onClick={handleLogout}
        style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '16px' }}
      >
        ログアウト
      </button>
    </div>
  )
}
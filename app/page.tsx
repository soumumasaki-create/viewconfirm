'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        const { data } = await supabase.from('admins').select('*').eq('email', user.email).single()
        if (data) setIsAdmin(true)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#0f172a', color:'#fff' }}>
      <div style={{ backgroundColor:'#1e293b', padding:'16px 40px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ fontSize:'20px', color:'#60a5fa' }}>📺 ViewConfirm</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <span style={{ color:'#94a3b8', fontSize:'14px' }}>{email}</span>
          {isAdmin && <span style={{ fontSize:'12px', padding:'4px 8px', backgroundColor:'#1d4ed8', borderRadius:'4px', color:'#fff' }}>管理者</span>}
          <button onClick={handleLogout} style={{ padding:'8px 16px', backgroundColor:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px' }}>ログアウト</button>
        </div>
      </div>
      <div style={{ padding:'40px', maxWidth:'900px', margin:'0 auto' }}>
        <h2 style={{ fontSize:'24px', marginBottom:'8px' }}>MIRAIグループ 人材教育プラットフォーム</h2>
        <p style={{ color:'#94a3b8', marginBottom:'40px' }}>ようこそ！{email} さん</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px' }}>
          <a href="/watch" style={{ textDecoration:'none' }}>
            <div style={{ backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'16px', padding:'32px', cursor:'pointer' }}>
              <div style={{ fontSize:'40px', marginBottom:'16px' }}>📺</div>
              <h3 style={{ fontSize:'18px', marginBottom:'8px', color:'#fff' }}>動画を視聴する</h3>
              <p style={{ color:'#94a3b8', fontSize:'14px' }}>教育動画を見て視聴完了を記録する</p>
            </div>
          </a>
          {isAdmin && (
            <>
              <a href="/channels" style={{ textDecoration:'none' }}>
                <div style={{ backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'16px', padding:'32px', cursor:'pointer' }}>
                  <div style={{ fontSize:'40px', marginBottom:'16px' }}>📁</div>
                  <h3 style={{ fontSize:'18px', marginBottom:'8px', color:'#fff' }}>チャンネル管理</h3>
                  <p style={{ color:'#94a3b8', fontSize:'14px' }}>チャンネルの作成・編集</p>
                </div>
              </a>
              <a href="/episodes" style={{ textDecoration:'none' }}>
                <div style={{ backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'16px', padding:'32px', cursor:'pointer' }}>
                  <div style={{ fontSize:'40px', marginBottom:'16px' }}>🎬</div>
                  <h3 style={{ fontSize:'18px', marginBottom:'8px', color:'#fff' }}>動画管理</h3>
                  <p style={{ color:'#94a3b8', fontSize:'14px' }}>動画の追加・編集</p>
                </div>
              </a>
              <a href="/admin" style={{ textDecoration:'none' }}>
                <div style={{ backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'16px', padding:'32px', cursor:'pointer' }}>
                  <div style={{ fontSize:'40px', marginBottom:'16px' }}>📊</div>
                  <h3 style={{ fontSize:'18px', marginBottom:'8px', color:'#fff' }}>管理者ダッシュボード</h3>
                  <p style={{ color:'#94a3b8', fontSize:'14px' }}>視聴記録の確認・CSV出力</p>
                </div>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
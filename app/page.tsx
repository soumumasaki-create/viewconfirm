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
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', color:'#0f172a', fontFamily:'sans-serif' }}>
      <header style={{ backgroundColor:'#1e3a5f', borderBottom:'1px solid #1e3a5f', padding:'0 40px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', backgroundColor:'#2563eb', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📺</div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:'bold', color:'#fff', letterSpacing:'0.05em' }}>ViewConfirm</div>
            <div style={{ fontSize:'10px', color:'#93c5fd', letterSpacing:'0.1em' }}>MIRAI GROUP</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          {isAdmin && <span style={{ fontSize:'11px', padding:'3px 10px', backgroundColor:'#2563eb', borderRadius:'20px', color:'#fff', letterSpacing:'0.05em' }}>ADMIN</span>}
          <span style={{ color:'#bfdbfe', fontSize:'13px' }}>{email}</span>
          <button onClick={handleLogout} style={{ padding:'7px 16px', backgroundColor:'transparent', color:'#fff', border:'1px solid #93c5fd', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>ログアウト</button>
        </div>
      </header>

      <main style={{ padding:'48px 40px', maxWidth:'1000px', margin:'0 auto' }}>
        <div style={{ marginBottom:'40px', paddingBottom:'32px', borderBottom:'1px solid #e2e8f0' }}>
          <h2 style={{ fontSize:'22px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'6px' }}>人材教育プラットフォーム</h2>
          <p style={{ color:'#64748b', fontSize:'14px' }}>ようこそ、{email} さん</p>
        </div>

        <div style={{ marginBottom:'40px' }}>
          <h3 style={{ fontSize:'12px', color:'#94a3b8', letterSpacing:'0.1em', marginBottom:'16px' }}>動画視聴</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px' }}>
            <a href="/watch" style={{ textDecoration:'none' }}>
              <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ width:'52px', height:'52px', backgroundColor:'#2563eb', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0 }}>📺</div>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'4px' }}>動画を視聴する</div>
                  <div style={{ fontSize:'13px', color:'#64748b' }}>教育動画の視聴・完了記録</div>
                </div>
              </div>
            </a>
          </div>
        </div>

        {isAdmin && (
          <div>
            <h3 style={{ fontSize:'12px', color:'#94a3b8', letterSpacing:'0.1em', marginBottom:'16px' }}>管理者メニュー</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px' }}>
              <a href="/channels" style={{ textDecoration:'none' }}>
                <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width:'52px', height:'52px', backgroundColor:'#1e3a5f', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0 }}>📁</div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'4px' }}>チャンネル管理</div>
                    <div style={{ fontSize:'13px', color:'#64748b' }}>チャンネルの作成・編集</div>
                  </div>
                </div>
              </a>
              <a href="/episodes" style={{ textDecoration:'none' }}>
                <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width:'52px', height:'52px', backgroundColor:'#1e3a5f', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0 }}>🎬</div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'4px' }}>動画管理</div>
                    <div style={{ fontSize:'13px', color:'#64748b' }}>動画の追加・編集</div>
                  </div>
                </div>
              </a>
              <a href="/admin" style={{ textDecoration:'none' }}>
                <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width:'52px', height:'52px', backgroundColor:'#1e3a5f', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0 }}>📊</div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'4px' }}>管理者ダッシュボード</div>
                    <div style={{ fontSize:'13px', color:'#64748b' }}>視聴記録の確認・CSV出力</div>
                  </div>
                </div>
              </a>
              <a href="/admin-users" style={{ textDecoration:'none' }}>
                <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width:'52px', height:'52px', backgroundColor:'#1e3a5f', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0 }}>👤</div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'4px' }}>管理者ユーザー管理</div>
                    <div style={{ fontSize:'13px', color:'#64748b' }}>管理者の追加・削除</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop:'1px solid #e2e8f0', padding:'20px 40px', textAlign:'center' }}>
        <p style={{ color:'#94a3b8', fontSize:'12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
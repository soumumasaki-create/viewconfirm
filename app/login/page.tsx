'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが違います')
    } else if (data.session) {
      window.location.replace('/')
    } else {
      setError('セッションが取得できませんでした')
    }
  }
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', display:'flex', flexDirection:'column' }}>
      {/* ヘッダー */}
      <header style={{ backgroundColor:'#1e3a5f', padding:'0 40px', height:'64px', display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', backgroundColor:'#2563eb', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📺</div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:'bold', color:'#fff', letterSpacing:'0.05em' }}>ViewConfirm</div>
            <div style={{ fontSize:'10px', color:'#93c5fd', letterSpacing:'0.1em' }}>MIRAI GROUP</div>
          </div>
        </div>
      </header>
      {/* ログインフォーム */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'16px', padding:'48px', width:'380px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize:'20px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'6px', textAlign:'center' }}>ログイン</h2>
          <p style={{ color:'#94a3b8', fontSize:'13px', textAlign:'center', marginBottom:'32px' }}>MIRAIグループ 人材教育プラットフォーム</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>メールアドレス</label>
              <input type="email" placeholder="example@mirai.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width:'100%', padding:'11px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>パスワード</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width:'100%', padding:'11px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }} />
            </div>
            {error && <p style={{ color:'#ef4444', fontSize:'13px', textAlign:'center' }}>{error}</p>}
            <button onClick={handleLogin} style={{ width:'100%', padding:'12px', borderRadius:'8px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:'bold', marginTop:'8px' }}>ログイン</button>
          </div>
        </div>
      </div>
      {/* フッター */}
      <footer style={{ padding:'20px 40px', textAlign:'center' }}>
        <p style={{ color:'#94a3b8', fontSize:'12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
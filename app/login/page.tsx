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
      setError('メールアドレスまたはパスワードが違います: ' + error.message)
    } else if (data.session) {
      window.location.replace('/')
    } else {
      setError('セッションが取得できませんでした')
    }
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', backgroundColor:'#0a0a0a' }}>
      <h1 style={{ color:'#fff', marginBottom:'8px' }}>ViewConfirm</h1>
      <p style={{ color:'#888', marginBottom:'32px' }}>MIRAIグループ 人材教育プラットフォーム</p>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px', width:'320px' }}>
        <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding:'12px', borderRadius:'8px', border:'1px solid #333', backgroundColor:'#1a1a1a', color:'#fff' }} />
        <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding:'12px', borderRadius:'8px', border:'1px solid #333', backgroundColor:'#1a1a1a', color:'#fff' }} />
        {error && <p style={{ color:'#ff4444' }}>{error}</p>}
        <button onClick={handleLogin} style={{ padding:'12px', borderRadius:'8px', backgroundColor:'#2563eb', color:'#fff', border:'none', cursor:'pointer', fontSize:'16px' }}>ログイン</button>
      </div>
    </div>
  )
}
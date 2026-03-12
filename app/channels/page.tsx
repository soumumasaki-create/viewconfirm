'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
type Channel = { id: number; title: string; description: string; published: boolean }
export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const fetchChannels = async () => {
    const { data } = await supabase.from('channels').select('*').order('id')
    if (data) setChannels(data)
  }
  useEffect(() => { fetchChannels() }, [])
  const handleCreate = async () => {
    if (!title) return
    setLoading(true)
    await supabase.from('channels').insert({ title, description, published: false })
    setTitle('')
    setDescription('')
    await fetchChannels()
    setLoading(false)
  }
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:'sans-serif' }}>
      {/* ヘッダー */}
      <header style={{ backgroundColor:'#1e3a5f', padding:'0 40px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', backgroundColor:'#2563eb', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📺</div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:'bold', color:'#fff' }}>ViewConfirm</div>
            <div style={{ fontSize:'10px', color:'#93c5fd', letterSpacing:'0.1em' }}>MIRAI GROUP</div>
          </div>
        </div>
        <a href="/" style={{ color:'#93c5fd', fontSize:'13px', textDecoration:'none' }}>← トップに戻る</a>
      </header>
      <main style={{ padding:'40px', maxWidth:'900px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'32px' }}>📁 チャンネル管理</h1>
        {/* 追加フォーム */}
        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'32px', marginBottom:'32px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'20px' }}>新しいチャンネルを作成</h2>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>チャンネル名</label>
            <input placeholder="例: 運転マニュアル" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>説明（任意）</label>
            <input placeholder="チャンネルの説明を入力" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }} />
          </div>
          <button onClick={handleCreate} disabled={loading} style={{ padding:'10px 28px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px', fontWeight:'bold' }}>{loading ? '作成中...' : '作成する'}</button>
        </div>
        {/* チャンネル一覧 */}
        <h2 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'16px' }}>チャンネル一覧</h2>
        {channels.length === 0 && <p style={{ color:'#94a3b8' }}>チャンネルがまだありません</p>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px' }}>
          {channels.map((ch) => (
            <div key={ch.id} style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <div style={{ width:'40px', height:'40px', backgroundColor:'#1e3a5f', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>📁</div>
                <h3 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f' }}>{ch.title}</h3>
              </div>
              {ch.description && <p style={{ color:'#64748b', fontSize:'13px', marginBottom:'12px' }}>{ch.description}</p>}
              <span style={{ fontSize:'12px', padding:'3px 10px', borderRadius:'20px', backgroundColor: ch.published ? '#dcfce7' : '#fef9c3', color: ch.published ? '#16a34a' : '#ca8a04', fontWeight:'bold' }}>
                {ch.published ? '公開中' : '非公開'}
              </span>
            </div>
          ))}
        </div>
      </main>
      <footer style={{ borderTop:'1px solid #e2e8f0', padding:'20px 40px', textAlign:'center', marginTop:'40px' }}>
        <p style={{ color:'#94a3b8', fontSize:'12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
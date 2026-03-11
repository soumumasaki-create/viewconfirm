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
    <div style={{ padding:'40px', maxWidth:'800px', margin:'0 auto' }}>
      <h1 style={{ fontSize:'24px', marginBottom:'24px' }}>チャンネル管理</h1>
      <div style={{ backgroundColor:'#f1f5f9', padding:'24px', borderRadius:'12px', marginBottom:'32px' }}>
        <h2 style={{ fontSize:'18px', marginBottom:'16px' }}>新しいチャンネルを作成</h2>
        <input placeholder="チャンネル名" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', boxSizing:'border-box', color:'#000', backgroundColor:'#fff' }} />
        <input placeholder="説明（任意）" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', boxSizing:'border-box', color:'#000', backgroundColor:'#fff' }} />
        <button onClick={handleCreate} disabled={loading} style={{ padding:'10px 24px', backgroundColor:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px' }}>{loading ? '作成中...' : '作成する'}</button>
      </div>
      <h2 style={{ fontSize:'18px', marginBottom:'16px' }}>チャンネル一覧</h2>
      {channels.length === 0 && <p style={{ color:'#94a3b8' }}>チャンネルがまだありません</p>}
      {channels.map((ch) => (
        <div key={ch.id} style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'20px', marginBottom:'12px' }}>
          <h3 style={{ fontSize:'18px', marginBottom:'4px', color:'#000' }}>{ch.title}</h3>
          <p style={{ color:'#64748b', marginBottom:'8px' }}>{ch.description}</p>
          <span style={{ fontSize:'12px', padding:'4px 8px', borderRadius:'4px', backgroundColor:ch.published ? '#dcfce7' : '#fef9c3', color:ch.published ? '#16a34a' : '#ca8a04' }}>{ch.published ? '公開中' : '非公開'}</span>
        </div>
      ))}
      <div style={{ marginTop:'32px' }}><a href="/" style={{ color:'#2563eb' }}>← トップに戻る</a></div>
    </div>
  )
}
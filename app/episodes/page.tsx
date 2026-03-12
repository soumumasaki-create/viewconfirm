'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
type Channel = { id: number; title: string }
type Episode = { id: number; title: string; video_url: string; channel_id: number; order_no: number }
export default function EpisodesPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [channelId, setChannelId] = useState('')
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [orderNo, setOrderNo] = useState('')
  const [loading, setLoading] = useState(false)
  const fetchAll = async () => {
    const { data: ch } = await supabase.from('channels').select('*').order('id')
    if (ch) setChannels(ch)
    const { data: ep } = await supabase.from('episodes').select('*').order('order_no')
    if (ep) setEpisodes(ep)
  }
  useEffect(() => { fetchAll() }, [])
  const handleCreate = async () => {
    if (!title || !channelId || !orderNo) return
    setLoading(true)
    await supabase.from('episodes').insert({ title, video_url: videoUrl, channel_id: Number(channelId), order_no: Number(orderNo) })
    setTitle('')
    setVideoUrl('')
    setOrderNo('')
    await fetchAll()
    setLoading(false)
  }
  return (
    <div style={{ padding:'40px', maxWidth:'800px', margin:'0 auto' }}>
      <h1 style={{ fontSize:'24px', marginBottom:'24px' }}>動画（エピソード）管理</h1>
      <div style={{ backgroundColor:'#f1f5f9', padding:'24px', borderRadius:'12px', marginBottom:'32px' }}>
        <h2 style={{ fontSize:'18px', marginBottom:'16px' }}>新しい動画を追加</h2>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', color:'#000', backgroundColor:'#fff' }}>
          <option value="">チャンネルを選択</option>
          {channels.map((ch) => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
        </select>
        <input placeholder="動画タイトル" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', color:'#000', backgroundColor:'#fff', boxSizing:'border-box' }} />
        <input placeholder="動画URL（YouTubeなど）" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', color:'#000', backgroundColor:'#fff', boxSizing:'border-box' }} />
        <input placeholder="順番（例: 1, 2, 3）" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', color:'#000', backgroundColor:'#fff', boxSizing:'border-box' }} />
        <button onClick={handleCreate} disabled={loading} style={{ padding:'10px 24px', backgroundColor:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px' }}>{loading ? '追加中...' : '追加する'}</button>
      </div>
      <h2 style={{ fontSize:'18px', marginBottom:'16px' }}>動画一覧</h2>
      {episodes.length === 0 && <p style={{ color:'#94a3b8' }}>動画がまだありません</p>}
      {channels.map((ch) => (
        <div key={ch.id} style={{ marginBottom:'24px' }}>
          <h3 style={{ fontSize:'16px', fontWeight:'bold', color:'#1d4ed8', marginBottom:'8px' }}>📺 {ch.title}</h3>
          {episodes.filter((ep) => ep.channel_id === ch.id).map((ep) => (
            <div key={ep.id} style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'16px', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', color:'#94a3b8', marginRight:'8px' }}>#{ep.order_no}</span>
              <span style={{ fontSize:'16px', color:'#000' }}>{ep.title}</span>
              {ep.video_url && <p style={{ fontSize:'12px', color:'#64748b', marginTop:'4px' }}>{ep.video_url}</p>}
            </div>
          ))}
          {episodes.filter((ep) => ep.channel_id === ch.id).length === 0 && <p style={{ color:'#94a3b8', fontSize:'14px' }}>このチャンネルに動画がありません</p>}
        </div>
      ))}
      <div style={{ marginTop:'32px' }}>
        <a href="/channels" style={{ color:'#2563eb', marginRight:'16px' }}>← チャンネル管理</a>
        <a href="/" style={{ color:'#2563eb' }}>← トップに戻る</a>
      </div>
    </div>
  )
}
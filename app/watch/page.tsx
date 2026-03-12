'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
type Channel = { id: number; title: string }
type Episode = { id: number; title: string; video_url: string; channel_id: number; order_no: number }
export default function WatchPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [userName, setUserName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<{id:number, name:string}[]>([])
  const [watched, setWatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [watchLogs, setWatchLogs] = useState<{episode_id:number}[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const { data: ch } = await supabase.from('channels').select('*').order('id')
      if (ch) setChannels(ch)
      const { data: ep } = await supabase.from('episodes').select('*').order('order_no')
      if (ep) setEpisodes(ep)
      const { data: co } = await supabase.from('companies').select('*').order('id')
      if (co) setCompanies(co)
    }
    fetchData()
  }, [])
  const handleSelectEpisode = (ep: Episode) => {
    setSelectedEpisode(ep)
    setWatched(false)
  }
  const handleComplete = async () => {
    if (!userName || !companyId || !selectedEpisode) return
    setLoading(true)
    await supabase.from('watch_logs').insert({
      user_name: userName,
      company_id: Number(companyId),
      episode_id: selectedEpisode.id,
      watched_at: new Date().toISOString()
    })
    setWatched(true)
    setWatchLogs([...watchLogs, { episode_id: selectedEpisode.id }])
    setLoading(false)
  }
  const channelEpisodes = selectedChannel ? episodes.filter(ep => ep.channel_id === selectedChannel) : []
  return (
    <div style={{ padding:'24px', maxWidth:'900px', margin:'0 auto' }}>
      <h1 style={{ fontSize:'24px', marginBottom:'24px', color:'#1d4ed8' }}>📺 動画視聴</h1>
      <div style={{ display:'flex', gap:'24px' }}>
        <div style={{ width:'240px', flexShrink:0 }}>
          <h2 style={{ fontSize:'16px', marginBottom:'12px', color:'#000' }}>チャンネル</h2>
          {channels.map(ch => (
            <div key={ch.id} onClick={() => { setSelectedChannel(ch.id); setSelectedEpisode(null) }}
              style={{ padding:'10px', borderRadius:'8px', marginBottom:'8px', cursor:'pointer', backgroundColor: selectedChannel === ch.id ? '#2563eb' : '#f1f5f9', color: selectedChannel === ch.id ? '#fff' : '#000' }}>
              {ch.title}
            </div>
          ))}
        </div>
        <div style={{ flex:1 }}>
          {!selectedChannel && <p style={{ color:'#94a3b8' }}>左のチャンネルを選んでください</p>}
          {selectedChannel && !selectedEpisode && (
            <div>
              <h2 style={{ fontSize:'16px', marginBottom:'12px', color:'#000' }}>動画一覧</h2>
              {channelEpisodes.length === 0 && <p style={{ color:'#94a3b8' }}>動画がありません</p>}
              {channelEpisodes.map((ep, index) => {
                const isLocked = index > 0 && !watchLogs.find(w => w.episode_id === channelEpisodes[index-1].id)
                return (
                  <div key={ep.id} onClick={() => !isLocked && handleSelectEpisode(ep)}
                    style={{ padding:'12px', borderRadius:'8px', marginBottom:'8px', cursor: isLocked ? 'not-allowed' : 'pointer', backgroundColor: isLocked ? '#f8fafc' : '#fff', border:'1px solid #e2e8f0', opacity: isLocked ? 0.5 : 1 }}>
                    <span style={{ color:'#94a3b8', marginRight:'8px' }}>#{ep.order_no}</span>
                    <span style={{ color:'#000' }}>{ep.title}</span>
                    {isLocked && <span style={{ marginLeft:'8px', fontSize:'12px', color:'#94a3b8' }}>🔒</span>}
                    {watchLogs.find(w => w.episode_id === ep.id) && <span style={{ marginLeft:'8px', fontSize:'12px', color:'#16a34a' }}>✅</span>}
                  </div>
                )
              })}
            </div>
          )}
          {selectedEpisode && (
            <div>
              <button onClick={() => setSelectedEpisode(null)} style={{ marginBottom:'16px', color:'#2563eb', background:'none', border:'none', cursor:'pointer' }}>← 動画一覧に戻る</button>
              <h2 style={{ fontSize:'18px', marginBottom:'16px', color:'#000' }}>{selectedEpisode.title}</h2>
              {selectedEpisode.video_url && (
                <iframe width="100%" height="360" src={selectedEpisode.video_url.replace('watch?v=', 'embed/')} frameBorder="0" allowFullScreen style={{ borderRadius:'8px', marginBottom:'16px' }} />
              )}
              {!watched ? (
                <div style={{ backgroundColor:'#f1f5f9', padding:'20px', borderRadius:'12px' }}>
                  <h3 style={{ fontSize:'16px', marginBottom:'12px', color:'#000' }}>視聴完了を記録する</h3>
                  <input placeholder="お名前" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', color:'#000', backgroundColor:'#fff', boxSizing:'border-box' }} />
                  <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'12px', fontSize:'16px', color:'#000', backgroundColor:'#fff' }}>
                    <option value="">会社を選択</option>
                    {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                  <button onClick={handleComplete} disabled={loading} style={{ width:'100%', padding:'12px', backgroundColor:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px' }}>{loading ? '記録中...' : '✅ 視聴完了'}</button>
                </div>
              ) : (
                <div style={{ backgroundColor:'#dcfce7', padding:'20px', borderRadius:'12px', textAlign:'center' }}>
                  <p style={{ fontSize:'18px', color:'#16a34a' }}>✅ 視聴完了を記録しました！</p>
                  <button onClick={() => setSelectedEpisode(null)} style={{ marginTop:'12px', padding:'10px 24px', backgroundColor:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>次の動画へ</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop:'32px' }}>
        <a href="/" style={{ color:'#2563eb' }}>← トップに戻る</a>
      </div>
    </div>
  )
}
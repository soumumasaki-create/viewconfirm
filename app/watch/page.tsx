'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Channel = { id: number; title: string; thumbnail_url: string }
type Episode = { id: number; title: string; video_url: string; channel_id: number; order_no: number }

export default function WatchPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [userNames, setUserNames] = useState(['', '', '', '', ''])
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
    if (!userNames[0] || !companyId || !selectedEpisode) return
    setLoading(true)
    const filledNames = userNames.filter(name => name.trim() !== '')
    for (const name of filledNames) {
      await supabase.from('watch_logs').insert({
        user_name: name,
        company_id: Number(companyId),
        episode_id: selectedEpisode.id,
        watched_at: new Date().toISOString()
      })
    }
    setWatched(true)
    setWatchLogs([...watchLogs, { episode_id: selectedEpisode.id }])
    setLoading(false)
  }

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...userNames]
    newNames[index] = value
    setUserNames(newNames)
  }

  const channelEpisodes = selectedChannel ? episodes.filter(ep => ep.channel_id === selectedChannel) : []

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:'sans-serif' }}>
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

      <main style={{ display:'flex', height:'calc(100vh - 64px)' }}>
        {/* サイドバー */}
        <div style={{ width:'240px', backgroundColor:'#fff', borderRight:'1px solid #e2e8f0', padding:'16px', overflowY:'auto' }}>
          <h2 style={{ fontSize:'12px', color:'#94a3b8', letterSpacing:'0.1em', marginBottom:'12px' }}>チャンネル</h2>
          {channels.map(ch => (
            <div key={ch.id} onClick={() => { setSelectedChannel(ch.id); setSelectedEpisode(null) }}
              style={{ borderRadius:'8px', marginBottom:'8px', cursor:'pointer', overflow:'hidden', border: selectedChannel === ch.id ? '2px solid #2563eb' : '1px solid #e2e8f0' }}>
              {ch.thumbnail_url ? (
                <img src={ch.thumbnail_url} alt={ch.title} style={{ width:'100%', objectFit:'contain', backgroundColor:'#f1f5f9', display:'block' }} />
              ) : (
                <div style={{ width:'100%', height:'80px', backgroundColor:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>📁</div>
              )}
              <div style={{ padding:'8px 10px', backgroundColor: selectedChannel === ch.id ? '#1e3a5f' : '#fff', color: selectedChannel === ch.id ? '#fff' : '#1e3a5f', fontWeight: selectedChannel === ch.id ? 'bold' : 'normal', fontSize:'13px' }}>
                {ch.title}
              </div>
            </div>
          ))}
        </div>

        {/* メインエリア */}
        <div style={{ flex:1, padding:'32px', overflowY:'auto' }}>
          {!selectedChannel && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
              <p style={{ color:'#94a3b8', fontSize:'16px' }}>← 左のチャンネルを選んでください</p>
            </div>
          )}

          {selectedChannel && !selectedEpisode && (
            <div>
              <h2 style={{ fontSize:'18px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'20px' }}>動画一覧</h2>
              {channelEpisodes.length === 0 && <p style={{ color:'#94a3b8' }}>動画がありません</p>}
              {channelEpisodes.map((ep, index) => {
                const isLocked = index > 0 && !watchLogs.find(w => w.episode_id === channelEpisodes[index-1].id)
                const isWatched = watchLogs.find(w => w.episode_id === ep.id)
                return (
                  <div key={ep.id} onClick={() => !isLocked && handleSelectEpisode(ep)}
                    style={{ backgroundColor:'#fff', border:`1px solid ${isWatched ? '#86efac' : '#e2e8f0'}`, borderRadius:'10px', padding:'16px 20px', marginBottom:'10px', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1, display:'flex', alignItems:'center', gap:'16px', boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
                    <span style={{ fontSize:'12px', color:'#fff', backgroundColor: isWatched ? '#16a34a' : '#2563eb', padding:'2px 8px', borderRadius:'4px', fontWeight:'bold' }}>#{ep.order_no}</span>
                    <span style={{ fontSize:'15px', color:'#1e3a5f', fontWeight:'500', flex:1 }}>{ep.title}</span>
                    {isLocked && <span style={{ fontSize:'12px', color:'#94a3b8' }}>🔒 前の動画を完了してください</span>}
                    {isWatched && <span style={{ fontSize:'13px', color:'#16a34a', fontWeight:'bold' }}>✅ 完了</span>}
                  </div>
                )
              })}
            </div>
          )}

          {selectedEpisode && (
            <div>
              <button onClick={() => setSelectedEpisode(null)} style={{ marginBottom:'20px', color:'#2563eb', background:'none', border:'none', cursor:'pointer', fontSize:'14px' }}>← 動画一覧に戻る</button>
              <h2 style={{ fontSize:'20px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'20px' }}>{selectedEpisode.title}</h2>

              {selectedEpisode.video_url && (
                <iframe
                  width="100%"
                  height="400"
                  src={selectedEpisode.video_url}
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay"
                  style={{ borderRadius:'12px', marginBottom:'24px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}
                />
              )}

              {!watched ? (
                <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'8px' }}>視聴完了を記録する</h3>
                  <p style={{ fontSize:'13px', color:'#64748b', marginBottom:'20px' }}>※ 同時視聴の場合は全員分のお名前を入力してください（最大5名）</p>

                  <div style={{ marginBottom:'20px' }}>
                    <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>会社（全員共通）</label>
                    <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc' }}>
                      <option value="">選択してください</option>
                      {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom:'20px' }}>
                    {userNames.map((name, index) => (
                      <div key={index} style={{ marginBottom:'10px' }}>
                        <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>
                          {index === 0 ? '氏名①（必須）' : `氏名${['②','③','④','⑤'][index-1]}（任意）`}
                        </label>
                        <input
                          placeholder={index === 0 ? '山田 太郎' : ''}
                          value={name}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:`1px solid ${index === 0 ? '#cbd5e1' : '#e2e8f0'}`, fontSize:'15px', color:'#0f172a', backgroundColor: index === 0 ? '#f8fafc' : '#fafafa', boxSizing:'border-box' }}
                        />
                      </div>
                    ))}
                  </div>

                  <button onClick={handleComplete} disabled={loading} style={{ width:'100%', padding:'13px', backgroundColor:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px', fontWeight:'bold' }}>
                    {loading ? '記録中...' : '✅ 視聴完了'}
                  </button>
                </div>
              ) : (
                <div style={{ backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
                  <p style={{ fontSize:'20px', color:'#16a34a', fontWeight:'bold', marginBottom:'16px' }}>✅ 視聴完了を記録しました！</p>
                  <button onClick={() => setSelectedEpisode(null)} style={{ padding:'10px 28px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px' }}>次の動画へ</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
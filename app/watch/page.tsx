'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Channel = { id: number; title: string; description: string; thumbnail_url: string }
type Episode = { id: number; title: string; video_url: string; channel_id: number; order_no: number }
type NamePair = { last: string; first: string }

export default function WatchPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [myName, setMyName] = useState('')
  const [subNames, setSubNames] = useState<NamePair[]>([
    { last:'', first:'' },
    { last:'', first:'' },
    { last:'', first:'' },
    { last:'', first:'' },
  ])
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<{id:number, name:string}[]>([])
  const [watched, setWatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [watchLogs, setWatchLogs] = useState<{episode_id:number, user_name:string}[]>([])
  const [isEmployee, setIsEmployee] = useState(false)
  const [loginName, setLoginName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: ch } = await supabase.from('channels').select('*').order('id')
      if (ch) setChannels(ch)
      const { data: ep } = await supabase.from('episodes').select('*').order('order_no')
      if (ep) setEpisodes(ep)
      const { data: co } = await supabase.from('companies').select('*').order('id')
      if (co) setCompanies(co)

      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email?.endsWith('@viewconfirm.internal')) {
        setIsEmployee(true)
        const { data: emp } = await supabase
          .from('employees')
          .select('last_name, first_name, company')
          .eq('email', user.email)
          .single()
        if (emp) {
          const fullName = emp.last_name + ' ' + emp.first_name
          setLoginName(fullName)
          setMyName(fullName)
          const { data: co2 } = await supabase.from('companies').select('*').eq('name', emp.company).single()
          if (co2) setCompanyId(String(co2.id))
        }
      }
      const { data: wl } = await supabase.from('watch_logs').select('episode_id, user_name')
      if (wl) setWatchLogs(wl)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/employee-login'
  }

  const handleSelectEpisode = (ep: Episode) => {
    setSelectedEpisode(ep)
    setWatched(false)
  }

  const handleComplete = async () => {
    if (!myName || !companyId || !selectedEpisode) return
    setLoading(true)
    const allNames = [
      myName,
      ...subNames
        .filter(n => n.last.trim() !== '' || n.first.trim() !== '')
        .map(n => (n.last + ' ' + n.first).trim())
    ]
    const newLogs: {episode_id:number, user_name:string}[] = []
    for (const name of allNames) {
      await supabase.from('watch_logs').insert({
        user_name: name,
        company_id: Number(companyId),
        episode_id: selectedEpisode.id,
        watched_at: new Date().toISOString()
      })
      newLogs.push({ episode_id: selectedEpisode.id, user_name: name })
    }
    setWatched(true)
    setWatchLogs([...watchLogs, ...newLogs])
    setLoading(false)
  }

  const handleSubNameChange = (index: number, field: 'last' | 'first', value: string) => {
    const newNames = [...subNames]
    newNames[index][field] = value
    setSubNames(newNames)
  }

  const isEpisodeWatched = (episodeId: number) => {
    if (isEmployee && loginName) {
      return watchLogs.some(w => w.episode_id === episodeId && w.user_name === loginName)
    }
    return watchLogs.some(w => w.episode_id === episodeId)
  }

  const channelEpisodes = selectedChannel ? episodes.filter(ep => ep.channel_id === selectedChannel.id) : []

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:'sans-serif' }}>
      <header style={{ backgroundColor:'#1e3a5f', padding:'0 20px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', backgroundColor:'#2563eb', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📺</div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:'bold', color:'#fff' }}>ViewConfirm</div>
            <div style={{ fontSize:'10px', color:'#93c5fd', letterSpacing:'0.1em' }}>MIRAI GROUP</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {isEmployee && loginName && (
            <span style={{ color:'#bfdbfe', fontSize:'13px' }}>{loginName}</span>
          )}
          {isEmployee ? (
            <button onClick={handleLogout} style={{ padding:'7px 16px', backgroundColor:'transparent', color:'#fff', border:'1px solid #93c5fd', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>ログアウト</button>
          ) : (
            <a href="/" style={{ color:'#93c5fd', fontSize:'13px', textDecoration:'none' }}>← トップに戻る</a>
          )}
        </div>
      </header>

      <main style={{ padding:'20px', maxWidth:'900px', margin:'0 auto' }}>

        {/* チャンネル一覧 */}
        {!selectedChannel && !selectedEpisode && (
          <div>
            <h2 style={{ fontSize:'18px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'20px' }}>📺 チャンネルを選んでください</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'16px' }}>
              {channels.map(ch => (
                <div key={ch.id} onClick={() => setSelectedChannel(ch)}
                  style={{ backgroundColor:'#fff', borderRadius:'12px', overflow:'hidden', border:'1px solid #e2e8f0', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', transition:'transform 0.1s' }}
                  onMouseOver={e => (e.currentTarget.style.transform='scale(1.02)')}
                  onMouseOut={e => (e.currentTarget.style.transform='scale(1)')}>
                  {ch.thumbnail_url ? (
                    <img src={ch.thumbnail_url} alt={ch.title} style={{ width:'100%', aspectRatio:'16/9', objectFit:'contain', backgroundColor:'#f1f5f9', display:'block' }} />
                  ) : (
                    <div style={{ width:'100%', aspectRatio:'16/9', backgroundColor:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' }}>📁</div>
                  )}
                  <div style={{ padding:'10px 12px' }}>
                    <div style={{ fontSize:'13px', fontWeight:'bold', color:'#1e3a5f', lineHeight:'1.4' }}>{ch.title}</div>
                    {ch.description && <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'4px' }}>{ch.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 動画一覧 */}
        {selectedChannel && !selectedEpisode && (
          <div>
            <button onClick={() => setSelectedChannel(null)}
              style={{ marginBottom:'16px', padding:'8px 16px', backgroundColor:'#f1f5f9', color:'#1e3a5f', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'bold' }}>
              ← チャンネル一覧に戻る
            </button>

            {/* チャンネル情報 */}
            <div style={{ backgroundColor:'#fff', borderRadius:'12px', overflow:'hidden', border:'1px solid #e2e8f0', marginBottom:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              {selectedChannel.thumbnail_url ? (
                <img src={selectedChannel.thumbnail_url} alt={selectedChannel.title} style={{ width:'100%', maxHeight:'200px', objectFit:'contain', backgroundColor:'#f1f5f9', display:'block' }} />
              ) : (
                <div style={{ width:'100%', height:'140px', backgroundColor:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px' }}>📁</div>
              )}
              <div style={{ padding:'16px 20px' }}>
                <h2 style={{ fontSize:'18px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'4px' }}>{selectedChannel.title}</h2>
                {selectedChannel.description && <p style={{ fontSize:'13px', color:'#64748b' }}>{selectedChannel.description}</p>}
              </div>
            </div>

            {/* 動画一覧 */}
            <h3 style={{ fontSize:'15px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'12px' }}>番組一覧</h3>
            {channelEpisodes.length === 0 && <p style={{ color:'#94a3b8' }}>動画がありません</p>}
            {channelEpisodes.map((ep, index) => {
              const isLocked = index > 0 && !isEpisodeWatched(channelEpisodes[index-1].id)
              const isWatched = isEpisodeWatched(ep.id)
              return (
                <div key={ep.id} onClick={() => !isLocked && handleSelectEpisode(ep)}
                  style={{ backgroundColor: isWatched ? '#f0fdf4' : '#fff', border:`1px solid ${isWatched ? '#86efac' : '#e2e8f0'}`, borderRadius:'10px', padding:'14px 16px', marginBottom:'8px', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1, display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'50%', backgroundColor: isWatched ? '#16a34a' : '#2563eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ color:'#fff', fontSize:'14px' }}>{isWatched ? '✅' : '▶'}</span>
                  </div>
                  <span style={{ fontSize:'15px', color:'#1e3a5f', fontWeight:'500', flex:1 }}>第{ep.order_no}回　{ep.title}</span>
                  {isWatched && (
                    <span style={{ fontSize:'12px', color:'#16a34a', fontWeight:'bold', backgroundColor:'#dcfce7', padding:'3px 10px', borderRadius:'20px', whiteSpace:'nowrap' }}>
                      ✅ 視聴済み
                    </span>
                  )}
                  {isLocked && <span style={{ fontSize:'11px', color:'#94a3b8' }}>🔒</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* 動画再生 */}
        {selectedEpisode && (
          <div>
            <button onClick={() => setSelectedEpisode(null)}
              style={{ marginBottom:'16px', padding:'8px 16px', backgroundColor:'#f1f5f9', color:'#1e3a5f', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'bold' }}>
              ← 番組一覧に戻る
            </button>
            <h2 style={{ fontSize:'18px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'16px' }}>第{selectedEpisode.order_no}回　{selectedEpisode.title}</h2>

            {selectedEpisode.video_url && (
              <iframe
                width="100%"
                height="360"
                src={selectedEpisode.video_url}
                frameBorder="0"
                allowFullScreen
                allow="autoplay"
                style={{ borderRadius:'12px', marginBottom:'24px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', display:'block' }}
              />
            )}

            {!watched ? (
              <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'8px' }}>視聴完了を記録する</h3>
                <p style={{ fontSize:'13px', color:'#64748b', marginBottom:'20px' }}>※ 同時視聴の場合は②以降にお名前を入力してください</p>

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>会社（全員共通）</label>
                  <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}
                    disabled={isEmployee}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor: isEmployee ? '#f1f5f9' : '#f8fafc' }}>
                    <option value="">選択してください</option>
                    {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom:'16px' }}>
                  <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block', fontWeight:'600' }}>氏名①（自分）</label>
                  <input value={myName} readOnly={isEmployee} onChange={(e) => setMyName(e.target.value)}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor: isEmployee ? '#f1f5f9' : '#f8fafc', boxSizing:'border-box' }} />
                </div>

                {subNames.map((name, index) => (
                  <div key={index} style={{ marginBottom:'12px' }}>
                    <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>
                      氏名{['②','③','④','⑤'][index]}（任意）
                    </label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                      <input placeholder="姓" value={name.last} onChange={(e) => handleSubNameChange(index, 'last', e.target.value)}
                        style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'15px', color:'#0f172a', backgroundColor:'#fafafa', boxSizing:'border-box' }} />
                      <input placeholder="名" value={name.first} onChange={(e) => handleSubNameChange(index, 'first', e.target.value)}
                        style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'15px', color:'#0f172a', backgroundColor:'#fafafa', boxSizing:'border-box' }} />
                    </div>
                  </div>
                ))}

                <button onClick={handleComplete} disabled={loading}
                  style={{ width:'100%', padding:'13px', backgroundColor:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px', fontWeight:'bold', marginTop:'8px' }}>
                  {loading ? '記録中...' : '✅ 視聴完了'}
                </button>
              </div>
            ) : (
              <div style={{ backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
                <p style={{ fontSize:'20px', color:'#16a34a', fontWeight:'bold', marginBottom:'16px' }}>✅ 視聴完了を記録しました！</p>
                <button onClick={() => setSelectedEpisode(null)}
                  style={{ padding:'10px 28px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px' }}>
                  次の動画へ
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
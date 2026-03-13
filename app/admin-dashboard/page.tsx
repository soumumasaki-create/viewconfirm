'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Company = { id: number; name: string }
type Employee = { id: number; last_name: string; first_name: string; company: string }
type Episode = { id: number; title: string; channel_id: number }
type Channel = { id: number; title: string }
type WatchLog = { user_name: string; episode_id: number; company_id: number }

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [watchLogs, setWatchLogs] = useState<WatchLog[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      const { data: co } = await supabase.from('companies').select('*').order('id')
      if (co) setCompanies(co)
      const { data: ch } = await supabase.from('channels').select('*').order('id')
      if (ch) setChannels(ch)
      const { data: ep } = await supabase.from('episodes').select('*').order('channel_id, order_no' as any)
      if (ep) setEpisodes(ep)
      const { data: em } = await supabase.from('employees').select('*').order('id')
      if (em) setEmployees(em)
      const { data: wl } = await supabase.from('watch_logs').select('*')
      if (wl) setWatchLogs(wl)
    }
    fetchAll()
  }, [])

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const selectedEpisode = episodes.find(e => e.id === selectedEpisodeId)

  // 選択会社の社員一覧
  const companyEmployees = employees.filter(e => e.company === selectedCompany?.name)

  // 視聴済み氏名リスト（選択エピソード×選択会社）
  const watchedNames = watchLogs
    .filter(w => w.episode_id === selectedEpisodeId && w.company_id === selectedCompanyId)
    .map(w => w.user_name)

  // 視聴済み・未視聴に分類
  const watchedEmployees = companyEmployees.filter(e =>
    watchedNames.includes(e.last_name + ' ' + e.first_name) ||
    watchedNames.includes(e.last_name + e.first_name)
  )
  const unwatchedEmployees = companyEmployees.filter(e =>
    !watchedNames.includes(e.last_name + ' ' + e.first_name) &&
    !watchedNames.includes(e.last_name + e.first_name)
  )

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

      <main style={{ padding:'40px', maxWidth:'900px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'32px' }}>📊 視聴状況ダッシュボード</h1>

        {/* 絞り込み */}
        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', marginBottom:'32px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
          <div>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block', fontWeight:'600' }}>① 会社を選択</label>
            <select value={selectedCompanyId ?? ''} onChange={(e) => { setSelectedCompanyId(Number(e.target.value)); setSelectedEpisodeId(null) }}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc' }}>
              <option value="">会社を選んでください</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block', fontWeight:'600' }}>② 動画を選択</label>
            <select value={selectedEpisodeId ?? ''} onChange={(e) => setSelectedEpisodeId(Number(e.target.value))}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc' }}>
              <option value="">動画を選んでください</option>
              {channels.map(ch => (
                <optgroup key={ch.id} label={ch.title}>
                  {episodes.filter(ep => ep.channel_id === ch.id).map(ep => (
                    <option key={ep.id} value={ep.id}>{ep.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* 結果 */}
        {selectedCompanyId && selectedEpisodeId && (
          <div>
            <div style={{ marginBottom:'12px', padding:'16px 20px', backgroundColor:'#1e3a5f', borderRadius:'10px', color:'#fff', fontSize:'14px' }}>
              <strong>{selectedCompany?.name}</strong>　×　<strong>「{selectedEpisode?.title}」</strong>　の視聴状況
              <span style={{ marginLeft:'16px', fontSize:'13px', color:'#93c5fd' }}>
                {watchedEmployees.length}名視聴済 / {companyEmployees.length}名中
              </span>
            </div>

            {companyEmployees.length === 0 && (
              <p style={{ color:'#94a3b8', textAlign:'center', padding:'40px' }}>この会社の社員が登録されていません</p>
            )}

            {companyEmployees.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
                {/* 視聴済み */}
                <div style={{ backgroundColor:'#fff', border:'1px solid #86efac', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ backgroundColor:'#16a34a', padding:'12px 20px' }}>
                    <h2 style={{ color:'#fff', fontSize:'15px', fontWeight:'bold', margin:0 }}>✅ 視聴済み　{watchedEmployees.length}名</h2>
                  </div>
                  {watchedEmployees.length === 0 ? (
                    <p style={{ color:'#94a3b8', padding:'20px', textAlign:'center', fontSize:'14px' }}>まだいません</p>
                  ) : (
                    watchedEmployees.map((emp, i) => (
                      <div key={emp.id} style={{ padding:'12px 20px', borderTop: i > 0 ? '1px solid #e2e8f0' : 'none', fontSize:'14px', color:'#1e3a5f', fontWeight:'500' }}>
                        {emp.last_name} {emp.first_name}
                        <span style={{ marginLeft:'8px', fontSize:'12px', color:'#64748b' }}>{emp.company}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* 未視聴 */}
                <div style={{ backgroundColor:'#fff', border:'1px solid #fca5a5', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ backgroundColor:'#ef4444', padding:'12px 20px' }}>
                    <h2 style={{ color:'#fff', fontSize:'15px', fontWeight:'bold', margin:0 }}>❌ 未視聴　{unwatchedEmployees.length}名</h2>
                  </div>
                  {unwatchedEmployees.length === 0 ? (
                    <p style={{ color:'#94a3b8', padding:'20px', textAlign:'center', fontSize:'14px' }}>全員視聴済みです！</p>
                  ) : (
                    unwatchedEmployees.map((emp, i) => (
                      <div key={emp.id} style={{ padding:'12px 20px', borderTop: i > 0 ? '1px solid #e2e8f0' : 'none', fontSize:'14px', color:'#1e3a5f', fontWeight:'500' }}>
                        {emp.last_name} {emp.first_name}
                        <span style={{ marginLeft:'8px', fontSize:'12px', color:'#64748b' }}>{emp.company}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ borderTop:'1px solid #e2e8f0', padding:'20px 40px', textAlign:'center', marginTop:'40px' }}>
        <p style={{ color:'#94a3b8', fontSize:'12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
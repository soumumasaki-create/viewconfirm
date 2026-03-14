'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Company = { id: number; name: string }
type Employee = { id: number; last_name: string; first_name: string; company: string }
type Episode = { id: number; title: string; channel_id: number; order_no: number }
type Channel = { id: number; title: string }
type WatchLog = { user_name: string; episode_id: number; company_id: number; watched_at: string }

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [watchLogs, setWatchLogs] = useState<WatchLog[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      const { data: co } = await supabase.from('companies').select('*').order('id')
      if (co) setCompanies(co)
      const { data: ch } = await supabase.from('channels').select('*').order('id')
      if (ch) setChannels(ch)
      const { data: ep } = await supabase.from('episodes').select('*').order('channel_id, order_no' as any)
      if (ep) setEpisodes(ep)
      const { data: em } = await supabase.from('employees').select('*').order('company, id')
      if (em) setEmployees(em)
      const { data: wl } = await supabase.from('watch_logs').select('*')
      if (wl) setWatchLogs(wl)
    }
    fetchAll()
  }, [])

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const selectedChannel = channels.find(c => c.id === selectedChannelId)
  const channelEpisodes = episodes.filter(ep => ep.channel_id === selectedChannelId)
  const companyEmployees = employees.filter(e => !selectedCompanyId || e.company === selectedCompany?.name)

  const getWatchLog = (userName: string, episodeId: number) => {
    return watchLogs.find(w => w.user_name === userName && w.episode_id === episodeId)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const handleCSV = () => {
    if (!selectedChannelId) return
    const rows = [['氏名', '会社', ...channelEpisodes.map(ep => ep.title + '（視聴日時）')]]
    companyEmployees.forEach(emp => {
      const fullName = emp.last_name + ' ' + emp.first_name
      const row = [fullName, emp.company]
      channelEpisodes.forEach(ep => {
        const log = getWatchLog(fullName, ep.id)
        row.push(log ? formatDate(log.watched_at) : '未視聴')
      })
      rows.push(row)
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `視聴状況_${selectedChannel?.title || ''}_${selectedCompany?.name || '全社'}.csv`
    a.click()
  }

  const watchedCount = (episodeId: number) =>
    companyEmployees.filter(emp => getWatchLog(emp.last_name + ' ' + emp.first_name, episodeId)).length

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

      <main style={{ padding:'40px', maxWidth:'1200px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'32px' }}>📊 視聴状況ダッシュボード</h1>

        {/* 絞り込み */}
        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'28px', marginBottom:'32px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
          <div>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block', fontWeight:'600' }}>① 会社を選択（任意）</label>
            <select value={selectedCompanyId ?? ''} onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc' }}>
              <option value="">全社員</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block', fontWeight:'600' }}>② チャンネルを選択</label>
            <select value={selectedChannelId ?? ''} onChange={(e) => setSelectedChannelId(e.target.value ? Number(e.target.value) : null)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc' }}>
              <option value="">チャンネルを選んでください</option>
              {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
            </select>
          </div>
        </div>

        {selectedChannelId && companyEmployees.length > 0 && (
          <>
            {/* ヘッダー情報 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <div style={{ padding:'12px 20px', backgroundColor:'#1e3a5f', borderRadius:'10px', color:'#fff', fontSize:'14px' }}>
                <strong>{selectedCompany?.name || '全社員'}</strong>　×　<strong>「{selectedChannel?.title}」</strong>
                <span style={{ marginLeft:'16px', fontSize:'13px', color:'#93c5fd' }}>対象社員 {companyEmployees.length}名</span>
              </div>
              <button onClick={handleCSV}
                style={{ padding:'10px 20px', backgroundColor:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'bold' }}>
                📥 CSVダウンロード
              </button>
            </div>

            {/* テーブル */}
            <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'auto', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
                <thead>
                  <tr style={{ backgroundColor:'#1e3a5f' }}>
                    <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px', whiteSpace:'nowrap' }}>氏名</th>
                    <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px', whiteSpace:'nowrap' }}>会社</th>
                    {channelEpisodes.map(ep => (
                      <th key={ep.id} style={{ padding:'14px 16px', textAlign:'center', color:'#fff', fontSize:'12px', whiteSpace:'nowrap' }}>
                        #{ep.order_no} {ep.title}
                        <div style={{ fontSize:'11px', color:'#93c5fd', marginTop:'2px' }}>
                          {watchedCount(ep.id)}/{companyEmployees.length}名視聴済
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companyEmployees.map((emp, i) => {
                    const fullName = emp.last_name + ' ' + emp.first_name
                    return (
                      <tr key={emp.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc', borderTop:'1px solid #e2e8f0' }}>
                        <td style={{ padding:'12px 20px', color:'#1e3a5f', fontSize:'14px', fontWeight:'500', whiteSpace:'nowrap' }}>{fullName}</td>
                        <td style={{ padding:'12px 20px', color:'#64748b', fontSize:'13px', whiteSpace:'nowrap' }}>{emp.company}</td>
                        {channelEpisodes.map(ep => {
                          const log = getWatchLog(fullName, ep.id)
                          return (
                            <td key={ep.id} style={{ padding:'12px 16px', textAlign:'center' }}>
                              {log ? (
                                <div>
                                  <div style={{ color:'#16a34a', fontWeight:'bold', fontSize:'14px' }}>✅</div>
                                  <div style={{ color:'#64748b', fontSize:'11px', marginTop:'2px', whiteSpace:'nowrap' }}>{formatDate(log.watched_at)}</div>
                                </div>
                              ) : (
                                <span style={{ color:'#ef4444', fontSize:'14px' }}>❌</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {selectedChannelId && companyEmployees.length === 0 && (
          <p style={{ color:'#94a3b8', textAlign:'center', padding:'40px' }}>社員が登録されていません</p>
        )}

        {!selectedChannelId && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px' }}>
            <p style={{ color:'#94a3b8', fontSize:'16px' }}>チャンネルを選択してください</p>
          </div>
        )}
      </main>

      <footer style={{ borderTop:'1px solid #e2e8f0', padding:'20px 40px', textAlign:'center', marginTop:'40px' }}>
        <p style={{ color:'#94a3b8', fontSize:'12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
type WatchLog = { id: number; user_name: string; company_id: number; episode_id: number; watched_at: string }
type Episode = { id: number; title: string; channel_id: number }
type Company = { id: number; name: string }
type Channel = { id: number; title: string }
export default function AdminPage() {
  const [logs, setLogs] = useState<WatchLog[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [filterCompany, setFilterCompany] = useState('')
  useEffect(() => {
    const fetchData = async () => {
      const { data: l } = await supabase.from('watch_logs').select('*').order('watched_at', { ascending: false })
      if (l) setLogs(l)
      const { data: e } = await supabase.from('episodes').select('*')
      if (e) setEpisodes(e)
      const { data: co } = await supabase.from('companies').select('*')
      if (co) setCompanies(co)
      const { data: ch } = await supabase.from('channels').select('*')
      if (ch) setChannels(ch)
    }
    fetchData()
  }, [])
  const getEpisodeTitle = (id: number) => episodes.find(e => e.id === id)?.title || '不明'
  const getCompanyName = (id: number) => companies.find(c => c.id === id)?.name || '不明'
  const filteredLogs = filterCompany ? logs.filter(l => l.company_id === Number(filterCompany)) : logs
  const handleCSV = () => {
    const header = '氏名,会社,動画,視聴日時'
    const rows = filteredLogs.map(l => `${l.user_name},${getCompanyName(l.company_id)},${getEpisodeTitle(l.episode_id)},${new Date(l.watched_at).toLocaleString('ja-JP')}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '視聴記録.csv'
    a.click()
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
      <main style={{ padding:'40px', maxWidth:'1100px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'32px' }}>📊 管理者ダッシュボード</h1>
        {/* 統計カード */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginBottom:'32px' }}>
          <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'8px', letterSpacing:'0.05em' }}>総視聴記録数</p>
            <p style={{ fontSize:'32px', fontWeight:'bold', color:'#1e3a5f' }}>{logs.length}<span style={{ fontSize:'14px', color:'#94a3b8', marginLeft:'4px' }}>件</span></p>
          </div>
          <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'8px', letterSpacing:'0.05em' }}>登録会社数</p>
            <p style={{ fontSize:'32px', fontWeight:'bold', color:'#1e3a5f' }}>{companies.length}<span style={{ fontSize:'14px', color:'#94a3b8', marginLeft:'4px' }}>社</span></p>
          </div>
          <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'8px', letterSpacing:'0.05em' }}>登録動画数</p>
            <p style={{ fontSize:'32px', fontWeight:'bold', color:'#1e3a5f' }}>{episodes.length}<span style={{ fontSize:'14px', color:'#94a3b8', marginLeft:'4px' }}>本</span></p>
          </div>
        </div>
        {/* フィルター・CSV */}
        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'24px', marginBottom:'24px', display:'flex', gap:'12px', alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} style={{ padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'14px', color:'#0f172a', backgroundColor:'#f8fafc' }}>
            <option value="">全社</option>
            {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
          </select>
          <span style={{ color:'#94a3b8', fontSize:'14px' }}>{filteredLogs.length}件</span>
          <div style={{ marginLeft:'auto' }}>
            <button onClick={handleCSV} style={{ padding:'10px 20px', backgroundColor:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'bold' }}>📥 CSVダウンロード</button>
          </div>
        </div>
        {/* テーブル */}
        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'#1e3a5f' }}>
                <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px', fontWeight:'bold', letterSpacing:'0.05em' }}>氏名</th>
                <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px', fontWeight:'bold', letterSpacing:'0.05em' }}>会社</th>
                <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px', fontWeight:'bold', letterSpacing:'0.05em' }}>動画</th>
                <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px', fontWeight:'bold', letterSpacing:'0.05em' }}>視聴日時</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 && (
                <tr><td colSpan={4} style={{ padding:'32px', textAlign:'center', color:'#94a3b8' }}>視聴記録がありません</td></tr>
              )}
              {filteredLogs.map((log, i) => (
                <tr key={log.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc', borderTop:'1px solid #e2e8f0' }}>
                  <td style={{ padding:'14px 20px', color:'#1e3a5f', fontSize:'14px', fontWeight:'500' }}>{log.user_name}</td>
                  <td style={{ padding:'14px 20px', color:'#475569', fontSize:'14px' }}>{getCompanyName(log.company_id)}</td>
                  <td style={{ padding:'14px 20px', color:'#475569', fontSize:'14px' }}>{getEpisodeTitle(log.episode_id)}</td>
                  <td style={{ padding:'14px 20px', color:'#475569', fontSize:'14px' }}>{new Date(log.watched_at).toLocaleString('ja-JP')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <footer style={{ borderTop:'1px solid #e2e8f0', padding:'20px 40px', textAlign:'center', marginTop:'40px' }}>
        <p style={{ color:'#94a3b8', fontSize:'12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
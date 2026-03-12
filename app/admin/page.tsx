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
    <div style={{ padding:'40px', maxWidth:'1000px', margin:'0 auto' }}>
      <h1 style={{ fontSize:'24px', marginBottom:'24px' }}>📊 管理者ダッシュボード</h1>
      <div style={{ display:'flex', gap:'12px', marginBottom:'24px', alignItems:'center' }}>
        <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} style={{ padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'16px', color:'#000', backgroundColor:'#fff' }}>
          <option value="">全社</option>
          {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
        </select>
        <button onClick={handleCSV} style={{ padding:'10px 24px', backgroundColor:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px' }}>📥 CSVダウンロード</button>
      </div>
      <div style={{ backgroundColor:'#f1f5f9', padding:'16px', borderRadius:'12px', marginBottom:'24px' }}>
        <p style={{ color:'#000' }}>視聴記録数: <strong>{filteredLogs.length}件</strong></p>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ backgroundColor:'#1d4ed8', color:'#fff' }}>
            <th style={{ padding:'12px', textAlign:'left' }}>氏名</th>
            <th style={{ padding:'12px', textAlign:'left' }}>会社</th>
            <th style={{ padding:'12px', textAlign:'left' }}>動画</th>
            <th style={{ padding:'12px', textAlign:'left' }}>視聴日時</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.length === 0 && (
            <tr><td colSpan={4} style={{ padding:'24px', textAlign:'center', color:'#94a3b8' }}>視聴記録がありません</td></tr>
          )}
          {filteredLogs.map((log, i) => (
            <tr key={log.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              <td style={{ padding:'12px', color:'#000' }}>{log.user_name}</td>
              <td style={{ padding:'12px', color:'#000' }}>{getCompanyName(log.company_id)}</td>
              <td style={{ padding:'12px', color:'#000' }}>{getEpisodeTitle(log.episode_id)}</td>
              <td style={{ padding:'12px', color:'#000' }}>{new Date(log.watched_at).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop:'32px' }}>
        <a href="/" style={{ color:'#2563eb' }}>← トップに戻る</a>
      </div>
    </div>
  )
}
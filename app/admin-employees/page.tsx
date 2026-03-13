'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Employee = { id: number; last_name: string; first_name: string; company: string; created_at: string }

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [company, setCompany] = useState('')
  const [companies, setCompanies] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchEmployees()
    fetchCompanies()
  }, [])

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('id')
    if (data) setEmployees(data)
  }

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('id')
    if (data) setCompanies(data.map((d) => d.name))
  }

  const handleAdd = async () => {
    if (!lastName || !firstName || !company) {
      setMessage('❌ 姓・名・会社名をすべて入力してください')
      return
    }
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastName, firstName, company }),
    })
    const result = await res.json()

    if (!res.ok) {
      setMessage('❌ エラー: ' + result.error)
    } else {
      setMessage('✅ ' + lastName + ' ' + firstName + ' さんを登録しました')
      setLastName('')
      setFirstName('')
      setCompany('')
      await fetchEmployees()
    }
    setLoading(false)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(name + ' を削除しますか？')) return
    await supabase.from('employees').delete().eq('id', id)
    await fetchEmployees()
  }

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

      <main style={{ padding:'40px', maxWidth:'800px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'32px' }}>👥 社員登録管理</h1>

        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'32px', marginBottom:'32px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'20px' }}>社員を追加する</h2>
          <p style={{ fontSize:'13px', color:'#64748b', marginBottom:'16px' }}>※ 初回パスワードは「1234」が自動設定されます</p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
            <div>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>姓</label>
              <input placeholder="例：山田" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>名</label>
              <input placeholder="例：太郎" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>会社名</label>
            <select value={company} onChange={(e) => setCompany(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }}>
              <option value="">会社を選択してください</option>
              {companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {message && <p style={{ color: message.startsWith('✅') ? '#16a34a' : '#ef4444', fontSize:'14px', marginBottom:'12px' }}>{message}</p>}
          <button onClick={handleAdd} disabled={loading} style={{ padding:'10px 28px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px', fontWeight:'bold' }}>
            {loading ? '登録中...' : '社員を登録する'}
          </button>
        </div>

        <h2 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'16px' }}>社員一覧</h2>
        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'#1e3a5f' }}>
                <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px' }}>氏名</th>
                <th style={{ padding:'14px 20px', textAlign:'left', color:'#fff', fontSize:'13px' }}>会社名</th>
                <th style={{ padding:'14px 20px', textAlign:'center', color:'#fff', fontSize:'13px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={3} style={{ padding:'24px', textAlign:'center', color:'#94a3b8' }}>社員が登録されていません</td></tr>
              )}
              {employees.map((emp, i) => (
                <tr key={emp.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc', borderTop:'1px solid #e2e8f0' }}>
                  <td style={{ padding:'14px 20px', color:'#1e3a5f', fontSize:'14px', fontWeight:'500' }}>{emp.last_name} {emp.first_name}</td>
                  <td style={{ padding:'14px 20px', color:'#64748b', fontSize:'14px' }}>{emp.company}</td>
                  <td style={{ padding:'14px 20px', textAlign:'center' }}>
                    <button onClick={() => handleDelete(emp.id, emp.last_name + ' ' + emp.first_name)} style={{ padding:'6px 14px', backgroundColor:'#ef4444', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>削除</button>
                  </td>
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
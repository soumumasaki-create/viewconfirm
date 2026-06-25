'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Employee = {
  id: number
  last_name: string
  first_name: string
  company: string
  affiliation: string | null
  created_at: string
  email?: string | null
  employee_code?: string | null
  is_active?: boolean | null
}

type ImportEmployeeRow = {
  rowNumber: number
  employee_code: string
  last_name: string
  first_name: string
  company: string
  affiliation: string
  is_active: boolean
  is_active_label: string
  action: '新規登録' | '更新'
  errors: string[]
}

const AFFILIATIONS_BY_COMPANY: Record<string, string[]> = {
  高見起業: ['ドライバー', 'リフトオペレーター', '事務職', '管理職'],
  タイホー荷役: ['リフトオペレーター', '事務職', '管理職'],
  翠星: ['ドライバー', '事務職', '管理職'],
  山大運輸: ['ドライバー', '事務職', '管理職'],
  みらい: ['事務職', '管理職'],
}

const REQUIRED_CSV_HEADERS = ['社員番号', '会社名', '所属・職種', '氏名', '利用可否']

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [company, setCompany] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [companies, setCompanies] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [importRows, setImportRows] = useState<ImportEmployeeRow[]>([])
  const [importFileName, setImportFileName] = useState('')
  const employeeFormRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchEmployees()
    fetchCompanies()
  }, [])

  useEffect(() => {
    setAffiliation('')
  }, [company])

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*').order('id')

    if (error) {
      setMessage('❌ 社員一覧を取得できませんでした: ' + error.message)
      return
    }

    if (data) setEmployees(data)
  }

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*').order('id')

    if (error) {
      setMessage('❌ 会社一覧を取得できませんでした: ' + error.message)
      return
    }

    if (data) setCompanies(data.map((d) => d.name))
  }

  const resetForm = () => {
    setLastName('')
    setFirstName('')
    setCompany('')
    setAffiliation('')
    setEditingId(null)
  }

  const availableAffiliations = company ? AFFILIATIONS_BY_COMPANY[company] || [] : []

  const employeeCodeSet = useMemo(() => {
    return new Set(employees.map((emp) => (emp.employee_code || '').trim()).filter(Boolean))
  }, [employees])

  const csvEscape = (value: string | number | boolean | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value)
    const escaped = text.replace(/"/g, '""')
    return `"${escaped}"`
  }

  const downloadCsv = (fileName: string, rows: string[][]) => {
    const csvText = rows.map((row) => row.map((value) => csvEscape(value)).join(',')).join('\r\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvText], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const handleDownloadTemplate = () => {
    downloadCsv('viewconfirm_employee_import_template.csv', [
      ['社員番号', '会社名', '所属・職種', '氏名', '利用可否', '取込結果メモ'],
      ['TK001', '高見起業', 'ドライバー', '山田 太郎', '有効', '例：この列はアプリでは読み込まない'],
      ['TH001', 'タイホー荷役', 'リフトオペレーター', '佐藤 花子', '有効', ''],
      ['MS001', 'みらい', '管理職', '鈴木 一郎', '有効', ''],
      ['TK002', '高見起業', 'リフトオペレーター', 'リフト 乗る太郎', '有効', ''],
    ])
  }

  const handleDownloadEmployees = () => {
    const rows = [
      ['社員番号', '会社名', '所属・職種', '氏名', '利用可否', '取込結果メモ'],
      ...employees.map((emp) => [
        emp.employee_code || '',
        emp.company || '',
        emp.affiliation || '',
        `${emp.last_name || ''} ${emp.first_name || ''}`.trim(),
        emp.is_active === false ? '無効' : '有効',
        '',
      ]),
    ]

    downloadCsv('viewconfirm_employees.csv', rows)
  }

  const handleSubmit = async () => {
    if (!lastName || !firstName || !company || !affiliation) {
      setMessage('❌ 姓・名・会社名・所属をすべて入力してください')
      return
    }

    setLoading(true)
    setMessage('')

    if (editingId) {
      const { error } = await supabase
        .from('employees')
        .update({
          last_name: lastName,
          first_name: firstName,
          company,
          affiliation,
        })
        .eq('id', editingId)

      if (error) {
        setMessage('❌ エラー: ' + error.message)
      } else {
        setMessage('✅ ' + lastName + ' ' + firstName + ' さんを修正しました')
        resetForm()
        await fetchEmployees()
      }

      setLoading(false)
      return
    }

    const res = await fetch('/api/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastName, firstName, company, affiliation }),
    })
    const result = await res.json()

    if (!res.ok) {
      setMessage('❌ エラー: ' + result.error)
    } else {
      setMessage('✅ ' + lastName + ' ' + firstName + ' さんを登録しました')
      resetForm()
      await fetchEmployees()
    }

    setLoading(false)
  }

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setLastName(emp.last_name)
    setFirstName(emp.first_name)
    setCompany(emp.company)
    setAffiliation(emp.affiliation || '')
    setMessage('')

    setTimeout(() => {
      employeeFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }

  const handleCancelEdit = () => {
    resetForm()
    setMessage('')
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(name + ' を削除しますか？')) return
    await supabase.from('employees').delete().eq('id', id)
    await fetchEmployees()
  }

  const handleResetEmployeePassword = async (id: number, name: string) => {
    if (!confirm(name + ' さんのパスワードを初期化して 1234 に戻しますか？')) return

    const { error } = await supabase
      .from('employees')
      .update({
        employee_password: '1234',
        must_change_password: true,
        password_reset_at: new Date().toISOString(),
        password_reset_by: '管理者',
      })
      .eq('id', id)

    if (error) {
      setMessage('❌ パスワード初期化に失敗しました: ' + error.message)
      return
    }

    setMessage('✅ ' + name + ' さんのパスワードを初期化しました。初期パスワードは 1234 です。')
    await fetchEmployees()
  }

  const parseCsvLine = (line: string) => {
    if (line.includes('\t') && !line.includes(',')) {
      return line.split('\t').map((value) => value.trim())
    }

    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"'
        i += 1
        continue
      }

      if (char === '"') {
        inQuotes = !inQuotes
        continue
      }

      if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
        continue
      }

      current += char
    }

    values.push(current.trim())
    return values
  }

  const splitFullName = (fullName: string) => {
    const parts = fullName
      .replace(/　/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    if (parts.length === 0) {
      return { lastName: '', firstName: '' }
    }

    if (parts.length === 1) {
      return { lastName: parts[0], firstName: '' }
    }

    return {
      lastName: parts[0],
      firstName: parts.slice(1).join(' '),
    }
  }

  const parseCsvText = (text: string) => {
    const normalizedText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalizedText.split('\n').filter((line) => line.trim() !== '')

    if (lines.length === 0) {
      throw new Error('CSVの中身が空です')
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim())
    const missingHeaders = REQUIRED_CSV_HEADERS.filter((header) => !headers.includes(header))

    if (missingHeaders.length > 0) {
      throw new Error('CSVに必要な列がありません: ' + missingHeaders.join('、'))
    }

    const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]))
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i += 1) {
      const values = parseCsvLine(lines[i])
      const row: Record<string, string> = {}

      headers.forEach((header) => {
        row[header] = values[headerIndex[header]] || ''
      })

      rows.push(row)
    }

    return rows
  }

  const convertActiveLabel = (value: string) => {
    const trimmed = value.trim()

    if (trimmed === '有効' || trimmed.toUpperCase() === 'TRUE' || trimmed === '1') {
      return { ok: true, boolValue: true, label: '有効' }
    }

    if (trimmed === '無効' || trimmed.toUpperCase() === 'FALSE' || trimmed === '0') {
      return { ok: true, boolValue: false, label: '無効' }
    }

    return { ok: false, boolValue: true, label: trimmed }
  }

  const validateImportRows = (rawRows: Record<string, string>[]) => {
    const seenEmployeeCodes = new Set<string>()

    return rawRows.map((rawRow, index) => {
      const rowNumber = index + 2
      const employeeCode = (rawRow['社員番号'] || '').trim()
      const fullName = (rawRow['氏名'] || '').trim()
      const { lastName: rowLastName, firstName: rowFirstName } = splitFullName(fullName)
      const rowCompany = (rawRow['会社名'] || '').trim()
      const rowAffiliation = (rawRow['所属・職種'] || '').trim()
      const activeResult = convertActiveLabel(rawRow['利用可否'] || '')
      const errors: string[] = []

      if (!employeeCode) errors.push('社員番号が空欄です')
      if (!fullName) errors.push('氏名が空欄です')
      if (fullName && !rowFirstName) errors.push('氏名は「姓 名」のように姓と名の間にスペースを入れてください')
      if (!rowCompany) errors.push('会社名が空欄です')
      if (!rowAffiliation) errors.push('所属・職種が空欄です')

      if (employeeCode) {
        if (seenEmployeeCodes.has(employeeCode)) {
          errors.push('CSV内で社員番号が重複しています')
        }
        seenEmployeeCodes.add(employeeCode)
      }

      if (rowCompany && !companies.includes(rowCompany)) {
        errors.push('会社名が登録済みの会社一覧にありません')
      }

      const allowedAffiliations = AFFILIATIONS_BY_COMPANY[rowCompany] || []
      if (rowCompany && rowAffiliation && !allowedAffiliations.includes(rowAffiliation)) {
        errors.push('所属・職種が会社に対応していません')
      }

      if (!activeResult.ok) {
        errors.push('利用可否は「有効」または「無効」で入力してください')
      }

      return {
        rowNumber,
        employee_code: employeeCode,
        last_name: rowLastName,
        first_name: rowFirstName,
        company: rowCompany,
        affiliation: rowAffiliation,
        is_active: activeResult.boolValue,
        is_active_label: activeResult.label || '有効',
        action: employeeCode && employeeCodeSet.has(employeeCode) ? '更新' : '新規登録',
        errors,
      } as ImportEmployeeRow
    })
  }

  const handleCsvFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    setImportRows([])
    setImportMessage('')

    if (!file) return

    setImportFileName(file.name)

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportMessage('❌ CSVファイルを選択してください。Excelで作成した後、CSV形式で保存してください。')
      return
    }

    try {
      const text = await file.text()
      const rawRows = parseCsvText(text)
      const validatedRows = validateImportRows(rawRows)

      setImportRows(validatedRows)

      const errorCount = validatedRows.filter((row) => row.errors.length > 0).length
      if (errorCount > 0) {
        setImportMessage('❌ エラーがあるため、まだ登録できません。赤い内容をExcelで修正してください。')
      } else {
        setImportMessage('✅ 取込前チェックOKです。内容を確認してから「この内容で登録する」を押してください。')
      }
    } catch (err) {
      setImportMessage('❌ ' + (err instanceof Error ? err.message : 'CSVを読み込めませんでした'))
    }
  }

  const clearImportPreview = () => {
    setImportRows([])
    setImportFileName('')
    setImportMessage('')
  }

  const handleImportEmployees = async () => {
    const validRows = importRows.filter((row) => row.errors.length === 0)

    if (validRows.length === 0) {
      setImportMessage('❌ 登録できる行がありません')
      return
    }

    const hasErrors = importRows.some((row) => row.errors.length > 0)
    if (hasErrors) {
      setImportMessage('❌ エラーがあるため登録できません。CSVを修正してください。')
      return
    }

    if (!confirm(validRows.length + '件の社員データを登録・更新しますか？')) return

    setImporting(true)
    setImportMessage('')

    let insertedCount = 0
    let updatedCount = 0

    for (const row of validRows) {
      const payload = {
        employee_code: row.employee_code,
        last_name: row.last_name,
        first_name: row.first_name,
        company: row.company,
        affiliation: row.affiliation,
        is_active: row.is_active,
      }

      if (row.action === '更新') {
        const { error } = await supabase.from('employees').update(payload).eq('employee_code', row.employee_code)

        if (error) {
          setImportMessage('❌ ' + row.rowNumber + '行目でエラー: ' + error.message)
          setImporting(false)
          return
        }

        updatedCount += 1
      } else {
        const insertPayload = {
          ...payload,
          employee_password: '1234',
          must_change_password: true,
          password_reset_at: new Date().toISOString(),
          password_reset_by: 'CSV取込',
        }

        const { error } = await supabase.from('employees').insert(insertPayload)

        if (error) {
          setImportMessage('❌ ' + row.rowNumber + '行目でエラー: ' + error.message)
          setImporting(false)
          return
        }

        insertedCount += 1
      }
    }

    await fetchEmployees()
    setImporting(false)
    setImportRows([])
    setImportFileName('')
    setImportMessage('✅ 社員CSV取込が完了しました。新規登録 ' + insertedCount + '件、更新 ' + updatedCount + '件')
  }

  const hasImportErrors = importRows.some((row) => row.errors.length > 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <header
        style={{
          backgroundColor: '#1e3a5f',
          padding: '0 40px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#2563eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            📺
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>ViewConfirm</div>
            <div style={{ fontSize: '10px', color: '#93c5fd', letterSpacing: '0.1em' }}>MIRAI GROUP</div>
          </div>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            padding: '10px 18px',
            backgroundColor: '#dc2626',
            color: '#fff',
            border: '1px solid #b91c1c',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
          }}
        >
          ← トップに戻る
        </a>

        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '32px' }}>
          👥 社員登録管理
        </h1>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '12px' }}>
            社員CSV一括取込
          </h2>

          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, marginBottom: '16px' }}>
            Excelで社員一覧を作成し、CSV形式で保存してから取り込んでください。
            必要な列は「社員番号、会社名、所属・職種、氏名、利用可否」です。
            利用可否は「有効」または「無効」で入力してください。
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={handleDownloadTemplate}
              type="button"
              style={{
                padding: '10px 18px',
                backgroundColor: '#0f766e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              CSVひな形をダウンロード
            </button>

            <button
              onClick={handleDownloadEmployees}
              type="button"
              style={{
                padding: '10px 18px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              社員一覧CSVをダウンロード
            </button>

            <label
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                backgroundColor: '#2563eb',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              CSVを選択する
              <input type="file" accept=".csv,text/csv" onChange={handleCsvFileChange} style={{ display: 'none' }} />
            </label>

            {importRows.length > 0 && (
              <button
                onClick={clearImportPreview}
                type="button"
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                プレビューを消す
              </button>
            )}

            {importFileName && <span style={{ color: '#64748b', fontSize: '13px' }}>選択中: {importFileName}</span>}
          </div>

          {importMessage && (
            <p
              style={{
                color: importMessage.startsWith('✅') ? '#16a34a' : '#ef4444',
                fontSize: '14px',
                marginBottom: '16px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {importMessage}
            </p>
          )}

          {importRows.length > 0 && (
            <div>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#334155' }}>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>行</th>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>社員番号</th>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>氏名</th>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>会社名</th>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>所属・職種</th>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>利用可否</th>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>処理</th>
                      <th style={{ padding: '10px', color: '#fff', fontSize: '12px', textAlign: 'left' }}>確認結果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          backgroundColor: row.errors.length > 0 ? '#fef2f2' : '#fff',
                        }}
                      >
                        <td style={{ padding: '10px', fontSize: '13px', color: '#475569' }}>{row.rowNumber}</td>
                        <td style={{ padding: '10px', fontSize: '13px', color: '#0f172a' }}>{row.employee_code}</td>
                        <td style={{ padding: '10px', fontSize: '13px', color: '#0f172a' }}>
                          {row.last_name} {row.first_name}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px', color: '#0f172a' }}>{row.company}</td>
                        <td style={{ padding: '10px', fontSize: '13px', color: '#0f172a' }}>{row.affiliation}</td>
                        <td style={{ padding: '10px', fontSize: '13px', color: '#0f172a' }}>{row.is_active_label}</td>
                        <td style={{ padding: '10px', fontSize: '13px', color: '#0f172a' }}>{row.action}</td>
                        <td style={{ padding: '10px', fontSize: '13px', color: row.errors.length > 0 ? '#ef4444' : '#16a34a' }}>
                          {row.errors.length > 0 ? row.errors.join(' / ') : 'OK'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImportEmployees}
                disabled={importing || hasImportErrors}
                type="button"
                style={{
                  padding: '10px 24px',
                  backgroundColor: importing || hasImportErrors ? '#94a3b8' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: importing || hasImportErrors ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                }}
              >
                {importing ? '登録中...' : 'この内容で登録する'}
              </button>
            </div>
          )}
        </div>

        <div
          ref={employeeFormRef}
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            scrollMarginTop: '24px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '20px' }}>
            {editingId ? '社員を修正する' : '社員を追加する'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>姓</label>
              <input
                placeholder="例：山田"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>名</label>
              <input
                placeholder="例：太郎"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>会社名</label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box',
              }}
            >
              <option value="">会社を選択してください</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>所属</label>
            <select
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              disabled={!company}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box',
              }}
            >
              <option value="">{company ? '所属を選択してください' : '先に会社名を選択してください'}</option>
              {availableAffiliations.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <p
              style={{
                color: message.startsWith('✅') ? '#16a34a' : '#ef4444',
                fontSize: '14px',
                marginBottom: '12px',
              }}
            >
              {message}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '10px 28px',
                backgroundColor: '#1e3a5f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
            >
              {loading ? (editingId ? '保存中...' : '登録中...') : editingId ? '修正を保存する' : '社員を登録する'}
            </button>

            {editingId && (
              <button
                onClick={handleCancelEdit}
                type="button"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                }}
              >
                キャンセル
              </button>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '16px' }}>社員一覧</h2>
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>社員番号</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>氏名</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>会社名</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>所属</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#fff', fontSize: '13px' }}>利用可否</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    社員が登録されていません
                  </td>
                </tr>
              )}
              {employees.map((emp, i) => (
                <tr
                  key={emp.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '14px' }}>
                    {emp.employee_code || '-'}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#1e3a5f', fontSize: '14px', fontWeight: '500' }}>
                    {emp.last_name} {emp.first_name}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '14px' }}>{emp.company}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '14px' }}>{emp.affiliation || '-'}</td>
                  <td style={{ padding: '14px 20px', color: emp.is_active === false ? '#ef4444' : '#16a34a', fontSize: '14px' }}>
                    {emp.is_active === false ? '無効' : '有効'}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEdit(emp)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        修正
                      </button>
                      <button
                        onClick={() => handleResetEmployeePassword(emp.id, emp.last_name + ' ' + emp.first_name)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        パスワード初期化
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id, emp.last_name + ' ' + emp.first_name)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 40px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
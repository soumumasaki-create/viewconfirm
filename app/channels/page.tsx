'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Channel = {
  id: number
  title: string
  description: string
  published: boolean
  thumbnail_url: string
  target_scope: string
  target_companies: string[]
  target_affiliations: string[]
}

const ALL_COMPANIES = ['高見起業', 'タイホー荷役', '翠星', '山大運輸', 'みらい']

const COMPANY_AFFILIATIONS: Record<string, string[]> = {
  高見起業: ['ドライバー', 'リフトオペレーター', '事務職', '管理職'],
  タイホー荷役: ['リフトオペレーター', '事務職', '管理職'],
  翠星: ['ドライバー', '事務職', '管理職'],
  山大運輸: ['ドライバー', '事務職', '管理職'],
  みらい: ['事務職', '管理職'],
}

const ALL_AFFILIATIONS = ['ドライバー', 'リフトオペレーター', '事務職', '管理職']

type Badge = {
  label: string
  bg: string
  color: string
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [targetScope, setTargetScope] = useState('all')
  const [targetCompanies, setTargetCompanies] = useState<string[]>([])
  const [targetAffiliations, setTargetAffiliations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [editChannel, setEditChannel] = useState<Channel | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null)
  const [editThumbnailPreview, setEditThumbnailPreview] = useState('')
  const [editTargetScope, setEditTargetScope] = useState('all')
  const [editTargetCompanies, setEditTargetCompanies] = useState<string[]>([])
  const [editTargetAffiliations, setEditTargetAffiliations] = useState<string[]>([])
  const [editLoading, setEditLoading] = useState(false)

  const fetchChannels = async () => {
    const { data } = await supabase.from('channels').select('*').order('id')
    if (data) setChannels(data as Channel[])
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const availableCreateAffiliations = useMemo(() => {
    if (targetCompanies.length === 0) return ALL_AFFILIATIONS
    const merged = new Set<string>()
    targetCompanies.forEach((company) => {
      ;(COMPANY_AFFILIATIONS[company] || []).forEach((affiliation) => merged.add(affiliation))
    })
    return ALL_AFFILIATIONS.filter((affiliation) => merged.has(affiliation))
  }, [targetCompanies])

  const availableEditAffiliations = useMemo(() => {
    if (editTargetCompanies.length === 0) return ALL_AFFILIATIONS
    const merged = new Set<string>()
    editTargetCompanies.forEach((company) => {
      ;(COMPANY_AFFILIATIONS[company] || []).forEach((affiliation) => merged.add(affiliation))
    })
    return ALL_AFFILIATIONS.filter((affiliation) => merged.has(affiliation))
  }, [editTargetCompanies])

  useEffect(() => {
    if (targetScope === 'all') {
      setTargetCompanies([])
      setTargetAffiliations([])
    }
  }, [targetScope])

  useEffect(() => {
    if (editTargetScope === 'all') {
      setEditTargetCompanies([])
      setEditTargetAffiliations([])
    }
  }, [editTargetScope])

  useEffect(() => {
    if (targetScope === 'selected') {
      setTargetAffiliations((prev) =>
        prev.filter((affiliation) => availableCreateAffiliations.includes(affiliation))
      )
    }
  }, [targetCompanies, targetScope, availableCreateAffiliations])

  useEffect(() => {
    if (editTargetScope === 'selected') {
      setEditTargetAffiliations((prev) =>
        prev.filter((affiliation) => availableEditAffiliations.includes(affiliation))
      )
    }
  }, [editTargetCompanies, editTargetScope, availableEditAffiliations])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditThumbnailFile(file)
      setEditThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const toggleCreateCompany = (value: string) => {
    setTargetCompanies((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const toggleCreateAffiliation = (value: string) => {
    setTargetAffiliations((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const toggleEditCompany = (value: string) => {
    setEditTargetCompanies((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const toggleEditAffiliation = (value: string) => {
    setEditTargetAffiliations((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const handleCreate = async () => {
    if (!title) return
    if (targetScope === 'selected' && targetCompanies.length === 0) return
    if (targetScope === 'selected' && targetAffiliations.length === 0) return

    setLoading(true)
    let thumbnailUrl = ''

    if (thumbnailFile) {
      const ext = thumbnailFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, thumbnailFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName)
        thumbnailUrl = urlData.publicUrl
      }
    }

    await supabase.from('channels').insert({
      title,
      description,
      published: false,
      thumbnail_url: thumbnailUrl,
      target_scope: targetScope,
      target_companies: targetScope === 'all' ? [] : targetCompanies,
      target_affiliations: targetScope === 'all' ? [] : targetAffiliations,
    })

    setTitle('')
    setDescription('')
    setThumbnailFile(null)
    setThumbnailPreview('')
    setTargetScope('all')
    setTargetCompanies([])
    setTargetAffiliations([])
    await fetchChannels()
    setLoading(false)
  }

  const handleEditOpen = (ch: Channel) => {
    setEditChannel(ch)
    setEditTitle(ch.title)
    setEditDescription(ch.description || '')
    setEditThumbnailFile(null)
    setEditThumbnailPreview(ch.thumbnail_url || '')
    setEditTargetScope(ch.target_scope || 'all')
    setEditTargetCompanies(ch.target_companies || [])
    setEditTargetAffiliations(ch.target_affiliations || [])
  }

  const handleEditSave = async () => {
    if (!editChannel || !editTitle) return
    if (editTargetScope === 'selected' && editTargetCompanies.length === 0) return
    if (editTargetScope === 'selected' && editTargetAffiliations.length === 0) return

    setEditLoading(true)
    let thumbnailUrl = editChannel.thumbnail_url || ''

    if (editThumbnailFile) {
      const ext = editThumbnailFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('thumbnails').upload(fileName, editThumbnailFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName)
        thumbnailUrl = urlData.publicUrl
      }
    }

    await supabase.from('channels').update({
      title: editTitle,
      description: editDescription,
      thumbnail_url: thumbnailUrl,
      target_scope: editTargetScope,
      target_companies: editTargetScope === 'all' ? [] : editTargetCompanies,
      target_affiliations: editTargetScope === 'all' ? [] : editTargetAffiliations,
    }).eq('id', editChannel.id)

    setEditChannel(null)
    await fetchChannels()
    setEditLoading(false)
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return
    await supabase.from('channels').delete().eq('id', id)
    await fetchChannels()
  }

  const getTargetBadges = (ch: Channel) => {
    if (ch.target_scope === 'all') {
      return [{ label: '全社員対象', bg: '#dcfce7', color: '#166534' }]
    }

    const companies = ch.target_companies || []
    const affiliations = ch.target_affiliations || []
    const badges: Badge[] = []

    if (companies.length > 0) {
      companies.forEach((company) => {
        badges.push({
          label: `会社: ${company}`,
          bg: '#dbeafe',
          color: '#1d4ed8',
        })
      })
    }

    if (affiliations.length > 0) {
      affiliations.forEach((affiliation) => {
        badges.push({
          label: `所属: ${affiliation}`,
          bg: '#fef3c7',
          color: '#b45309',
        })
      })
    }

    if (badges.length === 0) {
      badges.push({
        label: '未設定',
        bg: '#e2e8f0',
        color: '#475569',
      })
    }

    return badges
  }

  const renderSelectionSummary = (companies: string[], affiliations: string[]) => {
    if (companies.length === 0 && affiliations.length === 0) {
      return (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            fontSize: '13px',
          }}
        >
          まだ対象が選ばれていません。まず会社を選び、そのあと所属を選んでください。
        </div>
      )
    }

    return (
      <div
        style={{
          marginTop: '12px',
          padding: '12px 14px',
          borderRadius: '10px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '8px' }}>
          現在の対象
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {companies.map((company) => (
            <span
              key={`summary-company-${company}`}
              style={{
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '5px 10px',
                borderRadius: '999px',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
              }}
            >
              会社: {company}
            </span>
          ))}
          {affiliations.map((affiliation) => (
            <span
              key={`summary-affiliation-${affiliation}`}
              style={{
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '5px 10px',
                borderRadius: '999px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
              }}
            >
              所属: {affiliation}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#1e3a5f', padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📺</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>ViewConfirm</div>
            <div style={{ fontSize: '10px', color: '#93c5fd', letterSpacing: '0.1em' }}>MIRAI GROUP</div>
          </div>
        </div>
        <a href="/" style={{ color: '#93c5fd', fontSize: '13px', textDecoration: 'none' }}>← トップに戻る</a>
      </header>

      <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '32px' }}>📁 チャンネル管理</h1>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '20px' }}>新しいチャンネルを作成</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>チャンネル名</label>
            <input
              placeholder="例: 運転マニュアル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>説明（任意）</label>
            <input
              placeholder="チャンネルの説明を入力"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>対象設定</label>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
            >
              <option value="all">全社員対象</option>
              <option value="selected">会社と所属を選択する</option>
            </select>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              「会社と所属を選択する」を選んだ場合は、下で対象を選んでください。
            </div>
          </div>

          {targetScope === 'selected' && (
            <div
              style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '6px' }}>
                対象の選び方
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
                1. 先に会社を選びます。<br />
                2. 選んだ会社で使う所属だけが、所属欄に出ます。<br />
                3. 会社と所属の両方を選ぶと、その対象だけに公開できます。
              </div>

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', display: 'block' }}>対象会社</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {ALL_COMPANIES.map((company) => (
                    <label key={company} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
                      <input
                        type="checkbox"
                        checked={targetCompanies.includes(company)}
                        onChange={() => toggleCreateCompany(company)}
                      />
                      {company}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', display: 'block' }}>対象所属</label>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  選んだ会社で使える所属だけを表示しています。
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {availableCreateAffiliations.map((affiliation) => (
                    <label key={affiliation} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
                      <input
                        type="checkbox"
                        checked={targetAffiliations.includes(affiliation)}
                        onChange={() => toggleCreateAffiliation(affiliation)}
                      />
                      {affiliation}
                    </label>
                  ))}
                </div>
              </div>

              {renderSelectionSummary(targetCompanies, targetAffiliations)}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>サムネイル画像（任意）</label>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '14px', color: '#475569' }} />
            {thumbnailPreview && (
              <img src={thumbnailPreview} alt="プレビュー" style={{ marginTop: '12px', width: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }} />
            )}
          </div>

          <button onClick={handleCreate} disabled={loading} style={{ padding: '10px 28px', backgroundColor: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
            {loading ? '作成中...' : '作成する'}
          </button>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '16px' }}>チャンネル一覧</h2>
        {channels.length === 0 && <p style={{ color: '#94a3b8' }}>チャンネルがまだありません</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {channels.map((ch) => (
            <div key={ch.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {ch.thumbnail_url ? (
                <img src={ch.thumbnail_url} alt={ch.title} style={{ width: '100%', objectFit: 'contain', backgroundColor: '#f1f5f9' }} />
              ) : (
                <div style={{ width: '100%', height: '140px', backgroundColor: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📁</div>
              )}
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '6px' }}>{ch.title}</h3>
                {ch.description && <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>{ch.description}</p>}

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>誰向けか</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {getTargetBadges(ch).map((badge, index) => (
                      <span
                        key={`${ch.id}-${badge.label}-${index}`}
                        style={{
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          padding: '5px 10px',
                          borderRadius: '999px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                </div>

                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: ch.published ? '#dcfce7' : '#fef9c3', color: ch.published ? '#16a34a' : '#ca8a04', fontWeight: 'bold' }}>
                  {ch.published ? '公開中' : '非公開'}
                </span>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => handleEditOpen(ch)} style={{ flex: 1, padding: '7px', backgroundColor: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>編集</button>
                  <button onClick={() => handleDelete(ch.id, ch.title)} style={{ flex: 1, padding: '7px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>削除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {editChannel && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '560px', margin: '0 20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '24px' }}>チャンネルを編集</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>チャンネル名</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>説明</label>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>対象設定</label>
              <select
                value={editTargetScope}
                onChange={(e) => setEditTargetScope(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
              >
                <option value="all">全社員対象</option>
                <option value="selected">会社と所属を選択する</option>
              </select>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                「会社と所属を選択する」を選んだ場合は、下で対象を選んでください。
              </div>
            </div>

            {editTargetScope === 'selected' && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '6px' }}>
                  対象の選び方
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
                  1. 先に会社を選びます。<br />
                  2. 選んだ会社で使う所属だけが、所属欄に出ます。<br />
                  3. 会社と所属の両方を選ぶと、その対象だけに公開できます。
                </div>

                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', display: 'block' }}>対象会社</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                    {ALL_COMPANIES.map((company) => (
                      <label key={company} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
                        <input
                          type="checkbox"
                          checked={editTargetCompanies.includes(company)}
                          onChange={() => toggleEditCompany(company)}
                        />
                        {company}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', display: 'block' }}>対象所属</label>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    選んだ会社で使える所属だけを表示しています。
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                    {availableEditAffiliations.map((affiliation) => (
                      <label key={affiliation} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
                        <input
                          type="checkbox"
                          checked={editTargetAffiliations.includes(affiliation)}
                          onChange={() => toggleEditAffiliation(affiliation)}
                        />
                        {affiliation}
                      </label>
                    ))}
                  </div>
                </div>

                {renderSelectionSummary(editTargetCompanies, editTargetAffiliations)}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', display: 'block' }}>サムネイル画像</label>
              <input type="file" accept="image/*" onChange={handleEditFileChange} style={{ fontSize: '14px', color: '#475569' }} />
              {editThumbnailPreview && (
                <img src={editThumbnailPreview} alt="プレビュー" style={{ marginTop: '12px', width: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }} />
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditChannel(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>キャンセル</button>
              <button onClick={handleEditSave} disabled={editLoading} style={{ flex: 1, padding: '10px', backgroundColor: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
                {editLoading ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 40px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
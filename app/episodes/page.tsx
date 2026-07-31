'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Channel = {
  id: number
  title: string
}

type Episode = {
  id: number
  title: string
  description: string | null
  video_url: string
  channel_id: number
  order_no: number
  target_scope: string
  target_companies: string[]
  target_affiliations: string[]
  content_type: string
  completion_seconds: number
  require_manual_check: boolean
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

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '7px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  color: '#0f172a',
  backgroundColor: '#f8fafc',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  fontSize: '12px',
  color: '#475569',
  marginBottom: '4px',
  display: 'block',
  fontWeight: 'bold',
}

function normalizeVideoUrl(url: string) {
  if (!url) return ''

  try {
    const trimmed = url.trim()

    if (trimmed.includes('youtube.com/watch')) {
      const u = new URL(trimmed)
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : trimmed
    }

    if (trimmed.includes('youtu.be/')) {
      const u = new URL(trimmed)
      const id = u.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : trimmed
    }

    return trimmed
  } catch {
    return url
  }
}

function formatSeconds(totalSeconds: number) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}分${String(seconds).padStart(2, '0')}秒`
}

export default function EpisodesPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])

  const [editingId, setEditingId] = useState<number | null>(null)

  const [channelId, setChannelId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [orderNo, setOrderNo] = useState('')
  const [targetScope, setTargetScope] = useState('channel')
  const [targetCompanies, setTargetCompanies] = useState<string[]>([])
  const [targetAffiliations, setTargetAffiliations] = useState<string[]>([])
  const [contentType, setContentType] = useState('video')
  const [completionMinutes, setCompletionMinutes] = useState('3')
  const [completionSeconds, setCompletionSeconds] = useState('0')
  const [requireManualCheck, setRequireManualCheck] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    const { data: ch } = await supabase.from('channels').select('*').order('id')
    if (ch) setChannels(ch as Channel[])

    const { data: ep } = await supabase
      .from('episodes')
      .select('*')
      .order('channel_id')
      .order('order_no')
    if (ep) setEpisodes(ep as Episode[])
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const availableAffiliations = useMemo(() => {
    if (targetCompanies.length === 0) return ALL_AFFILIATIONS
    const merged = new Set<string>()
    targetCompanies.forEach((company) => {
      ;(COMPANY_AFFILIATIONS[company] || []).forEach((affiliation) => merged.add(affiliation))
    })
    return ALL_AFFILIATIONS.filter((affiliation) => merged.has(affiliation))
  }, [targetCompanies])

  useEffect(() => {
    if (targetScope === 'channel') {
      setTargetCompanies([])
      setTargetAffiliations([])
    }
  }, [targetScope])

  useEffect(() => {
    if (targetScope === 'custom') {
      setTargetAffiliations((prev) =>
        prev.filter((affiliation) => availableAffiliations.includes(affiliation))
      )
    }
  }, [targetCompanies, targetScope, availableAffiliations])

  useEffect(() => {
    if (contentType === 'video') {
      setRequireManualCheck(false)
    } else {
      setCompletionMinutes('0')
      setCompletionSeconds('0')
    }
  }, [contentType])

  const toggleCompany = (value: string) => {
    setTargetCompanies((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const toggleAffiliation = (value: string) => {
    setTargetAffiliations((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const resetForm = () => {
    setEditingId(null)
    setChannelId('')
    setTitle('')
    setDescription('')
    setVideoUrl('')
    setOrderNo('')
    setTargetScope('channel')
    setTargetCompanies([])
    setTargetAffiliations([])
    setContentType('video')
    setCompletionMinutes('3')
    setCompletionSeconds('0')
    setRequireManualCheck(false)
  }

  const handleCreateOrUpdate = async () => {
    if (!title || !channelId || !orderNo) return
    if (!videoUrl) return
    if (targetScope === 'custom' && targetCompanies.length === 0) return
    if (targetScope === 'custom' && targetAffiliations.length === 0) return

    const minutes = Number(completionMinutes || '0')
    const seconds = Number(completionSeconds || '0')
    const totalSeconds = minutes * 60 + seconds

    if (contentType === 'video' && totalSeconds <= 0) return

    setLoading(true)

    const payload = {
      title,
      description,
      video_url: normalizeVideoUrl(videoUrl),
      channel_id: Number(channelId),
      order_no: Number(orderNo),
      target_scope: targetScope,
      target_companies: targetScope === 'channel' ? [] : targetCompanies,
      target_affiliations: targetScope === 'channel' ? [] : targetAffiliations,
      content_type: contentType,
      completion_seconds: contentType === 'video' ? totalSeconds : 0,
      require_manual_check: contentType === 'video' ? false : requireManualCheck,
    }

    if (editingId) {
      await supabase.from('episodes').update(payload).eq('id', editingId)
    } else {
      await supabase.from('episodes').insert(payload)
    }

    resetForm()
    await fetchAll()
    setLoading(false)
  }

  const handleEdit = (ep: Episode) => {
    setEditingId(ep.id)
    setChannelId(String(ep.channel_id))
    setTitle(ep.title || '')
    setDescription(ep.description || '')
    setVideoUrl(ep.video_url || '')
    setOrderNo(String(ep.order_no ?? ''))
    setTargetScope(ep.target_scope || 'channel')
    setTargetCompanies(ep.target_scope === 'channel' ? [] : ep.target_companies || [])
    setTargetAffiliations(ep.target_scope === 'channel' ? [] : ep.target_affiliations || [])
    setContentType(ep.content_type || 'video')

    if ((ep.content_type || 'video') === 'video') {
      const total = ep.completion_seconds || 180
      const minutes = Math.floor(total / 60)
      const seconds = total % 60
      setCompletionMinutes(String(minutes))
      setCompletionSeconds(String(seconds))
      setRequireManualCheck(false)
    } else {
      setCompletionMinutes('0')
      setCompletionSeconds('0')
      setRequireManualCheck(!!ep.require_manual_check)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (ep: Episode) => {
    const ok = window.confirm(`「${ep.title}」を削除します。よろしいですか？`)
    if (!ok) return

    await supabase.from('episodes').delete().eq('id', ep.id)

    if (editingId === ep.id) {
      resetForm()
    }

    await fetchAll()
  }

  const handleMove = async (ep: Episode, direction: 'up' | 'down') => {
    const sameChannelEpisodes = episodes
      .filter((item) => item.channel_id === ep.channel_id)
      .sort((a, b) => a.order_no - b.order_no)

    const currentIndex = sameChannelEpisodes.findIndex((item) => item.id === ep.id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sameChannelEpisodes.length) return

    const targetEpisode = sameChannelEpisodes[targetIndex]

    await supabase.from('episodes').update({ order_no: targetEpisode.order_no }).eq('id', ep.id)
    await supabase.from('episodes').update({ order_no: ep.order_no }).eq('id', targetEpisode.id)

    await fetchAll()
  }

  const getTargetBadges = (ep: Episode) => {
    if (ep.target_scope === 'channel' || !ep.target_scope) {
      return [{ label: 'チャンネル設定を使う', bg: '#e0e7ff', color: '#3730a3' }]
    }

    const companies = ep.target_companies || []
    const affiliations = ep.target_affiliations || []
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
            marginTop: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            backgroundColor: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            fontSize: '12px',
          }}
        >
          まだ対象が選ばれていません。
        </div>
      )
    }

    return (
      <div
        style={{
          marginTop: '8px',
          padding: '8px 10px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '6px' }}>
          現在の対象
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {companies.map((company) => (
            <span
              key={`summary-company-${company}`}
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '4px 8px',
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
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '4px 8px',
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
      <header
        style={{
          backgroundColor: '#1e3a5f',
          padding: '0 28px',
          height: '54px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '4px',
            }}
          >
            <img
              src="/mirai-logo.jpg"
              alt="MIRAI"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#93c5fd', letterSpacing: '0.1em' }}>
              MIRAI GROUP
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '22px 28px 36px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a5f', margin: 0 }}>
              🎬 動画管理
            </h1>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              動画・資料の追加、対象設定、表示順を管理します。
            </div>
          </div>

          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '8px 14px',
              backgroundColor: '#dc2626',
              color: '#fff',
              border: '1px solid #b91c1c',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(220,38,38,0.18)',
              whiteSpace: 'nowrap',
            }}
          >
            ← トップに戻る
          </a>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 14px' }}>
            {editingId ? '動画・資料を編集' : '新しい動画を追加'}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.5fr 0.7fr 0.9fr',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label style={labelStyle}>チャンネル</label>
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} style={inputStyle}>
                <option value="">選択してください</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>順番</label>
              <input placeholder="例: 1" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>種別</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={inputStyle}>
                <option value="video">動画</option>
                <option value="document">資料</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>対象設定</label>
              <select value={targetScope} onChange={(e) => setTargetScope(e.target.value)} style={inputStyle}>
                <option value="channel">チャンネル設定を使う</option>
                <option value="custom">この動画で個別設定する</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label style={labelStyle}>タイトル</label>
              <input
                placeholder="タイトルを入力"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>URL</label>
              <input
                placeholder="YouTube / PDF / Word / Excel / Googleドライブ などのURL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>内容</label>
            <textarea
              placeholder="この動画・資料の内容を入力"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
              入力した内容は、社員が動画を見る画面でタイトルの下に表示されます。
            </div>
          </div>

          {contentType === 'video' ? (
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>視聴完了までの時間</label>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 1fr', gap: '10px', alignItems: 'center' }}>
                <input
                  placeholder="分"
                  value={completionMinutes}
                  onChange={(e) => setCompletionMinutes(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="秒"
                  value={completionSeconds}
                  onChange={(e) => setCompletionSeconds(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ fontSize: '11px', color: '#64748b' }}>例：0分30秒、2分00秒、12分15秒</div>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginBottom: '12px',
                padding: '10px 12px',
                borderRadius: '9px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#334155',
                }}
              >
                <input
                  type="checkbox"
                  checked={requireManualCheck}
                  onChange={(e) => setRequireManualCheck(e.target.checked)}
                />
                閲覧チェックで完了にする
              </label>
            </div>
          )}

          {targetScope === 'custom' && (
            <div
              style={{
                marginBottom: '14px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '8px' }}>
                個別対象設定
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                }}
              >
                <div>
                  <label style={labelStyle}>対象会社</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '7px' }}>
                    {ALL_COMPANIES.map((company) => (
                      <label
                        key={company}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#334155',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '7px',
                          padding: '7px 8px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={targetCompanies.includes(company)}
                          onChange={() => toggleCompany(company)}
                        />
                        {company}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>対象所属</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '7px' }}>
                    {availableAffiliations.map((affiliation) => (
                      <label
                        key={affiliation}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#334155',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '7px',
                          padding: '7px 8px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={targetAffiliations.includes(affiliation)}
                          onChange={() => toggleAffiliation(affiliation)}
                        />
                        {affiliation}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {renderSelectionSummary(targetCompanies, targetAffiliations)}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCreateOrUpdate}
              disabled={loading}
              style={{
                padding: '8px 22px',
                backgroundColor: '#1e3a5f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              {loading ? (editingId ? '保存中...' : '追加中...') : editingId ? '保存する' : '追加する'}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                type="button"
                style={{
                  padding: '8px 22px',
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                編集をやめる
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', margin: 0 }}>
            動画一覧
          </h2>
          <div style={{ fontSize: '12px', color: '#64748b' }}>チャンネルごとに表示</div>
        </div>

        {channels.map((ch) => {
          const channelEpisodes = episodes
            .filter((ep) => ep.channel_id === ch.id)
            .sort((a, b) => a.order_no - b.order_no)

          return (
            <div key={ch.id} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <div style={{ width: '4px', height: '18px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', margin: 0 }}>{ch.title}</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>({channelEpisodes.length}件)</span>
              </div>

              {channelEpisodes.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '13px', paddingLeft: '12px', margin: '6px 0' }}>
                  動画がありません
                </p>
              )}

              {channelEpisodes.map((ep, index) => (
                <div
                  key={ep.id}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.035)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#fff',
                        backgroundColor: '#2563eb',
                        padding: '3px 7px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      #{ep.order_no}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', color: '#1e3a5f', fontWeight: 'bold' }}>{ep.title}</span>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            backgroundColor: ep.content_type === 'document' ? '#fef3c7' : '#dcfce7',
                            color: ep.content_type === 'document' ? '#b45309' : '#166534',
                          }}
                        >
                          {ep.content_type === 'document' ? '資料' : '動画'}
                        </span>

                        {ep.content_type === 'document' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              backgroundColor: ep.require_manual_check ? '#dbeafe' : '#e2e8f0',
                              color: ep.require_manual_check ? '#1d4ed8' : '#475569',
                            }}
                          >
                            {ep.require_manual_check ? '閲覧チェックで完了' : '資料'}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              backgroundColor: '#ede9fe',
                              color: '#6d28d9',
                            }}
                          >
                            視聴完了: {formatSeconds(ep.completion_seconds || 0)}
                          </span>
                        )}
                      </div>

                      {ep.description && (
                        <div
                          style={{
                            marginTop: '6px',
                            color: '#475569',
                            fontSize: '12px',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {ep.description}
                        </div>
                      )}

                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {getTargetBadges(ep).map((badge, badgeIndex) => (
                          <span
                            key={`${ep.id}-${badge.label}-${badgeIndex}`}
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '4px 8px',
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

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '260px' }}>
                      <button
                        onClick={() => handleEdit(ep)}
                        style={{
                          padding: '7px 10px',
                          backgroundColor: '#1d4ed8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        編集
                      </button>

                      <button
                        onClick={() => handleDelete(ep)}
                        style={{
                          padding: '7px 10px',
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        削除
                      </button>

                      <button
                        onClick={() => handleMove(ep, 'up')}
                        disabled={index === 0}
                        style={{
                          padding: '7px 10px',
                          backgroundColor: index === 0 ? '#cbd5e1' : '#0f766e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '7px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        ↑
                      </button>

                      <button
                        onClick={() => handleMove(ep, 'down')}
                        disabled={index === channelEpisodes.length - 1}
                        style={{
                          padding: '7px 10px',
                          backgroundColor: index === channelEpisodes.length - 1 ? '#cbd5e1' : '#0f766e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '7px',
                          cursor: index === channelEpisodes.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </main>
    </div>
  )
}
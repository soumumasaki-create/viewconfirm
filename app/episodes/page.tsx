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
            <div style={{ fontSize: '10px', color: '#93c5fd', letterSpacing: '0.1em' }}>
              MIRAI GROUP
            </div>
          </div>
        </div>

        <a href="/" style={{ color: '#93c5fd', fontSize: '13px', textDecoration: 'none' }}>
          ← トップに戻る
        </a>
      </header>

      <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '32px' }}>
          🎬 動画管理
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
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '20px' }}>
            {editingId ? '動画・資料を編集' : '新しい動画を追加'}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                チャンネル
              </label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                }}
              >
                <option value="">選択してください</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                順番
              </label>
              <input
                placeholder="例: 1"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
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
            <label
              style={{
                fontSize: '13px',
                color: '#475569',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              タイトル
            </label>
            <input
              placeholder="タイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#475569',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              種別
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
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
              <option value="video">動画</option>
              <option value="document">資料</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#475569',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              URL
            </label>
            <input
              placeholder="YouTube / PDF / Word / Excel / Googleドライブ などのURL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
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

          {contentType === 'video' ? (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                視聴完了までの時間
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <input
                    placeholder="分"
                    value={completionMinutes}
                    onChange={(e) => setCompletionMinutes(e.target.value)}
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
                  <input
                    placeholder="秒"
                    value={completionSeconds}
                    onChange={(e) => setCompletionSeconds(e.target.value)}
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
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                例：0分30秒、2分00秒、12分15秒
              </div>
            </div>
          ) : (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
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
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
                PDF、Word、Excelなどの資料は、時間ではなく閲覧チェックで完了にできます。
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#475569',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              対象設定
            </label>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value)}
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
              <option value="channel">チャンネル設定を使う</option>
              <option value="custom">この動画で個別設定する</option>
            </select>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              「この動画で個別設定する」を選んだ場合は、下で対象を選んでください。
            </div>
          </div>

          {targetScope === 'custom' && (
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
                3. 会社と所属の両方を選ぶと、この動画だけ個別に設定できます。
              </div>

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', display: 'block' }}>
                  対象会社
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {ALL_COMPANIES.map((company) => (
                    <label
                      key={company}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#334155',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px 12px',
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

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', display: 'block' }}>
                  対象所属
                </label>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  選んだ会社で使える所属だけを表示しています。
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {availableAffiliations.map((affiliation) => (
                    <label
                      key={affiliation}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#334155',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px 12px',
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

              {renderSelectionSummary(targetCompanies, targetAffiliations)}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCreateOrUpdate}
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
              {loading ? (editingId ? '保存中...' : '追加中...') : editingId ? '保存する' : '追加する'}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                type="button"
                style={{
                  padding: '10px 28px',
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                }}
              >
                編集をやめる
              </button>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '16px' }}>
          動画一覧
        </h2>

        {channels.map((ch) => {
          const channelEpisodes = episodes
            .filter((ep) => ep.channel_id === ch.id)
            .sort((a, b) => a.order_no - b.order_no)

          return (
            <div key={ch.id} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '4px', height: '20px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a5f' }}>{ch.title}</h3>
              </div>

              {channelEpisodes.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '14px', paddingLeft: '12px' }}>動画がありません</p>
              )}

              {channelEpisodes.map((ep, index) => (
                <div
                  key={ep.id}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    marginBottom: '10px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#fff',
                        backgroundColor: '#2563eb',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                    >
                      #{ep.order_no}
                    </span>

                    <span style={{ fontSize: '15px', color: '#1e3a5f', fontWeight: '500' }}>{ep.title}</span>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        backgroundColor: ep.content_type === 'document' ? '#fef3c7' : '#dcfce7',
                        color: ep.content_type === 'document' ? '#b45309' : '#166534',
                      }}
                    >
                      {ep.content_type === 'document' ? '資料' : '動画'}
                    </span>

                    {ep.video_url && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>登録済み</span>
                    )}
                  </div>

                  <div style={{ paddingLeft: '44px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {ep.content_type === 'document' ? (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '5px 10px',
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
                            display: 'inline-block',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '5px 10px',
                            borderRadius: '999px',
                            backgroundColor: '#ede9fe',
                            color: '#6d28d9',
                          }}
                        >
                          視聴完了: {formatSeconds(ep.completion_seconds || 0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ paddingLeft: '44px', marginBottom: '12px' }}>
                    <div style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                      誰向けか
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {getTargetBadges(ep).map((badge, badgeIndex) => (
                        <span
                          key={`${ep.id}-${badge.label}-${badgeIndex}`}
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

                  <div style={{ paddingLeft: '44px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEdit(ep)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#1d4ed8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                    >
                      編集
                    </button>

                    <button
                      onClick={() => handleDelete(ep)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                    >
                      削除
                    </button>

                    <button
                      onClick={() => handleMove(ep, 'up')}
                      disabled={index === 0}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: index === 0 ? '#cbd5e1' : '#0f766e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                    >
                      ↑ 上へ
                    </button>

                    <button
                      onClick={() => handleMove(ep, 'down')}
                      disabled={index === channelEpisodes.length - 1}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: index === channelEpisodes.length - 1 ? '#cbd5e1' : '#0f766e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: index === channelEpisodes.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                    >
                      ↓ 下へ
                    </button>
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
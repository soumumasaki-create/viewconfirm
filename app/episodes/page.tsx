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

export default function EpisodesPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [channelId, setChannelId] = useState('')
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [orderNo, setOrderNo] = useState('')
  const [targetScope, setTargetScope] = useState('channel')
  const [targetCompanies, setTargetCompanies] = useState<string[]>([])
  const [targetAffiliations, setTargetAffiliations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    const { data: ch } = await supabase.from('channels').select('*').order('id')
    if (ch) setChannels(ch)

    const { data: ep } = await supabase.from('episodes').select('*').order('order_no')
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

  const handleCreate = async () => {
    if (!title || !channelId || !orderNo) return
    if (targetScope === 'custom' && targetCompanies.length === 0) return
    if (targetScope === 'custom' && targetAffiliations.length === 0) return

    setLoading(true)

    await supabase.from('episodes').insert({
      title,
      video_url: normalizeVideoUrl(videoUrl),
      channel_id: Number(channelId),
      order_no: Number(orderNo),
      target_scope: targetScope,
      target_companies: targetScope === 'channel' ? [] : targetCompanies,
      target_affiliations: targetScope === 'channel' ? [] : targetAffiliations,
    })

    setTitle('')
    setVideoUrl('')
    setOrderNo('')
    setTargetScope('channel')
    setTargetCompanies([])
    setTargetAffiliations([])

    await fetchAll()
    setLoading(false)
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
            新しい動画を追加
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
              動画タイトル
            </label>
            <input
              placeholder="動画タイトルを入力"
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
              動画URL
            </label>
            <input
              placeholder="YouTube通常URL / YouTube短縮URL / GoogleドライブURL"
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

          <button
            onClick={handleCreate}
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
            {loading ? '追加中...' : '追加する'}
          </button>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '16px' }}>
          動画一覧
        </h2>

        {channels.map((ch) => (
          <div key={ch.id} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '4px', height: '20px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a5f' }}>{ch.title}</h3>
            </div>

            {episodes.filter((ep) => ep.channel_id === ch.id).length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '14px', paddingLeft: '12px' }}>動画がありません</p>
            )}

            {episodes
              .filter((ep) => ep.channel_id === ch.id)
              .map((ep) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
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

                    {ep.video_url && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>登録済み</span>
                    )}
                  </div>

                  <div style={{ paddingLeft: '44px' }}>
                    <div style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                      誰向けか
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {getTargetBadges(ep).map((badge, index) => (
                        <span
                          key={`${ep.id}-${badge.label}-${index}`}
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
                </div>
              ))}
          </div>
        ))}
      </main>
    </div>
  )
}
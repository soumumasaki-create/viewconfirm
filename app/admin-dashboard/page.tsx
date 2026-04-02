'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Company = { id: number; name: string }
type Employee = {
  id: number
  last_name: string
  first_name: string
  company: string
  affiliation: string
}
type Episode = { id: number; title: string; channel_id: number; order_no: number }
type Channel = {
  id: number
  title: string
  target_scope?: string
  target_companies?: string[]
  target_affiliations?: string[]
}
type WatchLog = { user_name: string; episode_id: number; company_id: number; watched_at: string }

const COMPANY_AFFILIATIONS: Record<string, string[]> = {
  高見起業: ['ドライバー', 'リフトオペレーター', '事務職', '管理職'],
  タイホー荷役: ['リフトオペレーター', '事務職', '管理職'],
  翠星: ['ドライバー', '事務職', '管理職'],
  山大運輸: ['ドライバー', '事務職', '管理職'],
  みらい: ['事務職', '管理職'],
}

function includesTargetValue(list: string[] | null | undefined, value: string) {
  if (!list || list.length === 0) return false
  return list.includes(value)
}

function canTargetEmployeeByChannel(channel: Channel | undefined, employee: Employee) {
  if (!channel || !channel.target_scope || channel.target_scope === 'all') return true

  const companies = channel.target_companies || []
  const affiliations = channel.target_affiliations || []

  const companyMatched =
    companies.length === 0 || includesTargetValue(companies, employee.company)

  const affiliationMatched =
    affiliations.length === 0 || includesTargetValue(affiliations, employee.affiliation)

  return companyMatched && affiliationMatched
}

function getChannelTargetSummary(channel: Channel | undefined) {
  if (!channel || !channel.target_scope || channel.target_scope === 'all') {
    return '全社員対象'
  }

  const companies = channel.target_companies || []
  const affiliations = channel.target_affiliations || []

  const parts: string[] = []

  if (companies.length > 0) {
    parts.push(`会社: ${companies.join(' / ')}`)
  }

  if (affiliations.length > 0) {
    parts.push(`所属: ${affiliations.join(' / ')}`)
  }

  return parts.length > 0 ? parts.join('　|　') : '個別対象設定あり'
}

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [watchLogs, setWatchLogs] = useState<WatchLog[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null)
  const [selectedAffiliation, setSelectedAffiliation] = useState('')
  const [displayMode, setDisplayMode] = useState<'all' | 'unwatched' | 'watched'>('all')

  useEffect(() => {
    const fetchAll = async () => {
      const { data: co } = await supabase.from('companies').select('*').order('id')
      if (co) setCompanies(co)

      const { data: ch } = await supabase.from('channels').select('*').order('id')
      if (ch) setChannels(ch as Channel[])

      const { data: ep } = await supabase
        .from('episodes')
        .select('*')
        .order('channel_id, order_no' as any)
      if (ep) setEpisodes(ep)

      const { data: em } = await supabase
        .from('employees')
        .select('*')
        .order('company, affiliation, id' as any)
      if (em) setEmployees(em)

      const { data: wl } = await supabase.from('watch_logs').select('*')
      if (wl) setWatchLogs(wl)
    }

    fetchAll()
  }, [])

  useEffect(() => {
    setSelectedAffiliation('')
  }, [selectedCompanyId])

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)
  const selectedChannel = channels.find((c) => c.id === selectedChannelId)
  const channelEpisodes = episodes.filter((ep) => ep.channel_id === selectedChannelId)

  const affiliationOptions = selectedCompany
    ? COMPANY_AFFILIATIONS[selectedCompany.name] || []
    : Array.from(new Set(Object.values(COMPANY_AFFILIATIONS).flat()))

  const filteredEmployees = employees.filter((e) => {
    const companyMatched = !selectedCompanyId || e.company === selectedCompany?.name
    const affiliationMatched = !selectedAffiliation || e.affiliation === selectedAffiliation
    return companyMatched && affiliationMatched
  })

  const companyEmployees = selectedChannel
    ? filteredEmployees.filter((e) => canTargetEmployeeByChannel(selectedChannel, e))
    : filteredEmployees

  const getWatchLog = (userName: string, episodeId: number) => {
    return watchLogs.find((w) => w.user_name === userName && w.episode_id === episodeId)
  }

  const getUnwatchedCount = (emp: Employee) => {
    if (channelEpisodes.length === 0) return 0

    const fullName = emp.last_name + ' ' + emp.first_name
    return channelEpisodes.filter((ep) => !getWatchLog(fullName, ep.id)).length
  }

  const getWatchedCountByEmployee = (emp: Employee) => {
    if (channelEpisodes.length === 0) return 0

    const fullName = emp.last_name + ' ' + emp.first_name
    return channelEpisodes.filter((ep) => getWatchLog(fullName, ep.id)).length
  }

  const hasUnwatchedEpisode = (emp: Employee) => {
    return getUnwatchedCount(emp) > 0
  }

  const isFullyWatchedEmployee = (emp: Employee) => {
    return channelEpisodes.length > 0 && getUnwatchedCount(emp) === 0
  }

  const displayedEmployeesBase =
    displayMode === 'unwatched'
      ? companyEmployees.filter((emp) => hasUnwatchedEpisode(emp))
      : displayMode === 'watched'
        ? companyEmployees.filter((emp) => isFullyWatchedEmployee(emp))
        : companyEmployees

  const displayedEmployees = [...displayedEmployeesBase].sort((a, b) => {
    if (displayMode === 'watched') {
      const watchedDiff = getWatchedCountByEmployee(b) - getWatchedCountByEmployee(a)
      if (watchedDiff !== 0) return watchedDiff
    } else {
      const diff = getUnwatchedCount(b) - getUnwatchedCount(a)
      if (diff !== 0) return diff
    }

    const companyDiff = a.company.localeCompare(b.company, 'ja')
    if (companyDiff !== 0) return companyDiff

    const affiliationDiff = (a.affiliation || '').localeCompare(b.affiliation || '', 'ja')
    if (affiliationDiff !== 0) return affiliationDiff

    const aName = `${a.last_name} ${a.first_name}`
    const bName = `${b.last_name} ${b.first_name}`
    return aName.localeCompare(bName, 'ja')
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`
  }

  const handleCSV = () => {
    if (!selectedChannelId) return

    const rows = [[
      '氏名',
      '会社',
      '所属',
      '未視聴数',
      ...channelEpisodes.map((ep) => ep.title + '（視聴日時）'),
    ]]

    displayedEmployees.forEach((emp) => {
      const fullName = emp.last_name + ' ' + emp.first_name
      const row = [fullName, emp.company, emp.affiliation || '', String(getUnwatchedCount(emp))]
      channelEpisodes.forEach((ep) => {
        const log = getWatchLog(fullName, ep.id)
        row.push(log ? formatDate(log.watched_at) : '未視聴')
      })
      rows.push(row)
    })

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `視聴状況_${selectedChannel?.title || ''}_${selectedCompany?.name || '全社'}_${selectedAffiliation || '全所属'}_${displayMode === 'unwatched' ? '未視聴ありのみ' : displayMode === 'watched' ? '視聴済みのみ' : '全件'}.csv`
    a.click()
  }

  const watchedCount = (episodeId: number) =>
    companyEmployees.filter((emp) =>
      getWatchLog(emp.last_name + ' ' + emp.first_name, episodeId)
    ).length

  const clearFilters = () => {
    setSelectedCompanyId(null)
    setSelectedAffiliation('')
    setSelectedChannelId(null)
    setDisplayMode('all')
  }

  const getDisplayModeLabel = () => {
    if (displayMode === 'unwatched') return '未視聴ありのみ'
    if (displayMode === 'watched') return '視聴済みのみ'
    return '全員表示'
  }

  const renderConditionBadges = () => {
    const badges = [
      {
        label: `会社: ${selectedCompany?.name || '全社員'}`,
        bg: '#dbeafe',
        color: '#1d4ed8',
      },
      {
        label: `所属: ${selectedAffiliation || '全所属'}`,
        bg: '#fef3c7',
        color: '#b45309',
      },
      {
        label: `表示: ${getDisplayModeLabel()}`,
        bg: '#fee2e2',
        color: '#b91c1c',
      },
    ]

    if (selectedChannel) {
      badges.push({
        label: `チャンネル: ${selectedChannel.title}`,
        bg: '#dcfce7',
        color: '#166534',
      })
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
        {badges.map((badge) => (
          <span
            key={badge.label}
            style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '6px 10px',
              borderRadius: '999px',
              backgroundColor: badge.bg,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
        ))}
      </div>
    )
  }

  const totalPossibleViews = companyEmployees.length * channelEpisodes.length
  const totalCompletedViews = channelEpisodes.reduce((sum, ep) => sum + watchedCount(ep.id), 0)
  const overallRate =
    totalPossibleViews === 0 ? 0 : Math.round((totalCompletedViews / totalPossibleViews) * 100)
  const remainingViews = totalPossibleViews - totalCompletedViews

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

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#1e3a5f',
            marginBottom: '24px',
          }}
        >
          📊 視聴状況ダッシュボード
        </h1>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dbeafe',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: '0 4px 14px rgba(30,58,95,0.06)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '6px' }}>
              絞り込み条件
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
              会社・所属・チャンネルを選ぶと、対象社員の視聴状況を下に表示します。
            </p>
            {renderConditionBadges()}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block',
                  fontWeight: '600',
                }}
              >
                ① 会社を選択（任意）
              </label>
              <select
                value={selectedCompanyId ?? ''}
                onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                }}
              >
                <option value="">全社員</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                  fontWeight: '600',
                }}
              >
                ② 所属を選択（任意）
              </label>
              <select
                value={selectedAffiliation}
                onChange={(e) => setSelectedAffiliation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                }}
              >
                <option value="">全所属</option>
                {affiliationOptions.map((affiliation) => (
                  <option key={affiliation} value={affiliation}>
                    {affiliation}
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
                  fontWeight: '600',
                }}
              >
                ③ チャンネルを選択
              </label>
              <select
                value={selectedChannelId ?? ''}
                onChange={(e) => setSelectedChannelId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                }}
              >
                <option value="">チャンネルを選んでください</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <label
                style={{
                  fontSize: '14px',
                  color: '#334155',
                  fontWeight: '600',
                }}
              >
                表示条件
              </label>
              <select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value as 'all' | 'unwatched' | 'watched')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                }}
              >
                <option value="all">全員表示</option>
                <option value="unwatched">未視聴がある社員だけ表示</option>
                <option value="watched">視聴済みの社員だけ表示</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              条件をクリア
            </button>
          </div>
        </div>

        {selectedChannelId && companyEmployees.length > 0 && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: '320px',
                  backgroundColor: '#1e3a5f',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '16px 20px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#93c5fd', marginBottom: '8px' }}>
                  現在の表示条件
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <strong>会社：</strong>{selectedCompany?.name || '全社員'}
                  <span style={{ margin: '0 12px', color: '#93c5fd' }}>|</span>
                  <strong>所属：</strong>{selectedAffiliation || '全所属'}
                  <span style={{ margin: '0 12px', color: '#93c5fd' }}>|</span>
                  <strong>チャンネル：</strong>{selectedChannel?.title}
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#bfdbfe' }}>
                  対象社員 {companyEmployees.length}名 ／ 表示中 {displayedEmployees.length}名
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#93c5fd', lineHeight: '1.7' }}>
                  チャンネル対象設定：{getChannelTargetSummary(selectedChannel)}
                </div>
              </div>

              <button
                onClick={handleCSV}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  minHeight: '52px',
                }}
              >
                📥 CSVダウンロード
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px 20px',
                marginBottom: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '6px' }}>
                チャンネル全体の進捗
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7', marginBottom: '12px' }}>
                対象社員と対象動画を合わせた全体の視聴率です。
              </div>
              <div style={{ fontSize: '14px', color: '#166534', fontWeight: 'bold', marginBottom: '8px' }}>
                {totalCompletedViews}/{totalPossibleViews} 件 視聴済み
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${overallRate}%`,
                    height: '100%',
                    backgroundColor: '#16a34a',
                  }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                全体進捗 {overallRate}%
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  対象社員数
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a5f' }}>
                  {companyEmployees.length}
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                  名
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  視聴済み件数
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {totalCompletedViews}
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                  件
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  未視聴件数
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                  {remainingViews}
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                  件
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '4px' }}>
                動画ごとの進捗
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
                各動画ごとに、何名が視聴済みかを先に確認できます。
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              {channelEpisodes.map((ep) => {
                const count = watchedCount(ep.id)
                const total = companyEmployees.length
                const rate = total === 0 ? 0 : Math.round((count / total) * 100)

                return (
                  <div
                    key={ep.id}
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                      #{ep.order_no}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#1e3a5f',
                        lineHeight: '1.6',
                        marginBottom: '10px',
                      }}
                    >
                      {ep.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold', marginBottom: '8px' }}>
                      {count}/{total}名 視聴済み
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${rate}%`,
                          height: '100%',
                          backgroundColor: '#16a34a',
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                      進捗 {rate}%
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '4px' }}>
                対象社員の視聴状況
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
                {displayMode === 'watched'
                  ? '視聴済みの社員だけを表示しています。横に長い表なので、左の「氏名・会社・所属」は固定しています。'
                  : '未視聴が多い社員から上に表示しています。横に長い表なので、左の「氏名・会社・所属」は固定しています。'}
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'auto',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '1080px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e3a5f' }}>
                    <th
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        color: '#fff',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        backgroundColor: '#1e3a5f',
                        minWidth: '160px',
                        boxShadow: '2px 0 0 #0f2742',
                      }}
                    >
                      氏名
                    </th>
                    <th
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        color: '#fff',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: '160px',
                        zIndex: 4,
                        backgroundColor: '#1e3a5f',
                        minWidth: '140px',
                        boxShadow: '2px 0 0 #0f2742',
                      }}
                    >
                      会社
                    </th>
                    <th
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        color: '#fff',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: '300px',
                        zIndex: 4,
                        backgroundColor: '#1e3a5f',
                        minWidth: '140px',
                        boxShadow: '2px 0 0 #0f2742',
                      }}
                    >
                      所属
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        textAlign: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#1e3a5f',
                        minWidth: '110px',
                      }}
                    >
                      未視聴数
                    </th>
                    {channelEpisodes.map((ep) => (
                      <th
                        key={ep.id}
                        style={{
                          padding: '14px 16px',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          backgroundColor: '#1e3a5f',
                          minWidth: '150px',
                        }}
                      >
                        #{ep.order_no} {ep.title}
                        <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '2px' }}>
                          {watchedCount(ep.id)}/{companyEmployees.length}名視聴済
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedEmployees.map((emp, i) => {
                    const fullName = emp.last_name + ' ' + emp.first_name
                    const rowBg = i % 2 === 0 ? '#fff' : '#f8fafc'
                    const unwatchedCount = getUnwatchedCount(emp)

                    return (
                      <tr
                        key={emp.id}
                        style={{
                          backgroundColor: rowBg,
                        }}
                      >
                        <td
                          style={{
                            padding: '12px 20px',
                            color: '#1e3a5f',
                            fontSize: '14px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            position: 'sticky',
                            left: 0,
                            zIndex: 3,
                            backgroundColor: rowBg,
                            minWidth: '160px',
                            borderTop: '1px solid #e2e8f0',
                            boxShadow: '2px 0 0 #e2e8f0',
                          }}
                        >
                          {fullName}
                        </td>
                        <td
                          style={{
                            padding: '12px 20px',
                            color: '#64748b',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            position: 'sticky',
                            left: '160px',
                            zIndex: 3,
                            backgroundColor: rowBg,
                            minWidth: '140px',
                            borderTop: '1px solid #e2e8f0',
                            boxShadow: '2px 0 0 #e2e8f0',
                          }}
                        >
                          {emp.company}
                        </td>
                        <td
                          style={{
                            padding: '12px 20px',
                            color: '#64748b',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            position: 'sticky',
                            left: '300px',
                            zIndex: 3,
                            backgroundColor: rowBg,
                            minWidth: '140px',
                            borderTop: '1px solid #e2e8f0',
                            boxShadow: '2px 0 0 #e2e8f0',
                          }}
                        >
                          {emp.affiliation || '-'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            borderTop: '1px solid #e2e8f0',
                            minWidth: '110px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              minWidth: '34px',
                              padding: '4px 8px',
                              borderRadius: '999px',
                              backgroundColor: unwatchedCount > 0 ? '#fee2e2' : '#dcfce7',
                              color: unwatchedCount > 0 ? '#b91c1c' : '#166534',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          >
                            {unwatchedCount}
                          </span>
                        </td>
                        {channelEpisodes.map((ep) => {
                          const log = getWatchLog(fullName, ep.id)
                          return (
                            <td
                              key={ep.id}
                              style={{
                                padding: '12px 16px',
                                textAlign: 'center',
                                borderTop: '1px solid #e2e8f0',
                                minWidth: '150px',
                              }}
                            >
                              {log ? (
                                <div>
                                  <div
                                    style={{
                                      color: '#16a34a',
                                      fontWeight: 'bold',
                                      fontSize: '14px',
                                    }}
                                  >
                                    ✅
                                  </div>
                                  <div
                                    style={{
                                      color: '#64748b',
                                      fontSize: '11px',
                                      marginTop: '2px',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {formatDate(log.watched_at)}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#ef4444', fontSize: '14px' }}>❌</span>
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

        {selectedChannelId && companyEmployees.length > 0 && displayedEmployees.length === 0 && (
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#1e3a5f', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              表示できる社員がいません
            </div>
            <p style={{ color: '#94a3b8', margin: 0, lineHeight: '1.7' }}>
              {displayMode === 'watched'
                ? '今の条件では、視聴済みの社員が見つかりません。表示条件を「全員表示」に戻すと確認しやすいです。'
                : displayMode === 'unwatched'
                  ? '今の条件では、未視聴がある社員が見つかりません。「全員表示」に戻すと全体を確認できます。'
                  : '今の条件では表示できる社員がいません。条件を見直してください。'}
            </p>
          </div>
        )}

        {selectedChannelId && companyEmployees.length === 0 && (
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#1e3a5f', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              対象社員が見つかりません
            </div>
            <p style={{ color: '#94a3b8', margin: 0, lineHeight: '1.7' }}>
              チャンネル対象設定と、今の絞り込み条件に合う社員がいません。<br />
              会社・所属・チャンネルの組み合わせを見直してください。
            </p>
          </div>
        )}

        {!selectedChannelId && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '8px' }}>
              チャンネルを選択してください
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.7' }}>
              上の絞り込み条件からチャンネルを選ぶと、視聴状況を表示します。
            </p>
          </div>
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          padding: '20px 40px',
          textAlign: 'center',
          marginTop: '40px',
        }}
      >
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
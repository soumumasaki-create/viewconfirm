'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Channel = {
  id: number
  title: string
  description: string
  thumbnail_url: string
  target_scope: string
  target_companies: string[]
  target_affiliations: string[]
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

type NamePair = {
  last: string
  first: string
}

type Company = {
  id: number
  name: string
}

type WatchLog = {
  episode_id: number
  user_name: string
}

function appendYouTubeEmbedParams(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}rel=0&modestbranding=1&playsinline=1&disablekb=1&controls=0&fs=0&enablejsapi=1`
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    if (!url) return null

    if (url.includes('youtube.com/embed/')) {
      return appendYouTubeEmbedParams(url)
    }

    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
    if (shortMatch?.[1]) {
      return appendYouTubeEmbedParams(
        `https://www.youtube.com/embed/${shortMatch[1]}`
      )
    }

    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
    if (watchMatch?.[1]) {
      return appendYouTubeEmbedParams(
        `https://www.youtube.com/embed/${watchMatch[1]}`
      )
    }

    return null
  } catch {
    return null
  }
}

function getGoogleDriveFileId(url: string): string | null {
  try {
    if (!url) return null

    const match1 = url.match(/\/file\/d\/([^/]+)/)
    if (match1?.[1]) return match1[1]

    const match2 = url.match(/[?&]id=([^&]+)/)
    if (match2?.[1]) return match2[1]

    return null
  } catch {
    return null
  }
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().includes('.pdf')
}

function getMediaInfo(url: string) {
  const youtubeEmbed = getYouTubeEmbedUrl(url)
  if (youtubeEmbed) {
    return {
      type: 'youtube' as const,
      src: youtubeEmbed,
    }
  }

  if (url.includes('drive.google.com')) {
    const fileId = getGoogleDriveFileId(url)
    if (fileId) {
      return {
        type: 'drive' as const,
        src: `https://drive.google.com/file/d/${fileId}/preview`,
      }
    }
  }

  if (isPdfUrl(url)) {
    return {
      type: 'pdf' as const,
      src: url,
    }
  }

  return {
    type: 'iframe' as const,
    src: url,
  }
}

function includesTargetValue(list: string[] | null | undefined, value: string) {
  if (!list || list.length === 0) return false
  return list.includes(value)
}

function canViewChannel(
  channel: Channel,
  employeeCompany: string,
  employeeAffiliation: string
) {
  if (!channel.target_scope || channel.target_scope === 'all') return true

  const companies = channel.target_companies || []
  const affiliations = channel.target_affiliations || []

  const companyMatched =
    companies.length === 0 || includesTargetValue(companies, employeeCompany)

  const affiliationMatched =
    affiliations.length === 0 || includesTargetValue(affiliations, employeeAffiliation)

  return companyMatched && affiliationMatched
}

function formatSeconds(totalSeconds: number) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}分${String(seconds).padStart(2, '0')}秒`
}

function getWatchProgressStorageKey(episodeId: number, userKey: string) {
  return `watch-progress:${userKey}:episode:${episodeId}`
}

export default function WatchPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)

  const [myName, setMyName] = useState('')
  const [subNames, setSubNames] = useState<NamePair[]>([
    { last: '', first: '' },
    { last: '', first: '' },
    { last: '', first: '' },
    { last: '', first: '' },
  ])

  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [watched, setWatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [watchLogs, setWatchLogs] = useState<WatchLog[]>([])
  const [isEmployee, setIsEmployee] = useState(false)
  const [loginName, setLoginName] = useState('')
  const [canComplete, setCanComplete] = useState(false)
  const [employeeCompany, setEmployeeCompany] = useState('')
  const [employeeAffiliation, setEmployeeAffiliation] = useState('')
  const [completionMessage, setCompletionMessage] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const remainingRef = useRef(0)
  const pageActiveRef = useRef(true)

  const getProgressUserKey = () => {
    if (isEmployee && loginName) return loginName
    if (myName.trim()) return myName.trim()
    return 'guest'
  }

  const loadSavedRemainingSeconds = (episodeId: number, defaultSeconds: number) => {
    if (typeof window === 'undefined') return defaultSeconds

    try {
      const storageKey = getWatchProgressStorageKey(episodeId, getProgressUserKey())
      const savedValue = window.sessionStorage.getItem(storageKey)

      if (!savedValue) return defaultSeconds

      const parsed = Number(savedValue)
      if (!Number.isFinite(parsed)) return defaultSeconds

      return Math.max(0, Math.min(defaultSeconds, parsed))
    } catch {
      return defaultSeconds
    }
  }

  const saveRemainingSeconds = (episodeId: number, seconds: number) => {
    if (typeof window === 'undefined') return

    try {
      const storageKey = getWatchProgressStorageKey(episodeId, getProgressUserKey())
      window.sessionStorage.setItem(storageKey, String(Math.max(0, seconds)))
    } catch {
      // 何もしない
    }
  }

  const clearSavedRemainingSeconds = (episodeId: number) => {
    if (typeof window === 'undefined') return

    try {
      const storageKey = getWatchProgressStorageKey(episodeId, getProgressUserKey())
      window.sessionStorage.removeItem(storageKey)
    } catch {
      // 何もしない
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: ch } = await supabase.from('channels').select('*').order('id')
      if (ch) setChannels(ch as Channel[])

      const { data: ep } = await supabase.from('episodes').select('*').order('order_no')
      if (ep) setEpisodes(ep as Episode[])

      const { data: co } = await supabase.from('companies').select('*').order('id')
      if (co) setCompanies(co)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email?.endsWith('@viewconfirm.internal')) {
        setIsEmployee(true)

        const { data: emp } = await supabase
          .from('employees')
          .select('last_name, first_name, company, affiliation')
          .eq('email', user.email)
          .single()

        if (emp) {
          const fullName = `${emp.last_name} ${emp.first_name}`
          setLoginName(fullName)
          setMyName(fullName)
          setEmployeeCompany(emp.company || '')
          setEmployeeAffiliation(emp.affiliation || '')

          const { data: co2 } = await supabase
            .from('companies')
            .select('*')
            .eq('name', emp.company)
            .single()

          if (co2) {
            setCompanyId(String(co2.id))
          }
        }
      }

      const { data: wl } = await supabase.from('watch_logs').select('episode_id, user_name')
      if (wl) setWatchLogs(wl)
    }

    fetchData()
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleVisibilityOrFocusChange = () => {
      pageActiveRef.current = !document.hidden && document.hasFocus()
    }

    handleVisibilityOrFocusChange()

    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange)
    window.addEventListener('focus', handleVisibilityOrFocusChange)
    window.addEventListener('blur', handleVisibilityOrFocusChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange)
      window.removeEventListener('focus', handleVisibilityOrFocusChange)
      window.removeEventListener('blur', handleVisibilityOrFocusChange)
    }
  }, [])

  useEffect(() => {
    const stopEvent = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const stopKeyEvent = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (
        e.ctrlKey &&
        (key === 'c' || key === 'x' || key === 's' || key === 'u' || key === 'p')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (key === 'f12') {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('contextmenu', stopEvent, true)
    document.addEventListener('copy', stopEvent, true)
    document.addEventListener('cut', stopEvent, true)
    document.addEventListener('dragstart', stopEvent, true)
    document.addEventListener('selectstart', stopEvent, true)
    document.addEventListener('keydown', stopKeyEvent, true)

    return () => {
      document.removeEventListener('contextmenu', stopEvent, true)
      document.removeEventListener('copy', stopEvent, true)
      document.removeEventListener('cut', stopEvent, true)
      document.removeEventListener('dragstart', stopEvent, true)
      document.removeEventListener('selectstart', stopEvent, true)
      document.removeEventListener('keydown', stopKeyEvent, true)
    }
  }, [])

  const isEpisodeWatched = (episodeId: number) => {
    if (isEmployee && loginName) {
      return watchLogs.some(
        (w) => w.episode_id === episodeId && w.user_name === loginName
      )
    }
    return watchLogs.some((w) => w.episode_id === episodeId)
  }

  useEffect(() => {
    if (!selectedEpisode || canComplete) return
    if (selectedEpisode.content_type === 'document') return
    if (isEpisodeWatched(selectedEpisode.id)) return

    if (remainingSeconds <= 0) {
      setCanComplete(true)
      setCompletionMessage('')
      clearSavedRemainingSeconds(selectedEpisode.id)
      return
    }

    if (pageActiveRef.current) {
      setCompletionMessage(
        `初回視聴中です。あと${formatSeconds(remainingSeconds)}で「視聴完了」ボタンが表示されます。`
      )
    } else {
      setCompletionMessage(
        `この画面を開いて視聴を続けてください。あと${formatSeconds(remainingSeconds)}で「視聴完了」ボタンが表示されます。`
      )
    }
  }, [selectedEpisode, remainingSeconds, canComplete, watchLogs, loginName, isEmployee])

  const handleSelectEpisode = (ep: Episode) => {
    setSelectedEpisode(ep)
    setWatched(false)
    setCompletionMessage('')
    setRemainingSeconds(0)
    remainingRef.current = 0

    if (timerRef.current) clearInterval(timerRef.current)

    if (isEpisodeWatched(ep.id)) {
      setCanComplete(true)
      clearSavedRemainingSeconds(ep.id)
      return
    }

    if (ep.content_type === 'document') {
      setCanComplete(!!ep.require_manual_check)
      return
    }

    const waitSeconds = ep.completion_seconds && ep.completion_seconds > 0
      ? ep.completion_seconds
      : 180

    const initialRemainingSeconds = loadSavedRemainingSeconds(ep.id, waitSeconds)

    setCanComplete(false)
    setRemainingSeconds(initialRemainingSeconds)
    remainingRef.current = initialRemainingSeconds
    saveRemainingSeconds(ep.id, initialRemainingSeconds)

    timerRef.current = setInterval(() => {
      if (!pageActiveRef.current) return

      remainingRef.current -= 1
      const nextValue = Math.max(0, remainingRef.current)

      setRemainingSeconds(nextValue)
      saveRemainingSeconds(ep.id, nextValue)

      if (nextValue <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        setCanComplete(true)
        setCompletionMessage('')
        clearSavedRemainingSeconds(ep.id)
      }
    }, 1000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/employee-login'
  }

  const handleComplete = async () => {
    if (!selectedEpisode) return

    const effectiveName = isEmployee ? (loginName || myName) : myName
    const effectiveCompanyId = companyId

    if (!effectiveName || !effectiveCompanyId) return

    setLoading(true)

    const allNames = [
      effectiveName,
      ...subNames
        .filter((n) => n.last.trim() !== '' || n.first.trim() !== '')
        .map((n) => `${n.last} ${n.first}`.trim()),
    ]

    const newLogs: WatchLog[] = []

    for (const name of allNames) {
      await supabase.from('watch_logs').insert({
        user_name: name,
        company_id: Number(effectiveCompanyId),
        episode_id: selectedEpisode.id,
        watched_at: new Date().toISOString(),
      })
      newLogs.push({ episode_id: selectedEpisode.id, user_name: name })
    }

    clearSavedRemainingSeconds(selectedEpisode.id)
    setWatched(true)
    setWatchLogs([...watchLogs, ...newLogs])
    setLoading(false)
  }

  const handleSubNameChange = (
    index: number,
    field: 'last' | 'first',
    value: string
  ) => {
    const newNames = [...subNames]
    newNames[index][field] = value
    setSubNames(newNames)
  }

  const visibleChannels =
    isEmployee && employeeCompany && employeeAffiliation
      ? channels.filter((ch) =>
          canViewChannel(ch, employeeCompany, employeeAffiliation)
        )
      : channels

  const channelEpisodes = selectedChannel
    ? episodes.filter((ep) => ep.channel_id === selectedChannel.id)
    : []

  const renderMedia = () => {
    if (!selectedEpisode?.video_url) return null

    const media = getMediaInfo(selectedEpisode.video_url)

    if (media.type === 'youtube') {
      return (
        <iframe
          width="100%"
          height="360"
          src={media.src}
          title={selectedEpisode.title}
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            borderRadius: '12px',
            marginBottom: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'block',
            backgroundColor: '#000',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'auto',
          }}
        />
      )
    }

    if (media.type === 'drive') {
      return (
        <iframe
          width="100%"
          height="700"
          src={media.src}
          title={selectedEpisode.title}
          allow="autoplay"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            border: 'none',
            borderRadius: '12px',
            marginBottom: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'block',
            backgroundColor: '#fff',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      )
    }

    if (media.type === 'pdf') {
      return (
        <iframe
          width="100%"
          height="700"
          src={media.src}
          title={selectedEpisode.title}
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            marginBottom: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'block',
            backgroundColor: '#fff',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      )
    }

    return (
      <iframe
        width="100%"
        height="700"
        src={media.src}
        title={selectedEpisode.title}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          border: 'none',
          borderRadius: '12px',
          marginBottom: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'block',
          backgroundColor: '#fff',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'sans-serif',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <header
        style={{
          backgroundColor: '#1e3a5f',
          padding: '0 20px',
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
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
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            VC
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
              ViewConfirm
            </div>
            <div style={{ fontSize: '10px', color: '#93c5fd', letterSpacing: '0.1em' }}>
              MIRAI GROUP
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 0',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {isEmployee && loginName && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '2px',
              }}
            >
              <span style={{ color: '#bfdbfe', fontSize: '13px', fontWeight: 'bold' }}>
                {loginName}
              </span>

              {employeeCompany && (
                <span style={{ color: '#e2e8f0', fontSize: '12px' }}>
                  会社：{employeeCompany}
                </span>
              )}

              {employeeAffiliation && (
                <span style={{ color: '#e2e8f0', fontSize: '12px' }}>
                  所属：{employeeAffiliation}
                </span>
              )}
            </div>
          )}

          {isEmployee ? (
            <button
              onClick={handleLogout}
              style={{
                padding: '7px 16px',
                backgroundColor: 'transparent',
                color: '#fff',
                border: '1px solid #93c5fd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              ログアウト
            </button>
          ) : (
            <a
              href="/"
              style={{ color: '#93c5fd', fontSize: '13px', textDecoration: 'none' }}
            >
              ← トップに戻る
            </a>
          )}
        </div>
      </header>

      <main style={{ padding: '24px 20px 40px', maxWidth: '900px', margin: '0 auto' }}>
        {!selectedChannel && !selectedEpisode && (
          <div>
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '6px' }}>
                視聴するチャンネルを選んでください
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>
                表示されているチャンネルは、あなたの会社・所属に合うものだけです。
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              {visibleChannels.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {ch.thumbnail_url ? (
                    <img
                      src={ch.thumbnail_url}
                      alt={ch.title}
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        objectFit: 'contain',
                        backgroundColor: '#f1f5f9',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        backgroundColor: '#1e3a5f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#fff',
                        fontWeight: 'bold',
                      }}
                    >
                      CH
                    </div>
                  )}

                  <div style={{ padding: '12px 14px' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#1e3a5f',
                        lineHeight: '1.5',
                      }}
                    >
                      {ch.title}
                    </div>
                    {ch.description && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.6 }}>
                        {ch.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {visibleChannels.length === 0 && (
              <p style={{ color: '#94a3b8', marginTop: '16px' }}>
                表示できるチャンネルがありません
              </p>
            )}
          </div>
        )}

        {selectedChannel && !selectedEpisode && (
          <div>
            <button
              onClick={() => setSelectedChannel(null)}
              style={{
                marginBottom: '16px',
                padding: '8px 16px',
                backgroundColor: '#f1f5f9',
                color: '#1e3a5f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ← チャンネル一覧に戻る
            </button>

            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {selectedChannel.thumbnail_url ? (
                <img
                  src={selectedChannel.thumbnail_url}
                  alt={selectedChannel.title}
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    objectFit: 'contain',
                    backgroundColor: '#f1f5f9',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '140px',
                    backgroundColor: '#1e3a5f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  CH
                </div>
              )}

              <div style={{ padding: '18px 20px' }}>
                <h2
                  style={{
                    fontSize: '19px',
                    fontWeight: 'bold',
                    color: '#1e3a5f',
                    marginBottom: '6px',
                  }}
                >
                  {selectedChannel.title}
                </h2>
                {selectedChannel.description && (
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>
                    {selectedChannel.description}
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '6px' }}>
                コンテンツ一覧
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>
                上から順番に見てください。前の項目を見終わると、次を開けます。
              </div>
            </div>

            {channelEpisodes.length === 0 && <p style={{ color: '#94a3b8' }}>コンテンツがありません</p>}

            {channelEpisodes.map((ep, index) => {
              const isLocked = index > 0 && !isEpisodeWatched(channelEpisodes[index - 1].id)
              const isWatched = isEpisodeWatched(ep.id)
              const isDocument = ep.content_type === 'document'

              return (
                <div
                  key={ep.id}
                  onClick={() => !isLocked && handleSelectEpisode(ep)}
                  style={{
                    backgroundColor: isWatched ? '#f0fdf4' : '#fff',
                    border: `1px solid ${isWatched ? '#86efac' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isWatched ? '#16a34a' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    {isWatched ? 'OK' : isDocument ? '資' : '▶'}
                  </div>

                  <span
                    style={{
                      fontSize: '15px',
                      color: '#1e3a5f',
                      fontWeight: '500',
                      flex: 1,
                      lineHeight: 1.5,
                    }}
                  >
                    第{ep.order_no}回　{ep.title}
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      color: isDocument ? '#b45309' : '#166534',
                      fontWeight: 'bold',
                      backgroundColor: isDocument ? '#fef3c7' : '#dcfce7',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isDocument ? '資料' : '動画'}
                  </span>

                  {isWatched && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#16a34a',
                        fontWeight: 'bold',
                        backgroundColor: '#dcfce7',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      視聴済み
                    </span>
                  )}

                  {isLocked && (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>ロック中</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {selectedEpisode && (
          <div>
            <button
              onClick={() => {
                setSelectedEpisode(null)
                if (timerRef.current) clearInterval(timerRef.current)
                setCompletionMessage('')
                setRemainingSeconds(0)
                remainingRef.current = 0
              }}
              style={{
                marginBottom: '16px',
                padding: '8px 16px',
                backgroundColor: '#f1f5f9',
                color: '#1e3a5f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ← 一覧に戻る
            </button>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '19px',
                  fontWeight: 'bold',
                  color: '#1e3a5f',
                  marginBottom: '6px',
                }}
              >
                第{selectedEpisode.order_no}回　{selectedEpisode.title}
              </h2>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>
                {selectedEpisode.content_type === 'document'
                  ? '資料を確認したあと、下の完了ボタンを押してください。'
                  : `動画を見終わったあと、下の「視聴完了」を押してください。完了までの時間は ${formatSeconds(
                      selectedEpisode.completion_seconds || 180
                    )} です。`}
              </div>
            </div>

            {renderMedia()}

            <div
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fdba74',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#9a3412',
                fontSize: '13px',
                lineHeight: 1.7,
                marginBottom: '16px',
              }}
            >
              この画面では、右クリックやコピーをしにくくしています。動画URLや資料URLの共有・持ち出しは禁止です。
            </div>

            {!watched && canComplete && (
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#1e3a5f',
                    marginBottom: '8px',
                  }}
                >
                  {selectedEpisode.content_type === 'document' ? '閲覧完了を記録する' : '視聴完了を記録する'}
                </h3>

                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.7 }}>
                  複数人で一緒に見た場合は、下に氏名2〜5も入力してください。
                </p>

                {isEmployee ? (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', fontWeight: 'bold' }}>
                      ログイン中の社員情報を自動で使用します
                    </div>

                    <div style={{ fontSize: '14px', color: '#0f172a', marginBottom: '8px' }}>
                      会社：{employeeCompany || '未設定'}
                    </div>

                    <div style={{ fontSize: '14px', color: '#0f172a' }}>
                      氏名1（自分）：{loginName || myName || '未設定'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label
                        style={{
                          fontSize: '13px',
                          color: '#475569',
                          marginBottom: '6px',
                          display: 'block',
                        }}
                      >
                        会社
                      </label>
                      <select
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
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
                        {companies.map((co) => (
                          <option key={co.id} value={co.id}>
                            {co.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label
                        style={{
                          fontSize: '13px',
                          color: '#475569',
                          marginBottom: '6px',
                          display: 'block',
                          fontWeight: '600',
                        }}
                      >
                        氏名1（自分）
                      </label>
                      <input
                        value={myName}
                        onChange={(e) => setMyName(e.target.value)}
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
                  </>
                )}

                {subNames.map((name, index) => (
                  <div key={index} style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        fontSize: '13px',
                        color: '#475569',
                        marginBottom: '6px',
                        display: 'block',
                      }}
                    >
                      氏名{index + 2}（任意）
                    </label>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                      }}
                    >
                      <input
                        placeholder="姓"
                        value={name.last}
                        onChange={(e) =>
                          handleSubNameChange(index, 'last', e.target.value)
                        }
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '15px',
                          color: '#0f172a',
                          backgroundColor: '#fafafa',
                          boxSizing: 'border-box',
                        }}
                      />
                      <input
                        placeholder="名"
                        value={name.first}
                        onChange={(e) =>
                          handleSubNameChange(index, 'first', e.target.value)
                        }
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '15px',
                          color: '#0f172a',
                          backgroundColor: '#fafafa',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleComplete}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '8px',
                  }}
                >
                  {loading
                    ? '記録中...'
                    : selectedEpisode.content_type === 'document'
                      ? '閲覧完了'
                      : '視聴完了'}
                </button>
              </div>
            )}

            {!watched && !canComplete && (
              <div
                style={{
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fdba74',
                  borderRadius: '12px',
                  padding: '20px',
                  color: '#9a3412',
                  lineHeight: 1.7,
                }}
              >
                {completionMessage || '視聴中です。完了ボタンはまだ表示されません。'}
              </div>
            )}

            {watched && (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '20px',
                    color: '#16a34a',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                  }}
                >
                  {selectedEpisode.content_type === 'document'
                    ? '閲覧完了を記録しました'
                    : '視聴完了を記録しました'}
                </p>

                <button
                  onClick={() => setSelectedEpisode(null)}
                  style={{
                    padding: '10px 28px',
                    backgroundColor: '#1e3a5f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  一覧に戻る
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
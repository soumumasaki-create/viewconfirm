'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Channel = {
  id: number
  title: string
  description: string
  published: boolean
  thumbnail_url: string
  target_scope: string
  target_affiliations: string[]
}

const ALL_AFFILIATIONS = ['ドライバー', 'リフトオペレーター', '事務職', '管理職']

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [targetScope, setTargetScope] = useState('all')
  const [targetAffiliations, setTargetAffiliations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [editChannel, setEditChannel] = useState<Channel | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null)
  const [editThumbnailPreview, setEditThumbnailPreview] = useState('')
  const [editTargetScope, setEditTargetScope] = useState('all')
  const [editTargetAffiliations, setEditTargetAffiliations] = useState<string[]>([])
  const [editLoading, setEditLoading] = useState(false)

  const fetchChannels = async () => {
    const { data } = await supabase.from('channels').select('*').order('id')
    if (data) setChannels(data)
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    if (targetScope === 'all') {
      setTargetAffiliations([])
    }
  }, [targetScope])

  useEffect(() => {
    if (editTargetScope === 'all') {
      setEditTargetAffiliations([])
    }
  }, [editTargetScope])

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

  const toggleCreateAffiliation = (value: string) => {
    setTargetAffiliations((prev) =>
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
      target_affiliations: targetScope === 'all' ? [] : targetAffiliations,
    })

    setTitle('')
    setDescription('')
    setThumbnailFile(null)
    setThumbnailPreview('')
    setTargetScope('all')
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
    setEditTargetAffiliations(ch.target_affiliations || [])
  }

  const handleEditSave = async () => {
    if (!editChannel || !editTitle) return
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

  const getTargetLabel = (ch: Channel) => {
    if (ch.target_scope === 'all') return '全社員対象'
    if (!ch.target_affiliations || ch.target_affiliations.length === 0) return '未設定'
    return ch.target_affiliations.join(' / ')
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

      <main style={{ padding:'40px', maxWidth:'900px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'32px' }}>📁 チャンネル管理</h1>

        <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'32px', marginBottom:'32px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'20px' }}>新しいチャンネルを作成</h2>

          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>チャンネル名</label>
            <input
              placeholder="例: 運転マニュアル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }}
            />
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>説明（任意）</label>
            <input
              placeholder="チャンネルの説明を入力"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }}
            />
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>対象設定</label>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }}
            >
              <option value="all">全社員対象</option>
              <option value="selected">所属を選択する</option>
            </select>
          </div>

          {targetScope === 'selected' && (
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'10px', display:'block' }}>対象所属</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:'10px' }}>
                {ALL_AFFILIATIONS.map((affiliation) => (
                  <label key={affiliation} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', color:'#334155', backgroundColor:'#f8fafc', border:'1px solid #cbd5e1', borderRadius:'8px', padding:'10px 12px' }}>
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
          )}

          <div style={{ marginBottom:'20px' }}>
            <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>サムネイル画像（任意）</label>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize:'14px', color:'#475569' }} />
            {thumbnailPreview && (
              <img src={thumbnailPreview} alt="プレビュー" style={{ marginTop:'12px', width:'100%', objectFit:'contain', borderRadius:'8px', border:'1px solid #e2e8f0', backgroundColor:'#f1f5f9' }} />
            )}
          </div>

          <button onClick={handleCreate} disabled={loading} style={{ padding:'10px 28px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px', fontWeight:'bold' }}>
            {loading ? '作成中...' : '作成する'}
          </button>
        </div>

        <h2 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'16px' }}>チャンネル一覧</h2>
        {channels.length === 0 && <p style={{ color:'#94a3b8' }}>チャンネルがまだありません</p>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px' }}>
          {channels.map((ch) => (
            <div key={ch.id} style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              {ch.thumbnail_url ? (
                <img src={ch.thumbnail_url} alt={ch.title} style={{ width:'100%', objectFit:'contain', backgroundColor:'#f1f5f9' }} />
              ) : (
                <div style={{ width:'100%', height:'140px', backgroundColor:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px' }}>📁</div>
              )}
              <div style={{ padding:'16px' }}>
                <h3 style={{ fontSize:'16px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'6px' }}>{ch.title}</h3>
                {ch.description && <p style={{ color:'#64748b', fontSize:'13px', marginBottom:'12px' }}>{ch.description}</p>}
                <p style={{ color:'#475569', fontSize:'13px', marginBottom:'10px' }}>対象: {getTargetLabel(ch)}</p>
                <span style={{ fontSize:'12px', padding:'3px 10px', borderRadius:'20px', backgroundColor: ch.published ? '#dcfce7' : '#fef9c3', color: ch.published ? '#16a34a' : '#ca8a04', fontWeight:'bold' }}>
                  {ch.published ? '公開中' : '非公開'}
                </span>
                <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
                  <button onClick={() => handleEditOpen(ch)} style={{ flex:1, padding:'7px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>編集</button>
                  <button onClick={() => handleDelete(ch.id, ch.title)} style={{ flex:1, padding:'7px', backgroundColor:'#ef4444', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>削除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {editChannel && (
        <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ backgroundColor:'#fff', borderRadius:'12px', padding:'32px', width:'100%', maxWidth:'500px', margin:'0 20px' }}>
            <h2 style={{ fontSize:'18px', fontWeight:'bold', color:'#1e3a5f', marginBottom:'24px' }}>チャンネルを編集</h2>

            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>チャンネル名</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }}
              />
            </div>

            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>説明</label>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }}
              />
            </div>

            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>対象設定</label>
              <select
                value={editTargetScope}
                onChange={(e) => setEditTargetScope(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'15px', color:'#0f172a', backgroundColor:'#f8fafc', boxSizing:'border-box' }}
              >
                <option value="all">全社員対象</option>
                <option value="selected">所属を選択する</option>
              </select>
            </div>

            {editTargetScope === 'selected' && (
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'13px', color:'#475569', marginBottom:'10px', display:'block' }}>対象所属</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:'10px' }}>
                  {ALL_AFFILIATIONS.map((affiliation) => (
                    <label key={affiliation} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', color:'#334155', backgroundColor:'#f8fafc', border:'1px solid #cbd5e1', borderRadius:'8px', padding:'10px 12px' }}>
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
            )}

            <div style={{ marginBottom:'24px' }}>
              <label style={{ fontSize:'13px', color:'#475569', marginBottom:'6px', display:'block' }}>サムネイル画像</label>
              <input type="file" accept="image/*" onChange={handleEditFileChange} style={{ fontSize:'14px', color:'#475569' }} />
              {editThumbnailPreview && (
                <img src={editThumbnailPreview} alt="プレビュー" style={{ marginTop:'12px', width:'100%', objectFit:'contain', borderRadius:'8px', border:'1px solid #e2e8f0', backgroundColor:'#f1f5f9' }} />
              )}
            </div>

            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setEditChannel(null)} style={{ flex:1, padding:'10px', backgroundColor:'#f1f5f9', color:'#475569', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px' }}>キャンセル</button>
              <button onClick={handleEditSave} disabled={editLoading} style={{ flex:1, padding:'10px', backgroundColor:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px', fontWeight:'bold' }}>
                {editLoading ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ borderTop:'1px solid #e2e8f0', padding:'20px 40px', textAlign:'center', marginTop:'40px' }}>
        <p style={{ color:'#94a3b8', fontSize:'12px' }}>© 2026 MIRAI Group. ViewConfirm.</p>
      </footer>
    </div>
  )
}
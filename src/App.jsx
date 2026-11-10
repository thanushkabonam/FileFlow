import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import {
  Activity, BarChart3, Cloud, Download, File, FileImage, FileText, Folder,
  FolderPlus, HardDrive, LayoutDashboard, LogOut, Menu, Search, Share2,
  Trash2, UploadCloud, Users, X, FileArchive, Presentation, ShieldCheck
} from 'lucide-react'
import { getBlob, removeBlob, saveBlob } from './lib/localFiles'

const USERS_KEY = 'fileflow_users_v1'
const META_KEY = 'fileflow_files_v1'
const FOLDER_KEY = 'fileflow_folders_v1'
const ACTIVITY_KEY = 'fileflow_activity_v1'
const SESSION_KEY = 'fileflow_session_v1'
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) } catch { return fallback } }
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
const sizeLabel = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(1)} MB`
function FileIcon({name}) {
  const props = {size:20}
  if (/\.(png|jpe?g|gif|webp)$/i.test(name)) return <FileImage {...props}/>
  if (/\.pdf$/i.test(name)) return <FileText {...props}/>
  if (/\.(zip|rar|7z)$/i.test(name)) return <FileArchive {...props}/>
  if (/\.pptx?$/i.test(name)) return <Presentation {...props}/>
  return <File {...props}/>
}

function Auth({onLogin, initial='login'}) {
  const [mode,setMode] = useState(initial), [error,setError] = useState('')
  function submit(e) {
    e.preventDefault(); setError('')
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email')).trim().toLowerCase()
    const password = String(data.get('password'))
    const users = read(USERS_KEY, [])
    if (mode === 'signup') {
      const name = String(data.get('name')).trim()
      if (users.some(u=>u.email===email)) return setError('An account with this email already exists.')
      const user = {id:uid(),name,email,password}
      write(USERS_KEY,[...users,user]); onLogin({id:user.id,name,email})
    } else {
      const user = users.find(u=>u.email===email && u.password===password)
      if (!user) return setError('Invalid email or password. Create an account first.')
      onLogin({id:user.id,name:user.name,email:user.email})
    }
  }
  return <div className="auth-page"><section className="auth-art"><div className="brand"><span className="brand-icon">F</span> FileFlow<span className="dot">.</span></div><div><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h1>Your files.<br/>Your space.<br/>Your flow.</h1><p>Everything you need to organize, manage and share what matters — all in one place.</p><div className="art-points"><span>✦ Simple</span><span>✦ Organized</span><span>✦ Connected</span></div></div><small>FileFlow · Frontend project demo</small></section><section className="auth-side"><form className="auth-form" onSubmit={submit}><span className="tag"><ShieldCheck size={14}/> DEMO WORKSPACE</span><h2>{mode==='login'?'Welcome back':'Create your account'}</h2><p className="muted">{mode==='login'?'Enter your details to access your workspace.':'Start organizing your files today.'}</p>{mode==='signup'&&<label>Full name<input name="name" placeholder="Your full name" required minLength="2"/></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" required/></label><label>Password<input name="password" type="password" placeholder="At least 6 characters" minLength="6" required/></label><button className="btn primary full">{mode==='login'?'Log in →':'Create account →'}</button>{error&&<p className="notice">{error}</p>}<p className="switch">{mode==='login'?"Don't have an account?":"Already have an account?"} <button type="button" className="text-btn" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode==='login'?'Sign up':'Log in'}</button></p><p className="auth-note">Frontend demonstration only. Account details are stored in this browser and are not suitable for real passwords.</p></form></section></div>
}

const navItems = [['Dashboard',LayoutDashboard],['My Files',FileText],['Folders',Folder],['Shared',Users],['Activity',Activity],['Analytics',BarChart3]]
function App() {
  const [user,setUser] = useState(()=>read(SESSION_KEY,null))
  const [page,setPage] = useState('Dashboard')
  const [files,setFiles] = useState([])
  const [folders,setFolders] = useState([])
  const [activities,setActivities] = useState([])
  const [search,setSearch] = useState('')
  const [folderFilter,setFolderFilter] = useState('')
  const [uploading,setUploading] = useState(false)
  const [mobileOpen,setMobileOpen] = useState(false)
  const [folderName,setFolderName] = useState('')
  const [showFolder,setShowFolder] = useState(false)
  const [notice,setNotice] = useState('')
  const navigate = useNavigate()
  const userFilesKey = user ? `${META_KEY}_${user.id}` : ''
  const userFoldersKey = user ? `${FOLDER_KEY}_${user.id}` : ''
  const userActivityKey = user ? `${ACTIVITY_KEY}_${user.id}` : ''

  useEffect(()=>{ if(user){setFiles(read(userFilesKey,[]));setFolders(read(userFoldersKey,['Projects','Documents','Images','Design','Development','Shared Work'].map(name=>({id:uid(),name}))));setActivities(read(userActivityKey,[]))} },[user?.id])
  useEffect(()=>{if(notice){const t=setTimeout(()=>setNotice(''),3000);return()=>clearTimeout(t)}},[notice])
  function saveFiles(next){setFiles(next);write(userFilesKey,next)}
  function log(action){const next=[{id:uid(),action,date:new Date().toISOString()},...activities].slice(0,60);setActivities(next);write(userActivityKey,next)}
  function login(next){setUser(next);write(SESSION_KEY,next);navigate('/')}
  function logout(){localStorage.removeItem(SESSION_KEY);setUser(null);setFiles([]);setFolders([]);setActivities([]);setPage('Dashboard');navigate('/')}

  async function uploadFiles(list) {
    if(!list?.length)return
    setUploading(true)
    for(const file of Array.from(list)){
      const id=uid()
      try {
        await saveBlob(id,file)
        const item={id,name:file.name,size:file.size,type:file.type,folderId:folderFilter||'',date:new Date().toISOString(),shared:false}
        const next=[item,...read(userFilesKey,[])];saveFiles(next);log(`Uploaded ${file.name}`)
      } catch { setNotice(`Could not save ${file.name}. Your browser may be low on storage.`) }
    }
    setUploading(false);setNotice('Upload complete!')
  }
  async function downloadFile(file){
    const blob=await getBlob(file.id)
    if(!blob)return setNotice('File data was not found in this browser.')
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();URL.revokeObjectURL(url);log(`Downloaded ${file.name}`)
  }
  async function shareFile(file){
    const blob=await getBlob(file.id)
    if(!blob)return setNotice('File data was not found in this browser.')
    const shareFile=new File([blob],file.name,{type:file.type||blob.type})
    if(navigator.canShare?.({files:[shareFile]})&&navigator.share){
      try{await navigator.share({files:[shareFile],title:file.name,text:'Shared using FileFlow'});log(`Shared ${file.name}`)}catch(e){if(e.name!=='AbortError')setNotice('Sharing was not available. Try downloading the file instead.')}
    } else {
      await downloadFile(file)
      setNotice('Native file sharing is not supported here, so the file was downloaded. Attach it to your preferred app.')
    }
  }
  async function deleteFile(file){
    if(!confirm(`Delete ${file.name}?`))return
    await removeBlob(file.id)
    saveFiles(files.filter(f=>f.id!==file.id));log(`Deleted ${file.name}`);setNotice('File deleted.')
  }
  function createFolder(e){
    e.preventDefault()
    if(!folderName.trim())return
    if(folders.some(f=>f.name.toLowerCase()===folderName.trim().toLowerCase()))return setNotice('That folder already exists.')
    const next=[...folders,{id:uid(),name:folderName.trim()}];setFolders(next);write(userFoldersKey,next);setFolderName('');setShowFolder(false);setNotice('Folder created.')
  }
  const total=files.reduce((n,f)=>n+(f.size||0),0)
  const visible=useMemo(()=>files.filter(f=>(!folderFilter||f.folderId===folderFilter)&&f.name.toLowerCase().includes(search.toLowerCase())),[files,folderFilter,search])
  if(!user)return <Routes><Route path="/signup" element={<Auth initial="signup" onLogin={login}/>}/><Route path="*" element={<Auth onLogin={login}/>}/></Routes>

  function FileRows({items}) {
    if(!items.length)return <div className="empty"><Cloud size={34}/><b>No files here yet</b><span>Upload a file to get started.</span></div>
    return items.map(f=><div className="file-row" key={f.id}><div className="file-icon"><FileIcon name={f.name}/></div><div className="file-info"><b>{f.name}</b><span>{sizeLabel(f.size)} · {new Date(f.date).toLocaleDateString()}</span></div><div className="file-actions"><button title="Download" onClick={()=>downloadFile(f)}><Download size={16}/></button><button title="Share" onClick={()=>shareFile(f)}><Share2 size={16}/></button><button title="Delete" onClick={()=>deleteFile(f)}><Trash2 size={16}/></button></div></div>)
  }
  const uploadButton=<label className="btn primary upload-label"><UploadCloud size={16}/>{uploading?'Saving…':'Upload files'}<input type="file" multiple hidden onChange={e=>uploadFiles(e.target.files)}/></label>
  const currentFolder=folders.find(f=>f.id===folderFilter)
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'open':''}`}><div className="brand"><span className="brand-icon">F</span> FileFlow<span className="dot">.</span><button className="close-nav" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div><small className="nav-label">WORKSPACE</small>{navItems.map(([name,Icon])=><button key={name} className={`nav-item ${page===name?'active':''}`} onClick={()=>{setPage(name);setFolderFilter('');setMobileOpen(false)}}><Icon size={18}/>{name}</button>)}<div className="sidebar-bottom"><div className="storage-box"><span><HardDrive size={15}/> Browser storage used</span><b>{sizeLabel(total)}</b><div className="progress"><i style={{width:`${Math.min(total/52428800*100,100)}%`}}/></div><small>Saved on this device</small></div><button className="nav-item" onClick={logout}><LogOut size={18}/> Log out</button></div></aside>
    <main className="main-area"><header className="topbar"><button className="menu-btn" onClick={()=>setMobileOpen(!mobileOpen)}><Menu/></button><div className="crumb">Workspace <span>/</span> {page}</div><div className="user-chip"><span>{user.name}</span><div className="avatar">{user.name[0].toUpperCase()}</div></div></header>
      <div className="page-content">
        {page==='Dashboard'&&<><section className="hero"><div><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h1>Hello, {user.name.split(' ')[0]}! 👋</h1><p>Everything you need, all in one place.<br/>Keep your files organized and accessible.</p>{uploadButton}</div><div className="hero-cloud"><Cloud size={88}/></div></section><div className="stats-grid"><Stat icon={FileText} label="Total files" value={files.length}/><Stat icon={Folder} label="Folders" value={folders.length}/><Stat icon={Share2} label="Shared files" value="—"/><Stat icon={HardDrive} label="Storage used" value={sizeLabel(total)}/></div><section className="panel"><div className="panel-heading"><div><h2>Recent files</h2><p>Your latest uploads</p></div><button className="text-btn" onClick={()=>setPage('My Files')}>View all →</button></div><FileRows items={files.slice(0,5)}/></section><section className="panel"><div className="panel-heading"><div><h2>Your folders</h2><p>Organize your workspace</p></div><button className="text-btn" onClick={()=>setPage('Folders')}>Explore →</button></div><FolderGrid folders={folders} onOpen={id=>{setFolderFilter(id);setPage('My Files')}} counts={files}/></section></>}
        {page==='My Files'&&<><PageHeading title="My Files" subtitle="Upload, organize and manage your files." action={uploadButton}/><label className="dropzone"><UploadCloud size={35}/><b>{uploading?'Saving your files…':'Drag and drop files here'}</b><span>or click to browse from your device</span>{uploadButton}<input type="file" multiple hidden onChange={e=>uploadFiles(e.target.files)}/></label><section className="panel"><div className="panel-heading"><div><h2>{currentFolder?.name||'All files'}</h2><p>{visible.length} items</p></div><div className="searchbox"><Search size={16}/><input placeholder="Search files…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>{folderFilter&&<button className="text-btn" onClick={()=>setFolderFilter('')}>← All files</button>}<FileRows items={visible}/></section></>}
        {page==='Folders'&&<><PageHeading title="Folders" subtitle="Keep everything in its place." action={<button className="btn primary" onClick={()=>setShowFolder(true)}><FolderPlus size={16}/> New folder</button>}/>{showFolder&&<form className="inline-form" onSubmit={createFolder}><input value={folderName} onChange={e=>setFolderName(e.target.value)} placeholder="Folder name" required/><button className="btn primary">Create</button><button type="button" className="btn" onClick={()=>setShowFolder(false)}>Cancel</button></form>}<FolderGrid folders={folders} onOpen={id=>{setFolderFilter(id);setPage('My Files')}} counts={files}/></>}
        {page==='Shared'&&<><PageHeading title="Share files" subtitle="Share files directly with compatible apps on your device."/><div className="notice info">This frontend-only version uses your device's native sharing menu when supported. It does not create public links or transfer files to another device automatically.</div><section className="panel"><FileRows items={files}/></section></>}
        {page==='Activity'&&<><PageHeading title="Recent activity" subtitle="A timeline of your latest file operations."/><section className="panel">{activities.length?activities.map(a=><div className="activity-row" key={a.id}><span className="activity-icon"><Activity size={17}/></span><div><b>{a.action}</b><small>{new Date(a.date).toLocaleString()}</small></div></div>):<div className="empty">No activity yet.</div>}</section></>}
        {page==='Analytics'&&<><PageHeading title="Storage analytics" subtitle="Understand your file collection."/><div className="stats-grid"><Stat icon={FileText} label="Total files" value={files.length}/><Stat icon={Share2} label="Share actions" value={activities.filter(a=>a.action.startsWith('Shared')).length}/><Stat icon={Folder} label="Folders" value={folders.length}/><Stat icon={HardDrive} label="Storage used" value={sizeLabel(total)}/></div><section className="panel"><h2>File types</h2>{[['PDF documents',/\.pdf$/i],['Images',/\.(png|jpe?g|gif|webp)$/i],['Presentations',/\.pptx?$/i],['Other files',null]].map(([label,re])=>{const count=files.filter(f=>re?re.test(f.name):!/\.(pdf|png|jpe?g|gif|webp|pptx?)$/i.test(f.name)).length;return <div className="analytics-line" key={label}><div><span>{label}</span><b>{count}</b></div><div className="progress"><i style={{width:`${files.length?count/files.length*100:0}%`}}/></div></div>})}</section></>}
      </div><footer>FileFlow © 2026 <span>Frontend-only file management demo.</span></footer>
    </main>{notice&&<div className="toast">{notice}</div>}
  </div>
}
function Stat({icon:Icon,label,value}){return <div className="stat-card"><span className="stat-icon"><Icon size={19}/></span><small>{label}</small><b>{value}</b></div>}
function PageHeading({title,subtitle,action}){return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}
function FolderGrid({folders,onOpen,counts}){return <div className="folder-grid">{folders.length?folders.map(f=><button className="folder-card" key={f.id} onClick={()=>onOpen(f.id)}><Folder size={27}/><b>{f.name}</b><small>{counts.filter(x=>x.folderId===f.id).length} files · Open folder →</small></button>):<div className="empty">No folders created yet.</div>}</div>}
export default App

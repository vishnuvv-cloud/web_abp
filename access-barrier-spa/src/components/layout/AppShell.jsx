import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, Bell, CircleHelp, ClipboardList, LayoutDashboard, Menu, Search, Settings2, ShieldAlert, Users, ChartNoAxesColumn, X, ChevronDown, UserRound, ExternalLink } from 'lucide-react'
import UserProfileMenu from './UserProfileMenu.jsx'

const groups = [
  { label:'WORKSPACE', items:[['/hub/dashboard','Dashboard',LayoutDashboard],['/hub/cases','Case queue',ClipboardList,'12'],['/hub/my-cases','My cases',Users,'4'],['/hub/exceptions','Exceptions',ShieldAlert,'3']] },
  { label:'INSIGHTS', items:[['/hub/outcomes','Case outcomes',Activity],['/hub/performance','Performance',ChartNoAxesColumn]] },
  { label:'CONFIGURATION', items:[['/hub/rules','Rules & taxonomy',Settings2]] },
]
export default function AppShell(){
  const [mobileOpen,setMobileOpen]=useState(false),[toast,setToast]=useState('')
  const location=useLocation()
  const action=(name)=>{setToast(`${name} is available in the connected workspace.`);window.setTimeout(()=>setToast(''),2600)}
  const section=location.pathname.includes('/cases')?'Case queue':location.pathname.includes('dashboard')?'Dashboard':location.pathname.includes('exceptions')?'Exceptions':location.pathname.split('/').pop()
  return <div className="hub-shell">
    {mobileOpen&&<button className="hub-scrim" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`hub-sidebar ${mobileOpen?'mobile-open':''}`}>
      <div className="hub-brand"><span className="hub-mark"><Activity size={21}/></span><span><b>Access <em>Operations</em></b><small>PROACTIVE ACCESS</small></span><button className="hub-close" aria-label="Close menu" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
      <nav className="hub-nav" aria-label="Main navigation">{groups.map(g=><section key={g.label}><h2>{g.label}</h2>{g.items.map(([to,label,Icon,count])=><NavLink key={to} to={to} onClick={()=>setMobileOpen(false)} className={({isActive})=>`hub-nav-item ${isActive?'active':''}`}><Icon size={17}/><span>{label}</span>{count&&<i className={`hub-count ${label==='Exceptions'?'red':''}`}>{count}</i>}</NavLink>)}</section>)}</nav>
      <div className="hub-side-bottom"><div className="working-as"><small>WORKING AS</small><button onClick={()=>action('Hub Agent profile')}><span><UserRound size={17}/></span>Hub Agent<ChevronDown size={15}/></button></div><button className="hub-help" onClick={()=>action('Help & support')}><CircleHelp size={17}/>Help &amp; support<ExternalLink size={13}/></button><div className="hub-status"><i/>All systems operational</div></div>
    </aside>
    <main className="hub-main"><header className="hub-topbar"><button className="hub-mobile-menu" aria-label="Open navigation" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="hub-crumb"><span>Patient Support Services</span><b>/</b><span>Access operations</span><b>/</b><strong>{section}</strong></div><label className="hub-global-search"><Search size={16}/><input aria-label="Search cases, patients, payers" placeholder="Search cases, patients, payers…"/><kbd>⌘ K</kbd></label><div className="hub-top-actions"><button className="hub-icon-button notification" aria-label="Notifications"><Bell size={18}/><i/></button><UserProfileMenu onAction={action}/></div></header><div className="hub-content"><Outlet/></div></main>
    {toast&&<div className="hub-toast" role="status">{toast}</div>}
  </div>
}

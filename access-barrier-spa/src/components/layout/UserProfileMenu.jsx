import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, LogOut, SlidersHorizontal, UserRound } from 'lucide-react'

const items = [
  { label:'Profile', icon:UserRound },
  { label:'Preferences', icon:SlidersHorizontal },
  { label:'Sign out', icon:LogOut, danger:true },
]

export default function UserProfileMenu({ onAction }) {
  const triggerRef = useRef(null)
  const popupRef = useRef(null)
  const [open,setOpen] = useState(false)
  const [active,setActive] = useState(0)
  const [placement,setPlacement] = useState(null)

  const positionMenu = useCallback(() => {
    const anchor = triggerRef.current?.getBoundingClientRect()
    if (!anchor) return
    const gap=8,gutter=12,width=184,desired=items.length*40+8
    const below=Math.max(0,window.innerHeight-anchor.bottom-gutter-gap)
    const above=Math.max(0,anchor.top-gutter-gap)
    const direction=below>=desired?'down':above>=desired?'up':above>below?'up':'down'
    const available=direction==='down'?below:above
    const height=Math.min(desired,available)
    const top=direction==='down'?anchor.bottom+gap:Math.max(gutter,anchor.top-gap-height)
    const left=Math.min(anchor.right-width,window.innerWidth-gutter-width)
    setPlacement({top,left,width,height})
  },[])

  useEffect(() => {
    if(!open)return
    positionMenu()
    const reposition=()=>positionMenu()
    const outside=event=>{if(!triggerRef.current?.contains(event.target)&&!popupRef.current?.contains(event.target))setOpen(false)}
    const keyboard=event=>{if(event.key==='Escape'){setOpen(false);triggerRef.current?.focus()}}
    window.addEventListener('resize',reposition)
    window.addEventListener('scroll',reposition,true)
    document.addEventListener('pointerdown',outside)
    document.addEventListener('keydown',keyboard)
    return()=>{window.removeEventListener('resize',reposition);window.removeEventListener('scroll',reposition,true);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',keyboard)}
  },[open,positionMenu])

  useEffect(()=>{if(open&&placement)popupRef.current?.querySelector(`[data-profile-index="${active}"]`)?.focus()},[active,open,Boolean(placement)])
  const close=()=>{setOpen(false);triggerRef.current?.focus()}
  const menu=open&&placement&&createPortal(<div className="profile-popover" ref={popupRef} role="menu" aria-label="User profile" style={{position:'fixed',top:placement.top,left:placement.left,width:placement.width,maxHeight:placement.height,zIndex:1100}}>
    {items.map((item,index)=>{const Icon=item.icon;return <button key={item.label} type="button" role="menuitem" data-profile-index={index} tabIndex={index===active?0:-1} className={`profile-menu-item ${item.danger?'danger':''}`} onFocus={()=>setActive(index)} onClick={()=>{onAction(item.label);close()}} onKeyDown={event=>{
      if(event.key==='ArrowDown'){event.preventDefault();setActive((index+1)%items.length)}
      if(event.key==='ArrowUp'){event.preventDefault();setActive((index-1+items.length)%items.length)}
      if(event.key==='Home'){event.preventDefault();setActive(0)}
      if(event.key==='End'){event.preventDefault();setActive(items.length-1)}
      if(event.key==='Enter'||event.key===' '){event.preventDefault();onAction(item.label);close()}
      if(event.key==='Escape')close()
    }}><Icon size={16} strokeWidth={1.8}/><span>{item.label}</span></button>})}
  </div>,document.body)

  return <><button ref={triggerRef} type="button" className="user-profile-trigger" aria-label="Open user profile menu" aria-haspopup="menu" aria-expanded={open} onClick={()=>{setActive(0);setOpen(current=>!current)}}><span className="user-profile-icon"><UserRound size={18} strokeWidth={1.8}/></span><ChevronDown size={14} strokeWidth={1.8}/></button>{menu}</>
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronUp, UserRound } from 'lucide-react'

export default function PersonaSelector({ persona, personas, onChange }) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(Math.max(0, personas.findIndex(p => p.name === persona.name)))
  const [placement, setPlacement] = useState(null)

  const positionMenu = useCallback(() => {
    const anchor = triggerRef.current?.getBoundingClientRect()
    if (!anchor) return
    const gap = 8, gutter = 12, desired = Math.min(360, personas.length * 44 + 56)
    const below = Math.max(0, window.innerHeight - anchor.bottom - gutter - gap)
    const above = Math.max(0, anchor.top - gutter - gap)
    const direction = below >= desired ? 'down' : above >= desired ? 'up' : above > below ? 'up' : 'down'
    const available = direction === 'down' ? below : above
    const maxHeight = Math.max(0, Math.min(desired, available))
    const height = Math.min(desired, maxHeight)
    const top = direction === 'down' ? anchor.bottom + gap : Math.max(gutter, anchor.top - gap - height)
    setPlacement({ top, left: anchor.left, width: anchor.width, maxHeight, direction })
  }, [personas.length])

  useEffect(() => {
    if (!open) return
    positionMenu()
    const reposition = () => positionMenu()
    const outside = event => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    const keyboard = event => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', keyboard)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', keyboard)
    }
  }, [open, positionMenu])

  useEffect(() => {
    if (open && placement) menuRef.current?.querySelector(`[data-index="${active}"]`)?.focus()
  }, [active, open, Boolean(placement)])

  const show = index => { setActive(index); setOpen(true) }
  const choose = selected => { onChange(selected); setOpen(false); triggerRef.current?.focus() }
  const menu = open && placement && createPortal(<div className="persona-popover" ref={menuRef} style={{ position:'fixed', top:placement.top, left:placement.left, width:placement.width, height:placement.maxHeight, zIndex:1000 }}>
    <div className="persona-menu" role="listbox" aria-label="Choose working persona">
    <div className="persona-options" style={{ maxHeight:Math.max(0,placement.maxHeight-12) }}>
    {personas.map((option,index)=><button type="button" role="option" aria-selected={persona.name===option.name} data-index={index} tabIndex={index===active?0:-1} className={`persona-option ${persona.name===option.name?'selected':''}`} key={option.name} onClick={()=>choose(option)} onFocus={()=>setActive(index)} onKeyDown={event=>{
      if (event.key==='ArrowDown') { event.preventDefault(); setActive((index+1)%personas.length) }
      if (event.key==='ArrowUp') { event.preventDefault(); setActive((index-1+personas.length)%personas.length) }
      if (event.key==='Home') { event.preventDefault(); setActive(0) }
      if (event.key==='End') { event.preventDefault(); setActive(personas.length-1) }
      if (event.key==='Enter'||event.key===' ') { event.preventDefault(); choose(option) }
      if (event.key==='Escape') { setOpen(false); triggerRef.current?.focus() }
    }}><span className="persona-avatar"><UserRound size={18} strokeWidth={1.8}/></span><span>{option.name}</span>{persona.name===option.name&&<Check size={15}/>}</button>)}
    </div></div>
  </div>, document.body)

  return <><div className="persona-card"><div className="persona-caption">WORKING AS</div><button ref={triggerRef} type="button" className="persona-select" aria-haspopup="listbox" aria-expanded={open} onClick={()=>open?setOpen(false):show(personas.findIndex(p=>p.name===persona.name))} onKeyDown={event=>{
    if(event.key==='ArrowDown'){event.preventDefault();show(Math.max(0,personas.findIndex(p=>p.name===persona.name)))}
    if(event.key==='ArrowUp'){event.preventDefault();show(personas.findIndex(p=>p.name===persona.name))}
    if(event.key==='Escape')setOpen(false)
  }}><span className="persona-avatar"><UserRound size={18} strokeWidth={1.8}/></span><span className="persona-current">{persona.name}</span>{open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button></div>{menu}</>
}

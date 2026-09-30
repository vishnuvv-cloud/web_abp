import { AlertCircle, Check, Clock3, LoaderCircle } from 'lucide-react'
import { barrierStyles } from '../../constants/barriers.js'

export function PageHeader({ eyebrow, title, subtitle, action }) { return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="head-action">{action}</div>}</div> }
export function KPI({ label, value, note, icon: Icon, tone = 'navy' }) { return <article className="kpi card"><div className={`kpi-icon ${tone}`}>{Icon && <Icon size={17}/>}</div><div className="kpi-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article> }
export function RiskBadge({ score, label }) { const level = score >= .75 ? 'high' : score >= .45 ? 'medium' : 'low'; return <span className={`badge risk-${level}`}><i/>{label || `${level[0].toUpperCase()}${level.slice(1)} · ${score.toFixed(2)}`}</span> }
export function BarrierBadge({ name }) { return <span className={`badge barrier-${barrierStyles[name] || 'slate'}`}>{name}</span> }
export function SLA({ value }) { const urgent = value.includes('1h') || value.includes('2h'); return <span className={`sla ${urgent ? 'urgent' : ''}`}><Clock3 size={13}/>{value}</span> }
export function StateView({ loading, error, empty, onRetry }) { if (loading) return <div className="state"><LoaderCircle className="spin" size={20}/>Loading demo data…</div>; if (error) return <div className="state error"><AlertCircle size={18}/>Unable to load cases.<button className="button" onClick={onRetry}>Retry</button></div>; if (empty) return <div className="state"><AlertCircle size={18}/>No cases match your current filters.</div>; return null }
export function Status({ children }) { return <span className="status"><span className="status-dot"/>{children}</span> }
export function CheckMark({ checked }) { return <span className={`checkmark ${checked ? 'done' : ''}`}>{checked && <Check size={12}/>}</span> }

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Filter, RotateCcw, Search, ShieldAlert, Users } from 'lucide-react'
import { BarrierBadge, KPI, PageHeader, RiskBadge, SLA, StateView, Status } from '../../components/common/UI.jsx'

const pageSize = 5
const sortable = { score: c => c.score, id: c => c.id, payer: c => c.payer, confidence: c => c.confidence, sla: c => parseInt(c.sla,10)||24, owner: c => c.owner }

export default function WorkQueue({ data, loading, error, onRetry, onOpen, filters, setFilters, globalSearch }) {
  const [sort, setSort] = useState({ key:'score', direction:'desc' })
  const [page, setPage] = useState(0)
  const update = (key,value) => { setPage(0); setFilters(current => ({...current,[key]:value})) }
  const list = useMemo(() => data.filter(c =>
    (!globalSearch || `${c.id} ${c.patient} ${c.payer} ${c.product} ${c.owner}`.toLowerCase().includes(globalSearch.toLowerCase())) &&
    (!filters.risk || (filters.risk === 'High' ? c.score >= .75 : filters.risk === 'Medium' ? c.score >= .45 && c.score < .75 : c.score < .45)) &&
    (!filters.barrier || c.barriers.includes(filters.barrier)) && (!filters.territory || c.territory === filters.territory) &&
    (!filters.owner || c.owner.includes(filters.owner)) && (!filters.payer || `${c.payer} ${c.product}`.toLowerCase().includes(filters.payer.toLowerCase()))
  ).sort((a,b) => {
    const compare = sortable[sort.key](a) > sortable[sort.key](b) ? 1 : sortable[sort.key](a) < sortable[sort.key](b) ? -1 : 0
    return sort.direction === 'asc' ? compare : -compare
  }), [data,filters,globalSearch,sort])
  const pageCount = Math.max(1,Math.ceil(list.length/pageSize))
  const currentPage = Math.min(page,pageCount-1)
  useEffect(() => setPage(0), [globalSearch,filters.risk,filters.barrier,filters.territory,filters.owner,filters.payer])
  const visible = list.slice(currentPage*pageSize,(currentPage+1)*pageSize)
  const reset = () => { setPage(0); setFilters({ risk:'', barrier:'', territory:'', owner:'', payer:'' }) }
  const toggleSort = key => setSort(current => ({key,direction:current.key===key&&current.direction==='desc'?'asc':'desc'}))
  const sortLabel = (label,key) => <button className="sort-control" onClick={()=>toggleSort(key)} aria-label={`Sort by ${label}`}>{label}{sort.key===key?(sort.direction==='asc'?<ArrowUp size={11}/>:<ArrowDown size={11}/>):<ArrowUpDown size={11}/>}</button>
  const sortOrder = key => sort.key===key?(sort.direction==='asc'?'ascending':'descending'):'none'

  return <><PageHeader eyebrow="CASE OPERATIONS / PRIORITIZATION" title="Risk-ranked work queue" subtitle="Focus today's work on cases with the greatest access risk and the least time to act." action={<button className="button primary" onClick={()=>onOpen(data[0])}>Open top priority <ArrowUpRight size={15}/></button>}/>
    <div className="kpi-grid"><KPI label="Open cases" value="48" note="Across all territories" icon={Users}/><KPI label="High-risk cases" value="12" note="6 need a touch today" icon={ShieldAlert} tone="red"/><KPI label="Average queue age" value="1.8d" note={<><ArrowDown size={12}/> 0.4d vs. last week</>} icon={Clock3} tone="blue"/><KPI label="Within SLA" value="91%" note={<><CheckCircle2 size={12}/> Above 90% target</>} icon={CheckCircle2} tone="green"/></div>
    <section className="card queue-card"><div className="section-heading"><div><h2>Cases needing attention</h2><p>Risk and response time guide queue order.</p></div><span className="demo-label"><span/> DEMO DATA</span></div>
      <div className="filter-row"><div className="filter-title"><Filter size={15}/> Filters</div><select aria-label="Filter by risk" value={filters.risk} onChange={e=>update('risk',e.target.value)}><option value="">All risk bands</option><option>High</option><option>Medium</option><option>Low</option></select><select aria-label="Filter by barrier" value={filters.barrier} onChange={e=>update('barrier',e.target.value)}><option value="">All barriers</option>{['Prior authorization','Step therapy','Affordability','Documentation','PA criteria'].map(x=><option key={x}>{x}</option>)}</select><select aria-label="Filter by territory" value={filters.territory} onChange={e=>update('territory',e.target.value)}><option value="">All territories</option>{['Northeast','Mid-Atlantic','Southeast'].map(x=><option key={x}>{x}</option>)}</select><select aria-label="Filter by owner" value={filters.owner} onChange={e=>update('owner',e.target.value)}><option value="">All owners</option>{['Hub Agent','FRM','Financial Counselor'].map(x=><option key={x}>{x}</option>)}</select><label className="table-search"><Search size={14}/><input aria-label="Filter payer or therapy" placeholder="Payer or therapy" value={filters.payer} onChange={e=>update('payer',e.target.value)}/></label><button className="reset-button" onClick={reset}><RotateCcw size={13}/>Reset</button></div>
      {loading || error || !list.length ? <StateView loading={loading} error={error} empty={!loading&&!error&&!list.length} onRetry={onRetry}/> : <div className="table-scroll"><table className="data-table"><thead><tr><th aria-sort={sortOrder('score')}>{sortLabel('Priority','score')}</th><th aria-sort={sortOrder('id')}>{sortLabel('Case / patient','id')}</th><th aria-sort={sortOrder('payer')}>{sortLabel('Payer / product','payer')}</th><th>Predicted barriers</th><th aria-sort={sortOrder('confidence')}>{sortLabel('Confidence','confidence')}</th><th aria-sort={sortOrder('sla')}>{sortLabel('SLA','sla')}</th><th aria-sort={sortOrder('owner')}>{sortLabel('Owner','owner')}</th><th>Action</th></tr></thead><tbody>{visible.map(c=><tr key={c.id} onClick={()=>onOpen(c)} className="click-row"><td><RiskBadge score={c.score}/></td><td><button className="case-link" onClick={e=>{e.stopPropagation();onOpen(c)}}>{c.id}</button><small>{c.patient}</small></td><td><b>{c.payer}</b><small>{c.product}</small></td><td><div className="barrier-stack">{c.barriers.map(b=><BarrierBadge key={b} name={b}/>)}</div></td><td><div className="confidence"><span>{Math.round(c.confidence*100)}%</span><div className="progress"><i style={{width:`${c.confidence*100}%`}}/></div></div></td><td><SLA value={c.sla}/></td><td><Status>{c.owner}</Status></td><td><button className="button compact" onClick={e=>{e.stopPropagation();onOpen(c)}}>Review <ArrowUpRight size={13}/></button></td></tr>)}</tbody></table></div>}
      <div className="table-foot"><span>Showing <b>{list.length?currentPage*pageSize+1:0}–{Math.min((currentPage+1)*pageSize,list.length)}</b> of <b>{list.length}</b> cases <span className="table-foot-muted">· Demo records</span></span><div className="pagination"><span>Page {currentPage+1} of {pageCount}</span><button className="page-button" aria-label="Previous page" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}><ChevronLeft size={15}/></button><button className="page-button" aria-label="Next page" disabled={currentPage>=pageCount-1} onClick={()=>setPage(currentPage+1)}><ChevronRight size={15}/></button></div></div>
    </section>
  </>
}

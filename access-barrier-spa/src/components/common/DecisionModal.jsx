import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'

export default function DecisionModal({ action, onClose, onSave }) {
  const [reason, setReason] = useState('')
  const dialog = useRef(null)
  useEffect(() => { const previous = document.activeElement; dialog.current?.focus(); const esc = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', esc); return () => { window.removeEventListener('keydown', esc); previous?.focus?.() } }, [onClose])
  const config = {
    'Accept & start actions':['Accept prediction','Confirm that you have reviewed the predicted barriers and want to begin the recommended operational actions.'],
    'Create tasks':['Create assigned tasks','Add the selected operational follow-ups to the case.'],
    'Override prediction':['Override prediction','Record why the prediction does not reflect the current case context.'],
    'Escalate case':['Escalate this case','Share the reason this case needs additional review or intervention.'],
    'Create rule':['Create a rule draft','Describe the rule guidance to add for team review.'],
    'View audit':['Case decision trail','Review the key events recorded for this demo case.'],
    'Export readiness pack':['Territory readiness pack','Your territory summary is ready for this demo workspace.'],
    'Download summary':['Market access summary','Your intelligence summary is ready for this demo workspace.'],
    'Review financial path':['Financial assistance review','Record the next step for this affordability work item.'],
  }[action] || [action, 'Add a short note to keep the case team aligned.']
  return <div className="modal-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" ref={dialog} tabIndex={-1}><div className="dialog-top"><div className="dialog-icon"><Check size={18}/></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div><div className="dialog-eyebrow">CASE ACTION</div><h2 id="dialog-title">{config[0]}</h2><p>{config[1]}</p><label className="field-label" htmlFor="decision-reason">{action === 'View audit' ? 'Recent activity' : 'Reason or case note'}{action !== 'View audit' && <span>Required</span>}</label>{action === 'View audit' ? <div className="audit-preview"><b>09:18 · Prediction evaluated</b><span>High risk identified across three potential barriers.</span><b>09:19 · Case routed</b><span>Hub Agent primary with reimbursement and financial support.</span></div> : <textarea id="decision-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Add context for the case team…"/>}<div className="dialog-actions"><button className="button" onClick={onClose}>Cancel</button>{action !== 'View audit' && <button className="button primary" disabled={!reason.trim()} onClick={() => { onSave(action, reason); setReason(''); onClose() }}>Save decision</button>}</div></section></div>
}

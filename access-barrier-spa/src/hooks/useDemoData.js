import { useEffect, useState } from 'react'
import { caseService } from '../services/api/caseService.js'

export function useDemoData(resource = 'cases') {
  const [state, setState] = useState({ data: [], loading: true, error: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    setState(current => ({ ...current, loading: true, error: false }))
    const load = resource === 'rules' ? caseService.listRules : caseService.list
    load().then(data => live && setState({ data, loading: false, error: false })).catch(() => live && setState({ data: [], loading: false, error: true }))
    return () => { live = false }
  }, [resource, attempt])
  return { ...state, retry: () => setAttempt(value => value + 1) }
}

import { request, useMockData } from './apiClient.js'
import { exceptions, hubCases, hubSummary } from '../../mocks/hubData.js'
const delay = value => new Promise(resolve => setTimeout(()=>resolve(value),120))
export const getDashboardSummary = () => useMockData ? delay(hubSummary) : request('/dashboard/summary')
export const getCases = async (params={}) => useMockData ? delay({items:[...hubCases,...exceptions],total:hubCases.length}) : request(`/cases?${new URLSearchParams(params)}`)
export const getMyCases = async () => useMockData ? delay({items:hubCases.filter(c=>c.owner==='Hub Agent'),total:hubCases.filter(c=>c.owner==='Hub Agent').length}) : request('/cases?assignedTo=me')
export const getExceptions = () => useMockData ? delay({items:exceptions,total:exceptions.length}) : request('/exceptions')
export const getCase = async id => useMockData ? delay(hubCases.find(c=>c.id===id)||exceptions.find(c=>c.id===id)||null) : request(`/cases/${encodeURIComponent(id)}`)
export const getCaseActivity = id => useMockData ? getCase(id).then(c=>c?.activity||[]) : request(`/cases/${encodeURIComponent(id)}/activity`)
export const getCaseAssessment = id => useMockData ? getCase(id).then(c=>c&&({score:c.score,confidence:c.confidence,barriers:c.predictedBarriers,explanation:c.explanations})) : request(`/cases/${encodeURIComponent(id)}/assessment`)
export const getCaseOwnership = id => useMockData ? getCase(id).then(c=>c&&({owner:c.owner,supporting:['Field Reimbursement Manager','Financial Counselor']})) : request(`/cases/${encodeURIComponent(id)}/ownership`)
export const getCaseActions = id => useMockData ? getCase(id).then(c=>c?.actions||[]) : request(`/cases/${encodeURIComponent(id)}/actions`)
export const updateCaseDecision = (id,payload) => useMockData ? delay({id,...payload,saved:true}) : request(`/cases/${encodeURIComponent(id)}/decision`,{method:'POST',body:JSON.stringify(payload)})
export const overrideAssessment = (id,payload) => useMockData ? delay({id,...payload,saved:true}) : request(`/cases/${encodeURIComponent(id)}/assessment`,{method:'PUT',body:JSON.stringify(payload)})
export const assignCase = (id,payload) => useMockData ? delay({id,...payload,saved:true}) : request(`/cases/${encodeURIComponent(id)}/assignment`,{method:'PUT',body:JSON.stringify(payload)})


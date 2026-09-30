import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import Dashboard from './features/hub/Dashboard.jsx'
import CaseQueue from './features/hub/CaseQueue.jsx'
import CaseDrawer from './features/hub/CaseDrawer.jsx'
import Exceptions from './features/hub/Exceptions.jsx'
import Placeholder from './features/hub/Placeholder.jsx'

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppShell/>}>
    <Route path="/" element={<Navigate to="/hub/dashboard" replace/>}/>
    <Route path="/hub/dashboard" element={<Dashboard/>}/>
    <Route path="/hub/cases" element={<CaseQueue/>}/>
    <Route path="/hub/cases/:caseId" element={<><CaseQueue/><CaseDrawer/></>}/>
    <Route path="/hub/my-cases" element={<CaseQueue mine/>}/>
    <Route path="/hub/exceptions" element={<Exceptions/>}/>
    <Route path="/hub/outcomes" element={<Placeholder title="Case outcomes" description="Review access outcomes and resolution patterns across the Hub Agent team."/>}/>
    <Route path="/hub/performance" element={<Placeholder title="Performance" description="Monitor team workload, response times, and service levels."/>}/>
    <Route path="/hub/rules" element={<Placeholder title="Rules & Taxonomy" description="Review the barrier categories and operational guidance available to your team."/>}/>
    <Route path="*" element={<Navigate to="/hub/dashboard" replace/>}/>
  </Route></Routes></BrowserRouter>
}

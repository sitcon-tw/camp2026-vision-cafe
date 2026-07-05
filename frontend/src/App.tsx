import { Navigate, Route, Routes } from "react-router-dom"

import AuthErrorPage from "@/routes/auth-error-page"
import AdminAssignmentsPage from "@/routes/admin/assignments-page"
import AdminFlowPage from "@/routes/admin/flow-page"
import AdminLoginPage from "@/routes/admin/login-page"
import AdminPreferencesPage from "@/routes/admin/preferences-page"
import HomePage from "@/routes/home-page"
import { LookupPage } from "@/routes/lookup/lookup-page"
import { SelectPage } from "@/routes/select/select-page"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/select" element={<SelectPage />} />
      <Route path="/lookup" element={<LookupPage />} />
      <Route path="/auth/error" element={<AuthErrorPage />} />
      <Route path="/admin" element={<Navigate to="/admin/flow" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/flow" element={<AdminFlowPage />} />
      <Route path="/admin/preferences" element={<AdminPreferencesPage />} />
      <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

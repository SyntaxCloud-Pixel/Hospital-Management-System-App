import Sidebar from './Sidebar'

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-content">{children}</main>
    </div>
  )
}

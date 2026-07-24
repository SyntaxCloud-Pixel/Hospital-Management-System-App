import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function PatientDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ upcoming: 0, total: 0, prescriptions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)
    const [upcoming, total, prescriptions] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('patient_id', user.id).gte('appointment_date', todayStr),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('patient_id', user.id),
      supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('patient_id', user.id),
    ])
    setStats({
      upcoming: upcoming.count ?? 0,
      total: total.count ?? 0,
      prescriptions: prescriptions.count ?? 0,
    })
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>Welcome, {profile?.full_name?.split(' ')[0] || 'there'}</h1></div>
      {loading ? <p>Loading...</p> : (
        <div className="stats-grid">
          <div className="stat-card"><div className="value">{stats.upcoming}</div><div className="label">Upcoming Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.total}</div><div className="label">Total Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.prescriptions}</div><div className="label">Prescriptions</div></div>
        </div>
      )}
    </DashboardLayout>
  )
}

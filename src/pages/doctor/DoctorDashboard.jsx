import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ today: 0, upcoming: 0, completed: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)
    const [today, upcoming, completed, total] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id).eq('appointment_date', todayStr),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id).gt('appointment_date', todayStr),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id).eq('status', 'completed'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id),
    ])
    setStats({
      today: today.count ?? 0,
      upcoming: upcoming.count ?? 0,
      completed: completed.count ?? 0,
      total: total.count ?? 0,
    })
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>Doctor Dashboard</h1></div>
      {loading ? <p>Loading...</p> : (
        <div className="stats-grid">
          <div className="stat-card"><div className="value">{stats.today}</div><div className="label">Today's Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.upcoming}</div><div className="label">Upcoming</div></div>
          <div className="stat-card"><div className="value">{stats.completed}</div><div className="label">Completed</div></div>
          <div className="stat-card"><div className="value">{stats.total}</div><div className="label">Total Appointments</div></div>
        </div>
      )}
    </DashboardLayout>
  )
}

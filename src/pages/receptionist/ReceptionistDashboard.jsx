import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { supabase } from '../../lib/supabaseClient'

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState({ today: 0, pending: 0, patients: 0, doctors: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)
    const [today, pending, patients, doctors] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', todayStr),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('doctors').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      today: today.count ?? 0,
      pending: pending.count ?? 0,
      patients: patients.count ?? 0,
      doctors: doctors.count ?? 0,
    })
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>Receptionist Dashboard</h1></div>
      {loading ? <p>Loading...</p> : (
        <div className="stats-grid">
          <div className="stat-card"><div className="value">{stats.today}</div><div className="label">Today's Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.pending}</div><div className="label">Pending Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.patients}</div><div className="label">Total Patients</div></div>
          <div className="stat-card"><div className="value">{stats.doctors}</div><div className="label">Total Doctors</div></div>
        </div>
      )}
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { supabase } from '../../lib/supabaseClient'

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)

    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      upcoming,
      completed,
      cancelled,
    ] = await Promise.all([
      supabase.from('doctors').select('id', { count: 'exact', head: true }),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', todayStr),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).gt('appointment_date', todayStr),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    ])

    setStats({
      totalDoctors: totalDoctors.count ?? 0,
      totalPatients: totalPatients.count ?? 0,
      totalAppointments: totalAppointments.count ?? 0,
      todayAppointments: todayAppointments.count ?? 0,
      upcoming: upcoming.count ?? 0,
      completed: completed.count ?? 0,
      cancelled: cancelled.count ?? 0,
    })
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Reports</h1>
      </div>
      {loading || !stats ? (
        <p>Loading report data...</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-card"><div className="value">{stats.totalDoctors}</div><div className="label">Total Doctors</div></div>
          <div className="stat-card"><div className="value">{stats.totalPatients}</div><div className="label">Total Patients</div></div>
          <div className="stat-card"><div className="value">{stats.totalAppointments}</div><div className="label">Total Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.todayAppointments}</div><div className="label">Today's Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.upcoming}</div><div className="label">Upcoming Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.completed}</div><div className="label">Completed Appointments</div></div>
          <div className="stat-card"><div className="value">{stats.cancelled}</div><div className="label">Cancelled Appointments</div></div>
        </div>
      )}
    </DashboardLayout>
  )
}

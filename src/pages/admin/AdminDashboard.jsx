import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { supabase } from '../../lib/supabaseClient'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    receptionists: 0,
    appointments: 0,
    today: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)

    const [doctors, patients, receptionists, appointments, today] = await Promise.all([
      supabase.from('doctors').select('id', { count: 'exact', head: true }),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'receptionist'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', todayStr),
    ])

    setStats({
      doctors: doctors.count ?? 0,
      patients: patients.count ?? 0,
      receptionists: receptionists.count ?? 0,
      appointments: appointments.count ?? 0,
      today: today.count ?? 0,
    })
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>
      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{stats.doctors}</div>
            <div className="label">Total Doctors</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.patients}</div>
            <div className="label">Total Patients</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.receptionists}</div>
            <div className="label">Receptionists</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.appointments}</div>
            <div className="label">Total Appointments</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.today}</div>
            <div className="label">Today's Appointments</div>
          </div>
        </div>
      )}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quick Links</h3>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Use the sidebar to manage doctors, patients, receptionists, appointments, and view detailed reports.
        </p>
      </div>
    </DashboardLayout>
  )
}

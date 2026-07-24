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
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)

    const [doctors, patients, receptionists, appointments, today, recent] = await Promise.all([
      supabase.from('doctors').select('id', { count: 'exact', head: true }),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'receptionist'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', todayStr),
      supabase.from('appointments').select(`
        id, appointment_date, appointment_time, status, updated_at,
        patient:patients(id, profiles!inner(full_name)),
        doctor:doctors(id, profiles!inner(full_name))
      `).order('updated_at', { ascending: false }).limit(5)
    ])

    setStats({
      doctors: doctors.count ?? 0,
      patients: patients.count ?? 0,
      receptionists: receptionists.count ?? 0,
      appointments: appointments.count ?? 0,
      today: today.count ?? 0,
    })
    
    if (recent.data) {
      setRecentActivity(recent.data)
    }
    
    setLoading(false)
  }

  function formatRelativeTime(dateString) {
    const d = new Date(dateString)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return d.toLocaleDateString()
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>
      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <>
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
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '30px' }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No recent activity found.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {recentActivity.map(act => (
                    <li key={act.id} style={{ 
                      padding: '12px 0', 
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>
                          {act.patient?.profiles?.full_name} <span style={{color: '#6b7280', fontWeight: 'normal'}}>with</span> Dr. {act.doctor?.profiles?.full_name}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                          For {act.appointment_date} at {act.appointment_time}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${act.status}`} style={{display: 'inline-block', marginBottom: '6px'}}>{act.status}</span>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{formatRelativeTime(act.updated_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Quick Links</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>
                Use the sidebar to manage doctors, patients, receptionists, appointments, and view detailed reports.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="/admin/appointments" className="btn-link" style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', textDecoration: 'none', color: '#374151', display: 'block' }}>View All Appointments</a>
                <a href="/admin/patients" className="btn-link" style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', textDecoration: 'none', color: '#374151', display: 'block' }}>Manage Patients</a>
                <a href="/admin/reports" className="btn-link" style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', textDecoration: 'none', color: '#374151', display: 'block' }}>View Analytics Reports</a>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

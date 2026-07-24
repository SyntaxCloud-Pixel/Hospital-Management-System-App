import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function AppointmentHistory() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, reason, doctor:doctors(id, specialization, profiles!inner(full_name))')
      .eq('patient_id', user.id)
      .order('appointment_date', { ascending: false })
    if (!error) setAppointments(data || [])
    setLoading(false)
  }

  async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>Appointment History</h1></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6}>You have no appointments yet.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.doctor?.profiles?.full_name} {a.doctor?.specialization ? `(${a.doctor.specialization})` : ''}</td>
                  <td>{a.reason || '-'}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  <td>
                    {['pending', 'confirmed'].includes(a.status) && (
                      <button className="danger" onClick={() => cancelAppointment(a.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

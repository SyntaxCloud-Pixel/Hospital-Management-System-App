import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled']

export default function DoctorAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, reason, patient:patients(id, date_of_birth, gender, blood_group, profiles!inner(full_name, email, phone))')
      .eq('doctor_id', user.id)
      .order('appointment_date', { ascending: false })
    if (!error) setAppointments(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    load()
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>My Appointments</h1></div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6}>No appointments assigned.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.patient?.profiles?.full_name}</td>
                  <td>{a.reason || '-'}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  <td className="actions-row">
                    <button className="secondary" onClick={() => setViewing(a)}>Record</button>
                    <select
                      style={{ width: 130 }}
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <Modal title="Patient Medical Record" onClose={() => setViewing(null)}>
          <p><strong>Name:</strong> {viewing.patient?.profiles?.full_name}</p>
          <p><strong>Email:</strong> {viewing.patient?.profiles?.email}</p>
          <p><strong>Phone:</strong> {viewing.patient?.profiles?.phone || '-'}</p>
          <p><strong>DOB:</strong> {viewing.patient?.date_of_birth || '-'}</p>
          <p><strong>Gender:</strong> {viewing.patient?.gender || '-'}</p>
          <p><strong>Blood Group:</strong> {viewing.patient?.blood_group || '-'}</p>
          <p><strong>Visit Reason:</strong> {viewing.reason || '-'}</p>
        </Modal>
      )}
    </DashboardLayout>
  )
}

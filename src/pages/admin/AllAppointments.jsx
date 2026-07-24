import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { supabase } from '../../lib/supabaseClient'

export default function AllAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select(
        'id, appointment_date, appointment_time, status, reason, patient:patients(id, profiles!inner(full_name)), doctor:doctors(id, profiles!inner(full_name))'
      )
      .order('appointment_date', { ascending: false })
    if (!error) setAppointments(data || [])
    setLoading(false)
  }

  const filtered = appointments.filter((a) => statusFilter === 'all' || a.status === statusFilter)

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>All Appointments</h1>
        <select style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>No appointments found.</td></tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.patient?.profiles?.full_name}</td>
                  <td>{a.doctor?.profiles?.full_name}</td>
                  <td>{a.reason || '-'}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function MyPrescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, medicines, notes, created_at, doctor:doctors(id, specialization, profiles!inner(full_name)), appointment:appointments(appointment_date)')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setPrescriptions(data || [])
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="page-header"><h1>My Prescriptions</h1></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Doctor</th><th>Medicines</th><th>Notes</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Loading...</td></tr>
            ) : prescriptions.length === 0 ? (
              <tr><td colSpan={4}>No prescriptions yet.</td></tr>
            ) : (
              prescriptions.map((p) => (
                <tr key={p.id}>
                  <td>{p.appointment?.appointment_date || '-'}</td>
                  <td>{p.doctor?.profiles?.full_name} {p.doctor?.specialization ? `(${p.doctor.specialization})` : ''}</td>
                  <td>{p.medicines}</td>
                  <td>{p.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

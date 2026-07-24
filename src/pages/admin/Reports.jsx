import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { supabase } from '../../lib/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Default to last 30 days
  const todayDate = new Date()
  const thirtyDaysAgo = new Date(todayDate)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(todayDate.toISOString().slice(0, 10))

  useEffect(() => {
    load()
  }, [startDate, endDate])

  async function load() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)

    const [docsRes, patsRes] = await Promise.all([
      supabase.from('doctors').select('id', { count: 'exact', head: true }),
      supabase.from('patients').select('id', { count: 'exact', head: true })
    ])

    let query = supabase.from('appointments').select(`
      id, appointment_date, appointment_time, status, reason,
      patient:patients(id, profiles!inner(full_name)),
      doctor:doctors(id, profiles!inner(full_name))
    `)
    if (startDate) query = query.gte('appointment_date', startDate)
    if (endDate) query = query.lte('appointment_date', endDate)
    
    const { data: apptsData } = await query

    const appts = apptsData || []
    setAppointments(appts)
    
    let todayCount = 0
    let upcomingCount = 0
    let completedCount = 0
    let cancelledCount = 0
    let pendingCount = 0
    let confirmedCount = 0

    const dateMap = {}

    appts.forEach(a => {
      if (a.appointment_date === todayStr) todayCount++
      if (a.appointment_date > todayStr) upcomingCount++
      
      if (a.status === 'completed') completedCount++
      if (a.status === 'cancelled') cancelledCount++
      if (a.status === 'pending') pendingCount++
      if (a.status === 'confirmed') confirmedCount++
      
      dateMap[a.appointment_date] = (dateMap[a.appointment_date] || 0) + 1
    })

    setStats({
      totalDoctors: docsRes.count ?? 0,
      totalPatients: patsRes.count ?? 0,
      totalAppointments: appts.length,
      todayAppointments: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      cancelled: cancelledCount,
      pending: pendingCount,
      confirmed: confirmedCount
    })
    
    // Prepare bar chart data (sort by date)
    const cData = Object.keys(dateMap).sort().map(date => ({
      date,
      Appointments: dateMap[date]
    }))
    setChartData(cData)
    
    // Prepare pie chart data
    setPieData([
      { name: 'Pending', value: pendingCount },
      { name: 'Confirmed', value: confirmedCount },
      { name: 'Completed', value: completedCount },
      { name: 'Cancelled', value: cancelledCount }
    ].filter(d => d.value > 0))

    setLoading(false)
  }

  function exportCSV() {
    if (appointments.length === 0) {
      alert('No data to export.')
      return
    }
    const headers = ['Date', 'Time', 'Patient', 'Doctor', 'Status', 'Reason']
    const rows = appointments.map(a => [
      a.appointment_date,
      a.appointment_time,
      `"${a.patient?.profiles?.full_name || ''}"`,
      `"${a.doctor?.profiles?.full_name || ''}"`,
      a.status,
      `"${(a.reason || '').replace(/"/g, '""')}"`
    ])
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n"
      + rows.map(e => e.join(',')).join("\n")
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `appointments_report_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const COLORS = ['#d97706', '#2563eb', '#16a34a', '#dc2626']

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Reports</h1>
      </div>
      
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
          <button onClick={exportCSV} disabled={loading || appointments.length === 0}>Export CSV</button>
        </div>
      </div>

      {loading || !stats ? (
        <p>Loading report data...</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="value">{stats.totalDoctors}</div><div className="label">Total Doctors</div></div>
            <div className="stat-card"><div className="value">{stats.totalPatients}</div><div className="label">Total Patients</div></div>
            <div className="stat-card"><div className="value">{stats.totalAppointments}</div><div className="label">Appointments (in range)</div></div>
            <div className="stat-card"><div className="value">{stats.todayAppointments}</div><div className="label">Today's Appointments</div></div>
            <div className="stat-card"><div className="value">{stats.upcoming}</div><div className="label">Upcoming Appointments</div></div>
            <div className="stat-card"><div className="value" style={{color: '#d97706'}}>{stats.pending}</div><div className="label">Pending Appointments</div></div>
            <div className="stat-card"><div className="value" style={{color: '#16a34a'}}>{stats.completed}</div><div className="label">Completed Appointments</div></div>
            <div className="stat-card"><div className="value" style={{color: '#dc2626'}}>{stats.cancelled}</div><div className="label">Cancelled Appointments</div></div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: '1 1 500px', minWidth: 0 }}>
              <h3>Appointments Over Time</h3>
              {chartData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9ca3af" />
                      <YAxis allowDecimals={false} tick={{fontSize: 12}} stroke="#9ca3af" />
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="Appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: '#6b7280', marginTop: 40, textAlign: 'center' }}>No data for selected period</p>
              )}
            </div>
            <div className="card" style={{ flex: '1 1 300px', minWidth: 0 }}>
              <h3>Appointments by Status</h3>
              {pieData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: '#6b7280', marginTop: 40, textAlign: 'center' }}>No data for selected period</p>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

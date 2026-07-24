import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Sidebar.module.css'

const LINKS = {
  admin: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/doctors', label: 'Doctors' },
    { to: '/admin/patients', label: 'Patients' },
    { to: '/admin/receptionists', label: 'Receptionists' },
    { to: '/admin/appointments', label: 'Appointments' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', end: true },
    { to: '/doctor/appointments', label: 'Appointments' },
    { to: '/doctor/prescriptions', label: 'Prescriptions' },
  ],
  receptionist: [
    { to: '/receptionist', label: 'Dashboard', end: true },
    { to: '/receptionist/register-patient', label: 'Register Patient' },
    { to: '/receptionist/appointments', label: 'Appointments' },
  ],
  patient: [
    { to: '/patient', label: 'Dashboard', end: true },
    { to: '/patient/book', label: 'Book Appointment' },
    { to: '/patient/history', label: 'Appointment History' },
    { to: '/patient/prescriptions', label: 'My Prescriptions' },
    { to: '/patient/profile', label: 'Profile' },
  ],
}

export default function Sidebar() {
  const { role, signOut, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const links = LINKS[role] || []

  return (
    <>
      <button
        className={styles.menuButton}
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      {open && (
        <div className={styles.overlayVisible} onClick={() => setOpen(false)} />
      )}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>MediCare HMS</div>
        <div style={{ padding: '0 8px 16px', fontSize: '0.8rem', color: '#94a3b8' }}>
          {profile?.full_name} <br />
          <span style={{ textTransform: 'capitalize' }}>{role}</span>
        </div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
            onClick={() => setOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
        <button className={styles.signout} onClick={signOut}>
          Sign Out
        </button>
      </aside>
    </>
  )
}

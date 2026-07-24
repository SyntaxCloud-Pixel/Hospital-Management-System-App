import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import RoleRedirect from './pages/RoleRedirect'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'

import AdminDashboard from './pages/admin/AdminDashboard'
import ManageDoctors from './pages/admin/ManageDoctors'
import ManagePatients from './pages/admin/ManagePatients'
import ManageReceptionists from './pages/admin/ManageReceptionists'
import AllAppointments from './pages/admin/AllAppointments'
import Reports from './pages/admin/Reports'

import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorPrescriptions from './pages/doctor/Prescriptions'

import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard'
import RegisterPatient from './pages/receptionist/RegisterPatient'
import ManageAppointments from './pages/receptionist/ManageAppointments'

import PatientDashboard from './pages/patient/PatientDashboard'
import BookAppointment from './pages/patient/BookAppointment'
import AppointmentHistory from './pages/patient/AppointmentHistory'
import MyPrescriptions from './pages/patient/MyPrescriptions'
import Profile from './pages/patient/Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/redirect" element={<RoleRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><ManageDoctors /></ProtectedRoute>} />
      <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><ManagePatients /></ProtectedRoute>} />
      <Route path="/admin/receptionists" element={<ProtectedRoute allowedRoles={['admin']}><ManageReceptionists /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AllAppointments /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />

      {/* Doctor */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorPrescriptions /></ProtectedRoute>} />

      {/* Receptionist */}
      <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path="/receptionist/register-patient" element={<ProtectedRoute allowedRoles={['receptionist']}><RegisterPatient /></ProtectedRoute>} />
      <Route path="/receptionist/appointments" element={<ProtectedRoute allowedRoles={['receptionist']}><ManageAppointments /></ProtectedRoute>} />

      {/* Patient */}
      <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/book" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
      <Route path="/patient/history" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentHistory /></ProtectedRoute>} />
      <Route path="/patient/prescriptions" element={<ProtectedRoute allowedRoles={['patient']}><MyPrescriptions /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><Profile /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

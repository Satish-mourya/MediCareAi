import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import DoctorsList from './pages/DoctorsList';
import DoctorProfile from './pages/DoctorProfile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import RegisterDoctor from './pages/Auth/RegisterDoctor';

import PatientDashboard from './pages/Patient/PatientDashboard';
import PatientAppointments from './pages/Patient/PatientAppointments';
import PatientProfile from './pages/Patient/PatientProfile';
import PatientPayments from './pages/Patient/PatientPayments';

import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorSlots from './pages/Doctor/DoctorSlots';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorAppointmentDetail from './pages/Doctor/DoctorAppointmentDetail';
import DoctorProfileEdit from './pages/Doctor/DoctorProfileEdit';

import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminDoctors from './pages/Admin/AdminDoctors';
import AdminPatients from './pages/Admin/AdminPatients';
import AdminAppointments from './pages/Admin/AdminAppointments';
import AdminPayments from './pages/Admin/AdminPayments';

import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/doctors" element={<DoctorsList />} />
      <Route path="/doctors/:id" element={<DoctorProfile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-doctor" element={<RegisterDoctor />} />

      {/* Patient */}
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/payments"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfile />
          </ProtectedRoute>
        }
      />

      {/* Doctor */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/slots"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorSlots />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments/:id"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointmentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorProfileEdit />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDoctors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPatients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

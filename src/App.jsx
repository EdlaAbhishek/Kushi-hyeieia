import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import About from './pages/About'
import ApplyDoctor from './pages/ApplyDoctor'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import AiChat from './pages/AiChat'
import SymptomChecker from './pages/SymptomChecker'
import HealthWorkerMode from './pages/HealthWorkerMode'
import AdminDashboard from './pages/AdminDashboard'
import SecurityPolicy from './pages/SecurityPolicy'
import HospitalRecommendation from './pages/HospitalRecommendation'
import Hospitals from './pages/Hospitals'
import HospitalDetail from './pages/HospitalDetail'
import ConsentPopup from './components/ui/ConsentPopup'
import TeleconsultRoom from './pages/TeleconsultRoom'
import Patients from './pages/Patients'
import Services from './pages/Services'
import Insurance from './pages/Insurance'
import Emergency from './pages/Emergency'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import BloodDonation from './pages/BloodDonation'
import DoctorDetail from './pages/DoctorDetail'
import AppointmentConfirmation from './components/AppointmentConfirmation'
import { Toaster } from 'react-hot-toast'
import NotFound from './pages/NotFound'
import UpdatePassword from './pages/UpdatePassword'
import VideoCall from './pages/VideoCall'
import DoctorPatients from './pages/DoctorPatients'
import HealthVault from './pages/HealthVault'
import DoctorPatientRecords from './pages/DoctorPatientRecords'
import AdminOverview from './pages/admin/AdminOverview'
import AdminDoctorApps from './pages/admin/AdminDoctorApps'
import AdminHospitals from './pages/admin/AdminHospitals'
import AdminDoctors from './pages/admin/AdminDoctors'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminUsers from './pages/admin/AdminUsers'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export default function App() {
    const location = useLocation()

    return (
        <AuthProvider>
            <ErrorBoundary>
                <ConsentPopup />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            fontSize: '1.1rem',
                            padding: '16px 24px',
                            maxWidth: '500px'
                        }
                    }}
                />
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
                    >
                        <Routes location={location}>
                            {/* Public auth routes — no layout */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/update-password" element={<UpdatePassword />} />

                            {/* All authenticated users */}
                            <Route element={<ProtectedRoute />}>
                                <Route element={<MainLayout />}>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/contact" element={<Contact />} />
                                    <Route path="/security" element={<SecurityPolicy />} />
                                    <Route path="/hospitals" element={<Hospitals />} />
                                    <Route path="/hospitals/:id" element={<HospitalDetail />} />
                                    <Route path="/teleconsult/:appointmentId" element={<TeleconsultRoom />} />
                                    <Route path="/video-call/:sessionId" element={<VideoCall />} />
                                    <Route path="/emergency" element={<Emergency />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="/doctors" element={<Navigate to="/hospitals" replace />} />
                                    <Route path="/doctors/:id" element={<DoctorDetail />} />
                                    {/* Shared between patients and doctors */}
                                    <Route path="/chat" element={<AiChat />} />
                                    <Route path="/patients" element={<Patients />} />
                                </Route>
                            </Route>

                            {/* Patient-only routes */}
                            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                                <Route element={<MainLayout />}>
                                    <Route path="/appointment-confirmation" element={<AppointmentConfirmation />} />
                                    <Route path="/services" element={<Services />} />
                                    <Route path="/insurance" element={<Insurance />} />

                                    {/* Dashboard with sidebar */}
                                    <Route path="/dashboard" element={<DashboardLayout />}>
                                        <Route index element={<Dashboard activeTab="overview" />} />
                                        <Route path="symptom-checker" element={<SymptomChecker />} />
                                        <Route path="blood-donation" element={<BloodDonation />} />
                                        <Route path="appointments" element={<Dashboard activeTab="appointments" />} />
                                        <Route path="hospital-rec" element={<HospitalRecommendation />} />
                                        <Route path="apply-doctor" element={<ApplyDoctor />} />
                                        <Route path="health-vault" element={<HealthVault />} />
                                    </Route>

                                    {/* Old direct routes → redirect to dashboard sub-pages */}
                                    <Route path="/symptom-checker" element={<Navigate to="/dashboard/symptom-checker" replace />} />
                                    <Route path="/blood-donation" element={<Navigate to="/dashboard/blood-donation" replace />} />
                                </Route>
                            </Route>

                            {/* Doctor-only routes */}
                            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                                <Route element={<MainLayout />}>
                                    <Route path="/doctor-dashboard" element={<DashboardLayout />}>
                                        <Route index element={<DoctorDashboard />} />
                                        <Route path="patients" element={<DoctorPatients />} />
                                        <Route path="patient-records" element={<DoctorPatientRecords />} />
                                        <Route path="health-worker" element={<HealthWorkerMode />} />
                                        <Route path="hospital-rec" element={<HospitalRecommendation />} />
                                        <Route path="population-health" element={<AdminDashboard mode="population" />} />
                                        <Route path="analytics" element={<AdminDashboard mode="analytics" />} />
                                        <Route path="applications" element={<AdminDashboard mode="applications" />} />
                                    </Route>

                                    <Route path="/health-worker" element={<Navigate to="/doctor-dashboard/health-worker" replace />} />
                                    <Route path="/hospital-recommendation" element={<Navigate to="/doctor-dashboard/hospital-rec" replace />} />
                                </Route>
                            </Route>

                            {/* Admin-only routes — standalone layout, no MainLayout navbar */}
                            <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor']} />}>
                                <Route path="/admin-dashboard" element={<AdminLayout />}>
                                    <Route index element={<AdminOverview />} />
                                    <Route path="applications" element={<AdminDoctorApps />} />
                                    <Route path="hospitals" element={<AdminHospitals />} />
                                    <Route path="doctors" element={<AdminDoctors />} />
                                    <Route path="appointments" element={<AdminAppointments />} />
                                    <Route path="users" element={<AdminUsers />} />
                                </Route>
                            </Route>

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </motion.div>
                </AnimatePresence>
            </ErrorBoundary>
        </AuthProvider>
    )
}


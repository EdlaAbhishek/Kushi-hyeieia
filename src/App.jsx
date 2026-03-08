import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Home from './pages/Home'
import About from './pages/About'
import ApplyDoctor from './pages/ApplyDoctor'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import AiChat from './pages/AiChat'
import SymptomChecker from './pages/SymptomChecker'
import HospitalRecommendation from './pages/HospitalRecommendation'
import HealthWorkerMode from './pages/HealthWorkerMode'
import AdminDashboard from './pages/AdminDashboard'
import SecurityPolicy from './pages/SecurityPolicy'
import Doctors from './pages/Doctors'
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

export default function App() {
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
                <Routes>
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
                            {/* Shared between patients and doctors */}
                            <Route path="/chat" element={<AiChat />} />
                            <Route path="/patients" element={<Patients />} />
                        </Route>
                    </Route>

                    {/* Patient-only routes */}
                    <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                        <Route element={<MainLayout />}>
                            <Route path="/doctors" element={<Doctors />} />
                            <Route path="/doctors/:id" element={<DoctorDetail />} />
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
                                <Route path="health-worker" element={<HealthWorkerMode />} />
                                <Route path="hospital-rec" element={<HospitalRecommendation />} />
                                <Route path="population-health" element={<AdminDashboard mode="population" />} />
                                <Route path="analytics" element={<AdminDashboard mode="analytics" />} />
                            </Route>

                            <Route path="/health-worker" element={<Navigate to="/doctor-dashboard/health-worker" replace />} />
                            <Route path="/hospital-recommendation" element={<Navigate to="/doctor-dashboard/hospital-rec" replace />} />
                            <Route path="/admin-dashboard" element={<Navigate to="/doctor-dashboard/population-health" replace />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </ErrorBoundary>
        </AuthProvider>
    )
}

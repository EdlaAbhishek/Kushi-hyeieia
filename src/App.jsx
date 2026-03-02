import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import AiChat from './pages/AiChat'
import Doctors from './pages/Doctors'
import Hospitals from './pages/Hospitals'
import TeleconsultRoom from './pages/TeleconsultRoom'
import Patients from './pages/Patients'
import Services from './pages/Services'
import Emergency from './pages/Emergency'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public auth routes — no layout */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* All authenticated users */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/hospitals" element={<Hospitals />} />
                        <Route path="/teleconsult/:appointmentId" element={<TeleconsultRoom />} />
                        <Route path="/emergency" element={<Emergency />} />
                    </Route>
                </Route>

                {/* Patient-only routes */}
                <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/chat" element={<AiChat />} />
                        <Route path="/doctors" element={<Doctors />} />
                        <Route path="/patients" element={<Patients />} />
                        <Route path="/services" element={<Services />} />
                    </Route>
                </Route>

                {/* Doctor-only routes */}
                <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                    <Route element={<MainLayout />}>
                        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                    </Route>
                </Route>
            </Routes>
        </AuthProvider>
    )
}

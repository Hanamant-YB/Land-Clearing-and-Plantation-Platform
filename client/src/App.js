// client/src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Navbar    from './components/Navbar';
import Footer    from './components/Footer';
import Home      from './pages/Home';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Notifications from './pages/Notifications';

import JobPost           from './pages/landowner/JobPost';
import Shortlist         from './pages/landowner/Shortlist';
import LandownerProgress from './pages/landowner/JobProgress';
import LandownerProfile  from './pages/landowner/LandownerProfile';
import PaymentManagement from './pages/landowner/PaymentManagement';
import LandownerHome     from './pages/landowner/LandownerHome';
import LandownerLayout   from './pages/landowner/LandownerLayout';

import ContractorProfile  from './pages/contractor/ContractorProfile';
import PastWorks          from './pages/contractor/PastWorks';
import Assignments        from './pages/contractor/Assignments';
import JobSchedule        from './pages/contractor/JobSchedule';
import ContractorProgress from './pages/contractor/JobProgress';
import Payments           from './pages/contractor/Payments';
import FeedBack           from './pages/contractor/FeedBack';
import WorkManagement     from './pages/contractor/WorkManagement';

import AdminDashboard from './pages/admin/AdminDashboard';
import EyeModalTest from './pages/admin/EyeModalTest';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import './App.css';
import './assets/styles.css';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="app">
            <main className="main-content">
              <Routes>
                {/* Public */}
                {/* Wrap Home in a full-width div to remove side spacing */}
                <Route
                  path="/"
                  element={
                    <div className="full-width">
                      <Home />
                    </div>
                  }
                />
                <Route path="login"    element={<Login />} />
                <Route path="register" element={<Register />} />

                {/* Notifications (requires login) */}
                <Route
                  path="notifications"
                  element={
                    <RequireAuth>
                      <Notifications />
                    </RequireAuth>
                  }
                />

                {/* Landowner (requires login) */}
                <Route
                  path="landowner/*"
                  element={
                    <RequireAuth>
                      <LandownerLayout>
                        <Routes>
                          <Route path="profile"   element={<LandownerProfile />} />
                          <Route path="post"      element={<JobPost />} />
                          <Route path="shortlist" element={<Shortlist />} />
                          <Route path="progress"  element={<LandownerProgress />} />
                          <Route path="payments"  element={<PaymentManagement />} />
                          <Route path="home"      element={<LandownerHome />} />
                          <Route path="" element={<Navigate to="home" replace />} />
                        </Routes>
                      </LandownerLayout>
                    </RequireAuth>
                  }
                />

                {/* Contractor (requires login) */}
                <Route
                  path="contractor/*"
                  element={
                    <RequireAuth>
                      <Routes>
                        <Route path="profile"                     element={<ContractorProfile />} />
                        <Route path="pastworks"                   element={<PastWorks />} />
                        <Route path="assignments"                 element={<Assignments />} />
                        <Route path="assignments/:jobId/schedule" element={<JobSchedule />} />
                        <Route path="assignments/:jobId/progress" element={<ContractorProgress />} />
                        <Route path="payments"                    element={<Payments />} />
                        <Route path="feedback"                    element={<FeedBack />} />
                        <Route path="ratings"                     element={<FeedBack />} />
                        <Route path="work-management"             element={<WorkManagement />} />
                      </Routes>
                    </RequireAuth>
                  }
                />

                {/* Admin (admin only) */}
                <Route
                  path="admin"
                  element={
                    <RequireAdmin>
                      <div className="admin-wrapper">
                        <AdminDashboard />
                      </div>
                    </RequireAdmin>
                  }
                />
                <Route path="/admin/eye-modal-test" element={<EyeModalTest />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

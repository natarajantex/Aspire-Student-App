/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Tests from './pages/Tests';
import Reports from './pages/Reports';
import StudentProfile from './pages/StudentProfile';
import Settings from './pages/Settings';
import ParentLogin from './pages/ParentLogin';
import StaffLogin from './pages/StaffLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext, AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<ParentLogin />} />
          <Route path="/staff" element={<StaffLogin />} />
          <Route path="/admin" element={<StaffLogin />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              
              {/* Parent specific routes */}
              <Route path="student/:id" element={<StudentProfile />} />
              
              {/* Admin only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="attendance" element={<Attendance />} />
                <Route path="tests" element={<Tests />} />
                <Route path="students" element={<Students />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

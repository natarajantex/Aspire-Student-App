import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { Shield, Lock, Phone } from 'lucide-react';

export default function ParentLogin() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const mobile = mobileNumber.trim();
      const pwd = password.trim();

      if (!mobile || !pwd) {
        setError('Please enter mobile number and password.');
        setLoading(false);
        return;
      }

      // Query the Parents table directly via InsForge SDK
      const { data: parents, error: dbError } = await insforge.database
        .from('Parents')
        .select('*, Students(Name, StudentStatus)')
        .eq('MobileNumber', mobile)
        .eq('Status', 'Active');

      if (dbError) {
        console.error('DB Error:', dbError);
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      if (!parents || parents.length === 0) {
        setError('Invalid mobile number or account not found.');
        setLoading(false);
        return;
      }

      const parent = parents[0];

      // Verify the password
      if (parent.Password !== pwd) {
        setError('Invalid password.');
        setLoading(false);
        return;
      }

      // Check if the linked student is active
      const student = Array.isArray(parent.Students) ? parent.Students[0] : parent.Students;
      if (!student || student.StudentStatus !== 'Active') {
        setError('Your student account is no longer active. Please contact the institute.');
        setLoading(false);
        return;
      }

      // Build user object and login
      const userData = {
        id: parent.ParentID,
        name: parent.ParentName,
        role: 'parent' as const,
        studentId: parent.StudentID,
      };

      login(userData, `parent-${parent.ParentID}`);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Aspire Parent Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to view your student's progress
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Username: 10-digit mobile number</p>
            <p>Password: Last 5 digits of mobile number</p>
          </div>
        </div>
      </div>
    </div>
  );
}

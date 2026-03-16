import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  BookOpen, 
  CalendarCheck, 
  FileText, 
  MessageCircle,
  BarChart2,
  TrendingUp,
  Edit,
  X,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = role === 'parent' ? 'overview' : 'overview';
  const activeTab = tabFromUrl || defaultTab;

  useEffect(() => {
    if (role === 'parent' && user?.studentId && user.studentId !== id) {
      navigate(`/student/${user.studentId}`, { replace: true });
    }
  }, [id, role, user, navigate]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const [student, setStudent] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    name: '',
    parentName: '',
    parentWhatsApp: '',
    classId: '',
    studentStatus: '',
    rollNumber: '',
    photo: '',
    subjects: [] as string[]
  });
  const [isRollNumberUnlocked, setIsRollNumberUnlocked] = useState(false);

  const fetchStudentData = () => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        const found = data.find((s: any) => s.StudentID === id);
        setStudent(found);
        if (found) {
          setEditFormData({
            name: found.Name,
            parentName: found.ParentName,
            parentWhatsApp: found.ParentWhatsAppNumber,
            classId: found.ClassID,
            studentStatus: found.StudentStatus || 'Active',
            rollNumber: found.RollNumber || '',
            photo: found.Photo || '',
            subjects: found.EnrolledSubjectIDs ? found.EnrolledSubjectIDs.split(',') : []
          });
        }
      });
  };

  useEffect(() => {
    fetchStudentData();

    // Fetch report data
    if (id) {
      fetch(`/api/reports/student/${id}`)
        .then(res => res.json())
        .then(setReportData);
    }
    
    fetch('/api/classes').then(res => res.json()).then(setClasses);
    fetch('/api/subjects').then(res => res.json()).then(setSubjects);
  }, [id]);

  if (!student || !reportData) {
    return <div className="p-4 text-center">Loading profile...</div>;
  }

  const handleWhatsApp = () => {
    let msg = `Dear Parent,\nUpdate for ${student.Name}:\n`;
    
    if (reportData.attendance && reportData.attendance.length > 0) {
      msg += `\n*Attendance:*\n`;
      reportData.attendance.forEach((a: any) => {
        const perc = a.TotalClasses > 0 ? Math.round((a.PresentClasses / a.TotalClasses) * 100) : 0;
        msg += `- ${a.SubjectName}: ${perc}%\n`;
      });
    }

    if (reportData.tests && reportData.tests.length > 0) {
      msg += `\n*Test Averages:*\n`;
      reportData.tests.forEach((t: any) => {
        const avg = t.AveragePercentage ? Math.round(t.AveragePercentage) : 0;
        msg += `- ${t.SubjectName}: ${avg}%\n`;
      });
    }

    window.open(`https://wa.me/${student.ParentWhatsAppNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Calculate overall attendance percentage
  let totalClasses = 0;
  let presentClasses = 0;
  reportData.attendance?.forEach((a: any) => {
    totalClasses += a.TotalClasses;
    presentClasses += a.PresentClasses;
  });
  const overallAttendance = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  // Calculate overall test average
  let totalTestAvg = 0;
  let testCount = 0;
  reportData.tests?.forEach((t: any) => {
    if (t.AveragePercentage !== null) {
      totalTestAvg += t.AveragePercentage;
      testCount++;
    }
  });
  const overallTestAvg = testCount > 0 ? Math.round(totalTestAvg / testCount) : 0;

  const handleSubjectToggle = (subjectId: string) => {
    setEditFormData(prev => {
      const current = prev.subjects;
      if (current.includes(subjectId)) {
        return { ...prev, subjects: current.filter((id: string) => id !== subjectId) };
      } else {
        return { ...prev, subjects: [...current, subjectId] };
      }
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        alert('Student updated successfully!');
        handleTabChange('overview');
        fetchStudentData();
      } else {
        alert('Failed to update student.');
      }
    } catch (err) {
      alert('Error updating student.');
    }
  };

  const availableSubjects = subjects.filter(s => s.ClassID === editFormData.classId);

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8">
      <div className="flex items-center mb-6">
        {role !== 'parent' && (
          <button onClick={() => navigate(-1)} className="mr-3 p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{student.Name}</h2>
          <p className="text-sm text-gray-500 font-medium">Roll No: {student.RollNumber} • {student.ClassName}</p>
        </div>
      </div>

      {activeTab === 'edit' && role === 'admin' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Edit Student</h3>
            <button onClick={() => handleTabChange('overview')} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Read-Only Fields */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
                <p className="text-sm text-gray-700">{student.AcademicYear}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Enrollment Date</label>
                <p className="text-sm text-gray-700">{student.EnrollmentDate}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Student ID</label>
                <p className="text-xs font-mono text-gray-500 truncate">{student.StudentID}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                <span>Roll Number</span>
                <button 
                  type="button" 
                  onClick={() => setIsRollNumberUnlocked(!isRollNumberUnlocked)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {isRollNumberUnlocked ? 'Lock' : 'Unlock'}
                </button>
              </label>
              <input
                type="text"
                required
                disabled={!isRollNumberUnlocked}
                className={`w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono ${!isRollNumberUnlocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={editFormData.rollNumber}
                onChange={(e) => setEditFormData({...editFormData, rollNumber: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
              <div className="flex items-center space-x-4">
                {editFormData.photo && (
                  <div className="relative">
                    <img src={editFormData.photo} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, photo: '' }))}
                      className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-200 text-gray-500 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Status</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                value={editFormData.studentStatus}
                onChange={(e) => setEditFormData({...editFormData, studentStatus: e.target.value})}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  value={editFormData.classId}
                  onChange={(e) => setEditFormData({...editFormData, classId: e.target.value, subjects: []})}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent's Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={editFormData.parentName}
                  onChange={(e) => setEditFormData({...editFormData, parentName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent WhatsApp Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={editFormData.parentWhatsApp}
                  onChange={(e) => setEditFormData({...editFormData, parentWhatsApp: e.target.value})}
                />
              </div>
            </div>

            {editFormData.classId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects Enrolled</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSubjects.map(subject => (
                    <label 
                      key={subject.SubjectID} 
                      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${
                        editFormData.subjects.includes(subject.SubjectID) 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        checked={editFormData.subjects.includes(subject.SubjectID)}
                        onChange={() => handleSubjectToggle(subject.SubjectID)}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">{subject.SubjectName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSaveEdit}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center mt-6"
            >
              <Save className="w-5 h-5 mr-2" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        {student.Photo ? (
          <img src={student.Photo} alt={student.Name} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-indigo-50" />
        ) : (
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
            <User className="w-12 h-12" />
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900">{student.Name}</h2>
        <div className="flex items-center space-x-2 mt-2">
          <p className="text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {student.RollNumber || student.StudentID}
          </p>
          <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {student.AcademicYear || 'N/A'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-sm text-gray-600">
          <span className="bg-gray-100 px-3 py-1 rounded-full">{student.ClassName}</span>
          <span className={`px-3 py-1 rounded-full font-medium ${
            student.StudentStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' :
            student.StudentStatus === 'Inactive' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {student.StudentStatus || 'Active'}
          </span>
        </div>
      </div>

      {role !== 'parent' && (
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('attendance')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Attendance
          </button>
          <button
            onClick={() => handleTabChange('tests')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Tests
          </button>
          {role === 'admin' && (
            <button
              onClick={() => handleTabChange('edit')}
              className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'edit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Edit Student
            </button>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* Contact & Subjects Info */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-start">
          <BookOpen className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Enrolled Subjects</p>
            <p className="text-gray-900 mt-1">{student.EnrolledSubjects || 'None'}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 flex items-start">
          <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Parent Contact</p>
            <p className="text-gray-900 mt-1">{student.ParentName}</p>
            <p className="text-indigo-600">+{student.ParentWhatsAppNumber}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 flex items-start">
          <CalendarCheck className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Enrollment Date</p>
            <p className="text-gray-900 mt-1">{student.EnrollmentDate || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {role !== 'parent' && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            <Link 
              to="/attendance" 
              className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors"
            >
              <CalendarCheck className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-xs font-medium text-gray-700">Attendance</span>
            </Link>
            <Link 
              to="/tests" 
              className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors"
            >
              <FileText className="w-6 h-6 text-amber-500 mb-2" />
              <span className="text-xs font-medium text-gray-700">Test Marks</span>
            </Link>
            <button 
              onClick={handleWhatsApp}
              className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-green-500 mb-2" />
              <span className="text-xs font-medium text-gray-700">WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-indigo-600" />
          Performance Overview
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Attendance</p>
            <p className={`text-2xl font-bold ${overallAttendance >= 75 ? 'text-emerald-600' : overallAttendance >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {overallAttendance}%
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Avg Score</p>
            <p className={`text-2xl font-bold ${overallTestAvg >= 75 ? 'text-emerald-600' : overallTestAvg >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {overallTestAvg}%
            </p>
          </div>
        </div>

        {/* Recent Attendance */}
        {reportData.recentAttendance && reportData.recentAttendance.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
              <CalendarCheck className="w-4 h-4 mr-2 text-gray-400" />
              Recent Attendance
            </h4>
            <div className="space-y-3">
              {reportData.recentAttendance.map((record: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{record.SubjectName}</p>
                    <p className="text-xs text-gray-500">{record.Date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${record.Status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {record.Status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tests */}
        {reportData.recentTests && reportData.recentTests.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
              Recent Tests
            </h4>
            <div className="space-y-3">
              {reportData.recentTests.map((test: any, idx: number) => {
                const perc = test.IsAbsent ? 0 : Math.round((test.MarksObtained / test.TotalMarks) * 100);
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{test.SubjectName}</p>
                      {test.Chapter && <p className="text-xs text-indigo-600 font-medium">{test.Chapter}</p>}
                      <p className="text-xs text-gray-500">{test.Date}</p>
                    </div>
                    <div className="text-right">
                      {test.IsAbsent ? (
                        <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Absent</span>
                      ) : (
                        <>
                          <p className="font-bold text-gray-900">{test.MarksObtained} <span className="text-gray-400 text-sm font-normal">/ {test.TotalMarks}</span></p>
                          <p className={`text-xs font-medium ${perc >= 75 ? 'text-emerald-600' : perc >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {perc}%
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'attendance' && (
        <AttendanceReport data={reportData.allAttendance || []} />
      )}

      {activeTab === 'tests' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Test Records</h3>
          {reportData.recentTests && reportData.recentTests.length > 0 ? (
            <div className="space-y-3">
              {reportData.recentTests.map((test: any, idx: number) => {
                const perc = test.IsAbsent ? 0 : Math.round((test.MarksObtained / test.TotalMarks) * 100);
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{test.SubjectName}</p>
                      {test.Chapter && <p className="text-xs text-indigo-600 font-medium">{test.Chapter}</p>}
                      <p className="text-xs text-gray-500">{test.Date}</p>
                    </div>
                    <div className="text-right">
                      {test.IsAbsent ? (
                        <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Absent</span>
                      ) : (
                        <>
                          <p className="font-bold text-gray-900">{test.MarksObtained} <span className="text-gray-400 text-sm font-normal">/ {test.TotalMarks}</span></p>
                          <p className={`text-xs font-medium ${perc >= 75 ? 'text-emerald-600' : perc >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {perc}%
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No test records found.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AttendanceReport({ data }: { data: any[] }) {
  const totalClasses = data.length;
  const presentClasses = data.filter(d => d.Status === 'Present').length;
  const totalAbsences = totalClasses - presentClasses;
  const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const subjectStats: Record<string, { total: number, present: number }> = {};
  data.forEach(d => {
    if (!subjectStats[d.SubjectName]) {
      subjectStats[d.SubjectName] = { total: 0, present: 0 };
    }
    subjectStats[d.SubjectName].total++;
    if (d.Status === 'Present') {
      subjectStats[d.SubjectName].present++;
    }
  });

  const monthStats: Record<string, { total: number, present: number, subjects: Record<string, { total: number, present: number }> }> = {};
  
  data.forEach(d => {
    const month = d.Date.substring(0, 7);
    if (!monthStats[month]) {
      monthStats[month] = { total: 0, present: 0, subjects: {} };
    }
    monthStats[month].total++;
    if (d.Status === 'Present') {
      monthStats[month].present++;
    }
    
    if (!monthStats[month].subjects[d.SubjectName]) {
      monthStats[month].subjects[d.SubjectName] = { total: 0, present: 0 };
    }
    monthStats[month].subjects[d.SubjectName].total++;
    if (d.Status === 'Present') {
      monthStats[month].subjects[d.SubjectName].present++;
    }
  });

  const getMonthName = (yyyyMM: string) => {
    const [year, month] = yyyyMM.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const chartData = Object.keys(monthStats).sort().map(month => ({
    name: getMonthName(month),
    attendance: Math.round((monthStats[month].present / monthStats[month].total) * 100)
  }));

  const getColorClass = (perc: number) => {
    if (perc >= 90) return 'text-emerald-600';
    if (perc >= 75) return 'text-amber-500';
    return 'text-rose-600';
  };
  const getBgColorClass = (perc: number) => {
    if (perc >= 90) return 'bg-emerald-100 text-emerald-700';
    if (perc >= 75) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-xs text-gray-500 uppercase">Total Classes</p>
            <p className="text-xl font-bold text-gray-900">{totalClasses}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-xs text-gray-500 uppercase">Attended</p>
            <p className="text-xl font-bold text-emerald-600">{presentClasses}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-xs text-gray-500 uppercase">Absences</p>
            <p className="text-xl font-bold text-rose-600">{totalAbsences}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-xs text-gray-500 uppercase">Overall %</p>
            <p className={`text-xl font-bold ${getColorClass(overallPercentage)}`}>{overallPercentage}%</p>
          </div>
        </div>

        <h4 className="text-sm font-bold text-gray-700 mb-3">Subject-wise Attendance</h4>
        <div className="space-y-2">
          {Object.entries(subjectStats).map(([subject, stats]) => {
            const perc = Math.round((stats.present / stats.total) * 100);
            return (
              <div key={subject} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-800">{subject}</span>
                <span className={`text-sm font-bold px-2 py-1 rounded ${getBgColorClass(perc)}`}>
                  {perc}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="attendance" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 rounded-tl-lg">Month</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2 text-center">Total</th>
                <th className="px-3 py-2 text-center">Attended</th>
                <th className="px-3 py-2 text-right rounded-tr-lg">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.keys(monthStats).sort().reverse().map(month => {
                const mStats = monthStats[month];
                const overallPerc = Math.round((mStats.present / mStats.total) * 100);
                const subjects = Object.keys(mStats.subjects);
                
                return (
                  <React.Fragment key={month}>
                    <tr className="bg-gray-50/50 font-medium">
                      <td className="px-3 py-2 text-gray-900" rowSpan={subjects.length + 1}>{getMonthName(month)}</td>
                      <td className="px-3 py-2 text-gray-700 italic">Overall</td>
                      <td className="px-3 py-2 text-center">{mStats.total}</td>
                      <td className="px-3 py-2 text-center">{mStats.present}</td>
                      <td className={`px-3 py-2 text-right font-bold ${getColorClass(overallPerc)}`}>{overallPerc}%</td>
                    </tr>
                    {subjects.map(sub => {
                      const sStats = mStats.subjects[sub];
                      const sPerc = Math.round((sStats.present / sStats.total) * 100);
                      return (
                        <tr key={`${month}-${sub}`}>
                          <td className="px-3 py-2 text-gray-600">{sub}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{sStats.total}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{sStats.present}</td>
                          <td className={`px-3 py-2 text-right font-medium ${getColorClass(sPerc)}`}>{sPerc}%</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Log</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {data.map((record, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{record.SubjectName}</p>
                <p className="text-xs text-gray-500">{record.Date}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium px-2 py-1 rounded ${record.Status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {record.Status}
                </span>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-center text-gray-500 py-4">No attendance records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

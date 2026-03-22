import { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Users, CalendarCheck, FileText, ArrowRight, Search, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { role, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const navigate = useNavigate();

  // Fetch dashboard data (with academic year filter)
  const fetchDashboard = (year?: string) => {
    const url = year ? `/api/dashboard?academicYear=${encodeURIComponent(year)}` : '/api/dashboard';
    fetch(url).then(res => res.json()).then(d => {
      setData(d);
      // Set default selected year to the active academic year on first load
      if (!selectedYear && d.activeAcademicYear) {
        setSelectedYear(d.activeAcademicYear);
        // Re-fetch with the active year filter
        fetch(`/api/dashboard?academicYear=${encodeURIComponent(d.activeAcademicYear)}`)
          .then(res => res.json())
          .then(setData);
      }
    });
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchDashboard();
      fetch('/api/students').then(res => res.json()).then(setStudents);
      fetch('/api/classes').then(res => res.json()).then(setClasses);
      fetch('/api/subjects').then(res => res.json()).then(setSubjects);
    }
  }, [role]);

  // Re-fetch dashboard when year changes
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    fetchDashboard(year);
  };

  if (role === 'parent' && user?.studentId) {
    return <Navigate to={`/student/${user.studentId}`} replace />;
  }

  if (!data) return <div className="p-4 text-center">Loading...</div>;

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.Name.toLowerCase().includes(search.toLowerCase()) || 
                          s.StudentID.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter ? s.ClassID === classFilter : true;
    const matchesSubject = subjectFilter ? (s.EnrolledSubjectIDs && s.EnrolledSubjectIDs.includes(subjectFilter)) : true;
    return matchesSearch && matchesClass && matchesSubject;
  });

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Academic Year Selector */}
      {data.academicYears && data.academicYears.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-violet-50 rounded-xl">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
              <select
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold text-gray-900"
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
              >
                {data.academicYears.map((y: any) => (
                  <option key={y.AcademicYearID} value={y.AcademicYear}>
                    {y.AcademicYear} {y.Status === 'Active' ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Students {selectedYear ? `(${selectedYear})` : ''}
            </p>
            <h2 className="text-3xl font-bold text-gray-900">{data.totalStudents}</h2>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        {data.classWiseStudents && data.classWiseStudents.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            {data.classWiseStudents.map((cls: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{cls.ClassName}</span>
                <span className="text-lg font-bold text-indigo-600">{cls.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarCheck className="w-5 h-5 mr-2 text-indigo-500" />
          Today's Classes ({data.today})
        </h3>
        {data.todayClasses.length > 0 ? (
          <ul className="space-y-3">
            {data.todayClasses.map((cls: any, idx: number) => (
              <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{cls.ClassName} - {cls.SubjectName}</p>
                  <p className="text-sm text-gray-500">{cls.Time}</p>
                </div>
                <Link 
                  to={`/attendance?subject=${cls.SubjectID}`}
                  className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No classes scheduled for today.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/attendance" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
          <div className="p-3 bg-emerald-50 rounded-full mb-3">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="font-medium text-gray-900">Mark Attendance</span>
        </Link>
        <Link to="/tests" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
          <div className="p-3 bg-amber-50 rounded-full mb-3">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <span className="font-medium text-gray-900">Enter Marks</span>
        </Link>
      </div>
    </div>
  );
}

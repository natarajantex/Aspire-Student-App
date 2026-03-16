import { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Users, CalendarCheck, FileText, ArrowRight, Search, Filter } from 'lucide-react';
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

  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      fetch('/api/dashboard').then(res => res.json()).then(setData);
      fetch('/api/students').then(res => res.json()).then(setStudents);
      fetch('/api/classes').then(res => res.json()).then(setClasses);
      fetch('/api/subjects').then(res => res.json()).then(setSubjects);
    }
  }, [role]);

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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Students</p>
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

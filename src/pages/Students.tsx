import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, X, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '2025-2026',
    classId: '',
    parentName: '',
    parentWhatsApp: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    subjects: [] as string[],
    photo: '',
    rollNumber: ''
  });

  const navigate = useNavigate();

  const fetchStudents = () => {
    fetch('/api/students')
      .then(res => res.json())
      .then(setStudents);
  };

  const [academicYears, setAcademicYears] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
    fetch('/api/classes').then(res => res.json()).then(setClasses);
    fetch('/api/subjects').then(res => res.json()).then(setSubjects);
    fetch('/api/academic-years')
      .then(res => res.json())
      .then(data => {
        setAcademicYears(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, academicYear: data[0].AcademicYear }));
          setYearFilter(data[0].AcademicYear);
        }
      });
  }, []);

  useEffect(() => {
    if (formData.academicYear && formData.classId) {
      fetch(`/api/generate-roll-number?academicYear=${formData.academicYear}&classId=${formData.classId}`)
        .then(res => res.json())
        .then(data => {
          if (data.rollNumber) {
            setFormData(prev => ({ ...prev, rollNumber: data.rollNumber }));
          }
        })
        .catch(err => console.error('Failed to generate roll number', err));
    }
  }, [formData.academicYear, formData.classId]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.Name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.RollNumber && s.RollNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesClass = classFilter ? s.ClassID === classFilter : true;
    const matchesSubject = subjectFilter ? (s.EnrolledSubjectIDs && s.EnrolledSubjectIDs.includes(subjectFilter)) : true;
    const matchesYear = yearFilter ? s.AcademicYear === yearFilter : true;
    const matchesStatus = statusFilter ? s.StudentStatus === statusFilter : true;
    return matchesSearch && matchesClass && matchesSubject && matchesYear && matchesStatus;
  });

  const availableSubjects = subjects.filter(s => s.ClassID === formData.classId);

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => {
      const current = prev.subjects;
      if (current.includes(subjectId)) {
        return { ...prev, subjects: current.filter(id => id !== subjectId) };
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
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (res.ok) {
        alert('Student enrolled successfully!\n\nParent Portal Login:\nUsername: ' + formData.parentWhatsApp + '\nPassword: ' + formData.parentWhatsApp.slice(-5));
        setShowForm(false);
        setFormData({
          name: '',
          academicYear: academicYears.length > 0 ? academicYears[0].AcademicYear : '',
          classId: '',
          parentName: '',
          parentWhatsApp: '',
          enrollmentDate: new Date().toISOString().split('T')[0],
          subjects: [],
          photo: '',
          rollNumber: ''
        });
        fetchStudents();
      } else {
        alert(result.error || 'Failed to enroll student.');
      }
    } catch (err) {
      alert('Error enrolling student.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showForm ? 'Cancel' : 'Enroll New'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
            Enroll New Student
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select 
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.academicYear}
                onChange={e => setFormData({...formData, academicYear: e.target.value})}
              >
                {academicYears.map(y => <option key={y.AcademicYear} value={y.AcademicYear}>{y.AcademicYear}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
              <input 
                type="text" required
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
              <div className="flex items-center space-x-4">
                {formData.photo && (
                  <div className="relative">
                    <img src={formData.photo} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select 
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.classId}
                onChange={e => setFormData({...formData, classId: e.target.value, subjects: []})}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>)}
              </select>
            </div>

            {formData.classId && formData.academicYear && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input 
                  type="text" required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  value={formData.rollNumber}
                  onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Automatically generated. You can edit if needed.</p>
              </div>
            )}

            {formData.classId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                <div className="space-y-2">
                  {availableSubjects.map(sub => (
                    <label key={sub.SubjectID} className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        checked={formData.subjects.includes(sub.SubjectID)}
                        onChange={() => handleSubjectToggle(sub.SubjectID)}
                      />
                      <span className="text-sm text-gray-700">{sub.SubjectName}</span>
                    </label>
                  ))}
                  {availableSubjects.length === 0 && <p className="text-xs text-gray-500">No subjects available for this class.</p>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
              <input 
                type="text" required
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.parentName}
                onChange={e => setFormData({...formData, parentName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Mobile Number</label>
              <input 
                type="tel" required placeholder="e.g. 9876543210"
                pattern="[0-9]{10}"
                maxLength={10}
                title="Enter 10-digit mobile number (without country code)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.parentWhatsApp}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({...formData, parentWhatsApp: val});
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                10-digit number. This will be used as parent portal username. Last 5 digits will be the password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
              <input 
                type="date" required
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.enrollmentDate}
                onChange={e => setFormData({...formData, enrollmentDate: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors mt-4"
            >
              Save Student
            </button>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or roll number..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="relative">
                <select
                  className="block w-full pl-2 pr-6 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="relative">
                <select
                  className="block w-full pl-2 pr-6 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs appearance-none"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  <option value="">All Years</option>
                  {academicYears.map(y => <option key={y.AcademicYear} value={y.AcademicYear}>{y.AcademicYear}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  className="block w-full pl-2 pr-6 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs appearance-none"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>)}
                </select>
              </div>
              <div className="relative">
                <select
                  className="block w-full pl-2 pr-6 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs appearance-none"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.SubjectID} value={s.SubjectID}>{s.SubjectName}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div 
                key={student.StudentID} 
                onClick={() => navigate(`/student/${student.StudentID}`)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    {student.Photo ? (
                      <img src={student.Photo} alt={student.Name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {student.Name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{student.Name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {student.RollNumber || student.StudentID}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {student.AcademicYear || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {student.ClassName}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      student.StudentStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      student.StudentStatus === 'Inactive' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {student.StudentStatus}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 mt-3">
                  <p><span className="font-medium text-gray-500">Subjects:</span> {student.EnrolledSubjects || 'None'}</p>
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 border-dashed">
                <p className="text-gray-500">No students found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Save, CheckCircle2, XCircle, MessageCircle, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { insforge } from '../lib/insforge';

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || '';
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    Promise.all([
      insforge.database.from('Subjects').select('*, Classes(ClassName)').then(res => res.data || []),
      insforge.database.from('AcademicYears').select('*').order('AcademicYear', { ascending: false }).then(res => res.data || [])
    ]).then(([subjectsData, yearsData]) => {
      const mappedIdx = subjectsData.map((s:any) => ({...s, ClassName: s.Classes?.ClassName || ''}));
      setSubjects(mappedIdx);
      if (!selectedSubject && mappedIdx.length > 0) {
        setSelectedSubject(mappedIdx[0].SubjectID);
      }
      setAcademicYears(yearsData);
      if (yearsData.length > 0) {
        setSelectedYear(yearsData[0].AcademicYear);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedSubject && date && selectedYear) {
      const fetchAttendance = async () => {
        const { data: studentSubjects } = await insforge.database
          .from('StudentSubjects')
          .select('StudentID, Students(*)')
          .eq('SubjectID', selectedSubject);

        const { data: attendanceRecords } = await insforge.database
          .from('Attendance')
          .select('*')
          .eq('Date', date)
          .eq('SubjectID', selectedSubject);

        const attendanceMap = new Map((attendanceRecords || []).map((a: any) => [a.StudentID, a.Status]));

        const activeStudents = (studentSubjects || [])
          .map((ss: any) => ss.Students)
          .filter((st: any) => !!st)
          .filter((st: any) => {
             const isActive = st.StudentStatus === 'Active' || !st.StudentStatus;
             const matchesYear = st.AcademicYear === selectedYear;
             const hasAttendance = attendanceMap.has(st.StudentID);
             return isActive && (matchesYear || hasAttendance);
          });

        setStudents(activeStudents);
        const att: Record<string, string> = {};
        activeStudents.forEach((s: any) => {
          att[s.StudentID] = attendanceMap.get(s.StudentID) || 'Present';
        });
        setAttendance(att);
      };
      fetchAttendance();
    }
  }, [selectedSubject, date, selectedYear]);

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const dataToSave = Object.entries(attendance).map(([studentId, status]) => ({
      Date: date,
      SubjectID: selectedSubject,
      StudentID: studentId,
      Status: status
    }));

    try {
      if (dataToSave.length > 0) {
        // Single bulk delete instead of looping per student
        const studentIds = dataToSave.map(r => r.StudentID);
        await insforge.database.from('Attendance').delete()
          .eq('Date', date)
          .eq('SubjectID', selectedSubject)
          .in('StudentID', studentIds);
        
        const { error } = await insforge.database.from('Attendance').insert(dataToSave);
        if (error) throw error;
      }
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const sendAbsentWhatsApp = (student: any) => {
    const subjectName = subjects.find(s => s.SubjectID === selectedSubject)?.SubjectName || 'class';
    const msg = `Dear Parent,\nYour child ${student.Name} was absent today (${date}) in the ${subjectName} class at Aspire Academics.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyAbsentReport = () => {
    const subjectRecord = subjects.find(s => s.SubjectID === selectedSubject);
    const subjectName = subjectRecord?.SubjectName || 'Unknown Subject';
    const className = subjectRecord?.ClassName || 'Unknown Class';
    
    const absentees = students.filter(s => attendance[s.StudentID] !== 'Present');
    
    let report = `*Attendance Report*\nDate: ${format(new Date(date), 'dd/MM/yyyy')}\nClass: ${className}\nSubject: ${subjectName}\n\n*Absentees:*\n`;
    
    if (absentees.length === 0) {
      report += 'None (100% Attendance)\n';
    } else {
      absentees.forEach((s, idx) => {
        report += `${idx + 1}. ${s.Name}\n`;
      });
    }

    navigator.clipboard.writeText(report).then(() => {
      alert("Absentee report copied to clipboard!");
    }).catch(err => {
      alert("Failed to copy text: " + err);
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-gray-50"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjects.map(s => (
              <option key={s.SubjectID} value={s.SubjectID}>{s.ClassName} - {s.SubjectName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-gray-50"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {academicYears.map(y => (
              <option key={y.AcademicYear} value={y.AcademicYear}>{y.AcademicYear}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Calendar className="w-4 h-4 mr-1" /> Date
          </label>
          <input
            type="date"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-gray-50"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">Students ({students.length})</h3>
          <button
            onClick={handleCopyAbsentReport}
            className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors"
            title="Copy absentee report"
          >
            <Copy className="w-3 h-3 mr-1" /> Copy Report
          </button>
        </div>
        
        <ul className="divide-y divide-gray-100">
          {students.map(student => {
            const isPresent = attendance[student.StudentID] === 'Present';
            return (
              <li key={student.StudentID} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1" onClick={() => toggleAttendance(student.StudentID)}>
                  <p className="font-medium text-gray-900">{student.Name}</p>
                  <p className="text-xs text-gray-500">{student.StudentID}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {!isPresent && (
                    <button 
                      onClick={() => sendAbsentWhatsApp(student)}
                      className="p-2 text-green-600 bg-green-50 rounded-full hover:bg-green-100"
                      title="Send WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleAttendance(student.StudentID)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isPresent 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isPresent ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1" /> Present</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-1" /> Absent</>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
          {students.length === 0 && (
            <li className="p-8 text-center text-gray-500">No students enrolled in this subject.</li>
          )}
        </ul>
      </div>

      {students.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      )}
    </div>
  );
}

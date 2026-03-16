import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Save, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || '';
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        if (!selectedSubject && data.length > 0) {
          setSelectedSubject(data[0].SubjectID);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedSubject && date) {
      fetch(`/api/attendance/students?subjectId=${selectedSubject}&date=${date}`)
        .then(res => res.json())
        .then(data => {
          setStudents(data);
          const att: Record<string, string> = {};
          data.forEach((s: any) => {
            att[s.StudentID] = s.Status || 'Present'; // Default to Present
          });
          setAttendance(att);
        });
    }
  }, [selectedSubject, date]);

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const dataToSave = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status
    }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          subjectId: selectedSubject,
          attendanceData: dataToSave
        })
      });
      if (!res.ok) throw new Error('Failed to save attendance');
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
          <div className="text-xs text-gray-500">Tap to toggle</div>
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

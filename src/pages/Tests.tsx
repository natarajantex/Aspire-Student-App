import { useEffect, useState } from 'react';
import { Calendar, Save, FileText, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function Tests() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [chapter, setChapter] = useState('');
  const [globalTotalMarks, setGlobalTotalMarks] = useState<number>(100);
  const [students, setStudents] = useState<any[]>([]);
  const [testMarks, setTestMarks] = useState<Record<string, { obtained: string, isAbsent: boolean }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        if (data.length > 0) setSelectedSubject(data[0].SubjectID);
      });
  }, []);

  useEffect(() => {
    if (selectedSubject && date) {
      fetch(`/api/tests/students?subjectId=${selectedSubject}&date=${date}`)
        .then(res => res.json())
        .then(data => {
          setStudents(data);
          const marks: Record<string, { obtained: string, isAbsent: boolean }> = {};
          let fetchedTotal = 100;
          let fetchedChapter = '';
          data.forEach((s: any) => {
            marks[s.StudentID] = {
              obtained: s.MarksObtained !== null ? String(s.MarksObtained) : '',
              isAbsent: s.IsAbsent === 1
            };
            if (s.TotalMarks) fetchedTotal = s.TotalMarks;
            if (s.Chapter) fetchedChapter = s.Chapter;
          });
          setTestMarks(marks);
          setGlobalTotalMarks(fetchedTotal);
          setChapter(fetchedChapter);
        });
    }
  }, [selectedSubject, date]);

  const handleMarkChange = (studentId: string, field: 'obtained' | 'isAbsent', value: any) => {
    setTestMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        ...(field === 'isAbsent' && value ? { obtained: '' } : {})
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const dataToSave = Object.entries(testMarks).map(([studentId, marks]: [string, any]) => ({
      studentId,
      marksObtained: marks.obtained ? parseFloat(marks.obtained) : null,
      isAbsent: marks.isAbsent
    })).filter(item => item.marksObtained !== null || item.isAbsent);

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          subjectId: selectedSubject,
          chapter,
          globalTotalMarks,
          testData: dataToSave
        })
      });
      if (!res.ok) throw new Error('Failed to save test marks');
      alert('Test marks saved successfully!');
    } catch (err) {
      alert('Failed to save test marks.');
    } finally {
      setSaving(false);
    }
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
            <BookOpen className="w-4 h-4 mr-1" /> Chapter
          </label>
          <input
            type="text"
            placeholder="e.g. Chapter 1: Algebra"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-gray-50"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Calendar className="w-4 h-4 mr-1" /> Test Date
          </label>
          <input
            type="date"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-gray-50"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FileText className="w-4 h-4 mr-1" /> Total Marks
          </label>
          <input
            type="number"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-gray-50"
            value={globalTotalMarks}
            onChange={(e) => setGlobalTotalMarks(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">Enter Marks ({students.length})</h3>
          <div className="text-xs text-gray-500">Marks / Status</div>
        </div>
        
        <ul className="divide-y divide-gray-100">
          {students.map(student => (
            <li key={student.StudentID} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{student.Name}</p>
                <p className="text-xs text-gray-500">{student.StudentID}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  placeholder="0"
                  className="block w-20 text-center py-1.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                  value={testMarks[student.StudentID]?.obtained || ''}
                  disabled={testMarks[student.StudentID]?.isAbsent}
                  onChange={(e) => handleMarkChange(student.StudentID, 'obtained', e.target.value)}
                />
                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    checked={testMarks[student.StudentID]?.isAbsent || false}
                    onChange={(e) => handleMarkChange(student.StudentID, 'isAbsent', e.target.checked)}
                  />
                  <span>Absent</span>
                </label>
              </div>
            </li>
          ))}
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
          {saving ? 'Saving...' : 'Save Marks'}
        </button>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { Search, BarChart2, MessageCircle, Download, Copy, CalendarCheck, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { insforge } from '../lib/insforge';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'tests'>('attendance');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [attendanceReport, setAttendanceReport] = useState<any[] | null>(null);
  const [testReport, setTestReport] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    insforge.database.from('Classes').select('*').then(res => setClasses(res.data || []));
    insforge.database.from('Subjects').select('*').then(res => setSubjects(res.data || []));
    insforge.database.from('AcademicYears').select('*').order('AcademicYear', { ascending: false })
      .then(res => {
        const data = res.data || [];
        setAcademicYears(data);
        const active = data.find(y => y.Status === 'Active');
        if (active) setAcademicYear(active.AcademicYear);
        else if (data.length > 0) setAcademicYear(data[0].AcademicYear);
      });
  }, []);

  const availableSubjects = subjects.filter(s => s.ClassID === classId);

  const generateAttendanceReport = async () => {
    if (!academicYear || !classId || !subjectId || !date) {
      alert('Please select all filters.');
      return;
    }
    setLoading(true);
    try {
      const { data: studentSubjects } = await insforge.database
        .from('StudentSubjects')
        .select('StudentID, Students(*)')
        .eq('SubjectID', subjectId);
        
      const validStudents = (studentSubjects || [])
         .map((s:any) => s.Students)
         .filter((s:any) => s && s.AcademicYear === academicYear && (s.StudentStatus === 'Active' || !s.StudentStatus));

      const { data: attendance } = await insforge.database
        .from('Attendance')
        .select('*')
        .eq('SubjectID', subjectId)
        .eq('Date', date);
        
      const attMap = new Map((attendance || []).map((a:any) => [a.StudentID, a.Status]));
      
      const report = validStudents.map((s:any) => ({
         StudentID: s.StudentID,
         Name: s.Name,
         RollNumber: s.RollNumber,
         Status: attMap.get(s.StudentID) || 'Absent'
      }));
      report.sort((a: any, b: any) => a.Name.localeCompare(b.Name));

      setAttendanceReport(report);
    } catch (err) {
      alert('Failed to generate report.');
    }
    setLoading(false);
  };

  const generateTestReport = async () => {
    if (!academicYear || !classId || !subjectId || !date) {
      alert('Please select all filters.');
      return;
    }
    setLoading(true);
    try {
      const { data: studentSubjects } = await insforge.database
        .from('StudentSubjects')
        .select('StudentID, Students(*)')
        .eq('SubjectID', subjectId);
        
      const validStudents = (studentSubjects || [])
         .map((s:any) => s.Students)
         .filter((s:any) => s && s.AcademicYear === academicYear && (s.StudentStatus === 'Active' || !s.StudentStatus));

      const { data: tests } = await insforge.database
        .from('Tests')
        .select('*')
        .eq('SubjectID', subjectId)
        .eq('Date', date);
        
      const tm = new Map((tests || []).map((t:any) => [t.StudentID, t]));
      
      const report = validStudents.map((s:any) => {
         const tInfo = tm.get(s.StudentID);
         return {
           StudentID: s.StudentID,
           Name: s.Name,
           RollNumber: s.RollNumber,
           Chapter: tInfo?.Chapter || '',
           TotalMarks: tInfo?.TotalMarks || 0,
           MarksObtained: tInfo ? tInfo.MarksObtained : null,
           IsAbsent: tInfo ? tInfo.IsAbsent : false
         };
      });
      
      report.sort((a: any, b: any) => {
         const aMarks = a.MarksObtained || 0;
         const bMarks = b.MarksObtained || 0;
         return bMarks - aMarks;
      });

      setTestReport(report);
    } catch (err) {
      alert('Failed to generate report.');
    }
    setLoading(false);
  };

  const copyAttendanceReport = () => {
    if (!attendanceReport) return;
    
    const className = classes.find(c => c.ClassID === classId)?.ClassName || '';
    const subjectName = subjects.find(s => s.SubjectID === subjectId)?.SubjectName || '';
    
    const present = attendanceReport.filter(s => s.Status === 'Present');
    const absent = attendanceReport.filter(s => s.Status === 'Absent');
    
    const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    let text = `${className} - ${subjectName}\nDate: ${formattedDate}\n\n`;
    
    text += `Absent (${absent.length}):\n`;
    text += absent.map(s => s.Name).join(', ') || 'None';
    text += '\n\n';
    
    text += `Present (${present.length}):\n`;
    text += present.map(s => s.Name).join(', ') || 'None';
    text += '\n\n';
    
    text += `- Aspire Academics`;

    navigator.clipboard.writeText(text).then(() => {
      alert('Report copied to clipboard!');
    });
  };

  const copyTestReport = () => {
    if (!testReport) return;
    
    const className = classes.find(c => c.ClassID === classId)?.ClassName || '';
    const subjectName = subjects.find(s => s.SubjectID === subjectId)?.SubjectName || '';
    
    const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const validScores = testReport.filter(s => s.MarksObtained !== null && !s.IsAbsent);
    const totalScore = validScores.reduce((acc, curr) => acc + curr.MarksObtained, 0);
    const avgScore = validScores.length > 0 ? Math.round(totalScore / validScores.length) : 0;
    
    const chapter = testReport.find(s => s.Chapter)?.Chapter;

    let text = `${className} - ${subjectName} Test Results\nDate: ${formattedDate}\n`;
    if (chapter) {
      text += `Chapter: ${chapter}\n`;
    }
    text += `\nResults:\n`;
    testReport.forEach(s => {
      if (s.IsAbsent) {
        text += `${s.Name} - Absent\n`;
      } else if (s.MarksObtained !== null) {
        text += `${s.Name} - ${s.MarksObtained}/${s.TotalMarks}\n`;
      } else {
        text += `${s.Name} - Not Marked\n`;
      }
    });
    text += '\n';

    text += `Class Average: ${avgScore}\n\n`;
    text += `- Aspire Academics`;

    navigator.clipboard.writeText(text).then(() => {
      alert('Test report copied to clipboard!');
    });
  };

  const captureSnapshot = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Report_${date}.png`;
      link.click();
    } catch (err) {
      alert('Failed to capture snapshot.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8">
      <h2 className="text-2xl font-bold text-gray-900">Reports</h2>

      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'attendance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setActiveTab('attendance'); setAttendanceReport(null); }}
        >
          Attendance
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'tests' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setActiveTab('tests'); setTestReport(null); }}
        >
          Test Performance
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
            <select 
              className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
            >
              {academicYears.map(y => <option key={y.AcademicYear} value={y.AcademicYear}>{y.AcademicYear}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select 
              className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={classId}
              onChange={e => { setClassId(e.target.value); setSubjectId(''); }}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
            <select 
              className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              disabled={!classId}
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(s => <option key={s.SubjectID} value={s.SubjectID}>{s.SubjectName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input 
              type="date"
              className="block w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={activeTab === 'attendance' ? generateAttendanceReport : generateTestReport}
          disabled={loading || !academicYear || !classId || !subjectId || !date}
          className="w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Attendance Report View */}
      {activeTab === 'attendance' && attendanceReport && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button onClick={copyAttendanceReport} className="flex-1 flex items-center justify-center bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
              <Copy className="w-4 h-4 mr-2" /> Copy Text
            </button>
            <button onClick={captureSnapshot} className="flex-1 flex items-center justify-center bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" /> Snapshot
            </button>
          </div>

          <div ref={reportRef} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-indigo-600">Aspire Academics</h3>
              <p className="text-gray-900 font-medium mt-1">
                {classes.find(c => c.ClassID === classId)?.ClassName} - {subjects.find(s => s.SubjectID === subjectId)?.SubjectName}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="space-y-6">
              {/* Absent Students - shown first and prominently */}
              {attendanceReport.filter(s => s.Status === 'Absent').length > 0 && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-3">
                    Absent Students ({attendanceReport.filter(s => s.Status === 'Absent').length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {attendanceReport.filter(s => s.Status === 'Absent').map((s, i) => (
                      <span key={i} className="bg-white text-rose-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-rose-200">{s.Name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">
                  Present Students ({attendanceReport.filter(s => s.Status === 'Present').length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {attendanceReport.filter(s => s.Status === 'Present').map((s, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm">{s.Name}</span>
                  ))}
                  {attendanceReport.filter(s => s.Status === 'Present').length === 0 && <span className="text-sm text-gray-500">None</span>}
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Test Report View */}
      {activeTab === 'tests' && testReport && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button onClick={copyTestReport} className="flex-1 flex items-center justify-center bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
              <Copy className="w-4 h-4 mr-2" /> Copy Text
            </button>
            <button onClick={captureSnapshot} className="flex-1 flex items-center justify-center bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" /> Snapshot
            </button>
          </div>

          <div ref={reportRef} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-indigo-600">Aspire Academics</h3>
              <p className="text-gray-900 font-medium mt-1">
                {classes.find(c => c.ClassID === classId)?.ClassName} - {subjects.find(s => s.SubjectID === subjectId)?.SubjectName} Test
              </p>
              {testReport.find(s => s.Chapter)?.Chapter && (
                <p className="text-sm font-medium text-indigo-600 mt-1">
                  {testReport.find(s => s.Chapter)?.Chapter}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3">Top Performers</h4>
                <div className="space-y-2">
                  {testReport.filter(s => s.MarksObtained !== null && !s.IsAbsent).slice(0, 3).map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-amber-50 p-3 rounded-xl">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold mr-3">{i + 1}</span>
                        <span className="font-medium text-gray-900">{s.Name}</span>
                      </div>
                      <span className="font-bold text-amber-700">{s.MarksObtained} <span className="text-amber-500 text-sm font-normal">/ {s.TotalMarks}</span></span>
                    </div>
                  ))}
                  {testReport.filter(s => s.MarksObtained !== null && !s.IsAbsent).length === 0 && <p className="text-sm text-gray-500">No scores recorded.</p>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">All Students</h4>
                <div className="space-y-2">
                  {testReport.map((s, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                      <span className="text-sm text-gray-700">{s.Name}</span>
                      {s.IsAbsent ? (
                        <span className="text-sm font-bold text-rose-600">Absent</span>
                      ) : s.MarksObtained !== null ? (
                        <span className="text-sm font-medium text-gray-900">{s.MarksObtained} / {s.TotalMarks}</span>
                      ) : (
                        <span className="text-sm font-medium text-gray-400">Not Marked</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center mt-4">
                <span className="font-medium text-gray-700">Class Average</span>
                <span className="text-xl font-bold text-indigo-600">
                  {testReport.filter(s => s.MarksObtained !== null && !s.IsAbsent).length > 0 
                    ? Math.round(testReport.filter(s => s.MarksObtained !== null && !s.IsAbsent).reduce((acc, curr) => acc + curr.MarksObtained, 0) / testReport.filter(s => s.MarksObtained !== null && !s.IsAbsent).length) 
                    : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

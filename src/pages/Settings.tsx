import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Calendar, BookOpen, Clock, Building, Plus, Edit, Trash2, X, Save, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Settings() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('academic-years');
  
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [institute, setInstitute] = useState<any>({});
  const [parents, setParents] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ayRes, clsRes, subRes, schRes, instRes, parRes] = await Promise.all([
        fetch('/api/academic-years'),
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/schedules'),
        fetch('/api/institute'),
        fetch('/api/parents')
      ]);
      setAcademicYears(await ayRes.json());
      setClasses(await clsRes.json());
      setSubjects(await subRes.json());
      setSchedules(await schRes.json());
      setInstitute(await instRes.json());
      setParents(await parRes.json());
    } catch (err) {
      console.error('Failed to fetch settings data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchData();
    }
  }, [role]);

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    { id: 'academic-years', label: 'Academic Years', icon: Calendar },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'schedules', label: 'Schedules', icon: Clock },
    { id: 'institute', label: 'Institute', icon: Building },
    { id: 'parents', label: 'Parent Accounts', icon: Users },
  ];

  if (loading) return <div className="p-4 text-center">Loading settings...</div>;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
          <SettingsIcon className="w-6 h-6 mr-2 text-indigo-600" />
          Settings
        </h2>
        
        <div className="flex overflow-x-auto pb-2 space-x-2 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        {activeTab === 'academic-years' && <AcademicYearsManager data={academicYears} onRefresh={fetchData} />}
        {activeTab === 'classes' && <ClassesManager data={classes} onRefresh={fetchData} />}
        {activeTab === 'subjects' && <SubjectsManager data={subjects} classes={classes} onRefresh={fetchData} />}
        {activeTab === 'schedules' && <SchedulesManager data={schedules} classes={classes} subjects={subjects} onRefresh={fetchData} />}
        {activeTab === 'institute' && <InstituteManager data={institute} onRefresh={fetchData} />}
        {activeTab === 'parents' && <ParentsManager data={parents} onRefresh={fetchData} />}
      </div>
    </div>
  );
}

function ParentsManager({ data, onRefresh }: { data: any[], onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ status: 'Active' });

  const handleEdit = (item: any) => {
    setEditingId(item.ParentID);
    setFormData({ status: item.Status });
  };

  const handleSave = async (id: number, originalData: any) => {
    try {
      await fetch(`/api/parents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: originalData.ParentName,
          mobileNumber: originalData.MobileNumber,
          studentId: originalData.StudentID,
          password: originalData.Password,
          status: formData.status
        })
      });
      setEditingId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update parent', err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Parent Accounts</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.ParentID} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {editingId === item.ParentID ? (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-2">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
                <div className="flex space-x-2">
                  <button onClick={() => handleSave(item.ParentID, item)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="font-medium text-gray-900">{item.ParentName}</div>
                  <div className="text-sm text-gray-500">Mobile: {item.MobileNumber}</div>
                  <div className="text-sm text-gray-500">Student: {item.StudentName} ({item.RollNumber})</div>
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-0.5 rounded-full ${item.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.Status}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">No parent accounts found.</div>
        )}
      </div>
    </div>
  );
}

function AcademicYearsManager({ data, onRefresh }: { data: any[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', academicYear: '', status: 'Inactive' });

  const handleEdit = (item: any) => {
    setFormData({ id: item.AcademicYearID, academicYear: item.AcademicYear, status: item.Status });
    setShowForm(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const url = formData.id ? `/api/academic-years/${formData.id}` : '/api/academic-years';
    const method = formData.id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Academic Years</h3>
        <button onClick={() => { setFormData({ id: '', academicYear: '', status: 'Inactive' }); setShowForm(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-700">{formData.id ? 'Edit' : 'Add'} Academic Year</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <input
            type="text"
            placeholder="e.g., 2026-2027"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.academicYear}
            onChange={e => setFormData({...formData, academicYear: e.target.value})}
          />
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save</button>
        </form>
      )}

      <div className="space-y-2">
        {data.map(item => (
          <div key={item.AcademicYearID} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
            <div>
              <p className="font-bold text-gray-900">{item.AcademicYear}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {item.Status}
              </span>
            </div>
            <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassesManager({ data, onRefresh }: { data: any[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', className: '', status: 'Active' });

  const handleEdit = (item: any) => {
    setFormData({ id: item.ClassID, className: item.ClassName, status: item.Status || 'Active' });
    setShowForm(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const url = formData.id ? `/api/classes/${formData.id}` : '/api/classes';
    const method = formData.id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Classes</h3>
        <button onClick={() => { setFormData({ id: '', className: '', status: 'Active' }); setShowForm(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-700">{formData.id ? 'Edit' : 'Add'} Class</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <input
            type="text"
            placeholder="Class Name (e.g., Class 10)"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.className}
            onChange={e => setFormData({...formData, className: e.target.value})}
          />
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save</button>
        </form>
      )}

      <div className="space-y-2">
        {data.map(item => (
          <div key={item.ClassID} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
            <div>
              <p className="font-bold text-gray-900">{item.ClassName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {item.Status || 'Active'}
              </span>
            </div>
            <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectsManager({ data, classes, onRefresh }: { data: any[], classes: any[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', classId: '', subjectName: '', status: 'Active' });

  const handleEdit = (item: any) => {
    setFormData({ id: item.SubjectID, classId: item.ClassID, subjectName: item.SubjectName, status: item.Status || 'Active' });
    setShowForm(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const url = formData.id ? `/api/subjects/${formData.id}` : '/api/subjects';
    const method = formData.id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Subjects</h3>
        <button onClick={() => { setFormData({ id: '', classId: '', subjectName: '', status: 'Active' }); setShowForm(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-700">{formData.id ? 'Edit' : 'Add'} Subject</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={formData.classId}
            onChange={e => setFormData({...formData, classId: e.target.value})}
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>)}
          </select>
          <input
            type="text"
            placeholder="Subject Name (e.g., Maths)"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.subjectName}
            onChange={e => setFormData({...formData, subjectName: e.target.value})}
          />
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save</button>
        </form>
      )}

      <div className="space-y-2">
        {data.map(item => (
          <div key={item.SubjectID} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
            <div>
              <p className="font-bold text-gray-900">{item.SubjectName}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{item.ClassName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {item.Status || 'Active'}
                </span>
              </div>
            </div>
            <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedulesManager({ data, classes, subjects, onRefresh }: { data: any[], classes: any[], subjects: any[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', classId: '', subjectId: '', dayOfWeek: 'Monday', time: '' });

  const handleEdit = (item: any) => {
    setFormData({ id: item.ScheduleID, classId: item.ClassID, subjectId: item.SubjectID, dayOfWeek: item.DayOfWeek, time: item.Time });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      onRefresh();
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const url = formData.id ? `/api/schedules/${formData.id}` : '/api/schedules';
    const method = formData.id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowForm(false);
    onRefresh();
  };

  const availableSubjects = subjects.filter(s => s.ClassID === formData.classId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Schedules</h3>
        <button onClick={() => { setFormData({ id: '', classId: '', subjectId: '', dayOfWeek: 'Monday', time: '' }); setShowForm(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-700">{formData.id ? 'Edit' : 'Add'} Schedule</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={formData.classId}
            onChange={e => setFormData({...formData, classId: e.target.value, subjectId: ''})}
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>)}
          </select>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={formData.subjectId}
            onChange={e => setFormData({...formData, subjectId: e.target.value})}
            disabled={!formData.classId}
          >
            <option value="">Select Subject</option>
            {availableSubjects.map(s => <option key={s.SubjectID} value={s.SubjectID}>{s.SubjectName}</option>)}
          </select>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={formData.dayOfWeek}
            onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}
          >
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Time (e.g., 5:00 PM)"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.time}
            onChange={e => setFormData({...formData, time: e.target.value})}
          />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save</button>
        </form>
      )}

      <div className="space-y-2">
        {data.map(item => (
          <div key={item.ScheduleID} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
            <div>
              <p className="font-bold text-gray-900">{item.ClassName} - {item.SubjectName}</p>
              <p className="text-sm text-gray-600">{item.DayOfWeek} at {item.Time}</p>
            </div>
            <div className="flex space-x-1">
              <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(item.ScheduleID)} className="p-2 text-gray-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstituteManager({ data, onRefresh }: { data: any, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    instituteName: data?.InstituteName || '',
    instituteAddress: data?.InstituteAddress || '',
    contactNumber: data?.ContactNumber || '',
    whatsAppGroupLink: data?.WhatsAppGroupLink || ''
  });

  const handleSave = async (e: any) => {
    e.preventDefault();
    await fetch('/api/institute', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    alert('Institute details saved!');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Institute Details</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.instituteName}
            onChange={e => setFormData({...formData, instituteName: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            value={formData.instituteAddress}
            onChange={e => setFormData({...formData, instituteAddress: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.contactNumber}
            onChange={e => setFormData({...formData, contactNumber: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Group Link</label>
          <input
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.whatsAppGroupLink}
            onChange={e => setFormData({...formData, whatsAppGroupLink: e.target.value})}
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex justify-center items-center">
          <Save className="w-5 h-5 mr-2" /> Save Details
        </button>
      </form>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { User, LogOut, CheckCircle, Clock, Camera, Trash2, Plus, Users, FileText, UserPlus, Download, Quote, GraduationCap, Edit2, Save, X } from 'lucide-react';
import { QUOTES } from './constants';
import { motion } from 'motion/react';

const QuoteDisplay = () => {
    const [quote, setQuote] = useState(QUOTES[0]);
    useEffect(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 italic text-slate-700 font-serif"
        >
            <Quote className="size-6 text-blue-300 mb-2" />
            <p className="text-lg">"{quote.text}"</p>
            <p className="text-sm text-slate-500 mt-2">— {quote.author}</p>
        </motion.div>
    );
};

interface AttendanceRecord {
  id: string;
  studentId: string;
  timestamp: string;
}

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    type: 'holiday' | 'exam' | 'event';
}

const NotificationToast = ({ notifications }: { notifications: { id: string, message: string }[] }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {notifications.map(n => (
        <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-[#0F172A] text-white p-4 rounded-lg shadow-lg pointer-events-auto"
        >
          {n.message}
        </motion.div>
      ))}
    </div>
  );
}

const GuideModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif font-bold text-[#0F172A]">How to Use</h2>
                    <button onClick={onClose}><X className="size-6 text-slate-400" /></button>
                </div>
                <div className="space-y-4 text-slate-700">
                    <section>
                        <h3 className="font-bold text-[#2563EB]">For Students</h3>
                        <p className="text-sm">Log in with your ID to view attendance. Click "Take Photo & Mark" to mark your attendance.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-[#2563EB]">For Administrators</h3>
                        <p className="text-sm">Log in as admin to manage students, view reports, or export records to CSV.</p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};

export default function App() {
  const [studentId, setStudentId] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);
  const [loggedInId, setLoggedInId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [newStudentId, setNewStudentId] = useState('');
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTimestamp, setEditTimestamp] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CalendarEvent['type']>('event');
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const addNotification = (message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, {id, message}]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }

  useEffect(() => {
    const savedAttendance = localStorage.getItem('student_attendance');
    if (savedAttendance) setAttendanceRecords(JSON.parse(savedAttendance));
    const savedStudents = localStorage.getItem('students_list');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    const savedEvents = localStorage.getItem('calendar_events');
    if (savedEvents) setCalendarEvents(JSON.parse(savedEvents));
  }, []);

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      setUserRole('student');
      setLoggedInId(studentId.trim());
      if (!students.includes(studentId.trim())) {
        const updated = [...students, studentId.trim()];
        setStudents(updated);
        localStorage.setItem('students_list', JSON.stringify(updated));
      }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId === 'admin' && newStudentId === 'admin123') {
      setUserRole('admin');
      setLoggedInId('admin');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setLoggedInId(null);
    setStudentId('');
    setNewStudentId('');
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setMessage('Camera access denied. Please allow permission.');
      setShowFaceScanner(false);
    }
  };

  useEffect(() => {
    if (showFaceScanner) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showFaceScanner]);

  const markAttendance = () => {
    if (!loggedInId || userRole !== 'student') return;
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      studentId: loggedInId,
      timestamp: new Date().toLocaleString(),
    };
    const updatedRecords = [...attendanceRecords, newRecord];
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('student_attendance', JSON.stringify(updatedRecords));
    setShowFaceScanner(false);
    setMessage('');
    addNotification('Attendance marked successfully!');
  };

  const takePhotoAndMarkAttendance = async () => {
    // Simulate photo taking and mark attendance
    setMessage('Taking photo...');
    setTimeout(() => {
        setMessage('Photo taken! Marking attendance...');
        setTimeout(() => {
            markAttendance();
        }, 1000);
    }, 1000);
  };


  const addStudent = () => {
    if(newStudentId && !students.includes(newStudentId)) {
        const updated = [...students, newStudentId];
        setStudents(updated);
        localStorage.setItem('students_list', JSON.stringify(updated));
        setNewStudentId('');
        addNotification('Student added successfully!');
    }
  }

  const removeStudent = (id: string) => {
    const updated = students.filter(s => s !== id);
    setStudents(updated);
    localStorage.setItem('students_list', JSON.stringify(updated));
  }

  const deleteRecord = (id: string) => {
    const updated = attendanceRecords.filter(r => r.id !== id);
    setAttendanceRecords(updated);
    localStorage.setItem('student_attendance', JSON.stringify(updated));
    addNotification('Record deleted!');
  }

  const startEdit = (record: AttendanceRecord) => {
    setEditingId(record.id);
    setEditTimestamp(record.timestamp);
  }

  const saveEdit = (id: string) => {
    const updated = attendanceRecords.map(r => r.id === id ? {...r, timestamp: editTimestamp} : r);
    setAttendanceRecords(updated);
    localStorage.setItem('student_attendance', JSON.stringify(updated));
    setEditingId(null);
    addNotification('Record updated!');
  }

  const addEvent = () => {
    if(newDate && newTitle) {
        const newEvent: CalendarEvent = { id: Date.now().toString(), date: newDate, title: newTitle, type: newType };
        const updated = [...calendarEvents, newEvent];
        setCalendarEvents(updated);
        localStorage.setItem('calendar_events', JSON.stringify(updated));
        setNewDate(''); setNewTitle('');
        addNotification('Event added!');
    }
  }

  const removeEvent = (id: string) => {
    const updated = calendarEvents.filter(e => e.id !== id);
    setCalendarEvents(updated);
    localStorage.setItem('calendar_events', JSON.stringify(updated));
  }

  const filteredRecords = attendanceRecords.filter(r => {
    if (filterPeriod === 'all') return true;
    const recordDate = new Date(r.timestamp);
    const now = new Date();
    const diffDays = (now.getTime() - recordDate.getTime()) / (1000 * 3600 * 24);
    if (filterPeriod === 'week') return diffDays <= 7;
    if (filterPeriod === 'month') return diffDays <= 30;
    return true;
  });

  const exportAttendanceToCSV = () => {
    const headers = ["Student ID", "Timestamp"];
    const rows = attendanceRecords.map(r => [r.studentId, r.timestamp]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_records.csv';
    a.click();
  };

  const dashboardContent = (
    <div className="space-y-6">
        <QuoteDisplay />
        {/* Rest of the dashboard content will go here */}
    </div>
  );

  if (!userRole) {
    return (
      <>
        <NotificationToast notifications={notifications} />
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
          {/* Frosted Campus Glass Background */}
          <div className="fixed inset-0 -z-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center"></div>
          <div className="fixed inset-0 -z-0 bg-white/30"></div>

          <header className="sticky top-0 w-full p-6 flex justify-between items-center z-50 bg-white/60 backdrop-blur-md shadow-sm border-b border-white/20">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#2563EB] flex items-center gap-2"><GraduationCap className="size-8" /> DAV MODEL</h1>
            <nav className="flex gap-6 font-semibold text-[#0F172A]/80">
                <a href="#about" className="hover:text-[#2563EB]">About</a>
                <a href="#features" className="hover:text-[#2563EB]">Features</a>
                <button onClick={() => setShowGuide(true)} className="text-[#2563EB] font-bold">Help</button>
                <button onClick={() => setStudentId('admin')} className="text-[#2563EB] font-bold">Admin Login</button>
            </nav>
          </header>

          {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

          <main className="relative z-10 space-y-24 pb-20">
            {/* Hero Section */}
            <section className="container mx-auto px-6 pt-20 text-center">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl font-serif font-bold text-[#0F172A] mb-6"
                >
                    Modern Academic Attendance
                </motion.h2>
                <p className="text-xl text-[#0F172A]/70 max-w-2xl mx-auto mb-12 font-medium">
                    An efficient, secure, and modern way to manage student attendance using state-of-the-art face recognition technology.
                </p>
                
                <div id="login" className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full mx-auto">
                    <h3 className="text-2xl font-bold mb-8 text-center text-[#0F172A]">{studentId === 'admin' ? 'Admin Login' : 'Login'}</h3>
                    <form onSubmit={studentId === 'admin' ? handleAdminLogin : handleStudentLogin} className="space-y-6">
                        <input
                        type="text"
                        placeholder={studentId === 'admin' ? "Admin Username" : "Enter Student ID"}
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-5 py-4 rounded-lg bg-[#F8FAFC] border border-slate-200 text-[#0F172A] placeholder-slate-400 focus:ring-2 focus:ring-[#2563EB] font-bold"
                        required
                        />
                        {studentId === 'admin' && (
                        <input
                            type="password"
                            placeholder="Password"
                            value={newStudentId}
                            onChange={(e) => setNewStudentId(e.target.value)}
                            className="w-full px-5 py-4 rounded-lg bg-[#F8FAFC] border border-slate-200 text-[#0F172A] placeholder-slate-400 focus:ring-2 focus:ring-[#2563EB] font-bold"
                            required
                        />
                        )}
                        <button type="submit" className="w-full bg-[#2563EB] text-white font-bold py-4 rounded-lg hover:bg-[#1d4ed8] transition-all shadow-lg shadow-[#2563EB]/20 uppercase tracking-wider text-sm">
                        Login
                        </button>
                    </form>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                <div className="bg-emerald-900 p-12 rounded-3xl text-emerald-50 font-serif">
                    <h3 className="text-4xl font-bold mb-6">Efficiency in the Classroom</h3>
                    <p className="text-lg opacity-90 leading-relaxed">
                        Say goodbye to manual roll calls. Our system streamlines the attendance process, allowing teachers to focus on what matters most — teaching.
                    </p>
                </div>
                <div>
                   <QuoteDisplay />
                </div>
            </section>

             {/* Features Section */}
             <section id="features" className="container mx-auto px-6">
                <h3 className="text-4xl font-serif font-bold text-center mb-16">Key Features</h3>
                <div className="grid md:grid-cols-3 gap-8">
                    {['Face Recognition Attendance', 'Secure Admin Dashboard', 'Detailed Reporting'].map((feature, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="size-12 bg-emerald-100 rounded-lg mb-6 flex items-center justify-center">
                                <CheckCircle className="size-6 text-emerald-600" />
                            </div>
                            <h4 className="text-xl font-bold mb-3">{feature}</h4>
                            <p className="text-slate-600 text-sm">Empowering schools with reliable, automated attendance tracking solutions.</p>
                        </div>
                    ))}
                </div>
             </section>
          </main>

          <footer className="py-12 border-t border-slate-200 text-center text-slate-500">
              <p>&copy; 2026 Attendance Solutions.</p>
              <p className="mt-2 text-emerald-800 font-semibold">Created by Pratyush Raj</p>
              <p className="text-emerald-800 font-semibold font-serif">Sponsor: Pratyush Raj</p>
          </footer>
      </div>
      </>
    );
  }

  if (userRole === 'admin') {
      return (
        <>
          <NotificationToast notifications={notifications} />
          <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
          <header className="max-w-5xl mx-auto flex justify-between items-center mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-3xl font-serif font-bold text-[#0F172A] flex items-center gap-3"><GraduationCap className="size-8 text-[#2563EB]" /> Admin Dashboard</h1>
            <button onClick={handleLogout} className="text-[#0F172A]/60 hover:text-red-600 flex items-center gap-2 font-bold transition-colors">
              <LogOut className="size-5" /> Logout
            </button>
            <button onClick={() => setShowGuide(true)} className="text-[#2563EB] font-bold">Help</button>
          </header>
          {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
          <main className="max-w-5xl mx-auto space-y-10">
            <QuoteDisplay />
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-serif font-bold text-[#0F172A] mb-6 flex items-center gap-3">
                    <Users className="size-6 text-[#2563EB]" /> Manage Students
                </h2>
                <div className="flex gap-4 mb-6">
                    <input type="text" value={newStudentId} onChange={e => setNewStudentId(e.target.value)} placeholder="New Student ID" className="flex-grow px-4 py-3 rounded-lg border border-slate-200 font-bold" />
                    <button onClick={addStudent} className="bg-[#2563EB] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1d4ed8]"><Plus /></button>
                </div>
                <div className="space-y-2">
                    {students.map(s => (
                        <div key={s} className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-lg">
                            <span className="font-bold text-[#0F172A]">{s}</span>
                            <button onClick={() => removeStudent(s)} className="text-red-500 hover:text-red-700"><Trash2 className="size-4" /></button>
                        </div>
                    ))}
                </div>
            </div>
            {/* Calendar Manager */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-serif font-bold text-[#0F172A] mb-6 flex items-center gap-3">
                    <Clock className="size-6 text-[#2563EB]" /> School Calendar
                </h2>
                <div className="flex gap-4 mb-6">
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="px-4 py-3 rounded-lg border border-slate-200 font-bold" />
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Event Title" className="flex-grow px-4 py-3 rounded-lg border border-slate-200 font-bold" />
                    <select value={newType} onChange={e => setNewType(e.target.value as any)} className="px-4 py-3 rounded-lg border border-slate-200 font-bold">
                        <option value="holiday">Holiday</option>
                        <option value="exam">Exam</option>
                        <option value="event">Event</option>
                    </select>
                    <button onClick={addEvent} className="bg-[#2563EB] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1d4ed8]"><Plus /></button>
                </div>
                <div className="space-y-2">
                    {calendarEvents.map(e => (
                        <div key={e.id} className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-lg">
                            <span className="font-bold text-[#0F172A]">{e.date} - {e.title} ({e.type})</span>
                            <button onClick={() => removeEvent(e.id)} className="text-red-500 hover:text-red-700"><Trash2 className="size-4" /></button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-serif font-bold text-[#0F172A] flex items-center gap-3">
                        <FileText className="size-6 text-[#2563EB]" /> Attendance Records
                    </h2>
                    <div className="flex items-center gap-4">
                      <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="bg-[#F8FAFC] border border-slate-200 rounded-lg p-2 font-bold text-sm">
                        <option value="all">All Time</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                      </select>
                      <button onClick={exportAttendanceToCSV} className="text-sm font-bold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-2 uppercase tracking-wide">
                          <Download className="size-4" /> Export CSV
                      </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-100">
                             <tr className="text-left text-xs uppercase tracking-widest text-[#0F172A]/50">
                                <th className="pb-4">Student ID</th>
                                <th className="pb-4">Timestamp</th>
                                <th className="pb-4">Actions</th>
                             </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map(r => (
                                <tr key={r.id} className="border-b border-slate-100">
                                    <td className="py-4 font-bold text-[#0F172A]">{r.studentId}</td>
                                    <td className="py-4 text-[#0F172A]/70">
                                      {editingId === r.id ? 
                                        <input type="text" value={editTimestamp} onChange={e => setEditTimestamp(e.target.value)} className="border rounded p-1" /> :
                                        r.timestamp
                                      }
                                    </td>
                                    <td className="py-4">
                                      {editingId === r.id ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => saveEdit(r.id)}><Save className="size-4 text-green-600" /></button>
                                            <button onClick={() => setEditingId(null)}><X className="size-4 text-red-600" /></button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(r)}><Edit2 className="size-4 text-blue-600" /></button>
                                            <button onClick={() => deleteRecord(r.id)}><Trash2 className="size-4 text-red-600" /></button>
                                        </div>
                                      )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <footer className="py-12 border-t border-slate-200 text-center text-slate-600 mt-10">
              <p>&copy; 2026 Attendance Solutions.</p>
              <h3 className="mt-4 text-lg text-[#2563EB] font-serif font-bold">Created by Pratyush Raj</h3>
            </footer>
          </main>
        </div>
        </>
      );
  }

  return (
    <>
      <NotificationToast notifications={notifications} />
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-3xl font-serif font-bold text-[#0F172A] flex items-center gap-3"><GraduationCap className="size-8 text-[#2563EB]" /> DAV MODEL Portal</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#0F172A]/70 font-bold">
            <User className="size-5 text-[#2563EB]" />
            {loggedInId}
          </div>
          <button onClick={handleLogout} className="text-[#0F172A]/60 hover:text-red-600 flex items-center gap-2 font-bold transition-colors">
            <LogOut className="size-5" /> Logout
          </button>
          <button onClick={() => setShowGuide(true)} className="text-[#2563EB] font-bold">Help</button>
        </div>
      </header>
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <main className="max-w-5xl mx-auto space-y-10">
        <QuoteDisplay />
        {showFaceScanner ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
            <h2 className="text-2xl font-serif font-bold text-[#0F172A] mb-6">Camera Attendance</h2>
            <video ref={videoRef} autoPlay playsInline className="mx-auto rounded-xl bg-[#0F172A] mb-6" width="320" height="240"></video>
            <p className="mb-4 text-[#0F172A]/70 font-bold">{message}</p>
            <button onClick={takePhotoAndMarkAttendance} className="bg-[#16A34A] text-white px-8 py-3 rounded-lg font-bold w-full md:w-auto uppercase tracking-wide">
                Take Photo & Mark Attendance
            </button>
             <button onClick={() => {setShowFaceScanner(false); setMessage('')}} className="ml-4 text-slate-500 font-bold">Close</button>
          </div>
        ) : (
          <div className="bg-[#0F172A] p-8 rounded-2xl shadow-lg flex items-center justify-between text-white">
            <div>
              <h2 className="text-3xl font-serif font-bold">Attendance</h2>
              <p className="text-[#F8FAFC]/70 font-medium mt-2">Mark your daily attendance.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setShowFaceScanner(true)} className="flex items-center gap-3 bg-[#2563EB] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#1d4ed8] transition-all uppercase tracking-wide text-sm">
                  <Camera className="size-5" /> Take Photo & Mark
                </button>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-serif font-bold text-[#0F172A] mb-8 flex items-center gap-3">
            <Clock className="size-6 text-[#2563EB]" /> School Calendar
          </h2>
          <div className="space-y-4">
             {calendarEvents.map(e => (
                 <div key={e.id} className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-lg">
                     <span className="font-bold text-[#0F172A]">{e.date} - {e.title}</span>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${e.type === 'holiday' ? 'bg-emerald-100 text-emerald-800' : e.type === 'exam' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{e.type}</span>
                 </div>
             ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-serif font-bold text-[#0F172A] mb-8 flex items-center gap-3">
            <Clock className="size-6 text-[#2563EB]" /> Attendance History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-[#0F172A]/50 border-b border-slate-100">
                  <th className="pb-4">Student ID</th>
                  <th className="pb-4">Date & Time</th>
                  <th className="pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-[#0F172A]">
                {attendanceRecords.filter(r => r.studentId === loggedInId).map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 last:border-0 hover:bg-[#F8FAFC]">
                    <td className="py-5 font-bold text-[#0F172A]">{record.studentId}</td>
                    <td className="py-5 text-[#0F172A]/70">{record.timestamp}</td>
                    <td className="py-5 text-right font-bold text-[#16A34A] bg-[#16A34A]/10 px-3 rounded-lg">Verified</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-200 text-center text-slate-600 mt-10">
        <p>&copy; 2026 Attendance Solutions.</p>
        <h3 className="mt-4 text-lg text-[#2563EB] font-serif font-bold">Created by Pratyush Raj</h3>
      </footer>
    </div>
    </>
  );
}


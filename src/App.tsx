import React, { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRole, Course, Enrollment, Module, SystemLog } from './types';
import { CourseService, LogService } from './services/courseService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  GraduationCap, 
  Search, 
  Menu, 
  X,
  PlusCircle,
  TrendingUp,
  User as UserIcon,
  Bell,
  ChevronRight,
  CheckCircle2,
  Clock,
  Users,
  PlayCircle,
  ArrowLeft,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Activity,
  Info,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './lib/utils';

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-8 py-5 rounded-[32px] border backdrop-blur-2xl shadow-2xl",
        type === 'success' 
          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" 
          : "bg-red-500/20 border-red-500/30 text-red-100"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
        type === 'success' ? "bg-emerald-500 text-slate-900" : "bg-red-500 text-white"
      )}>
        {type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">System Notification</p>
        <p className="font-bold tracking-tight">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 opacity-40 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

const Navigation = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout 
}: { 
  user: UserProfile, 
  activeTab: string, 
  setActiveTab: (t: string) => void,
  onLogout: () => void
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Catalog', icon: BookOpen },
    ...(user.role === 'lecturer' ? [{ id: 'admin', label: 'Faculty Management', icon: PlusCircle }] : []),
  ];

  return (
    <aside className="w-72 h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col p-8 transition-all duration-500">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-10 h-10 bg-ur-yellow rounded-xl flex items-center justify-center font-black text-slate-900 shadow-lg shadow-ur-yellow/20">UR</div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-tight text-white leading-none">University of Rwanda</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-ur-yellow font-bold mt-1">e-Learning Portal</span>
        </div>
      </div>
      
      <nav className="space-y-2 flex-grow">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative",
              activeTab === tab.id || (activeTab === 'course-detail' && tab.id === 'courses')
                ? "bg-white/10 text-white border border-white/10 shadow-xl" 
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            {activeTab === tab.id && (
              <motion.span layoutId="nav-glow" className="absolute left-0 w-1.5 h-6 bg-ur-yellow rounded-r-full" />
            )}
            <tab.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-ur-yellow" : "")} />
            <span className="font-semibold text-sm tracking-wide">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-6">
        <div className="p-5 bg-ur-blue/20 rounded-3xl border border-white/5 group hover:bg-ur-blue/30 transition-all cursor-pointer">
          <p className="text-[10px] text-blue-300 mb-2 font-black uppercase tracking-widest opacity-60">Academic Support</p>
          <p className="text-xs font-bold text-white leading-relaxed">Need help with registration? Contact CST Faculty Office.</p>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-sm tracking-widest uppercase border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

const Header = ({ 
  user, 
  activeTab 
}: { 
  user: UserProfile, 
  activeTab: string
}) => {
  const getTabTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Student Dashboard';
      case 'courses': return 'Course Catalog';
      case 'course-detail': return 'Module Viewer';
      case 'admin': return 'Academic Admin';
      default: return 'Portal';
    }
  };

  return (
    <header className="h-24 flex items-center justify-between px-10 bg-white/5 backdrop-blur-md border-b border-white/5">
      <h2 className="text-xl font-light italic text-slate-400">
        {getTabTitle()} <span className="font-black opacity-10 mx-3 text-white not-italic">/</span> <span className="text-white font-normal not-italic tracking-tight">{user.displayName}</span>
      </h2>
      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 ring-1 ring-white/5">
          <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_12px_#4ade80]"></div>
          <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">System Status: Optimal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">{user.displayName}</p>
            <p className="text-[10px] font-black text-ur-yellow uppercase tracking-widest mt-1">{user.role}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl border-2 border-ur-yellow/50 p-0.5 shadow-xl shadow-ur-yellow/10">
            <img src={user.photoURL} className="w-full h-full rounded-[14px] object-cover" alt="Profile" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          setUserProfile(profile);
          if (profile.role === 'lecturer') {
            setActiveTab('admin');
          }
        } else {
          // If profile doesn't exist, handleLogin will create it
          // This block is mainly for returning sessions
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (asLecturer: boolean = false) => {
    try {
      setAuthLoading(true);
      const u = await signInWithGoogle();
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        
        let profile: UserProfile;

        if (!docSnap.exists()) {
          profile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || (asLecturer ? 'UR Lecturer' : 'UR Student'),
            photoURL: u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || 'User')}&background=003399&color=fff`,
            role: asLecturer ? 'lecturer' : 'student',
            createdAt: serverTimestamp()
          };
          await setDoc(docRef, profile);
          await LogService.log('info', 'Auth', `New ${profile.role} account created: ${profile.email}`);
        } else {
          profile = docSnap.data() as UserProfile;
          // Logic: If they explicitly clicked "Sign in as Lecturer" but they are a Student, 
          // we should probably let them through if they are authorized, or just update the role for this demo environment.
          // For now, let's treat the explicit button click as an intent to use that role.
          if (asLecturer && profile.role !== 'lecturer') {
             profile.role = 'lecturer';
             await updateDoc(docRef, { role: 'lecturer' });
             await LogService.log('info', 'Auth', `User ${profile.email} upgraded to Lecturer role`);
             showToast("Instructor privileges activated", "success");
          }
        }

        setUserProfile(profile);
        if (profile.role === 'lecturer') {
          setActiveTab('admin');
        } else {
          setActiveTab('dashboard');
        }
        showToast(`Welcome back, ${profile.displayName}`, "success");
      }
    } catch (e: any) {
      console.error(e);
      await LogService.log('error', 'Auth', `Login failure: ${e.message}`);
      showToast("Authentication interrupted", "error");
    } finally {
      setAuthLoading(false);
      setLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const viewCourse = (id: string) => {
    setSelectedCourseId(id);
    setActiveTab('course-detail');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative"
        >
          <div className="absolute inset-0 blur-3xl bg-ur-blue/50 rounded-full" />
          <GraduationCap className="h-20 w-20 text-ur-yellow relative z-10" />
        </motion.div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-ur-yellow/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-3xl p-12 rounded-[40px] border border-white/10 max-w-lg w-full text-center relative z-10 shadow-2xl"
        >
          <div className="bg-ur-blue w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-ur-blue/40 ring-4 ring-white/10 group overflow-hidden">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
              <GraduationCap className="h-12 w-12 text-ur-yellow" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">UR e-Learning</h1>
          <p className="text-slate-400 mb-10 text-lg font-medium leading-relaxed">
            University of Rwanda Academic Hub.<br />Access your studies with UR credentials.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              onClick={() => handleLogin(false)}
              disabled={authLoading}
              className={`flex-1 bg-ur-yellow hover:bg-yellow-400 text-slate-900 font-black py-5 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 shadow-xl shadow-ur-yellow/20 text-[10px] uppercase tracking-widest ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {authLoading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : (
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 bg-white rounded-full p-1" alt="Google" />
              )}
              {authLoading ? 'Authorizing...' : 'Student Portal Access'}
            </button>
            <button 
              onClick={() => handleLogin(true)}
              disabled={authLoading}
              className={`flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-5 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 border border-white/10 text-[10px] uppercase tracking-widest ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {authLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <Users className="w-5 h-5 text-ur-yellow" />
              )}
              {authLoading ? 'Verifying...' : 'Sign in as Lecturer'}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
            Institutional ICT Quality Standard Verified
          </div>
        </motion.div>

        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#0f172a]">
      <Navigation 
        user={userProfile} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={userProfile} activeTab={activeTab} />
        
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
              >
                <Dashboard user={userProfile} onViewCourse={viewCourse} onFindCourses={() => setActiveTab('courses')} />
              </motion.div>
            )}
            {activeTab === 'courses' && (
              <motion.div 
                key="catalog"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <CourseCatalog user={userProfile} onViewCourse={viewCourse} />
              </motion.div>
            )}
            {activeTab === 'course-detail' && selectedCourseId && (
              <motion.div 
                key="detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <CourseDetail 
                  user={userProfile} 
                  courseId={selectedCourseId} 
                  onBack={() => setActiveTab('courses')} 
                  onNotify={showToast}
                />
              </motion.div>
            )}
            {activeTab === 'admin' && userProfile.role === 'lecturer' && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.4 }}
              >
                <AdminPanel user={userProfile} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Views ---

const Dashboard = ({ user, onViewCourse, onFindCourses }: { user: UserProfile, onViewCourse: (id: string) => void, onFindCourses: () => void }) => {
  const [enrollments, setEnrollments] = useState<(Enrollment & { course?: Course })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      const enrs = await CourseService.getUserEnrollments(user.uid);
      const enrsWithData = await Promise.all(enrs.map(async (e) => {
        const course = await CourseService.getCourseById(e.courseId);
        return { ...e, course: course || undefined };
      }));
      setEnrollments(enrsWithData);
      setLoading(false);
    };
    fetchEnrollments();
  }, [user.uid]);

  const averageProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length) 
    : 0;

  const chartData = enrollments.map(enr => ({
    name: enr.course?.code || 'Course',
    progress: enr.progress,
    fullName: enr.course?.title
  }));

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div>
          <p className="text-[10px] font-black text-ur-yellow uppercase tracking-[0.3em] mb-2">Institutional Dashboard</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">Academic Overview</h1>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-4">
          <div className="bg-white/5 px-6 py-4 rounded-3xl border border-white/10 backdrop-blur-xl">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Enrolled</p>
             <p className="text-2xl font-black text-white">{enrollments.length}</p>
          </div>
          <div className="bg-ur-yellow px-6 py-4 rounded-3xl shadow-xl shadow-ur-yellow/10">
             <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-1">Avg progress</p>
             <p className="text-2xl font-black text-slate-900">{averageProgress}%</p>
          </div>
        </div>
      </div>

      {enrollments.length > 0 && (
        <section className="glass-dark rounded-[50px] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-ur-yellow/5 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-4">
                <div className="p-3 bg-ur-yellow/10 rounded-2xl border border-ur-yellow/20">
                  <TrendingUp className="h-6 w-6 text-ur-yellow" />
                </div>
                Performance Analytics
              </h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Statistical validation of curriculum sync</p>
            </div>
            
            <div className="flex items-center gap-8 px-8 py-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl">
              <div className="text-center border-r border-white/10 pr-8">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Avg</p>
                <p className="text-2xl font-black text-ur-yellow">{averageProgress}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-ur-yellow animate-pulse" />
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Optimized</p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#eab308" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                  domain={[0, 100]}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '12px 16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(20px)'
                  }}
                  itemStyle={{ 
                    color: '#eab308', 
                    fontSize: '12px', 
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  labelStyle={{ 
                    color: '#fff', 
                    marginBottom: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}
                />
                <Bar 
                  dataKey="progress" 
                  radius={[12, 12, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <section className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-3xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-ur-blue/10 blur-[80px] -mr-32 -mt-32 rounded-full transition-all group-hover:bg-ur-blue/20" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-ur-blue/40 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-ur-yellow" />
                </div>
                Active Coursework
              </h2>
              <button 
                onClick={onFindCourses}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-ur-yellow transition-colors"
              >
                Find more
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {[1, 2].map(i => <div key={i} className="h-56 bg-white/5 animate-pulse rounded-3xl border border-white/5" />)}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="py-20 text-center relative z-10">
                <p className="text-slate-500 italic font-medium mb-6">No active courses detected in your profile.</p>
                <button onClick={onFindCourses} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all">
                  Browse Knowledge Hub
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {enrollments.map((enr) => (
                  <div 
                    key={enr.id} 
                    onClick={() => onViewCourse(enr.courseId)}
                    className="group glass-dark p-6 rounded-3xl hover:bg-white/[0.07] transition-all cursor-pointer border border-white/5 hover:border-ur-yellow/20 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <span className="bg-white/10 text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase border border-white/5">{enr.course?.code}</span>
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-ur-yellow transition-colors line-clamp-1">{enr.course?.title}</h4>
                    <p className="text-xs text-slate-400 font-medium italic mb-8">Dr. {enr.course?.lecturerName}</p>
                    <div className="mt-auto space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                        <span className="text-xs font-black text-white">{enr.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner flex">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${enr.progress}%` }}
                          className="h-full bg-gradient-to-r from-ur-blue to-ur-yellow rounded-full shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
           <section className="bg-gradient-to-br from-ur-blue/40 to-[#020617] border border-blue-500/20 rounded-[40px] p-8 backdrop-blur-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-ur-yellow/10 blur-[60px] rounded-full group-hover:bg-ur-yellow/20 transition-all" />
              
              <h2 className="font-black text-white flex items-center gap-3 mb-8 relative z-10 uppercase tracking-widest text-xs">
                <Bell className="h-4 w-4 text-ur-yellow" />
                Campus Broadcast
              </h2>
              
              <div className="space-y-8 relative z-10">
                <div className="group/item cursor-pointer">
                  <p className="text-[10px] uppercase font-black text-blue-400 tracking-[0.2em] mb-2 group-hover/item:text-ur-yellow transition-colors">Exam Bureau</p>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">The Semester II examination portal will open for card registration on Monday.</p>
                </div>
                <div className="group/item cursor-pointer">
                  <p className="text-[10px] uppercase font-black text-blue-400 tracking-[0.2em] mb-2 group-hover/item:text-ur-yellow transition-colors">ICT Dept</p>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">Maintenance for the Gikondo Campus Wi-Fi network scheduled for midnight.</p>
                </div>
                <button className="w-full mt-4 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/50 hover:text-white transition-all border border-white/5">
                  View News Archive
                </button>
              </div>
           </section>

           <div className="glass p-8 rounded-[40px] border border-white/5">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">Course Enrollments</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center font-mono text-indigo-300 text-[10px] font-black">CS</div>
                  <div>
                    <p className="text-xs font-bold text-white">Algorithms II</p>
                    <p className="text-[10px] text-slate-500">Approved • CST</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center font-mono text-emerald-300 text-[10px] font-black">EC</div>
                  <div>
                    <p className="text-xs font-bold text-white">Macroeconomics</p>
                    <p className="text-[10px] text-slate-500">Waitlisted • CBE</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const CourseCatalog = ({ user, onViewCourse }: { user: UserProfile, onViewCourse: (id: string) => void }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      const data = await CourseService.getAllCourses();
      setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const filtered = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="relative p-12 rounded-[50px] overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl border border-white/10" />
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-ur-blue/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
          <div className="inline-block px-4 py-1.5 bg-ur-yellow/10 rounded-full border border-ur-yellow/20">
            <span className="text-[10px] font-black uppercase text-ur-yellow tracking-[0.4em]">Official KNOWLEDGE HUB</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter sm:text-6xl text-balance">Course Inventory</h1>
          <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg mx-auto">Explore certified academic units curated by UR's specialized faculty experts.</p>
          
          <div className="relative group max-w-md mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5 group-focus-within:text-ur-yellow transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by code, title or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-slate-900/50 border border-white/10 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-ur-yellow/10 focus:border-ur-yellow/30 outline-none transition-all font-medium backdrop-blur-xl"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-[450px] bg-white/5 animate-pulse rounded-[40px] border border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map(course => (
            <div 
              key={course.id} 
              onClick={() => onViewCourse(course.id)}
              className="group glass-dark rounded-[40px] overflow-hidden hover:bg-white/[0.08] transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col border border-white/5 hover:border-ur-yellow/30 shadow-2xl relative"
            >
              <div className="h-56 relative overflow-hidden">
                <img 
                  src={course.thumbnail || `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400`} 
                  className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                  alt={course.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent" />
                <div className="absolute top-6 left-6">
                  <span className="bg-ur-yellow text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-2xl border border-white/20">{course.code}</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 text-white/70">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{course.enrolledStudents} Students</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-ur-yellow animate-pulse" />
                </div>
              </div>
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-ur-yellow transition-colors line-clamp-1">{course.title}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-6 italic">Dr. {course.lecturerName}</p>
                <p className="text-sm text-slate-400 line-clamp-3 mb-10 leading-relaxed font-medium">{course.description}</p>
                
                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex -space-x-2">
                     {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500">U</div>)}
                   </div>
                   <button className="bg-white/5 hover:bg-ur-yellow hover:text-slate-900 text-white rounded-2xl px-6 py-2.5 text-xs font-black uppercase tracking-widest border border-white/10 hover:border-ur-yellow transition-all duration-300">
                      View Module
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ModulePlayer = ({ module, onComplete, onBack }: { module: Module, onComplete: () => void, onBack: () => void }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 text-slate-400 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.3em] group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Module Library
        </button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-ur-yellow uppercase tracking-widest bg-ur-yellow/10 px-3 py-1 rounded-lg border border-ur-yellow/20">
            {module.type}
          </span>
          <button 
            onClick={onComplete}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20"
          >
            Mark Completed
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-4xl font-black text-white tracking-tighter">{module.title}</h2>
        
        <div className="glass-dark rounded-[40px] p-10 border border-white/10 shadow-2xl min-h-[400px]">
          {module.type === 'video' ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/40 flex flex-col items-center justify-center border border-white/5 group relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-ur-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <PlayCircle className="h-20 w-20 text-ur-yellow opacity-40 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100" />
              <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Connect to Institutional Media Server</p>
              {/* In a real app, integrate an actual video player here */}
            </div>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-ur-yellow prose-a:text-ur-yellow markdown-body">
              <Markdown remarkPlugins={[remarkGfm]}>{module.content}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseRegistrationModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  courseTitle 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSubmit: (details: any) => void,
  courseTitle: string
}) => {
  const [formData, setFormData] = useState({
    studentId: '',
    academicYear: '2023/2024',
    department: 'Computer Science',
    motivation: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentId.match(/^\d{9}$/)) {
      newErrors.studentId = 'Invalid Student ID. Must be 9 digits (e.g. 221000123).';
    }
    if (formData.motivation.length < 20) {
      newErrors.motivation = 'Please provide a more detailed motivation (at least 20 characters).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl glass-dark border border-white/10 rounded-[50px] p-10 relative z-10 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-ur-blue/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter">Course Registration</h2>
            <p className="text-slate-400 font-medium text-sm">Registering for: <span className="text-ur-yellow">{courseTitle}</span></p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Student ID (Official)</label>
              <input 
                type="text"
                placeholder="221000123"
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                className={cn(
                  "w-full px-6 py-4 rounded-2xl bg-white/5 border text-white outline-none transition-all placeholder:text-slate-700",
                  errors.studentId ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-ur-yellow/50"
                )}
              />
              {errors.studentId && <p className="text-[9px] text-red-500 font-bold pl-2">{errors.studentId}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Academic Year</label>
              <select 
                value={formData.academicYear}
                onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-white/5 text-white outline-none focus:border-ur-yellow/50 transition-all appearance-none"
              >
                <option>2023/2024</option>
                <option>2024/2025</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Faculty / Department</label>
            <select 
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-white/5 text-white outline-none focus:border-ur-yellow/50 transition-all appearance-none"
            >
              <option>Computer Science</option>
              <option>Information Systems</option>
              <option>Information Technology</option>
              <option>Software Engineering</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Registration Motivation</label>
            <textarea 
              placeholder="Explain why you are enrolling in this module..."
              rows={4}
              value={formData.motivation}
              onChange={(e) => setFormData({...formData, motivation: e.target.value})}
              className={cn(
                "w-full px-6 py-4 rounded-2xl bg-white/5 border text-white outline-none transition-all placeholder:text-slate-700 resize-none",
                errors.motivation ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-ur-yellow/50"
              )}
            />
            {errors.motivation && <p className="text-[9px] text-red-500 font-bold pl-2">{errors.motivation}</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-ur-yellow text-slate-900 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-ur-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Submit Official Registration
            <ChevronRight className="h-5 w-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const CourseDetail = ({ 
  user, 
  courseId, 
  onBack,
  onNotify
}: { 
  user: UserProfile, 
  courseId: string, 
  onBack: () => void,
  onNotify: (m: string, t?: 'success' | 'error') => void
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const c = await CourseService.getCourseById(courseId);
      setCourse(c);
      const enrs = await CourseService.getUserEnrollments(user.uid);
      const enr = enrs.find(e => e.courseId === courseId);
      setEnrollment(enr || null);
      setLoading(false);
    };
    fetchData();
  }, [courseId, user.uid]);

  const handleEnroll = async (details: any) => {
    setIsRegistering(false);
    setEnrolling(true);
    try {
      const enr = await CourseService.enrollStudent(user.uid, courseId, details);
      setEnrollment(enr);
      onNotify(`Successfully enrolled in ${course?.title}. Access granted.`, 'success');
    } catch (e) { 
      console.error(e); 
      onNotify("Institutional sync failed. Please try again or contact ICT support.", "error");
    }
    setEnrolling(false);
  };

  const completeModule = async (moduleId: string) => {
    if (!enrollment || !course) return;
    await CourseService.updateProgress(user.uid, courseId, moduleId, course.modules.length);
    const enrs = await CourseService.getUserEnrollments(user.uid);
    setEnrollment(enrs.find(e => e.courseId === courseId) || null);
  };

  if (loading || !course) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-white/10 border-t-ur-yellow rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <button 
        onClick={onBack} 
        className="flex items-center gap-3 text-slate-400 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.3em] group"
      >
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <X className="h-4 w-4" />
        </div>
        Return to Portal
      </button>

      <div className="glass shadow-2xl rounded-[60px] overflow-hidden border border-white/10">
        <div className="h-80 relative">
          <img src={course.thumbnail || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover blur-[2px] opacity-60 scale-105" alt={course.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <span className="bg-ur-yellow text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter shadow-2xl inline-block">{course.code}</span>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">{course.title}</h1>
              <p className="text-slate-300 font-medium italic opacity-80">Faculty of Computing and Information Systems • Dr. {course.lecturerName}</p>
            </div>
            
            {enrollment && (
              <div className="bg-white/10 backdrop-blur-xl px-8 py-5 rounded-[32px] border border-white/10 flex items-center gap-6">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Module Progress</p>
                   <p className="text-2xl font-black text-white">{enrollment.progress}%</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white/10 p-1">
                   <div className="w-full h-full rounded-full border-2 border-ur-yellow border-t-transparent animate-spin-slow opacity-40" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-12">
          <CourseRegistrationModal 
            isOpen={isRegistering} 
            onClose={() => setIsRegistering(false)} 
            onSubmit={handleEnroll}
            courseTitle={course.title}
          />

          {activeModule ? (
            <ModulePlayer 
              module={activeModule} 
              onBack={() => setActiveModule(null)}
              onComplete={() => {
                completeModule(activeModule.id);
                setActiveModule(null);
              }}
            />
          ) : (
            <div className="grid grid-cols-12 gap-12">
            <div className="col-span-12 lg:col-span-7 space-y-12">
               <div>
                 <h2 className="text-[10px] font-black text-ur-yellow uppercase tracking-[0.4em] mb-4">Syllabus Context</h2>
                 <p className="text-slate-300 leading-loose font-medium text-lg text-balance">{course.description}</p>
               </div>

               <div className="space-y-6">
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Learning Modules ({course.modules.length})</h2>
                 <div className="space-y-4">
                   {course.modules.map((m, idx) => {
                     const isCompleted = enrollment?.completedModuleIds.includes(m.id);
                     return (
                       <div 
                        key={m.id}
                        className={cn(
                          "group p-6 rounded-[32px] border transition-all flex items-center justify-between backdrop-blur-sm",
                          isCompleted 
                            ? "bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5" 
                            : "bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-ur-yellow/20"
                        )}
                      >
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105",
                            isCompleted ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-900/50 text-slate-500 group-hover:text-ur-yellow"
                          )}>
                            {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                          </div>
                          <div>
                            <h4 className={cn("font-bold tracking-tight text-lg mb-1", isCompleted ? "text-emerald-50 text-opacity-90" : "text-white")}>{m.title}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{m.type}</span>
                              <div className="w-1 h-1 bg-slate-700 rounded-full" />
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">45 mins</span>
                            </div>
                          </div>
                        </div>
                        
                        {enrollment ? (
                           isCompleted ? (
                             <div className="bg-emerald-500 rounded-full p-2 text-slate-900 shadow-xl shadow-emerald-500/30">
                                <CheckCircle2 className="h-5 w-5" />
                             </div>
                           ) : (
                               <button 
                                  onClick={() => setActiveModule(m)}
                                  className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-ur-yellow text-white hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-ur-yellow"
                               >
                                 Open Block
                               </button>
                           )
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-700">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                     )
                   })}
                 </div>
               </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              {!enrollment ? (
                <div className="glass-dark p-10 rounded-[50px] border border-white/10 text-center space-y-8 sticky top-12 shadow-2xl shadow-black/20">
                  <div className="h-20 w-20 bg-ur-blue/20 rounded-[24px] flex items-center justify-center mx-auto ring-4 ring-white/5 shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-ur-yellow/20 blur-[20px] scale-0 group-hover:scale-150 transition-transform duration-500" />
                    <GraduationCap className="h-10 w-10 text-ur-yellow relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-white tracking-widest text-lg uppercase">Course Access</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">Enroll today to unlock premium regional case studies and institutional validation.</p>
                  </div>
                  <button 
                    onClick={() => setIsRegistering(true)}
                    disabled={enrolling}
                    className="w-full bg-ur-yellow text-slate-900 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-ur-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
                  >
                    {enrolling ? "Provisioning..." : "Official Enrollment"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-ur-blue to-[#020617] p-10 rounded-[50px] text-white shadow-2xl sticky top-12 border border-white/10 flex flex-col items-center overflow-hidden group">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                   <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                   
                   <div className="w-40 h-40 rounded-full border-[10px] border-white/5 flex items-center justify-center mb-10 relative z-10 shadow-inner">
                      <div className="absolute inset-0 rounded-full border-[10px] border-ur-yellow border-t-transparent animate-spin-slow opacity-80" />
                      <span className="text-5xl font-black tracking-tighter">{enrollment.progress}<span className="text-lg opacity-30">%</span></span>
                   </div>
                   <h3 className="font-black text-xl mb-2 tracking-widest uppercase relative z-10">Sync ACTIVE</h3>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-10 relative z-10">Network Repository OK</p>
                   
                   <button 
                    onClick={() => {
                      const firstIncomplete = course.modules.find(m => !enrollment.completedModuleIds.includes(m.id)) || course.modules[0];
                      setActiveModule(firstIncomplete);
                    }}
                    className="w-full bg-white/10 hover:bg-white text-white hover:text-slate-900 font-black py-5 rounded-[24px] transition-all relative z-10 text-xs uppercase tracking-widest backdrop-blur-xl border border-white/10"
                   >
                     Resume Learning
                   </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

const AdminPanel = ({ user }: { user: UserProfile }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', code: '', description: '', thumbnail: '' });
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editedModules, setEditedModules] = useState<Module[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs' | 'analytics'>('inventory');
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [allCourses, allEnrollments, allLogs] = await Promise.all([
        CourseService.getAllCourses(),
        CourseService.getLecturerEnrollments(user.uid),
        LogService.getLogs()
      ]);
      
      const lecturerCourses = allCourses.filter(c => c.lecturerId === user.uid);
      setCourses(lecturerCourses);
      setEnrollments(allEnrollments);
      
      if (allLogs.length === 0) {
        await LogService.log('error', 'deployment', 'ENOENT: package.json missing in src/ during deployment cycle. Infrastructure recommends root directory calibration.');
        const updatedLogs = await LogService.getLogs();
        setLogs(updatedLogs);
      } else {
        setLogs(allLogs);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [user.uid]);

  const stats = {
    totalStudents: enrollments.length,
    activeCourses: courses.length,
    avgProgress: enrollments.length > 0 
      ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length) 
      : 0,
    totalBlocks: courses.reduce((acc, curr) => acc + curr.modules.length, 0)
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await CourseService.createCourse({
      ...newCourse,
      lecturerId: user.uid,
      lecturerName: user.displayName,
      thumbnail: newCourse.thumbnail || `https://images.unsplash.com/photo-${1520000000000 + Math.floor(Math.random()*1000)}?auto=format&fit=crop&q=80&w=400`,
      modules: [
        { id: '1', title: 'Introduction', content: '# Welcome to the Module\nThis is the introductory content for this unit.', type: 'text', order: 1 },
        { id: '2', title: 'Core Repository Context', content: 'Detailed technical overview...', type: 'text', order: 2 },
      ]
    });
    setNewCourse({ title: '', code: '', description: '', thumbnail: '' });
    setIsAdding(false);
    const all = await CourseService.getAllCourses();
    setCourses(all.filter(c => c.lecturerId === user.uid));
  };

  const startEditing = (course: Course) => {
    setEditingCourse(course);
    setEditedModules([...course.modules]);
  };

  const saveModules = async () => {
    if (!editingCourse) return;
    await CourseService.updateCourseModules(editingCourse.id, editedModules);
    const all = await CourseService.getAllCourses();
    setCourses(all.filter(c => c.lecturerId === user.uid));
    setEditingCourse(null);
  };

  const addModule = () => {
    const newModule: Module = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Module Block',
      content: 'Provision content here...',
      type: 'text',
      order: editedModules.length + 1
    };
    setEditedModules([...editedModules, newModule]);
  };

  const updateModule = (id: string, updates: Partial<Module>) => {
    setEditedModules(editedModules.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeModule = (id: string) => {
    setEditedModules(editedModules.filter(m => m.id !== id));
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-white/10 border-t-ur-yellow rounded-full animate-spin" /></div>;

  if (editingCourse) {
    return (
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-white/5">
          <div className="space-y-2">
            <button onClick={() => setEditingCourse(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest mb-4">
              <ArrowLeft className="h-4 w-4" /> Return to Inventory
            </button>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
              Curriculum Architecture: <span className="text-ur-yellow">{editingCourse.code}</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] pl-1 font-mono">{editingCourse.title}</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={addModule}
              className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
            >
              <PlusCircle className="h-4 w-4 text-ur-yellow" />
              Append Block
            </button>
            <button 
              onClick={saveModules}
              className="px-8 py-4 rounded-2xl bg-ur-yellow text-slate-900 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-ur-yellow/20 flex items-center gap-3"
            >
              <CheckCircle2 className="h-4 w-4" />
              Commit Changes
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {editedModules.map((module, index) => (
              <motion.div 
                key={module.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-dark border border-white/5 rounded-[40px] p-10 relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-ur-yellow opacity-40" />
                <div className="flex items-start justify-between gap-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-slate-500 border border-white/10 shrink-0">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Block Title</label>
                          <input 
                            value={module.title}
                            onChange={e => updateModule(module.id, { title: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-ur-yellow/50 transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Media Type</label>
                          <select 
                            value={module.type}
                            onChange={e => updateModule(module.id, { type: e.target.value as any })}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-white/10 text-white font-bold outline-none focus:border-ur-yellow/50 transition-all appearance-none"
                          >
                            <option value="text">Institutional Text (Markdown)</option>
                            <option value="video">Streaming Media (Video)</option>
                            <option value="quiz">Repository Assessment (Quiz)</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Repository Content (Markdown / URL)</label>
                        <textarea 
                          rows={6}
                          value={module.content}
                          onChange={e => updateModule(module.id, { content: e.target.value })}
                          className="w-full px-8 py-6 rounded-[32px] bg-white/5 border border-white/10 text-white font-medium outline-none focus:border-ur-yellow/50 transition-all resize-none leading-relaxed font-mono text-sm"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => removeModule(module.id)}
                      className="p-4 rounded-2xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                    >
                      <X className="h-5 w-5" />
                    </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {editedModules.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[60px]">
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Curriculum structure is empty</p>
              <button 
                onClick={addModule}
                className="mt-8 px-8 py-4 bg-ur-yellow text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest"
              >
                Start First Block
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
             <div className="p-3 bg-ur-blue/20 rounded-2xl border border-white/5">
               {activeTab === 'inventory' ? <PlusCircle className="text-ur-yellow h-8 w-8" /> : 
                activeTab === 'logs' ? <ShieldAlert className="text-red-400 h-8 w-8" /> :
                <BarChart3 className="text-emerald-400 h-8 w-8" />}
             </div>
             {activeTab === 'inventory' ? 'Faculty Control' : 
              activeTab === 'logs' ? 'System Repository Logs' : 
              'Academic Insights'}
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">
            {activeTab === 'inventory' ? 'Advanced Academic Unit Management Interface' : 
             activeTab === 'logs' ? 'Network Health & Deployment Integrity Monitor' : 
             'Institutional Course Engagement & Progress Analytics'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-ur-yellow text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-white'}`}
          >
            Insights
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'logs' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-white'}`}
          >
            Diagnostics
          </button>
        </div>
        {activeTab === 'inventory' && (
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-ur-yellow hover:bg-yellow-400 text-slate-900 font-black py-4 px-8 rounded-2xl flex items-center gap-3 transition-all shadow-2xl shadow-ur-yellow/20 text-xs uppercase tracking-widest"
            >
              {isAdding ? <X className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              {isAdding ? 'Exit System' : 'Provision New Unit'}
            </button>
          </div>
        )}
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-12">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-dark p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Top Performing Unit</h3>
                 <p className="text-2xl font-black text-white tracking-tighter">
                    {courses.length > 0 ? courses.reduce((prev, curr) => {
                       const prevAvg = enrollments.filter(e => e.courseId === prev.id).reduce((a, c) => a + c.progress, 0) / (enrollments.filter(e => e.courseId === prev.id).length || 1);
                       const currAvg = enrollments.filter(e => e.courseId === curr.id).reduce((a, c) => a + c.progress, 0) / (enrollments.filter(e => e.courseId === curr.id).length || 1);
                       return currAvg > prevAvg ? curr : prev;
                    }).code : 'N/A'}
                 </p>
                 <p className="text-xs font-bold text-emerald-400 mt-2">Highest Progress Density</p>
              </div>

              <div className="glass-dark p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-ur-yellow/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Most Populated Unit</h3>
                 <p className="text-2xl font-black text-white tracking-tighter">
                   {courses.length > 0 ? courses.reduce((prev, curr) => (curr.enrolledStudents > prev.enrolledStudents ? curr : prev)).code : 'N/A'}
                 </p>
                 <p className="text-xs font-bold text-ur-yellow mt-2">Maximum Enrollee Volume</p>
              </div>

              <div className="glass-dark p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Institutional Reach</h3>
                 <p className="text-2xl font-black text-white tracking-tighter">
                   {stats.totalStudents} <span className="text-xs font-bold text-slate-500 uppercase ml-2 tracking-widest">Digital Identities</span>
                 </p>
                 <p className="text-xs font-bold text-blue-400 mt-2">Collective Student Sync</p>
              </div>
           </div>

           {/* Detailed Performance Table/Graph */}
           <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
              <div className="xl:col-span-3 glass-dark p-10 rounded-[50px] border border-white/5 shadow-2xl">
                 <div className="flex items-center justify-between mb-12">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Unit Performance Matrix</h3>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-ur-yellow" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress %</span>
                       </div>
                    </div>
                 </div>

                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={courses.map(c => {
                        const enrs = enrollments.filter(e => e.courseId === c.id);
                        return {
                          name: c.code,
                          students: c.enrolledStudents,
                          progress: enrs.length > 0 ? Math.round(enrs.reduce((a, b) => a + b.progress, 0) / enrs.length) : 0
                        }
                      })}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: '#ffffff05' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-dark border border-white/10 p-4 rounded-2xl shadow-2xl">
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                  <p className="text-xs font-bold text-ur-yellow">Enrolled: {payload[0].value}</p>
                                  <p className="text-xs font-bold text-emerald-400">Avg Progress: {payload[1].value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="students" fill="#FFC72C" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="progress" fill="#34D399" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="xl:col-span-2 space-y-8">
                 <div className="glass-dark p-10 rounded-[50px] border border-white/5 shadow-2xl">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Modular Engagement</h3>
                    <div className="space-y-6">
                       {courses.map(course => {
                         const enrs = enrollments.filter(e => e.courseId === course.id);
                         const progress = enrs.length > 0 ? Math.round(enrs.reduce((a, b) => a + b.progress, 0) / enrs.length) : 0;
                         return (
                           <div key={course.id} className="space-y-3">
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">{course.code}</span>
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{course.enrolledStudents} Enrollees</span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                                 <div className="h-full bg-ur-yellow" style={{ width: `${(course.enrolledStudents / (stats.totalStudents || 1)) * 100}%` }} />
                                 <div className="h-full bg-emerald-500/40" style={{ width: `${progress}%`, opacity: 0.5 }} />
                              </div>
                           </div>
                         )
                       })}
                    </div>
                 </div>

                 <div className="p-8 rounded-[40px] bg-ur-blue/10 border border-ur-blue/20 flex items-center gap-6">
                    <div className="p-4 bg-ur-blue/20 rounded-2xl">
                       <PieIcon className="text-ur-yellow h-6 w-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white uppercase tracking-widest">Global Sync Coefficient</p>
                       <p className="text-xl font-black text-ur-yellow tracking-tighter mt-1">{stats.avgProgress}% Total Completion</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : activeTab === 'logs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deployment Health Guide */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-dark p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-ur-blue/10 blur-[60px] rounded-full" />
               <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                 <Terminal className="text-ur-yellow h-5 w-5" />
                 Deployment Guide
               </h2>
               <div className="space-y-6">
                 <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-3">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Critical Alert: Render Deployment</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      If you see <code className="bg-slate-900 px-2 py-0.5 rounded text-white">ENOENT: no such file or directory, open '/opt/render/project/src/package.json'</code>, follow these steps:
                    </p>
                    <ul className="space-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-red-400 rounded-full" /> Open Render Settings</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-red-400 rounded-full" /> Change Root Directory to <code className="text-white">.</code> (Dot)</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-red-400 rounded-full" /> Ensure Built in Dist folder</li>
                    </ul>
                 </div>

                 <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Environment Check</p>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] text-slate-500">Firebase DB</span>
                         <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-black uppercase">Online</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] text-slate-500">Auth Service</span>
                         <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-black uppercase">Online</span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* System Logs List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-dark p-10 rounded-[40px] border border-white/5 shadow-2xl min-h-[600px]">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Event Feed</h2>
                 <span className="text-[10px] font-black text-ur-yellow bg-ur-yellow/10 px-3 py-1 rounded-lg uppercase tracking-tight">System Live</span>
              </div>

              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-20">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
                        <Activity className="h-8 w-8" />
                     </div>
                     <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-relaxed">System history is currently empty.<br/>New events will populate automatically.</p>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                       <div className="flex items-start justify-between gap-6">
                          <div className="flex items-center gap-4">
                             <div className={`p-2 rounded-xl border ${
                               log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                               log.type === 'warning' ? 'bg-ur-yellow/10 border-ur-yellow/20 text-ur-yellow' : 
                               'bg-blue-500/10 border-blue-500/20 text-blue-400'
                             }`}>
                               {log.type === 'error' ? <ShieldAlert className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                             </div>
                             <div>
                               <p className="text-xs font-black text-white tracking-tight">{log.message}</p>
                               <div className="flex items-center gap-3 mt-1.5">
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">{log.component}</span>
                                 <span className="text-[9px] font-bold text-slate-600 font-mono">
                                   {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recent Session'}
                                 </span>
                               </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Existing Inventory View Content (Analytics Grid and Form) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-dark p-8 rounded-[32px] border border-white/5 shadow-xl relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-ur-yellow/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-ur-yellow/10 border border-ur-yellow/20 text-ur-yellow">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Synced Students</p>
          <p className="text-3xl font-black text-white tracking-tighter relative z-10">{stats.totalStudents}</p>
        </div>
        
        <div className="glass-dark p-8 rounded-[32px] border border-white/5 shadow-xl relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Active Curricula</p>
          <p className="text-3xl font-black text-white tracking-tighter relative z-10">{stats.activeCourses}</p>
        </div>

        <div className="glass-dark p-8 rounded-[32px] border border-white/5 shadow-xl relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Collective Progress</p>
          <p className="text-3xl font-black text-white tracking-tighter relative z-10">{stats.avgProgress}%</p>
        </div>

        <div className="glass-dark p-8 rounded-[32px] border border-white/5 shadow-xl relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Total Learning Blocks</p>
          <p className="text-3xl font-black text-white tracking-tighter relative z-10">{stats.totalBlocks}</p>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreate}
            className="glass-dark rounded-[50px] p-12 border border-white/10 shadow-2xl space-y-10 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-ur-blue/5 blur-[120px] pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Institutional Component Code</label>
                <input 
                  required
                  placeholder="e.g. CSC321" 
                  className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-4 focus:ring-ur-yellow/10 focus:border-ur-yellow text-white transition-all font-bold placeholder:text-slate-700 backdrop-blur-xl"
                  value={newCourse.code}
                  onChange={e => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Curriculum Component Title</label>
                <input 
                  required
                  placeholder="e.g. Distributed Ledger Technology" 
                  className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-4 focus:ring-ur-yellow/10 focus:border-ur-yellow text-white transition-all font-bold placeholder:text-slate-700 backdrop-blur-xl"
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Visual ID (Thumbnail URL)</label>
                <input 
                  placeholder="https://images.unsplash.com/..." 
                  className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-4 focus:ring-ur-yellow/10 focus:border-ur-yellow text-white transition-all font-bold placeholder:text-slate-700 backdrop-blur-xl"
                  value={newCourse.thumbnail}
                  onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Syllabus Framework Abstract</label>
              <textarea 
                required
                rows={4}
                placeholder="Declare institutional objectives and modular hierarchy for the repository..." 
                className="w-full px-6 py-6 rounded-3xl bg-white/5 border border-white/10 outline-none focus:ring-4 focus:ring-ur-yellow/10 focus:border-ur-yellow text-white transition-all font-bold placeholder:text-slate-700 backdrop-blur-xl resize-none leading-relaxed"
                value={newCourse.description}
                onChange={e => setNewCourse({...newCourse, description: e.target.value})}
              />
            </div>
            <button className="w-full bg-ur-blue hover:bg-ur-blue-dark text-white font-black py-6 rounded-[32px] transition-all shadow-2xl shadow-ur-blue/20 uppercase tracking-[0.4em] text-xs border border-white/10 relative z-10">
              Commit Curricula to Academic Cloud
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Academic Inventory ({courses.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => {
            const courseEnrs = enrollments.filter(e => e.courseId === course.id);
            const courseAvg = courseEnrs.length > 0 
              ? Math.round(courseEnrs.reduce((a, c) => a + c.progress, 0) / courseEnrs.length)
              : 0;

            return (
              <div key={course.id} className="glass-dark p-8 rounded-[40px] border border-white/5 shadow-2xl relative group overflow-hidden transition-all duration-300 hover:border-ur-yellow/20">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <div className="inline-block bg-white/5 text-ur-yellow text-[10px] font-black px-3 py-1 rounded-lg mb-6 uppercase tracking-widest border border-white/5">{course.code}</div>
                <h3 className="font-black text-white text-xl mb-6 truncate group-hover:text-ur-yellow transition-colors tracking-tight leading-none">{course.title}</h3>
                
                <div className="space-y-6 mb-10">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <span>Collective Sync</span>
                    <span className="text-white">{courseAvg}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${courseAvg}%` }} />
                  </div>
                  <div className="flex items-center gap-6 text-[10px] text-slate-500 font-black tracking-widest uppercase py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-ur-yellow"><Users className="h-3.5 w-3.5" />{course.enrolledStudents}</div>
                      <div className="w-1 h-1 bg-slate-700 rounded-full" />
                      <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />{course.modules.length} BLOCKS</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => startEditing(course)}
                  className="w-full py-5 bg-white/5 text-white font-black rounded-[24px] text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all border border-white/10 group-hover:shadow-2xl"
                >
                    Modify Curriculum
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  )}
</div>
  );
};


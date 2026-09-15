import React, { useState } from 'react';
import { UserProfile, UserRole, PatientBodyType, AnatomicalSite, SessionResult } from './types';
import { getAuthenticatedUser, setCurrentUser, logoutUser } from './api/auth';
import { PATIENT_PROFILES, ANATOMICAL_SITES, MOCK_SESSIONS } from './api/sessions';
import { NavigationHeader } from './components/NavigationHeader';
import { LoginPage } from './pages/LoginPage';
import { TraineeDashboard } from './pages/TraineeDashboard';
import { SimulatorPage } from './pages/SimulatorPage';
import { SessionResultsPage } from './pages/SessionResultsPage';
import { TrainingHistoryPage } from './pages/TrainingHistoryPage';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  // Navigation & User Authentication State
  // Initial state strictly defaults to null / login unless persistent valid session is found
  const [currentUser, setUser] = useState<UserProfile | null>(() => getAuthenticatedUser());
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const user = getAuthenticatedUser();
    if (!user) return 'login';
    if (user.role === 'trainee') return 'dashboard';
    if (user.role === 'instructor') return 'instructor';
    if (user.role === 'admin') return 'admin';
    return 'login';
  });

  // Active Session & Configuration State
  const [selectedPatient, setSelectedPatient] = useState<PatientBodyType>(PATIENT_PROFILES[0]);
  const [selectedSite, setSelectedSite] = useState<AnatomicalSite>(ANATOMICAL_SITES[0]);
  const [currentSession, setCurrentSession] = useState<SessionResult>(MOCK_SESSIONS[0]);

  // Simulation controls state
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [sessionTimer, setSessionTimer] = useState<number>(145);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);

  // Instructor active tab
  const [instructorTab, setInstructorTab] = useState<string>('overview');

  // Admin active tab
  const [adminTab, setAdminTab] = useState<string>('hardware');

  // Secure Route Protection Handler
  const handleNavigatePage = (targetPage: string) => {
    if (!currentUser) {
      setCurrentPage('login');
      return;
    }

    // Role-based route enforcement
    if (currentUser.role === 'trainee') {
      // Trainees can only access trainee areas: 'dashboard', 'simulator', 'results', 'history'
      if (targetPage === 'admin' || targetPage === 'instructor') {
        console.warn(`[Security] Trainee access denied to ${targetPage}. Rerouting to Trainee Home.`);
        setCurrentPage('dashboard');
        return;
      }
    } else if (currentUser.role === 'instructor') {
      // Instructors cannot access admin control center
      if (targetPage === 'admin') {
        console.warn(`[Security] Instructor access denied to admin console. Rerouting to Instructor Dashboard.`);
        setCurrentPage('instructor');
        return;
      }
    }

    setCurrentPage(targetPage);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setUser(user);
    setCurrentUser(user);

    // Redirect strictly to the correct role experience as specified:
    // Trainee -> TRAINEE HOME / PATIENT SELECTION ('dashboard')
    // Instructor -> INSTRUCTOR DASHBOARD ('instructor')
    // Admin -> ADMIN CONTROL CENTER ('admin')
    if (user.role === 'trainee') {
      setCurrentPage('dashboard');
    } else if (user.role === 'instructor') {
      setCurrentPage('instructor');
    } else if (user.role === 'admin') {
      setCurrentPage('admin');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentPage('login');
  };

  const handleCompleteSession = () => {
    setIsSimulating(false);
    setIsAnalysisModalOpen(true);
  };

  const handleResetSimulate = () => {
    setSessionTimer(0);
    setIsSimulating(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-200 flex flex-col font-sans overflow-x-hidden selection:bg-cvc-purple selection:text-white">
      {/* Navigation Header (only rendered when user is authenticated and not on login page) */}
      {currentUser && currentPage !== 'login' && (
        <NavigationHeader
          currentUser={currentUser}
          activeTab={instructorTab}
          onTabChange={setInstructorTab}
          adminTab={adminTab}
          onAdminTabChange={setAdminTab}
          onCompleteSession={handleCompleteSession}
          isSimulating={isSimulating}
          onToggleSimulate={() => setIsSimulating(!isSimulating)}
          onResetSimulate={handleResetSimulate}
          sessionTimer={sessionTimer}
          sessionNumber={currentSession.sessionNumber}
          onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
          onNavigatePage={handleNavigatePage}
          currentPage={currentPage}
          onLogout={handleLogout}
        />
      )}

      {/* Page Routing */}
      <div className="flex-1 flex flex-col">
        {/* Unauthenticated or Login Page */}
        {(!currentUser || currentPage === 'login') && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigatePage={handleNavigatePage}
          />
        )}

        {/* Authenticated Trainee: 3D Simulator */}
        {currentUser && currentUser.role === 'trainee' && currentPage === 'simulator' && (
          <SimulatorPage
            currentUser={currentUser}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            onNavigatePage={handleNavigatePage}
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            sessionTimer={sessionTimer}
            setSessionTimer={setSessionTimer}
            onOpenAnalysisModal={() => setIsAnalysisModalOpen(true)}
            isAnalysisModalOpen={isAnalysisModalOpen}
            setIsAnalysisModalOpen={setIsAnalysisModalOpen}
            currentSession={currentSession}
            setCurrentSession={setCurrentSession}
          />
        )}

        {/* Authenticated Trainee: Patient Selection & Anatomical Preview (Trainee Home) */}
        {currentUser && currentUser.role === 'trainee' && currentPage === 'dashboard' && (
          <TraineeDashboard
            currentUser={currentUser}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            onLaunchSimulator={() => setCurrentPage('simulator')}
            onNavigatePage={handleNavigatePage}
          />
        )}

        {/* Authenticated Trainee: Session Results */}
        {currentUser && currentUser.role === 'trainee' && currentPage === 'results' && (
          <SessionResultsPage
            currentUser={currentUser}
            session={currentSession}
            onNavigatePage={handleNavigatePage}
          />
        )}

        {/* Authenticated Trainee: Historical Sessions */}
        {currentUser && currentUser.role === 'trainee' && currentPage === 'history' && (
          <TrainingHistoryPage
            currentUser={currentUser}
            onSelectSession={(session) => {
              setCurrentSession(session);
              setCurrentPage('results');
            }}
            onNavigatePage={handleNavigatePage}
          />
        )}

        {/* Authenticated Instructor: Instructor Dashboard */}
        {currentUser && currentUser.role === 'instructor' && currentPage === 'instructor' && (
          <InstructorDashboard
            currentUser={currentUser}
            activeTab={instructorTab}
            onTabChange={setInstructorTab}
            onNavigatePage={handleNavigatePage}
          />
        )}

        {/* Authenticated Admin: Admin Control Center */}
        {currentUser && currentUser.role === 'admin' && currentPage === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            activeTab={adminTab}
            onTabChange={setAdminTab}
            onNavigatePage={handleNavigatePage}
          />
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Trainee, SessionResult, UserProfile } from '../types';
import { dataService, TraineeFilterOptions } from '../services/dataService';
import { SessionReviewDetail } from '../components/SessionReviewDetail';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Award, 
  TrendingUp, 
  Activity, 
  RotateCcw,
  Eye,
  AlertCircle,
  Sparkles,
  Layers,
  Building2,
  GraduationCap
} from 'lucide-react';

interface TraineesPageProps {
  currentUser: UserProfile;
  onNavigatePage: (page: string) => void;
  onSelectSessionForReview?: (session: SessionResult) => void;
}

export const TraineesPage: React.FC<TraineesPageProps> = ({
  currentUser,
  onNavigatePage,
  onSelectSessionForReview,
}) => {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [residencyFilter, setResidencyFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'sessions' | 'lastActive'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Trainee Detail Selection
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [traineeSessions, setTraineeSessions] = useState<SessionResult[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);

  // Active Session Review (from inside Trainee Detail)
  const [reviewingSession, setReviewingSession] = useState<SessionResult | null>(null);

  // Load trainees
  const loadTrainees = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const options: TraineeFilterOptions = {
        search: searchTerm,
        residencyYear: residencyFilter,
        performanceLevel: performanceFilter,
        sortBy,
        sortOrder,
      };
      const data = await dataService.getTrainees(options);
      setTrainees(data);
    } catch (err) {
      setErrorMessage('Failed to load trainee directory. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrainees();
  }, [searchTerm, residencyFilter, performanceFilter, sortBy, sortOrder]);

  // Load trainee sessions when a trainee is selected
  const handleSelectTrainee = async (t: Trainee) => {
    setSelectedTrainee(t);
    setIsLoadingSessions(true);
    try {
      const sessions = await dataService.getTraineeSessions(t.id);
      setTraineeSessions(sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setResidencyFilter('all');
    setPerformanceFilter('all');
    setSortBy('score');
    setSortOrder('desc');
  };

  // If a session is being actively reviewed from here
  if (reviewingSession) {
    return (
      <SessionReviewDetail
        session={reviewingSession}
        onBack={() => setReviewingSession(null)}
        onSessionUpdated={(updated) => {
          setReviewingSession(updated);
          // Refresh trainee sessions
          if (selectedTrainee) {
            handleSelectTrainee(selectedTrainee);
          }
        }}
      />
    );
  }

  // 1. DETAIL VIEW: If a trainee is selected
  if (selectedTrainee) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-200">
        {/* Navigation Breadcrumb & Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedTrainee(null)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition flex items-center space-x-2 text-xs font-mono cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cvc-cyan" />
              <span>BACK TO TRAINEES</span>
            </button>
            <div>
              <span className="text-[10px] font-mono text-cvc-cyan uppercase tracking-wider block">
                SURGICAL RESIDENT PROFILE & KINEMATIC DOSSIER
              </span>
              <h1 className="font-display font-bold text-xl md:text-2xl text-white">
                {selectedTrainee.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border flex items-center space-x-1.5 ${
                selectedTrainee.performanceLevel === 'PROFICIENT'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : selectedTrainee.performanceLevel === 'COMPETENT'
                  ? 'bg-amber-500/15 text-cvc-amber border-amber-500/30'
                  : 'bg-red-500/15 text-cvc-crimson border-red-500/30'
              }`}
            >
              {selectedTrainee.performanceLevel === 'NEEDS_REMEDIATION' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{selectedTrainee.performanceLevel.replace('_', ' ')}</span>
            </span>

            <span className="px-3 py-1 rounded-xl font-mono text-xs bg-white/5 border border-white/10 text-white/80">
              {selectedTrainee.residencyYear}
            </span>
          </div>
        </div>

        {/* Trainee Key Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-hud rounded-2xl p-3.5 border border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/40 uppercase block">MEAN SCORE</span>
            <span
              className={`text-xl font-display font-black block mt-0.5 ${
                selectedTrainee.averageScore >= 85
                  ? 'text-emerald-400'
                  : selectedTrainee.averageScore >= 70
                  ? 'text-cvc-amber'
                  : 'text-cvc-crimson'
              }`}
            >
              {selectedTrainee.averageScore}
            </span>
            <span className="text-[9px] font-mono text-white/40">Scale /100</span>
          </div>

          <div className="glass-hud rounded-2xl p-3.5 border border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/40 uppercase block">TOTAL SESSIONS</span>
            <span className="text-xl font-display font-black text-white block mt-0.5">
              {selectedTrainee.totalSessions}
            </span>
            <span className="text-[9px] font-mono text-cvc-cyan">Completed</span>
          </div>

          <div className="glass-hud rounded-2xl p-3.5 border border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/40 uppercase block">FIRST-PASS RATE</span>
            <span className="text-xl font-display font-black text-emerald-400 block mt-0.5">
              {selectedTrainee.firstPassRate}%
            </span>
            <span className="text-[9px] font-mono text-white/40">Clean Insertion</span>
          </div>

          <div className="glass-hud rounded-2xl p-3.5 border border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/40 uppercase block">TRAJ DEVIATION</span>
            <span
              className={`text-xl font-display font-black block mt-0.5 ${
                selectedTrainee.meanTrajectoryDeviation > 4.5 ? 'text-cvc-crimson' : 'text-white'
              }`}
            >
              ±{selectedTrainee.meanTrajectoryDeviation}°
            </span>
            <span className="text-[9px] font-mono text-cvc-cyan">Angular Jitter</span>
          </div>

          <div className="glass-hud rounded-2xl p-3.5 border border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/40 uppercase block">FLAGGED AUDITS</span>
            <span
              className={`text-xl font-display font-black block mt-0.5 ${
                selectedTrainee.flaggedSessionsCount > 0 ? 'text-cvc-crimson' : 'text-emerald-400'
              }`}
            >
              {selectedTrainee.flaggedSessionsCount}
            </span>
            <span className="text-[9px] font-mono text-white/40">Breach Incidents</span>
          </div>

          <div className="glass-hud rounded-2xl p-3.5 border border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/40 uppercase block">LAST SIMULATION</span>
            <span className="text-xs font-mono font-bold text-white block mt-1 truncate">
              {selectedTrainee.lastSessionDate}
            </span>
            <span className="text-[9px] font-mono text-white/40">Timestamp</span>
          </div>
        </div>

        {/* Residency Dossier Details */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/10">
            <GraduationCap className="w-4 h-4 text-cvc-purple" />
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
              Institutional Affiliation & Training Track
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-xs font-mono">
            <div>
              <span className="text-white/40 block text-[10px]">CANDIDATE ID</span>
              <span className="font-bold text-cvc-cyan">{selectedTrainee.id}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">DEPARTMENT / SERVICE</span>
              <span className="text-white font-semibold">{selectedTrainee.department}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">HOSPITAL CAMPUS</span>
              <span className="text-white font-semibold">{selectedTrainee.hospital}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">ASSIGNED MENTOR</span>
              <span className="text-white font-semibold">{selectedTrainee.assignedMentor}</span>
            </div>
          </div>
        </div>

        {/* Trainee Session History List */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                Procedural Session History ({traineeSessions.length})
              </h3>
              <p className="text-xs text-cvc-textMuted mt-0.5">
                Full chronological audit trail for {selectedTrainee.name}
              </p>
            </div>
          </div>

          {isLoadingSessions ? (
            <div className="py-12 text-center text-xs font-mono text-cvc-textMuted flex items-center justify-center space-x-2">
              <RotateCcw className="w-4 h-4 animate-spin text-cvc-cyan" />
              <span>Loading procedural records...</span>
            </div>
          ) : traineeSessions.length === 0 ? (
            <div className="py-10 text-center text-xs font-mono text-cvc-textMuted">
              No sessions recorded for this trainee yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-black/50 border-b border-white/10 text-white/50 text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-3">Session ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Site</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Entry Pitch</th>
                    <th className="py-3 px-3">Traj Dev</th>
                    <th className="py-3 px-3">Technique</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {traineeSessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3 font-semibold text-cvc-cyan">{sess.sessionNumber}</td>
                      <td className="py-3 px-3 text-white/70">{sess.date}</td>
                      <td className="py-3 px-3 text-white max-w-[160px] truncate">{sess.patientProfileName}</td>
                      <td className="py-3 px-3 text-white/80 max-w-[180px] truncate">{sess.siteName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold font-display ${
                            sess.score >= 85
                              ? 'text-emerald-400'
                              : sess.score >= 70
                              ? 'text-cvc-amber'
                              : 'text-cvc-crimson'
                          }`}
                        >
                          {sess.score}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={sess.entryPitchDeg > 45 ? 'text-cvc-crimson font-bold' : 'text-white'}>
                          {sess.entryPitchDeg}°
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={sess.trajectoryDeviationDeg > 5.0 ? 'text-cvc-crimson font-bold' : 'text-white'}>
                          ±{sess.trajectoryDeviationDeg}°
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-white/80">
                          {sess.classification.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sess.flagged
                              ? 'bg-red-500/20 text-cvc-crimson border border-red-500/30'
                              : sess.status === 'validated'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/10 text-white/70 border border-white/10'
                          }`}
                        >
                          {sess.flagged ? 'FLAGGED' : sess.status === 'validated' ? 'VALIDATED' : 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (onSelectSessionForReview) {
                              onSelectSessionForReview(sess);
                            } else {
                              setReviewingSession(sess);
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-cvc-purple hover:bg-purple-600 text-white text-[10px] font-semibold inline-flex items-center space-x-1 cursor-pointer transition shadow-glow-purple"
                        >
                          <Eye className="w-3 h-3" />
                          <span>VIEW SESSION</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. DIRECTORY / LIST VIEW
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cvc-purple/20 text-cvc-purple">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-cvc-cyan">RESIDENCY COHORT ROSTER</span>
          </div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Trainee Management & Kinematic Progression
          </h1>
          <p className="text-xs text-cvc-textMuted mt-0.5">
            Real-time competency tracking, trajectory deviations, and procedure pass rates.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white/80">
            Total Candidates: <strong className="text-cvc-cyan font-bold">{trainees.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="glass-hud rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate by name, ID, or department..."
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 font-mono focus:outline-none focus:border-cvc-purple"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Residency Year Filter */}
          <div className="flex items-center space-x-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/50 text-[11px]">Residency:</span>
            <select
              value={residencyFilter}
              onChange={(e) => setResidencyFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b0f17]">All Years</option>
              <option value="PGY-1" className="bg-[#0b0f17]">PGY-1</option>
              <option value="PGY-2" className="bg-[#0b0f17]">PGY-2</option>
              <option value="PGY-3" className="bg-[#0b0f17]">PGY-3</option>
              <option value="Fellow" className="bg-[#0b0f17]">Fellow</option>
            </select>
          </div>

          {/* Performance Level Filter */}
          <div className="flex items-center space-x-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono">
            <span className="text-white/50 text-[11px]">Level:</span>
            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b0f17]">All Levels</option>
              <option value="PROFICIENT" className="bg-[#0b0f17]">Proficient</option>
              <option value="COMPETENT" className="bg-[#0b0f17]">Competent</option>
              <option value="NEEDS_REMEDIATION" className="bg-[#0b0f17]">Needs Remediation</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/50 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="score" className="bg-[#0b0f17]">Average Score</option>
              <option value="name" className="bg-[#0b0f17]">Candidate Name</option>
              <option value="sessions" className="bg-[#0b0f17]">Session Volume</option>
              <option value="lastActive" className="bg-[#0b0f17]">Last Session</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px]"
              title="Toggle Sort Direction"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>

          {/* Reset Filters button */}
          {(searchTerm || residencyFilter !== 'all' || performanceFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-cvc-crimson text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={loadTrainees}
            className="ml-auto underline text-white hover:text-cvc-crimson"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 glass-hud rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-3 text-xs font-mono text-cvc-textMuted">
          <RotateCcw className="w-6 h-6 animate-spin text-cvc-cyan" />
          <span>Querying deterministic trainee records...</span>
        </div>
      ) : trainees.length === 0 ? (
        /* Empty State */
        <div className="py-16 glass-hud rounded-3xl border border-white/10 text-center space-y-3">
          <Users className="w-10 h-10 text-white/20 mx-auto" />
          <h3 className="font-display font-bold text-white text-base">No Trainees Match Criteria</h3>
          <p className="text-xs font-mono text-cvc-textMuted max-w-md mx-auto">
            Try adjusting your search query or loosening the residency and performance filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-cvc-purple hover:bg-purple-600 text-white text-xs font-mono font-semibold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Trainees Table */
        <div className="glass-hud rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/60 border-b border-white/10 text-white/50 text-[10px] uppercase">
                <tr>
                  <th className="py-3.5 px-4">Trainee</th>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Residency</th>
                  <th className="py-3.5 px-4">Sessions</th>
                  <th className="py-3.5 px-4">Average Score</th>
                  <th className="py-3.5 px-4">First-Pass Rate</th>
                  <th className="py-3.5 px-4">Traj Deviation</th>
                  <th className="py-3.5 px-4">Last Session</th>
                  <th className="py-3.5 px-4">Performance</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trainees.map((trainee) => (
                  <tr
                    key={trainee.id}
                    onClick={() => handleSelectTrainee(trainee)}
                    className="hover:bg-white/5 transition cursor-pointer group"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cvc-purple/20 border border-cvc-purple/30 text-cvc-purple font-display font-bold text-xs flex items-center justify-center">
                          {trainee.avatar || trainee.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-white group-hover:text-cvc-cyan transition block">
                            {trainee.name}
                          </span>
                          <span className="text-[10px] text-white/40 block truncate max-w-[140px]">
                            {trainee.department}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-4 text-white/60 text-[11px]">{trainee.id}</td>

                    {/* Residency Year */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/80">
                        {trainee.residencyYear}
                      </span>
                    </td>

                    {/* Total Sessions */}
                    <td className="py-3.5 px-4 font-bold text-white">{trainee.totalSessions}</td>

                    {/* Average Score */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-display font-bold text-sm ${
                          trainee.averageScore >= 85
                            ? 'text-emerald-400'
                            : trainee.averageScore >= 70
                            ? 'text-cvc-amber'
                            : 'text-cvc-crimson'
                        }`}
                      >
                        {trainee.averageScore}
                      </span>
                    </td>

                    {/* First-Pass Rate */}
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {trainee.firstPassRate}%
                    </td>

                    {/* Mean Trajectory Deviation */}
                    <td className="py-3.5 px-4">
                      <span
                        className={
                          trainee.meanTrajectoryDeviation > 4.5
                            ? 'text-cvc-crimson font-bold'
                            : 'text-white/80'
                        }
                      >
                        ±{trainee.meanTrajectoryDeviation}°
                      </span>
                    </td>

                    {/* Last Session */}
                    <td className="py-3.5 px-4 text-white/60 text-[11px] whitespace-nowrap">
                      {trainee.lastSessionDate}
                    </td>

                    {/* Performance Level */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trainee.performanceLevel === 'PROFICIENT'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : trainee.performanceLevel === 'COMPETENT'
                              ? 'bg-amber-500/15 text-cvc-amber border border-amber-500/30'
                              : 'bg-red-500/15 text-cvc-crimson border border-red-500/30'
                          }`}
                        >
                          {trainee.performanceLevel.replace('_', ' ')}
                        </span>
                        {trainee.flaggedSessionsCount > 0 && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-red-500/20 text-cvc-crimson text-[9px] font-bold border border-red-500/30"
                            title={`${trainee.flaggedSessionsCount} flagged breach sessions`}
                          >
                            ! {trainee.flaggedSessionsCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTrainee(trainee);
                        }}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold inline-flex items-center space-x-1 transition cursor-pointer"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3 h-3 text-cvc-cyan" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { SessionResult, UserProfile } from '../types';
import { dataService, SessionFilterOptions } from '../services/dataService';
import { PATIENT_PROFILES, ANATOMICAL_SITES } from '../api/sessions';
import { SessionReviewDetail } from '../components/SessionReviewDetail';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Play, 
  FileText,
  AlertCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

interface SessionsPageProps {
  currentUser: UserProfile;
  onNavigatePage: (page: string) => void;
  initialSelectedSessionId?: string | null;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({
  currentUser,
  onNavigatePage,
  initialSelectedSessionId,
}) => {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [traineeFilter, setTraineeFilter] = useState<string>('all');
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'deviation'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected Session for Detailed Review
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null);

  // Unique Trainees for dropdown
  const [traineeList, setTraineeList] = useState<{ id: string; name: string }[]>([]);

  // Load Sessions
  const loadSessions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const options: SessionFilterOptions = {
        search: searchTerm,
        traineeId: traineeFilter,
        patientId: patientFilter,
        siteName: siteFilter,
        performanceLevel: performanceFilter,
        sortBy,
        sortOrder,
      };
      const data = await dataService.getSessions(options);
      setSessions(data);

      // Extract unique trainees for filter
      const allSessions = await dataService.getSessions();
      const uniqueTrainees = Array.from(
        new Map(allSessions.map((s) => [s.traineeId, { id: s.traineeId, name: s.traineeName }])).values()
      );
      setTraineeList(uniqueTrainees);

      // If initialSelectedSessionId provided
      if (initialSelectedSessionId) {
        const found = allSessions.find(
          (s) => s.id === initialSelectedSessionId || s.sessionNumber === initialSelectedSessionId
        );
        if (found) setSelectedSession(found);
      }
    } catch (err) {
      setErrorMessage('Failed to load procedural flight records. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [searchTerm, traineeFilter, patientFilter, siteFilter, performanceFilter, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setTraineeFilter('all');
    setPatientFilter('all');
    setSiteFilter('all');
    setPerformanceFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  // If a session is selected for review:
  if (selectedSession) {
    return (
      <SessionReviewDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
        onSessionUpdated={(updated) => {
          setSelectedSession(updated);
          loadSessions();
        }}
      />
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cvc-cyan/20 text-cvc-cyan">
              <History className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-cvc-cyan">AUDIT LOGS & BLACK BOX TELEMETRY</span>
          </div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Procedural Simulation Sessions
          </h1>
          <p className="text-xs text-cvc-textMuted mt-0.5">
            Complete flight recorder logs for central venous cannulation trajectories and technique audits.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white/80">
            Total Audited: <strong className="text-cvc-cyan font-bold">{sessions.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-hud rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by session #, candidate, patient, or site..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 font-mono focus:outline-none focus:border-cvc-purple"
            />
          </div>

          {/* Quick Stats or Sort Selector */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono">
              <ArrowUpDown className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/50 text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="date" className="bg-[#0b0f17]">Timestamp</option>
                <option value="score" className="bg-[#0b0f17]">Score</option>
                <option value="deviation" className="bg-[#0b0f17]">Trajectory Deviation</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px]"
                title="Toggle direction"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>

            {(searchTerm || traineeFilter !== 'all' || patientFilter !== 'all' || siteFilter !== 'all' || performanceFilter !== 'all') && (
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

        {/* Second Row: Specific Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs font-mono">
          <div className="flex items-center space-x-1 text-white/50 text-[11px]">
            <Filter className="w-3 h-3 text-cvc-cyan" />
            <span>Filters:</span>
          </div>

          {/* Trainee Filter */}
          <select
            value={traineeFilter}
            onChange={(e) => setTraineeFilter(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0b0f17]">All Trainees</option>
            {traineeList.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0b0f17]">
                {t.name}
              </option>
            ))}
          </select>

          {/* Patient Filter */}
          <select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0b0f17]">All Patients</option>
            {PATIENT_PROFILES.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0b0f17]">
                {p.name}
              </option>
            ))}
          </select>

          {/* Insertion Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0b0f17]">All Insertion Sites</option>
            {ANATOMICAL_SITES.map((s) => (
              <option key={s.id} value={s.name.split('(')[0].trim()} className="bg-[#0b0f17]">
                {s.name}
              </option>
            ))}
          </select>

          {/* Performance Filter */}
          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0b0f17]">All Performance Levels</option>
            <option value="PROFICIENT" className="bg-[#0b0f17]">Proficient (&gt;85)</option>
            <option value="COMPETENT" className="bg-[#0b0f17]">Competent (70-84)</option>
            <option value="NEEDS_REMEDIATION" className="bg-[#0b0f17]">Needs Remediation (&lt;70)</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-cvc-crimson text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={loadSessions}
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
          <span>Loading telemetry archives from flight recorder...</span>
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <div className="py-16 glass-hud rounded-3xl border border-white/10 text-center space-y-3">
          <History className="w-10 h-10 text-white/20 mx-auto" />
          <h3 className="font-display font-bold text-white text-base">No Sessions Found</h3>
          <p className="text-xs font-mono text-cvc-textMuted max-w-md mx-auto">
            No procedural runs match the active filter criteria. Try resetting filters or expanding search terms.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-cvc-purple hover:bg-purple-600 text-white text-xs font-mono font-semibold transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Sessions Table */
        <div className="glass-hud rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/60 border-b border-white/10 text-white/50 text-[10px] uppercase">
                <tr>
                  <th className="py-3.5 px-3.5">SESSION ID</th>
                  <th className="py-3.5 px-3.5">TRAINEE</th>
                  <th className="py-3.5 px-3.5">DATE</th>
                  <th className="py-3.5 px-3.5">PATIENT</th>
                  <th className="py-3.5 px-3.5">SITE</th>
                  <th className="py-3.5 px-3.5">SCORE</th>
                  <th className="py-3.5 px-3.5">ENTRY ANGLE</th>
                  <th className="py-3.5 px-3.5">TRAJ DEVIATION</th>
                  <th className="py-3.5 px-3.5">TECHNIQUE</th>
                  <th className="py-3.5 px-3.5">STATUS</th>
                  <th className="py-3.5 px-3.5 text-right">AUDIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map((sess) => (
                  <tr
                    key={sess.id}
                    onClick={() => setSelectedSession(sess)}
                    className="hover:bg-white/5 transition cursor-pointer group"
                  >
                    {/* Session ID */}
                    <td className="py-3.5 px-3.5 font-semibold text-cvc-cyan whitespace-nowrap">
                      {sess.sessionNumber}
                    </td>

                    {/* Trainee */}
                    <td className="py-3.5 px-3.5">
                      <span className="font-bold text-white group-hover:text-cvc-cyan transition block">
                        {sess.traineeName}
                      </span>
                      <span className="text-[10px] text-white/40">{sess.traineePgy}</span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3.5 text-white/70 whitespace-nowrap text-[11px]">
                      {sess.date}
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-3.5 text-white max-w-[140px] truncate" title={sess.patientProfileName}>
                      {sess.patientProfileName}
                    </td>

                    {/* Site */}
                    <td className="py-3.5 px-3.5 text-white/80 max-w-[150px] truncate" title={sess.siteName}>
                      {sess.siteName}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`font-display font-bold text-sm ${
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

                    {/* Entry Angle */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={
                          sess.entryPitchDeg > 45 ? 'text-cvc-crimson font-bold' : 'text-white'
                        }
                      >
                        {sess.entryPitchDeg}°
                      </span>
                    </td>

                    {/* Trajectory Deviation */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={
                          sess.trajectoryDeviationDeg > 5.0
                            ? 'text-cvc-crimson font-bold'
                            : 'text-white/80'
                        }
                      >
                        ±{sess.trajectoryDeviationDeg}°
                      </span>
                    </td>

                    {/* Technique */}
                    <td className="py-3.5 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/80 whitespace-nowrap">
                        {sess.classification.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
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

                    {/* Audit Action */}
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(sess);
                        }}
                        className="px-2.5 py-1 rounded bg-cvc-purple/80 hover:bg-cvc-purple text-white text-[10px] font-semibold inline-flex items-center space-x-1 transition shadow-glow-purple cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Audit</span>
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

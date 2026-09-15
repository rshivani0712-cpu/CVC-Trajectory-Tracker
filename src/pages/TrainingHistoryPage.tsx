import React, { useState } from 'react';
import { SessionResult, UserProfile } from '../types';
import { MOCK_SESSIONS } from '../api/sessions';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock
} from 'lucide-react';

interface TrainingHistoryPageProps {
  currentUser: UserProfile;
  onSelectSession: (session: SessionResult) => void;
  onNavigatePage: (page: string) => void;
}

export const TrainingHistoryPage: React.FC<TrainingHistoryPageProps> = ({
  currentUser,
  onSelectSession,
  onNavigatePage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredSessions = MOCK_SESSIONS.filter((s) => {
    const matchesSearch =
      s.sessionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patientProfileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'flagged' && s.flagged) ||
      (filterStatus === 'validated' && s.status === 'validated') ||
      (filterStatus === 'completed' && s.status === 'completed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-cvc-purple/20 text-cvc-purple">
              <History className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-cvc-cyan">CVC SIMULATION RECORDS</span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Historical Training Sessions
          </h2>
          <p className="text-xs text-cvc-textMuted mt-0.5">
            Audit trajectory logs, technique evaluations, and carotid proximity outcomes across all sessions.
          </p>
        </div>

        <button
          onClick={() => onNavigatePage('simulator')}
          className="px-4 py-2 rounded-xl bg-cvc-cyan text-black font-semibold text-xs flex items-center space-x-1.5 shadow-glow-cyan hover:bg-teal-300 transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>Launch New Simulation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-hud rounded-2xl p-3 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by session #, operator, or patient..."
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cvc-purple font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 text-xs font-mono w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Sessions (5)' },
            { id: 'validated', label: 'Validated (2)' },
            { id: 'completed', label: 'Completed (2)' },
            { id: 'flagged', label: 'Flagged / Remediate (1)' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterStatus(pill.id)}
              className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap ${
                filterStatus === pill.id
                  ? 'bg-cvc-purple text-white border-cvc-purple shadow-glow-purple font-semibold'
                  : 'bg-black/40 text-cvc-textMuted border-white/5 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-hud rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/60 border-b border-white/10 text-cvc-textMuted uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">AI Classification</th>
                <th className="py-3 px-4">Clearance</th>
                <th className="py-3 px-4">Coplanarity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-white/5 transition cursor-pointer"
                  onClick={() => {
                    onSelectSession(session);
                    onNavigatePage('results');
                  }}
                >
                  {/* Session ID */}
                  <td className="py-3.5 px-4 font-bold text-white">
                    <span className="text-cvc-cyan">{session.sessionNumber}</span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-white/70">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3 h-3 text-white/40" />
                      <span>{session.date}</span>
                    </div>
                  </td>

                  {/* Trainee */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white">{session.traineeName}</span>
                    <span className="text-[10px] text-white/40 block">{session.traineePgy}</span>
                  </td>

                  {/* Patient Profile */}
                  <td className="py-3.5 px-4 text-white/80">
                    {session.patientProfileName}
                  </td>

                  {/* Score */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg font-bold font-display text-sm ${
                        session.score >= 85
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : session.score >= 70
                          ? 'bg-amber-500/20 text-cvc-amber border border-amber-500/30'
                          : 'bg-red-500/20 text-cvc-crimson border border-red-500/30'
                      }`}
                    >
                      {session.score}
                    </span>
                  </td>

                  {/* AI Classification */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold inline-flex items-center space-x-1 ${
                        session.flagged
                          ? 'bg-red-500/20 text-cvc-crimson border border-red-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {session.flagged ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>{session.classification.replace('_', ' ')}</span>
                    </span>
                  </td>

                  {/* Carotid Clearance */}
                  <td className="py-3.5 px-4">
                    <span
                      className={
                        session.carotidClearanceMm < 5.0
                          ? 'text-cvc-crimson font-bold'
                          : 'text-white'
                      }
                    >
                      {session.carotidClearanceMm} mm
                    </span>
                  </td>

                  {/* Coplanarity */}
                  <td className="py-3.5 px-4 text-cvc-cyan font-semibold">
                    {session.coplanarityPercent}%
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSession(session);
                        onNavigatePage('results');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] inline-flex items-center space-x-1 border border-white/10"
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
    </div>
  );
};

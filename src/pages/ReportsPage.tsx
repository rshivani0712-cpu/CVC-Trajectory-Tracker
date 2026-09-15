import React, { useState, useEffect } from 'react';
import { UserProfile, ReportType, ReportFilterCriteria, GeneratedReport } from '../types';
import { dataService } from '../services/dataService';
import { REPORT_TEMPLATES } from '../data/mockReports';
import { PATIENT_PROFILES, ANATOMICAL_SITES } from '../api/sessions';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  X, 
  Sparkles, 
  Building2, 
  Users, 
  Activity, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface ReportsPageProps {
  currentUser: UserProfile;
  onNavigatePage: (page: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  currentUser,
  onNavigatePage,
}) => {
  // Filter state
  const [dateRange, setDateRange] = useState<string>('Last 30 Days');
  const [traineeFilter, setTraineeFilter] = useState<string>('all');
  const [residencyFilter, setResidencyFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [patientFilter, setPatientFilter] = useState<string>('all');

  // Trainee list for dropdown
  const [traineeList, setTraineeList] = useState<{ id: string; name: string }[]>([]);

  // Generated Report Preview Modal / View
  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Template session counts
  const [templateSessionCounts, setTemplateSessionCounts] = useState<{ [key: string]: number }>({});

  // Fetch initial metadata and calculate counts
  const updateReportCounts = async () => {
    try {
      const allSessions = await dataService.getSessions();
      const uniqueTrainees = Array.from(
        new Map(allSessions.map((s) => [s.traineeId, { id: s.traineeId, name: s.traineeName }])).values()
      );
      setTraineeList(uniqueTrainees);

      const counts: { [key: string]: number } = {};
      for (const t of REPORT_TEMPLATES) {
        const criteria: ReportFilterCriteria = {
          dateRange,
          traineeId: traineeFilter,
          residencyYear: residencyFilter,
          siteCategory: siteFilter,
          patientCategory: patientFilter,
        };
        const rep = await dataService.generateReportPreview(t.type, criteria);
        counts[t.type] = rep.sessionCount;
      }
      setTemplateSessionCounts(counts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    updateReportCounts();
  }, [dateRange, traineeFilter, residencyFilter, siteFilter, patientFilter]);

  const handleGenerateReport = async (type: ReportType) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const criteria: ReportFilterCriteria = {
        dateRange,
        traineeId: traineeFilter,
        residencyYear: residencyFilter,
        siteCategory: siteFilter,
        patientCategory: patientFilter,
      };
      const rep = await dataService.generateReportPreview(type, criteria);
      setActiveReport(rep);
    } catch (err) {
      setErrorMessage('Failed to generate clinical report. Please verify filter criteria.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CVC_Report_${activeReport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!activeReport || !activeReport.auditedSessions) return;
    const headers = ['SessionID', 'Date', 'Trainee', 'Patient', 'Site', 'Score', 'EntryAngle', 'TrajDev', 'Status'];
    const rows = activeReport.auditedSessions.map((s) => [
      s.sessionNumber,
      `"${s.date}"`,
      `"${s.traineeName}"`,
      `"${s.patientProfileName}"`,
      `"${s.siteName}"`,
      s.score,
      s.entryPitchDeg,
      s.trajectoryDeviationDeg,
      s.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CVC_Report_${activeReport.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cvc-purple/20 text-cvc-purple">
              <FileText className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-cvc-cyan">INSTITUTIONAL AUDIT & ATTESTATION</span>
          </div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Clinical Procedural Reports
          </h1>
          <p className="text-xs text-cvc-textMuted mt-0.5">
            Accreditation-grade procedural audit dossiers, cohort progression metrics, and safety remediation reports.
          </p>
        </div>
      </div>

      {/* Global Filter Criteria Bar */}
      <div className="glass-hud rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-white/70">
          <Filter className="w-3.5 h-3.5 text-cvc-cyan" />
          <span className="font-bold uppercase tracking-wider text-[11px] text-white">
            Report Scope & Cohort Filter Criteria
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-mono">
          {/* Date Range */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1">DATE RANGE</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="Last 7 Days" className="bg-[#0b0f17]">Last 7 Days</option>
              <option value="Last 30 Days" className="bg-[#0b0f17]">Last 30 Days</option>
              <option value="Current Academic Quarter" className="bg-[#0b0f17]">Current Academic Quarter</option>
              <option value="AY 2025-2026" className="bg-[#0b0f17]">AY 2025-2026 (Full Year)</option>
              <option value="All Recorded" className="bg-[#0b0f17]">All Recorded History</option>
            </select>
          </div>

          {/* Trainee */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1">CANDIDATE / RESIDENT</label>
            <select
              value={traineeFilter}
              onChange={(e) => setTraineeFilter(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b0f17]">All Candidates</option>
              {traineeList.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0b0f17]">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Residency Year */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1">RESIDENCY YEAR</label>
            <select
              value={residencyFilter}
              onChange={(e) => setResidencyFilter(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b0f17]">All Residency Years</option>
              <option value="PGY-1" className="bg-[#0b0f17]">PGY-1 (Intern)</option>
              <option value="PGY-2" className="bg-[#0b0f17]">PGY-2 (Junior)</option>
              <option value="PGY-3" className="bg-[#0b0f17]">PGY-3 (Senior/Chief)</option>
              <option value="Fellow" className="bg-[#0b0f17]">Clinical Fellow</option>
            </select>
          </div>

          {/* Insertion Site */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1">INSERTION SITE</label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b0f17]">All Anatomical Sites</option>
              {ANATOMICAL_SITES.map((s) => (
                <option key={s.id} value={s.name.split('(')[0].trim()} className="bg-[#0b0f17]">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Profile */}
          <div>
            <label className="text-[10px] text-white/50 block mb-1">PATIENT PHANTOM</label>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b0f17]">All Anatomical Profiles</option>
              {PATIENT_PROFILES.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0b0f17]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-cvc-crimson text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Report Templates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORT_TEMPLATES.map((tmpl) => {
          const sessionCount = templateSessionCounts[tmpl.type] ?? 0;
          return (
            <div
              key={tmpl.type}
              className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-cvc-purple/40 transition group"
            >
              <div className="space-y-3">
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cvc-cyan font-bold">
                    {tmpl.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-white/70">
                    {sessionCount} sessions
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-base text-white group-hover:text-cvc-cyan transition">
                  {tmpl.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-cvc-textMuted leading-relaxed">
                  {tmpl.description}
                </p>

                {/* Metadata Pills */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
                  <span>Scope: {dateRange}</span>
                  <span className="text-emerald-400 font-bold">Ready</span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerateReport(tmpl.type)}
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-cvc-purple hover:bg-purple-600 text-white font-display font-semibold text-xs shadow-glow-purple flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Generate Report</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Generated Report Preview Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] glass-hud rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl flex flex-col space-y-6 overflow-y-auto bg-[#07090e]">
            {/* Action Bar Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-xl bg-cvc-purple/20 text-cvc-purple">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-mono text-cvc-cyan uppercase block">
                    INSTITUTIONAL AUDIT DOSSIER • {activeReport.id}
                  </span>
                  <h2 className="font-display font-bold text-lg md:text-xl text-white">
                    {activeReport.title}
                  </h2>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition flex items-center space-x-1.5 cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition flex items-center space-x-1.5 cursor-pointer"
                  title="Export CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition flex items-center space-x-1.5 cursor-pointer"
                  title="Export JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">JSON</span>
                </button>
                <button
                  onClick={() => setActiveReport(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
              <div>
                <span className="text-white/40 block text-[10px]">FACULTY AUDITOR</span>
                <span className="font-bold text-white text-sm">{activeReport.generatedBy}</span>
                <span className="text-[10px] text-white/50 block">University Medical Center • Dept of Anesthesiology & Critical Care</span>
              </div>
              <div className="sm:text-right">
                <span className="text-white/40 block text-[10px]">GENERATED TIMESTAMP</span>
                <span className="font-bold text-cvc-cyan">{activeReport.generatedDate}</span>
                <span className="text-[10px] text-white/50 block">Evaluation Scope: {dateRange}</span>
              </div>
            </div>

            {/* Metric Statistics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block uppercase">
                  PROCEDURES AUDITED
                </span>
                <span className="text-2xl font-display font-black text-white mt-0.5 block">
                  {activeReport.sessionCount}
                </span>
                <span className="text-[9px] font-mono text-white/50">Recorded Runs</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block uppercase">
                  AGGREGATE MEAN SCORE
                </span>
                <span className="text-2xl font-display font-black text-emerald-400 mt-0.5 block">
                  {activeReport.meanScore}
                </span>
                <span className="text-[9px] font-mono text-white/50">Benchmark: 80.0</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block uppercase">
                  FIRST-PASS SUCCESS
                </span>
                <span className="text-2xl font-display font-black text-white mt-0.5 block">
                  {activeReport.firstPassRate}%
                </span>
                <span className="text-[9px] font-mono text-cvc-cyan">Clean Entry</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block uppercase">
                  TRAJECTORY DEVIATION
                </span>
                <span className="text-2xl font-display font-black text-cvc-amber mt-0.5 block">
                  ±{activeReport.trajectoryDeviation}°
                </span>
                <span className="text-[9px] font-mono text-white/50">Jitter Corridor</span>
              </div>
            </div>

            {/* Performance Summary Narrative */}
            <div className="space-y-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-cvc-cyan">
                Executive Procedural Evaluation
              </h4>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-white/90 leading-relaxed font-sans">
                {activeReport.performanceSummary}
              </div>
            </div>

            {/* Technique Distribution Breakdown */}
            <div className="space-y-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                Kinematic Technique Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                {activeReport.techniqueDistribution.map((t, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-white/50 block truncate">{t.name}</span>
                    <span className="font-display font-black text-white text-sm block mt-0.5">
                      {t.percentage}%
                    </span>
                    <span className="text-[9px] text-white/40">{t.count} runs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Threshold Violations Section */}
            <div className="space-y-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-cvc-crimson">
                Boundary Safety & Clearance Violations
              </h4>
              <div className="space-y-1.5">
                {activeReport.thresholdViolations.map((tv, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-mono flex items-center justify-between text-cvc-crimson"
                  >
                    <span>{tv.metric}</span>
                    <span className="font-bold">{tv.count} occurrences</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Guidance Directives */}
            <div className="space-y-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-cvc-purple">
                Faculty Recommendations & Remediation Plan
              </h4>
              <div className="p-4 rounded-2xl bg-cvc-purple/10 border border-cvc-purple/20 space-y-2">
                {activeReport.recommendations.map((rec, i) => (
                  <div key={i} className="text-xs text-white/90 flex items-start space-x-2">
                    <span className="text-cvc-purple font-bold">✓</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audited Flight Sessions Table Preview */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                Underlying Audited Flight Sessions ({activeReport.auditedSessions.length})
              </h4>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-black/60 border-b border-white/10 text-white/50 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Session</th>
                      <th className="py-2 px-3">Trainee</th>
                      <th className="py-2 px-3">Patient</th>
                      <th className="py-2 px-3">Score</th>
                      <th className="py-2 px-3">Pitch</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeReport.auditedSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-semibold text-cvc-cyan">{s.sessionNumber}</td>
                        <td className="py-2 px-3 text-white">{s.traineeName}</td>
                        <td className="py-2 px-3 text-white/70 max-w-[160px] truncate">{s.patientProfileName}</td>
                        <td className="py-2 px-3 font-bold text-emerald-400">{s.score}</td>
                        <td className="py-2 px-3 text-white/80">{s.entryPitchDeg}°</td>
                        <td className="py-2 px-3 text-right text-white/60">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

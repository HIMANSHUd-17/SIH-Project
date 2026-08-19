import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Flame, MapPin,
  Clock, Activity, MessageSquare, Search, RefreshCw, Eye
} from 'lucide-react';
import { TouristProfile } from '../../types';

interface GuideAiMonitoringProps {
  tourists: TouristProfile[];
  guide_id?: string;
  guide_name?: string;
}

export const GuideAiMonitoring: React.FC<GuideAiMonitoringProps> = ({
  tourists,
  guide_id,
  guide_name
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'ANOMALIES' | 'AT_RISK' | 'SOS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const anomalyCount = tourists.filter(t => t.anomaly?.anomaly_detected).length;
  const highRiskCount = tourists.filter(t => (t.currentRiskScore || 0) > 50).length;
  const activeSosCount = tourists.filter(t => t.sosTriggered || t.safetyStatus === 'EMERGENCY_SOS').length;
  const nominalCount = tourists.filter(t => (t.currentRiskScore || 0) <= 25 && !t.anomaly?.anomaly_detected && !t.sosTriggered).length;

  const filteredTourists = tourists.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      t.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      (t.currentLocation?.address || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filter === 'ANOMALIES') return Boolean(t.anomaly?.anomaly_detected);
    if (filter === 'AT_RISK') return (t.currentRiskScore || 0) > 25 || t.safetyStatus === 'CAUTION' || t.safetyStatus === 'AT_RISK';
    if (filter === 'SOS') return Boolean(t.sosTriggered || t.safetyStatus === 'EMERGENCY_SOS');

    return true;
  });

  return (
    <div className="flex flex-col gap-6 font-guide">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gd-primary text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-gd-secondary" />
            </div>
            <div>
              <h2 className="text-[28px] leading-[36px] font-bold tracking-tight text-gd-on-bg">
                AI Safety & Risk Monitoring
              </h2>
              <p className="text-sm text-gd-on-surface-var">
                Live automated safety monitoring for <span className="font-bold text-gd-primary">Group {guide_id || '—'}</span> ({guide_name || 'Guide'})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-gd-surface px-3 py-1.5 rounded-lg border border-gd-outline-var shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-gd-primary uppercase tracking-wider">Live AI Stream</span>
          </div>
        </div>
      </div>

      {/* ═══ Key Safety Metrics Row ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="bg-gd-surface p-4 rounded-xl border border-gd-outline-var shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-gd-on-surface-var uppercase tracking-wider">Assigned Members</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-gd-primary font-mono">{tourists.length}</span>
            <span className="text-xs text-gd-on-surface-var">Tourists</span>
          </div>
          <div className="text-[11px] text-gd-on-surface-var mt-1">Group {guide_id || 'Active'}</div>
        </div>

        {/* Nominal Safe */}
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Normal / Safe</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-emerald-900 font-mono">{nominalCount}</span>
            <span className="text-xs text-emerald-700">In Zone</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Nominal risk & normal movement</div>
        </div>

        {/* Behavioral Anomalies Flagged */}
        <div className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between ${
          anomalyCount > 0
            ? 'bg-amber-50/90 border-amber-300'
            : 'bg-gd-surface border-gd-outline-var'
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              anomalyCount > 0 ? 'text-amber-900' : 'text-gd-on-surface-var'
            }`}>
              Anomalies Flagged
            </span>
            <AlertTriangle className={`w-4 h-4 ${
              anomalyCount > 0 ? 'text-amber-600 animate-pulse' : 'text-gd-outline'
            }`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold font-mono ${
              anomalyCount > 0 ? 'text-amber-900' : 'text-gd-primary'
            }`}>
              {anomalyCount}
            </span>
            <span className="text-xs text-gd-on-surface-var">Detected</span>
          </div>
          <div className={`text-[11px] mt-1 ${anomalyCount > 0 ? 'text-amber-800 font-semibold' : 'text-gd-on-surface-var'}`}>
            {anomalyCount > 0 ? 'Route deviation or stillness' : 'No behavioral outliers'}
          </div>
        </div>

        {/* Active Emergency / SOS */}
        <div className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between ${
          activeSosCount > 0 || highRiskCount > 0
            ? 'bg-red-50 border-red-300'
            : 'bg-gd-surface border-gd-outline-var'
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              activeSosCount > 0 ? 'text-red-900' : 'text-gd-on-surface-var'
            }`}>
              Active Emergency / SOS
            </span>
            <Flame className={`w-4 h-4 ${
              activeSosCount > 0 ? 'text-red-600 animate-bounce' : 'text-gd-outline'
            }`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold font-mono ${
              activeSosCount > 0 ? 'text-red-900' : 'text-gd-primary'
            }`}>
              {activeSosCount}
            </span>
            <span className="text-xs text-gd-on-surface-var">Alerts</span>
          </div>
          <div className={`text-[11px] mt-1 ${activeSosCount > 0 ? 'text-red-700 font-bold' : 'text-gd-on-surface-var'}`}>
            {activeSosCount > 0 ? 'Immediate assistance needed' : 'All members responsive'}
          </div>
        </div>
      </div>

      {/* ═══ Main Table Card ═══ */}
      <div className="bg-gd-surface rounded-xl border border-gd-outline-var shadow-sm overflow-hidden flex flex-col">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-gd-outline-var bg-gd-surface-bright flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gd-on-surface-var" />
              <input
                type="text"
                placeholder="Search group members..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-gd-surface pl-9 pr-3 py-1.5 rounded-lg border border-gd-outline-var text-xs text-gd-on-surface placeholder:text-gd-on-surface-var focus:outline-none focus:ring-1 focus:ring-gd-secondary w-52"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-gd-surface p-1 rounded-lg border border-gd-outline-var text-xs font-semibold">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filter === 'ALL'
                    ? 'bg-gd-primary text-white shadow-2xs'
                    : 'text-gd-on-surface-var hover:text-gd-primary'
                }`}
              >
                All ({tourists.length})
              </button>
              <button
                onClick={() => setFilter('ANOMALIES')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filter === 'ANOMALIES'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-gd-on-surface-var hover:text-amber-700'
                }`}
              >
                Anomalies ({anomalyCount})
              </button>
              <button
                onClick={() => setFilter('AT_RISK')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filter === 'AT_RISK'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-gd-on-surface-var hover:text-orange-700'
                }`}
              >
                At Risk ({highRiskCount})
              </button>
              <button
                onClick={() => setFilter('SOS')}
                className={`px-3 py-1 rounded-md transition-all ${
                  filter === 'SOS'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-gd-on-surface-var hover:text-red-700'
                }`}
              >
                SOS ({activeSosCount})
              </button>
            </div>
          </div>

          <div className="text-xs font-semibold text-gd-on-surface-var">
            Showing {filteredTourists.length} of {tourists.length} Assigned Tourists
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-0">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-gd-surface-bright border-b border-gd-outline-var text-gd-on-surface-var text-[11px] uppercase font-bold tracking-wider">
                <th className="px-4 py-3.5">Tourist / ID</th>
                <th className="px-4 py-3.5">Live Location</th>
                <th className="px-4 py-3.5">Risk Score</th>
                <th className="px-4 py-3.5">Risk Level</th>
                <th className="px-4 py-3.5">Anomaly Status</th>
                <th className="px-4 py-3.5">Anomaly Details</th>
                <th className="px-4 py-3.5">Safety Status</th>
                <th className="px-4 py-3.5">SOS State</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gd-outline-var">
              {filteredTourists.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gd-on-surface-var">
                    No tourists found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredTourists.map(t => {
                  const score = typeof t.currentRiskScore === 'number' ? t.currentRiskScore : 10;
                  const isAnomaly = Boolean(t.anomaly?.anomaly_detected);
                  const anomalyType = t.anomaly?.anomaly_type || 'NONE';
                  const anomalySeverity = (t.anomaly?.severity || 'LOW').toUpperCase();
                  const riskLevel = t.riskLevel || (score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'CRITICAL');
                  const safetyStatus = t.safetyDetails?.status || t.safetyStatus || 'NORMAL';
                  const isSos = Boolean(t.sosTriggered || t.safetyStatus === 'EMERGENCY_SOS');

                  // Risk badge styling
                  let riskBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  let riskBarColor = 'bg-emerald-500';
                  if (riskLevel === 'CRITICAL') {
                    riskBadgeStyle = 'bg-red-50 text-red-800 border-red-200 animate-pulse font-bold';
                    riskBarColor = 'bg-red-500';
                  } else if (riskLevel === 'HIGH') {
                    riskBadgeStyle = 'bg-orange-50 text-orange-800 border-orange-200 font-semibold';
                    riskBarColor = 'bg-orange-500';
                  } else if (riskLevel === 'MODERATE') {
                    riskBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
                    riskBarColor = 'bg-amber-500';
                  }

                  // Safety status badge styling
                  let safetyStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  if (safetyStatus === 'CRITICAL' || safetyStatus === 'EMERGENCY_SOS' || safetyStatus === 'EMERGENCY') {
                    safetyStyle = 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse';
                  } else if (safetyStatus === 'ESCALATED') {
                    safetyStyle = 'bg-orange-100 text-orange-800 border-orange-300 font-semibold';
                  } else if (safetyStatus === 'ELEVATED') {
                    safetyStyle = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
                  } else if (safetyStatus === 'ADVISORY') {
                    safetyStyle = 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
                  }

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gd-surface-bright/70 transition-colors"
                    >
                      {/* Tourist / ID */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gd-primary flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isSos && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Active SOS"></span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-gd-on-surface-var mt-0.5">
                          ID: {t.id}
                        </div>
                      </td>

                      {/* Live Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-gd-on-bg font-medium">
                          <MapPin className="w-3.5 h-3.5 text-gd-secondary shrink-0" />
                          <span className="truncate max-w-[160px]" title={t.currentLocation?.address || 'Live Location'}>
                            {t.currentLocation?.address || 'Live Location'}
                          </span>
                        </div>
                        {t.currentLocation?.lat && (
                          <div className="text-[10px] font-mono text-gd-on-surface-var ml-4.5">
                            {t.currentLocation.lat.toFixed(4)}°, {t.currentLocation.lng.toFixed(4)}°
                          </div>
                        )}
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gd-primary text-xs w-12">
                            {score.toFixed(1)}/100
                          </span>
                          <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full ${riskBarColor} transition-all`}
                              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskBadgeStyle}`}>
                          {riskLevel}
                        </span>
                      </td>

                      {/* Anomaly Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAnomaly
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isAnomaly && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                          {isAnomaly ? 'DETECTED' : 'NORMAL'}
                        </span>
                      </td>

                      {/* Anomaly Details */}
                      <td className="px-4 py-3.5">
                        {isAnomaly ? (
                          <div>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 block max-w-[130px] truncate">
                              {anomalyType}
                            </span>
                            <span className="text-[9px] font-semibold text-amber-700 block mt-0.5">
                              Severity: {anomalySeverity}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gd-on-surface-var text-[11px]">Nominal</span>
                        )}
                      </td>

                      {/* Safety Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${safetyStyle}`}>
                          {safetyStatus}
                        </span>
                      </td>

                      {/* SOS Status */}
                      <td className="px-4 py-3.5">
                        {isSos ? (
                          <span className="inline-flex items-center gap-1 bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full animate-bounce shadow-2xs">
                            <Flame className="w-2.5 h-2.5" />
                            ACTIVE SOS
                          </span>
                        ) : (
                          <span className="text-gd-on-surface-var text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                            OFF
                          </span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3.5 text-gd-on-surface-var font-mono text-[10px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gd-outline" />
                          <span>{t.lastUpdated || 'Live'}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate('/guide/chat')}
                            className="bg-gd-surface hover:bg-gd-surface-variant text-gd-primary border border-gd-outline-var px-2 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Message Tourist"
                          >
                            <MessageSquare className="w-3 h-3 text-gd-secondary" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-gd-surface-bright border-t border-gd-outline-var flex items-center justify-between text-[11px] text-gd-on-surface-var">
          <span className="font-mono">
            Safety Fusion Status: Continuous live AI surveillance active for Group {guide_id || '—'}
          </span>
          <span className="text-gd-secondary font-bold">
            Real-time SSE synced
          </span>
        </div>
      </div>
    </div>
  );
};

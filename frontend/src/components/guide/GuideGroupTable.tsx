import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, AlertTriangle, MapPin, Filter, ArrowUpDown,
  MessageSquare, History, Flag, Battery, BatteryLow, BatteryMedium,
  BatteryWarning, Megaphone, ChevronLeft, ChevronRight, UserPlus, Trash2
} from 'lucide-react';
import { TouristProfile } from '../../types';
import { GuideRegisterModal } from './GuideRegisterModal';

interface GuideGroupTableProps {
  tourists: TouristProfile[];
  guide_id?: string;
  onRegisterTourist: (data: any) => Promise<TouristProfile | null>;
  onDeleteTourist: (id: string) => Promise<void>;
}

const ROWS_PER_PAGE = 8;

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRiskLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: `High (${score})`, color: 'text-gd-error' };
  if (score >= 30) return { label: `Medium (${score})`, color: 'text-[#92400E]' };
  return { label: `Low (${score})`, color: 'text-gd-secondary' };
}

function getLocationBadge(tourist: TouristProfile): { label: string; dotColor: string; bgColor: string; textColor: string } {
  if (tourist.safetyStatus === 'AT_RISK' || tourist.safetyStatus === 'EMERGENCY_SOS') {
    return { label: 'Out of Bounds', dotColor: 'bg-[#DC2626]', bgColor: 'bg-[#FEE2E2]', textColor: 'text-[#991B1B]' };
  }
  if (tourist.safetyStatus === 'CAUTION') {
    return { label: 'Edge of Zone', dotColor: 'bg-[#D97706]', bgColor: 'bg-[#FEF3C7]', textColor: 'text-[#92400E]' };
  }
  const zones = ['Historic Plaza', 'North Gate', 'Temple Road', 'River Walk', 'Main Square', 'East Bazaar', 'West Pavilion', 'South Garden', 'Market Lane', 'Temple Steps'];
  const zone = tourist.currentLocation?.address || zones[Math.abs(tourist.id.charCodeAt(tourist.id.length - 1)) % zones.length];
  return { label: zone, dotColor: 'bg-[#059669]', bgColor: 'bg-[#D1FAE5]', textColor: 'text-[#065F46]' };
}

function getBatteryIcon(level: number) {
  if (level <= 15) return <BatteryWarning className="w-4 h-4" />;
  if (level <= 40) return <BatteryLow className="w-4 h-4" />;
  if (level <= 70) return <BatteryMedium className="w-4 h-4" />;
  return <Battery className="w-4 h-4" />;
}

function getLastSeen(tourist: TouristProfile): string {
  if (tourist.lastUpdated === 'Just now' || tourist.lastUpdated?.includes('now')) return 'Just now';
  if (tourist.lastUpdated?.includes('ago')) return tourist.lastUpdated;
  if (tourist.lastUpdated?.includes('min')) return tourist.lastUpdated;
  return tourist.lastUpdated || 'Just now';
}

export const GuideGroupTable: React.FC<GuideGroupTableProps> = ({ tourists, guide_id, onRegisterTourist, onDeleteTourist }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<'name' | 'risk' | 'battery'>('risk');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const presentCount = tourists.filter(t => t.safetyStatus !== 'EMERGENCY_SOS').length;
  const alertCount = tourists.filter(t => t.safetyStatus === 'AT_RISK' || t.safetyStatus === 'EMERGENCY_SOS').length;

  // Sort tourists
  const sorted = [...tourists].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortField === 'risk') cmp = a.currentRiskScore - b.currentRiskScore;
    else if (sortField === 'battery') cmp = a.batteryLevel - b.batteryLevel;
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const paginated = sorted.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-[40px] font-bold tracking-tight text-gd-on-bg font-guide">
            Tour Group Details
          </h2>
          <p className="text-base text-gd-on-surface-var mt-1">
            Managing {tourists.length} tourists in Group {guide_id || '—'}. Ensure all members remain within safe zones.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center justify-center gap-2 bg-gd-primary-ctr text-gd-on-primary-ctr px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap font-guide border border-gd-outline-var"
          >
            <UserPlus className="w-4 h-4" />
            Add Tourist
          </button>
          <button className="flex items-center justify-center gap-2 bg-gd-secondary text-gd-on-secondary px-6 py-2 rounded-full text-xl font-semibold hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap font-guide">
            <Megaphone className="w-5 h-5" />
            Broadcast to Group
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gd-surface border border-gd-outline-var rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gd-on-surface-var">
            <UserCheck className="w-5 h-5" />
            <span className="text-[13px] font-medium">Present Members</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[32px] leading-[40px] font-bold text-gd-primary">{presentCount}</span>
            <span className="text-sm text-gd-outline mb-1">/ {tourists.length}</span>
          </div>
        </div>
        <div className="bg-gd-surface border border-gd-outline-var rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gd-on-surface-var">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[13px] font-medium">Active Alerts</span>
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-[32px] leading-[40px] font-bold ${alertCount > 0 ? 'text-gd-error' : 'text-gd-primary'}`}>
              {alertCount}
            </span>
            <span className="text-sm text-gd-outline mb-1">{alertCount > 0 ? 'Needs attention' : 'All clear'}</span>
          </div>
        </div>
        <div className="bg-gd-surface border border-gd-outline-var rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gd-on-surface-var">
            <MapPin className="w-5 h-5" />
            <span className="text-[13px] font-medium">Primary Zone</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-semibold text-gd-primary font-guide">Historic Center</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-gd-surface border border-gd-outline-var rounded-xl overflow-hidden shadow-sm">
        {/* Table Actions Header */}
        <div className="px-4 py-2.5 border-b border-gd-outline-var bg-gd-surface-low flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gd-outline" />
            <span className="text-[13px] font-medium text-gd-on-surface-var">Filter Group</span>
          </div>
          <button
            onClick={() => handleSort(sortField)}
            className="p-1 rounded hover:bg-gd-surface-variant text-gd-on-surface-var transition-colors"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gd-surface border-b-2 border-gd-outline-var">
                <th
                  className="p-4 text-[13px] font-semibold text-gd-on-surface-var cursor-pointer hover:text-gd-primary transition-colors"
                  onClick={() => handleSort('name')}
                >
                  Tourist Name (ID) {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[13px] font-semibold text-gd-on-surface-var">Location Zone</th>
                <th
                  className="p-4 text-[13px] font-semibold text-gd-on-surface-var cursor-pointer hover:text-gd-primary transition-colors"
                  onClick={() => handleSort('risk')}
                >
                  Risk Score {sortField === 'risk' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-4 text-[13px] font-semibold text-gd-on-surface-var cursor-pointer hover:text-gd-primary transition-colors"
                  onClick={() => handleSort('battery')}
                >
                  Battery {sortField === 'battery' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[13px] font-semibold text-gd-on-surface-var">Last Seen</th>
                <th className="p-4 text-[13px] font-semibold text-gd-on-surface-var text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gd-outline-var/50">
              {paginated.map(tourist => {
                const isAtRisk = tourist.safetyStatus === 'AT_RISK' || tourist.safetyStatus === 'EMERGENCY_SOS';
                const isCaution = tourist.safetyStatus === 'CAUTION';
                const risk = getRiskLabel(tourist.currentRiskScore);
                const location = getLocationBadge(tourist);
                const lastSeen = getLastSeen(tourist);

                return (
                  <tr
                    key={tourist.id}
                    className={`transition-colors group h-[48px] ${
                      isAtRisk
                        ? 'bg-gd-error-ctr/10 hover:bg-gd-error-ctr/20 border-l-4 border-l-gd-error'
                        : 'hover:bg-gd-surface-low'
                    }`}
                  >
                    {/* Name & ID */}
                    <td className={`px-4 py-1.5 ${isAtRisk ? 'pl-2' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-guide-mono font-bold shrink-0 ${
                          isAtRisk
                            ? 'bg-gd-error-ctr text-gd-on-error-ctr'
                            : isCaution
                              ? 'bg-gd-surface-variant text-gd-on-surface-var'
                              : 'bg-gd-primary-ctr text-gd-on-primary-ctr'
                        }`}>
                          {getInitials(tourist.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gd-on-bg">{tourist.name}</p>
                          <p className="text-[11px] font-guide-mono text-gd-outline">{tourist.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Location Zone */}
                    <td className="px-4 py-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${location.bgColor} ${location.textColor} text-[11px] font-guide-mono font-medium`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${location.dotColor} ${isAtRisk ? 'animate-pulse' : ''}`} />
                        {location.label}
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td className="px-4 py-1.5">
                      <span className={`text-[13px] font-bold flex items-center gap-1 ${risk.color}`}>
                        {tourist.currentRiskScore >= 70 && <AlertTriangle className="w-4 h-4" />}
                        {risk.label}
                      </span>
                    </td>

                    {/* Battery */}
                    <td className="px-4 py-1.5">
                      <div className={`flex items-center gap-1 ${tourist.batteryLevel <= 20 ? 'text-gd-error' : 'text-gd-on-surface-var'}`}>
                        {getBatteryIcon(tourist.batteryLevel)}
                        <span className="text-[13px] font-medium">{tourist.batteryLevel}%</span>
                      </div>
                    </td>

                    {/* Last Seen */}
                    <td className={`px-4 py-1.5 text-[13px] font-medium ${isAtRisk ? 'text-gd-error font-bold' : 'text-gd-on-surface-var'}`}>
                      {lastSeen}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-1.5 text-right">
                      <div className={`flex items-center justify-end gap-1.5 transition-opacity ${isAtRisk ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}`}>
                        <button
                          onClick={() => navigate('/guide/dashboard')}
                          className="px-2 py-1 bg-gd-primary-ctr text-gd-on-primary-ctr hover:opacity-90 rounded text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer border border-gd-outline-var"
                          title="View Live on Group Map"
                        >
                          <MapPin className="w-3.5 h-3.5 text-gd-primary" />
                          <span>Live Map</span>
                        </button>
                        <button
                          className={`p-1.5 rounded transition-colors ${isAtRisk ? 'bg-gd-surface-variant text-gd-primary hover:bg-gd-surface-dim' : 'hover:bg-gd-surface-variant text-gd-primary'}`}
                          title="Message Individual"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTourist(tourist.id)}
                          className="p-1.5 rounded hover:bg-gd-error-ctr text-gd-error transition-colors cursor-pointer"
                          title="Remove Tourist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-2.5 border-t border-gd-outline-var bg-gd-surface flex justify-between items-center">
          <span className="text-[13px] font-medium text-gd-on-surface-var">
            Showing {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 border border-gd-outline-var rounded text-gd-on-surface-var hover:bg-gd-surface-low text-[13px] font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 border border-gd-outline-var rounded text-gd-on-surface-var hover:bg-gd-surface-low text-[13px] font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <GuideRegisterModal
        isOpen={showRegisterModal}
        guide_id={guide_id}
        onClose={() => setShowRegisterModal(false)}
        onRegister={onRegisterTourist}
      />
    </div>
  );
};

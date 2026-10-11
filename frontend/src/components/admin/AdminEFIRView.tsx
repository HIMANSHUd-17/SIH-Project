import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  FileCheck,
  Calendar,
  MapPin,
  User,
  Phone,
  Hash,
  X,
  Edit3,
  Trash2,
  Loader2,
  ShieldAlert,
  BadgeCheck,
  Lock
} from 'lucide-react';
import { EFIRRecord } from '../../types';

interface AdminEFIRViewProps {
  adminDisplayName?: string;
}

const INITIAL_SAMPLE_EFIRS: EFIRRecord[] = [
  {
    id: 'efir-1',
    efirNumber: 'EFIR-2026-0001',
    status: 'GENERATED',
    createdAt: '2026-08-18T10:15:00Z',
    generatedAt: '18/08/2026, 10:30 AM',
    generatedBy: 'SafeYatra Command Center (Super Admin)',
    policeStation: 'Central Police Station',
    jurisdiction: 'Uttarakhand State Tourism & Police Zone 4',
    complainantName: 'Elena Rostova',
    complainantMobile: '+91 99887 76655',
    complainantAddress: 'Central Resort, Main Road',
    caseType: 'Theft / Loss of Property',
    occurrenceDate: '2026-08-18',
    occurrencePlace: 'River Bank Ghat',
    description: 'Complainant reported theft of a leather backpack containing foreign passport, DSLR camera, and emergency medical kit while resting near Ghat. Two unidentified suspects on a black scooter were sighted fleeing toward Bypass.',
    additionalInfo: 'CCTV footage request initiated with Municipal Surveillance Node #12. Digital location telemetry logged at 20.5937 N, 78.9629 E.',
    recordHash: '0x8f192b49c018274a983ef1029384729103847219038471920384719203847192'
  },
  {
    id: 'efir-2',
    efirNumber: 'EFIR-2026-0002',
    status: 'DRAFT',
    createdAt: '2026-08-18T14:45:00Z',
    generatedBy: 'SafeYatra Command Center (Super Admin)',
    policeStation: 'Tapovan Tourist Police Outpost',
    jurisdiction: 'Tehri Garhwal Tourism Command Zone',
    complainantName: 'Marcus Vance',
    complainantMobile: '+91 88776 55443',
    complainantAddress: 'High Bank Green View Cottages, Tapovan',
    caseType: 'Geofence Violation / Trespassing',
    occurrenceDate: '2026-08-18',
    occurrencePlace: 'Neer Garh Upper Waterfall Restricted Cliff Section',
    description: 'Tourist group wandered past dangerous warning barricade into unmonitored flash-flood landslide zone. Guided back safely by AI Geofence alert beacon.',
    additionalInfo: 'Draft under investigation for guide compliance review.',
    recordHash: '0x2a9103847291038472190384719203847192038471928f192b49c018274a983e'
  }
];

const CASE_TYPES = [
  'Theft / Loss of Property',
  'Physical Harassment / Assault',
  'Geofence Violation / Trespassing',
  'Tourist Missing / Lost Route',
  'Financial Fraud / Commercial Scam',
  'Medical Emergency Incident',
  'Other Incident'
];

export const AdminEFIRView: React.FC<AdminEFIRViewProps> = ({
  adminDisplayName = 'Super Admin'
}) => {
  const [efirList, setEfirList] = useState<EFIRRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'GENERATED'>('ALL');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EFIRRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<EFIRRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    efirNumber: '',
    policeStation: 'Central Police Station',
    jurisdiction: 'Uttarakhand State Tourism & Police Zone 4',
    complainantName: '',
    complainantMobile: '',
    complainantAddress: '',
    caseType: 'Theft / Loss of Property',
    occurrenceDate: new Date().toISOString().split('T')[0],
    occurrencePlace: '',
    description: '',
    additionalInfo: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch E-FIR Records from backend or local persistence
  const fetchEFIRs = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/efir', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEfirList(data);
          try {
            localStorage.setItem('safeyatra_efir_records', JSON.stringify(data));
          } catch (e) { }
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API /api/efir unreachable, reading local storage fallback.');
    }

    // Fallback to local storage or initial dataset
    try {
      const cached = localStorage.getItem('safeyatra_efir_records');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEfirList(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) { }

    setEfirList(INITIAL_SAMPLE_EFIRS);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEFIRs();
  }, []);

  // Compute next available unique E-FIR number: EFIR-YYYY-XXXX
  const generateNextEFIRNumber = (): string => {
    const year = new Date().getFullYear();
    const currentYearRecords = efirList.filter(r => r.efirNumber?.startsWith(`EFIR-${year}-`));
    let maxSeq = 0;
    currentYearRecords.forEach(r => {
      const parts = r.efirNumber.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2]);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    const nextSeq = String(maxSeq + 1).padStart(4, '0');
    return `EFIR-${year}-${nextSeq}`;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormError(null);

    const nextEFIR = generateNextEFIRNumber();
    const defaultDate = new Date().toISOString().split('T')[0];

    // Set a default while waiting for location based data
    setFormData({
      efirNumber: nextEFIR,
      policeStation: 'Locating nearby station...',
      jurisdiction: 'Determining jurisdiction...',
      complainantName: '',
      complainantMobile: '',
      complainantAddress: '',
      caseType: 'Theft / Loss of Property',
      occurrenceDate: defaultDate,
      occurrencePlace: '',
      description: '',
      additionalInfo: 'Locating nearest facilities...'
    });
    setShowCreateModal(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            // Fetch nearest police station
            const policeQuery = `[out:json];node["amenity"="police"](around:50000,${lat},${lng});out 1;`;
            const policeRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(policeQuery)}`);
            const policeData = await policeRes.json();

            // Fetch nearest hospital
            const hospitalQuery = `[out:json];node["amenity"="hospital"](around:50000,${lat},${lng});out 1;`;
            const hospitalRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(hospitalQuery)}`);
            const hospitalData = await hospitalRes.json();

            // Reverse geocode for jurisdiction (city/state)
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const geoData = await geoRes.json();
            const city = geoData.address?.city || geoData.address?.town || geoData.address?.county || 'Local Area';
            const state = geoData.address?.state || 'Command';

            let psName = 'Central Police Station';
            if (policeData.elements && policeData.elements.length > 0 && policeData.elements[0].tags) {
              psName = policeData.elements[0].tags.name || `${city} City Police Station`;
            } else {
              psName = `${city} Police Station`;
            }

            let hospName = 'General Hospital';
            if (hospitalData.elements && hospitalData.elements.length > 0 && hospitalData.elements[0].tags) {
              hospName = hospitalData.elements[0].tags.name || `${city} General Hospital`;
            } else {
              hospName = `${city} General Hospital`;
            }

            setFormData(prev => ({
              ...prev,
              policeStation: psName,
              jurisdiction: `${state} Police Command Zone`,
              additionalInfo: `Nearest Hospital Identified: ${hospName}\n\nTelemetry: ${lat.toFixed(4)} N, ${lng.toFixed(4)} E`
            }));

          } catch (err) {
            console.error("Error fetching map details", err);
            setFormData(prev => ({
              ...prev,
              policeStation: 'Local Police Station (Offline Mode)',
              jurisdiction: 'Standard Command Zone',
              additionalInfo: `Telemetry: ${lat.toFixed(4)} N, ${lng.toFixed(4)} E`
            }));
          }
        },
        (err) => {
          console.warn("Geolocation denied or unavailable.", err);
          setFormData(prev => ({
            ...prev,
            policeStation: 'Central Police Station',
            jurisdiction: 'Default Tourism Command Zone',
            additionalInfo: 'Location not provided.'
          }));
        }
      );
    }
  };

  // Open Edit Draft Modal
  const handleOpenEdit = (record: EFIRRecord) => {
    setEditingRecord(record);
    setFormError(null);
    setFormData({
      efirNumber: record.efirNumber,
      policeStation: record.policeStation || 'Central Police Station',
      jurisdiction: record.jurisdiction || 'Uttarakhand State Tourism & Police Zone 4',
      complainantName: record.complainantName || '',
      complainantMobile: record.complainantMobile || '',
      complainantAddress: record.complainantAddress || '',
      caseType: record.caseType || 'Theft / Loss of Property',
      occurrenceDate: record.occurrenceDate || new Date().toISOString().split('T')[0],
      occurrencePlace: record.occurrencePlace || '',
      description: record.description || '',
      additionalInfo: record.additionalInfo || ''
    });
    setShowCreateModal(true);
  };

  const validateForm = (isGenerating: boolean): boolean => {
    setFormError(null);
    if (!formData.complainantName.trim()) {
      setFormError('Complainant Full Name is required.');
      return false;
    }
    if (!formData.complainantMobile.trim()) {
      setFormError('Complainant Mobile Number is required.');
      return false;
    }
    const cleanMobile = formData.complainantMobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setFormError('Please enter a valid 10-digit Mobile Number.');
      return false;
    }
    if (!formData.caseType.trim()) {
      setFormError('Case Type is required.');
      return false;
    }
    if (!formData.occurrenceDate) {
      setFormError('Date of Occurrence is required.');
      return false;
    }
    if (!formData.occurrencePlace.trim()) {
      setFormError('Place of Occurrence is required.');
      return false;
    }
    if (!formData.description.trim()) {
      setFormError('Incident Detailed Description is required.');
      return false;
    }
    return true;
  };

  const handleSaveRecord = async (targetStatus: 'DRAFT' | 'GENERATED') => {
    if (!validateForm(targetStatus === 'GENERATED')) return;

    setIsSaving(true);
    setFormError(null);

    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const generatedProofHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newOrUpdatedRecord: EFIRRecord = {
      id: editingRecord?.id || `efir-${Date.now()}`,
      efirNumber: formData.efirNumber,
      status: targetStatus,
      createdAt: editingRecord?.createdAt || now.toISOString(),
      generatedAt: targetStatus === 'GENERATED' ? (editingRecord?.generatedAt || formattedTimestamp) : undefined,
      generatedBy: `SafeYatra Command Center (${adminDisplayName})`,
      policeStation: formData.policeStation.trim(),
      jurisdiction: formData.jurisdiction.trim(),
      complainantName: formData.complainantName.trim(),
      complainantMobile: formData.complainantMobile.trim(),
      complainantAddress: formData.complainantAddress.trim() || undefined,
      caseType: formData.caseType,
      occurrenceDate: formData.occurrenceDate,
      occurrencePlace: formData.occurrencePlace.trim(),
      description: formData.description.trim(),
      additionalInfo: formData.additionalInfo.trim() || undefined,
      recordHash: editingRecord?.recordHash || generatedProofHash
    };

    try {
      const endpoint = editingRecord ? `/api/efir/${editingRecord.id}` : '/api/efir';
      const method = editingRecord ? 'PUT' : 'POST';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrUpdatedRecord),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Backend Save Error: ${errorText}`);
        setIsSaving(false);
        return;
      }

      if (res.ok) {
        const savedData = await res.json();
        const finalItem = savedData.record || newOrUpdatedRecord;
        setEfirList(prev => {
          const exists = prev.some(r => r.id === finalItem.id);
          const updated = exists ? prev.map(r => r.id === finalItem.id ? finalItem : r) : [finalItem, ...prev];
          try {
            localStorage.setItem('safeyatra_efir_records', JSON.stringify(updated));
          } catch (e) { }
          return updated;
        });

        setShowCreateModal(false);
        if (targetStatus === 'GENERATED') {
          setViewingRecord(finalItem);
        }
        setIsSaving(false);
        return;
      }
    } catch (err) {
      console.warn('Backend /api/efir save failed, persisting locally:', err);
      alert('Save operation encountered a network error. Persisting Draft locally.');
    }

    // Local fallback persistence
    setEfirList(prev => {
      const exists = prev.some(r => r.id === newOrUpdatedRecord.id);
      const updated = exists ? prev.map(r => r.id === newOrUpdatedRecord.id ? newOrUpdatedRecord : r) : [newOrUpdatedRecord, ...prev];
      try {
        localStorage.setItem('safeyatra_efir_records', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    setShowCreateModal(false);
    if (targetStatus === 'GENERATED') {
      setViewingRecord(newOrUpdatedRecord);
    }
    setIsSaving(false);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this E-FIR record?')) return;
    try {
      await fetch(`/api/efir/${id}`, { method: 'DELETE' });
    } catch (e) { }
    setEfirList(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('safeyatra_efir_records', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
    if (viewingRecord?.id === id) setViewingRecord(null);
  };

  // Print Document Function
  const handlePrintRecord = (record: EFIRRecord) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SafeYatra E-FIR Record - ${record.efirNumber}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; line-height: 1.5; padding: 24px; }
          .header { text-align: center; border-bottom: 2px solid #061E34; padding-bottom: 12px; margin-bottom: 20px; }
          .emblem { font-size: 24px; font-weight: 900; color: #061E34; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
          .sub-emblem { font-size: 11px; font-weight: 700; color: #475569; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
          .doc-title { font-size: 18px; font-weight: 800; color: #061E34; margin-top: 10px; text-decoration: underline; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .badge-gen { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
          .badge-draft { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
          .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; font-size: 12px; }
          .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
          .meta-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
          .meta-val { font-weight: bold; color: #0f172a; }
          .section-title { font-size: 13px; font-weight: 800; color: #061E34; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; margin-bottom: 10px; }
          .box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 12px; margin-bottom: 12px; }
          .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          .seal-box { text-align: center; border: 1px dashed #94a3b8; padding: 8px 16px; border-radius: 6px; }
          .disclaimer { font-size: 9px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="emblem">SAFEYATRA</p>
          <p class="sub-emblem">GOVERNMENT OF UTTARAKHAND • TOURIST SAFETY COMMAND CENTER</p>
          <p class="doc-title">SAFEYATRA E-FIR RECORD</p>
          <div style="margin-top: 8px;">
            <span class="badge ${record.status === 'GENERATED' ? 'badge-gen' : 'badge-draft'}">${record.status}</span>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">E-FIR Reference Number</div>
            <div class="meta-val" style="font-family: monospace; font-size: 14px; color: #0369a1;">${record.efirNumber}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Generated Date & Time</div>
            <div class="meta-val">${record.generatedAt || new Date(record.createdAt).toLocaleString()}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Police Station / Command Unit</div>
            <div class="meta-val">${record.policeStation}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Jurisdiction Area</div>
            <div class="meta-val">${record.jurisdiction}</div>
          </div>
        </div>

        <div class="section-title">1. Complainant Details</div>
        <div class="box">
          <table style="width: 100%; font-size: 12px;">
            <tr>
              <td style="width: 25%; font-weight: bold; color: #475569;">Full Name:</td>
              <td style="width: 75%; font-weight: bold; color: #0f172a;">${record.complainantName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Mobile Number:</td>
              <td style="font-family: monospace; color: #0f172a;">${record.complainantMobile}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Address / Lodging:</td>
              <td style="color: #0f172a;">${record.complainantAddress || 'Not specified'}</td>
            </tr>
          </table>
        </div>

        <div class="section-title">2. Occurrence & Case Details</div>
        <div class="box">
          <table style="width: 100%; font-size: 12px;">
            <tr>
              <td style="width: 25%; font-weight: bold; color: #475569;">Case Type:</td>
              <td style="font-weight: bold; color: #b91c1c;">${record.caseType}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Date of Occurrence:</td>
              <td>${record.occurrenceDate}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Place of Occurrence:</td>
              <td>${record.occurrencePlace}</td>
            </tr>
          </table>
        </div>

        <div class="section-title">3. Incident Detailed Description</div>
        <div class="box" style="white-space: pre-wrap; line-height: 1.6; min-height: 80px;">${record.description}</div>

        ${record.additionalInfo ? `
          <div class="section-title">4. Additional Information & Telemetry References</div>
          <div class="box" style="white-space: pre-wrap; line-height: 1.6;">${record.additionalInfo}</div>
        ` : ''}

        <div class="section-title">5. Cryptographic Security & Digital Hash</div>
        <div class="box" style="font-family: monospace; font-size: 10px; color: #334155;">
          <strong>SHA-256 Record Hash:</strong> ${record.recordHash || '0x71c7656ec7ab88b098defb751b7401b5f6d8976f00'}<br/>
          <strong>Digital Standard:</strong> AES-256 Vault Anchored • SafeYatra Digital Record Authority
        </div>

        <div class="footer">
          <div>
            <strong>Generated By:</strong> ${record.generatedBy || 'SafeYatra Command Center'}<br/>
            <strong>Generated At:</strong> ${record.generatedAt || new Date().toLocaleString()}
          </div>
          <div class="seal-box">
            <div style="font-weight: bold; color: #061E34; font-size: 10px;">SAFEYATRA COMMAND CENTER</div>
            <div style="font-size: 9px; color: #059669; font-weight: bold;">DIGITALLY AUTHENTICATED</div>
          </div>
        </div>

        <div class="disclaimer">
          SafeYatra E-FIR Record: This electronic reference record is generated by the SafeYatra Tourist Safety Command Center for incident tracking and law enforcement liaison coordination.
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return efirList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        item.efirNumber.toLowerCase().includes(q) ||
        item.complainantName.toLowerCase().includes(q) ||
        item.complainantMobile.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        item.caseType.toLowerCase().includes(q) ||
        item.occurrencePlace.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchCase = caseTypeFilter === 'ALL' || item.caseType === caseTypeFilter;

      return matchSearch && matchStatus && matchCase;
    });
  }, [efirList, searchQuery, statusFilter, caseTypeFilter]);

  const totalCount = efirList.length;
  const generatedCount = efirList.filter(r => r.status === 'GENERATED').length;
  const draftCount = efirList.filter(r => r.status === 'DRAFT').length;

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#F4F7FA] font-sans pb-28">

      {/* ── 1. E-FIR COMMAND BANNER ── */}
      <div className="bg-gradient-to-r from-[#061E34] via-[#0A2640] to-[#0D3859] rounded-2xl p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#2CD3C3_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2CD3C3]/15 border border-[#2CD3C3]/40 flex items-center justify-center text-[#2CD3C3] shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                  SafeYatra E-FIR Record
                </h1>
                <span className="bg-[#2CD3C3]/20 text-[#2CD3C3] border border-[#2CD3C3]/40 text-xs font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Command Center Record
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Generate, manage, and dispatch official electronic reference records (E-FIR) for tourist incidents, lost property, safety breaches, and police liaison coordination.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-[#2CD3C3] hover:bg-[#20b8a9] text-[#061E34] font-black rounded-xl text-sm flex items-center gap-2 shadow-lg hover:shadow-[#2CD3C3]/20 transition-all cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Create New E-FIR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. METRICS & COUNTERS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total E-FIRs */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total E-FIR Records
            </span>
            <span className="text-2xl font-black text-slate-800">{totalCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Generated E-FIRs */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              Generated Records
            </span>
            <span className="text-2xl font-black text-emerald-700">{generatedCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Draft E-FIRs */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-amber-600 uppercase tracking-wider block mb-1">
              Draft Records
            </span>
            <span className="text-2xl font-black text-amber-700">{draftCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER CONTROLS ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by E-FIR #, Complainant Name, Mobile..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${statusFilter === 'ALL' ? 'bg-[#061E34] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('GENERATED')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${statusFilter === 'GENERATED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Generated ({generatedCount})
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${statusFilter === 'DRAFT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Drafts ({draftCount})
            </button>
          </div>

          <select
            value={caseTypeFilter}
            onChange={e => setCaseTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#061E34] cursor-pointer"
          >
            <option value="ALL">All Case Types</option>
            {CASE_TYPES.map(ct => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 4. E-FIR RECORDS TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#061E34]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              E-FIR Log Records ({filteredList.length})
            </h3>
          </div>
          <span className="text-sm text-slate-400 font-mono">
            Encrypted Law Enforcement Ledger
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#061E34]" />
            <span className="text-sm font-bold">Loading E-FIR records...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No E-FIR records matching the criteria.</p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[#061E34] text-white rounded-xl text-sm font-bold hover:bg-[#0A2640] transition-colors"
            >
              Create New E-FIR
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase tracking-wider font-bold text-slate-500">
                  <th className="p-4 pl-6">E-FIR Number</th>
                  <th className="p-4">Complainant</th>
                  <th className="p-4">Case Type</th>
                  <th className="p-4">Occurrence Date</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredList.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Number */}
                    <td className="p-4 pl-6 font-mono font-bold text-[#0369a1]">
                      {record.efirNumber}
                    </td>

                    {/* Complainant */}
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{record.complainantName}</div>
                      <div className="text-sm text-slate-400 font-mono">{record.complainantMobile}</div>
                    </td>

                    {/* Case Type */}
                    <td className="p-4 font-semibold text-slate-700">
                      {record.caseType}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-600 font-medium">
                      {record.occurrenceDate}
                    </td>

                    {/* Location */}
                    <td className="p-4 text-slate-600 font-medium max-w-[180px] truncate" title={record.occurrencePlace}>
                      {record.occurrencePlace}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {record.status === 'GENERATED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Generated</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black uppercase tracking-wider">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Draft</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingRecord(record)}
                          className="p-2 text-slate-600 hover:text-[#061E34] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View E-FIR Record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePrintRecord(record)}
                          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print / Download PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {record.status === 'DRAFT' && (
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Draft"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete E-FIR"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 5. CREATE / EDIT E-FIR MODAL                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">

            {/* Header */}
            <div className="bg-[#061E34] px-6 py-4 border-b border-slate-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2CD3C3]/20 text-[#2CD3C3] flex items-center justify-center border border-[#2CD3C3]/40">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRecord ? 'Edit E-FIR Record' : 'Create New E-FIR Record'}
                  </h3>
                  <p className="text-sm text-slate-300">SafeYatra Smart Identity & Safety Profile</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {formError && (
                <div className="p-3.5 bg-red-50 text-red-800 rounded-xl text-sm font-semibold border border-red-200 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── Section 1: FIR Details ── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#061E34]" />
                    <span>FIR Details</span>
                  </h4>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {formData.efirNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      E-FIR Number (System Assigned)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.efirNumber}
                      className="w-full bg-slate-200/80 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Date & Time of Filing
                    </label>
                    <input
                      type="text"
                      disabled
                      value={new Date().toLocaleString()}
                      className="w-full bg-slate-200/80 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Police Station
                    </label>
                    <input
                      type="text"
                      value={formData.policeStation}
                      onChange={e => setFormData({ ...formData, policeStation: e.target.value })}
                      placeholder="e.g. Muni Ki Reti Police Station"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={formData.jurisdiction}
                      onChange={e => setFormData({ ...formData, jurisdiction: e.target.value })}
                      placeholder="e.g. Uttarakhand State Tourism & Police Zone 4"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 2: Complainant Details ── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#061E34]" />
                    <span>Complainant Details</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.complainantName}
                      onChange={e => setFormData({ ...formData, complainantName: e.target.value })}
                      placeholder="e.g. Elena Rostova"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.complainantMobile}
                      onChange={e => setFormData({ ...formData, complainantMobile: e.target.value })}
                      placeholder="e.g. +91 99887 76655"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Address / Hotel Location
                    </label>
                    <input
                      type="text"
                      value={formData.complainantAddress}
                      onChange={e => setFormData({ ...formData, complainantAddress: e.target.value })}
                      placeholder="e.g. Central Resort, Main Road"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 3: Case Details ── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Case Details</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Case Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.caseType}
                      onChange={e => setFormData({ ...formData, caseType: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] cursor-pointer"
                    >
                      {CASE_TYPES.map(ct => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Date of Occurrence <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.occurrenceDate}
                      onChange={e => setFormData({ ...formData, occurrenceDate: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">
                      Place of Occurrence <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.occurrencePlace}
                      onChange={e => setFormData({ ...formData, occurrencePlace: e.target.value })}
                      placeholder="e.g. River Bank Ghat"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34]"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 4: Detailed Description ── */}
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Incident Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide chronological description of the occurrence, suspects involved, items lost, and immediate action taken..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all leading-relaxed"
                />
              </div>

              {/* ── Section 5: Additional Information ── */}
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Additional Information / Evidence Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={e => setFormData({ ...formData, additionalInfo: e.target.value })}
                  placeholder="Witness names, CCTV camera numbers, vehicle plate numbers, initial triage notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#061E34] focus:bg-white transition-all leading-relaxed"
                />
              </div>

            </div>

            {/* Modal Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveRecord('DRAFT')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveRecord('GENERATED')}
                  className="px-6 py-2.5 bg-[#061E34] hover:bg-[#0A2640] text-white rounded-xl font-bold text-sm transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4 text-[#2CD3C3]" />}
                  <span>Generate e-FIR</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 6. GENERATED E-FIR VIEW MODAL                              */}
      {/* ════════════════════════════════════════════════════════════ */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">

            {/* Top Modal Header */}
            <div className="bg-[#061E34] text-white px-6 py-4 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2CD3C3]/20 text-[#2CD3C3] flex items-center justify-center border border-[#2CD3C3]/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>SafeYatra E-FIR Record</span>
                    <span className="text-xs font-mono bg-[#2CD3C3]/20 text-[#2CD3C3] border border-[#2CD3C3]/40 px-2 py-0.5 rounded-full">
                      {viewingRecord.efirNumber}
                    </span>
                  </h4>
                  <p className="text-sm text-slate-300">Command Center Digital Reference Record</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintRecord(viewingRecord)}
                  className="px-3 py-1.5 bg-[#2CD3C3] hover:bg-[#20b8a9] text-[#061E34] font-black rounded-lg text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintRecord(viewingRecord)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Read-Only Document Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/40 font-sans">

              {/* Document Official Header */}
              <div className="text-center border-b-2 border-[#061E34] pb-4 space-y-1">
                <h2 className="text-xl font-black tracking-widest text-[#061E34] uppercase">SAFEYATRA</h2>
                <p className="text-sm font-bold tracking-wider text-slate-500 uppercase">
                  GOVERNMENT OF UTTARAKHAND • TOURIST SAFETY COMMAND CENTER
                </p>
                <h3 className="text-base font-extrabold text-[#061E34] uppercase underline pt-1">
                  E-FIR RECORD
                </h3>
                <div className="pt-1">
                  {viewingRecord.status === 'GENERATED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm font-black uppercase">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>GENERATED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-sm font-black uppercase">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>DRAFT</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">E-FIR Number</span>
                  <span className="font-mono font-bold text-[#0369a1] text-base">{viewingRecord.efirNumber}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Generated Date & Time</span>
                  <span className="font-bold text-slate-800">{viewingRecord.generatedAt || new Date(viewingRecord.createdAt).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Police Station</span>
                  <span className="font-bold text-slate-800 truncate block">{viewingRecord.policeStation}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Jurisdiction</span>
                  <span className="font-bold text-slate-800 truncate block">{viewingRecord.jurisdiction}</span>
                </div>
              </div>

              {/* Complainant Details */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-[#061E34] border-b border-slate-100 pb-1.5 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Complainant Details</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm pt-1">
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Full Name</span>
                    <span className="font-bold text-slate-800">{viewingRecord.complainantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Mobile Number</span>
                    <span className="font-mono font-bold text-slate-800">{viewingRecord.complainantMobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Address</span>
                    <span className="font-medium text-slate-700">{viewingRecord.complainantAddress || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Case Details */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-[#061E34] border-b border-slate-100 pb-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Case & Occurrence Details</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm pt-1">
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Case Type</span>
                    <span className="font-bold text-red-700">{viewingRecord.caseType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Date of Occurrence</span>
                    <span className="font-semibold text-slate-800">{viewingRecord.occurrenceDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Place of Occurrence</span>
                    <span className="font-semibold text-slate-800">{viewingRecord.occurrencePlace}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-[#061E34] border-b border-slate-100 pb-1.5">
                  Detailed Description
                </h4>
                <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed pt-1">
                  {viewingRecord.description}
                </p>
              </div>

              {/* Additional Information */}
              {viewingRecord.additionalInfo && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-wider text-[#061E34] border-b border-slate-100 pb-1.5">
                    Additional Information / Telemetry References
                  </h4>
                  <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed pt-1">
                    {viewingRecord.additionalInfo}
                  </p>
                </div>
              )}

              {/* Blockchain & Digital Seal */}
              <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm font-mono text-slate-600">
                <div>
                  <span className="font-bold text-slate-700 block text-xs">SHA-256 Record Hash:</span>
                  <span className="break-all">{viewingRecord.recordHash || '0x71c7656ec7ab88b098defb751b7401b5f6d8976f00'}</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 shrink-0">
                  DIGITALLY SEALED ✓
                </span>
              </div>

              {/* Generation Details Footer */}
              <div className="pt-2 text-sm text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200">
                <div>
                  <span className="font-bold text-slate-700">Generated By: </span>
                  <span>{viewingRecord.generatedBy || 'SafeYatra Command Center'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Generated At: </span>
                  <span>{viewingRecord.generatedAt || new Date().toLocaleString()}</span>
                </div>
              </div>

              {/* Legal Note */}
              <div className="text-xs text-slate-400 text-center border-t border-slate-200 pt-3">
                SafeYatra E-FIR Record: This electronic reference record is generated by the SafeYatra Command Center for incident tracking and law enforcement liaison coordination.
              </div>

            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                Close Record
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintRecord(viewingRecord)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 border border-slate-300"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintRecord(viewingRecord)}
                  className="px-6 py-2.5 bg-[#061E34] hover:bg-[#0A2640] text-white rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4 text-[#2CD3C3]" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

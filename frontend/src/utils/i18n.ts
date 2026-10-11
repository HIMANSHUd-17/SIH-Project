// ─────────────────────────────────────────────────────────────
// SafeYatra Centralized i18n System
// Pure React Context — no external i18n framework
// Add a new language by adding its key to SUPPORTED_LANGUAGES
// and a matching entry in TRANSLATIONS.
// ─────────────────────────────────────────────────────────────

export type LanguageCode =
  | 'en' | 'hi' | 'mr' | 'bn' | 'gu'
  | 'ta' | 'te' | 'kn' | 'ml' | 'pa'
  | 'or' | 'as' | 'ur';

export interface LanguageMeta {
  code: LanguageCode;
  label: string;       // Native script name
  labelEn: string;     // English name
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English',    labelEn: 'English',    dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी',       labelEn: 'Hindi',      dir: 'ltr' },
  { code: 'mr', label: 'मराठी',       labelEn: 'Marathi',    dir: 'ltr' },
  { code: 'bn', label: 'বাংলা',       labelEn: 'Bengali',    dir: 'ltr' },
  { code: 'gu', label: 'ગુજરાતી',     labelEn: 'Gujarati',   dir: 'ltr' },
  { code: 'ta', label: 'தமிழ்',       labelEn: 'Tamil',      dir: 'ltr' },
  { code: 'te', label: 'తెలుగు',      labelEn: 'Telugu',     dir: 'ltr' },
  { code: 'kn', label: 'ಕನ್ನಡ',       labelEn: 'Kannada',    dir: 'ltr' },
  { code: 'ml', label: 'മലയാളം',     labelEn: 'Malayalam',  dir: 'ltr' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ',      labelEn: 'Punjabi',    dir: 'ltr' },
  { code: 'or', label: 'ଓଡ଼ିଆ',       labelEn: 'Odia',       dir: 'ltr' },
  { code: 'as', label: 'অসমীয়া',     labelEn: 'Assamese',   dir: 'ltr' },
  { code: 'ur', label: 'اردو',        labelEn: 'Urdu',       dir: 'rtl' },
];


// ─────────────────────────────────────────────────────────────
// Translation keys type — add new keys here as the app grows
// ─────────────────────────────────────────────────────────────
export type TranslationKey =
  // ── Common / Shared ──────────────────────────────────────
  | 'app.name' | 'app.tagline'
  | 'common.save' | 'common.cancel' | 'common.close' | 'common.edit'
  | 'common.logout' | 'common.back' | 'common.submit' | 'common.loading'
  | 'common.online' | 'common.live' | 'common.today' | 'common.justNow'
  | 'common.settings' | 'common.profile' | 'common.notifications'
  | 'common.language' | 'common.interfaceLanguage' | 'common.saveClose'
  | 'common.version' | 'common.role' | 'common.session' | 'common.active'
  | 'common.search' | 'common.filter' | 'common.actions' | 'common.status'
  | 'common.name' | 'common.email' | 'common.mobile' | 'common.age'
  | 'common.city' | 'common.nationality' | 'common.bloodGroup'
  | 'common.emergencyContact' | 'common.password' | 'common.error'

  // ── Navigation ────────────────────────────────────────────
  | 'nav.dashboard' | 'nav.messages' | 'nav.report' | 'nav.profile'
  | 'nav.overview' | 'nav.myGroup' | 'nav.chat' | 'nav.tourists'
  | 'nav.inbox' | 'nav.guides' | 'nav.exitAdmin' | 'nav.exitGuide'

  // ── Auth / Login ──────────────────────────────────────────
  | 'auth.adminLogin' | 'auth.guideLogin' | 'auth.username'
  | 'auth.password' | 'auth.loginBtn' | 'auth.backHome'
  | 'auth.invalidCreds' | 'auth.serverError' | 'auth.guideId'
  | 'auth.guideIdPlaceholder' | 'auth.invalidGuideCreds'

  // ── Tourist Shell / Nav ───────────────────────────────────
  | 'tourist.safety' | 'tourist.namaskar' | 'tourist.liveGpsActive'
  | 'tourist.enableGps' | 'tourist.gpsLive' | 'tourist.viewProfile'
  | 'tourist.idVerified' | 'tourist.switchAccount' | 'tourist.logOut'

  // ── Tourist Dashboard ─────────────────────────────────────
  | 'tourist.liveSafetyMap' | 'tourist.enableLiveGps' | 'tourist.riskScore'
  | 'tourist.battery' | 'tourist.assignedGuide' | 'tourist.tripSchedule'
  | 'tourist.safetyStatus' | 'tourist.calculatedRisk' | 'tourist.recenterMap'
  | 'tourist.sos.heading' | 'tourist.sos.description' | 'tourist.sos.trigger'
  | 'tourist.sos.requesting' | 'tourist.sos.micActive' | 'tourist.sos.micDenied'
  | 'tourist.sos.transmitting' | 'tourist.sos.dispatched' | 'tourist.sos.countdown'
  | 'tourist.sos.micGranted' | 'tourist.sos.micFallback'

  // ── Tourist GPS Banner ────────────────────────────────────
  | 'gps.liveActive' | 'gps.copy' | 'gps.copied' | 'gps.recenter'
  | 'gps.denied' | 'gps.deniedMsg' | 'gps.howToEnable' | 'gps.hideInstructions'
  | 'gps.retryPermission' | 'gps.enableTracking' | 'gps.enableDesc'
  | 'gps.enableBtn'

  // ── GPS Permission Modal ──────────────────────────────────
  | 'gpsModal.title' | 'gpsModal.subtitle'
  | 'gpsModal.geofence' | 'gpsModal.geofenceDesc'
  | 'gpsModal.sos' | 'gpsModal.sosDesc'
  | 'gpsModal.guide' | 'gpsModal.guideDesc'
  | 'gpsModal.allow' | 'gpsModal.skip' | 'gpsModal.privacy'

  // ── Messages ──────────────────────────────────────────────
  | 'messages.inbox' | 'messages.adminDesk' | 'messages.typeMessage'
  | 'messages.safetyNominal' | 'messages.tourGuide'

  // ── Profile ───────────────────────────────────────────────
  | 'profile.title' | 'profile.verifiedRecord' | 'profile.editingMode'
  | 'profile.editBtn' | 'profile.cancelEdit' | 'profile.saveChanges'
  | 'profile.fullName' | 'profile.emailAddress' | 'profile.mobileNumber'
  | 'profile.country' | 'profile.bloodGroupLabel' | 'profile.safetyTelemetry'
  | 'profile.safetyStatusLabel' | 'profile.riskIndex' | 'profile.deviceBattery'
  | 'profile.currentGps' | 'profile.blockchainAnchoring' | 'profile.polygonDid'
  | 'profile.zkpHash' | 'profile.onChainVerified' | 'profile.teamMembership'
  | 'profile.updateSuccess' | 'profile.soloTourist' | 'profile.teamTourist'
  | 'profile.guideLabel' | 'profile.licenseNumber' | 'profile.bio'

  // ── Report Incident ───────────────────────────────────────
  | 'report.title' | 'report.subtitle' | 'report.whatHappened'
  | 'report.descPlaceholder' | 'report.severity' | 'report.low'
  | 'report.medium' | 'report.high' | 'report.sentTo' | 'report.adminGuide'
  | 'report.submitBtn' | 'report.photoEvidence' | 'report.tapCamera'
  | 'report.photoInstruction' | 'report.gpsAttached' | 'report.realtimeLocation'
  | 'report.successToast' | 'report.critical'

  // ── Registration ──────────────────────────────────────────
  | 'reg.title' | 'reg.subtitle' | 'reg.selectType'
  | 'reg.solo' | 'reg.team' | 'reg.teamName' | 'reg.teamNamePlaceholder'
  | 'reg.leaderInfo' | 'reg.soloInfo' | 'reg.addMember' | 'reg.removeMember'
  | 'reg.success' | 'reg.successSubtitle' | 'reg.yourId' | 'reg.proceedSignIn'
  | 'reg.groupId' | 'reg.teamLeader' | 'reg.teamMembers'
  | 'reg.err.teamName' | 'reg.err.fullName' | 'reg.err.leaderName'
  | 'reg.err.email' | 'reg.err.emailInvalid' | 'reg.err.mobile'
  | 'reg.err.mobileInvalid' | 'reg.err.lat' | 'reg.err.lng'
  | 'reg.err.minMember' | 'reg.err.memberName' | 'reg.err.memberMobile'
  | 'reg.err.memberAge' | 'reg.err.memberNationality' | 'reg.err.memberCity'
  | 'reg.err.nationality' | 'reg.err.city' | 'reg.err.age' | 'reg.err.ageInvalid'

  // ── Guide ─────────────────────────────────────────────────
  | 'guide.portal' | 'guide.loadingPortal' | 'guide.overview' | 'guide.myGroup'
  | 'guide.groupDetails' | 'guide.groupSubtitle' | 'guide.addTourist'
  | 'guide.broadcastGroup' | 'guide.presentMembers' | 'guide.activeAlerts'
  | 'guide.primaryZone' | 'guide.needsAttention' | 'guide.allClear'
  | 'guide.touristName' | 'guide.locationZone' | 'guide.riskScore'
  | 'guide.lastSeen' | 'guide.filterGroup' | 'guide.pagePrev' | 'guide.pageNext'
  | 'guide.emergencyIncidents' | 'guide.recentMessages' | 'guide.systemStatus'
  | 'guide.noNotifications' | 'guide.safetyCore' | 'guide.geofencesActive'
  | 'guide.openChat' | 'guide.sosAlerts' | 'guide.sosAlertsDesc'
  | 'guide.chatAlerts' | 'guide.chatAlertsDesc' | 'guide.alertSounds'
  | 'guide.alertSoundsDesc' | 'guide.saveClose' | 'guide.broadcast'
  | 'guide.broadcastSent' | 'guide.groupBroadcast' | 'guide.support'
  | 'guide.supportSubject' | 'guide.supportMessage' | 'guide.submitSupport'
  | 'guide.supportSuccess' | 'guide.criticalAlert'
  | 'guide.groupStatus' | 'guide.groupStatusSubtitle' | 'guide.syncNow'
  | 'guide.liveGroupMap' | 'guide.recentAlerts' | 'guide.chatComms'
  | 'guide.chatSubtitle' | 'guide.searchConversations' | 'guide.typeMessage'
  | 'guide.templates' | 'guide.noMessages' | 'guide.stayWithGroup'
  | 'guide.leavingIn5' | 'guide.meetPlaza' | 'guide.areYouOkay'
  | 'guide.checkSurroundings' | 'guide.groupCheck'

  // ── Admin ─────────────────────────────────────────────────
  | 'admin.panel' | 'admin.commandCenter' | 'admin.touristDirectory'
  | 'admin.incidentInbox' | 'admin.guideManagement' | 'admin.systemNominal'
  | 'admin.locateTourist' | 'admin.realTimeOverview' | 'admin.totalMonitored'
  | 'admin.activeSOS' | 'admin.pending' | 'admin.recentAlerts' | 'admin.viewAll'
  | 'admin.emergencyDispatch' | 'admin.dispatchUnit' | 'admin.resolveIncident'
  | 'admin.resolved' | 'admin.directComm' | 'admin.connectionStable'
  | 'admin.sosTriggered' | 'admin.helpOnWay' | 'admin.stayWhere'
  | 'admin.areYouInjured' | 'admin.typeMessage' | 'admin.subjectId'
  | 'admin.lastKnownLoc' | 'admin.assignUnit' | 'admin.liveFeed'
  | 'admin.active' | 'admin.allStatuses' | 'admin.safeOnly' | 'admin.caution'
  | 'admin.atRisk' | 'admin.showing' | 'admin.createGuide' | 'admin.guideId'
  | 'admin.guideName' | 'admin.guideMobile' | 'admin.guideLicense' | 'admin.guideStatus'
  | 'admin.noGuides' | 'admin.notifPrefs' | 'admin.notifSOS' | 'admin.notifIncidents'
  | 'admin.notifMessages' | 'admin.notifSafety' | 'admin.systemInfo'
  | 'admin.signOut' | 'admin.adminProfile' | 'admin.accountInfo'
  | 'admin.displayName' | 'admin.saveDisplayName' | 'admin.systemAdmin'
  | 'admin.showingOf' | 'admin.inspectTourist' | 'admin.closeInspector'
  | 'admin.selectLanguage' | 'admin.touristInspector'

  // ── Safety Status Labels ──────────────────────────────────
  | 'status.safe' | 'status.caution' | 'status.atRisk' | 'status.sos'
  | 'status.restricted' | 'status.outOfBounds' | 'status.edgeOfZone'

  // ── Severity ──────────────────────────────────────────────
  | 'severity.low' | 'severity.medium' | 'severity.high' | 'severity.critical'

  // ── Settings ──────────────────────────────────────────────
  | 'settings.title' | 'settings.languageLabel' | 'settings.selectLanguage'
  | 'settings.saved' | 'settings.saveSettings' | 'settings.notifPrefs'
  | 'settings.systemInfo' | 'settings.version' | 'settings.sessionActive';


// ─────────────────────────────────────────────────────────────
// English (base) translations — all other languages fall back
// to English for any missing key
// ─────────────────────────────────────────────────────────────
const en: Record<TranslationKey, string> = {
  'app.name': 'SafeYatra',
  'app.tagline': 'Tourist Safety',

  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.edit': 'Edit',
  'common.logout': 'Log Out',
  'common.back': 'Back to Home',
  'common.submit': 'Submit',
  'common.loading': 'Loading...',
  'common.online': 'Online',
  'common.live': 'Live',
  'common.today': 'Today',
  'common.justNow': 'Just now',
  'common.settings': 'Settings',
  'common.profile': 'Profile',
  'common.notifications': 'Notifications',
  'common.language': 'Language',
  'common.interfaceLanguage': 'Interface Language',
  'common.saveClose': 'Save & Close',
  'common.version': 'Version',
  'common.role': 'Role',
  'common.session': 'Session',
  'common.active': 'Active',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.actions': 'Actions',
  'common.status': 'Status',
  'common.name': 'Full Name',
  'common.email': 'Email Address',
  'common.mobile': 'Mobile Number',
  'common.age': 'Age',
  'common.city': 'City',
  'common.nationality': 'Country (Nationality)',
  'common.bloodGroup': 'Blood Group',
  'common.emergencyContact': 'Emergency Contact',
  'common.password': 'Password',
  'common.error': 'Error',

  'nav.dashboard': 'Dashboard',
  'nav.messages': 'Messages',
  'nav.report': 'Report Incident',
  'nav.profile': 'Profile',
  'nav.overview': 'Overview',
  'nav.myGroup': 'My Group',
  'nav.chat': 'Chat',
  'nav.tourists': 'Tourists',
  'nav.inbox': 'Inbox',
  'nav.guides': 'Guides',
  'nav.exitAdmin': 'Exit Admin',
  'nav.exitGuide': 'Exit Guide',

  'auth.adminLogin': 'Admin Login',
  'auth.guideLogin': 'Guide Login',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.loginBtn': 'Login',
  'auth.backHome': 'Back to Home',
  'auth.invalidCreds': 'Invalid username or password',
  'auth.serverError': 'Unable to reach authentication server',
  'auth.guideId': 'Guide ID (e.g. G-1001)',
  'auth.guideIdPlaceholder': 'G-1001',
  'auth.invalidGuideCreds': 'Invalid Guide ID or Password. Please check with your Admin.',

  'tourist.safety': 'Tourist Safety',
  'tourist.namaskar': 'Namaskar',
  'tourist.liveGpsActive': 'Live GPS Active',
  'tourist.enableGps': 'Enable GPS',
  'tourist.gpsLive': 'GPS Live',
  'tourist.viewProfile': 'View & Edit Profile',
  'tourist.idVerified': 'ID Verified',
  'tourist.switchAccount': 'Switch Account',
  'tourist.logOut': 'Log Out',
  'tourist.liveSafetyMap': 'Live Safety Map',
  'tourist.enableLiveGps': 'Enable Live GPS',
  'tourist.riskScore': 'Risk Score',
  'tourist.battery': 'Battery',
  'tourist.assignedGuide': 'Assigned Guide',
  'tourist.tripSchedule': 'Trip Schedule',
  'tourist.safetyStatus': 'Safety Status',
  'tourist.calculatedRisk': 'Calculated Risk',
  'tourist.recenterMap': 'Recenter',
  'tourist.sos.heading': 'Instant Emergency SOS',
  'tourist.sos.description': 'Transmits your live GPS coordinates and medical profile immediately to Uttarakhand Police & Medical Dispatch.',
  'tourist.sos.trigger': 'Trigger SOS Dispatch',
  'tourist.sos.requesting': 'Requesting Microphone Permission',
  'tourist.sos.micActive': 'Microphone Active & Audio Live',
  'tourist.sos.micDenied': 'Microphone Access Denied',
  'tourist.sos.transmitting': 'Transmitting SOS Alert...',
  'tourist.sos.dispatched': 'SOS Alert Dispatched!',
  'tourist.sos.countdown': 'Dispatching SOS signal in {n}s',
  'tourist.sos.micGranted': 'Microphone Live & Audio Attached',
  'tourist.sos.micFallback': 'Non-Audio Emergency GPS Mode',

  'gps.liveActive': 'Live GPS Active',
  'gps.copy': 'Copy',
  'gps.copied': 'Copied',
  'gps.recenter': 'Recenter',
  'gps.denied': 'Live GPS Permission Denied or Unavailable',
  'gps.deniedMsg': 'Your browser is currently blocking location access. SafeYatra is running in fallback simulation mode.',
  'gps.howToEnable': 'How to Enable?',
  'gps.hideInstructions': 'Hide Instructions',
  'gps.retryPermission': 'Retry Permission',
  'gps.enableTracking': 'Enable Real-Time GPS Safety Tracking',
  'gps.enableDesc': 'Allow location access to activate live hazard geofence bounds and fast 1-tap SOS rescue dispatch.',
  'gps.enableBtn': 'Enable Live Location',

  'gpsModal.title': 'Enable Live GPS Protection',
  'gpsModal.subtitle': 'SafeYatra uses your real-time location to safeguard your journey, calculate dynamic risk zones, and provide rapid rescue assistance.',
  'gpsModal.geofence': 'Dynamic Geofence Alerts',
  'gpsModal.geofenceDesc': 'Instant alarms when approaching flash-flood zones, landslides, or high-risk terrain.',
  'gpsModal.sos': '1-Tap Emergency SOS Dispatch',
  'gpsModal.sosDesc': 'Sends high-precision GPS coordinates directly to Police, SDRF, and Trauma Centers.',
  'gpsModal.guide': 'Verified Guide Coordination',
  'gpsModal.guideDesc': 'Enables your registered tour guide to monitor your group safety in real-time.',
  'gpsModal.allow': 'Allow Live Location Access',
  'gpsModal.skip': 'Skip for now (Use Default Location)',
  'gpsModal.privacy': 'Encrypted telemetry · Only accessed for tourist safety bounds',

  'messages.inbox': 'Inbox',
  'messages.adminDesk': 'Admin Command Desk',
  'messages.typeMessage': 'Type a message...',
  'messages.safetyNominal': 'Safety monitoring is active and nominal. Contact the Authority Command Center if you need assistance.',
  'messages.tourGuide': 'Tour Guide',

  'profile.title': 'Personal Safety Information',
  'profile.verifiedRecord': 'Verified Traveler Record',
  'profile.editingMode': 'Editing Mode',
  'profile.editBtn': 'Edit Profile',
  'profile.cancelEdit': 'Cancel Editing',
  'profile.saveChanges': 'Save Changes',
  'profile.fullName': 'Full Name',
  'profile.emailAddress': 'Email Address',
  'profile.mobileNumber': 'Mobile Number',
  'profile.country': 'Country (Nationality)',
  'profile.bloodGroupLabel': 'Blood Group',
  'profile.safetyTelemetry': 'Safety Telemetry',
  'profile.safetyStatusLabel': 'Safety Status',
  'profile.riskIndex': 'Risk Index Score',
  'profile.deviceBattery': 'Device Battery',
  'profile.currentGps': 'Current GPS Location',
  'profile.blockchainAnchoring': 'Blockchain ID Anchoring',
  'profile.polygonDid': 'Polygon DID:',
  'profile.zkpHash': 'Zero-Knowledge PII Hash:',
  'profile.onChainVerified': 'On-Chain Verified Record',
  'profile.teamMembership': 'Team / Group Membership Details',
  'profile.updateSuccess': 'Profile updated successfully!',
  'profile.soloTourist': 'SOLO TOURIST',
  'profile.teamTourist': 'TEAM TOURIST',
  'profile.guideLabel': 'Guide:',
  'profile.licenseNumber': 'License Number:',
  'profile.bio': 'Bio',

  'report.title': 'Report an Incident',
  'report.subtitle': 'Provide details to alert the monitoring team immediately.',
  'report.whatHappened': 'What happened',
  'report.descPlaceholder': 'Describe the incident clearly...',
  'report.severity': 'Severity',
  'report.low': 'Low',
  'report.medium': 'Mod',
  'report.high': 'High',
  'report.sentTo': 'Sent to',
  'report.adminGuide': 'Admin + Guide',
  'report.submitBtn': 'Submit Report',
  'report.photoEvidence': 'Live photo evidence',
  'report.tapCamera': 'Tap to open camera / upload photo',
  'report.photoInstruction': 'Attach photo evidence for rescue teams',
  'report.gpsAttached': 'Live GPS Telemetry Attached:',
  'report.realtimeLocation': 'Real-time location',
  'report.successToast': 'Report submitted successfully. Monitoring team notified.',
  'report.critical': 'Critical',

  'reg.title': 'Tourist Registration',
  'reg.subtitle': 'SafeYatra Smart Identity & Safety Profile',
  'reg.selectType': 'Select Registration Type',
  'reg.solo': 'SOLO TOURIST',
  'reg.team': 'TEAM / GROUP TOURIST',
  'reg.teamName': 'Team / Group Name',
  'reg.teamNamePlaceholder': 'e.g. Himalayan Explorers Squad',
  'reg.leaderInfo': '1. Team Leader Mandatory Safety Info',
  'reg.soloInfo': 'Tourist Mandatory Safety Info',
  'reg.addMember': 'Add Member',
  'reg.removeMember': 'Remove',
  'reg.success': 'Registration Successful!',
  'reg.successSubtitle': 'Your tourist safety identity has been generated. Use your Tourist ID to sign in.',
  'reg.yourId': 'Your Unique Tourist Login ID',
  'reg.proceedSignIn': 'Proceed to Sign In',
  'reg.groupId': 'Group ID:',
  'reg.teamLeader': 'Team Leader',
  'reg.teamMembers': 'Team Members Credentials',
  'reg.err.teamName': 'Please enter a Team / Group Name.',
  'reg.err.fullName': 'Full Name is required.',
  'reg.err.leaderName': 'Team Leader Full Name is required.',
  'reg.err.email': 'Email Address is required.',
  'reg.err.emailInvalid': 'Please enter a valid Email Address (e.g. name@domain.com).',
  'reg.err.mobile': 'Mobile Number is required.',
  'reg.err.mobileInvalid': 'Please enter a valid 10-digit Mobile Number.',
  'reg.err.lat': 'Please enter a valid Initial Latitude (-90 to 90).',
  'reg.err.lng': 'Please enter a valid Initial Longitude (-180 to 180).',
  'reg.err.minMember': 'At least one team member must be registered for a Team account.',
  'reg.err.memberName': 'Team Member #{n} Full Name is required.',
  'reg.err.memberMobile': 'Team Member #{n} valid 10-digit Mobile Number is required.',
  'reg.err.memberAge': 'Team Member #{n} valid Age between 1 and 120 is required.',
  'reg.err.memberNationality': 'Team Member #{n} Country/Nationality is required.',
  'reg.err.memberCity': 'Team Member #{n} City is required.',
  'reg.err.nationality': 'Country / Nationality is required.',
  'reg.err.city': 'City is required.',
  'reg.err.age': 'Age is required.',
  'reg.err.ageInvalid': 'Please enter a valid Age between 1 and 120.',

  'guide.portal': 'Guide Portal',
  'guide.loadingPortal': 'Loading Guide Portal...',
  'guide.overview': 'Overview',
  'guide.myGroup': 'My Group',
  'guide.groupDetails': 'Tour Group Details',
  'guide.groupSubtitle': 'Managing {n} tourists in Group {id}. Ensure all members remain within safe zones.',
  'guide.addTourist': 'Add Tourist',
  'guide.broadcastGroup': 'Broadcast to Group',
  'guide.presentMembers': 'Present Members',
  'guide.activeAlerts': 'Active Alerts',
  'guide.primaryZone': 'Primary Zone',
  'guide.needsAttention': 'Needs attention',
  'guide.allClear': 'All clear',
  'guide.touristName': 'Tourist Name (ID)',
  'guide.locationZone': 'Location Zone',
  'guide.riskScore': 'Risk Score',
  'guide.lastSeen': 'Last Seen',
  'guide.filterGroup': 'Filter Group',
  'guide.pagePrev': 'Previous',
  'guide.pageNext': 'Next',
  'guide.emergencyIncidents': 'Emergency Incidents',
  'guide.recentMessages': 'Recent Messages',
  'guide.systemStatus': 'System Status',
  'guide.noNotifications': 'All clear! No new notifications.',
  'guide.safetyCore': 'SafeYatra Safety Core',
  'guide.geofencesActive': 'All geofences active. {n} tourist(s) monitored.',
  'guide.openChat': 'Open Chat',
  'guide.sosAlerts': 'SOS Emergency Alerts',
  'guide.sosAlertsDesc': 'Receive critical incident notifications',
  'guide.chatAlerts': 'Chat Message Alerts',
  'guide.chatAlertsDesc': 'Get notified on new tourist messages',
  'guide.alertSounds': 'Alert Sounds',
  'guide.alertSoundsDesc': 'Play audio cue for critical alerts',
  'guide.saveClose': 'Save & Close',
  'guide.broadcast': 'Broadcast',
  'guide.broadcastSent': 'Broadcast sent!',
  'guide.groupBroadcast': 'Group Broadcast',
  'guide.support': 'Support',
  'guide.supportSubject': 'Subject',
  'guide.supportMessage': 'Message',
  'guide.submitSupport': 'Submit Support Request',
  'guide.supportSuccess': "Support request submitted. We'll respond within 2 hours.",
  'guide.criticalAlert': 'Critical Alert',
  'guide.groupStatus': 'Group Status Overview',
  'guide.groupStatusSubtitle': 'Real-time telemetry and safety tracking for assigned group',
  'guide.syncNow': 'Sync Now',
  'guide.liveGroupMap': 'Live Group Map',
  'guide.recentAlerts': 'Recent Alerts',
  'guide.chatComms': 'Group Chat & Comms',
  'guide.chatSubtitle': 'Communicate with tour members and broadcast updates in real time.',
  'guide.searchConversations': 'Search conversations...',
  'guide.typeMessage': 'Type a message...',
  'guide.templates': 'Templates',
  'guide.noMessages': 'No messages yet. Send a message to start communicating!',
  'guide.stayWithGroup': 'Stay with the group',
  'guide.leavingIn5': "We're leaving in 5 mins",
  'guide.meetPlaza': 'Meet at the plaza',
  'guide.areYouOkay': 'Are you okay?',
  'guide.checkSurroundings': 'Check your surroundings',
  'guide.groupCheck': 'Group check-in: Please confirm your current status and location by replying.',

  'admin.panel': 'Admin Panel',
  'admin.commandCenter': 'Admin Panel',
  'admin.touristDirectory': 'Tourist Directory',
  'admin.incidentInbox': 'Incident Inbox',
  'admin.guideManagement': 'Guide Management',
  'admin.systemNominal': 'System Nominal',
  'admin.locateTourist': 'Locate Tourist ID...',
  'admin.realTimeOverview': 'Real-Time Overview',
  'admin.totalMonitored': 'Total Monitored',
  'admin.activeSOS': 'Active SOS',
  'admin.pending': 'Pending',
  'admin.recentAlerts': 'Recent Alerts',
  'admin.viewAll': 'View All',
  'admin.emergencyDispatch': 'Emergency Dispatch',
  'admin.dispatchUnit': 'Assign Unit:',
  'admin.resolveIncident': 'Resolve',
  'admin.resolved': 'Resolved ✓',
  'admin.directComm': '🛡️ Direct Communication Link',
  'admin.connectionStable': 'Connection Stable',
  'admin.sosTriggered': 'SOS Triggered',
  'admin.helpOnWay': 'Help is on the way',
  'admin.stayWhere': 'Stay where you are',
  'admin.areYouInjured': 'Are you injured?',
  'admin.typeMessage': 'Type a message to the tourist...',
  'admin.subjectId': 'Subject ID',
  'admin.lastKnownLoc': 'Last Known Location',
  'admin.assignUnit': 'Assign Unit: Unassigned',
  'admin.liveFeed': 'Live Feed',
  'admin.active': 'Active',
  'admin.allStatuses': 'All Statuses',
  'admin.safeOnly': 'Safe Only',
  'admin.caution': 'Caution',
  'admin.atRisk': 'At Risk / SOS',
  'admin.showing': 'Showing:',
  'admin.createGuide': 'Create a Guide',
  'admin.guideId': 'Guide ID',
  'admin.guideName': 'Name',
  'admin.guideMobile': 'Mobile',
  'admin.guideLicense': 'License No',
  'admin.guideStatus': 'Status',
  'admin.noGuides': 'No guides created yet.',
  'admin.notifPrefs': 'Notification Preferences',
  'admin.notifSOS': 'Tourist & Guide SOS Alerts',
  'admin.notifIncidents': 'New Incident Reports',
  'admin.notifMessages': 'Tourist Messages',
  'admin.notifSafety': 'Safety & Geofence Alerts',
  'admin.systemInfo': 'System Info',
  'admin.signOut': 'Sign Out',
  'admin.adminProfile': 'Admin Profile',
  'admin.accountInfo': 'Account Info',
  'admin.displayName': 'Display Name',
  'admin.saveDisplayName': 'Save Display Name',
  'admin.systemAdmin': 'System Admin',
  'admin.showingOf': 'Showing',
  'admin.inspectTourist': 'Tourist Profile Inspector',
  'admin.closeInspector': 'Close Inspector',
  'admin.selectLanguage': 'Interface Language',
  'admin.touristInspector': 'Tourist Profile Inspector',

  'status.safe': 'SAFE',
  'status.caution': 'CAUTION',
  'status.atRisk': 'AT RISK',
  'status.sos': 'EMERGENCY SOS',
  'status.restricted': 'Restricted',
  'status.outOfBounds': 'Out of Bounds',
  'status.edgeOfZone': 'Edge of Zone',

  'severity.low': 'Low',
  'severity.medium': 'Medium',
  'severity.high': 'High',
  'severity.critical': 'Critical',

  'settings.title': 'Settings',
  'settings.languageLabel': 'Language',
  'settings.selectLanguage': 'Select Language',
  'settings.saved': 'Saved!',
  'settings.saveSettings': 'Save Settings',
  'settings.notifPrefs': 'Notification Preferences',
  'settings.systemInfo': 'System Info',
  'settings.version': 'SafeYatra v1.0 SIH',
  'settings.sessionActive': 'Active',
};


// ─────────────────────────────────────────────────────────────
// Hindi (हिन्दी)
// ─────────────────────────────────────────────────────────────
const hi: Partial<Record<TranslationKey, string>> = {
  'app.name': 'SafeYatra',
  'app.tagline': 'पर्यटक सुरक्षा',
  'common.save': 'सहेजें',
  'common.cancel': 'रद्द करें',
  'common.close': 'बंद करें',
  'common.edit': 'संपादित करें',
  'common.logout': 'लॉग आउट',
  'common.back': 'होम पर वापस',
  'common.submit': 'जमा करें',
  'common.loading': 'लोड हो रहा है...',
  'common.online': 'ऑनलाइन',
  'common.live': 'लाइव',
  'common.today': 'आज',
  'common.justNow': 'अभी',
  'common.settings': 'सेटिंग्स',
  'common.profile': 'प्रोफ़ाइल',
  'common.notifications': 'सूचनाएँ',
  'common.language': 'भाषा',
  'common.interfaceLanguage': 'इंटरफ़ेस भाषा',
  'common.saveClose': 'सहेजें और बंद करें',
  'common.name': 'पूरा नाम',
  'common.email': 'ईमेल पता',
  'common.mobile': 'मोबाइल नंबर',
  'common.age': 'आयु',
  'common.city': 'शहर',
  'common.nationality': 'देश (राष्ट्रीयता)',
  'common.bloodGroup': 'रक्त समूह',
  'common.emergencyContact': 'आपातकालीन संपर्क',
  'common.password': 'पासवर्ड',
  'nav.dashboard': 'डैशबोर्ड',
  'nav.messages': 'संदेश',
  'nav.report': 'घटना रिपोर्ट',
  'nav.profile': 'प्रोफ़ाइल',
  'nav.overview': 'अवलोकन',
  'nav.myGroup': 'मेरा समूह',
  'nav.chat': 'चैट',
  'nav.tourists': 'पर्यटक',
  'nav.inbox': 'इनबॉक्स',
  'nav.guides': 'गाइड',
  'nav.exitAdmin': 'व्यवस्थापक से बाहर',
  'nav.exitGuide': 'गाइड से बाहर',
  'auth.adminLogin': 'व्यवस्थापक लॉगिन',
  'auth.guideLogin': 'गाइड लॉगिन',
  'auth.username': 'उपयोगकर्ता नाम',
  'auth.password': 'पासवर्ड',
  'auth.loginBtn': 'लॉगिन',
  'auth.backHome': 'होम पर वापस',
  'auth.invalidCreds': 'अमान्य उपयोगकर्ता नाम या पासवर्ड',
  'auth.serverError': 'प्रमाणीकरण सर्वर तक पहुँच नहीं हो पाई',
  'auth.invalidGuideCreds': 'अमान्य गाइड ID या पासवर्ड। अपने व्यवस्थापक से जाँच करें।',
  'tourist.safety': 'पर्यटक सुरक्षा',
  'tourist.namaskar': 'नमस्कार',
  'tourist.liveGpsActive': 'लाइव GPS सक्रिय',
  'tourist.enableGps': 'GPS सक्षम करें',
  'tourist.logOut': 'लॉग आउट',
  'tourist.sos.heading': 'तत्काल आपातकालीन SOS',
  'tourist.sos.trigger': 'SOS डिस्पैच ट्रिगर करें',
  'tourist.sos.dispatched': 'SOS अलर्ट भेजा गया!',
  'tourist.sos.transmitting': 'SOS अलर्ट प्रसारित हो रहा है...',
  'gps.liveActive': 'लाइव GPS सक्रिय',
  'gps.copy': 'कॉपी',
  'gps.copied': 'कॉपी हो गया',
  'gps.recenter': 'पुनः केंद्रित करें',
  'gps.retryPermission': 'अनुमति पुनः प्रयास',
  'gps.enableBtn': 'लाइव स्थान सक्षम करें',
  'gpsModal.title': 'लाइव GPS सुरक्षा सक्षम करें',
  'gpsModal.allow': 'लाइव स्थान पहुँच की अनुमति दें',
  'gpsModal.skip': 'अभी छोड़ें (डिफ़ॉल्ट स्थान उपयोग करें)',
  'messages.inbox': 'इनबॉक्स',
  'messages.adminDesk': 'प्रशासन कमांड डेस्क',
  'messages.typeMessage': 'संदेश टाइप करें...',
  'profile.title': 'व्यक्तिगत सुरक्षा जानकारी',
  'profile.editBtn': 'प्रोफ़ाइल संपादित करें',
  'profile.saveChanges': 'परिवर्तन सहेजें',
  'profile.updateSuccess': 'प्रोफ़ाइल सफलतापूर्वक अपडेट हुई!',
  'report.title': 'घटना रिपोर्ट करें',
  'report.subtitle': 'निगरानी टीम को तुरंत सतर्क करने के लिए विवरण दें।',
  'report.descPlaceholder': 'घटना स्पष्ट रूप से वर्णन करें...',
  'report.submitBtn': 'रिपोर्ट जमा करें',
  'report.successToast': 'रिपोर्ट सफलतापूर्वक जमा हुई। निगरानी टीम को सूचित किया गया।',
  'report.low': 'कम',
  'report.medium': 'मध्यम',
  'report.high': 'उच्च',
  'reg.title': 'पर्यटक पंजीकरण',
  'reg.solo': 'एकल पर्यटक',
  'reg.team': 'टीम / समूह पर्यटक',
  'reg.success': 'पंजीकरण सफल!',
  'reg.proceedSignIn': 'साइन इन करें',
  'guide.loadingPortal': 'गाइड पोर्टल लोड हो रहा है...',
  'guide.overview': 'अवलोकन',
  'guide.myGroup': 'मेरा समूह',
  'guide.groupDetails': 'टूर समूह विवरण',
  'guide.addTourist': 'पर्यटक जोड़ें',
  'guide.broadcastGroup': 'समूह को प्रसारण',
  'guide.presentMembers': 'उपस्थित सदस्य',
  'guide.activeAlerts': 'सक्रिय अलर्ट',
  'guide.noNotifications': 'सब ठीक! कोई नई सूचना नहीं।',
  'guide.openChat': 'चैट खोलें',
  'guide.typeMessage': 'संदेश टाइप करें...',
  'guide.stayWithGroup': 'समूह के साथ रहें',
  'guide.areYouOkay': 'क्या आप ठीक हैं?',
  'admin.panel': 'व्यवस्थापक पैनल',
  'admin.commandCenter': 'व्यवस्थापक पैनल',
  'admin.systemNominal': 'सिस्टम सामान्य',
  'admin.activeSOS': 'सक्रिय SOS',
  'admin.pending': 'लंबित',
  'admin.emergencyDispatch': 'आपातकालीन डिस्पैच',
  'admin.resolveIncident': 'समाधान',
  'admin.resolved': 'समाधान हुआ ✓',
  'admin.helpOnWay': 'सहायता रास्ते में है',
  'admin.stayWhere': 'जहाँ हैं वहीं रहें',
  'admin.areYouInjured': 'क्या आप घायल हैं?',
  'admin.typeMessage': 'पर्यटक को संदेश टाइप करें...',
  'admin.signOut': 'साइन आउट',
  'admin.systemAdmin': 'सिस्टम व्यवस्थापक',
  'admin.selectLanguage': 'इंटरफ़ेस भाषा',
  'status.safe': 'सुरक्षित',
  'status.caution': 'सावधानी',
  'status.atRisk': 'जोखिम में',
  'status.sos': 'आपातकालीन SOS',
  'status.restricted': 'प्रतिबंधित',
  'settings.title': 'सेटिंग्स',
  'settings.saveSettings': 'सेटिंग्स सहेजें',
  'settings.saved': 'सहेजा गया!',
};


// ─────────────────────────────────────────────────────────────
// Marathi (मराठी)
// ─────────────────────────────────────────────────────────────
const mr: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'पर्यटक सुरक्षा',
  'common.save': 'जतन करा', 'common.cancel': 'रद्द करा', 'common.close': 'बंद करा',
  'common.edit': 'संपादित करा', 'common.logout': 'लॉग आउट', 'common.back': 'मुखपृष्ठावर परत',
  'common.submit': 'सबमिट करा', 'common.loading': 'लोड होत आहे...', 'common.settings': 'सेटिंग्ज',
  'common.profile': 'प्रोफाइल', 'common.notifications': 'सूचना', 'common.language': 'भाषा',
  'common.interfaceLanguage': 'इंटरफेस भाषा', 'common.saveClose': 'जतन करा व बंद करा',
  'common.name': 'पूर्ण नाव', 'common.email': 'ईमेल पत्ता', 'common.mobile': 'मोबाइल नंबर',
  'common.password': 'पासवर्ड', 'common.emergencyContact': 'आपत्कालीन संपर्क',
  'nav.dashboard': 'डॅशबोर्ड', 'nav.messages': 'संदेश', 'nav.report': 'घटना अहवाल',
  'nav.profile': 'प्रोफाइल', 'nav.overview': 'आढावा', 'nav.myGroup': 'माझा गट',
  'nav.chat': 'चॅट', 'nav.tourists': 'पर्यटक', 'nav.inbox': 'इनबॉक्स', 'nav.guides': 'मार्गदर्शक',
  'nav.exitAdmin': 'प्रशासक बाहेर', 'nav.exitGuide': 'मार्गदर्शक बाहेर',
  'auth.adminLogin': 'प्रशासक लॉगिन', 'auth.guideLogin': 'मार्गदर्शक लॉगिन',
  'auth.loginBtn': 'लॉगिन', 'auth.backHome': 'मुखपृष्ठावर परत',
  'auth.invalidCreds': 'अवैध वापरकर्ता नाव किंवा पासवर्ड',
  'tourist.safety': 'पर्यटक सुरक्षा', 'tourist.namaskar': 'नमस्कार',
  'tourist.liveGpsActive': 'लाइव GPS सक्रिय', 'tourist.logOut': 'लॉग आउट',
  'tourist.sos.heading': 'त्वरित आपत्कालीन SOS', 'tourist.sos.trigger': 'SOS डिस्पॅच ट्रिगर करा',
  'tourist.sos.dispatched': 'SOS अलर्ट पाठवला!', 'tourist.sos.transmitting': 'SOS अलर्ट प्रसारित होत आहे...',
  'gps.liveActive': 'लाइव GPS सक्रिय', 'gps.copy': 'कॉपी', 'gps.copied': 'कॉपी झाले',
  'gps.recenter': 'पुन्हा केंद्रित करा', 'gps.enableBtn': 'लाइव स्थान सक्षम करा',
  'gpsModal.title': 'लाइव GPS संरक्षण सक्षम करा', 'gpsModal.allow': 'लाइव स्थान प्रवेशास परवानगी द्या',
  'gpsModal.skip': 'आत्ता वगळा (डीफॉल्ट स्थान वापरा)',
  'messages.inbox': 'इनबॉक्स', 'messages.adminDesk': 'प्रशासन कमांड डेस्क',
  'messages.typeMessage': 'संदेश टाइप करा...',
  'profile.title': 'वैयक्तिक सुरक्षा माहिती', 'profile.editBtn': 'प्रोफाइल संपादित करा',
  'profile.saveChanges': 'बदल जतन करा', 'profile.updateSuccess': 'प्रोफाइल यशस्वीरित्या अपडेट झाली!',
  'report.title': 'घटना अहवाल द्या', 'report.subtitle': 'देखरेख टीमला त्वरित सतर्क करण्यासाठी तपशील द्या.',
  'report.descPlaceholder': 'घटना स्पष्टपणे वर्णन करा...', 'report.submitBtn': 'अहवाल सबमिट करा',
  'report.successToast': 'अहवाल यशस्वीरित्या सबमिट झाला. देखरेख टीमला सूचित केले.',
  'report.low': 'कमी', 'report.medium': 'मध्यम', 'report.high': 'उच्च',
  'guide.loadingPortal': 'मार्गदर्शक पोर्टल लोड होत आहे...', 'guide.overview': 'आढावा',
  'guide.myGroup': 'माझा गट', 'guide.groupDetails': 'टूर गट तपशील',
  'guide.addTourist': 'पर्यटक जोडा', 'guide.broadcastGroup': 'गटाला प्रसारण',
  'guide.noNotifications': 'सर्व ठीक! नवीन सूचना नाही.',
  'guide.typeMessage': 'संदेश टाइप करा...',
  'admin.panel': 'प्रशासक पॅनेल', 'admin.commandCenter': 'प्रशासक पॅनेल',
  'admin.systemNominal': 'सिस्टम सामान्य', 'admin.activeSOS': 'सक्रिय SOS',
  'admin.emergencyDispatch': 'आपत्कालीन डिस्पॅच', 'admin.resolveIncident': 'निराकरण',
  'admin.resolved': 'निराकरण झाले ✓', 'admin.signOut': 'साइन आउट',
  'admin.selectLanguage': 'इंटरफेस भाषा',
  'status.safe': 'सुरक्षित', 'status.caution': 'सावधानता', 'status.atRisk': 'धोका',
  'status.sos': 'आपत्कालीन SOS', 'status.restricted': 'प्रतिबंधित',
  'settings.title': 'सेटिंग्ज', 'settings.saveSettings': 'सेटिंग्ज जतन करा', 'settings.saved': 'जतन झाले!',
};

// ─────────────────────────────────────────────────────────────
// Bengali (বাংলা)
// ─────────────────────────────────────────────────────────────
const bn: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'পর্যটক নিরাপত্তা',
  'common.save': 'সংরক্ষণ', 'common.cancel': 'বাতিল', 'common.close': 'বন্ধ করুন',
  'common.edit': 'সম্পাদনা', 'common.logout': 'লগ আউট', 'common.back': 'হোমে ফিরুন',
  'common.submit': 'জমা দিন', 'common.loading': 'লোড হচ্ছে...', 'common.settings': 'সেটিংস',
  'common.profile': 'প্রোফাইল', 'common.notifications': 'বিজ্ঞপ্তি', 'common.language': 'ভাষা',
  'common.interfaceLanguage': 'ইন্টারফেস ভাষা', 'common.saveClose': 'সংরক্ষণ করুন ও বন্ধ করুন',
  'common.name': 'পূর্ণ নাম', 'common.email': 'ইমেইল ঠিকানা', 'common.mobile': 'মোবাইল নম্বর',
  'common.password': 'পাসওয়ার্ড', 'common.emergencyContact': 'জরুরি যোগাযোগ',
  'nav.dashboard': 'ড্যাশবোর্ড', 'nav.messages': 'বার্তা', 'nav.report': 'ঘটনা রিপোর্ট',
  'nav.profile': 'প্রোফাইল', 'nav.overview': 'পর্যালোচনা', 'nav.myGroup': 'আমার দল',
  'nav.chat': 'চ্যাট', 'nav.tourists': 'পর্যটক', 'nav.inbox': 'ইনবক্স', 'nav.guides': 'গাইড',
  'nav.exitAdmin': 'অ্যাডমিন থেকে বের হন', 'nav.exitGuide': 'গাইড থেকে বের হন',
  'auth.adminLogin': 'অ্যাডমিন লগইন', 'auth.guideLogin': 'গাইড লগইন',
  'auth.loginBtn': 'লগইন', 'auth.backHome': 'হোমে ফিরুন',
  'auth.invalidCreds': 'ভুল ব্যবহারকারীর নাম বা পাসওয়ার্ড',
  'tourist.safety': 'পর্যটক নিরাপত্তা', 'tourist.namaskar': 'নমস্কার',
  'tourist.liveGpsActive': 'লাইভ GPS সক্রিয়', 'tourist.logOut': 'লগ আউট',
  'tourist.sos.heading': 'তাৎক্ষণিক জরুরি SOS', 'tourist.sos.trigger': 'SOS প্রেরণ করুন',
  'tourist.sos.dispatched': 'SOS সতর্কতা পাঠানো হয়েছে!', 'tourist.sos.transmitting': 'SOS সতর্কতা প্রেরণ হচ্ছে...',
  'gps.liveActive': 'লাইভ GPS সক্রিয়', 'gps.copy': 'কপি', 'gps.copied': 'কপি হয়েছে',
  'gps.recenter': 'পুনরায় কেন্দ্রীভূত করুন', 'gps.enableBtn': 'লাইভ লোকেশন চালু করুন',
  'gpsModal.title': 'লাইভ GPS সুরক্ষা চালু করুন', 'gpsModal.allow': 'লাইভ লোকেশন অ্যাক্সেসের অনুমতি দিন',
  'gpsModal.skip': 'এখন এড়িয়ে যান (ডিফল্ট লোকেশন ব্যবহার করুন)',
  'messages.inbox': 'ইনবক্স', 'messages.adminDesk': 'অ্যাডমিন কমান্ড ডেস্ক',
  'messages.typeMessage': 'বার্তা লিখুন...',
  'profile.title': 'ব্যক্তিগত নিরাপত্তা তথ্য', 'profile.editBtn': 'প্রোফাইল সম্পাদনা করুন',
  'profile.saveChanges': 'পরিবর্তন সংরক্ষণ করুন', 'profile.updateSuccess': 'প্রোফাইল সফলভাবে আপডেট হয়েছে!',
  'report.title': 'একটি ঘটনা রিপোর্ট করুন', 'report.subtitle': 'পর্যবেক্ষণ দলকে অবিলম্বে সতর্ক করতে বিবরণ দিন।',
  'report.descPlaceholder': 'ঘটনাটি স্পষ্টভাবে বর্ণনা করুন...', 'report.submitBtn': 'রিপোর্ট জমা দিন',
  'report.successToast': 'রিপোর্ট সফলভাবে জমা হয়েছে। পর্যবেক্ষণ দলকে অবহিত করা হয়েছে।',
  'report.low': 'কম', 'report.medium': 'মাঝারি', 'report.high': 'উচ্চ',
  'guide.loadingPortal': 'গাইড পোর্টাল লোড হচ্ছে...', 'guide.addTourist': 'পর্যটক যোগ করুন',
  'guide.noNotifications': 'সব ঠিক! কোন নতুন বিজ্ঞপ্তি নেই।',
  'guide.typeMessage': 'বার্তা লিখুন...',
  'admin.panel': 'অ্যাডমিন প্যানেল', 'admin.commandCenter': 'অ্যাডমিন প্যানেল',
  'admin.systemNominal': 'সিস্টেম স্বাভাবিক', 'admin.activeSOS': 'সক্রিয় SOS',
  'admin.emergencyDispatch': 'জরুরি প্রেরণ', 'admin.resolveIncident': 'সমাধান',
  'admin.resolved': 'সমাধান হয়েছে ✓', 'admin.signOut': 'সাইন আউট',
  'admin.selectLanguage': 'ইন্টারফেস ভাষা',
  'status.safe': 'নিরাপদ', 'status.caution': 'সতর্কতা', 'status.atRisk': 'ঝুঁকিতে',
  'status.sos': 'জরুরি SOS', 'status.restricted': 'সীমাবদ্ধ',
  'settings.title': 'সেটিংস', 'settings.saveSettings': 'সেটিংস সংরক্ষণ করুন', 'settings.saved': 'সংরক্ষিত!',
};


// ─────────────────────────────────────────────────────────────
// Gujarati (ગુજરાતી)
// ─────────────────────────────────────────────────────────────
const gu: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'પ્રવાસી સુરક્ષા',
  'common.save': 'સાચવો', 'common.cancel': 'રદ કરો', 'common.close': 'બંધ કરો',
  'common.edit': 'સંપાદિત કરો', 'common.logout': 'લૉગ આઉટ', 'common.back': 'ઘરે પાછા',
  'common.submit': 'સબમિટ', 'common.loading': 'લોડ થઈ રહ્યું છે...', 'common.settings': 'સેટિંગ્સ',
  'common.profile': 'પ્રોફાઇલ', 'common.notifications': 'સૂચનાઓ', 'common.language': 'ભાષા',
  'common.interfaceLanguage': 'ઇન્ટરફેસ ભાષા', 'common.name': 'પૂરું નામ',
  'common.email': 'ઇમેઇલ સરનામું', 'common.mobile': 'મોબાઇલ નંબર', 'common.password': 'પાસવર્ડ',
  'nav.dashboard': 'ડૅશબોર્ડ', 'nav.messages': 'સંદેશ', 'nav.report': 'ઘટના અહેવાલ',
  'nav.profile': 'પ્રોફાઇલ', 'nav.overview': 'ઝાંખી', 'nav.myGroup': 'મારું જૂથ',
  'nav.chat': 'ચૅટ', 'nav.tourists': 'પ્રવાસીઓ', 'nav.inbox': 'ઇનબૉક્સ', 'nav.guides': 'ગાઇડ',
  'auth.adminLogin': 'વ્યવસ્થાપક લૉગિન', 'auth.guideLogin': 'ગાઇડ લૉગિન',
  'auth.loginBtn': 'લૉગિન', 'auth.backHome': 'ઘરે પાછા',
  'tourist.safety': 'પ્રવાસી સુરક્ષા', 'tourist.namaskar': 'નમસ્કાર',
  'tourist.liveGpsActive': 'લાઇવ GPS સક્રિય', 'tourist.logOut': 'લૉગ આઉટ',
  'tourist.sos.heading': 'તત્કાળ કટોકટી SOS', 'tourist.sos.trigger': 'SOS ડિસ્પૅચ કરો',
  'tourist.sos.dispatched': 'SOS ચેતવણી મોકલ્યો!',
  'gps.liveActive': 'લાઇવ GPS સક્રિય', 'gps.copy': 'કૉપિ', 'gps.copied': 'કૉપિ થઈ',
  'gps.recenter': 'ફરીથી કેન્દ્રિત', 'gps.enableBtn': 'લાઇવ સ્થાન સક્ષમ',
  'gpsModal.title': 'લાઇવ GPS સુરક્ષા સક્ષમ', 'gpsModal.allow': 'લાઇવ સ્થાન ઍક્સેસ આપો',
  'gpsModal.skip': 'હમણાં છોડો (ડિફૉલ્ટ સ્થાન ઉપયોગ)',
  'messages.inbox': 'ઇનબૉક્સ', 'messages.typeMessage': 'સંદેશ ટાઇપ...',
  'profile.title': 'વ્યક્તિગત સુરક્ષા માહિતી', 'profile.editBtn': 'પ્રોફાઇલ સંપાદિત',
  'profile.saveChanges': 'ફેરફાર સાચવો', 'profile.updateSuccess': 'પ્રોફાઇલ અપડેટ થઈ!',
  'report.title': 'ઘટના નોંધો', 'report.descPlaceholder': 'ઘટનાનું સ્પષ્ટ વર્ણન...',
  'report.submitBtn': 'અહેવાલ સબમિટ', 'report.successToast': 'અહેવાલ સફળ. ટીમ સૂચિત.',
  'report.low': 'ઓછો', 'report.medium': 'મધ્યમ', 'report.high': 'ઊંચો',
  'guide.loadingPortal': 'ગાઇડ પૉર્ટલ લોડ...', 'guide.addTourist': 'પ્રવાસી ઉમેરો',
  'guide.noNotifications': 'બધું ઠીક! નવી સૂચના નથી.',
  'admin.panel': 'વ્યવસ્થાપક પૅનલ', 'admin.commandCenter': 'વ્યવસ્થાપક પૅનલ',
  'admin.activeSOS': 'સક્રિય SOS', 'admin.emergencyDispatch': 'કટોકટી ડિસ્પૅચ',
  'admin.signOut': 'સાઇન આઉટ', 'admin.selectLanguage': 'ઇન્ટરફેસ ભાષા',
  'status.safe': 'સલામત', 'status.caution': 'સાવધ', 'status.atRisk': 'જોખમ',
  'settings.title': 'સેટિંગ્સ', 'settings.saveSettings': 'સેટિંગ્સ સાચવો', 'settings.saved': 'સૅવ!',
};

// ─────────────────────────────────────────────────────────────
// Tamil (தமிழ்)
// ─────────────────────────────────────────────────────────────
const ta: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'சுற்றுலா பாதுகாப்பு',
  'common.save': 'சேமி', 'common.cancel': 'ரத்து', 'common.close': 'மூடு',
  'common.edit': 'திருத்து', 'common.logout': 'வெளியேறு', 'common.back': 'முகப்புக்கு திரும்பு',
  'common.submit': 'சமர்ப்பி', 'common.loading': 'ஏற்றுகிறது...', 'common.settings': 'அமைப்புகள்',
  'common.profile': 'சுயவிவரம்', 'common.notifications': 'அறிவிப்புகள்', 'common.language': 'மொழி',
  'common.interfaceLanguage': 'இடைமுகம் மொழி', 'common.name': 'முழு பெயர்',
  'common.email': 'மின்னஞ்சல் முகவரி', 'common.mobile': 'மொபைல் எண்', 'common.password': 'கடவுச்சொல்',
  'nav.dashboard': 'டாஷ்போர்டு', 'nav.messages': 'செய்திகள்', 'nav.report': 'சம்பவ அறிக்கை',
  'nav.profile': 'சுயவிவரம்', 'nav.overview': 'மேலோட்டம்', 'nav.myGroup': 'என் குழு',
  'nav.chat': 'அரட்டை', 'nav.tourists': 'சுற்றுலா பயணிகள்', 'nav.inbox': 'இன்பாக்ஸ்', 'nav.guides': 'வழிகாட்டிகள்',
  'auth.adminLogin': 'நிர்வாக உள்நுழைவு', 'auth.guideLogin': 'வழிகாட்டி உள்நுழைவு',
  'auth.loginBtn': 'உள்நுழைவு', 'auth.backHome': 'முகப்புக்கு திரும்பு',
  'tourist.safety': 'சுற்றுலா பாதுகாப்பு', 'tourist.namaskar': 'வணக்கம்',
  'tourist.liveGpsActive': 'நேரடி GPS செயலில்', 'tourist.logOut': 'வெளியேறு',
  'tourist.sos.heading': 'உடனடி அவசர SOS', 'tourist.sos.trigger': 'SOS அனுப்பு',
  'tourist.sos.dispatched': 'SOS எச்சரிக்கை அனுப்பப்பட்டது!',
  'gps.liveActive': 'நேரடி GPS செயலில்', 'gps.copy': 'நகல்', 'gps.copied': 'நகல் செய்யப்பட்டது',
  'gps.recenter': 'மீண்டும் மையப்படுத்து', 'gps.enableBtn': 'நேரடி இடம் இயக்கு',
  'gpsModal.title': 'நேரடி GPS பாதுகாப்பை இயக்கு', 'gpsModal.allow': 'நேரடி இட அனுமதி',
  'gpsModal.skip': 'இப்போது தவிர்',
  'messages.inbox': 'இன்பாக்ஸ்', 'messages.typeMessage': 'செய்தி தட்டச்சு...',
  'profile.title': 'தனிப்பட்ட பாதுகாப்பு தகவல்', 'profile.editBtn': 'சுயவிவரம் திருத்து',
  'profile.saveChanges': 'மாற்றங்களை சேமி', 'profile.updateSuccess': 'சுயவிவரம் புதுப்பிக்கப்பட்டது!',
  'report.title': 'சம்பவம் புகாரளி', 'report.descPlaceholder': 'சம்பவத்தை விவரி...',
  'report.submitBtn': 'அறிக்கை சமர்ப்பி', 'report.successToast': 'அறிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.',
  'report.low': 'குறைவு', 'report.medium': 'நடுத்தரம்', 'report.high': 'அதிகம்',
  'guide.loadingPortal': 'வழிகாட்டி போர்டல் ஏற்றுகிறது...', 'guide.addTourist': 'சுற்றுலா பயணி சேர்',
  'guide.noNotifications': 'அனைத்தும் சரி! புதிய அறிவிப்பு இல்லை.',
  'admin.panel': 'நிர்வாக பலகை', 'admin.commandCenter': 'நிர்வாக பலகை',
  'admin.activeSOS': 'செயலில் SOS', 'admin.emergencyDispatch': 'அவசர அனுப்புதல்',
  'admin.signOut': 'வெளியேறு', 'admin.selectLanguage': 'இடைமுகம் மொழி',
  'status.safe': 'பாதுகாப்பு', 'status.caution': 'எச்சரிக்கை', 'status.atRisk': 'ஆபத்தில்',
  'settings.title': 'அமைப்புகள்', 'settings.saveSettings': 'அமைப்புகளை சேமி', 'settings.saved': 'சேமிக்கப்பட்டது!',
};

// ─────────────────────────────────────────────────────────────
// Telugu (తెలుగు)
// ─────────────────────────────────────────────────────────────
const te: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'పర్యాటక భద్రత',
  'common.save': 'సేవ్', 'common.cancel': 'రద్దు', 'common.close': 'మూసివేయి',
  'common.edit': 'సవరించు', 'common.logout': 'లాగ్ అవుట్', 'common.back': 'హోమ్‌కు తిరిగి',
  'common.submit': 'సమర్పించు', 'common.loading': 'లోడ్ అవుతోంది...', 'common.settings': 'సెట్టింగ్‌లు',
  'common.profile': 'ప్రొఫైల్', 'common.notifications': 'నోటిఫికేషన్లు', 'common.language': 'భాష',
  'common.interfaceLanguage': 'ఇంటర్‌ఫేస్ భాష', 'common.name': 'పూర్తి పేరు',
  'common.email': 'ఇమెయిల్ చిరునామా', 'common.mobile': 'మొబైల్ నంబర్', 'common.password': 'పాస్‌వర్డ్',
  'nav.dashboard': 'డాష్‌బోర్డ్', 'nav.messages': 'సందేశాలు', 'nav.report': 'సంఘటన నివేదిక',
  'nav.profile': 'ప్రొఫైల్', 'nav.overview': 'అవలోకనం', 'nav.myGroup': 'నా గ్రూప్',
  'nav.chat': 'చాట్', 'nav.tourists': 'పర్యాటకులు', 'nav.inbox': 'ఇన్‌బాక్స్', 'nav.guides': 'గైడ్‌లు',
  'auth.adminLogin': 'అడ్మిన్ లాగిన్', 'auth.guideLogin': 'గైడ్ లాగిన్',
  'auth.loginBtn': 'లాగిన్', 'auth.backHome': 'హోమ్‌కు తిరిగి',
  'tourist.safety': 'పర్యాటక భద్రత', 'tourist.namaskar': 'నమస్కారం',
  'tourist.liveGpsActive': 'లైవ్ GPS యాక్టివ్', 'tourist.logOut': 'లాగ్ అవుట్',
  'tourist.sos.heading': 'తక్షణ అత్యవసర SOS', 'tourist.sos.trigger': 'SOS పంపించు',
  'tourist.sos.dispatched': 'SOS హెచ్చరిక పంపబడింది!',
  'gps.liveActive': 'లైవ్ GPS యాక్టివ్', 'gps.copy': 'కాపీ', 'gps.copied': 'కాపీ అయింది',
  'gps.recenter': 'రీసెంటర్', 'gps.enableBtn': 'లైవ్ లొకేషన్ ఆన్',
  'gpsModal.title': 'లైవ్ GPS భద్రత ప్రారంభించు', 'gpsModal.allow': 'లైవ్ లొకేషన్ అనుమతించు',
  'gpsModal.skip': 'ఇప్పుడు వదిలేయండి',
  'messages.inbox': 'ఇన్‌బాక్స్', 'messages.typeMessage': 'సందేశం టైప్...',
  'profile.title': 'వ్యక్తిగత భద్రత సమాచారం', 'profile.editBtn': 'ప్రొఫైల్ సవరించు',
  'profile.saveChanges': 'మార్పులు సేవ్', 'profile.updateSuccess': 'ప్రొఫైల్ అప్‌డేట్ అయింది!',
  'report.title': 'సంఘటన నివేదించు', 'report.descPlaceholder': 'సంఘటన వివరించు...',
  'report.submitBtn': 'నివేదిక సమర్పించు', 'report.successToast': 'నివేదిక విజయవంతంగా సమర్పించబడింది.',
  'report.low': 'తక్కువ', 'report.medium': 'మధ్యస్థం', 'report.high': 'అధికం',
  'guide.loadingPortal': 'గైడ్ పోర్టల్ లోడ్...', 'guide.addTourist': 'పర్యాటకుడిని జోడించు',
  'guide.noNotifications': 'అంతా సరే! కొత్త నోటిఫికేషన్లు లేవు.',
  'admin.panel': 'అడ్మిన్ ప్యానెల్', 'admin.commandCenter': 'అడ్మిన్ ప్యానెల్',
  'admin.activeSOS': 'యాక్టివ్ SOS', 'admin.emergencyDispatch': 'అత్యవసర డిస్పాచ్',
  'admin.signOut': 'సైన్ అవుట్', 'admin.selectLanguage': 'ఇంటర్‌ఫేస్ భాష',
  'status.safe': 'సురక్షితం', 'status.caution': 'జాగ్రత్త', 'status.atRisk': 'ప్రమాదం',
  'settings.title': 'సెట్టింగ్‌లు', 'settings.saveSettings': 'సెట్టింగ్‌లు సేవ్', 'settings.saved': 'సేవ్ అయింది!',
};

// ─────────────────────────────────────────────────────────────
// Kannada (ಕನ್ನಡ)
// ─────────────────────────────────────────────────────────────
const kn: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'ಪ್ರವಾಸಿ ಸುರಕ್ಷತೆ',
  'common.save': 'ಉಳಿಸು', 'common.cancel': 'ರದ್ದು', 'common.close': 'ಮುಚ್ಚು',
  'common.edit': 'ಸಂಪಾದಿಸು', 'common.logout': 'ಲಾಗ್ ಔಟ್', 'common.back': 'ಹೋಮ್‌ಗೆ ಹಿಂತಿರುಗಿ',
  'common.submit': 'ಸಲ್ಲಿಸು', 'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', 'common.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
  'common.profile': 'ಪ್ರೊಫೈಲ್', 'common.notifications': 'ಅಧಿಸೂಚನೆಗಳು', 'common.language': 'ಭಾಷೆ',
  'common.interfaceLanguage': 'ಇಂಟರ್‌ಫೇಸ್ ಭಾಷೆ', 'common.name': 'ಪೂರ್ಣ ಹೆಸರು',
  'common.email': 'ಇಮೇಲ್ ವಿಳಾಸ', 'common.mobile': 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', 'common.password': 'ಪಾಸ್‌ವರ್ಡ್',
  'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'nav.messages': 'ಸಂದೇಶಗಳು', 'nav.report': 'ಘಟನೆ ವರದಿ',
  'nav.profile': 'ಪ್ರೊಫೈಲ್', 'nav.overview': 'ಅವಲೋಕನ', 'nav.myGroup': 'ನನ್ನ ಗುಂಪು',
  'nav.chat': 'ಚಾಟ್', 'nav.tourists': 'ಪ್ರವಾಸಿಗರು', 'nav.inbox': 'ಇನ್‌ಬಾಕ್ಸ್', 'nav.guides': 'ಮಾರ್ಗದರ್ಶಿಗಳು',
  'auth.adminLogin': 'ನಿರ್ವಾಹಕ ಲಾಗಿನ್', 'auth.guideLogin': 'ಮಾರ್ಗದರ್ಶಿ ಲಾಗಿನ್',
  'auth.loginBtn': 'ಲಾಗಿನ್', 'auth.backHome': 'ಹೋಮ್‌ಗೆ ಹಿಂತಿರುಗಿ',
  'tourist.safety': 'ಪ್ರವಾಸಿ ಸುರಕ್ಷತೆ', 'tourist.namaskar': 'ನಮಸ್ಕಾರ',
  'tourist.liveGpsActive': 'ಲೈವ್ GPS ಸಕ್ರಿಯ', 'tourist.logOut': 'ಲಾಗ್ ಔಟ್',
  'tourist.sos.heading': 'ತಕ್ಷಣದ ತುರ್ತು SOS', 'tourist.sos.trigger': 'SOS ಕಳುಹಿಸು',
  'tourist.sos.dispatched': 'SOS ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಲಾಗಿದೆ!',
  'gps.liveActive': 'ಲೈವ್ GPS ಸಕ್ರಿಯ', 'gps.copy': 'ನಕಲು', 'gps.copied': 'ನಕಲಾಗಿದೆ',
  'gps.recenter': 'ಮರುಕೇಂದ್ರ', 'gps.enableBtn': 'ಲೈವ್ ಸ್ಥಳ ಸಕ್ರಿಯ',
  'gpsModal.title': 'ಲೈವ್ GPS ರಕ್ಷಣೆ ಸಕ್ರಿಯ', 'gpsModal.allow': 'ಲೈವ್ ಸ್ಥಳ ಅನುಮತಿ',
  'gpsModal.skip': 'ಇದೀಗ ಬಿಡಿ',
  'messages.inbox': 'ಇನ್‌ಬಾಕ್ಸ್', 'messages.typeMessage': 'ಸಂದೇಶ ಟೈಪ್...',
  'profile.title': 'ವೈಯಕ್ತಿಕ ಸುರಕ್ಷತೆ ಮಾಹಿತಿ', 'profile.editBtn': 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸು',
  'profile.saveChanges': 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸು', 'profile.updateSuccess': 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ!',
  'report.title': 'ಘಟನೆ ವರದಿ ಮಾಡಿ', 'report.descPlaceholder': 'ಘಟನೆ ವಿವರಿಸಿ...',
  'report.submitBtn': 'ವರದಿ ಸಲ್ಲಿಸು', 'report.successToast': 'ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
  'report.low': 'ಕಡಿಮೆ', 'report.medium': 'ಮಧ್ಯಮ', 'report.high': 'ಹೆಚ್ಚು',
  'guide.loadingPortal': 'ಮಾರ್ಗದರ್ಶಿ ಪೋರ್ಟಲ್ ಲೋಡ್...', 'guide.addTourist': 'ಪ್ರವಾಸಿ ಸೇರಿಸಿ',
  'guide.noNotifications': 'ಎಲ್ಲ ಸರಿ! ಹೊಸ ಅಧಿಸೂಚನೆ ಇಲ್ಲ.',
  'admin.panel': 'ನಿರ್ವಾಹಕ ಫಲಕ', 'admin.commandCenter': 'ನಿರ್ವಾಹಕ ಫಲಕ',
  'admin.activeSOS': 'ಸಕ್ರಿಯ SOS', 'admin.emergencyDispatch': 'ತುರ್ತು ಡಿಸ್ಪ್ಯಾಚ್',
  'admin.signOut': 'ಸೈನ್ ಔಟ್', 'admin.selectLanguage': 'ಇಂಟರ್‌ಫೇಸ್ ಭಾಷೆ',
  'status.safe': 'ಸುರಕ್ಷಿತ', 'status.caution': 'ಎಚ್ಚರಿಕೆ', 'status.atRisk': 'ಅಪಾಯ',
  'settings.title': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'settings.saveSettings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸು', 'settings.saved': 'ಸೇವ್!',
};


// ─────────────────────────────────────────────────────────────
// Malayalam (മലയാളം)
// ─────────────────────────────────────────────────────────────
const ml: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'വിനോദ സഞ്ചാരി സുരക്ഷ',
  'common.save': 'സേവ്', 'common.cancel': 'റദ്ദ്', 'common.close': 'അടയ്ക്കുക',
  'common.edit': 'എഡിറ്റ്', 'common.logout': 'ലോഗ് ഔട്ട്', 'common.back': 'ഹോമിലേക്ക്',
  'common.submit': 'സമർപ്പിക്കുക', 'common.loading': 'ലോഡ്...', 'common.settings': 'ക്രമീകരണങ്ങൾ',
  'common.profile': 'പ്രൊഫൈൽ', 'common.notifications': 'അറിയിപ്പുകൾ', 'common.language': 'ഭാഷ',
  'common.interfaceLanguage': 'ഇന്റർഫേസ് ഭാഷ', 'common.name': 'പൂർണ്ണ നാമം',
  'common.email': 'ഇമെയിൽ വിലാസം', 'common.mobile': 'മൊബൈൽ നമ്പർ', 'common.password': 'പാസ്‌വേഡ്',
  'nav.dashboard': 'ഡാഷ്‌ബോർഡ്', 'nav.messages': 'സന്ദേശങ്ങൾ', 'nav.report': 'സംഭവ റിപ്പോർട്ട്',
  'nav.profile': 'പ്രൊഫൈൽ', 'nav.overview': 'അവലോകനം', 'nav.myGroup': 'എന്റെ ഗ്രൂപ്പ്',
  'nav.chat': 'ചാറ്റ്', 'nav.tourists': 'സഞ്ചാരികൾ', 'nav.inbox': 'ഇൻബോക്സ്', 'nav.guides': 'ഗൈഡുകൾ',
  'auth.adminLogin': 'അഡ്മിൻ ലോഗിൻ', 'auth.guideLogin': 'ഗൈഡ് ലോഗിൻ',
  'auth.loginBtn': 'ലോഗിൻ', 'auth.backHome': 'ഹോമിലേക്ക്',
  'tourist.safety': 'വിനോദ സഞ്ചാരി സുരക്ഷ', 'tourist.namaskar': 'നമസ്കാരം',
  'tourist.liveGpsActive': 'ലൈവ് GPS സജീവം', 'tourist.logOut': 'ലോഗ് ഔട്ട്',
  'tourist.sos.heading': 'അടിയന്തര SOS', 'tourist.sos.trigger': 'SOS അയയ്ക്കുക',
  'tourist.sos.dispatched': 'SOS മുന്നറിയിപ്പ് അയച്ചു!',
  'gps.liveActive': 'ലൈവ് GPS സജീവം', 'gps.copy': 'കോപ്പി', 'gps.copied': 'കോപ്പി ആയി',
  'gps.recenter': 'റീസെൻ്റർ', 'gps.enableBtn': 'ലൈവ് ലൊക്കേഷൻ',
  'gpsModal.title': 'ലൈവ് GPS സുരക്ഷ', 'gpsModal.allow': 'ലൈവ് ലൊക്കേഷൻ അനുവദിക്കുക',
  'gpsModal.skip': 'ഇപ്പോൾ ഒഴിവാക്കുക',
  'messages.inbox': 'ഇൻബോക്സ്', 'messages.typeMessage': 'സന്ദേശം ടൈപ്പ്...',
  'profile.title': 'വ്യക്തിഗത സുരക്ഷ', 'profile.editBtn': 'പ്രൊഫൈൽ എഡിറ്റ്',
  'profile.saveChanges': 'മാറ്റങ്ങൾ സേവ്', 'profile.updateSuccess': 'പ്രൊഫൈൽ അപ്ഡേറ്റ് ആയി!',
  'report.title': 'സംഭവം റിപ്പോർട്ട്', 'report.descPlaceholder': 'സംഭവം വിശദീകരിക്കുക...',
  'report.submitBtn': 'റിപ്പോർട്ട് സമർപ്പിക്കുക', 'report.successToast': 'റിപ്പോർട്ട് സമർപ്പിച്ചു.',
  'report.low': 'കുറഞ്ഞ', 'report.medium': 'ഇടത്തരം', 'report.high': 'ഉയർന്ന',
  'guide.loadingPortal': 'ഗൈഡ് പോർട്ടൽ ലോഡ്...', 'guide.addTourist': 'സഞ്ചാരി ചേർക്കുക',
  'guide.noNotifications': 'എല്ലാം ശരി! പുതിയ അറിയിപ്പ് ഇല്ല.',
  'admin.panel': 'അഡ്മിൻ പാനൽ', 'admin.commandCenter': 'അഡ്മിൻ പാനൽ',
  'admin.activeSOS': 'സജീവ SOS', 'admin.emergencyDispatch': 'അടിയന്തര ഡിസ്‌പാച്ച്',
  'admin.signOut': 'സൈൻ ഔട്ട്', 'admin.selectLanguage': 'ഇന്റർഫേസ് ഭാഷ',
  'status.safe': 'സുരക്ഷിതം', 'status.caution': 'ജാഗ്രത', 'status.atRisk': 'അപകടം',
  'settings.title': 'ക്രമീകരണങ്ങൾ', 'settings.saveSettings': 'ക്രമീകരണം സേവ്', 'settings.saved': 'സേവ്!',
};

// ─────────────────────────────────────────────────────────────
// Punjabi (ਪੰਜਾਬੀ)
// ─────────────────────────────────────────────────────────────
const pa: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'ਸੈਲਾਨੀ ਸੁਰੱਖਿਆ',
  'common.save': 'ਸੇਵ', 'common.cancel': 'ਰੱਦ', 'common.close': 'ਬੰਦ ਕਰੋ',
  'common.edit': 'ਸੰਪਾਦਿਤ', 'common.logout': 'ਲੌਗ ਆਊਟ', 'common.back': 'ਘਰ ਵਾਪਸ',
  'common.submit': 'ਜਮਾਂ ਕਰੋ', 'common.loading': 'ਲੋਡ...', 'common.settings': 'ਸੈਟਿੰਗਾਂ',
  'common.profile': 'ਪ੍ਰੋਫਾਈਲ', 'common.notifications': 'ਸੂਚਨਾਵਾਂ', 'common.language': 'ਭਾਸ਼ਾ',
  'common.interfaceLanguage': 'ਇੰਟਰਫੇਸ ਭਾਸ਼ਾ', 'common.name': 'ਪੂਰਾ ਨਾਮ',
  'common.email': 'ਈਮੇਲ', 'common.mobile': 'ਮੋਬਾਈਲ ਨੰਬਰ', 'common.password': 'ਪਾਸਵਰਡ',
  'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ', 'nav.messages': 'ਸੁਨੇਹੇ', 'nav.report': 'ਘਟਨਾ ਰਿਪੋਰਟ',
  'nav.profile': 'ਪ੍ਰੋਫਾਈਲ', 'nav.overview': 'ਜਾਇਜ਼ਾ', 'nav.myGroup': 'ਮੇਰਾ ਗਰੁੱਪ',
  'nav.chat': 'ਚੈਟ', 'nav.tourists': 'ਸੈਲਾਨੀ', 'nav.inbox': 'ਇਨਬਾਕਸ', 'nav.guides': 'ਗਾਈਡ',
  'auth.adminLogin': 'ਪ੍ਰਬੰਧਕ ਲੌਗਿਨ', 'auth.guideLogin': 'ਗਾਈਡ ਲੌਗਿਨ',
  'auth.loginBtn': 'ਲੌਗਿਨ', 'auth.backHome': 'ਘਰ ਵਾਪਸ',
  'tourist.safety': 'ਸੈਲਾਨੀ ਸੁਰੱਖਿਆ', 'tourist.namaskar': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
  'tourist.liveGpsActive': 'ਲਾਈਵ GPS ਸਰਗਰਮ', 'tourist.logOut': 'ਲੌਗ ਆਊਟ',
  'tourist.sos.heading': 'ਤੁਰੰਤ ਐਮਰਜੈਂਸੀ SOS', 'tourist.sos.trigger': 'SOS ਭੇਜੋ',
  'tourist.sos.dispatched': 'SOS ਚੇਤਾਵਨੀ ਭੇਜੀ!',
  'gps.liveActive': 'ਲਾਈਵ GPS ਸਰਗਰਮ', 'gps.copy': 'ਕਾਪੀ', 'gps.copied': 'ਕਾਪੀ ਹੋਈ',
  'gps.recenter': 'ਰੀਸੈਂਟਰ', 'gps.enableBtn': 'ਲਾਈਵ ਲੋਕੇਸ਼ਨ',
  'gpsModal.title': 'ਲਾਈਵ GPS ਸੁਰੱਖਿਆ', 'gpsModal.allow': 'ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਇਜਾਜ਼ਤ',
  'gpsModal.skip': 'ਹੁਣ ਛੱਡੋ',
  'messages.inbox': 'ਇਨਬਾਕਸ', 'messages.typeMessage': 'ਸੁਨੇਹਾ ਟਾਈਪ...',
  'profile.title': 'ਨਿੱਜੀ ਸੁਰੱਖਿਆ ਜਾਣਕਾਰੀ', 'profile.editBtn': 'ਪ੍ਰੋਫਾਈਲ ਸੰਪਾਦਿਤ',
  'profile.saveChanges': 'ਬਦਲਾਅ ਸੇਵ', 'profile.updateSuccess': 'ਪ੍ਰੋਫਾਈਲ ਅੱਪਡੇਟ!',
  'report.title': 'ਘਟਨਾ ਰਿਪੋਰਟ', 'report.descPlaceholder': 'ਘਟਨਾ ਦੱਸੋ...',
  'report.submitBtn': 'ਰਿਪੋਰਟ ਜਮਾਂ', 'report.successToast': 'ਰਿਪੋਰਟ ਜਮਾਂ ਹੋਈ।',
  'report.low': 'ਘੱਟ', 'report.medium': 'ਦਰਮਿਆਨਾ', 'report.high': 'ਵੱਧ',
  'guide.loadingPortal': 'ਗਾਈਡ ਪੋਰਟਲ ਲੋਡ...', 'guide.addTourist': 'ਸੈਲਾਨੀ ਜੋੜੋ',
  'guide.noNotifications': 'ਸਭ ਠੀਕ! ਨਵੀਂ ਸੂਚਨਾ ਨਹੀਂ।',
  'admin.panel': 'ਪ੍ਰਬੰਧਕ ਪੈਨਲ', 'admin.commandCenter': 'ਪ੍ਰਬੰਧਕ ਪੈਨਲ',
  'admin.activeSOS': 'ਸਰਗਰਮ SOS', 'admin.emergencyDispatch': 'ਐਮਰਜੈਂਸੀ ਡਿਸਪੈਚ',
  'admin.signOut': 'ਸਾਈਨ ਆਊਟ', 'admin.selectLanguage': 'ਇੰਟਰਫੇਸ ਭਾਸ਼ਾ',
  'status.safe': 'ਸੁਰੱਖਿਅਤ', 'status.caution': 'ਸਾਵਧਾਨੀ', 'status.atRisk': 'ਖ਼ਤਰਾ',
  'settings.title': 'ਸੈਟਿੰਗਾਂ', 'settings.saveSettings': 'ਸੈਟਿੰਗ ਸੇਵ', 'settings.saved': 'ਸੇਵ!',
};

// ─────────────────────────────────────────────────────────────
// Odia (ଓଡ଼ିଆ)
// ─────────────────────────────────────────────────────────────
const or_lang: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'ପର୍ଯ୍ୟଟକ ସୁରକ୍ଷା',
  'common.save': 'ସଞ୍ଚୟ', 'common.cancel': 'ବାତିଲ', 'common.close': 'ବନ୍ଦ',
  'common.logout': 'ଲଗ ଆଉଟ', 'common.settings': 'ସେଟିଂ', 'common.profile': 'ପ୍ରୋଫାଇଲ',
  'common.notifications': 'ବିଜ୍ଞପ୍ତି', 'common.language': 'ଭାଷା', 'common.interfaceLanguage': 'ଇଣ୍ଟର୍‌ଫେସ ଭାଷା',
  'nav.dashboard': 'ଡ୍ୟାଶ୍‌ବୋର୍ଡ', 'nav.messages': 'ବାର୍ତ୍ତା', 'nav.report': 'ଘଟଣା ରିପୋର୍ଟ',
  'nav.profile': 'ପ୍ରୋଫାଇଲ', 'nav.overview': 'ସଂକ୍ଷିପ୍ତ', 'nav.chat': 'ଚ୍ୟାଟ',
  'auth.loginBtn': 'ଲଗଇନ', 'auth.backHome': 'ଘରକୁ ଫେରନ୍ତୁ',
  'tourist.safety': 'ପର୍ଯ୍ୟଟକ ସୁରକ୍ଷା', 'tourist.namaskar': 'ନମସ୍କାର',
  'tourist.sos.trigger': 'SOS ପଠାନ୍ତୁ', 'tourist.sos.dispatched': 'SOS ଚେତାବନୀ ପଠାଯାଇଛି!',
  'gps.copy': 'କପି', 'gps.copied': 'କପି ହୋଇଛି', 'gps.recenter': 'ପୁଣି କେନ୍ଦ୍ର',
  'messages.inbox': 'ଇନ୍‌ବକ୍ସ', 'messages.typeMessage': 'ବାର୍ତ୍ତା ଟାଇପ...',
  'profile.editBtn': 'ସଂପାଦନ', 'profile.saveChanges': 'ପରିବର୍ତ୍ତନ ସଞ୍ଚୟ', 'profile.updateSuccess': 'ପ୍ରୋଫାଇଲ ଅପଡେଟ!',
  'report.title': 'ଘଟଣା ରିପୋର୍ଟ', 'report.submitBtn': 'ଦାଖଲ', 'report.successToast': 'ରିପୋର୍ଟ ଦାଖଲ ହୋଇଛି।',
  'report.low': 'କମ', 'report.medium': 'ମଧ୍ୟମ', 'report.high': 'ଅଧିକ',
  'admin.panel': 'ଆଡ୍ମିନ ପ୍ୟାନେଲ', 'admin.signOut': 'ସାଇନ ଆଉଟ', 'admin.selectLanguage': 'ଇଣ୍ଟର୍‌ଫେସ ଭାଷା',
  'status.safe': 'ସୁରକ୍ଷିତ', 'status.caution': 'ସାବଧାନ', 'status.atRisk': 'ବିପଦ',
  'settings.title': 'ସେଟିଂ', 'settings.saveSettings': 'ସେଟିଂ ସଞ୍ଚୟ', 'settings.saved': 'ସଞ୍ଚୟ!',
};

// ─────────────────────────────────────────────────────────────
// Assamese (অসমীয়া)
// ─────────────────────────────────────────────────────────────
const as_lang: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'পৰ্যটক সুৰক্ষা',
  'common.save': 'সংৰক্ষণ', 'common.cancel': 'বাতিল', 'common.close': 'বন্ধ',
  'common.logout': 'লগ আউট', 'common.settings': 'ছেটিং', 'common.profile': 'প্ৰফাইল',
  'common.notifications': 'জাননী', 'common.language': 'ভাষা', 'common.interfaceLanguage': 'ইন্টাৰফেচ ভাষা',
  'nav.dashboard': 'ডেছবোৰ্ড', 'nav.messages': 'বাৰ্তা', 'nav.report': 'ঘটনা প্ৰতিবেদন',
  'nav.profile': 'প্ৰফাইল', 'nav.overview': 'সংক্ষিপ্ত', 'nav.chat': 'চ্যাট',
  'auth.loginBtn': 'লগইন', 'auth.backHome': 'ঘৰলৈ',
  'tourist.safety': 'পৰ্যটক সুৰক্ষা', 'tourist.namaskar': 'নমস্কাৰ',
  'tourist.sos.trigger': 'SOS পঠাওক', 'tourist.sos.dispatched': 'SOS সতৰ্কতা পঠোৱা হৈছে!',
  'gps.copy': 'কপি', 'gps.copied': 'কপি হ\'ল', 'gps.recenter': 'পুনৰ কেন্দ্ৰিত',
  'messages.inbox': 'ইনবক্স', 'messages.typeMessage': 'বাৰ্তা টাইপ...',
  'profile.editBtn': 'সম্পাদনা', 'profile.saveChanges': 'সলনি সংৰক্ষণ', 'profile.updateSuccess': 'প্ৰফাইল আপডেট!',
  'report.title': 'ঘটনা প্ৰতিবেদন', 'report.submitBtn': 'দাখিল', 'report.successToast': 'প্ৰতিবেদন দাখিল হ\'ল।',
  'report.low': 'কম', 'report.medium': 'মধ্যম', 'report.high': 'অধিক',
  'admin.panel': 'এডমিন পেনেল', 'admin.signOut': 'চাইন আউট', 'admin.selectLanguage': 'ইন্টাৰফেচ ভাষা',
  'status.safe': 'সুৰক্ষিত', 'status.caution': 'সাৱধান', 'status.atRisk': 'বিপদ',
  'settings.title': 'ছেটিং', 'settings.saveSettings': 'ছেটিং সংৰক্ষণ', 'settings.saved': 'সংৰক্ষিত!',
};

// ─────────────────────────────────────────────────────────────
// Urdu (اردو) — RTL
// ─────────────────────────────────────────────────────────────
const ur: Partial<Record<TranslationKey, string>> = {
  'app.tagline': 'سیاحتی تحفظ',
  'common.save': 'محفوظ', 'common.cancel': 'منسوخ', 'common.close': 'بند',
  'common.edit': 'ترمیم', 'common.logout': 'لاگ آؤٹ', 'common.back': 'ہوم پر واپس',
  'common.submit': 'جمع', 'common.loading': 'لوڈ...', 'common.settings': 'ترتیبات',
  'common.profile': 'پروفائل', 'common.notifications': 'اطلاعات', 'common.language': 'زبان',
  'common.interfaceLanguage': 'انٹرفیس زبان', 'common.name': 'پورا نام',
  'common.email': 'ای میل', 'common.mobile': 'موبائل نمبر', 'common.password': 'پاس ورڈ',
  'nav.dashboard': 'ڈیش بورڈ', 'nav.messages': 'پیغامات', 'nav.report': 'واقعہ رپورٹ',
  'nav.profile': 'پروفائل', 'nav.overview': 'جائزہ', 'nav.myGroup': 'میرا گروپ',
  'nav.chat': 'چیٹ', 'nav.tourists': 'سیاح', 'nav.inbox': 'ان باکس', 'nav.guides': 'گائیڈز',
  'nav.exitAdmin': 'ایڈمن سے نکلیں', 'nav.exitGuide': 'گائیڈ سے نکلیں',
  'auth.adminLogin': 'ایڈمن لاگ ان', 'auth.guideLogin': 'گائیڈ لاگ ان',
  'auth.loginBtn': 'لاگ ان', 'auth.backHome': 'ہوم پر واپس',
  'auth.invalidCreds': 'غلط صارف نام یا پاس ورڈ',
  'tourist.safety': 'سیاحتی تحفظ', 'tourist.namaskar': 'آداب',
  'tourist.liveGpsActive': 'لائیو GPS فعال', 'tourist.logOut': 'لاگ آؤٹ',
  'tourist.sos.heading': 'فوری ہنگامی SOS', 'tourist.sos.trigger': 'SOS بھیجیں',
  'tourist.sos.dispatched': 'SOS الرٹ بھیج دیا گیا!', 'tourist.sos.transmitting': 'SOS بھیج رہے ہیں...',
  'gps.liveActive': 'لائیو GPS فعال', 'gps.copy': 'کاپی', 'gps.copied': 'کاپی ہوگئی',
  'gps.recenter': 'دوبارہ مرکز', 'gps.enableBtn': 'لائیو مقام فعال',
  'gpsModal.title': 'لائیو GPS تحفظ', 'gpsModal.allow': 'مقام تک رسائی دیں',
  'gpsModal.skip': 'ابھی چھوڑیں',
  'messages.inbox': 'ان باکس', 'messages.typeMessage': 'پیغام لکھیں...',
  'profile.title': 'ذاتی حفاظتی معلومات', 'profile.editBtn': 'پروفائل ترمیم',
  'profile.saveChanges': 'تبدیلیاں محفوظ', 'profile.updateSuccess': 'پروفائل اپڈیٹ ہوگئی!',
  'report.title': 'واقعہ رپورٹ', 'report.descPlaceholder': 'واقعہ بیان کریں...',
  'report.submitBtn': 'رپورٹ جمع', 'report.successToast': 'رپورٹ جمع ہوگئی۔ ٹیم کو اطلاع دی گئی۔',
  'report.low': 'کم', 'report.medium': 'درمیانہ', 'report.high': 'زیادہ',
  'guide.loadingPortal': 'گائیڈ پورٹل لوڈ...', 'guide.addTourist': 'سیاح شامل',
  'guide.noNotifications': 'سب ٹھیک! کوئی نئی اطلاع نہیں۔',
  'admin.panel': 'ایڈمن پینل', 'admin.commandCenter': 'ایڈمن پینل',
  'admin.activeSOS': 'فعال SOS', 'admin.emergencyDispatch': 'ہنگامی اعزام',
  'admin.signOut': 'سائن آؤٹ', 'admin.selectLanguage': 'انٹرفیس زبان',
  'status.safe': 'محفوظ', 'status.caution': 'احتیاط', 'status.atRisk': 'خطرہ',
  'status.sos': 'ہنگامی SOS', 'status.restricted': 'پابندی',
  'settings.title': 'ترتیبات', 'settings.saveSettings': 'ترتیبات محفوظ', 'settings.saved': 'محفوظ!',
};


// ─────────────────────────────────────────────────────────────
// Translation map — maps language codes to their translation objects
// To add a new language: add its entry here
// ─────────────────────────────────────────────────────────────
const TRANSLATIONS: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  en, hi, mr, bn, gu, ta, te, kn, ml, pa,
  or: or_lang,
  as: as_lang,
  ur,
};

// ─────────────────────────────────────────────────────────────
// Core translate function — falls back to English for missing keys
// ─────────────────────────────────────────────────────────────
export function translate(lang: LanguageCode, key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = TRANSLATIONS[lang] || {};
  let text: string = (dict[key] as string) || (en[key] as string) || key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}

// ─────────────────────────────────────────────────────────────
// Persistence helpers — use localStorage keyed by role so each
// Tourist / Guide / Admin can have an independent language choice
// ─────────────────────────────────────────────────────────────
export type UserRole = 'tourist' | 'guide' | 'admin';

const STORAGE_KEY = (role: UserRole) => `safeyatra_lang_${role}`;

export function getStoredLanguage(role: UserRole): LanguageCode {
  try {
    const val = localStorage.getItem(STORAGE_KEY(role));
    if (val && SUPPORTED_LANGUAGES.some(l => l.code === val)) return val as LanguageCode;
  } catch {}
  return 'en';
}

export function setStoredLanguage(role: UserRole, code: LanguageCode): void {
  try { localStorage.setItem(STORAGE_KEY(role), code); } catch {}
}

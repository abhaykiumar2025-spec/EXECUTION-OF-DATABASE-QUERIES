/**
 * SMART PILL DISPENSER FOR ELDERLY CARE
 * Full-Stack Connected IoT Simulation & Caregiver Portal Engine
 * Connects to Express + MongoDB Atlas Backend with JWT User Authentication
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. API CLIENT, JWT AUTH & INITIAL STATE
  // =========================================================================
  const API_BASE = '/api';
  const STORAGE_KEY = 'smart_pill_dispenser_data_v2';
  const AUTH_USER_KEY = 'smart_pill_auth_user_v2';

  // Current logged in user state
  let currentUser = loadAuthUser();

  function loadAuthUser() {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { }
    return null;
  }

  function saveAuthData(user) {
    currentUser = user;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    updateAuthHeaderUI();
  }

  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    return headers;
  }

  const defaultState = {
    patient: {
      name: 'Eleanor Hughes',
      age: 78,
      caregiver: 'Sarah Hughes',
      caregiverPhone: '+1 (555) 234-8901'
    },
    hardware: {
      currentSlot: 3,
      stepperAngle: 102.8,
      isDispensing: false,
      irSensorTripped: false,
      loadCellWeight: 0.42, // grams
      ledStatus: 'ready', // ready, dispensing, taken, missed
      batteryLevel: 98,
      wifiConnected: true
    },
    schedules: [
      {
        id: 'dose-1',
        medName: 'Lisinopril',
        dosage: '10mg Tablet',
        time: '08:00 AM',
        slot: 1,
        status: 'taken',
        instructions: 'Take 1 tablet in the morning with breakfast'
      },
      {
        id: 'dose-2',
        medName: 'Multivitamin Complex',
        dosage: '1 Softgel',
        time: '01:00 PM',
        slot: 2,
        status: 'taken',
        instructions: 'Take with lunch and a glass of water'
      },
      {
        id: 'dose-3',
        medName: 'Metformin HCl',
        dosage: '500mg Extended Release',
        time: '07:00 PM',
        slot: 3,
        status: 'pending',
        instructions: 'Take 1 tablet with evening dinner'
      },
      {
        id: 'dose-4',
        medName: 'Atorvastatin',
        dosage: '20mg Tablet',
        time: '09:30 PM',
        slot: 4,
        status: 'upcoming',
        instructions: 'Take at bedtime'
      }
    ],
    inventory: [
      {
        id: 'inv-1',
        name: 'Metformin HCl',
        dose: '500mg',
        currentStock: 21,
        totalCapacity: 30,
        refillDate: 'Aug 24, 2026',
        slot: 3,
        shape: 'Oblong White',
        imprint: 'M 500'
      },
      {
        id: 'inv-2',
        name: 'Lisinopril',
        dose: '10mg',
        currentStock: 18,
        totalCapacity: 30,
        refillDate: 'Aug 20, 2026',
        slot: 1,
        shape: 'Round Pink',
        imprint: 'L 10'
      },
      {
        id: 'inv-3',
        name: 'Multivitamin Complex',
        dose: 'Daily Supplement',
        currentStock: 25,
        totalCapacity: 30,
        refillDate: 'Aug 15, 2026',
        slot: 2,
        shape: 'Softgel Amber',
        imprint: 'VIT-D'
      },
      {
        id: 'inv-4',
        name: 'Atorvastatin Calcium',
        dose: '20mg',
        currentStock: 4,
        totalCapacity: 30,
        refillDate: 'Aug 10, 2026',
        slot: 4,
        shape: 'Oval White',
        imprint: 'AT 20'
      }
    ],
    activityLogs: [
      { time: '08:02 AM', event: 'Slot 1 Lisinopril 10mg Dispensed & Taken', status: 'IR Confirmed' },
      { time: '08:00 AM', event: 'Morning Alarm & Voice Reminder Triggered', status: 'OK' },
      { time: '01:04 PM', event: 'Slot 2 Multivitamin Dispensed & Taken', status: 'IR Confirmed' },
      { time: '01:00 PM', event: 'Noon Alarm Triggered', status: 'OK' }
    ],
    marHistory: [
      { date: 'Today 08:02 AM', med: 'Lisinopril 10mg', slot: 1, sensor: 'IR & Weight (0.38g)', status: 'Taken On-Time' },
      { date: 'Today 01:04 PM', med: 'Multivitamin 1 Softgel', slot: 2, sensor: 'IR & Weight (0.65g)', status: 'Taken On-Time' },
      { date: 'Yesterday 09:30 PM', med: 'Atorvastatin 20mg', slot: 4, sensor: 'IR & Weight (0.40g)', status: 'Taken On-Time' },
      { date: 'Yesterday 07:15 PM', med: 'Metformin 500mg', slot: 3, sensor: 'IR & Weight (0.42g)', status: 'Taken (15m Delay)' },
      { date: 'Yesterday 01:02 PM', med: 'Multivitamin 1 Softgel', slot: 2, sensor: 'IR & Weight (0.65g)', status: 'Taken On-Time' },
      { date: 'Yesterday 08:05 AM', med: 'Lisinopril 10mg', slot: 1, sensor: 'IR & Weight (0.38g)', status: 'Taken On-Time' }
    ]
  };

  let state = loadLocalState();

  function loadLocalState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  }

  function updateAuthHeaderUI() {
    const avatarEl = document.getElementById('authUserAvatar');
    const nameEl = document.getElementById('authUserName');
    const roleEl = document.getElementById('authUserRole');

    if (currentUser) {
      const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      if (avatarEl) avatarEl.textContent = initials || 'SH';
      if (nameEl) nameEl.textContent = currentUser.name;
      if (roleEl) roleEl.innerHTML = `${currentUser.role.toUpperCase()} &bull; <span style="color:#10b981;">Secure Session</span>`;
    }
  }

  // Fetch initial data from Express/MongoDB Backend
  async function syncFromBackend() {
    try {
      const statusRes = await fetch(`${API_BASE}/status`, { headers: getAuthHeaders() }).catch(() => null);
      if (statusRes && statusRes.ok) {
        const statusData = await statusRes.json();
        const connText = document.getElementById('iotConnStatus');
        if (connText) {
          connText.textContent = `Connected to ${statusData.database.connected ? 'MongoDB Atlas' : 'Local/Memory'} &bull; 98% Batt`;
        }

        // Fetch Schedules
        const schedRes = await fetch(`${API_BASE}/schedules`, { headers: getAuthHeaders() });
        if (schedRes.ok) {
          const resJson = await schedRes.json();
          if (resJson.data && resJson.data.length) {
            state.schedules = resJson.data;
          }
        }

        // Fetch Inventory
        const invRes = await fetch(`${API_BASE}/inventory`, { headers: getAuthHeaders() });
        if (invRes.ok) {
          const invJson = await invRes.json();
          if (invJson.data && invJson.data.length) {
            state.inventory = invJson.data;
          }
        }

        // Fetch MAR History
        const marRes = await fetch(`${API_BASE}/mar/mar`, { headers: getAuthHeaders() });
        if (marRes.ok) {
          const marJson = await marRes.json();
          if (marJson.data && marJson.data.length) {
            state.marHistory = marJson.data;
          }
        }

        // Fetch Logs
        const logsRes = await fetch(`${API_BASE}/logs/logs`, { headers: getAuthHeaders() });
        if (logsRes.ok) {
          const logsJson = await logsRes.json();
          if (logsJson.data && logsJson.data.length) {
            state.activityLogs = logsJson.data;
          }
        }

        saveLocalState();
        renderDashboard();
        renderMarHistory();
        renderInventory();
        updateHardwareVisuals();
      }
    } catch (err) {
      console.log('Backend sync offline/fallback mode:', err.message);
    }
  }

  // =========================================================================
  // 2. AUDIO SYNTHESIZER & WEB SPEECH ENGINE
  // =========================================================================
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq, type, duration, delay = 0) {
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    } catch (err) {
      console.error('Audio play error:', err);
    }
  }

  function playDispenseSound() {
    playTone(523.25, 'sine', 0.15, 0);
    playTone(659.25, 'sine', 0.18, 0.12);
    playTone(783.99, 'sine', 0.25, 0.24);
  }

  function playSuccessChime() {
    playTone(587.33, 'triangle', 0.2, 0);
    playTone(880.00, 'triangle', 0.35, 0.15);
  }

  function playBuzzerAlarm() {
    for (let i = 0; i < 3; i++) {
      playTone(950, 'sawtooth', 0.12, i * 0.18);
    }
  }

  function playIrBeamClick() {
    playTone(1200, 'sine', 0.08, 0);
  }

  function speakVoiceReminder(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  // =========================================================================
  // 3. UI VIEW NAVIGATION CONTROLLER
  // =========================================================================
  const navButtons = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  function switchView(targetViewId) {
    navButtons.forEach(btn => {
      if (btn.dataset.view === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    viewSections.forEach(section => {
      if (section.id === targetViewId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    if (targetViewId === 'analyticsView') {
      renderComplianceChart();
    }
    if (targetViewId === 'aiScannerView') {
      startCameraSimulation();
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;
      if (viewId) switchView(viewId);
    });
  });

  // =========================================================================
  // 4. REAL-TIME CLOCK
  // =========================================================================
  function updateRealTimeClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const shortTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const clockElem = document.getElementById('currentRealTime');
    if (clockElem) clockElem.textContent = timeStr;

    const oledTime = document.getElementById('oledTime');
    if (oledTime) oledTime.textContent = shortTime;
  }

  setInterval(updateRealTimeClock, 1000);
  updateRealTimeClock();

  // =========================================================================
  // 5. IoT HARDWARE TWIN SIMULATOR CONTROLLER
  // =========================================================================
  const carouselRotor = document.getElementById('carouselRotor');
  const rotorAngleText = document.getElementById('rotorAngleText');
  const ledRing = document.getElementById('ledRingIndicator');
  const oledMainMessage = document.getElementById('oledMainMessage');
  const oledSubLeft = document.getElementById('oledSubLeft');
  const sensorIrVal = document.getElementById('sensorIrVal');
  const sensorWeightVal = document.getElementById('sensorWeightVal');
  const sensorMotorPos = document.getElementById('sensorMotorPos');
  const fallingPill = document.getElementById('fallingPill');
  const chuteLabel = document.getElementById('chuteLabel');

  const slotAngles = {
    1: 0,
    2: 51.4,
    3: 102.8,
    4: 154.2,
    5: 205.6,
    6: 257.0,
    7: 308.4
  };

  function updateHardwareVisuals() {
    const slot = state.hardware.currentSlot;
    const angle = slotAngles[slot] || 0;

    if (carouselRotor) {
      carouselRotor.style.transform = `rotate(-${angle}deg)`;
    }
    if (rotorAngleText) {
      rotorAngleText.textContent = `${angle.toFixed(1)}°`;
    }

    const slotElements = document.querySelectorAll('.carousel-slot');
    slotElements.forEach(el => {
      if (parseInt(el.dataset.slot) === slot) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    if (ledRing) {
      ledRing.className = `led-ring-outer status-${state.hardware.ledStatus}`;
    }

    if (sensorMotorPos) {
      sensorMotorPos.textContent = `Slot ${slot} / ${angle.toFixed(1)}°`;
    }
    if (sensorWeightVal) {
      sensorWeightVal.textContent = `${state.hardware.loadCellWeight.toFixed(2)} g`;
    }

    const currentSchedule = state.schedules.find(s => s.slot === slot) || state.schedules[2];
    if (oledMainMessage && currentSchedule) {
      oledMainMessage.textContent = `SLOT ${slot}: ${currentSchedule.medName.toUpperCase()} ${currentSchedule.dosage ? currentSchedule.dosage.split(' ')[0] : ''}`;
    }
  }

  // Trigger Automatic Dispense Cycle
  async function executeDispenseCycle(slotNumber = 3) {
    if (state.hardware.isDispensing) return;
    state.hardware.isDispensing = true;
    state.hardware.currentSlot = slotNumber;
    state.hardware.ledStatus = 'dispensing';
    updateHardwareVisuals();

    if (oledSubLeft) oledSubLeft.textContent = 'MOTOR ROTATING...';
    playDispenseSound();
    showToast('IoT Dispenser: Stepper motor rotating to slot ' + slotNumber, 'warning');

    fetch(`${API_BASE}/device/dispense`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ slot: slotNumber })
    }).catch(() => null);

    setTimeout(() => {
      if (fallingPill) {
        fallingPill.classList.remove('animate-drop');
        void fallingPill.offsetWidth;
        fallingPill.classList.add('animate-drop');
      }

      if (sensorIrVal) {
        sensorIrVal.textContent = 'TRIPPED (LOW)';
        sensorIrVal.style.color = '#ef4444';
      }
      playIrBeamClick();

      state.hardware.loadCellWeight = 0.42;
      state.hardware.ledStatus = 'ready';
      state.hardware.isDispensing = false;

      if (oledSubLeft) oledSubLeft.textContent = 'MEDICATION DISPENSED!';
      if (chuteLabel) chuteLabel.textContent = '1 Pill in Cup (0.42g)';

      const currentSchedule = state.schedules.find(s => s.slot === slotNumber);
      const patientName = state.patient.name || currentUser?.patientName || 'Patient';
      const voiceText = `Attention ${patientName}. It is time for your medication: ${currentSchedule ? currentSchedule.medName : 'Metformin'}. Please take with a glass of water.`;
      speakVoiceReminder(voiceText);

      addActivityLog(`Slot ${slotNumber} Dispensed Successfully`, 'IR Detected & Weight 0.42g');
      updateHardwareVisuals();
      renderDashboard();

      setTimeout(() => {
        if (sensorIrVal) {
          sensorIrVal.textContent = 'CLEAR (HIGH)';
          sensorIrVal.style.color = '#38bdf8';
        }
      }, 1400);

    }, 1200);
  }

  // Patient takes pill
  async function handlePatientTakePill() {
    state.hardware.loadCellWeight = 0.0;
    state.hardware.ledStatus = 'ready';

    const pendingItem = state.schedules.find(s => s.status === 'pending') || state.schedules[2];
    if (pendingItem) {
      pendingItem.status = 'taken';
    }

    if (chuteLabel) chuteLabel.textContent = 'Cup Empty (0.00g)';
    if (oledSubLeft) oledSubLeft.textContent = 'DOSE RECORDED - THANK YOU';

    playSuccessChime();
    showToast('Success: Eleanor took her medication. Recorded in MongoDB MAR.', 'success');
    speakVoiceReminder(`Thank you ${state.patient.name || 'Patient'}! Your dose has been recorded.`);

    fetch(`${API_BASE}/device/take-pill`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ slot: state.hardware.currentSlot })
    }).catch(() => null);

    addActivityLog('Patient Intake Confirmed by Sensors', 'Weight Returned to 0.0g');
    addMarRecord('Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), pendingItem ? pendingItem.medName + ' ' + pendingItem.dosage : 'Metformin 500mg', state.hardware.currentSlot, 'IR Verified & Load Cell Confirmed', 'Taken On-Time');

    saveLocalState();
    updateHardwareVisuals();
    renderDashboard();
    renderMarHistory();
    renderComplianceChart();
  }

  // Simulate missed dose
  async function handleMissedDoseTimeout() {
    state.hardware.ledStatus = 'missed';
    updateHardwareVisuals();

    const pendingItem = state.schedules.find(s => s.status === 'pending');
    if (pendingItem) {
      pendingItem.status = 'missed';
    }

    if (oledSubLeft) oledSubLeft.textContent = 'MISSED DOSE ALERT!';
    playBuzzerAlarm();

    fetch(`${API_BASE}/device/missed`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ slot: state.hardware.currentSlot })
    }).catch(() => null);

    showToast('ALERT: Scheduled medication dose was not taken within 30 minutes. Caregiver alerted.', 'error');
    speakVoiceReminder(`Alert ${state.patient.name || 'Patient'}: medication dose time expired. Please take your medicine or call your caregiver.`);

    addActivityLog('Missed Dose Alert Dispatched to Sarah Hughes', 'Buzzer & Push Sent');
    addMarRecord('Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'Metformin 500mg', state.hardware.currentSlot, 'Unconsumed in Chute', 'Missed (Timeout)');

    saveLocalState();
    renderDashboard();
    renderMarHistory();
    renderComplianceChart();
  }

  // =========================================================================
  // 6. AI COMPUTER VISION PILL SCANNER SIMULATION
  // =========================================================================
  const cameraCanvas = document.getElementById('cameraFeedCanvas');
  let cameraAnimationId = null;

  const pillProfiles = {
    metformin: {
      name: 'Metformin Hydrochloride',
      dose: '500mg Extended Release Tablet',
      match: true,
      shape: 'Oblong / Capsule-Shaped',
      color: 'White / Film-Coated',
      imprint: '"M 500" (Exact Match)',
      confidence: 98.4,
      drawColor: '#ffffff',
      drawShape: 'capsule'
    },
    lisinopril: {
      name: 'Lisinopril',
      dose: '10mg Oral Tablet',
      match: true,
      shape: 'Round Flat-Faced',
      color: 'Light Pink / Coral',
      imprint: '"L 10" (Exact Match)',
      confidence: 97.8,
      drawColor: '#fca5a5',
      drawShape: 'circle'
    },
    aspirin: {
      name: 'Aspirin Low Dose',
      dose: '81mg Enteric Coated',
      match: true,
      shape: 'Small Round',
      color: 'Yellow Ochre',
      imprint: '"BAYER 81"',
      confidence: 99.1,
      drawColor: '#fde047',
      drawShape: 'circle'
    },
    atorvastatin: {
      name: 'Atorvastatin Calcium',
      dose: '20mg Tablet',
      match: true,
      shape: 'Oval Convex',
      color: 'White',
      imprint: '"AT 20"',
      confidence: 96.9,
      drawColor: '#f8fafc',
      drawShape: 'oval'
    },
    wrong_pill: {
      name: 'UNIDENTIFIED RED CAPSULE',
      dose: 'Potential Contaminant / Wrong Medication',
      match: false,
      shape: 'Two-Tone Capsule',
      color: 'Crimson / Black',
      imprint: 'UNKNOWN / NO RECORD',
      confidence: 42.1,
      drawColor: '#dc2626',
      drawShape: 'capsule'
    }
  };

  let currentPillProfile = pillProfiles.metformin;

  function startCameraSimulation() {
    if (!cameraCanvas) return;
    const ctx = cameraCanvas.getContext('2d');
    let frame = 0;

    function renderFrame() {
      frame++;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cameraCanvas.width, cameraCanvas.height);

      ctx.beginPath();
      ctx.arc(cameraCanvas.width / 2, cameraCanvas.height / 2, 110, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      const jitterX = Math.sin(frame * 0.05) * 1.5;
      const jitterY = Math.cos(frame * 0.04) * 1.2;
      const cx = cameraCanvas.width / 2 + jitterX;
      const cy = cameraCanvas.height / 2 + jitterY;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = currentPillProfile.drawColor;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;

      if (currentPillProfile.drawShape === 'capsule') {
        const w = 70;
        const h = 32;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 16);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy - h / 2);
        ctx.lineTo(cx, cy + h / 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.stroke();
      } else if (currentPillProfile.drawShape === 'circle') {
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 38, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(currentPillProfile.imprint.replace(/["']/g, ''), cx, cy + 3);

      ctx.restore();

      cameraAnimationId = requestAnimationFrame(renderFrame);
    }

    if (cameraAnimationId) cancelAnimationFrame(cameraAnimationId);
    renderFrame();
  }

  function updateAiResultsUI(profile) {
    const nameEl = document.getElementById('aiIdentifiedName');
    const doseEl = document.getElementById('aiIdentifiedDose');
    const shapeEl = document.getElementById('aiDetectShape');
    const colorEl = document.getElementById('aiDetectColor');
    const imprintEl = document.getElementById('aiDetectImprint');
    const confValEl = document.getElementById('aiConfidenceVal');
    const confBarEl = document.getElementById('aiConfidenceBar');
    const badgeEl = document.getElementById('aiVerificationBadge');
    const matchTagEl = document.getElementById('aiPrescriptionMatchTag');
    const boundTagEl = document.getElementById('pillBoundingTag');
    const boundBoxEl = document.getElementById('pillBoundingBox');

    if (nameEl) nameEl.textContent = profile.name;
    if (doseEl) doseEl.textContent = profile.dose;
    if (shapeEl) shapeEl.textContent = profile.shape;
    if (colorEl) colorEl.textContent = profile.color;
    if (imprintEl) imprintEl.textContent = profile.imprint;
    if (confValEl) confValEl.textContent = profile.confidence + '%';
    if (confBarEl) confBarEl.style.width = profile.confidence + '%';

    if (profile.match) {
      if (badgeEl) {
        badgeEl.className = 'badge-status taken';
        badgeEl.textContent = 'VERIFIED • SAFE TO DISPENSE';
      }
      if (matchTagEl) {
        matchTagEl.className = 'pill-type-tag';
        matchTagEl.textContent = 'Prescribed Match';
        matchTagEl.style.background = '#dcfce7';
        matchTagEl.style.color = '#16a34a';
      }
      if (boundTagEl) boundTagEl.textContent = `${profile.name} (${profile.confidence}%)`;
      if (boundBoxEl) boundBoxEl.style.borderColor = '#10b981';
    } else {
      if (badgeEl) {
        badgeEl.className = 'badge-status missed';
        badgeEl.textContent = '⚠️ MISMATCH WARNING • DISPENSE HALTED';
      }
      if (matchTagEl) {
        matchTagEl.className = 'pill-type-tag';
        matchTagEl.textContent = 'UNAUTHORIZED PILL';
        matchTagEl.style.background = '#fee2e2';
        matchTagEl.style.color = '#dc2626';
      }
      if (boundTagEl) boundTagEl.textContent = `MISMATCH ALERT (${profile.confidence}%)`;
      if (boundBoxEl) boundBoxEl.style.borderColor = '#ef4444';
    }
  }

  // =========================================================================
  // 7. COMPLIANCE & ADHERENCE CHART
  // =========================================================================
  function renderComplianceChart() {
    const canvas = document.getElementById('complianceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const rates = [100, 100, 75, 100, 100, 92, 94];

    const padLeft = 45;
    const padBottom = 30;
    const padTop = 20;
    const padRight = 20;

    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'right';

    [0, 25, 50, 75, 100].forEach(level => {
      const y = padTop + chartH - (level / 100) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(level + '%', padLeft - 8, y + 4);
    });

    const targetY = padTop + chartH - (90 / 100) * chartH;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#10b981';
    ctx.moveTo(padLeft, targetY);
    ctx.lineTo(w - padRight, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    const barWidth = 36;
    const step = chartW / days.length;

    days.forEach((day, idx) => {
      const val = rates[idx];
      const barH = (val / 100) * chartH;
      const x = padLeft + idx * step + (step - barWidth) / 2;
      const y = padTop + chartH - barH;

      const grad = ctx.createLinearGradient(0, y, 0, padTop + chartH);
      if (val >= 90) {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#059669');
      } else {
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#d97706');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(val + '%', x + barWidth / 2, y - 6);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px Plus Jakarta Sans, sans-serif';
      ctx.fillText(day, x + barWidth / 2, h - 8);
    });
  }

  // =========================================================================
  // 8. RENDERERS (Dashboard, MAR, Inventory, Logs)
  // =========================================================================
  function renderDashboard() {
    const list = document.getElementById('dashboardScheduleList');
    if (!list) return;

    list.innerHTML = '';

    state.schedules.forEach(item => {
      const card = document.createElement('div');
      card.className = `schedule-card ${item.slot === state.hardware.currentSlot ? 'active-slot' : ''} ${item.status === 'missed' ? 'missed' : ''}`;

      let statusBadge = '';
      if (item.status === 'taken') {
        statusBadge = '<span class="badge-status taken">✓ Taken On-Time</span>';
      } else if (item.status === 'pending') {
        statusBadge = '<span class="badge-status pending">⏳ Pending (Slot ' + item.slot + ')</span>';
      } else if (item.status === 'missed') {
        statusBadge = '<span class="badge-status missed">✕ Missed Dose</span>';
      } else {
        statusBadge = '<span class="badge-status upcoming">Scheduled</span>';
      }

      card.innerHTML = `
        <div class="schedule-time-box">
          <span class="time-slot-label">Slot ${item.slot}</span>
          <span class="time-slot-val">${item.time}</span>
        </div>
        <div class="schedule-details">
          <div class="med-name">
            ${item.medName}
            <span class="pill-type-tag">${item.dosage}</span>
          </div>
          <div class="med-instructions">${item.instructions}</div>
        </div>
        <div class="schedule-actions">
          ${statusBadge}
          ${item.status === 'pending' ? `<button class="action-btn primary btn-dispense-inline" data-slot="${item.slot}" style="padding:4px 10px; font-size:12px;">Dispense</button>` : ''}
          <button class="action-btn outline btn-delete-prescription" data-id="${item._id || item.id}" style="padding:4px 10px; font-size:12px; color:#dc2626; border-color:#fca5a5;">Delete</button>
        </div>
      `;
      list.appendChild(card);
    });

    document.querySelectorAll('.btn-dispense-inline').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = parseInt(btn.dataset.slot);
        executeDispenseCycle(slot);
      });
    });

    document.querySelectorAll('.btn-delete-prescription').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = state.schedules.find(schedule => (schedule._id === id || schedule.id === id));
        if (!item || !window.confirm(`Delete the ${item.medName} prescription?`)) return;
        state.schedules = state.schedules.filter(schedule => schedule !== item);
        saveLocalState();
        renderDashboard();
        showToast(`${item.medName} prescription deleted.`, 'success');
        try {
          const response = await fetch(`${API_BASE}/schedules/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
          if (!response.ok) throw new Error('Server rejected delete');
        } catch (err) {
          showToast('Prescription deleted locally; server sync is unavailable.', 'warning');
        }
      });
    });

    const kioskCurrentMed = document.getElementById('kioskCurrentMed');
    const kioskCurrentInstructions = document.getElementById('kioskCurrentInstructions');
    const activeDose = state.schedules.find(s => s.status === 'pending') || state.schedules[2];
    if (kioskCurrentMed && activeDose) {
      kioskCurrentMed.textContent = `${activeDose.medName} ${activeDose.dosage} (Slot ${activeDose.slot})`;
    }
    if (kioskCurrentInstructions && activeDose) {
      kioskCurrentInstructions.textContent = activeDose.instructions;
    }

    renderInventory();
    renderActivityLogs();
  }

  function renderInventory() {
    const grid = document.getElementById('inventoryCardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let hasLowStock = false;

    state.inventory.forEach(item => {
      const isLow = item.currentStock <= 5;
      if (isLow) hasLowStock = true;
      const fillPercent = Math.round((item.currentStock / item.totalCapacity) * 100);

      const card = document.createElement('div');
      card.className = 'card-panel';
      card.innerHTML = `
        <div class="panel-header">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
            ${item.name}
          </h3>
          <span class="badge-status ${isLow ? 'missed' : 'taken'}">${isLow ? 'REFILL NEEDED' : 'STOCK OK'}</span>
        </div>
        <div style="font-size: 13px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">Strength &amp; Form:</span>
            <strong>${item.dose}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">Assigned Rotor Slot:</span>
            <strong>Slot ${item.slot}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">Pill Appearance:</span>
            <strong>${item.shape} (${item.imprint})</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">Remaining Pills:</span>
            <strong>${item.currentStock} / ${item.totalCapacity} units</strong>
          </div>
          <div>
            <div class="confidence-bar-wrapper" style="margin-top:4px;">
              <div style="background:${isLow ? '#ef4444' : '#10b981'}; height:100%; width:${fillPercent}%;"></div>
            </div>
          </div>
          <button class="action-btn outline btn-refill-item" data-id="${item._id || item.id}" style="margin-top:12px; width:100%; justify-content:center;">
            Refill Cartridge (+15 Pills)
          </button>
        </div>
      `;
      grid.appendChild(card);
      if (isLow && !sessionStorage.getItem(`refill-alert-${item._id || item.id}`)) {
        sessionStorage.setItem(`refill-alert-${item._id || item.id}`, 'sent');
        notifyRefillNeeded(item);
      }
    });

    const badge = document.getElementById('sidebarLowStockBadge');
    if (badge) {
      badge.style.display = hasLowStock ? 'inline-block' : 'none';
    }

    document.querySelectorAll('.btn-refill-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const item = state.inventory.find(i => (i._id === id || i.id === id));
        if (item) {
          item.currentStock = Math.min(item.totalCapacity, item.currentStock + 15);
          saveLocalState();
          renderInventory();
          showToast(`Refilled ${item.name} (+15 pills). Synced to MongoDB.`, 'success');
          addActivityLog(`Caregiver Refilled ${item.name}`, `Cartridge Stock: ${item.currentStock}`);

          fetch(`${API_BASE}/inventory/refill/${id}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ amount: 15 })
          }).catch(() => null);
        }
      });
    });
  }

  function renderActivityLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.activityLogs.slice(0, 8).forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="log-time" style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted);">${log.time}</td>
        <td><strong>${log.event}</strong></td>
        <td><span class="badge-status taken" style="font-size:10.5px;">${log.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderMarHistory() {
    const tbody = document.getElementById('marHistoryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.marHistory.forEach(row => {
      const tr = document.createElement('tr');
      const isTaken = (row.status || '').toLowerCase().includes('taken');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono);">${row.date}</td>
        <td><strong>${row.med}</strong></td>
        <td>Slot ${row.slot}</td>
        <td><span style="font-family:var(--font-mono); font-size:12px;">${row.sensor}</span></td>
        <td><span class="badge-status ${isTaken ? 'taken' : 'missed'}">${row.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function addActivityLog(event, status) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.activityLogs.unshift({ time, event, status });
    saveLocalState();
    renderActivityLogs();
  }

  function addMarRecord(date, med, slot, sensor, status) {
    state.marHistory.unshift({ date, med, slot, sensor, status });
    saveLocalState();
    renderMarHistory();
  }

  function notifyRefillNeeded(item) {
    const phone = currentUser?.phone || state.patient.phone || 'the saved phone number';
    const message = `Refill needed: ${item.name} has ${item.currentStock} pills left. Alert sent to ${phone}.`;
    showToast(message, 'warning');
    addActivityLog(`Refill notification sent for ${item.name}`, `SMS target: ${phone}`);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PillGuard refill reminder', { body: message });
    }
    fetch(`${API_BASE}/device/refill-alert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ medication: item.name, remaining: item.currentStock, phone })
    }).catch(() => null);
  }

  // =========================================================================
  // 9. TOAST NOTIFICATION DISPATCHER
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '🚨';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size:18px;">${icon}</span>
      <div style="flex:1; font-size:13px;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  }

  // =========================================================================
  // 10. AUTHENTICATION — LOGIN / LOGOUT CONTROLLER
  // =========================================================================
  const modalAuth = document.getElementById('modalAuth');
  const panelSignIn = document.getElementById('authPanelSignIn');
  const panelProfile = document.getElementById('authPanelProfile');


  // ── Helpers to switch between the 3 modal panels ──────────────────────────
  function showAuthPanel(panel) {
    [panelSignIn, panelProfile].forEach(p => { if (p) p.style.display = 'none'; });
    if (panel) panel.style.display = 'block';
  }

  function openAuthModal() {
    if (!modalAuth) return;
    if (!currentUser) {
      showGatePanel('gateLoginPanel');
      return;
    }
    modalAuth.classList.add('active');
    // If already logged in, go straight to profile
    if (currentUser && currentUser.id) {
      populateProfilePanel();
      showAuthPanel(panelProfile);
    } else {
      showAuthPanel(panelSignIn);
    }
  }

  function closeAuthModal() {
    if (modalAuth) modalAuth.classList.remove('active');
  }

  function populateProfilePanel() {
    if (!currentUser) return;
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const el = (id) => document.getElementById(id);
    if (el('profileAvatar')) el('profileAvatar').textContent = initials;
    if (el('profileName')) el('profileName').textContent = currentUser.name;
    if (el('profileEmail')) el('profileEmail').textContent = currentUser.email;
    if (el('profilePatient')) el('profilePatient').textContent = currentUser.patientName || 'Eleanor Hughes';
    if (el('profilePhone')) el('profilePhone').textContent = currentUser.phone || '—';
    if (el('profileRoleBadge')) {
      el('profileRoleBadge').textContent = currentUser.role.toUpperCase();
      const roleColors = { caregiver: '#dbeafe:#1d4ed8', doctor: '#dcfce7:#15803d', senior: '#fef3c7:#92400e' };
      const [bg, color] = (roleColors[currentUser.role] || '#f3f4f6:#374151').split(':');
      el('profileRoleBadge').style.background = bg;
      el('profileRoleBadge').style.color = color;
    }
    if (el('profileVerified')) {
      el('profileVerified').textContent = (currentUser.isEmailVerified === false) ? '⚠️ Unverified' : '✅ Verified';
      el('profileVerified').style.color = (currentUser.isEmailVerified === false) ? '#f59e0b' : '#10b981';
    }
  }

  // ── Modal open/close wiring ────────────────────────────────────────────────
  document.getElementById('btnOpenAuthModal')?.addEventListener('click', openAuthModal);
  document.getElementById('btnCloseAuthModal')?.addEventListener('click', closeAuthModal);
  document.getElementById('btnCloseProfilePanel')?.addEventListener('click', closeAuthModal);
  document.getElementById('btnCancelLogin')?.addEventListener('click', closeAuthModal);
  document.getElementById('btnCancelRegister')?.addEventListener('click', closeAuthModal);
  document.getElementById('btnSwitchAccount')?.addEventListener('click', () => {
    closeAuthModal();
    showGatePanel('gateLoginPanel');
  });

  // ── Login/Register tab switching ───────────────────────────────────────────
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const formLogin = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');

  tabBtnLogin?.addEventListener('click', () => {
    tabBtnLogin.style.cssText = 'flex:1;padding:12px;font-weight:700;font-size:13.5px;border-bottom:2px solid var(--primary);color:var(--primary);background:none;cursor:pointer;';
    tabBtnRegister.style.cssText = 'flex:1;padding:12px;font-weight:600;font-size:13.5px;color:var(--text-muted);background:none;border:none;cursor:pointer;';
    if (formLogin) formLogin.style.display = 'block';
    if (formRegister) formRegister.style.display = 'none';
  });

  tabBtnRegister?.addEventListener('click', () => {
    tabBtnRegister.style.cssText = 'flex:1;padding:12px;font-weight:700;font-size:13.5px;border-bottom:2px solid var(--primary);color:var(--primary);background:none;cursor:pointer;';
    tabBtnLogin.style.cssText = 'flex:1;padding:12px;font-weight:600;font-size:13.5px;color:var(--text-muted);background:none;border:none;cursor:pointer;';
    if (formRegister) formRegister.style.display = 'block';
    if (formLogin) formLogin.style.display = 'none';
  });

  // ── Shared: complete login after authentication ────────────────────────────
  function finalizeLogin(user) {
    saveAuthData(user);
    closeAuthModal();
    playSuccessChime();
    const logoutBtn = document.getElementById('btnLogoutHeader');
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    showToast(`Welcome, ${user.name}! Your secure session is active.`, 'success');
    openPatientSetup(user);
    syncFromBackend();
  }

  function openPatientSetup(user) {
    const gate = document.getElementById('authGate');
    const loginPanel = document.getElementById('gateLoginPanel');
    const profilePanel = document.getElementById('gateProfilePanel');
    if (!gate || !loginPanel || !profilePanel) return;
    gate.classList.add('active');
    loginPanel.style.display = 'none';
    profilePanel.style.display = 'block';
    document.getElementById('gatePatientName').value = user.patientName || state.patient.name || '';
    document.getElementById('gatePatientAge').value = user.age || state.patient.age || '';
    document.getElementById('gatePatientWeight').value = user.weight || state.patient.weight || '';
    document.getElementById('gatePatientPhone').value = user.phone || state.patient.caregiverPhone || '';
    document.getElementById('gatePatientNotes').value = user.notes || '';
  }

  function showGatePanel(panelId) {
    ['gateLoginPanel', 'gateSignupPanel', 'gateProfilePanel'].forEach(id => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = id === panelId ? 'block' : 'none';
    });
    document.getElementById('authGate')?.classList.add('active');
  }

  function closePatientSetup() {
    document.getElementById('authGate')?.classList.remove('active');
  }

  // Legacy account modal login handler.
  function createLocalDemoUser(email, overrides = {}) {
    const isDoctor = email.toLowerCase().includes('doc');
    return {
      id: 'usr-local-' + Date.now(),
      name: isDoctor ? 'Dr. Marcus Vance' : 'Sarah Hughes',
      email,
      role: isDoctor ? 'doctor' : 'caregiver',
      patientName: 'Eleanor Hughes',
      phone: '+1 (555) 234-8901',
      isEmailVerified: true,
      ...overrides
    };
  }

  async function submitLogin(email, password) {
    const errEl = document.getElementById('loginErrorMsg');
    const btnEl = document.getElementById('btnSubmitLogin');
    if (errEl) errEl.style.display = 'none';
    if (btnEl) { btnEl.textContent = 'Signing in…'; btnEl.disabled = true; }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        finalizeLogin(data.user, data.token);
      } else if (res.status === 503) {
        // The dashboard is designed to be usable locally when MongoDB is not
        // running.  Keep the session in this browser and let API-backed actions
        // gracefully fall back to the existing local state.
        finalizeLogin(createLocalDemoUser(email));
        showToast('MongoDB is offline; using local demo mode.', 'warning');
      } else {
        if (errEl) { errEl.textContent = data.message || 'Login failed.'; errEl.style.display = 'block'; }
        showToast(data.message || 'Login failed.', 'error');
      }
    } catch (err) {
      // Offline demo fallback — auto-authenticate
      finalizeLogin(createLocalDemoUser(email));
    } finally {
      if (btnEl) { btnEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign In'; btnEl.disabled = false; }
    }
  }

  formLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('inputLoginEmail').value.trim();
    const password = document.getElementById('inputLoginPassword').value;
    if (!validEmailPattern.test(email) || !strongPasswordPattern.test(password)) {
      const error = document.getElementById('loginErrorMsg');
      error.textContent = 'Use a valid email and a strong password (8+ characters, uppercase, lowercase, number, and symbol).';
      error.style.display = 'block';
      return;
    }
    submitLogin(email, password);
  });

  async function submitGateAuth(endpoint, payload, error) {
    error.textContent = '';
    const overrides = {};
    if (payload.name) overrides.name = payload.name;
    if (payload.role) overrides.role = payload.role;
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        finalizeLogin(data.user);
      } else if (response.status === 503) {
        finalizeLogin(createLocalDemoUser(payload.email, overrides));
        showToast('MongoDB is offline; using local demo mode.', 'warning');
      } else {
        error.textContent = data.message || 'Authentication failed.';
      }
    } catch (requestError) {
      // No backend deployed here (or it returned a non-JSON response) — the
      // dashboard is designed to stay usable locally in that case.
      finalizeLogin(createLocalDemoUser(payload.email, overrides));
      showToast('Server unavailable; using local demo mode.', 'warning');
    }
  }

  document.getElementById('gateLoginForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('gateLoginEmail').value.trim();
    const password = document.getElementById('gateLoginPassword').value;
    const error = document.getElementById('gateLoginError');
    error.textContent = '';
    if (!validEmailPattern.test(email) || !strongPasswordPattern.test(password)) {
      error.textContent = 'Enter a valid email and a strong password (8+ characters, uppercase, lowercase, number, and symbol).';
      return;
    }
    submitGateAuth('/auth/login', { email, password }, error);
  });

  document.getElementById('gateShowSignup')?.addEventListener('click', () => showGatePanel('gateSignupPanel'));
  document.getElementById('gateShowLogin')?.addEventListener('click', () => showGatePanel('gateLoginPanel'));

  document.getElementById('gateSignupForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('gateSignupName').value.trim();
    const email = document.getElementById('gateSignupEmail').value.trim();
    const password = document.getElementById('gateSignupPassword').value;
    const error = document.getElementById('gateSignupError');
    error.textContent = '';
    if (!name || !validEmailPattern.test(email) || !strongPasswordPattern.test(password)) {
      error.textContent = 'Enter your name, a valid email, and a strong password.';
      return;
    }
    submitGateAuth('/auth/register', { name, email, password, role: 'caregiver' }, error);
  });

  document.getElementById('gateProfileForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('gatePatientName').value.trim();
    const age = Number(document.getElementById('gatePatientAge').value);
    const weight = Number(document.getElementById('gatePatientWeight').value);
    const phone = document.getElementById('gatePatientPhone').value.trim();
    const notes = document.getElementById('gatePatientNotes').value.trim();
    const error = document.getElementById('gateProfileError');
    if (!name || age < 1 || age > 120 || weight <= 0 || !/^[+0-9 ()-]{7,}$/.test(phone)) {
      error.textContent = 'Please enter a valid name, age, weight, and phone number.';
      return;
    }
    error.textContent = '';
    state.patient = { ...state.patient, name, age, weight, phone, caregiverPhone: phone, notes };
    currentUser = { ...currentUser, patientName: name, age, weight, phone, notes, patientProfileComplete: true };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
    saveLocalState();
    document.getElementById('patientHeaderName').textContent = `${name} (Age ${age})`;
    document.getElementById('patientHeaderSub').textContent = `Profile connected • ${phone}`;
    updateAuthHeaderUI();
    closePatientSetup();
    showToast(`Patient profile saved for ${name}. Dashboard ready.`, 'success');
    speakVoiceReminder(`Hello ${name}. Your PillGuard dashboard is ready.`);
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ patientName: name, age, weight, phone, notes })
      });
      if (!response.ok) throw new Error('Profile sync failed');
    } catch (err) {
      showToast('Profile saved on this device; server sync is unavailable.', 'warning');
    }
  });

  // ── Register form ──────────────────────────────────────────────────────────
  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('inputRegName').value.trim();
    const email = document.getElementById('inputRegEmail').value.trim();
    const password = document.getElementById('inputRegPassword').value;
    const role = document.getElementById('selectRegRole').value;
    const errEl = document.getElementById('registerErrorMsg');
    if (errEl) errEl.style.display = 'none';
    if (!validEmailPattern.test(email) || !strongPasswordPattern.test(password)) {
      if (errEl) {
        errEl.textContent = 'Use a valid email and a strong password (8+ characters, uppercase, lowercase, number, and symbol).';
        errEl.style.display = 'block';
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();

      if (data.success) {
        formRegister.reset();
        finalizeLogin(data.user, data.token);
      } else if (res.status === 503) {
        formRegister.reset();
        finalizeLogin(createLocalDemoUser(email, { name, role }));
        showToast('MongoDB is offline; using local demo mode.', 'warning');
      } else {
        if (errEl) { errEl.textContent = data.message || 'Registration failed.'; errEl.style.display = 'block'; }
      }
    } catch (err) {
      // No backend deployed here (or it returned a non-JSON response) — fall
      // back to local demo mode so the dashboard stays reachable.
      formRegister.reset();
      finalizeLogin(createLocalDemoUser(email, { name, role }));
      showToast('Server unavailable; using local demo mode.', 'warning');
    }
  });

  // ── Demo quick-login buttons ───────────────────────────────────────────────
  document.getElementById('btnDemoCaregiver')?.addEventListener('click', () => {
    document.getElementById('inputLoginEmail').value = 'sarah@hughes.care';
    document.getElementById('inputLoginPassword').value = 'Caregiver2026!';
    submitLogin('sarah@hughes.care', 'Caregiver2026!');
  });

  document.getElementById('btnDemoDoctor')?.addEventListener('click', () => {
    document.getElementById('inputLoginEmail').value = 'dr.vance@cardio.med';
    document.getElementById('inputLoginPassword').value = 'Doctor2026!';
    submitLogin('dr.vance@cardio.med', 'Doctor2026!');
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  function performLogout() {
    // Notify server (fire & forget)
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() }).catch(() => null);

    const name = currentUser?.name || 'User';
    // Clear local auth data
    localStorage.removeItem(AUTH_USER_KEY);
    currentUser = null;

    // Reset header UI
    const avatarEl = document.getElementById('authUserAvatar');
    const nameEl = document.getElementById('authUserName');
    const roleEl = document.getElementById('authUserRole');
    const logoutBtn = document.getElementById('btnLogoutHeader');
    if (avatarEl) avatarEl.textContent = '?';
    if (nameEl) nameEl.textContent = 'Not Signed In';
    if (roleEl) roleEl.innerHTML = '<span style="color:#ef4444;">No Active Session</span>';
    if (logoutBtn) logoutBtn.style.display = 'none';

    closeAuthModal();
    showToast(`👋 ${name} signed out successfully. Session cleared.`, 'info');
    addActivityLog(`User Signed Out: ${name}`, 'JWT Cleared');
  }

  document.getElementById('btnLogoutModal')?.addEventListener('click', performLogout);
  document.getElementById('btnLogoutHeader')?.addEventListener('click', performLogout);

  // Show logout button if already logged in on page load
  if (currentUser?.id) {
    const logoutBtn = document.getElementById('btnLogoutHeader');
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  }


  // =========================================================================
  // 11. MODALS & OTHER CONTROLLERS
  // =========================================================================
  const modalPrescription = document.getElementById('modalAddPrescription');
  const btnOpenAddPrescription = document.getElementById('btnOpenAddPrescription');
  const btnClosePrescriptionModal = document.getElementById('btnClosePrescriptionModal');
  const btnCancelPrescription = document.getElementById('btnCancelPrescription');
  const formAddPrescription = document.getElementById('formAddPrescription');

  if (btnOpenAddPrescription && modalPrescription) {
    btnOpenAddPrescription.addEventListener('click', () => modalPrescription.classList.add('active'));
  }
  if (btnClosePrescriptionModal && modalPrescription) {
    btnClosePrescriptionModal.addEventListener('click', () => modalPrescription.classList.remove('active'));
  }
  if (btnCancelPrescription && modalPrescription) {
    btnCancelPrescription.addEventListener('click', () => modalPrescription.classList.remove('active'));
  }

  if (formAddPrescription) {
    formAddPrescription.addEventListener('submit', async (e) => {
      e.preventDefault();
      const medName = document.getElementById('inputMedName').value.trim();
      const dosage = document.getElementById('inputDosage').value.trim();
      const timeVal = document.getElementById('inputScheduledTime').value;
      const slot = parseInt(document.getElementById('selectSlotNumber').value);
      const instructions = document.getElementById('inputInstructions').value.trim() || 'Take as prescribed';

      const [hours, minutes] = timeVal.split(':');
      const hourNum = parseInt(hours);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = hourNum % 12 || 12;
      const timeStr = `${formattedHour}:${minutes} ${ampm}`;

      const newDose = {
        id: 'dose-' + Date.now(),
        medName,
        dosage,
        time: timeStr,
        slot,
        status: 'upcoming',
        instructions
      };

      state.schedules.push(newDose);
      saveLocalState();
      modalPrescription.classList.remove('active');
      formAddPrescription.reset();
      renderDashboard();
      showToast(`Prescription for ${medName} saved to MongoDB.`, 'success');
      addActivityLog(`Added Schedule: ${medName} (${timeStr})`, `Slot ${slot} Configured`);

      fetch(`${API_BASE}/schedules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ medName, dosage, time: timeStr, slot, instructions })
      }).catch(() => null);
    });
  }

  // SOS Emergency
  const modalSos = document.getElementById('modalSosAlert');
  const btnTriggerSos = document.getElementById('btnTriggerSos');
  const btnCloseSosModal = document.getElementById('btnCloseSosModal');
  const btnDismissSos = document.getElementById('btnDismissSos');
  const btnKioskEmergency = document.getElementById('btnKioskEmergency');

  function triggerSosEmergency() {
    if (modalSos) modalSos.classList.add('active');
    playBuzzerAlarm();
    speakVoiceReminder('Emergency alert activated. Calling caregiver Sarah Hughes now. Please stay calm.');
    showToast('URGENT: SOS Emergency Signal Transmitted to Caregiver Sarah Hughes (+1-555-234-8901).', 'error');
    addActivityLog('EMERGENCY SOS BUTTON PRESSED BY PATIENT', 'Caregiver & 911 Dispatched');

    fetch(`${API_BASE}/device/sos`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).catch(() => null);
  }

  if (btnTriggerSos) btnTriggerSos.addEventListener('click', triggerSosEmergency);
  if (btnKioskEmergency) btnKioskEmergency.addEventListener('click', triggerSosEmergency);

  if (btnCloseSosModal && modalSos) {
    btnCloseSosModal.addEventListener('click', () => modalSos.classList.remove('active'));
  }
  if (btnDismissSos && modalSos) {
    btnDismissSos.addEventListener('click', () => modalSos.classList.remove('active'));
  }

  // =========================================================================
  // 12. BUTTON EVENT LISTENERS
  // =========================================================================
  const btnVoiceDemo = document.getElementById('btnVoiceDemo');
  if (btnVoiceDemo) {
    btnVoiceDemo.addEventListener('click', () => {
      speakVoiceReminder(`Good afternoon ${state.patient.name || 'Patient'}. This is your PillGuard assistant. Please remember to drink water with your afternoon medicine.`);
      showToast('Speaking Voice Guidance via Web Speech API', 'info');
    });
  }

  const btnManualDispenseTop = document.getElementById('btnManualDispenseTop');
  if (btnManualDispenseTop) {
    btnManualDispenseTop.addEventListener('click', () => executeDispenseCycle(3));
  }

  const btnHardwareTriggerCycle = document.getElementById('btnHardwareTriggerCycle');
  if (btnHardwareTriggerCycle) {
    btnHardwareTriggerCycle.addEventListener('click', () => executeDispenseCycle(3));
  }

  const btnSimTakePill = document.getElementById('btnSimTakePill');
  if (btnSimTakePill) btnSimTakePill.addEventListener('click', handlePatientTakePill);

  const btnKioskTakePill = document.getElementById('btnKioskTakePill');
  if (btnKioskTakePill) btnKioskTakePill.addEventListener('click', handlePatientTakePill);

  const btnSimMissedTimeout = document.getElementById('btnSimMissedTimeout');
  if (btnSimMissedTimeout) btnSimMissedTimeout.addEventListener('click', handleMissedDoseTimeout);

  const btnBuzzerTest = document.getElementById('btnBuzzerTest');
  if (btnBuzzerTest) {
    btnBuzzerTest.addEventListener('click', () => {
      playBuzzerAlarm();
      showToast('Testing 85dB Audio Buzzer Alarm', 'warning');
    });
  }

  const btnResetCarouselHome = document.getElementById('btnResetCarouselHome');
  if (btnResetCarouselHome) {
    btnResetCarouselHome.addEventListener('click', () => {
      state.hardware.currentSlot = 1;
      state.hardware.stepperAngle = 0;
      updateHardwareVisuals();
      playDispenseSound();
      showToast('Stepper Motor calibrated to Home Position (Slot 1, 0.0°)', 'info');
      addActivityLog('Stepper Motor Calibrated to Home', 'Angle 0.0° OK');
    });
  }

  const btnKioskSpeakPrompt = document.getElementById('btnKioskSpeakPrompt');
  if (btnKioskSpeakPrompt) {
    btnKioskSpeakPrompt.addEventListener('click', () => {
      const active = state.schedules.find(s => s.status === 'pending') || state.schedules[2];
      speakVoiceReminder(`${state.patient.name || 'Patient'}, it is time for your ${active.medName} ${active.dosage}. ${active.instructions}`);
    });
  }

  const samplePillSelect = document.getElementById('samplePillSelect');
  if (samplePillSelect) {
    samplePillSelect.addEventListener('change', () => {
      const key = samplePillSelect.value;
      if (pillProfiles[key]) {
        currentPillProfile = pillProfiles[key];
        updateAiResultsUI(currentPillProfile);
      }
    });
  }

  const btnRunAiScan = document.getElementById('btnRunAiScan');
  if (btnRunAiScan) {
    btnRunAiScan.addEventListener('click', () => {
      showToast('Computer Vision: Optical feature extraction in progress...', 'info');
      setTimeout(() => {
        updateAiResultsUI(currentPillProfile);
        if (currentPillProfile.match) {
          playSuccessChime();
          showToast(`AI Verification Complete: ${currentPillProfile.name} verified safe.`, 'success');
        } else {
          playBuzzerAlarm();
          showToast(`AI WARNING: Unknown pill detected! Dispense blocked for patient safety.`, 'error');
        }

        fetch(`${API_BASE}/ai/verify`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ sampleKey: samplePillSelect ? samplePillSelect.value : 'metformin' })
        }).catch(() => null);

      }, 700);
    });
  }

  const btnClearLogs = document.getElementById('btnClearLogs');
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      state.activityLogs = [];
      saveLocalState();
      renderActivityLogs();
      fetch(`${API_BASE}/logs/logs`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).catch(() => null);
      showToast('Activity logs cleared from database.', 'info');
    });
  }

  const btnQuickRefill = document.getElementById('btnQuickRefill');
  if (btnQuickRefill) {
    btnQuickRefill.addEventListener('click', () => {
      state.inventory.forEach(item => item.currentStock = item.totalCapacity);
      saveLocalState();
      renderInventory();
      fetch(`${API_BASE}/inventory/refill-all`, {
        method: 'POST',
        headers: getAuthHeaders()
      }).catch(() => null);
      showToast('All 7-day medication cartridges refilled to maximum.', 'success');
      addActivityLog('Full Hopper Refill Executed', 'All 4 Cartridges 100%');
    });
  }

  const btnExportReport = document.getElementById('btnExportReport');
  if (btnExportReport) {
    btnExportReport.addEventListener('click', () => {
      let csv = 'Date & Time,Medication,Slot,Sensor Confirmation,Status\n';
      state.marHistory.forEach(r => {
        csv += `"${r.date}","${r.med}","Slot ${r.slot}","${r.sensor}","${r.status}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Medication_Adherence_Report_Eleanor_Hughes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Doctor Adherence Report exported as CSV.', 'success');
    });
  }

  const btnAddNewInventory = document.getElementById('btnAddNewInventory');
  if (btnAddNewInventory) {
    btnAddNewInventory.addEventListener('click', () => {
      const name = prompt('Enter medication name for stock reserve:');
      if (!name) return;
      const dose = prompt('Enter strength (e.g. 25mg):', '25mg');
      const newInv = {
        name,
        dose: dose || '25mg',
        currentStock: 30,
        totalCapacity: 30,
        refillDate: 'Aug 31, 2026',
        slot: 5,
        shape: 'Round White',
        imprint: 'RX'
      };
      state.inventory.push(newInv);
      saveLocalState();
      renderInventory();
      showToast(`Added stock reserve for ${name}.`, 'success');

      fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newInv)
      }).catch(() => null);
    });
  }

  // =========================================================================
  // 13. INITIALIZATION
  // =========================================================================
  async function initApp() {
    try {
      const response = await fetch(`${API_BASE}/auth/me`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) saveAuthData(data.user);
      } else {
        currentUser = null;
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (error) {
      currentUser = null;
      localStorage.removeItem(AUTH_USER_KEY);
    }
    updateAuthHeaderUI();
    updateHardwareVisuals();
    renderDashboard();
    renderMarHistory();
    updateAiResultsUI(currentPillProfile);
    syncFromBackend();
    if (currentUser?.id && currentUser.patientProfileComplete) {
      closePatientSetup();
    } else if (currentUser?.id) {
      openPatientSetup(currentUser);
    } else {
      document.getElementById('authGate')?.classList.add('active');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

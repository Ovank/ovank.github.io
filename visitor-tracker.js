// ═══════════════════════════════════════════════════════
// Visitor Tracker — Supabase-backed page view counter
// ═══════════════════════════════════════════════════════
// CONFIGURE: Replace these with your Supabase project credentials
const SUPABASE_URL = 'https://qpnfbkvrlpdlxtesfuci.supabase.co';           // e.g. https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwbmZia3ZybHBkbHh0ZXNmdWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjkzMTcsImV4cCI6MjA5MjEwNTMxN30.y88Bg7a8T38CbcySjM70DpiRCojQ2k-gmrMomg6lzYM'; // from Project Settings → API

// ── Environment flag ──
// Auto-detects local dev (localhost / 127.0.0.1 / file://), or force override:
//   ?tracker=prod   → force production mode on any host
//   ?tracker=test   → force test mode on any host
const _urlParams = new URLSearchParams(window.location.search);
const _trackerOverride = _urlParams.get('tracker');
const IS_PROD = _trackerOverride === 'prod'
  ? true
  : _trackerOverride === 'test'
    ? false
    : !['localhost', '127.0.0.1', ''].includes(window.location.hostname);

const SUPABASE_REST = `${SUPABASE_URL}/rest/v1`;

function supabaseHeaders(extra) {
  return Object.assign({
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }, extra || {});
}

// ── Get visitor IP + geo/network info ──
async function getVisitorInfo() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return {
      ip: data.ip || null,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      asn: data.asn || null,
      org: data.org || null
    };
  } catch (e) {
    console.warn('Visitor tracker: could not fetch visitor info', e);
    return { ip: null, city: null, region: null, country: null, latitude: null, longitude: null, asn: null, org: null };
  }
}

// ── Record a page visit ──
async function recordVisit(pagePath) {
  const info = await getVisitorInfo();
  try {
    await fetch(`${SUPABASE_REST}/page_visits`, {
      method: 'POST',
      headers: supabaseHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify({
        page_path: pagePath,
        visitor_ip: info.ip,
        user_agent: navigator.userAgent,
        city: info.city,
        region: info.region,
        country: info.country,
        latitude: info.latitude,
        longitude: info.longitude,
        asn: info.asn,
        org: info.org
      })
    });
  } catch (e) {
    console.warn('Visitor tracker: could not record visit', e);
  }
}

// ── Get visit count for a specific page (via RPC) ──
async function getVisitCount(pagePath) {
  try {
    const res = await fetch(`${SUPABASE_REST}/rpc/get_page_visit_count`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({ page: pagePath })
    });
    return await res.json();
  } catch (e) {
    console.warn('Visitor tracker: could not get page count', e);
    return 0;
  }
}

// ── Get total site-wide visit count (via RPC) ──
async function getTotalVisitCount() {
  try {
    const res = await fetch(`${SUPABASE_REST}/rpc/get_total_visit_count`, {
      method: 'POST',
      headers: supabaseHeaders()
    });
    return await res.json();
  } catch (e) {
    console.warn('Visitor tracker: could not get total count', e);
    return 0;
  }
}

// ═══════════════════════════════════════════════════════
// Local Storage tracker (test / local dev mode)
// ═══════════════════════════════════════════════════════
const LS_KEY = 'vatslog_visits';

function _getLocalVisits() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function _saveLocalVisits(visits) {
  localStorage.setItem(LS_KEY, JSON.stringify(visits));
}

function localRecordVisit(pagePath) {
  const visits = _getLocalVisits();
  visits.push({
    page_path: pagePath,
    visitor_ip: '127.0.0.1',
    user_agent: navigator.userAgent,
    visited_at: new Date().toISOString()
  });
  _saveLocalVisits(visits);
}

function localGetPageCount(pagePath) {
  return _getLocalVisits().filter(v => v.page_path === pagePath).length;
}

function localGetTotalCount() {
  return _getLocalVisits().length;
}

// ── Build & insert the counter widget ──
function renderCounter(pageCount, totalCount, testMode) {
  if (document.getElementById('visit-counter')) return;

  const badge = testMode
    ? '<span style="font-size:10px;color:#ff9800;margin-left:6px;">[TEST]</span>'
    : '';

  const counter = document.createElement('div');
  counter.id = 'visit-counter';
  counter.className = 'visit-counter';
  counter.innerHTML = `
    <div class="visit-counter-item">
      <span class="material-icons visit-icon">visibility</span>
      <span class="visit-label">Page Views</span>
      <span class="visit-count">${pageCount}</span>
    </div>
    <div class="visit-counter-divider"></div>
    <div class="visit-counter-item">
      <span class="material-icons visit-icon">language</span>
      <span class="visit-label">Total Site Views</span>
      <span class="visit-count">${totalCount}${badge}</span>
    </div>
  `;

  const footer = document.querySelector('.site-footer');
  const container = document.querySelector('.page_contain') ||
                    document.getElementById('homepage');

  // On home page, pin counter to bottom-left
  const isHome = !!document.getElementById('homepage');
  if (isHome) {
    counter.classList.add('visit-counter-home');
  }

  if (footer) {
    footer.parentNode.insertBefore(counter, footer);
  } else if (container) {
    container.appendChild(counter);
  } else {
    document.body.appendChild(counter);
  }
}

// ═══════════════════════════════════════════════════════
// Test-mode controls (toggle local/supabase + test connection)
// ═══════════════════════════════════════════════════════
const LS_BACKEND_KEY = 'vatslog_test_backend'; // 'local' or 'supabase'

function _getTestBackend() {
  return localStorage.getItem(LS_BACKEND_KEY) || 'local';
}

function renderTestControls() {
  if (document.getElementById('tracker-test-controls')) return;

  const backend = _getTestBackend();
  const panel = document.createElement('div');
  panel.id = 'tracker-test-controls';
  panel.className = 'tracker-test-controls';
  panel.innerHTML = `
    <div class="test-controls-header">
      <span class="material-icons" style="font-size:16px;vertical-align:middle;">science</span>
      Tracker Dev Panel
    </div>
    <div class="test-controls-row">
      <span class="test-controls-label">Backend:</span>
      <button id="btn-backend-local" class="test-btn ${backend === 'local' ? 'test-btn-active' : ''}">Local</button>
      <button id="btn-backend-supabase" class="test-btn ${backend === 'supabase' ? 'test-btn-active' : ''}">Supabase</button>
    </div>
    <div class="test-controls-row">
      <button id="btn-test-supabase" class="test-btn test-btn-check">
        <span class="material-icons" style="font-size:14px;vertical-align:middle;">wifi_tethering</span>
        Test Supabase Connection
      </button>
    </div>
    <div id="test-supabase-result" class="test-result"></div>
  `;

  document.body.appendChild(panel);

  // Toggle backend buttons
  document.getElementById('btn-backend-local').addEventListener('click', function () {
    localStorage.setItem(LS_BACKEND_KEY, 'local');
    location.reload();
  });
  document.getElementById('btn-backend-supabase').addEventListener('click', function () {
    localStorage.setItem(LS_BACKEND_KEY, 'supabase');
    location.reload();
  });

  // Test Supabase connection
  document.getElementById('btn-test-supabase').addEventListener('click', async function () {
    const resultEl = document.getElementById('test-supabase-result');
    resultEl.textContent = 'Testing...';
    resultEl.className = 'test-result';

    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      resultEl.textContent = 'Supabase URL not configured. Update visitor-tracker.js';
      resultEl.classList.add('test-result-fail');
      return;
    }

    try {
      // 1. Test basic connectivity (call total count RPC)
      const countRes = await fetch(`${SUPABASE_REST}/rpc/get_total_visit_count`, {
        method: 'POST',
        headers: supabaseHeaders()
      });
      if (!countRes.ok) throw new Error(`RPC failed: ${countRes.status} ${countRes.statusText}`);
      const total = await countRes.json();

      // 2. Test insert (write a test visit, then verify)
      const insertRes = await fetch(`${SUPABASE_REST}/page_visits`, {
        method: 'POST',
        headers: supabaseHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          page_path: '/__supabase_test__',
          visitor_ip: '0.0.0.0',
          user_agent: 'tracker-test'
        })
      });
      if (!insertRes.ok) throw new Error(`INSERT failed: ${insertRes.status} ${insertRes.statusText}`);

      resultEl.innerHTML = '<span class="material-icons" style="font-size:14px;vertical-align:middle;">check_circle</span> Connected! Total visits: ' + total;
      resultEl.classList.add('test-result-pass');
    } catch (e) {
      resultEl.textContent = 'Failed: ' + e.message;
      resultEl.classList.add('test-result-fail');
    }
  });
}

// ── Main entry point ──
async function initVisitTracker() {
  const pagePath = window.location.pathname;

  // ── Test / local dev mode ──
  if (!IS_PROD) {
    const backend = _getTestBackend();
    console.info(`Visitor tracker: TEST MODE — backend: ${backend}`);

    if (backend === 'supabase' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
      // Use real Supabase in test mode
      const [, pageCount, totalCount] = await Promise.all([
        recordVisit(pagePath),
        getVisitCount(pagePath),
        getTotalVisitCount()
      ]);
      renderCounter(pageCount, totalCount, true);
    } else {
      // Use localStorage
      localRecordVisit(pagePath);
      const pageCount = localGetPageCount(pagePath);
      const totalCount = localGetTotalCount();
      renderCounter(pageCount, totalCount, true);
    }

    renderTestControls();
    return;
  }

  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.warn('Visitor tracker: Supabase credentials not configured. See SETUP_VISITOR_TRACKING.md');
    return;
  }

  // Fire all three requests in parallel
  const [, pageCount, totalCount] = await Promise.all([
    recordVisit(pagePath),
    getVisitCount(pagePath),
    getTotalVisitCount()
  ]);

  renderCounter(pageCount, totalCount, false);
}

// ── Run on page load ──
window.addEventListener('load', initVisitTracker);

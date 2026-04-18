// ═══════════════════════════════════════════════════════
// Visitor Tracker — Supabase via Cloudflare Worker proxy
// ═══════════════════════════════════════════════════════
const API_BASE = 'https://vatslog-proxy.omvats89.workers.dev/rest/v1';

// ── Environment flag ──
// Auto-detects local dev (localhost / 127.0.0.1 / file://), or force override:
//   ?tracker=prod   → force production mode
//   ?tracker=test   → force test mode
const _trackerOverride = new URLSearchParams(window.location.search).get('tracker');
const IS_PROD = _trackerOverride === 'prod'
  ? true
  : _trackerOverride === 'test'
    ? false
    : !['localhost', '127.0.0.1', ''].includes(window.location.hostname);

function apiHeaders(extra) {
  return Object.assign({ 'Content-Type': 'application/json' }, extra || {});
}

// ── Get visitor IP + geo/network info ──
async function getVisitorInfo() {
  try {
    const data = await (await fetch('https://ipapi.co/json/')).json();
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

// ── Session dedup: only count once per page per browser session ──
const SESSION_KEY = 'vatslog_visited_pages';

function _isAlreadyVisited(pagePath) {
  try {
    return (JSON.parse(sessionStorage.getItem(SESSION_KEY)) || []).includes(pagePath);
  } catch (e) { return false; }
}

function _markVisited(pagePath) {
  try {
    const visited = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || [];
    if (!visited.includes(pagePath)) {
      visited.push(pagePath);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(visited));
    }
  } catch (e) { /* ignore */ }
}

// ── Record a page visit ──
async function recordVisit(pagePath) {
  const info = await getVisitorInfo();
  try {
    await fetch(`${API_BASE}/page_visits`, {
      method: 'POST',
      headers: apiHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify({
        page_path: pagePath, visitor_ip: info.ip, user_agent: navigator.userAgent,
        city: info.city, region: info.region, country: info.country,
        latitude: info.latitude, longitude: info.longitude, asn: info.asn, org: info.org
      })
    });
  } catch (e) {
    console.warn('Visitor tracker: could not record visit', e);
  }
}

// ── Get visit count for a specific page ──
async function getVisitCount(pagePath) {
  try {
    const res = await fetch(`${API_BASE}/rpc/get_page_visit_count`, {
      method: 'POST', headers: apiHeaders(),
      body: JSON.stringify({ page: pagePath })
    });
    return await res.json();
  } catch (e) {
    console.warn('Visitor tracker: could not get page count', e);
    return 0;
  }
}

// ── Get total site-wide visit count ──
async function getTotalVisitCount() {
  try {
    const res = await fetch(`${API_BASE}/rpc/get_total_visit_count`, {
      method: 'POST', headers: apiHeaders()
    });
    return await res.json();
  } catch (e) {
    console.warn('Visitor tracker: could not get total count', e);
    return 0;
  }
}

// ═══════════════════════════════════════════════════════
// Local Storage tracker (test mode + offline fallback)
// ═══════════════════════════════════════════════════════
const LS_KEY = 'vatslog_visits';
const LS_PENDING_KEY = 'vatslog_pending_sync';

function _getLocalVisits() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch (e) { return []; }
}

function localRecordVisit(pagePath) {
  const visits = _getLocalVisits();
  visits.push({ page_path: pagePath, visitor_ip: '127.0.0.1', user_agent: navigator.userAgent, visited_at: new Date().toISOString() });
  localStorage.setItem(LS_KEY, JSON.stringify(visits));
}

function localGetPageCount(pagePath) {
  return _getLocalVisits().filter(v => v.page_path === pagePath).length;
}

function localGetTotalCount() {
  return _getLocalVisits().length;
}

// ── Pending sync queue (for offline visits) ──
function _getPendingVisits() {
  try { return JSON.parse(localStorage.getItem(LS_PENDING_KEY)) || []; }
  catch (e) { return []; }
}

function queueVisitForSync(pagePath) {
  const pending = _getPendingVisits();
  pending.push({ page_path: pagePath, user_agent: navigator.userAgent, visited_at: new Date().toISOString() });
  localStorage.setItem(LS_PENDING_KEY, JSON.stringify(pending));
}

async function syncPendingVisits() {
  const pending = _getPendingVisits();
  if (pending.length === 0) return;

  let syncedCount = 0;
  for (const visit of pending) {
    try {
      const res = await fetch(`${API_BASE}/page_visits`, {
        method: 'POST',
        headers: apiHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          page_path: visit.page_path, visitor_ip: null, user_agent: visit.user_agent,
          city: null, region: null, country: null, latitude: null, longitude: null, asn: null, org: null
        })
      });
      if (res.ok) syncedCount++; else break;
    } catch (e) { break; }
  }

  if (syncedCount > 0) {
    localStorage.setItem(LS_PENDING_KEY, JSON.stringify(pending.slice(syncedCount)));
    console.info(`Visitor tracker: synced ${syncedCount} pending visit(s).`);
  }
}

// ── Connectivity check ──
async function isApiReachable() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/rpc/get_total_visit_count`, {
      method: 'POST', headers: apiHeaders(), signal: controller.signal
    });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) { return false; }
}

// ═══════════════════════════════════════════════════════
// Counter widget
// ═══════════════════════════════════════════════════════
function renderCounter(pageCount, totalCount, testMode) {
  if (document.getElementById('visit-counter')) return;

  const badge = testMode ? '<span style="font-size:10px;color:#ff9800;margin-left:6px;">[TEST]</span>' : '';
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

  if (document.getElementById('homepage')) counter.classList.add('visit-counter-home');

  const footer = document.querySelector('.site-footer');
  const container = document.querySelector('.page_contain') || document.getElementById('homepage');
  if (footer) footer.parentNode.insertBefore(counter, footer);
  else if (container) container.appendChild(counter);
  else document.body.appendChild(counter);
}

// ═══════════════════════════════════════════════════════
// Test-mode dev panel
// ═══════════════════════════════════════════════════════
const LS_BACKEND_KEY = 'vatslog_test_backend';

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
        Test Connection
      </button>
    </div>
    <div id="test-supabase-result" class="test-result"></div>
  `;
  document.body.appendChild(panel);

  document.getElementById('btn-backend-local').addEventListener('click', function () {
    localStorage.setItem(LS_BACKEND_KEY, 'local');
    location.reload();
  });
  document.getElementById('btn-backend-supabase').addEventListener('click', function () {
    localStorage.setItem(LS_BACKEND_KEY, 'supabase');
    location.reload();
  });
  document.getElementById('btn-test-supabase').addEventListener('click', async function () {
    const resultEl = document.getElementById('test-supabase-result');
    resultEl.textContent = 'Testing...';
    resultEl.className = 'test-result';
    try {
      const countRes = await fetch(`${API_BASE}/rpc/get_total_visit_count`, { method: 'POST', headers: apiHeaders() });
      if (!countRes.ok) throw new Error(`RPC failed: ${countRes.status}`);
      const total = await countRes.json();
      resultEl.innerHTML = '<span class="material-icons" style="font-size:14px;vertical-align:middle;">check_circle</span> Connected! Total visits: ' + total;
      resultEl.classList.add('test-result-pass');
    } catch (e) {
      resultEl.textContent = 'Failed: ' + e.message;
      resultEl.classList.add('test-result-fail');
    }
  });
}

// ═══════════════════════════════════════════════════════
// Main entry point
// ═══════════════════════════════════════════════════════
async function trackWithApi(pagePath, testMode) {
  await syncPendingVisits();
  if (!_isAlreadyVisited(pagePath)) {
    await recordVisit(pagePath);
    _markVisited(pagePath);
  }
  const [pageCount, totalCount] = await Promise.all([getVisitCount(pagePath), getTotalVisitCount()]);
  renderCounter(pageCount, totalCount, testMode);
}

function trackWithLocal(pagePath, testMode) {
  if (!_isAlreadyVisited(pagePath)) {
    localRecordVisit(pagePath);
    queueVisitForSync(pagePath);
    _markVisited(pagePath);
  }
  renderCounter(localGetPageCount(pagePath), localGetTotalCount(), testMode);
}

async function initVisitTracker() {
  const pagePath = window.location.pathname;

  if (!IS_PROD) {
    const backend = _getTestBackend();
    console.info(`Visitor tracker: TEST MODE — backend: ${backend}`);

    if (backend === 'supabase' && await isApiReachable()) {
      await trackWithApi(pagePath, true);
    } else {
      if (backend === 'supabase') console.warn('Visitor tracker: API unreachable, falling back to localStorage.');
      trackWithLocal(pagePath, true);
    }
    renderTestControls();
    return;
  }

  if (await isApiReachable()) {
    await trackWithApi(pagePath, false);
  } else {
    console.warn('Visitor tracker: API unreachable, falling back to localStorage.');
    trackWithLocal(pagePath, false);
  }
}

window.addEventListener('load', initVisitTracker);

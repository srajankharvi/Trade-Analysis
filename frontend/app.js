/* ══════════════════════════════════════════════════
   TradeJournal — Application JavaScript
   Complete SPA with API integration
   ══════════════════════════════════════════════════ */

// API base URL — set window.API_BASE_URL before this script loads to override (e.g. for production)
const API_BASE = window.API_BASE_URL || 'http://127.0.0.1:8000';

/* ── State ── */
const state = {
    token: localStorage.getItem('tj_token') || null,
    user: JSON.parse(localStorage.getItem('tj_user') || 'null'),
    currentPage: 'dashboard',
};

/* ══════════════ API Utility ══════════════ */

async function api(path, options = {}) {
    const headers = { ...options.headers };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || 'Request failed');
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res;
}

/* ══════════════ Toast Notifications ══════════════ */

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

/* ══════════════ Auth ══════════════ */

function saveAuth(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('tj_token', token);
    localStorage.setItem('tj_user', JSON.stringify(user));
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('tj_token');
    localStorage.removeItem('tj_user');
    renderApp();
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
        if (!data) return;
        state.token = data.access_token;
        const user = await api('/api/auth/me');
        saveAuth(data.access_token, user);
        showToast('Welcome back!', 'success');
        renderApp();
    } catch (err) { showToast(err.message, 'error'); }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    try {
        await api('/api/auth/register', { method: 'POST', body: { name, email, password } });
        showToast('Registration successful! Please login.', 'success');
        showLoginPage();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ══════════════ Router ══════════════ */

function navigate(page) {
    state.currentPage = page;
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
    renderPage();
    // Close sidebar on mobile
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
}

/* ══════════════ SVG Icons ══════════════ */

const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    trades: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
};

/* ══════════════ Render App ══════════════ */

function renderApp() {
    const root = document.getElementById('app');
    if (!state.token) {
        showLoginPage();
        return;
    }
    root.innerHTML = `
        <div class="app-layout">
            <div class="sidebar-overlay" onclick="toggleSidebar()"></div>
            <div class="mobile-header">
                <button class="burger" onclick="toggleSidebar()">${icons.menu}</button>
                <span style="font-weight:800;color:var(--text-primary);letter-spacing:-0.5px;">TradeJournal</span>
                <div></div>
            </div>
            <aside class="sidebar">
                <div class="sidebar-brand">📊 TradeJournal</div>
                <nav class="sidebar-nav">
                    <a href="#" data-page="dashboard" onclick="navigate('dashboard');return false">${icons.dashboard}<span>Dashboard</span></a>
                    <a href="#" data-page="calendar" onclick="navigate('calendar');return false">${icons.calendar}<span>Calendar</span></a>
                    <a href="#" data-page="trades" onclick="navigate('trades');return false">${icons.trades}<span>Trades</span></a>
                    <a href="#" data-page="analytics" onclick="navigate('analytics');return false">${icons.analytics}<span>Analytics</span></a>
                    <a href="#" data-page="reports" onclick="navigate('reports');return false">${icons.reports}<span>Reports</span></a>
                </nav>
                <div class="sidebar-footer">
                    <div class="user-avatar">${(state.user?.name || 'U')[0].toUpperCase()}</div>
                    <div style="flex:1;overflow:hidden;">
                        <div style="font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${state.user?.name || ''}</div>
                        <div style="font-size:0.75rem;">${state.user?.email || ''}</div>
                    </div>
                    <button class="btn-icon" onclick="logout()" title="Logout" style="flex-shrink:0;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
            </aside>
            <main class="main-content" id="page-content"></main>
        </div>
    `;
    navigate(state.currentPage);
}

function toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('open');
    document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}

/* ══════════════ Auth Pages ══════════════ */

function showLoginPage() {
    document.getElementById('app').innerHTML = `
        <div class="auth-container">
            <div class="auth-box">
                <h1>TradeJournal</h1>
                <p class="subtitle">Sign in to your trading journal</p>
                <form onsubmit="handleLogin(event)">
                    <div class="form-group"><label>Email</label><input type="email" id="login-email" required placeholder="you@example.com"></div>
                    <div class="form-group"><label>Password</label><input type="password" id="login-password" required placeholder="••••••••"></div>
                    <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">Sign In</button>
                </form>
                <div class="auth-link">Don't have an account? <a href="#" onclick="showRegisterPage();return false;">Register</a></div>
            </div>
        </div>
    `;
}

function showRegisterPage() {
    document.getElementById('app').innerHTML = `
        <div class="auth-container">
            <div class="auth-box">
                <h1>Create Account</h1>
                <p class="subtitle">Start your trading journal</p>
                <form onsubmit="handleRegister(event)">
                    <div class="form-group"><label>Name</label><input type="text" id="reg-name" required placeholder="John Doe"></div>
                    <div class="form-group"><label>Email</label><input type="email" id="reg-email" required placeholder="you@example.com"></div>
                    <div class="form-group"><label>Password</label><input type="password" id="reg-password" required minlength="6" placeholder="Min 6 characters"></div>
                    <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">Create Account</button>
                </form>
                <div class="auth-link">Already have an account? <a href="#" onclick="showLoginPage();return false;">Sign In</a></div>
            </div>
        </div>
    `;
}

/* ══════════════ Page Router ══════════════ */

function renderPage() {
    const el = document.getElementById('page-content');
    if (!el) return;
    el.innerHTML = '<div style="padding:40px;text-align:center;"><div class="skeleton" style="width:200px;height:24px;margin:0 auto 12px;"></div><div class="skeleton" style="width:300px;height:16px;margin:0 auto;"></div></div>';
    switch (state.currentPage) {
        case 'dashboard': renderDashboard(); break;
        case 'calendar': renderCalendar(); break;
        case 'trades': renderTrades(); break;
        case 'analytics': renderAnalytics(); break;
        case 'reports': renderReports(); break;
        case 'day': renderDayView(); break;
        default: renderDashboard();
    }
}

/* ══════════════ Dashboard ══════════════ */

async function renderDashboard() {
    const el = document.getElementById('page-content');
    try {
        const [overview, pnlData, recentDays] = await Promise.all([
            api('/api/analytics/overview'),
            api('/api/analytics/pnl'),
            api('/api/trading-days'),
        ]);
        if (!overview) return;

        const pnlClass = overview.net_pnl >= 0 ? 'positive' : 'negative';
        const winRateClass = overview.win_rate >= 50 ? 'positive' : 'negative';

        el.innerHTML = `
            <div class="page-header">
                <h1>Dashboard</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="openAddTradeModal();">${icons.plus} Add Trade</button>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Net P&L</div><div class="stat-value ${pnlClass}">₹${formatNum(overview.net_pnl)}</div></div>
                <div class="stat-card"><div class="stat-label">Total Trades</div><div class="stat-value">${overview.total_trades}</div></div>
                <div class="stat-card"><div class="stat-label">Win Rate</div><div class="stat-value ${winRateClass}">${overview.win_rate}%</div></div>
                <div class="stat-card"><div class="stat-label">Winning</div><div class="stat-value positive">${overview.winning_trades}</div></div>
                <div class="stat-card"><div class="stat-label">Losing</div><div class="stat-value negative">${overview.losing_trades}</div></div>
                <div class="stat-card"><div class="stat-label">Best Trade</div><div class="stat-value positive">₹${formatNum(overview.best_trade)}</div></div>
                <div class="stat-card"><div class="stat-label">Worst Trade</div><div class="stat-value negative">₹${formatNum(overview.worst_trade)}</div></div>
                <div class="stat-card"><div class="stat-label">Avg Duration</div><div class="stat-value">${overview.average_duration_minutes}m</div></div>
            </div>
            <div class="charts-grid">
                <div class="card"><div class="card-header"><h2>P&L Over Time</h2></div><div class="chart-container"><canvas id="chart-pnl"></canvas></div></div>
                <div class="card"><div class="card-header"><h2>Cumulative P&L</h2></div><div class="chart-container"><canvas id="chart-cum-pnl"></canvas></div></div>
            </div>
            <div class="card">
                <div class="card-header"><h2>Recent Trading Days</h2></div>
                ${recentDays.length === 0 ? '<div class="empty-state"><h3>No trading days yet</h3><p>Add your first trade to get started.</p></div>' : `
                <div class="table-wrap"><table>
                    <thead><tr><th>Date</th><th>Trades</th><th>Won</th><th>Lost</th><th>P&L</th></tr></thead>
                    <tbody>${recentDays.slice(0, 10).map(d => `
                        <tr onclick="openDayView('${d.date}')" style="cursor:pointer;">
                            <td>${formatDate(d.date)}</td>
                            <td>${d.trade_count}</td>
                            <td style="color:var(--green)">${d.winning_trades || 0}</td>
                            <td style="color:var(--red)">${d.losing_trades || 0}</td>
                            <td class="${(d.pnl||0) >= 0 ? 'positive' : 'negative'}" style="font-weight:600;color:var(${(d.pnl||0) >= 0 ? '--green' : '--red'})">₹${formatNum(d.pnl)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>`}
            </div>
        `;
        // Render charts
        if (pnlData && pnlData.length > 0) {
            renderPnlChart('chart-pnl', pnlData);
            renderCumulativeChart('chart-cum-pnl', pnlData);
        }
    } catch (err) { el.innerHTML = `<div class="empty-state"><h3>Error loading dashboard</h3><p>${err.message}</p></div>`; }
}

/* ══════════════ Calendar ══════════════ */

let calendarYear, calendarMonth;

async function renderCalendar() {
    const el = document.getElementById('page-content');
    const now = new Date();
    if (!calendarYear) { calendarYear = now.getFullYear(); calendarMonth = now.getMonth(); }
    const y = calendarYear, m = calendarMonth;
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const monthName = new Date(y, m).toLocaleString('default', { month: 'long', year: 'numeric' });
    const startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    let days = [];
    try { days = await api(`/api/trading-days?start_date=${startDate}&end_date=${endDate}`); } catch (e) {}
    const dayMap = {};
    (days || []).forEach(d => { dayMap[d.date] = d; });

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let cells = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => { cells += `<div class="calendar-day-label">${d}</div>`; });
    for (let i = 0; i < firstDay; i++) cells += '<div class="calendar-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const data = dayMap[dateStr];
        const isToday = dateStr === todayStr;
        let cls = 'calendar-day';
        if (isToday) cls += ' today';
        if (data && data.trade_count > 0) cls += ' has-trades';
        cells += `<div class="${cls}" onclick="openDayView('${dateStr}')">
            <div class="day-num">${d}</div>
            ${data && data.trade_count > 0 ? `
                <div class="day-pnl ${(data.pnl || 0) >= 0 ? 'positive' : 'negative'}">₹${formatNum(data.pnl)}</div>
                <div class="day-trades">${data.trade_count} trade${data.trade_count > 1 ? 's' : ''}</div>
            ` : ''}
        </div>`;
    }

    el.innerHTML = `
        <div class="page-header"><h1>Calendar</h1></div>
        <div class="calendar-wrapper">
            <div class="calendar-header">
                <button class="btn btn-outline btn-sm" onclick="calendarMonth--;if(calendarMonth<0){calendarMonth=11;calendarYear--;}renderCalendar();">← Prev</button>
                <h2>${monthName}</h2>
                <button class="btn btn-outline btn-sm" onclick="calendarMonth++;if(calendarMonth>11){calendarMonth=0;calendarYear++;}renderCalendar();">Next →</button>
            </div>
            <div class="calendar-grid">${cells}</div>
        </div>
    `;
}

/* ══════════════ Day View ══════════════ */

let currentDayDate = null;

function openDayView(date) {
    currentDayDate = date;
    state.currentPage = 'day';
    renderPage();
}

async function renderDayView() {
    const el = document.getElementById('page-content');
    const date = currentDayDate;
    if (!date) { navigate('calendar'); return; }

    try {
        let dayData;
        try { dayData = await api(`/api/trading-days/${date}`); } catch { dayData = null; }

        const trades = dayData?.trades || [];
        const pnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
        const wins = trades.filter(t => (t.pnl || 0) > 0).length;
        const losses = trades.filter(t => (t.pnl || 0) < 0).length;

        el.innerHTML = `
            <div class="page-header">
                <div>
                    <button class="btn btn-outline btn-sm" onclick="navigate('calendar');return false;" style="margin-bottom:8px;">← Back to Calendar</button>
                    <h1>${formatDate(date)}</h1>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="openAddTradeModal('${date}')">${icons.plus} Add Trade</button>
                    ${dayData ? `<button class="btn btn-outline" onclick="openReflectionModal('${date}');">${icons.edit} Reflection</button>` : ''}
                </div>
            </div>
            ${trades.length > 0 ? `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Trades</div><div class="stat-value">${trades.length}</div></div>
                <div class="stat-card"><div class="stat-label">Won / Lost</div><div class="stat-value"><span style="color:var(--green)">${wins}</span> / <span style="color:var(--red)">${losses}</span></div></div>
                <div class="stat-card"><div class="stat-label">Win Rate</div><div class="stat-value">${trades.length ? Math.round(wins / trades.length * 100) : 0}%</div></div>
                <div class="stat-card"><div class="stat-label">Net P&L</div><div class="stat-value ${pnl >= 0 ? 'positive' : 'negative'}">₹${formatNum(pnl)}</div></div>
            </div>` : ''}
            ${dayData && (dayData.what_went_well || dayData.mistakes || dayData.tomorrow_plan) ? `
            <div class="card" style="margin-bottom:20px;">
                <div class="card-header"><h2>Daily Reflection</h2></div>
                ${dayData.what_went_well ? `<p style="margin-bottom:8px;"><strong style="color:var(--green);">What went well:</strong> ${dayData.what_went_well}</p>` : ''}
                ${dayData.mistakes ? `<p style="margin-bottom:8px;"><strong style="color:var(--red);">Mistakes:</strong> ${dayData.mistakes}</p>` : ''}
                ${dayData.tomorrow_plan ? `<p style="margin-bottom:8px;"><strong style="color:var(--accent);">Tomorrow's plan:</strong> ${dayData.tomorrow_plan}</p>` : ''}
                ${dayData.day_rating ? `<p><strong>Rating:</strong> ${dayData.day_rating}</p>` : ''}
            </div>` : ''}
            <div class="card">
                <div class="card-header"><h2>Trade Timeline</h2></div>
                ${trades.length === 0 ? '<div class="empty-state"><h3>No trades for this day</h3><p>Click "Add Trade" to record your first trade.</p></div>' : `
                <div class="timeline">
                    ${trades.map(t => `
                    <div class="timeline-item ${(t.pnl || 0) > 0 ? 'win' : (t.pnl || 0) < 0 ? 'loss' : ''}" onclick="openTradeDetail('${t.id}')">
                        <div class="timeline-time">${t.entry_time || '—'}${t.exit_time ? ' → ' + t.exit_time : ''}</div>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <span class="timeline-symbol">${t.symbol}</span>
                                <span class="badge ${t.trade_type === 'BUY' ? 'badge-green' : 'badge-red'}" style="margin-left:8px;">${t.trade_type}</span>
                                ${t.strategy ? `<span class="tag">${t.strategy}</span>` : ''}
                            </div>
                            <div class="timeline-pnl" style="color:var(${(t.pnl || 0) >= 0 ? '--green' : '--red'});">₹${formatNum(t.pnl)}</div>
                        </div>
                        <div class="timeline-meta">
                            <span>Qty: ${t.quantity}</span>
                            <span>Entry: ₹${formatNum(t.entry_price)}</span>
                            ${t.exit_price ? `<span>Exit: ₹${formatNum(t.exit_price)}</span>` : ''}
                            ${t.duration_minutes ? `<span>Duration: ${t.duration_minutes}m</span>` : ''}
                        </div>
                    </div>`).join('')}
                </div>`}
            </div>
        `;
    } catch (err) { el.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`; }
}

/* ══════════════ Trades List ══════════════ */

let tradesPage = 1;
let tradesFilters = {};

async function renderTrades() {
    const el = document.getElementById('page-content');
    const params = new URLSearchParams();
    params.set('page', tradesPage);
    params.set('limit', '20');
    Object.entries(tradesFilters).forEach(([k, v]) => { if (v) params.set(k, v); });

    try {
        const data = await api(`/api/trades?${params}`);
        if (!data) return;

        el.innerHTML = `
            <div class="page-header">
                <h1>Trades</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="openAddTradeModal();">${icons.plus} Add Trade</button>
                </div>
            </div>
            <div class="filter-bar">
                <div class="form-group"><label>Symbol</label><input type="text" id="filter-symbol" value="${tradesFilters.symbol || ''}" placeholder="e.g. NIFTY"></div>
                <div class="form-group"><label>Strategy</label><input type="text" id="filter-strategy" value="${tradesFilters.strategy || ''}" placeholder="e.g. Breakout"></div>
                <div class="form-group"><label>From</label><input type="date" id="filter-start" value="${tradesFilters.start_date || ''}"></div>
                <div class="form-group"><label>To</label><input type="date" id="filter-end" value="${tradesFilters.end_date || ''}"></div>
                <div class="form-group"><label>Type</label><select id="filter-type"><option value="">All</option><option value="BUY" ${tradesFilters.trade_type === 'BUY' ? 'selected' : ''}>BUY</option><option value="SELL" ${tradesFilters.trade_type === 'SELL' ? 'selected' : ''}>SELL</option></select></div>
                <div class="form-group"><label>Result</label><select id="filter-result"><option value="">All</option><option value="WIN" ${tradesFilters.result === 'WIN' ? 'selected' : ''}>Win</option><option value="LOSS" ${tradesFilters.result === 'LOSS' ? 'selected' : ''}>Loss</option></select></div>
                <div class="form-group" style="display:flex;gap:8px;align-items:flex-end;">
                    <button class="btn btn-primary btn-sm" onclick="applyTradeFilters();">${icons.search} Search</button>
                    <button class="btn btn-outline btn-sm" onclick="clearTradeFilters();">Clear</button>
                </div>
            </div>
            ${data.trades.length === 0 ? '<div class="empty-state"><h3>No trades found</h3><p>Try adjusting your filters or add a new trade.</p></div>' : `
            <div class="card" style="padding:0;overflow:hidden;">
                <div class="table-wrap"><table>
                    <thead><tr><th>Date</th><th>Symbol</th><th>Type</th><th>Strategy</th><th>Entry</th><th>Exit</th><th>Qty</th><th>P&L</th><th>Duration</th><th></th></tr></thead>
                    <tbody>${data.trades.map(t => `
                        <tr>
                            <td>${t.entry_date}</td>
                            <td style="font-weight:600;">${t.symbol}</td>
                            <td><span class="badge ${t.trade_type === 'BUY' ? 'badge-green' : 'badge-red'}">${t.trade_type}</span></td>
                            <td>${t.strategy || '—'}</td>
                            <td>₹${formatNum(t.entry_price)}</td>
                            <td>${t.exit_price ? '₹' + formatNum(t.exit_price) : '—'}</td>
                            <td>${t.quantity}</td>
                            <td style="font-weight:600;color:var(${(t.pnl || 0) >= 0 ? '--green' : '--red'});">₹${formatNum(t.pnl)}</td>
                            <td>${t.duration_minutes ? t.duration_minutes + 'm' : '—'}</td>
                            <td>
                                <button class="btn-icon" onclick="openTradeDetail('${t.id}')" title="View">${icons.edit}</button>
                                <button class="btn-icon" onclick="deleteTrade('${t.id}')" title="Delete">${icons.trash}</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>
            </div>
            <div class="pagination">
                <button ${data.page <= 1 ? 'disabled' : ''} onclick="tradesPage=${data.page - 1};renderTrades();">← Prev</button>
                <span class="page-info">Page ${data.page} of ${data.pages} (${data.total} trades)</span>
                <button ${data.page >= data.pages ? 'disabled' : ''} onclick="tradesPage=${data.page + 1};renderTrades();">Next →</button>
            </div>`}
        `;
    } catch (err) { el.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`; }
}

function applyTradeFilters() {
    tradesFilters = {
        symbol: document.getElementById('filter-symbol')?.value || '',
        strategy: document.getElementById('filter-strategy')?.value || '',
        start_date: document.getElementById('filter-start')?.value || '',
        end_date: document.getElementById('filter-end')?.value || '',
        trade_type: document.getElementById('filter-type')?.value || '',
        result: document.getElementById('filter-result')?.value || '',
    };
    tradesPage = 1;
    renderTrades();
}

function clearTradeFilters() {
    tradesFilters = {};
    tradesPage = 1;
    renderTrades();
}

async function deleteTrade(id) {
    if (!confirm('Delete this trade?')) return;
    try {
        await api(`/api/trades/${id}`, { method: 'DELETE' });
        showToast('Trade deleted', 'success');
        renderPage();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ══════════════ Trade Detail / Edit Modal ══════════════ */

async function openTradeDetail(id) {
    try {
        const trade = await api(`/api/trades/${id}`);
        if (!trade) return;
        const screenshots = await api(`/api/trades/${id}/screenshots`).catch(() => []);
        showTradeModal(trade, screenshots || []);
    } catch (err) { showToast(err.message, 'error'); }
}

function showTradeModal(trade, screenshots) {
    const mistakeOptions = ['Late Entry', 'Early Exit', 'FOMO', 'Overtrading', 'Revenge Trading', 'Ignored Stop Loss', 'Increased Position Size', 'Other'];
    const existing = trade.mistakes || [];

    openModal(`Trade: ${trade.symbol}`, `
        <form id="edit-trade-form" class="form-grid">
            <div class="form-section-title">Basic Info</div>
            <div class="form-group"><label>Symbol</label><input name="symbol" value="${trade.symbol}" required></div>
            <div class="form-group"><label>Instrument</label><select name="instrument"><option value="">Select</option>${['Stock','Index','Options','Futures','Forex','Crypto','Other'].map(i => `<option ${trade.instrument === i ? 'selected' : ''}>${i}</option>`).join('')}</select></div>
            <div class="form-group"><label>Type</label><select name="trade_type"><option value="BUY" ${trade.trade_type === 'BUY' ? 'selected' : ''}>BUY</option><option value="SELL" ${trade.trade_type === 'SELL' ? 'selected' : ''}>SELL</option></select></div>
            <div class="form-group"><label>Strategy</label><input name="strategy" value="${trade.strategy || ''}"></div>
            <div class="form-group full"><label>Setup</label><input name="setup" value="${trade.setup || ''}"></div>

            <div class="form-section-title">Timing</div>
            <div class="form-group"><label>Entry Date</label><input type="date" name="entry_date" value="${trade.entry_date}" required></div>
            <div class="form-group"><label>Entry Time</label><input type="time" name="entry_time" value="${trade.entry_time}" required></div>
            <div class="form-group"><label>Exit Date</label><input type="date" name="exit_date" value="${trade.exit_date || ''}"></div>
            <div class="form-group"><label>Exit Time</label><input type="time" name="exit_time" value="${trade.exit_time || ''}"></div>

            <div class="form-section-title">Prices</div>
            <div class="form-group"><label>Entry Price</label><input type="number" step="0.01" name="entry_price" value="${trade.entry_price}" required></div>
            <div class="form-group"><label>Exit Price</label><input type="number" step="0.01" name="exit_price" value="${trade.exit_price || ''}"></div>
            <div class="form-group"><label>Quantity</label><input type="number" step="0.01" name="quantity" value="${trade.quantity}" required></div>
            <div class="form-group"><label>Stop Loss</label><input type="number" step="0.01" name="stop_loss" value="${trade.stop_loss || ''}"></div>
            <div class="form-group"><label>Target</label><input type="number" step="0.01" name="target" value="${trade.target || ''}"></div>

            <div class="form-section-title">Analysis</div>
            <div class="form-group"><label>Market Condition</label><select name="market_condition"><option value="">Select</option>${['Trending','Ranging','Volatile','Calm'].map(c => `<option ${trade.market_condition === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="form-group"><label>Followed Plan</label><select name="followed_plan"><option value="">Select</option><option ${trade.followed_plan === 'YES' ? 'selected' : ''}>YES</option><option ${trade.followed_plan === 'PARTIAL' ? 'selected' : ''}>PARTIAL</option><option ${trade.followed_plan === 'NO' ? 'selected' : ''}>NO</option></select></div>
            <div class="form-group full"><label>Entry Reason</label><textarea name="entry_reason">${trade.entry_reason || ''}</textarea></div>
            <div class="form-group full"><label>Exit Reason</label><textarea name="exit_reason">${trade.exit_reason || ''}</textarea></div>

            <div class="form-section-title">Psychology</div>
            <div class="form-group"><label>Emotion Before</label><select name="emotion_before"><option value="">Select</option>${['Confident','Anxious','Calm','Fearful','Excited','Greedy','Neutral'].map(e => `<option ${trade.emotion_before === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
            <div class="form-group"><label>Emotion After</label><select name="emotion_after"><option value="">Select</option>${['Satisfied','Frustrated','Regretful','Relieved','Neutral','Happy','Disappointed'].map(e => `<option ${trade.emotion_after === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>

            <div class="form-section-title">Mistakes</div>
            <div class="form-group full"><div class="checkbox-group">${mistakeOptions.map(m => `<label><input type="checkbox" name="mistakes" value="${m}" ${existing.includes(m) ? 'checked' : ''}><span>${m}</span></label>`).join('')}</div></div>

            <div class="form-section-title">Notes</div>
            <div class="form-group full"><textarea name="notes">${trade.notes || ''}</textarea></div>
        </form>

        <div style="margin-top:16px;">
            <div class="form-section-title" style="margin-top:0;">Screenshots</div>
            <div class="screenshot-grid" id="ss-grid">${screenshots.map(ss => `
                <div class="screenshot-item">
                    <img src="${API_BASE}${ss.file_url}" alt="Screenshot" onclick="window.open('${API_BASE}${ss.file_url}','_blank')">
                    <button class="delete-btn" onclick="deleteScreenshot('${ss.id}','${trade.id}')">${icons.close}</button>
                </div>`).join('')}
            </div>
            <div style="margin-top:12px;">
                <input type="file" id="ss-upload" accept=".jpg,.jpeg,.png,.webp" style="display:none" onchange="uploadScreenshot('${trade.id}')">
                <button class="btn btn-outline btn-sm" onclick="document.getElementById('ss-upload').click();">${icons.upload} Upload Screenshot</button>
            </div>
        </div>
    `, [
        { label: 'Save Changes', class: 'btn btn-primary', onclick: () => saveTradeEdit(trade.id) },
        { label: 'Delete', class: 'btn btn-danger', onclick: () => { deleteTrade(trade.id); closeModal(); } },
    ]);
}

async function saveTradeEdit(id) {
    const form = document.getElementById('edit-trade-form');
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { if (k === 'mistakes') { if (!data.mistakes) data.mistakes = []; data.mistakes.push(v); } else { data[k] = v; } });
    if (!data.mistakes) data.mistakes = [];
    ['entry_price', 'exit_price', 'quantity', 'stop_loss', 'target'].forEach(f => { if (data[f] === '') delete data[f]; else if (data[f]) data[f] = parseFloat(data[f]); });
    try {
        await api(`/api/trades/${id}`, { method: 'PUT', body: data });
        showToast('Trade updated', 'success');
        closeModal();
        renderPage();
    } catch (err) { showToast(err.message, 'error'); }
}

async function uploadScreenshot(tradeId) {
    const input = document.getElementById('ss-upload');
    if (!input.files[0]) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    try {
        await api(`/api/trades/${tradeId}/screenshots`, { method: 'POST', body: fd });
        showToast('Screenshot uploaded', 'success');
        openTradeDetail(tradeId);
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteScreenshot(ssId, tradeId) {
    if (!confirm('Delete this screenshot?')) return;
    try {
        await api(`/api/screenshots/${ssId}`, { method: 'DELETE' });
        showToast('Screenshot deleted', 'success');
        openTradeDetail(tradeId);
    } catch (err) { showToast(err.message, 'error'); }
}

/* ══════════════ Add Trade Modal ══════════════ */

function openAddTradeModal(date) {
    const today = date || new Date().toISOString().split('T')[0];
    const mistakeOptions = ['Late Entry', 'Early Exit', 'FOMO', 'Overtrading', 'Revenge Trading', 'Ignored Stop Loss', 'Increased Position Size', 'Other'];

    openModal('Add New Trade', `
        <form id="add-trade-form" class="form-grid">
            <div class="form-section-title">Basic Info</div>
            <div class="form-group"><label>Symbol *</label><input name="symbol" required placeholder="e.g. NIFTY"></div>
            <div class="form-group"><label>Instrument</label><select name="instrument"><option value="">Select</option><option>Stock</option><option>Index</option><option>Options</option><option>Futures</option><option>Forex</option><option>Crypto</option><option>Other</option></select></div>
            <div class="form-group"><label>Type *</label><select name="trade_type" required><option value="BUY">BUY</option><option value="SELL">SELL</option></select></div>
            <div class="form-group"><label>Strategy</label><input name="strategy" placeholder="e.g. Breakout"></div>
            <div class="form-group full"><label>Setup</label><input name="setup" placeholder="e.g. Resistance breakout"></div>

            <div class="form-section-title">Timing</div>
            <div class="form-group"><label>Entry Date *</label><input type="date" name="entry_date" value="${today}" required></div>
            <div class="form-group"><label>Entry Time *</label><input type="time" name="entry_time" required></div>
            <div class="form-group"><label>Exit Date</label><input type="date" name="exit_date" value="${today}"></div>
            <div class="form-group"><label>Exit Time</label><input type="time" name="exit_time"></div>

            <div class="form-section-title">Prices</div>
            <div class="form-group"><label>Entry Price *</label><input type="number" step="0.01" name="entry_price" required placeholder="0.00"></div>
            <div class="form-group"><label>Exit Price</label><input type="number" step="0.01" name="exit_price" placeholder="0.00"></div>
            <div class="form-group"><label>Quantity *</label><input type="number" step="0.01" name="quantity" required placeholder="1"></div>
            <div class="form-group"><label>Stop Loss</label><input type="number" step="0.01" name="stop_loss" placeholder="0.00"></div>
            <div class="form-group"><label>Target</label><input type="number" step="0.01" name="target" placeholder="0.00"></div>

            <div class="form-section-title">Analysis</div>
            <div class="form-group"><label>Market Condition</label><select name="market_condition"><option value="">Select</option><option>Trending</option><option>Ranging</option><option>Volatile</option><option>Calm</option></select></div>
            <div class="form-group"><label>Followed Plan</label><select name="followed_plan"><option value="">Select</option><option value="YES">Yes</option><option value="PARTIAL">Partial</option><option value="NO">No</option></select></div>
            <div class="form-group full"><label>Entry Reason</label><textarea name="entry_reason" placeholder="Why did you enter?"></textarea></div>
            <div class="form-group full"><label>Exit Reason</label><textarea name="exit_reason" placeholder="Why did you exit?"></textarea></div>

            <div class="form-section-title">Psychology</div>
            <div class="form-group"><label>Emotion Before</label><select name="emotion_before"><option value="">Select</option><option>Confident</option><option>Anxious</option><option>Calm</option><option>Fearful</option><option>Excited</option><option>Greedy</option><option>Neutral</option></select></div>
            <div class="form-group"><label>Emotion After</label><select name="emotion_after"><option value="">Select</option><option>Satisfied</option><option>Frustrated</option><option>Regretful</option><option>Relieved</option><option>Neutral</option><option>Happy</option><option>Disappointed</option></select></div>

            <div class="form-section-title">Mistakes</div>
            <div class="form-group full"><div class="checkbox-group">${mistakeOptions.map(m => `<label><input type="checkbox" name="mistakes" value="${m}"><span>${m}</span></label>`).join('')}</div></div>

            <div class="form-section-title">Notes</div>
            <div class="form-group full"><textarea name="notes" placeholder="Additional notes..."></textarea></div>
        </form>
    `, [
        { label: 'Save Trade', class: 'btn btn-primary', onclick: () => saveNewTrade() },
    ]);
}

async function saveNewTrade() {
    const form = document.getElementById('add-trade-form');
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { if (k === 'mistakes') { if (!data.mistakes) data.mistakes = []; data.mistakes.push(v); } else { data[k] = v; } });
    if (!data.mistakes) data.mistakes = [];
    ['entry_price', 'exit_price', 'quantity', 'stop_loss', 'target'].forEach(f => { if (data[f] === '') delete data[f]; else if (data[f]) data[f] = parseFloat(data[f]); });
    if (!data.exit_date) delete data.exit_date;
    if (!data.exit_time) delete data.exit_time;
    const tradeDate = data.entry_date;
    try {
        await api(`/api/trading-days/${tradeDate}/trades`, { method: 'POST', body: data });
        showToast('Trade added!', 'success');
        closeModal();
        renderPage();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ══════════════ Reflection Modal ══════════════ */

async function openReflectionModal(date) {
    let day;
    try { day = await api(`/api/trading-days/${date}`); } catch { day = {}; }

    openModal(`Daily Reflection — ${formatDate(date)}`, `
        <form id="reflection-form">
            <div class="form-group"><label>What went well</label><textarea name="what_went_well">${day.what_went_well || ''}</textarea></div>
            <div class="form-group"><label>Mistakes / What went wrong</label><textarea name="mistakes">${day.mistakes || ''}</textarea></div>
            <div class="form-group"><label>Tomorrow's plan</label><textarea name="tomorrow_plan">${day.tomorrow_plan || ''}</textarea></div>
            <div class="form-group"><label>Daily Notes</label><textarea name="daily_notes">${day.daily_notes || ''}</textarea></div>
            <div class="form-group"><label>Day Rating</label><select name="day_rating"><option value="">Select</option>${['Excellent','Good','Average','Poor','Terrible'].map(r => `<option ${day.day_rating === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
        </form>
    `, [
        { label: 'Save Reflection', class: 'btn btn-primary', onclick: () => saveReflection(date) },
    ]);
}

async function saveReflection(date) {
    const form = document.getElementById('reflection-form');
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { data[k] = v; });
    try {
        await api(`/api/trading-days/${date}`, { method: 'PUT', body: data });
        showToast('Reflection saved', 'success');
        closeModal();
        renderPage();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ══════════════ Analytics ══════════════ */

async function renderAnalytics() {
    const el = document.getElementById('page-content');
    try {
        const [overview, pnlData, strategies, timeData, mistakes, emotions] = await Promise.all([
            api('/api/analytics/overview'),
            api('/api/analytics/pnl'),
            api('/api/analytics/strategies'),
            api('/api/analytics/time'),
            api('/api/analytics/mistakes'),
            api('/api/analytics/emotions'),
        ]);
        if (!overview) return;

        el.innerHTML = `
            <div class="page-header"><h1>Analytics</h1></div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Total Trades</div><div class="stat-value">${overview.total_trades}</div></div>
                <div class="stat-card"><div class="stat-label">Win Rate</div><div class="stat-value ${overview.win_rate >= 50 ? 'positive' : 'negative'}">${overview.win_rate}%</div></div>
                <div class="stat-card"><div class="stat-label">Net P&L</div><div class="stat-value ${overview.net_pnl >= 0 ? 'positive' : 'negative'}">₹${formatNum(overview.net_pnl)}</div></div>
                <div class="stat-card"><div class="stat-label">Avg P&L</div><div class="stat-value ${overview.average_pnl >= 0 ? 'positive' : 'negative'}">₹${formatNum(overview.average_pnl)}</div></div>
            </div>

            <div class="charts-grid">
                <div class="card"><div class="card-header"><h2>Cumulative P&L</h2></div><div class="chart-container"><canvas id="a-chart-cum"></canvas></div></div>
                <div class="card"><div class="card-header"><h2>Win / Loss Distribution</h2></div><div class="chart-container"><canvas id="a-chart-winloss"></canvas></div></div>
            </div>

            ${strategies.length > 0 ? `
            <div class="card">
                <div class="card-header"><h2>Strategy Performance</h2></div>
                <div class="table-wrap"><table>
                    <thead><tr><th>Strategy</th><th>Trades</th><th>Win Rate</th><th>Total P&L</th><th>Avg P&L</th></tr></thead>
                    <tbody>${strategies.map(s => `<tr>
                        <td style="font-weight:600;">${s.name}</td>
                        <td>${s.total_trades}</td>
                        <td>${s.win_rate}%</td>
                        <td style="color:var(${s.total_pnl >= 0 ? '--green' : '--red'});font-weight:600;">₹${formatNum(s.total_pnl)}</td>
                        <td style="color:var(${s.average_pnl >= 0 ? '--green' : '--red'});">₹${formatNum(s.average_pnl)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>
            </div>` : ''}

            <div class="charts-grid">
                ${timeData.length > 0 ? `<div class="card"><div class="card-header"><h2>Performance by Hour</h2></div><div class="chart-container"><canvas id="a-chart-time"></canvas></div></div>` : ''}
                ${mistakes.length > 0 ? `<div class="card"><div class="card-header"><h2>Common Mistakes</h2></div><div class="chart-container"><canvas id="a-chart-mistakes"></canvas></div></div>` : ''}
            </div>

            ${emotions.before_trade?.length > 0 ? `
            <div class="card">
                <div class="card-header"><h2>Emotions — Before Trade</h2></div>
                <div class="table-wrap"><table>
                    <thead><tr><th>Emotion</th><th>Trades</th><th>Win Rate</th><th>Total P&L</th></tr></thead>
                    <tbody>${emotions.before_trade.map(e => `<tr>
                        <td>${e.emotion}</td><td>${e.total_trades}</td><td>${e.win_rate}%</td>
                        <td style="color:var(${e.total_pnl >= 0 ? '--green' : '--red'});font-weight:600;">₹${formatNum(e.total_pnl)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>
            </div>` : ''}
        `;

        // Render charts
        if (pnlData.length > 0) renderCumulativeChart('a-chart-cum', pnlData);
        if (overview.total_trades > 0) {
            new Chart(document.getElementById('a-chart-winloss'), {
                type: 'doughnut',
                data: {
                    labels: ['Winning', 'Losing', 'Breakeven'],
                    datasets: [{ data: [overview.winning_trades, overview.losing_trades, overview.breakeven_trades], backgroundColor: ['#22c55e', '#ef4444', '#6b7280'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9ca3af' } } } }
            });
        }
        if (timeData.length > 0) {
            new Chart(document.getElementById('a-chart-time'), {
                type: 'bar',
                data: {
                    labels: timeData.map(t => t.hour),
                    datasets: [{ label: 'P&L', data: timeData.map(t => t.total_pnl), backgroundColor: timeData.map(t => t.total_pnl >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'), borderRadius: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#6b7280' }, grid: { display: false } }, y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } } }, plugins: { legend: { display: false } } }
            });
        }
        if (mistakes.length > 0) {
            new Chart(document.getElementById('a-chart-mistakes'), {
                type: 'bar',
                data: {
                    labels: mistakes.map(m => m.mistake),
                    datasets: [{ label: 'Count', data: mistakes.map(m => m.count), backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } }, y: { ticks: { color: '#9ca3af' }, grid: { display: false } } }, plugins: { legend: { display: false } } }
            });
        }
    } catch (err) { el.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`; }
}

/* ══════════════ Reports ══════════════ */

async function renderReports() {
    const el = document.getElementById('page-content');
    const today = new Date().toISOString().split('T')[0];

    el.innerHTML = `
        <div class="page-header"><h1>Reports</h1></div>
        <div class="card">
            <div class="card-header"><h2>Generate Report</h2></div>
            <div class="report-header">
                <div class="form-group"><label>Report Type</label>
                    <select id="report-type">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                <div class="form-group"><label>Date</label><input type="date" id="report-date" value="${today}"></div>
                <div class="form-group" id="report-end-group" style="display:none;"><label>End Date</label><input type="date" id="report-end-date" value="${today}"></div>
                <div class="form-group" style="display:flex;align-items:flex-end;"><button class="btn btn-primary" onclick="generateReport();">Generate</button></div>
            </div>
            <div id="report-output"></div>
        </div>
    `;

    document.getElementById('report-type').addEventListener('change', e => {
        document.getElementById('report-end-group').style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
}

async function generateReport() {
    const type = document.getElementById('report-type').value;
    const date = document.getElementById('report-date').value;
    const endDate = document.getElementById('report-end-date')?.value;
    const out = document.getElementById('report-output');

    let url;
    if (type === 'daily') url = `/api/reports/daily?date=${date}`;
    else if (type === 'weekly') url = `/api/reports/weekly?date=${date}`;
    else if (type === 'monthly') { const [y, m] = date.split('-'); url = `/api/reports/monthly?year=${y}&month=${parseInt(m)}`; }
    else url = `/api/reports/custom?start_date=${date}&end_date=${endDate || date}`;

    try {
        const data = await api(url);
        out.innerHTML = `
            <div class="stats-grid" style="margin-top:16px;">
                <div class="stat-card"><div class="stat-label">Period</div><div class="stat-value" style="font-size:1rem;">${data.start_date} → ${data.end_date}</div></div>
                <div class="stat-card"><div class="stat-label">Total Trades</div><div class="stat-value">${data.total_trades}</div></div>
                <div class="stat-card"><div class="stat-label">Win Rate</div><div class="stat-value ${data.win_rate >= 50 ? 'positive' : 'negative'}">${data.win_rate}%</div></div>
                <div class="stat-card"><div class="stat-label">Net P&L</div><div class="stat-value ${data.net_pnl >= 0 ? 'positive' : 'negative'}">₹${formatNum(data.net_pnl)}</div></div>
                <div class="stat-card"><div class="stat-label">Gross Profit</div><div class="stat-value positive">₹${formatNum(data.gross_profit)}</div></div>
                <div class="stat-card"><div class="stat-label">Gross Loss</div><div class="stat-value negative">₹${formatNum(data.gross_loss)}</div></div>
                <div class="stat-card"><div class="stat-label">Best Trade</div><div class="stat-value positive">₹${formatNum(data.best_trade)}</div></div>
                <div class="stat-card"><div class="stat-label">Worst Trade</div><div class="stat-value negative">₹${formatNum(data.worst_trade)}</div></div>
            </div>
            ${data.strategies?.length ? `
            <div style="margin-top:16px;">
                <h3 style="margin-bottom:8px;">Strategy Performance</h3>
                <div class="table-wrap"><table>
                    <thead><tr><th>Strategy</th><th>Trades</th><th>Win Rate</th><th>P&L</th></tr></thead>
                    <tbody>${data.strategies.map(s => `<tr><td>${s.name}</td><td>${s.total_trades}</td><td>${s.win_rate}%</td><td style="color:var(${s.total_pnl >= 0 ? '--green' : '--red'});font-weight:600;">₹${formatNum(s.total_pnl)}</td></tr>`).join('')}</tbody>
                </table></div>
            </div>` : ''}
            ${data.common_mistakes?.length ? `
            <div style="margin-top:16px;">
                <h3 style="margin-bottom:8px;">Common Mistakes</h3>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">${data.common_mistakes.map(m => `<span class="tag">${m.mistake} (${m.count})</span>`).join('')}</div>
            </div>` : ''}
            <div class="export-buttons" style="margin-top:20px;">
                <button class="btn btn-outline btn-sm" onclick="exportReport('csv')">Export CSV</button>
                <button class="btn btn-outline btn-sm" onclick="exportReport('json')">Export JSON</button>
            </div>
        `;
    } catch (err) { out.innerHTML = `<p style="color:var(--red);">${err.message}</p>`; }
}

async function exportReport(format) {
    const type = document.getElementById('report-type').value;
    const date = document.getElementById('report-date').value;
    const endDate = document.getElementById('report-end-date')?.value;

    let url;
    if (type === 'daily') url = `/api/reports/daily?date=${date}&export=${format}`;
    else if (type === 'weekly') url = `/api/reports/weekly?date=${date}&export=${format}`;
    else if (type === 'monthly') { const [y, m] = date.split('-'); url = `/api/reports/monthly?year=${y}&month=${parseInt(m)}&export=${format}`; }
    else url = `/api/reports/custom?start_date=${date}&end_date=${endDate}&export=${format}`;

    try {
        const res = await fetch(`${API_BASE}${url}`, { headers: { 'Authorization': `Bearer ${state.token}` } });
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `report.${format}`;
        a.click();
        showToast(`${format.toUpperCase()} exported`, 'success');
    } catch (err) { showToast(err.message, 'error'); }
}

/* ══════════════ Modal System ══════════════ */

function openModal(title, body, actions = []) {
    let overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="btn-icon" onclick="closeModal()">${icons.close}</button>
            </div>
            <div class="modal-body">${body}</div>
            ${actions.length ? `<div class="modal-footer">${actions.map((a, i) => `<button class="${a.class}" id="modal-action-${i}">${a.label}</button>`).join('')}</div>` : ''}
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    actions.forEach((a, i) => { document.getElementById(`modal-action-${i}`)?.addEventListener('click', a.onclick); });
}

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 250); }
}

/* ══════════════ Charts ══════════════ */

function renderPnlChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.date),
            datasets: [{ label: 'Daily P&L', data: data.map(d => d.pnl), backgroundColor: data.map(d => d.pnl >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'), borderRadius: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ticks: { color: '#6b7280', maxTicksLimit: 12 }, grid: { display: false } }, y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderCumulativeChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Cumulative P&L', data: data.map(d => d.cumulative_pnl),
                borderColor: '#0f172a', backgroundColor: 'rgba(15,23,42,0.05)',
                fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#0f172a',
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ticks: { color: '#6b7280', maxTicksLimit: 12 }, grid: { display: false } }, y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } } },
            plugins: { legend: { display: false } }
        }
    });
}

/* ══════════════ Helpers ══════════════ */

function formatNum(n) {
    if (n == null) return '0';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ══════════════ Init ══════════════ */
document.addEventListener('DOMContentLoaded', () => { renderApp(); });

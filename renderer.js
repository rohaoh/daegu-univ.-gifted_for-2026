const appApi = window.roomApp;
const state = { history: [], thresholds: {}, reports: [], latest: null, connected: false, portPath: '' };
const $ = id => document.getElementById(id);

function toast(message, isError = false) {
  const element = $('toast');
  element.textContent = message;
  element.classList.toggle('error', isError);
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 3200);
}

function openSettings() {
  $('settings-modal').classList.add('open');
  $('settings-modal').setAttribute('aria-hidden', 'false');
  refreshPorts();
}
function closeSettings() {
  $('settings-modal').classList.remove('open');
  $('settings-modal').setAttribute('aria-hidden', 'true');
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `${viewName}-view`));
  document.querySelectorAll('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === viewName));
  $('page-name').textContent = ({ dashboard: '대시보드', history: '기록', insights: 'AI 인사이트' })[viewName] || '대시보드';
}

function setConnection(status) {
  state.connected = Boolean(status.connected);
  state.portPath = status.path || state.portPath;
  $('device-dot').classList.toggle('connected', state.connected);
  document.querySelector('.live-pill').classList.toggle('offline', !state.connected);
  document.querySelector('.live-pill').innerHTML = `<span></span> ${state.connected ? '실시간 모니터링' : '센서 연결 대기'}`;
  $('device-label').textContent = state.connected ? `${state.portPath} 연결됨` : '연결 대기 중';
  $('device-sub').textContent = state.connected ? `${status.baudRate || $('baud-select').value || 9600} baud · HC-06` : 'Arduino + HC-06';
  $('dashboard-connect').innerHTML = state.connected ? '연결 설정 <span>↗</span>' : '블루투스 연결 <span>↗</span>';
  $('connect-button').textContent = state.connected ? '연결 해제' : '연결';
  if (status.error) {
    $('connection-message').textContent = status.error;
    toast(`시리얼 연결 오류: ${status.error}`, true);
  } else if (status.connected) {
    $('connection-message').textContent = `${status.path} 포트에 연결했습니다. 데이터 수신을 기다립니다.`;
  } else if (!status.error) {
    $('connection-message').textContent = 'Arduino에서 한 줄마다 JSON 또는 온도,습도 형식으로 보내면 됩니다.';
  }
  renderDashboard();
}

function currentAlerts(reading) {
  const t = state.thresholds;
  const alerts = [];
  if (reading.temperature < Number(t.temperatureMin)) alerts.push(`온도 낮음 (${reading.temperature.toFixed(1)}°C)`);
  if (reading.temperature > Number(t.temperatureMax)) alerts.push(`온도 높음 (${reading.temperature.toFixed(1)}°C)`);
  if (reading.humidity < Number(t.humidityMin)) alerts.push(`습도 낮음 (${reading.humidity.toFixed(0)}%)`);
  if (reading.humidity > Number(t.humidityMax)) alerts.push(`습도 높음 (${reading.humidity.toFixed(0)}%)`);
  return alerts;
}

function lastDay() { return state.history.filter(item => Date.parse(item.timestamp) >= Date.now() - 24 * 60 * 60 * 1000); }
function avg(items, key) { return items.length ? (items.reduce((sum, item) => sum + Number(item[key]), 0) / items.length).toFixed(1) : '--'; }
function formatTime(timestamp) { return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(timestamp)); }
function localDateInput(date) {
  const year = date.getFullYear(), month = String(date.getMonth() + 1).padStart(2, '0'), day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function analysisRange() {
  const period = $('analysis-period').value;
  if (period === 'custom') {
    const startValue = $('analysis-start').value, endValue = $('analysis-end').value;
    if (!startValue || !endValue) throw new Error('분석 시작일과 종료일을 선택해 주세요.');
    const start = new Date(`${startValue}T00:00:00`), end = new Date(`${endValue}T23:59:59.999`);
    if (end <= start) throw new Error('종료일은 시작일과 같거나 이후여야 합니다.');
    return { start: start.toISOString(), end: end.toISOString(), label: `${startValue} ~ ${endValue}` };
  }
  const durationHours = period === '7d' ? 7 * 24 : period === '30d' ? 30 * 24 : 24;
  const end = new Date(), start = new Date(end.getTime() - durationHours * 60 * 60 * 1000);
  const label = period === '7d' ? '최근 7일' : period === '30d' ? '최근 30일' : '최근 24시간';
  return { start: start.toISOString(), end: end.toISOString(), label };
}

function renderDashboard() {
  const t = state.thresholds;
  $('threshold-temp-text').textContent = `${t.temperatureMin ?? 18}°C — ${t.temperatureMax ?? 28}°C`;
  $('threshold-humidity-text').textContent = `${t.humidityMin ?? 30}% — ${t.humidityMax ?? 65}%`;
  $('temp-range').textContent = `기준 ${t.temperatureMin ?? 18} ~ ${t.temperatureMax ?? 28}°C`;
  $('humidity-range').textContent = `기준 ${t.humidityMin ?? 30} ~ ${t.humidityMax ?? 65}%`;
  const latest = state.latest;
  document.querySelector('.temperature-card .metric-label').textContent = state.connected ? '현재 온도' : '마지막 온도';
  document.querySelector('.humidity-card .metric-label').textContent = state.connected ? '현재 습도' : '마지막 습도';
  $('current-temp').innerHTML = latest ? `${Number(latest.temperature).toFixed(1)}<small>°C</small>` : '--<small>°C</small>';
  $('current-humidity').innerHTML = latest ? `${Number(latest.humidity).toFixed(0)}<small>%</small>` : '--<small>%</small>';
  const todayItems = lastDay();
  $('average-temp').innerHTML = `${avg(todayItems, 'temperature')}<small>°C</small>`;
  $('average-humidity').innerHTML = `${avg(todayItems, 'humidity')}<small>%</small>`;
  $('sample-count').textContent = `${todayItems.length.toLocaleString('ko-KR')}회 측정`;
  const latestAlerts = latest ? currentAlerts(latest) : [];
  const alerts = state.connected ? latestAlerts : [];
  $('temp-state').textContent = latest ? (latestAlerts.some(item => item.startsWith('온도')) ? (state.connected ? '기준 벗어남' : '마지막 기록 · 기준 이탈') : (state.connected ? '기준 범위 안' : '마지막 기록')) : (state.connected ? '데이터 수신 대기' : '센서 연결 대기');
  $('humidity-state').textContent = latest ? (latestAlerts.some(item => item.startsWith('습도')) ? (state.connected ? '기준 벗어남' : '마지막 기록 · 기준 이탈') : (state.connected ? '기준 범위 안' : '마지막 기록')) : (state.connected ? '데이터 수신 대기' : '센서 연결 대기');
  $('temp-state').classList.toggle('warning-state', alerts.some(item => item.startsWith('온도')));
  $('humidity-state').classList.toggle('warning-state', alerts.some(item => item.startsWith('습도')));

  const outside = todayItems.filter(item => currentAlerts(item).length);
  $('threshold-count').textContent = outside.length ? `${outside.length.toLocaleString('ko-KR')}회 기준 벗어남` : '기준 이탈 기록 없음';
  $('threshold-count').classList.toggle('warning-state', outside.length > 0);
  const banner = $('status-banner');
  banner.classList.toggle('warning', alerts.length > 0);
  $('status-title').textContent = alerts.length ? '설정한 환경 기준을 벗어났어요' : state.connected ? (latest ? '현재 환경이 설정 기준 안에 있어요' : '센서 데이터 수신을 기다리고 있어요') : latest ? '센서 연결이 대기 중이에요' : '센서를 연결해 주세요';
  $('status-description').textContent = alerts.length ? alerts.join(' · ') : state.connected ? (latest ? `마지막 측정 ${formatTime(latest.timestamp)} · 온습도 기록을 계속 확인하고 있습니다.` : 'COM 포트 연결은 됐습니다. Arduino 데이터 형식을 확인해 주세요.') : latest ? `마지막 측정 ${formatTime(latest.timestamp)} · 표시된 값은 최근 저장 기록입니다.` : 'HC-06을 PC와 페어링한 뒤 COM 포트를 선택하면 데이터가 표시됩니다.';
  renderChart(todayItems);
  renderAlertList(outside);
  renderHistory();
}

function renderChart(items) {
  const visible = items.slice(-150);
  $('chart-empty').classList.toggle('hidden', visible.length > 1);
  if (visible.length < 2) {
    $('temp-path').setAttribute('d', '');
    $('humidity-path').setAttribute('d', '');
    return;
  }
  const makePath = key => {
    const values = visible.map(item => Number(item[key]));
    let low = Math.min(...values), high = Math.max(...values);
    if (high - low < 0.5) { high += 0.25; low -= 0.25; }
    return values.map((value, index) => {
      const x = 42 + index * (708 / (values.length - 1));
      const y = 190 - ((value - low) / (high - low)) * 155;
      return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };
  $('temp-path').setAttribute('d', makePath('temperature'));
  $('humidity-path').setAttribute('d', makePath('humidity'));
}

function renderAlertList(outside) {
  const list = $('alert-list');
  list.replaceChildren();
  const events = outside.slice(-4).reverse();
  if (!events.length) {
    const empty = document.createElement('div'); empty.className = 'empty-small'; empty.innerHTML = '<span>✓</span>기준을 벗어난 기록이 없습니다.'; list.append(empty); return;
  }
  for (const item of events) {
    const row = document.createElement('div'); row.className = 'alert-event';
    const marker = document.createElement('span'); marker.className = 'event-marker';
    const details = document.createElement('div'); details.className = 'event-details';
    const title = document.createElement('strong'); title.textContent = currentAlerts(item).join(' · ');
    const time = document.createElement('small'); time.textContent = formatTime(item.timestamp);
    details.append(title, time); row.append(marker, details); list.append(row);
  }
}

function renderHistory() {
  const tbody = $('history-table');
  const items = state.history.slice(-250).reverse();
  $('history-count').textContent = `총 ${state.history.length.toLocaleString('ko-KR')}회 측정 · 최근 250개 표시`;
  tbody.replaceChildren();
  if (!items.length) {
    const row = tbody.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.className = 'empty-table'; cell.textContent = '센서가 연결되면 측정 기록이 여기에 표시됩니다.'; return;
  }
  for (const item of items) {
    const row = tbody.insertRow();
    row.insertCell().textContent = formatTime(item.timestamp);
    row.insertCell().textContent = `${Number(item.temperature).toFixed(1)} °C`;
    row.insertCell().textContent = `${Number(item.humidity).toFixed(0)} %`;
    const status = row.insertCell(); const warnings = currentAlerts(item);
    status.innerHTML = warnings.length ? '<span class="table-warning">기준 이탈</span>' : '<span class="table-normal">정상 범위</span>';
  }
}

function showReport(report) {
  const panel = $('report-panel');
  panel.replaceChildren();
  const head = document.createElement('div'); head.className = 'report-heading';
  const meta = document.createElement('div'); meta.innerHTML = `<span class="eyebrow">${report.kind === 'daily' ? 'DAILY REVIEW' : 'AI REVIEW'}</span><h2>${formatTime(report.createdAt)} 분석</h2>`;
  head.append(meta);
  const text = document.createElement('div'); text.className = 'report-text'; text.textContent = report.text;
  const data = document.createElement('div'); data.className = 'report-data';
  const summary = report.summary;
  data.textContent = `${summary.period} · 분석 자료 ${summary.sampleCount.toLocaleString('ko-KR')}개 · 온도 평균 ${summary.temperature.average ?? '--'}°C · 습도 평균 ${summary.humidity.average ?? '--'}%`;
  panel.append(head, text, data);
}

function renderReports() {
  const list = $('report-list');
  list.replaceChildren();
  if (!state.reports.length) { const empty = document.createElement('div'); empty.className = 'empty-small'; empty.textContent = '저장된 리포트가 없습니다.'; list.append(empty); return; }
  for (const report of state.reports.slice(0, 8)) {
    const button = document.createElement('button'); button.className = 'report-list-item';
    const heading = document.createElement('strong'); heading.textContent = `${report.kind === 'daily' ? '하루 요약' : '직접 분석'} · ${formatTime(report.createdAt)}`;
    const summary = document.createElement('span'); summary.textContent = report.text.slice(0, 130).replace(/\s+/g, ' ');
    button.append(heading, summary);
    button.addEventListener('click', () => showReport(report));
    list.append(button);
  }
}

async function refreshPorts() {
  const select = $('port-select');
  const previous = select.value;
  select.replaceChildren(new Option('포트를 선택하세요', ''));
  try {
    const ports = await appApi.listPorts();
    if (!ports.length) select.add(new Option('감지된 COM 포트가 없습니다', ''));
    for (const port of ports) {
      const description = [port.friendlyName, port.manufacturer, port.vendorId && `VID ${port.vendorId}`].filter(Boolean).join(' · ');
      select.add(new Option(description ? `${port.path} — ${description}` : port.path, port.path));
    }
    if (ports.some(port => port.path === previous)) select.value = previous;
    if (ports.length && !select.value) select.value = ports[0].path;
  } catch (error) {
    select.replaceChildren(new Option('COM 포트 목록을 읽을 수 없습니다', ''));
    $('connection-message').textContent = error.message;
  }
}

function fillSettings() {
  const form = $('threshold-form');
  for (const [key, value] of Object.entries(state.thresholds)) if (form.elements[key]) form.elements[key].value = value;
}

document.querySelectorAll('.nav-item[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('[data-view-link]').forEach(button => button.addEventListener('click', () => showView(button.dataset.viewLink)));
document.querySelectorAll('#open-settings, #top-settings, #banner-settings, #edit-thresholds').forEach(button => button.addEventListener('click', openSettings));
document.querySelectorAll('#close-settings, #done-settings').forEach(button => button.addEventListener('click', closeSettings));
$('settings-modal').addEventListener('click', event => { if (event.target === $('settings-modal')) closeSettings(); });
$('refresh-ports').addEventListener('click', refreshPorts);
$('dashboard-connect').addEventListener('click', openSettings);
$('history-export').addEventListener('click', () => {
  if (!state.history.length) return toast('내보낼 기록이 없습니다.', true);
  const lines = ['timestamp,temperature_c,humidity_percent', ...state.history.map(item => `${item.timestamp},${item.temperature},${item.humidity}`)];
  const blob = new Blob(['\uFEFF', lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'roomly-sensor-history.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

$('connect-button').addEventListener('click', async () => {
  try {
    if (state.connected) { await appApi.disconnect(); return; }
    const result = await appApi.connect({ path: $('port-select').value, baudRate: Number($('baud-select').value) });
    setConnection(result); toast(`${result.path} 포트에 연결했습니다.`);
  } catch (error) { $('connection-message').textContent = error.message; toast(`연결하지 못했습니다: ${error.message}`, true); }
});

$('threshold-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const next = Object.fromEntries(form.entries());
  for (const key of Object.keys(next)) next[key] = Number(next[key]);
  if (next.temperatureMin >= next.temperatureMax || next.humidityMin >= next.humidityMax) return toast('최저 기준은 최고 기준보다 낮아야 합니다.', true);
  state.thresholds = await appApi.saveThresholds(next);
  renderDashboard(); toast('알림 기준을 저장했습니다.');
});
$('reset-thresholds').addEventListener('click', async () => {
  state.thresholds = await appApi.resetThresholds();
  fillSettings(); renderDashboard(); toast('알림 기준을 기본값으로 되돌렸습니다.');
});

$('api-key-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await appApi.saveApiKey($('api-key-input').value);
    $('api-key-input').value = '';
    $('api-key-status').textContent = 'Gemini API 키가 이 PC에 암호화되어 저장되었습니다.';
    $('api-key-status').classList.add('success-text'); toast('Gemini API 키를 저장했습니다.');
  } catch (error) { toast(error.message, true); }
});
$('clear-key-button').addEventListener('click', async () => {
  await appApi.clearApiKey(); $('api-key-status').textContent = 'API 키를 삭제했습니다.'; $('api-key-status').classList.remove('success-text'); toast('저장된 API 키를 삭제했습니다.');
});

$('analyze-button').addEventListener('click', async () => {
  $('analyze-button').disabled = true; $('analyze-button').textContent = '분석 중…';
  try {
    const report = await appApi.analyze(analysisRange());
    if (!state.reports.some(item => item.id === report.id)) state.reports.unshift(report);
    state.reports = state.reports.slice(0, 60);
    showReport(report); renderReports(); toast('AI 환경 리포트를 만들었습니다.');
  } catch (error) { toast(error.message, true); }
  finally { $('analyze-button').disabled = false; $('analyze-button').innerHTML = '✳ 지금 분석하기'; }
});

$('analysis-period').addEventListener('change', () => {
  const custom = $('analysis-period').value === 'custom';
  $('custom-range').classList.toggle('hidden', !custom);
  if (custom && !$('analysis-start').value) {
    const end = new Date(), start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    $('analysis-start').value = localDateInput(start);
    $('analysis-end').value = localDateInput(end);
  }
  localStorage.setItem('analysis-period', $('analysis-period').value);
  if ($('analysis-start').value) localStorage.setItem('analysis-start', $('analysis-start').value);
  if ($('analysis-end').value) localStorage.setItem('analysis-end', $('analysis-end').value);
});
$('analysis-start').addEventListener('change', () => localStorage.setItem('analysis-start', $('analysis-start').value));
$('analysis-end').addEventListener('change', () => localStorage.setItem('analysis-end', $('analysis-end').value));

appApi.onReading(reading => {
  state.history.push(reading); if (state.history.length > 100000) state.history.shift();
  state.latest = reading; renderDashboard();
});
appApi.onSerialStatus(setConnection);
appApi.onReport(report => {
  if (!state.reports.some(item => item.id === report.id)) state.reports.unshift(report);
  state.reports = state.reports.slice(0, 60); showReport(report); renderReports();
  if (report.kind === 'daily') toast('오늘의 AI 요약이 준비됐습니다.');
});

async function initialize() {
  $('today-label').textContent = new Intl.DateTimeFormat('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  $('analysis-period').value = localStorage.getItem('analysis-period') || '24h';
  $('analysis-start').value = localStorage.getItem('analysis-start') || '';
  $('analysis-end').value = localStorage.getItem('analysis-end') || '';
  $('custom-range').classList.toggle('hidden', $('analysis-period').value !== 'custom');
  if ($('analysis-period').value === 'custom' && !$('analysis-start').value && !$('analysis-end').value) {
    const end = new Date(), start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    $('analysis-start').value = localDateInput(start);
    $('analysis-end').value = localDateInput(end);
  }
  try {
    const data = await appApi.getData();
    state.history = data.history || [];
    state.latest = data.latest || state.history.at(-1) || null;
    state.thresholds = data.thresholds || {};
    state.reports = data.reports || [];
    fillSettings(); renderDashboard(); renderReports();
    if (state.reports.length) showReport(state.reports[0]);
    $('api-key-status').textContent = data.hasApiKey ? 'Gemini API 키가 이 PC에 암호화되어 저장되어 있습니다.' : 'API 키가 저장되지 않았습니다.';
    if (data.hasApiKey) $('api-key-status').classList.add('success-text');
  } catch (error) { toast(`앱 데이터를 읽지 못했습니다: ${error.message}`, true); }
}

initialize();

const appApi = window.roomApp;
const state = { history: [], thresholds: {}, reports: [], latest: null, connected: false, portPath: '', weather: null, weatherSettings: {} };
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

function installNewControls() {
  const gasLimit = document.createElement('label'); gasLimit.textContent = 'FC-22 가스 원시값 기준'; gasLimit.innerHTML += '<input type="number" min="0" max="1023" step="1" name="gasRawMax" required><span>raw</span>';
  $('threshold-form').insertBefore(gasLimit, $('threshold-form').querySelector('.form-submit'));
  const dashboard = $('dashboard-view');
  const weather = document.createElement('article');
  weather.className = 'panel'; weather.id = 'weather-panel';
  weather.innerHTML = '<div class="panel-heading"><div><h2>오늘의 날씨</h2><p id="weather-location">서울 · 기상청</p></div><button class="link-button" id="weather-refresh">새로고침</button></div><div class="weather-content"><strong id="weather-summary">API 키 설정 후 날씨를 불러옵니다.</strong><span id="weather-details"></span></div><div id="weather-advisories" class="weather-advisories"></div>';
  dashboard.insertBefore(weather, dashboard.querySelector('.metric-grid'));
  const gas = document.createElement('article');
  gas.className = 'metric-card gas-card';
  gas.innerHTML = '<div class="metric-top"><div><span class="metric-label">가스 센서 · FC-22</span><div class="metric-value" id="current-gas">--<small>raw</small></div></div><div class="metric-icon">◉</div></div><div class="metric-foot"><span class="metric-state" id="gas-state">아두이노 데이터 대기</span><span class="range-label">ADC 0–1023</span></div>';
  dashboard.querySelector('.metric-grid').append(gas);
  const settings = $('settings-modal').querySelector('.modal-footer');
  const section = document.createElement('div'); section.className = 'settings-section';
  section.innerHTML = '<div class="settings-title"><div><h3>기상청 날씨 및 특보</h3><p>공공데이터포털에서 단기예보·기상특보 API를 신청하고 키를 입력하세요.</p></div></div><div class="weather-settings"><label>지역명<input id="weather-region" value="서울" maxlength="30"></label><label>예보 격자 X<input id="weather-nx" type="number" value="60" min="1" max="149"></label><label>예보 격자 Y<input id="weather-ny" type="number" value="127" min="1" max="253"></label><label>특보 지점 코드<input id="weather-stn" type="number" value="108"></label><label class="wide">공공데이터포털 서비스키<input id="weather-key" type="password" placeholder="발급받은 서비스키"></label><button class="button button-dark" id="save-weather">기상청 설정 저장</button></div><div class="inline-status">API 키는 Windows 사용자 계정의 보호 기능으로 암호화해 저장합니다.</div></div><div class="settings-section"><div class="settings-title"><div><h3>Windows 알림 및 시작</h3><p>Windows 알림 권한이 꺼져 있으면 시스템 설정에서 Roomly 알림을 허용하세요.</p></div></div><label class="startup-toggle"><input id="startup-enabled" type="checkbox"> Windows 로그인 시 Roomly 자동 실행</label><button class="link-button" id="open-notification-settings">Windows 알림 설정 열기</button></div>';
  settings.parentElement.insertBefore(section, settings);
  $('weather-refresh').addEventListener('click', () => appApi.refreshWeather());
  $('save-weather').addEventListener('click', async () => {
    try {
      state.weatherSettings = await appApi.saveWeather({ region: $('weather-region').value, nx: $('weather-nx').value, ny: $('weather-ny').value, stnId: $('weather-stn').value, apiKey: $('weather-key').value });
      $('weather-key').value = ''; toast('기상청 설정을 저장했습니다.');
    } catch (error) { toast(error.message, true); }
  });
  $('startup-enabled').addEventListener('change', async event => { try { event.target.checked = await appApi.setStartup(event.target.checked); toast(event.target.checked ? '로그인 시 자동 실행을 켰습니다.' : '로그인 시 자동 실행을 껐습니다.'); } catch (error) { toast(error.message, true); } });
  $('open-notification-settings').addEventListener('click', () => appApi.openNotificationSettings());
}

function renderWeather(snapshot = state.weather) {
  if (!snapshot) return;
  $('weather-location').textContent = `${state.weatherSettings.region || '서울'} · 기상청`;
  const weather = snapshot.weather;
  if (!weather) { $('weather-summary').textContent = snapshot.error || '날씨 정보가 없습니다.'; return; }
  const skies = { '1': '맑음', '3': '구름 많음', '4': '흐림' };
  const rain = { '0': '', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };
  $('weather-summary').textContent = `${weather.temperature ?? '--'}°C · ${skies[weather.sky] || '날씨'}${rain[weather.pty] ? ` · ${rain[weather.pty]}` : ''}`;
  $('weather-details').textContent = `오늘 최저 ${weather.min ?? '--'}° / 최고 ${weather.max ?? '--'}° · 강수확률 ${weather.pop ?? '--'}%`;
  const list = $('weather-advisories'); list.replaceChildren();
  const advisories = snapshot.advisories || [];
  if (!advisories.length) { list.textContent = snapshot.error ? `특보 정보: ${snapshot.error}` : '현재 표시할 기상특보가 없습니다.'; return; }
  for (const item of advisories) { const badge = document.createElement('div'); badge.className = 'weather-advisory'; badge.textContent = item.t1 || item.title || item.t2 || JSON.stringify(item); list.append(badge); }
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
  if (reading.gasRaw != null && reading.gasRaw >= Number(t.gasRawMax ?? 700)) alerts.push(`FC-22 가스값 높음 (${reading.gasRaw} raw)`);
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
  $('current-gas').innerHTML = latest?.gasRaw != null ? `${Number(latest.gasRaw)}<small>raw</small>` : '--<small>raw</small>';
  $('gas-state').textContent = latest?.gasRaw != null ? 'FC-22 아날로그 원시값' : '아두이노 JSON 또는 CSV 3번째 값으로 연결';
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
  const text = document.createElement('div'); text.className = 'report-text markdown-body';
  const markdownHtml = window.marked.parse(report.text, { gfm: true, breaks: true });
  text.innerHTML = window.DOMPurify.sanitize(markdownHtml, { FORBID_TAGS: ['img', 'iframe', 'style', 'svg', 'math'] });
  text.querySelectorAll('a').forEach(link => { link.rel = 'noopener noreferrer'; });
  text.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    event.preventDefault();
    appApi.openExternal(link.href);
  });
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
$('test-notification').addEventListener('click', async () => {
  try { await appApi.testNotification(); toast('Test notification sent.'); }
  catch (error) { toast(error.message, true); }
});
$('reset-thresholds').addEventListener('click', async () => {
  state.thresholds = await appApi.resetThresholds();
  fillSettings(); renderDashboard(); toast('알림 기준을 기본값으로 되돌렸습니다.');
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
  installNewControls();
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
    state.weather = data.weather; state.weatherSettings = data.weatherSettings || {};
    $('weather-region').value = state.weatherSettings.region || '서울'; $('weather-nx').value = state.weatherSettings.nx || 60; $('weather-ny').value = state.weatherSettings.ny || 127; $('weather-stn').value = state.weatherSettings.stnId || 108;
    $('startup-enabled').checked = Boolean(data.openAtLogin);
    renderWeather();
    fillSettings(); renderDashboard(); renderReports();
    if (state.reports.length) showReport(state.reports[0]);
    state.hasAccount = data.hasAccount;
    $('account-status').textContent = data.hasAccount ? 'Gemini API key is configured in main.js.' : 'Paste your Gemini API key in main.js to enable AI analysis.';
    $('account-status').classList.toggle('success-text', data.hasAccount);
  } catch (error) { toast(`앱 데이터를 읽지 못했습니다: ${error.message}`, true); }
}

appApi.onWeather(snapshot => { state.weather = snapshot; renderWeather(snapshot); });
initialize();

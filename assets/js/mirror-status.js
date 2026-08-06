(function () {
  'use strict';

  var root = document.querySelector('.mirror-status-page');
  if (!root) return;

  var apiUrl = root.dataset.mirrorApi;
  var tableBody = document.getElementById('table-body');
  var statusMessage = document.getElementById('mirror-status');
  var retryButton = document.getElementById('mirror-retry');
  var table = document.getElementById('mirror-table');
  var activeRequest = null;
  var refreshTimer = null;
  var rowCache = new Map();
  var lastData = [];
  var allowedApiUrl = validateApiUrl(apiUrl);

  var statusAllowlist = {
    syncing: { label: '同步中', row: 'syncing-row', tag: 'info' },
    success: { label: '成功', row: 'success-row', tag: 'success' },
    paused: { label: '已暂停', row: 'pending-row', tag: 'warning' },
    failed: { label: '失败', row: 'error-row', tag: 'danger' },
    'pre-syncing': { label: '准备中', row: 'syncing-row', tag: 'info' }
  };

  function validName(value) {
    return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(value);
  }

  function validateApiUrl(value) {
    try {
      var parsed = new URL(value, window.location.origin);
      return parsed.protocol === 'https:' &&
        parsed.hostname === 'mirrors-metadata.cqulug.club' &&
        !parsed.port && !parsed.username && !parsed.password &&
        !parsed.search && !parsed.hash && parsed.pathname === '/tunasync.json'
        ? parsed.href
        : null;
    } catch (error) {
      return null;
    }
  }

  function safeText(value, maxLength) {
    if (typeof value !== 'string') return '-';
    var normalized = value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ');
    return normalized ? normalized.slice(0, maxLength) : '-';
  }

  function normalizeItem(item) {
    if (!item || !validName(item.name)) return null;
    var knownStatus = Object.prototype.hasOwnProperty.call(statusAllowlist, item.status);
    var state = knownStatus ? statusAllowlist[item.status] : { label: '未知', row: 'pending-row', tag: 'warning' };
    return {
      name: item.name,
      status: knownStatus ? item.status : 'unknown',
      state: state,
      upstream: safeText(item.upstream, 512),
      size: safeText(item.size, 80),
      lastUpdate: safeText(item.last_update, 80).replace(/ \+0800$/, '')
    };
  }

  function mirrorPath(name) {
    var encoded = encodeURIComponent(name);
    return (name.endsWith('.git') ? '/git/' : '/') + encoded + '/';
  }

  function makeCell(className, value) {
    var cell = document.createElement('td');
    if (className) cell.className = className;
    cell.textContent = value;
    return cell;
  }

  function makeMirrorLink(item) {
    var link = document.createElement('a');
    link.href = 'http://mirrors.cqu.edu.cn' + mirrorPath(item.name);
    link.dataset.choiceModalOpen = '';
    link.dataset.choiceModalCampusUrl = link.href;
    link.dataset.choiceModalOffcampusUrl = 'https://lanunion-cqu-edu-cn.atrust.cqu.edu.cn' + mirrorPath(item.name);
    link.textContent = item.name;
    return link;
  }

  function createRow(item) {
    var row = document.createElement('tr');
    row.className = item.state.row;
    var nameCell = document.createElement('td');
    var link = makeMirrorLink(item);
    nameCell.appendChild(link);
    row.appendChild(nameCell);
    row.appendChild(makeCell('upstream-info', item.upstream));
    row.appendChild(makeCell('size-info', item.size));
    row.appendChild(makeCell('last-update', item.lastUpdate));
    var statusCell = document.createElement('td');
    var statusTag = document.createElement('span');
    statusTag.className = 'status-tag ' + item.state.tag;
    statusTag.textContent = item.state.label;
    statusCell.appendChild(statusTag);
    row.appendChild(statusCell);
    return row;
  }

  function updateRow(row, item) {
    row.className = item.state.row;
    var link = row.querySelector('a');
    link.href = 'http://mirrors.cqu.edu.cn' + mirrorPath(item.name);
    link.dataset.choiceModalCampusUrl = link.href;
    link.dataset.choiceModalOffcampusUrl = 'https://lanunion-cqu-edu-cn.atrust.cqu.edu.cn' + mirrorPath(item.name);
    row.children[1].textContent = item.upstream;
    row.children[2].textContent = item.size;
    row.children[3].textContent = item.lastUpdate;
    var statusTag = row.children[4].firstElementChild;
    statusTag.className = 'status-tag ' + item.state.tag;
    statusTag.textContent = item.state.label;
  }

  function renderTable(data) {
    if (!data.length) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 5;
      emptyCell.className = 'mirror-empty';
      emptyCell.textContent = '暂无镜像状态数据';
      emptyRow.appendChild(emptyCell);
      tableBody.replaceChildren(emptyRow);
      tableBody.setAttribute('aria-busy', 'false');
      table.dataset.loaded = 'true';
      rowCache.clear();
      return;
    }
    var fragment = document.createDocumentFragment();
    var seen = new Set();
    data.forEach(function (item) {
      var row = rowCache.get(item.name);
      if (!row) {
        row = createRow(item);
        rowCache.set(item.name, row);
      } else {
        updateRow(row, item);
      }
      seen.add(item.name);
      fragment.appendChild(row);
    });
    rowCache.forEach(function (row, name) {
      if (!seen.has(name)) rowCache.delete(name);
    });
    tableBody.replaceChildren(fragment);
    tableBody.setAttribute('aria-busy', 'false');
    table.dataset.loaded = 'true';
  }

  function setLoading(isLoading) {
    tableBody.setAttribute('aria-busy', String(isLoading));
    statusMessage.textContent = isLoading ? (lastData.length ? '正在更新镜像状态…' : '正在加载镜像状态…') : '镜像状态已更新';
    retryButton.hidden = true;
  }

  function showError(message) {
    tableBody.setAttribute('aria-busy', 'false');
    statusMessage.textContent = message;
    retryButton.hidden = false;
    if (!lastData.length) {
      var row = document.createElement('tr');
      var cell = document.createElement('td');
      cell.colSpan = 5;
      cell.className = 'mirror-error';
      cell.textContent = '加载数据失败，请点击“重新加载”再试。';
      row.appendChild(cell);
      tableBody.replaceChildren(row);
    }
  }

  function fetchMirrorData() {
    if (document.visibilityState !== 'visible' || activeRequest) return;
    if (!allowedApiUrl) {
      showError('镜像状态接口配置无效');
      return;
    }
    var controller = new AbortController();
    activeRequest = controller;
    var url = new URL(allowedApiUrl);
    url.searchParams.set('v', Math.floor(Date.now() / 30000));
    setLoading(true);
    var timeout = window.setTimeout(function () { controller.abort(); }, 8000);

    fetch(url.href, { cache: 'no-store', signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('Invalid mirror response');
        var normalized = data.map(normalizeItem).filter(Boolean);
        lastData = normalized;
        renderTable(normalized);
        setLoading(false);
      })
      .catch(function (error) {
        if (error.name === 'AbortError' && document.visibilityState !== 'visible') return;
        if (error.name !== 'AbortError') console.error('Error fetching mirror data:', error);
        showError(error.name === 'AbortError' ? '镜像状态请求超时' : '镜像状态暂时不可用');
      })
      .finally(function () {
        window.clearTimeout(timeout);
        activeRequest = null;
      });
  }

  function scheduleRefresh() {
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(fetchMirrorData, 30000);
  }

  retryButton.addEventListener('click', fetchMirrorData);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      fetchMirrorData();
      scheduleRefresh();
    } else {
      window.clearInterval(refreshTimer);
      if (activeRequest) activeRequest.abort();
    }
  });

  fetchMirrorData();
  scheduleRefresh();
}());

(function () {
  'use strict';

  var input = document.getElementById('vpnInput');
  var convertButton = document.getElementById('convertBtn');
  var resultArea = document.getElementById('resultArea');
  var output = document.getElementById('vpnOutput');
  var jumpButton = document.getElementById('jumpBtn');
  var copyButton = document.getElementById('copyBtn');
  if (!input || !convertButton || !resultArea || !output || !jumpButton || !copyButton) return;

  function ipv6Address(value) {
    var test = value.replace(/^https?:\/\//i, '').split('/')[0];
    return /^\[[0-9a-fA-F:]+\](?::\d+)?$/.test(test) || /^[0-9a-fA-F:]+$/.test(test);
  }

  function convertToVpnUrl(raw) {
    var value = raw.trim();
    if (!value || ipv6Address(value)) return null;
    var protocol = /^https:\/\//i.test(value) ? 'https://' : 'http://';
    var remaining = value.replace(/^https?:\/\//i, '');
    var slashIndex = remaining.indexOf('/');
    var hostPart = slashIndex === -1 ? remaining : remaining.slice(0, slashIndex);
    var pathPart = slashIndex === -1 ? '' : remaining.slice(slashIndex);
    var port = '';
    var colonIndex = hostPart.lastIndexOf(':');
    if (colonIndex !== -1 && /^\d+$/.test(hostPart.slice(colonIndex + 1))) {
      port = hostPart.slice(colonIndex + 1);
      hostPart = hostPart.slice(0, colonIndex);
    }
    if (!/^[A-Za-z0-9.-]+$/.test(hostPart) || hostPart.startsWith('.') || hostPart.endsWith('.')) return null;
    var encodedHost = hostPart.replace(/\./g, '-');
    var portSuffix = port ? '-' + port + '-p' : '';
    var protocolSuffix = protocol === 'https://' ? '-s' : '';
    return 'https://' + encodedHost + portSuffix + protocolSuffix + '.atrust.cqu.edu.cn' + pathPart;
  }

  function generate() {
    var value = convertToVpnUrl(input.value);
    if (!value) {
      resultArea.hidden = true;
      window.alert(ipv6Address(input.value) ? '不支持IPv6地址，请使用IPv4地址或域名' : '请输入有效的地址');
      return;
    }
    output.value = value;
    resultArea.hidden = false;
  }

  function fallbackCopy(value) {
    output.select();
    try {
      document.execCommand('copy');
      window.alert('已复制到剪贴板！');
    } catch (error) {
      window.alert('复制失败，请手动复制');
    }
  }

  convertButton.addEventListener('click', generate);
  jumpButton.addEventListener('click', function () {
    if (output.value) window.location.href = output.value;
  });
  copyButton.addEventListener('click', function () {
    if (!output.value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(function () {
        window.alert('已复制到剪贴板！');
      }).catch(function () { fallbackCopy(output.value); });
    } else {
      fallbackCopy(output.value);
    }
  });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      generate();
    }
  });
}());

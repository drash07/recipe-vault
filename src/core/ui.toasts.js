'use strict';

function showError(msg) {
  let bar = document.getElementById('error-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'error-bar';
    bar.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);max-width:420px;width:100%;background:#C0392B;color:#fff;text-align:center;font-size:12px;padding:8px 12px;z-index:9999;font-family:DM Sans,sans-serif;line-height:1.4';
    document.body.appendChild(bar);
  }
  bar.textContent = msg;
  bar.style.display = 'block';
  setTimeout(() => { bar.style.display = 'none'; }, 5000);
}

function showStatus(msg, color) {
  let bar = document.getElementById('status-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'status-bar';
    bar.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);max-width:420px;width:100%;color:#fff;text-align:center;font-size:12px;padding:6px;z-index:9998;font-family:DM Sans,sans-serif';
    document.body.appendChild(bar);
  }
  bar.style.background = color || 'var(--leaf)';
  bar.textContent = msg;
  bar.style.display = 'block';
}

function hideStatus() {
  const bar = document.getElementById('status-bar');
  if (bar) bar.style.display = 'none';
}

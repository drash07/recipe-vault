'use strict';

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  const sb = document.getElementById('suggest-btn');
  if (sb) sb.style.display = '';
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

/* ===== ui.js =====
 * DOM 갱신: HUD, 화면 전환, 랭킹표.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const el = {
    hud: $('hud'), score: $('score'), distance: $('distance'), hearts: $('hearts'),
    gaugeRed: $('gauge-red'), gaugeCream: $('gauge-cream'),
    powerup: $('powerup'), powerupTime: $('powerup-time'),
    screenStart: $('screen-start'), screenOver: $('screen-over'),
    finalScore: $('final-score'), finalDistance: $('final-distance'),
    rankingBody: $('ranking-body'), saveStatus: $('save-status'),
  };

  function buildStatics() {
    el.hearts.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('span');
      s.className = 'heart';
      s.textContent = '❤';
      el.hearts.appendChild(s);
    }
    buildGauge(el.gaugeRed, 'red');
    buildGauge(el.gaugeCream, 'cream');
  }
  function buildGauge(track, cls) {
    track.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('span');
      s.className = 'seg ' + cls;
      track.appendChild(s);
    }
  }

  function showScreen(name) {
    el.screenStart.classList.toggle('hidden', name !== 'start');
    el.screenOver.classList.toggle('hidden', name !== 'over');
    el.hud.classList.toggle('hidden', name !== 'playing');
  }

  function updateHud(s) {
    el.score.textContent = s.score;
    el.distance.textContent = s.distance;
    [...el.hearts.children].forEach((h, i) => h.classList.toggle('lost', i >= s.hearts));
    setGauge(el.gaugeRed, s.red);
    setGauge(el.gaugeCream, s.cream);
    if (s.invincible > 0) {
      el.powerup.classList.remove('hidden');
      el.powerupTime.textContent = Math.ceil(s.invincible);
    } else {
      el.powerup.classList.add('hidden');
    }
  }
  function setGauge(track, n) {
    [...track.children].forEach((seg, i) => seg.classList.toggle('on', i < n));
  }

  function setFinal(score, distance) {
    el.finalScore.textContent = score;
    el.finalDistance.textContent = distance;
  }
  function setSaveStatus(t) { el.saveStatus.textContent = t; }

  function renderRanking(list, me) {
    el.rankingBody.innerHTML = '';
    if (!list || list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="3" class="rank-empty">아직 기록이 없어요. 첫 주자가 되어보세요!</td>';
      el.rankingBody.appendChild(tr);
      return;
    }
    let meMarked = false;
    list.forEach((r, i) => {
      const tr = document.createElement('tr');
      const isMe = !meMarked && me && r.nickname === me.nickname;
      if (isMe) { tr.className = 'me'; meMarked = true; }
      tr.innerHTML =
        `<td>${i + 1}</td><td>${escapeHtml(r.nickname)}</td><td>${r.score}</td>`;
      el.rankingBody.appendChild(tr);
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  buildStatics();
  window.UI = { showScreen, updateHud, setFinal, setSaveStatus, renderRanking };
})();

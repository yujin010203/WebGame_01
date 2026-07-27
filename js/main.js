/* ===== main.js =====
 * 입력 배선, 시작/재시작, 게임오버→랭킹 저장/표시, 시작화면 미리보기.
 */
(function () {
  const canvas = document.getElementById('game');
  const nicknameInput = document.getElementById('nickname');
  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');
  const stage = document.getElementById('stage');
  let nickname = '이름없는고양이';

  const game = new Game(canvas, {
    onHud: (s) => UI.updateHud(s),
    onOver: (r) => handleGameOver(r),
  });

  function startGame() {
    nickname = (nicknameInput.value || '').trim() || '이름없는고양이';
    UI.showScreen('playing');
    game.start();
  }

  async function handleGameOver(result) {
    UI.showScreen('over');
    UI.setFinal(result.score, result.distance);
    UI.setSaveStatus('점수 저장 중...');
    try {
      await Ranking.saveScore(nickname, result.score, result.distance);
      const top = await Ranking.getTop10();
      UI.renderRanking(top, { nickname, score: result.score });
      UI.setSaveStatus(Ranking.isOnline() ? '🌐 온라인 랭킹' : '💾 로컬 랭킹 (Firebase 미설정)');
    } catch (e) {
      console.warn(e);
      UI.setSaveStatus('랭킹을 불러오지 못했어요.');
    }
  }

  // ===== 입력 =====
  window.addEventListener('keydown', (e) => {
    if (document.activeElement === nicknameInput) return; // 닉네임 입력 중엔 방해 금지
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      game.jump();
    }
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input')) return;
    if (game.running) { e.preventDefault(); game.jump(); }
  });

  btnStart.addEventListener('click', startGame);
  nicknameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });
  btnRestart.addEventListener('click', () => { UI.showScreen('playing'); game.start(); });

  // ===== 시작화면 고양이 미리보기 애니메이션 =====
  (function initPreview() {
    const pc = document.getElementById('preview');
    if (!pc) return;
    const px = pc.getContext('2d');
    px.imageSmoothingEnabled = false;
    let f = 0, t = 0, last = performance.now();
    const s = 3.4;
    function anim(now) {
      const dt = (now - last) / 1000; last = now;
      t += dt;
      if (t > 0.12) { t = 0; f = (f + 1) % Sprites.cat.run.length; }
      px.clearRect(0, 0, pc.width, pc.height);
      const img = Sprites.cat.run[f];
      // 표시 크기는 스프라이트 픽셀 크기가 아니라 native 논리 크기 기준 → 내부 해상도(SS)나 PNG 교체와 무관하게 고정.
      const dw = Sprites.cat.nativeW * s, dh = Sprites.cat.nativeH * s;
      px.drawImage(img, (pc.width - dw) / 2,
        (pc.height - dh) / 2 + 6, dw, dh);
      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  })();

  UI.showScreen('start');
})();

/* ===== assets.js =====
 * assets/ 폴더에 PNG가 있으면 코드 그림(sprites.js) 대신 그 PNG를 사용한다.
 * PNG가 없으면(404) 코드 그림을 그대로 유지 → PNG 미배치 상태에서도 게임 동작 동일.
 * 표시 크기·히트박스는 sprites.js가 정한 native 치수 기준이라 PNG 픽셀 크기와 무관.
 * (sprites.js 다음, entities.js/game.js 이전에 로드)
 */
(function () {
  // 파일 경로(assets/ 기준) → 로드 성공 시 교체 대상
  const MANIFEST = [
    { file: 'cat/run0.png', apply: (img) => { Sprites.cat.run[0] = img; } },
    { file: 'cat/run1.png', apply: (img) => { Sprites.cat.run[1] = img; } },
    { file: 'cat/run2.png', apply: (img) => { Sprites.cat.run[2] = img; } },
    { file: 'cat/jump.png', apply: (img) => { Sprites.cat.jump = img; } },
    { file: 'obstacles/crate.png', apply: (img) => { Sprites.obstacles.crate.canvas = img; } },
    { file: 'obstacles/cone.png', apply: (img) => { Sprites.obstacles.cone.canvas = img; } },
    { file: 'obstacles/bush.png', apply: (img) => { Sprites.obstacles.bush.canvas = img; } },
    { file: 'taiyaki/red.png', apply: (img) => { Sprites.piece.red = img; } },
    { file: 'taiyaki/cream.png', apply: (img) => { Sprites.piece.cream = img; } },
  ];

  function loadAssets(base) {
    base = base || 'assets/';
    return Promise.all(MANIFEST.map((m) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { m.apply(img); resolve(true); };   // PNG 있으면 교체
      img.onerror = () => resolve(false);                    // 없으면 코드 그림 유지
      img.src = base + m.file;
    })));
  }

  // 페이지 로드 시 자동 프리로드 (게임 시작 전에 완료됨)
  loadAssets();

  window.Assets = { loadAssets, MANIFEST };
})();

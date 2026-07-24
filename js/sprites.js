/* ===== sprites.js =====
 * 코드로 그리는 픽셀아트. 작은 오프스크린 캔버스에 도형을 그린 뒤
 * 게임에서 imageSmoothing 없이 확대(SCALE) → 청키한 픽셀 느낌.
 */
(function () {
  const SCALE = 3;
  const SIZE = 0.7; // 캐릭터/오브젝트 전체 축소 비율 (겉보기만 축소, 판정 비율 유지)

  // 오프스크린 캔버스 생성 + 그리기
  function make(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    draw(x);
    return c;
  }

  // --- 그리기 헬퍼 ---
  function ell(x, cx, cy, rx, ry, col) {
    x.fillStyle = col;
    x.beginPath();
    x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    x.fill();
  }
  function circle(x, cx, cy, r, col) { ell(x, cx, cy, r, r, col); }
  function tri(x, ax, ay, bx, by, cx, cy, col) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(ax, ay); x.lineTo(bx, by); x.lineTo(cx, cy);
    x.closePath(); x.fill();
  }
  function rrect(x, px, py, w, h, r, col) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath(); x.fill();
  }

  // ===== 고양이 =====
  const CAT = {
    body: '#565a5e', shade: '#3f4245', belly: '#6c7074',
    pink: '#b98a8f', nose: '#c98a90', eye: '#1f2124',
  };
  // 프레임별 다리 세팅 [뒷다리, 앞다리] : {x, len, lift}
  const LEGS = {
    run0: [{ x: 6, len: 4, lift: 0 }, { x: 15, len: 2, lift: 0 }],
    run1: [{ x: 7, len: 3, lift: 0 }, { x: 14, len: 3, lift: 0 }],
    run2: [{ x: 6, len: 2, lift: 0 }, { x: 16, len: 4, lift: 0 }],
    jump: [{ x: 7, len: 2, lift: 3 }, { x: 15, len: 2, lift: 3 }],
  };

  function drawCat(x, pose) {
    const legs = LEGS[pose];
    // 다리 (몸통 뒤)
    legs.forEach((l) => {
      rrect(x, l.x, 15 - l.lift, 2.6, l.len, 1.1, CAT.shade);
    });
    // 꼬리
    x.strokeStyle = CAT.body;
    x.lineWidth = 2.6;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(4, 12);
    x.quadraticCurveTo(0, 10, 1, 5);
    x.stroke();
    // 몸통 (날렵하게: 가로로 길고 낮게, 무늬 없음)
    ell(x, 11, 12.6, 8.2, 4.2, CAT.body);
    // 배
    ell(x, 11, 14.2, 5, 2.2, CAT.belly);
    // 머리
    circle(x, 17.6, 9, 4.8, CAT.body);
    // 귀
    tri(x, 13.4, 5.4, 14.6, 0.6, 16.6, 5, CAT.body);
    tri(x, 18.2, 5, 20.2, 0.6, 21.6, 5.5, CAT.body);
    tri(x, 14.4, 4.5, 15.1, 2.2, 16, 4.3, CAT.pink);
    tri(x, 19.2, 4.3, 20.2, 2.2, 21.1, 4.6, CAT.pink);
    // 눈
    circle(x, 18.6, 9, 1.1, CAT.eye);
    circle(x, 19, 8.6, 0.35, '#e7e7e7');
    // 코
    circle(x, 22, 10, 0.85, CAT.nose);
  }

  const catNativeW = 24, catNativeH = 20;
  const cat = {
    run: ['run0', 'run1', 'run2'].map((p) => make(catNativeW, catNativeH, (x) => drawCat(x, p))),
    jump: make(catNativeW, catNativeH, (x) => drawCat(x, 'jump')),
    nativeW: catNativeW, nativeH: catNativeH,
  };

  // ===== 장애물 =====
  function drawCrate(x) {
    rrect(x, 1, 2, 18, 18, 2, '#d7a77a');
    rrect(x, 1, 2, 18, 18, 2, '#d7a77a');
    x.strokeStyle = '#a9784f'; x.lineWidth = 1.6;
    x.strokeRect(2, 3, 16, 16);
    x.beginPath(); x.moveTo(2, 3); x.lineTo(18, 19);
    x.moveTo(18, 3); x.lineTo(2, 19); x.stroke();
  }
  function drawCone(x) {
    rrect(x, 1, 19, 20, 4, 1.5, '#9a6f45'); // 바닥
    tri(x, 11, 1, 3, 20, 19, 20, '#c88a5c'); // 몸통
    x.fillStyle = '#e4ddce';
    x.fillRect(6.5, 11, 9, 3);
    x.fillRect(8, 6, 6, 2.4);
  }
  function drawBush(x) {
    circle(x, 7, 14, 6, '#8fa585');
    circle(x, 15, 14, 6, '#8fa585');
    circle(x, 11, 10, 6.5, '#a3b596');
    ['#748a6a'].forEach((c) => {
      circle(x, 8, 13, 1, c); circle(x, 14, 12, 1, c); circle(x, 11, 15, 1, c);
    });
  }
  const obstacles = {
    crate: { canvas: make(20, 22, drawCrate), nativeW: 20, nativeH: 22, inset: 2 },
    cone: { canvas: make(22, 24, drawCone), nativeW: 22, nativeH: 24, inset: 3 },
    bush: { canvas: make(22, 20, drawBush), nativeW: 22, nativeH: 20, inset: 3 },
  };

  // ===== 붕어빵 조각 (팥 / 슈크림) =====
  function drawTaiyaki(x, fill) {
    // 꼬리
    tri(x, 2, 7, 8, 3, 8, 11, '#cfa267');
    // 몸통
    ell(x, 12, 7, 7, 5.2, '#cfa267');
    // 구움 자국
    x.strokeStyle = '#a87e46'; x.lineWidth = 0.9;
    [9, 12, 15].forEach((lx) => { x.beginPath(); x.moveTo(lx, 3.2); x.lineTo(lx, 10.8); x.stroke(); });
    // 속 (색으로 종류 구분)
    ell(x, 13, 8.4, 3.2, 2, fill);
    // 눈
    circle(x, 15.5, 5.5, 0.9, '#4a3b2a');
    circle(x, 15.7, 5.3, 0.3, '#fff');
  }
  const piece = {
    red: make(20, 14, (x) => drawTaiyaki(x, '#b56f74')),   // 팥
    cream: make(20, 14, (x) => drawTaiyaki(x, '#e0c88a')), // 슈크림
    nativeW: 20, nativeH: 14,
  };

  window.Sprites = { SCALE, SIZE, cat, obstacles, piece };
})();

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

  // ===== 고양이 (단색 실루엣 + 검정 눈) =====
  const CAT = { fur: '#5d6166', eye: '#161618' };

  // 프레임별 포즈: 몸통 상하 바운스(bob) + 앞/뒤 발끝 위치 + 꼬리 끝 높이.
  // 힙(다리 시작점)은 몸통 아래 고정, 발끝만 앞뒤로 스윙 → 자연스러운 바운딩 런.
  // 시퀀스 run0→run1→run2: 최대 신전 → 웅크림(체공) → 중간 착지.
  const POSE = {
    run0: { bob: 0.4,  back: [5, 18],  front: [19, 17], tail: 8.5 },
    run1: { bob: -0.8, back: [10, 16], front: [13, 16], tail: 6.5 },
    run2: { bob: 0,    back: [7, 18],  front: [16, 18], tail: 7.5 },
    jump: { bob: -0.8, back: [8, 15],  front: [15, 15], tail: 5.5 },
  };

  // 라운드 캡 선 = 다리 한 짝
  function limb(x, x1, y1, x2, y2, col) {
    x.strokeStyle = col; x.lineWidth = 3.4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  }

  function drawCat(x, pose) {
    const p = POSE[pose];
    const b = p.bob;
    // 다리 (몸통 뒤에 먼저) — 힙은 몸통 아래(bob 반영), 발끝만 프레임별 스윙
    limb(x, 9, 14 + b, p.back[0], p.back[1], CAT.fur);    // 뒷다리
    limb(x, 15, 14 + b, p.front[0], p.front[1], CAT.fur); // 앞다리
    // 꼬리 (끝 높이가 프레임마다 흔들림)
    x.strokeStyle = CAT.fur; x.lineWidth = 2.5; x.lineCap = 'round';
    x.beginPath();
    x.moveTo(5, 12 + b);
    x.quadraticCurveTo(2, 10.5 + b, 3.5, p.tail + b);
    x.stroke();
    // 몸통·머리·귀 (모두 같은 단색, 음영/무늬 없음)
    ell(x, 11, 12.6 + b, 8.2, 4.2, CAT.fur);                     // 몸통
    circle(x, 17.6, 9 + b, 4.8, CAT.fur);                        // 머리
    tri(x, 13.4, 5.4 + b, 14.6, 0.6 + b, 16.6, 5 + b, CAT.fur);  // 왼 귀
    tri(x, 18.2, 5 + b, 20.2, 0.6 + b, 21.6, 5.5 + b, CAT.fur);  // 오른 귀
    // 눈 (검정 점, 하이라이트 없음)
    circle(x, 18.8, 9 + b, 0.62, CAT.eye);
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

  // ===== PNG 교체용 배경/바닥 보관소 (assets.js가 채움, game.js가 읽음) =====
  const bg = { sky: null, ground: null };

  window.Sprites = { SCALE, SIZE, cat, obstacles, piece, bg };
})();

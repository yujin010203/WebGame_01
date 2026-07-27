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
  // 힙(윗끝)은 몸통 안에 숨고 발끝만 대각선 스윙. back/front = [발끝x, 발끝y] (힙 기준 좌우 대칭).
  const POSE = {
    run0: { bob: 0.4,  back: [6.5, 18.5], front: [16, 18.5], tail: 8.5 }, // 벌림
    run1: { bob: -0.8, back: [9, 18],     front: [13.5, 18],   tail: 6.5 }, // 모음(체공)
    run2: { bob: 0,    back: [8.5, 18.5], front: [14, 18.5],   tail: 7.5 }, // 중간
    jump: { bob: -0.8, back: [9, 18],     front: [13.5, 18],   tail: 5.5 },
  };

  // 라운드 캡 선 = 다리 한 짝
  function limb(x, x1, y1, x2, y2, col) {
    x.strokeStyle = col; x.lineWidth = 3.0; x.lineCap = 'round';
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  }

  function drawCat(x, pose) {
    const p = POSE[pose];
    const b = p.bob;
    // 다리 (몸통 뒤에 먼저) — 힙은 몸통 바닥 근처(안쪽, 숨김), 발끝만 대각선 스윙.
    const hipY = 15 + b;
    limb(x, 8.5, hipY, p.back[0], p.back[1], CAT.fur);    // 뒷다리
    limb(x, 14, hipY, p.front[0], p.front[1], CAT.fur); // 앞다리
    // 꼬리 (끝 높이가 프레임마다 흔들림)
    x.strokeStyle = CAT.fur; x.lineWidth = 2.0; x.lineCap = 'round';
    x.beginPath();
    x.moveTo(5, 12 + b);
    x.quadraticCurveTo(2, 10.5 + b, 3.5, p.tail + b);
    x.stroke();
    // 몸통·머리·귀 (모두 같은 단색, 음영/무늬 없음)
    ell(x, 11, 12.6 + b, 7.2, 4.6, CAT.fur);                     // 몸통
    circle(x, 17.6, 9 + b, 4.8, CAT.fur);                        // 머리
    tri(x, 13.4, 6.4 + b, 14.6, 1.6 + b, 16.6, 6 + b, CAT.fur);  // 왼 귀
    tri(x, 18.2, 6 + b, 20.2, 1.6 + b, 21.6, 6.5 + b, CAT.fur);  // 오른 귀
    // 눈 (검정 점, 하이라이트 없음)
    circle(x, 18.8, 9 + b, 0.62, CAT.eye);
  }

  // 고해상(SS배) 캔버스에 그린 뒤 AA fringe(반투명 경계)를 제거 → 하드엣지 픽셀아트.
  const SS = 2; // 내부 렌더 배율 (24×20 → 48×40). 표시 크기는 nativeW/H 기준이라 불변.
  const catNativeW = 24, catNativeH = 20;
  const CAT_COLORS = [
    { r: 0x5d, g: 0x61, b: 0x66 }, // fur
    { r: 0x16, g: 0x16, b: 0x18 }, // eye
  ];
  // 알파<128이면 완전 투명, 아니면 가장 가까운 색으로 완전 불투명 스냅 → 경계 흐림 제거.
  function quantize(canvas) {
    const cx = canvas.getContext('2d');
    const id = cx.getImageData(0, 0, canvas.width, canvas.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
      let best = CAT_COLORS[0], bestDist = Infinity;
      for (const c of CAT_COLORS) {
        const dr = d[i] - c.r, dg = d[i + 1] - c.g, db = d[i + 2] - c.b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) { bestDist = dist; best = c; }
      }
      d[i] = best.r; d[i + 1] = best.g; d[i + 2] = best.b; d[i + 3] = 255;
    }
    cx.putImageData(id, 0, 0);
  }
  function makeCatFrame(pose) {
    const canvas = make(catNativeW * SS, catNativeH * SS, (x) => {
      x.scale(SS, SS);
      drawCat(x, pose);
    });
    quantize(canvas);
    return canvas;
  }
  const cat = {
    run: ['run0', 'run1', 'run2'].map(makeCatFrame),
    jump: makeCatFrame('jump'),
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

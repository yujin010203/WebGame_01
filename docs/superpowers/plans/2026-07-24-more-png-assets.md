# 배경·바닥·하트·버튼 PNG 교체 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 배경·바닥·생명 하트·버튼을 `assets/` 폴더의 PNG로 교체할 수 있게 하되, 파일이 없으면 지금과 100% 동일하게 동작하게 한다.

**Architecture:** 두 갈래. (1) canvas 자산(배경·바닥)은 기존 `js/assets.js` MANIFEST 폴백 로더를 확장해 이미지를 `Sprites.bg`에 저장하고 `js/game.js`가 있으면 타일 스크롤로 그린다. (2) DOM 자산(하트·버튼)은 `js/assets.js`가 PNG 존재를 프로브해 `<body>`에 클래스를 붙이고, `css/style.css`가 그 클래스일 때만 배경 이미지로 교체한다.

**Tech Stack:** Vanilla JS, HTML5 Canvas 2D, CSS. 빌드 도구·테스트 프레임워크 없음.

## Global Constraints

- 히트박스·게임 밸런스·판정 로직은 변경 금지. `js/entities.js`는 건드리지 않는다.
- PNG가 없을 때 게임은 지금과 **완전히 동일**하게 동작해야 한다(이모지 하트, 코드 배경, 색 버튼).
- 일부만 교체 가능해야 한다(예: 하트만, 배경만).
- 픽셀아트 유지: canvas는 `imageSmoothingEnabled = false`(이미 render 시작에 설정됨).
- 무대 캔버스 800×400, 지면 시작 `GROUND_Y = 330` → 지면 높이 70px.
- 기존 코드 스타일(한글 주석, IIFE, `window.X` 전역 노출) 유지.
- 자동 테스트 프레임워크가 없으므로 각 태스크 검증은 **브라우저 수동 확인**이다. 검증용 임시 PNG는 아래 헬퍼로 생성하고, 확인 후 삭제한다.

### 테스트 PNG 생성 헬퍼 (Windows PowerShell)

단색 PNG를 만드는 헬퍼. 태스크별 검증에서 사용한다.

```powershell
Add-Type -AssemblyName System.Drawing
function New-TestPng($path, $w, $h, $colorName) {
  $dir = Split-Path $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::$colorName)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
```

브라우저 확인: `start index.html` 로 기본 브라우저에서 연다(또는 /run 스킬 사용). 변경 후에는 캐시 방지를 위해 Ctrl+F5(강력 새로고침).

---

### Task 1: 배경·바닥 canvas PNG 교체

**Files:**
- Modify: `js/sprites.js` (이미지 보관소 추가, export 확장)
- Modify: `js/assets.js` (MANIFEST에 bg 2개 추가)
- Modify: `js/game.js` (`_drawBackground`/`_drawGround`에 이미지 분기)

**Interfaces:**
- Produces: `Sprites.bg = { sky: Image|null, ground: Image|null }` — assets.js가 채우고 game.js가 읽는다.

- [ ] **Step 1: `js/sprites.js`에 이미지 보관소 추가**

파일 맨 끝 `window.Sprites = ...` 줄(현재 147행)을 아래로 교체:

```js
  // ===== PNG 교체용 배경/바닥 보관소 (assets.js가 채움, game.js가 읽음) =====
  const bg = { sky: null, ground: null };

  window.Sprites = { SCALE, SIZE, cat, obstacles, piece, bg };
```

- [ ] **Step 2: `js/assets.js` MANIFEST에 배경·바닥 추가**

`MANIFEST` 배열의 마지막 항목(`taiyaki/cream.png`) 다음 줄에 추가:

```js
    { file: 'bg/sky.png', apply: (img) => { Sprites.bg.sky = img; } },
    { file: 'bg/ground.png', apply: (img) => { Sprites.bg.ground = img; } },
```

- [ ] **Step 3: `js/game.js` `_drawBackground`에 이미지 분기 추가**

`_drawBackground(ctx) {` 바로 다음 줄에 삽입(기존 그라데이션 코드는 그대로 아래에 남긴다):

```js
      const sky = Sprites.bg.sky;
      if (sky) {
        const off = (((this.bgScroll * 0.15) % sky.width) + sky.width) % sky.width;
        for (let x = -off; x < W; x += sky.width) {
          ctx.drawImage(sky, x, 0, sky.width, GROUND_Y); // 하늘 영역(0..330)에 맞춰 세로 채움
        }
        return;
      }
```

- [ ] **Step 4: `js/game.js` `_drawGround`에 이미지 분기 추가**

`_drawGround(ctx) {` 바로 다음 줄에 삽입(기존 지면 코드는 그대로 아래에 남긴다):

```js
      const gimg = Sprites.bg.ground;
      if (gimg) {
        const gh = H - GROUND_Y; // 70
        const off = ((this.bgScroll % gimg.width) + gimg.width) % gimg.width;
        for (let x = -off; x < W; x += gimg.width) {
          ctx.drawImage(gimg, x, GROUND_Y, gimg.width, gh);
        }
        return;
      }
```

- [ ] **Step 5: 폴백 확인 (PNG 없이)**

`start index.html` → 게임 시작. 기대: 배경(하늘·언덕·구름)·바닥이 **지금과 동일**하게 나오고 정상 스크롤. 에러 없음(F12 콘솔 확인).

- [ ] **Step 6: 교체 확인 (테스트 PNG 삽입)**

헬퍼로 테스트 PNG 생성 후 브라우저 확인:

```powershell
New-TestPng "assets\bg\sky.png" 200 330 "SkyBlue"
New-TestPng "assets\bg\ground.png" 120 70 "SaddleBrown"
```

`start index.html` → Ctrl+F5 → 게임 시작. 기대: 하늘이 하늘색으로, 바닥이 갈색으로 바뀌고 가로로 이음새 없이 스크롤(바닥이 배경보다 빠름).

- [ ] **Step 7: 테스트 PNG 제거 후 폴백 재확인**

```powershell
Remove-Item "assets\bg\sky.png","assets\bg\ground.png"
```

Ctrl+F5 → 배경·바닥이 다시 코드 그림으로 복귀하는지 확인.

- [ ] **Step 8: Commit**

```bash
git add js/sprites.js js/assets.js js/game.js
git commit -m "feat: PNG replacement for background and ground"
```

---

### Task 2: 생명 하트 DOM PNG 교체

**Files:**
- Modify: `js/assets.js` (DOM 프로브 로직 + 하트 처리 추가)
- Modify: `css/style.css` (`has-heart-png` 규칙 추가)

**Interfaces:**
- Consumes: 기존 `.heart` / `.heart.lost` DOM(`js/ui.js`가 생성), `Image` 프로브 패턴.
- Produces: `document.body`에 `has-heart-png` 클래스(하트 full/empty 두 장 모두 로드 성공 시). Task 3이 같은 프로브 헬퍼(`probe`)를 재사용한다.

- [ ] **Step 1: `js/assets.js`에 DOM 프로브 헬퍼 + 하트 처리 추가**

`loadAssets();` 호출 줄과 `window.Assets = ...` 줄 사이에 삽입:

```js
  // ===== DOM 자산 프로브: PNG가 있으면 <body>에 클래스 부착 → CSS가 교체 =====
  function probe(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  function loadDomAssets(base) {
    base = base || 'assets/';
    // 하트는 full/empty 두 장 모두 있을 때만 켠다(한쪽만 있으면 상태 구분이 깨짐)
    Promise.all(['ui/heart-full.png', 'ui/heart-empty.png'].map((f) => probe(base + f)))
      .then((res) => { if (res.every(Boolean)) document.body.classList.add('has-heart-png'); });
  }
  loadDomAssets();
```

- [ ] **Step 2: `css/style.css`에 하트 교체 규칙 추가**

`.heart.lost { ... }` 규칙(현재 88행) 바로 다음에 추가:

```css
body.has-heart-png .heart {
  color: transparent;                 /* 이모지 글자 숨김 */
  text-shadow: none;
  background: center / contain no-repeat url('../assets/ui/heart-full.png');
}
body.has-heart-png .heart.lost {
  background-image: url('../assets/ui/heart-empty.png');
  opacity: 1;                         /* 이미지가 상태를 표현하므로 흐림/축소 해제 */
  transform: none;
}
```

- [ ] **Step 3: 폴백 확인 (PNG 없이)**

`start index.html` → 게임 시작. 기대: 하트가 지금처럼 ❤ 이모지 3개, 피격 시 회색으로 흐려짐.

- [ ] **Step 4: 한쪽만 있을 때 폴백 유지 확인**

```powershell
New-TestPng "assets\ui\heart-full.png" 48 48 "Crimson"
```

Ctrl+F5 → 기대: full만 있으므로 `has-heart-png`가 **안 켜지고** 이모지 폴백 유지.

- [ ] **Step 5: 두 장 모두 있을 때 교체 확인**

```powershell
New-TestPng "assets\ui\heart-empty.png" 48 48 "Gray"
```

Ctrl+F5 → 게임 시작 후 장애물에 맞아보기. 기대: 남은 하트=빨강 사각, 잃은 하트=회색 사각으로 바뀜.

- [ ] **Step 6: 테스트 PNG 제거 후 폴백 재확인**

```powershell
Remove-Item "assets\ui\heart-full.png","assets\ui\heart-empty.png"
```

Ctrl+F5 → 하트가 다시 이모지로 복귀하는지 확인.

- [ ] **Step 7: Commit**

```bash
git add js/assets.js css/style.css
git commit -m "feat: PNG replacement for life hearts"
```

---

### Task 3: 버튼 DOM PNG 교체

**Files:**
- Modify: `js/assets.js` (`loadDomAssets`에 버튼 프로브 추가)
- Modify: `css/style.css` (`has-button-png` 규칙 추가)

**Interfaces:**
- Consumes: Task 2의 `probe` 헬퍼, 기존 `.btn` DOM.
- Produces: `document.body`에 `has-button-png` 클래스(`ui/button.png` 로드 성공 시).

- [ ] **Step 1: `js/assets.js` `loadDomAssets`에 버튼 프로브 추가**

Task 2에서 만든 `loadDomAssets` 함수의 하트 `Promise.all(...)` 블록 다음에 추가:

```js
    // 버튼은 한 장이면 켠다
    probe(base + 'ui/button.png').then((ok) => {
      if (ok) document.body.classList.add('has-button-png');
    });
```

- [ ] **Step 2: `css/style.css`에 버튼 교체 규칙 추가**

`.btn { ... }` 규칙 블록(현재 183~199행) 다음에 추가:

```css
body.has-button-png .btn {
  background-image: url('../assets/ui/button.png');
  background-size: 100% 100%;         /* 버튼 크기에 맞춰 늘림; 글자·그림자 유지 */
}
```

- [ ] **Step 3: 폴백 확인 (PNG 없이)**

`start index.html`. 기대: 시작 화면 "게임 시작" 버튼이 지금처럼 세이지 색 배경.

- [ ] **Step 4: 교체 확인**

```powershell
New-TestPng "assets\ui\button.png" 200 60 "DarkSlateGray"
```

Ctrl+F5 → 기대: "게임 시작" 버튼 배경이 어두운 회녹색 이미지로 바뀌고, **글자·클릭은 정상**. 게임오버 화면의 "다시 시작" 버튼도 동일하게 바뀌는지 확인.

- [ ] **Step 5: 테스트 PNG 제거 후 폴백 재확인**

```powershell
Remove-Item "assets\ui\button.png"
```

Ctrl+F5 → 버튼이 다시 세이지 색으로 복귀하는지 확인.

- [ ] **Step 6: Commit**

```bash
git add js/assets.js css/style.css
git commit -m "feat: PNG replacement for buttons"
```

---

### Task 4: assets/README.md 문서화

**Files:**
- Modify: `assets/README.md` (bg/, ui/ 섹션 추가)

**Interfaces:** 없음(문서만).

- [ ] **Step 1: `assets/README.md`에 새 파일 규칙 추가**

기존 "### taiyaki/" 표 블록 다음, "## 팁" 섹션 앞에 삽입:

```markdown
### bg/  — 배경 & 바닥 (가로 반복 스크롤)
| 파일 | 용도 | 권장 px |
|------|------|---------|
| `bg/sky.png`    | 배경(하늘·언덕·구름). 가로로 반복되며 느리게 스크롤. | 높이 330, 폭 자유 |
| `bg/ground.png` | 바닥 타일. 가로로 반복되며 배경보다 빠르게 스크롤.   | 높이 70, 폭 자유  |

세로는 각 영역 높이(하늘 330 / 바닥 70)에 자동으로 맞춰 채워지므로, 폭만
가로로 이어지게(좌우 끝이 매끄럽게) 만들면 이음새 없이 스크롤됩니다.

### ui/  — 생명 하트 & 버튼 (HTML 요소)
| 파일 | 용도 | 비고 |
|------|------|------|
| `ui/heart-full.png`  | 남은 생명 | full/empty **두 장 모두** 있어야 적용됨 |
| `ui/heart-empty.png` | 잃은 생명 | 한쪽만 있으면 ❤ 이모지 폴백 유지 |
| `ui/button.png`      | 버튼 배경 틀 | 버튼 크기에 맞춰 늘어남; 글자는 코드로 유지 |

- 하트 권장: 정사각(예 48×48), 투명 배경.
- 버튼은 배경만 교체되고 "게임 시작"/"다시 시작" 글자는 그대로 얹혀 나옵니다.
```

- [ ] **Step 2: 표시 확인**

`assets/README.md`를 열어 표가 깨지지 않고 렌더되는지 확인(마크다운 미리보기 또는 GitHub).

- [ ] **Step 3: Commit**

```bash
git add assets/README.md
git commit -m "docs: document bg/ and ui/ PNG replacement rules"
```

---

## 검증 (전체)

- 4개 태스크 커밋 후 `git log --oneline`으로 4개 커밋 확인.
- PNG 하나도 없이 실행 → 게임이 첫 상태와 동일한지 최종 확인.
- 배경·바닥·하트(2장)·버튼 테스트 PNG를 **동시에** 넣고 실행 → 네 요소가 모두 교체되고 게임이 정상 동작(스크롤·피격·버튼 클릭)하는지 확인 후 테스트 PNG 정리.

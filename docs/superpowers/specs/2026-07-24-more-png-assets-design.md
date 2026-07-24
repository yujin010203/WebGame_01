# 배경·바닥·하트·버튼 PNG 교체 — 설계 문서

작성일: 2026-07-24

## 배경 (Background)

붕어빵 러너는 이미 고양이·장애물·붕어빵 스프라이트를 PNG로 교체하는 폴백
로더(`js/assets.js`의 `MANIFEST`)를 갖고 있다. `assets/` 폴더에 규칙대로 PNG를
넣으면 코드 그림 대신 그 PNG를 쓰고, 파일이 없으면 코드 그림을 그대로 유지한다.

사용자는 나머지 요소도 직접 만든 PNG로 교체하고 싶어 한다:

- **배경** (하늘·언덕·구름) — canvas에 코드로 그려짐 (`game.js` `_drawBackground`)
- **바닥** (지면) — canvas에 코드로 그려짐 (`game.js` `_drawGround`)
- **생명 하트** — HUD의 `<span class="heart">❤</span>` 이모지 + CSS
- **버튼** (게임 시작 / 다시 시작) — HTML `<button class="btn">` + CSS

교체 대상이 **canvas 그림**(배경·바닥)과 **HTML/CSS 요소**(하트·버튼) 두 종류로
나뉘고, 각각 다른 교체 메커니즘이 필요하다.

## 목표 / 성공 기준

- `assets/` 폴더에 아래 규칙대로 PNG를 넣으면 배경·바닥·하트·버튼이 그 PNG로 바뀐다.
- PNG를 넣지 않으면 게임은 **지금과 100% 동일**하게 동작한다 (이모지 하트, 코드 배경, 색 버튼).
- 일부만 넣어도 된다 (예: 하트만 교체, 배경은 코드 그림).
- 히트박스·게임 밸런스·판정은 전혀 바뀌지 않는다.

## 비목표 (YAGNI)

- 하트·버튼을 canvas로 옮기지 않는다 (클릭·레이아웃·접근성 유지).
- 버튼 9-slice(모서리 또렷) 처리는 v1 범위 밖. 필요 시 후속 작업.
- 배경 패럴랙스 다중 레이어 PNG는 범위 밖. 배경은 스크롤 1장으로 통일.

## 결정된 사항 (사용자 확인 완료)

- **배경 방식**: 가로 반복 스크롤 이미지 1장 (느린 패럴랙스 속도).
- **바닥 방식**: 가로 반복 타일, 바닥 스크롤 속도.
- **버튼 방식**: 버튼 **배경만** PNG, "게임 시작"/"다시 시작" 글자는 코드로 유지.
- **하트**: 남은 생명 / 잃은 생명 두 종류 PNG.

## 파일 / 폴더 규칙

```
assets/bg/sky.png          배경(하늘·언덕·구름). 가로 반복. 권장 높이 330px, 폭 자유.
assets/bg/ground.png       바닥 타일. 가로 반복. 권장 높이 70px (= 800×400 무대에서 지면 높이).
assets/ui/heart-full.png   남은 생명. 권장 정사각 (예: 48×48), 투명 배경.
assets/ui/heart-empty.png  잃은 생명.
assets/ui/button.png       버튼 배경 틀. 가로로 늘려 사용.
```

무대 캔버스는 800×400, 지면 시작 y=330 → 지면 높이 70px.
표시 크기·판정은 코드 고정값 기준이라 PNG 실제 픽셀 크기가 달라도 밸런스는 안 바뀐다.

## 아키텍처

두 갈래로 나뉘지만, 둘 다 "파일 있으면 적용, 없으면 원상복구"라는 하나의 철학을 따른다.
로더 진입점은 기존 `js/assets.js` 하나로 통일한다.

### 갈래 1 — canvas 자산 (배경·바닥)

- **`js/sprites.js`**: 이미지 보관소 추가.
  ```js
  const bg = { sky: null, ground: null };
  window.Sprites = { SCALE, SIZE, cat, obstacles, piece, bg };
  ```
- **`js/assets.js`**: 기존 `MANIFEST`에 항목 추가.
  ```js
  { file: 'bg/sky.png',    apply: (img) => { Sprites.bg.sky = img; } },
  { file: 'bg/ground.png', apply: (img) => { Sprites.bg.ground = img; } },
  ```
  로드 성공 시 이미지 저장, 실패(404) 시 `null` 유지.
- **`js/game.js`**:
  - `_drawBackground`: `Sprites.bg.sky`가 있으면 `bgScroll * 0.15`(느린 패럴랙스)를
    오프셋으로 가로 반복 그리기. 세로는 하늘 영역 높이(0..GROUND_Y = 330px)에 맞춰
    그려 어떤 높이의 이미지든 빈틈 없이 채운다. 타일 폭은 이미지 원본 폭 사용.
    없으면 현재 그라데이션+언덕+구름 코드 그대로.
  - `_drawGround`: `Sprites.bg.ground`가 있으면 `bgScroll`(바닥 속도)을 오프셋으로
    y=GROUND_Y..H(높이 70px)에 맞춰 가로 반복 그리기. 없으면 현재 지면 코드 그대로.
  - `imageSmoothingEnabled = false`는 이미 render 시작에서 꺼져 있어 픽셀아트 유지.

### 갈래 2 — DOM 자산 (하트·버튼)

DOM PNG는 로드 실패를 CSS만으로 감지할 수 없다. 그래서 JS가 먼저 존재를 프로브하고,
성공 시 `<body>`에 클래스를 붙여 CSS 교체를 켠다. 이 방식은 DOM 생성 타이밍과
분리되어(클래스는 `<body>`에 한 번 붙고 CSS가 이후 렌더에 자동 적용) 로드 순서에
안전하다.

- **`js/assets.js`**: canvas 프리로드와 함께 DOM 자산도 프로브.
  ```js
  const DOM_ASSETS = [
    { file: 'ui/heart-full.png',  cls: 'has-heart-png' },  // full+empty 둘 다 있을 때만 켬
    { file: 'ui/heart-empty.png', cls: 'has-heart-png' },
    { file: 'ui/button.png',      cls: 'has-button-png' },
  ];
  ```
  - 하트는 full/empty 두 장이 **모두** 있을 때만 `has-heart-png`를 켠다(한쪽만 있으면
    상태 구분이 깨지므로 이모지 폴백 유지).
  - 버튼은 `ui/button.png` 하나 로드되면 `has-button-png`.
  - `document.body`에 클래스 부착. (assets.js는 `<body>` 안 `<script>`로 로드되므로
    `document.body` 존재함.)
- **`css/style.css`**:
  ```css
  body.has-heart-png .heart {
    color: transparent;                 /* 이모지 숨김 */
    text-shadow: none;
    background: center/contain no-repeat url('../assets/ui/heart-full.png');
  }
  body.has-heart-png .heart.lost {
    background-image: url('../assets/ui/heart-empty.png');
    opacity: 1; transform: none;        /* 이미지가 상태를 표현 */
  }
  body.has-button-png .btn {
    background-image: url('../assets/ui/button.png');
    background-size: 100% 100%;         /* 버튼 크기에 맞춰 늘림 */
    /* 기존 배경색 위에 이미지가 덮임; 글자·그림자 스타일 유지 */
  }
  ```
  경로는 `css/`에서 상대 → `../assets/...`.

## 데이터 흐름

1. 페이지 로드 → `assets.js`가 canvas PNG 프리로드 + DOM PNG 프로브(body 클래스 부착).
2. 게임 렌더 루프 → `game.js`가 `Sprites.bg.*` 유무로 배경/바닥 분기.
3. HUD/화면 → CSS가 body 클래스 유무로 하트/버튼 배경 분기.

## 폴백 동작 (변경 없음 보장)

| 요소 | PNG 있을 때 | PNG 없을 때 |
|------|-------------|-------------|
| 배경 | sky.png 가로 반복 | 코드 그라데이션+언덕+구름 |
| 바닥 | ground.png 가로 반복 | 코드 지면 |
| 하트 | full/empty 이미지 | ❤ 이모지 (색/투명도) |
| 버튼 | button.png 배경 + 글자 | 세이지 색 배경 + 글자 |

## 변경 파일

- `js/sprites.js` — `bg` 보관소 추가, export에 포함.
- `js/assets.js` — MANIFEST에 bg 2개 추가, DOM 프로브 로직 추가.
- `js/game.js` — `_drawBackground`/`_drawGround`에 이미지 분기.
- `css/style.css` — `has-heart-png`/`has-button-png` 규칙 추가.
- `assets/README.md` — 새 파일 규칙(bg/, ui/) 문서화.

히트박스·엔티티·게임 규칙 파일(`entities.js`)은 건드리지 않는다.

## 검증

- **폴백**: PNG 없이 실행 → 지금과 화면이 동일한지 눈으로 확인.
- **배경/바닥**: 임시 test PNG를 넣고 실행 → 가로로 이음새 없이 스크롤되는지.
- **하트**: full/empty 두 장 넣고 게임 중 피격 → 남은/잃은 하트가 이미지로 바뀌는지.
  한 장만 넣으면 이모지 폴백 유지되는지.
- **버튼**: button.png 넣고 시작/게임오버 화면 → 버튼 배경만 바뀌고 글자·클릭 정상인지.

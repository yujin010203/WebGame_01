# 붕어빵런 🐱🍞

크롬 공룡 게임 스타일의 횡스크롤 러닝 게임. 배고픈 회색 고양이가 달리며 장애물을 피하고
붕어빵 조각을 먹어 점수를 얻습니다. 순수 **바닐라 JS + HTML5 Canvas**로 제작되었고,
그래픽은 전부 코드로 그린 픽셀아트입니다.

## 게임 방법
- **스페이스바 / ↑ / W** 또는 **화면 클릭·터치** → 점프 (공중에서 한 번 더 누르면 **2단 점프**)
- 🚧 장애물에 부딪히면 하트 -1 (1.5초 무적), 하트 3개가 모두 없어지면 게임 오버
- 🍞 붕어빵 조각을 먹으면 +100점
  - **팥 조각(빨강) 5개** → 팥붕어빵 완성 **+500점**
  - **슈크림 조각(노랑) 5개** → 슈크림붕어빵 완성 **5초 무적**
- 시간이 지날수록 점점 빨라집니다
- **최종 점수 = 달린 거리(m) × 1 (1m = 1점) + 붕어빵 점수**
- 같은 닉네임은 랭킹에 **최고 점수 한 줄만** 올라갑니다(중복 불가)

## 실행 방법
ES 모듈 대신 클래식 스크립트를 쓰기 때문에 `index.html`을 브라우저로 바로 열어도
게임은 동작합니다. 다만 **온라인 랭킹(Firebase)** 이나 일부 브라우저 보안 정책 때문에
**로컬 웹서버로 실행하는 것을 권장**합니다.

```bash
# 방법 1: Node (npx)
npx serve .

# 방법 2: Python
python -m http.server 8000
```

그 후 브라우저에서 `http://localhost:8000` (또는 serve가 안내하는 주소) 접속.

## 랭킹 저장
- **기본값**: `localStorage` 로컬 랭킹으로 즉시 동작 (같은 브라우저 내에서만 공유).
- **온라인 실시간 랭킹**을 켜려면 Firebase Firestore를 연결하세요.

### Firebase 연결 (선택)
1. [Firebase 콘솔](https://console.firebase.google.com/)에서 프로젝트 생성
2. **Firestore Database** 생성 (테스트 모드로 시작해도 됩니다)
3. 프로젝트 설정 → 내 앱(웹 앱 추가) 에서 `firebaseConfig` 6개 값 확인
4. `js/firebase.js` 상단의 `firebaseConfig`에서 `YOUR_*` 값을 실제 값으로 교체
5. 로컬 서버로 실행하면 자동으로 온라인 랭킹(`rankings` 컬렉션)이 활성화됩니다

> 값을 하나라도 `YOUR_`로 남겨두면 자동으로 로컬 랭킹으로 폴백합니다.

Firestore 보안 규칙 예시(데모용 — 실서비스에는 더 엄격한 규칙 권장):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rankings/{doc} {
      allow read: if true;
      allow create: if true;
    }
  }
}
```

## 파일 구조
```
index.html        화면/HUD 구조, 스크립트 로드
css/style.css     파스텔 오락실 스타일, 반응형
js/sprites.js     코드로 그리는 픽셀아트 (고양이/장애물/붕어빵)
js/entities.js    Cat / Obstacle / Piece
js/game.js        게임 루프·스폰·충돌·난이도·점수
js/ui.js          HUD·화면전환·랭킹표 렌더
js/firebase.js    Firebase + localStorage 폴백
js/main.js        입력·시작/재시작 배선
```

PC/모바일 모두 지원하는 반응형 UI입니다.

## 커스텀 그래픽(PNG) 적용하기
현재 그래픽은 전부 `js/sprites.js`에서 코드로 그립니다. 직접 만든 PNG로 바꾸려면
그리는 부분만 이미지 로딩으로 교체하면 됩니다. 엔티티들은 `ctx.drawImage(...)`로
그리므로 **캔버스든 `<img>`든 그대로 사용**할 수 있습니다.

예) 고양이 달리기 스프라이트를 내 PNG로 교체:
```js
// js/sprites.js 맨 아래 window.Sprites = {...} 직전에 추가
function loadImg(src) { const i = new Image(); i.src = src; return i; }

// 코드로 그린 프레임 대신 내 PNG 사용 (assets 폴더에 넣기)
cat.run = [loadImg('assets/cat_run1.png'), loadImg('assets/cat_run2.png')];
cat.jump = loadImg('assets/cat_jump.png');
```
- 장애물: `obstacles.crate.canvas = loadImg('assets/crate.png')` 처럼 교체
- 붕어빵: `piece.red = loadImg('assets/taiyaki_red.png')` 처럼 교체
- 크기는 원본 이미지 크기 × `SCALE`(현재 3)로 커집니다. 크기를 조절하려면 `SCALE`을
  바꾸거나, `js/entities.js`에서 각 엔티티의 `this.w/this.h`를 원하는 픽셀 값으로 지정하세요.

> 스프라이트시트(한 장에 여러 프레임) PNG를 쓰고 싶다면, `drawImage`의
> 9-인자 형태(`drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)`)로 잘라 그리면 됩니다.

톤/색은 `css/style.css`의 `:root` 변수와 `js/game.js`의 배경·바닥 색상값,
`js/sprites.js`의 색상 상수만 바꾸면 전체 분위기를 조정할 수 있습니다.

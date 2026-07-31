# 붕어빵런 🐱🍞

크롬 공룡 게임 스타일의 횡스크롤 러닝 게임. 배고픈 회색 고양이가 달리며 장애물을 피하고
붕어빵 조각을 먹어 점수를 얻습니다. 순수 **바닐라 JS + HTML5 Canvas**로 제작되었고,
그래픽은 기본적으로 전부 코드로 그린 픽셀아트입니다(원하면 PNG로 교체 가능).

**▶ 지금 바로 플레이: https://yujin010203.github.io/WebGame_01/**

## 게임 방법
- **스페이스바 / ↑ / W** 또는 **화면 클릭·터치** → 점프 (공중에서 한 번 더 누르면 **2단 점프**)
- 🚧 장애물에 부딪히면 하트 -1 (1.5초 무적), 하트 3개가 모두 없어지면 게임 오버
- 🍞 붕어빵 조각을 먹으면 +100점
  - **팥 조각(빨강) 5개** → 팥붕어빵 완성 **+500점**
  - **슈크림 조각(노랑) 5개** → 슈크림붕어빵 완성 **5초 무적**
- 시간이 지날수록 점점 빨라집니다 (속도 200 → 최대 520)
- **최종 점수 = 달린 거리(m) × 1 (1m = 1점) + 붕어빵 점수**
- 같은 닉네임은 랭킹에 **최고 점수 한 줄만** 올라갑니다(중복 불가)

## 실행 방법
ES 모듈 대신 클래식 스크립트를 쓰기 때문에 `index.html`을 브라우저로 바로 열어도
게임은 동작합니다. 다만 **온라인 랭킹**이나 **PNG 자동 교체**, 일부 브라우저 보안 정책
때문에 **로컬 웹서버로 실행하는 것을 권장**합니다.

```bash
# 방법 1: Node (npx)
npx serve .

# 방법 2: Python
python -m http.server 8000
```

그 후 브라우저에서 `http://localhost:8000` (또는 serve가 안내하는 주소) 접속.

## 랭킹 저장
온라인 실시간 랭킹은 **Firebase Firestore로 이미 연결되어 있습니다.**
접속만 하면 전 세계 플레이어와 TOP 10을 공유합니다(`rankings` 컬렉션).
Firebase 초기화에 실패하거나 오프라인이면 자동으로 **`localStorage` 로컬 랭킹**으로
폴백하므로 어떤 상황에서도 랭킹 화면은 동작합니다.

### 나만의 Firebase로 바꾸기 (선택)
다른 프로젝트에 붙이려면 `js/firebase.js` 상단의 `firebaseConfig`만 교체하면 됩니다.
1. [Firebase 콘솔](https://console.firebase.google.com/)에서 프로젝트 생성
2. **Firestore Database** 생성 (테스트 모드로 시작해도 됩니다)
3. 프로젝트 설정 → 내 앱(웹 앱 추가) 에서 `firebaseConfig` 6개 값 확인
4. `js/firebase.js`의 `firebaseConfig` 값을 실제 값으로 교체

> 값에 `YOUR_`가 하나라도 남아 있으면 온라인 연결을 건너뛰고 로컬 랭킹으로 폴백합니다.

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
js/sprites.js     코드로 그리는 픽셀아트 (고양이/장애물/붕어빵/배경)
js/assets.js      assets/ 폴더에 PNG가 있으면 코드 그림 대신 자동 교체
js/entities.js    Cat / Obstacle / Piece
js/game.js        게임 루프·스폰·충돌·난이도·점수
js/ui.js          HUD·화면전환·랭킹표 렌더
js/firebase.js    Firebase Firestore + localStorage 폴백
js/main.js        입력·시작/재시작 배선
assets/           (선택) 스프라이트 PNG 교체 폴더 — assets/README.md 참고
```

PC/모바일 모두 지원하는 반응형 UI입니다.

## 커스텀 그래픽(PNG) 적용하기
기본 그래픽은 `js/sprites.js`에서 코드로 그리지만, **코드를 고칠 필요 없이**
`assets/` 폴더에 정해진 이름으로 PNG를 넣기만 하면 자동으로 그 PNG로 교체됩니다.
파일이 없으면 코드 그림이 그대로 나오므로, 원하는 것만 부분 교체할 수 있습니다.

예) 고양이만 내 그림으로 바꾸기 → `assets/cat/`에 아래 파일을 넣으면 끝:
```
assets/cat/run0.png   달리기 프레임 1
assets/cat/run1.png   달리기 프레임 2
assets/cat/run2.png   달리기 프레임 3
assets/cat/jump.png   점프
```

교체 가능한 전체 목록(장애물·붕어빵·배경·바닥·하트·버튼)과 권장 크기,
네이밍 규칙은 **[`assets/README.md`](assets/README.md)** 에 정리되어 있습니다.
교체 대상 경로는 `js/assets.js`의 `MANIFEST`에서 관리합니다.

> 표시 크기·충돌 판정은 코드가 정한 고정 치수 기준이라, PNG 실제 픽셀 크기가 달라도
> 게임 밸런스는 바뀌지 않습니다. 픽셀이 부드럽게 뭉개지지 않는 하드엣지 방식으로 확대됩니다.

톤/색은 `css/style.css`의 `:root` 변수와 `js/game.js`의 배경·바닥 색상값,
`js/sprites.js`의 색상 상수만 바꾸면 전체 분위기를 조정할 수 있습니다.

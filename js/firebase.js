/* ===== firebase.js =====
 * 실시간 랭킹. Firebase config가 실제 값이면 Firestore 사용,
 * 플레이스홀더거나 초기화 실패 시 자동으로 localStorage 폴백.
 *
 * ▶ 온라인 랭킹을 켜려면 아래 firebaseConfig의 YOUR_* 값을
 *   본인 Firebase 프로젝트 값으로 교체하세요. (README 참고)
 */
(function () {
  const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  };

  const LS_KEY = 'cat_runner_rankings';
  const isPlaceholder = Object.values(firebaseConfig).some((v) => /YOUR_/.test(v));
  let db = null;
  let online = false;

  if (!isPlaceholder && window.firebase) {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      online = true;
    } catch (e) {
      console.warn('[Ranking] Firebase 초기화 실패 → localStorage 사용', e);
    }
  }

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveLocal(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { /* 용량 초과 등 무시 */ }
  }

  async function saveScore(nickname, score, distance) {
    if (online) {
      try {
        // 닉네임을 문서 ID로 사용 → 중복 불가, 최고 점수만 유지
        const ref = db.collection('rankings').doc(nickname.replace(/\//g, '_'));
        const snap = await ref.get();
        if (!snap.exists || score > (snap.data().score || 0)) {
          await ref.set({
            nickname, score, distance,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        }
        return;
      } catch (e) {
        console.warn('[Ranking] 저장 실패 → localStorage', e);
      }
    }
    // localStorage: 같은 닉네임은 최고 점수만 남김(upsert)
    const list = loadLocal();
    const idx = list.findIndex((e) => e.nickname === nickname);
    if (idx >= 0) {
      if (score > list[idx].score) list[idx] = { nickname, score, distance, createdAt: Date.now() };
    } else {
      list.push({ nickname, score, distance, createdAt: Date.now() });
    }
    saveLocal(list);
  }

  async function getTop10() {
    if (online) {
      try {
        const snap = await db.collection('rankings')
          .orderBy('score', 'desc').limit(10).get();
        return snap.docs.map((d) => d.data());
      } catch (e) {
        console.warn('[Ranking] 조회 실패 → localStorage', e);
      }
    }
    return loadLocal().sort((a, b) => b.score - a.score).slice(0, 10);
  }

  window.Ranking = { saveScore, getTop10, isOnline: () => online };
})();

/* ===== game.js =====
 * 게임 루프 + 규칙: 스폰, 충돌, 난이도, 점수, 게이지/무적, 렌더.
 */
(function () {
  const W = 800, H = 400;
  const GROUND_Y = 330;
  const SPEED_START = 200, SPEED_MAX = 520, ACCEL = 3;
  const PX_PER_M = 20; // 화면 이동 px → 거리(m) 환산

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  class Game {
    constructor(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cb = callbacks; // { onHud, onOver }
      this.cat = new Entities.Cat(GROUND_Y);
      this.running = false;
      this._loop = this._loop.bind(this);
    }

    reset() {
      this.cat.reset();
      this.obstacles = [];
      this.pieces = [];
      this.particles = [];
      this.speed = SPEED_START;
      this.distance = 0;   // meters
      this.itemPoints = 0;
      this.hearts = 3;
      this.gauge = { red: 0, cream: 0 };
      this.invincible = 0; // 슈크림 무적(초)
      this.obTimer = 0.9;
      this.pieceTimer = 1.4;
      this.bgScroll = 0;
    }

    start() {
      this.reset();
      this.running = true;
      this.last = performance.now();
      this._emitHud();
      requestAnimationFrame(this._loop);
    }

    stop() { this.running = false; }

    jump() { if (this.running) this.cat.jump(); }

    get score() { return Math.floor(this.distance) + this.itemPoints; } // 1m = 1점

    _loop(ts) {
      if (!this.running) return;
      let dt = (ts - this.last) / 1000;
      this.last = ts;
      if (dt > 0.05) dt = 0.05; // 탭 비활성 등 큰 점프 방지
      this.update(dt);
      this.render();
      requestAnimationFrame(this._loop);
    }

    update(dt) {
      this.speed = Math.min(SPEED_MAX, this.speed + ACCEL * dt);
      this.distance += (this.speed * dt) / PX_PER_M;
      this.bgScroll += this.speed * dt;
      if (this.invincible > 0) this.invincible -= dt;

      this.cat.update(dt);

      this.obTimer -= dt;
      if (this.obTimer <= 0) this._spawnObstacle();
      this.pieceTimer -= dt;
      if (this.pieceTimer <= 0) this._spawnPieces();

      this.obstacles.forEach((o) => o.update(dt, this.speed));
      this.pieces.forEach((p) => p.update(dt, this.speed));
      this.particles.forEach((pt) => {
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 900 * dt; pt.life -= dt;
      });

      this._collide();

      this.obstacles = this.obstacles.filter((o) => !o.dead);
      this.pieces = this.pieces.filter((p) => !p.dead);
      this.particles = this.particles.filter((pt) => pt.life > 0);

      this._emitHud();
    }

    _spawnObstacle() {
      const types = ['crate', 'cone', 'bush'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.obstacles.push(new Entities.Obstacle(type, GROUND_Y, W + 20));
      // 속도가 빠를수록 간격 짧게, 단 2단 점프로 넘길 최소 간격 보장
      let next = 1.15 * (SPEED_START / this.speed) + Math.random() * 0.7;
      if (next < 0.55) next = 0.55 + Math.random() * 0.3;
      this.obTimer = next;
    }

    _spawnPieces() {
      const type = Math.random() < 0.5 ? 'red' : 'cream';
      const count = Math.random() < 0.75 ? 1 : 2; // 대부분 1개, 가끔만 2개
      const elevated = Math.random() < 0.5;
      const baseY = elevated ? GROUND_Y - 190 : GROUND_Y - 70;
      for (let i = 0; i < count; i++) {
        this.pieces.push(new Entities.Piece(type, W + 20 + i * 105, baseY));
      }
      this.pieceTimer = 2.2 + Math.random() * 2.6; // 2.2~4.8초, 너무 자주 안 나오게
    }

    _collide() {
      const cb = this.cat.hitbox();

      for (const o of this.obstacles) {
        if (o.dead) continue;
        if (!aabb(cb, o.hitbox())) continue;
        if (this.invincible > 0) {
          o.dead = true;
          this._burst(o.x + o.w / 2, o.y + o.h / 2, '#c2b3bb', 14);
        } else if (this.cat.iframe <= 0) {
          this.hearts--;
          this.cat.iframe = 1.5;
          this._burst(cb.x + cb.w / 2, cb.y, '#b8757e', 12);
          if (this.hearts <= 0) { this._gameOver(); return; }
        }
      }

      for (const p of this.pieces) {
        if (p.dead) continue;
        if (!aabb(cb, p.hitbox())) continue;
        p.dead = true;
        this.itemPoints += 100;
        this.gauge[p.type]++;
        this._burst(p.x + p.w / 2, p.y + p.h / 2,
          p.type === 'red' ? '#b56f74' : '#cdb075', 8);
        if (this.gauge[p.type] >= 5) {
          this.gauge[p.type] = 0;
          if (p.type === 'red') {
            this.itemPoints += 500;
            this._burst(this.cat.x + 40, this.cat.y + 10, '#c9a55e', 22);
          } else {
            this.invincible = 5;
            this._burst(this.cat.x + 40, this.cat.y + 10, '#9cbfa6', 22);
          }
        }
      }
    }

    _gameOver() {
      this.running = false;
      this.cb.onOver({ score: this.score, distance: Math.floor(this.distance) });
    }

    _burst(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 150;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 40,
          life: 0.45 + Math.random() * 0.3,
          maxLife: 0.75,
          color,
          size: 2 + Math.random() * 3,
        });
      }
    }

    _emitHud() {
      this.cb.onHud({
        score: this.score,
        distance: Math.floor(this.distance),
        hearts: this.hearts,
        red: this.gauge.red,
        cream: this.gauge.cream,
        invincible: this.invincible,
      });
    }

    // ===== 렌더 =====
    render() {
      const ctx = this.ctx;
      ctx.imageSmoothingEnabled = false;
      this._drawBackground(ctx);
      this._drawGround(ctx);
      this.pieces.forEach((p) => p.draw(ctx));
      this.obstacles.forEach((o) => o.draw(ctx));
      if (this.invincible > 0) {
        this._drawAura(ctx);
        const t = performance.now();
        const hue = (t / 4) % 360;                              // 무지개 색조 회전
        const flash = 1 + 0.55 * Math.max(0, Math.sin(t / 70)); // 밝기 깜빡
        ctx.save();
        ctx.filter = `hue-rotate(${hue.toFixed(1)}deg) saturate(2.4) brightness(${flash.toFixed(3)})`;
        this.cat.draw(ctx);
        ctx.restore();
        this._drawSparkles(ctx);
      } else {
        const blink = this.cat.iframe > 0 && Math.floor(this.cat.iframe * 12) % 2 === 0;
        if (!blink) this.cat.draw(ctx);
      }
      this._drawParticles(ctx);
    }

    // 무적 중 고양이 주위에 반짝이는 별
    _drawSparkles(ctx) {
      const c = this.cat;
      const t = performance.now() / 1000;
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      const cols = ['#ff6b6b', '#ffd93b', '#6bd36b', '#4db8ff', '#c07bff'];
      for (let i = 0; i < 5; i++) {
        const a = t * 2 + i * (Math.PI * 2 / 5);
        const rx = c.w * 0.75, ry = c.h * 0.7;
        const sx = cx + Math.cos(a) * rx;
        const sy = cy + Math.sin(a * 1.3) * ry;
        const tw = 0.5 + 0.5 * Math.sin(t * 8 + i); // 반짝임 세기
        ctx.globalAlpha = tw;
        ctx.fillStyle = cols[i];
        const s = 1.5 + tw * 2.5;
        ctx.fillRect(sx - s, sy - 0.7, s * 2, 1.4); // 가로
        ctx.fillRect(sx - 0.7, sy - s, 1.4, s * 2); // 세로
      }
      ctx.globalAlpha = 1;
    }

    _drawBackground(ctx) {
      const sky = Sprites.bg.sky;
      if (sky) {
        const off = (((this.bgScroll * 0.15) % sky.width) + sky.width) % sky.width;
        for (let x = -off; x < W; x += sky.width) {
          ctx.drawImage(sky, x, 0, sky.width, GROUND_Y); // 하늘 영역(0..330)에 맞춰 세로 채움
        }
        return;
      }
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#b3e2fb');
      g.addColorStop(1, '#e6f7ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // 겹겹이 굴러가는 언덕 (깊이감 있는 배경)
      ctx.globalAlpha = 0.4;
      this._hills(ctx, this.bgScroll * 0.1, '#d7efb6', 288, 110);
      ctx.globalAlpha = 0.55;
      this._hills(ctx, this.bgScroll * 0.22, '#c2e39c', 306, 78);
      ctx.globalAlpha = 0.7;
      this._hills(ctx, this.bgScroll * 0.36, '#aad57f', 322, 52);
      ctx.globalAlpha = 1;
      this._clouds(ctx);
    }

    _hills(ctx, off, color, baseY, r) {
      ctx.fillStyle = color;
      const step = r * 1.5;
      const start = -(((off % step) + step) % step);
      for (let x = start; x < W + step; x += step) {
        ctx.beginPath();
        ctx.arc(x + step / 2, baseY, r, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillRect(0, baseY, W, H - baseY);
    }

    _clouds(ctx) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const off = this.bgScroll * 0.08;
      const clouds = [[120, 70, 26], [360, 48, 32], [620, 90, 22], [770, 60, 28]];
      clouds.forEach(([cx, cy, r]) => {
        let x = (cx - off) % (W + 140);
        if (x < -140) x += W + 140;
        ctx.beginPath();
        ctx.ellipse(x, cy, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.8, cy + 4, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(x - r * 0.8, cy + 4, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    _drawGround(ctx) {
      const gimg = Sprites.bg.ground;
      if (gimg) {
        const gh = H - GROUND_Y; // 70
        const off = ((this.bgScroll % gimg.width) + gimg.width) % gimg.width;
        for (let x = -off; x < W; x += gimg.width) {
          ctx.drawImage(gimg, x, GROUND_Y, gimg.width, gh);
        }
        return;
      }
      const gy = GROUND_Y;
      ctx.fillStyle = '#b9d492';
      ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = '#a6c47c';
      ctx.fillRect(0, gy, W, 6);
      // 스크롤되는 바닥 무늬 (속도감)
      const off = this.bgScroll % 40;
      ctx.fillStyle = '#93b268';
      for (let x = -off; x < W; x += 40) {
        ctx.fillRect(x, gy + 18, 16, 5);
      }
    }

    _drawAura(ctx) {
      const c = this.cat;
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      const rad = c.w * 0.85;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(performance.now() / 90);
      const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, rad);
      g.addColorStop(0, 'rgba(150,190,165,0.6)');
      g.addColorStop(1, 'rgba(150,190,165,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawParticles(ctx) {
      this.particles.forEach((pt) => {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      });
      ctx.globalAlpha = 1;
    }
  }

  window.Game = Game;
})();

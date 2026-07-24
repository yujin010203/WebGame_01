/* ===== entities.js =====
 * Cat / Obstacle / Piece 클래스. 물리·판정·렌더만 담당.
 * 스폰/충돌/점수 등 규칙은 game.js가 조율.
 */
(function () {
  const SIZE = window.Sprites.SIZE;
  const S = window.Sprites.SCALE * SIZE; // 실제 표시 배율 (축소 반영)
  const CAT_SCALE = 1.2; // 고양이만 추가로 키우는 배율 (표시·판정 동일 적용)
  const GRAVITY = 2600;

  class Cat {
    constructor(groundY) {
      this.w = Sprites.cat.nativeW * S * CAT_SCALE;
      this.h = Sprites.cat.nativeH * S * CAT_SCALE;
      this.x = 70;
      this.groundY = groundY;
      this.reset();
    }
    reset() {
      this.y = this.groundY - this.h;
      this.vy = 0;
      this.jumps = 0;
      this.onGround = true;
      this.iframe = 0;   // 피격 무적(초)
      this.animTime = 0;
      this.frame = 0;
    }
    jump() {
      if (this.jumps < 2) {
        this.vy = this.jumps === 0 ? -880 : -800;
        this.jumps++;
        this.onGround = false;
      }
    }
    update(dt) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y + this.h >= this.groundY) {
        this.y = this.groundY - this.h;
        this.vy = 0;
        this.jumps = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
      if (this.iframe > 0) this.iframe -= dt;
      this.animTime += dt;
      if (this.animTime > 0.09) {
        this.animTime = 0;
        this.frame = (this.frame + 1) % Sprites.cat.run.length;
      }
    }
    hitbox() {
      return {
        x: this.x + 14 * SIZE * CAT_SCALE, y: this.y + 10 * SIZE * CAT_SCALE,
        w: this.w - 30 * SIZE * CAT_SCALE, h: this.h - 16 * SIZE * CAT_SCALE,
      };
    }
    draw(ctx) {
      const img = this.onGround ? Sprites.cat.run[this.frame] : Sprites.cat.jump;
      ctx.drawImage(img, this.x, this.y, this.w, this.h);
    }
  }

  class Obstacle {
    constructor(type, groundY, spawnX) {
      const o = Sprites.obstacles[type];
      this.type = type;
      this.w = o.nativeW * S;
      this.h = o.nativeH * S;
      this.inset = o.inset * S;
      this.x = spawnX;
      this.y = groundY - this.h;
      this.dead = false;
      this.smashed = false; // 무적 상태에서 파괴됨
    }
    update(dt, speed) {
      this.x -= speed * dt;
      if (this.x + this.w < 0) this.dead = true;
    }
    hitbox() {
      return {
        x: this.x + this.inset,
        y: this.y + this.inset * 0.5,
        w: this.w - this.inset * 2,
        h: this.h - this.inset,
      };
    }
    draw(ctx) { ctx.drawImage(Sprites.obstacles[this.type].canvas, this.x, this.y, this.w, this.h); }
  }

  class Piece {
    constructor(type, x, y) {
      this.type = type; // 'red'(팥) | 'cream'(슈크림)
      this.w = Sprites.piece.nativeW * S;
      this.h = Sprites.piece.nativeH * S;
      this.x = x;
      this.baseY = y;
      this.y = y;
      this.t = Math.random() * 6;
      this.dead = false;
    }
    update(dt, speed) {
      this.x -= speed * dt;
      this.t += dt * 4;
      this.y = this.baseY + Math.sin(this.t) * 6;
      if (this.x + this.w < 0) this.dead = true;
    }
    hitbox() {
      return {
        x: this.x + 8 * SIZE, y: this.y + 6 * SIZE,
        w: this.w - 16 * SIZE, h: this.h - 12 * SIZE,
      };
    }
    draw(ctx) { ctx.drawImage(Sprites.piece[this.type], this.x, this.y, this.w, this.h); }
  }

  window.Entities = { Cat, Obstacle, Piece };
})();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimap = document.getElementById('minimap');
const mctx = minimap.getContext('2d');

const overlay = document.getElementById('overlay');
const gameOverEl = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const hpBar = document.getElementById('hpBar');
const shieldBar = document.getElementById('shieldBar');
const hpText = document.getElementById('hpText');
const shieldText = document.getElementById('shieldText');
const aliveBadge = document.getElementById('aliveBadge');
const zoneBadge = document.getElementById('zoneBadge');
const ammoBadge = document.getElementById('ammoBadge');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const resultTag = document.getElementById('resultTag');
const crosshair = document.getElementById('crosshair');

const cfg = {
  worldSize: 2200,
  playerSpeed: 280,
  bulletSpeed: 860,
  bulletLife: 0.8,
  shootCooldown: 0.14,
  enemyCount: 18,
  enemySpeed: 170,
  safeZoneStart: 980,
  safeZoneEnd: 150,
  shrinkDelay: 18,
  shrinkDuration: 150,
  lootCount: 28
};

let state = null;
const keys = {};
let mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function angle(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
function lerp(a, b, t) { return a + (b - a) * t; }

function createObstacle() {
  const type = Math.random() > 0.5 ? 'rock' : 'crate';
  const x = rand(150, cfg.worldSize - 150);
  const y = rand(150, cfg.worldSize - 150);
  const r = type === 'rock' ? rand(26, 42) : rand(34, 48);
  return { type, x, y, r };
}

function createLoot() {
  const kinds = ['ammo', 'medkit', 'shield'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  return {
    x: rand(100, cfg.worldSize - 100),
    y: rand(100, cfg.worldSize - 100),
    kind,
    amount: kind === 'ammo' ? 24 : kind === 'medkit' ? 30 : 25,
    radius: 12,
    pulse: rand(0, Math.PI * 2)
  };
}

function createEnemy(id) {
  return {
    id,
    type: 'enemy',
    x: rand(120, cfg.worldSize - 120),
    y: rand(120, cfg.worldSize - 120),
    radius: 16,
    hp: 100,
    shield: 25,
    ammo: rand(18, 60),
    heading: rand(-Math.PI, Math.PI),
    targetHeading: rand(-Math.PI, Math.PI),
    shootTimer: rand(.2, 1.6),
    thinkTimer: rand(.4, 1.5),
    wanderSpeed: rand(.4, 1),
    color: `hsl(${Math.floor(rand(0, 360))} 70% 60%)`,
    dead: false
  };
}

function resetGame() {
  state = {
    running: false,
    time: 0,
    camera: { x: cfg.worldSize / 2, y: cfg.worldSize / 2 },
    safeZone: {
      x: cfg.worldSize / 2,
      y: cfg.worldSize / 2,
      radius: cfg.safeZoneStart
    },
    bullets: [],
    particles: [],
    obstacles: Array.from({ length: 22 }, createObstacle),
    loot: Array.from({ length: cfg.lootCount }, createLoot),
    enemies: Array.from({ length: cfg.enemyCount }, (_, i) => createEnemy(i + 1)),
    player: {
      x: cfg.worldSize / 2,
      y: cfg.worldSize / 2,
      radius: 18,
      hp: 100,
      shield: 50,
      ammo: 72,
      medkits: 2,
      reloadTimer: 0,
      facing: 0,
      shootTimer: 0,
      dead: false,
      boost: 0,
      kills: 0
    }
  };
  updateHud();
}
resetGame();

function startGame() {
  resetGame();
  state.running = true;
  overlay.classList.add('hidden');
  gameOverEl.classList.add('hidden');
}
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e' && state?.running) useMedkit();
  if (e.key.toLowerCase() === 'r' && state?.running) manualReload();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  crosshair.style.left = e.clientX + 'px';
  crosshair.style.top = e.clientY + 'px';
});
window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);

function worldToScreen(x, y) {
  return {
    x: x - state.camera.x + innerWidth / 2,
    y: y - state.camera.y + innerHeight / 2
  };
}

function screenToWorld(x, y) {
  return {
    x: x + state.camera.x - innerWidth / 2,
    y: y + state.camera.y - innerHeight / 2
  };
}

function manualReload() {
  const p = state.player;
  if (p.reloadTimer <= 0 && p.ammo > 0) {
    p.reloadTimer = 1.2;
  }
}

function useMedkit() {
  const p = state.player;
  if (p.medkits > 0 && p.hp < 100) {
    p.medkits--;
    p.hp = clamp(p.hp + 45, 0, 100);
    spawnBurst(p.x, p.y, '#74ff9e', 14);
  }
}

function fireBullet(owner, targetAngle, speedScale = 1) {
  const isPlayer = owner === state.player;
  if (owner.reloadTimer > 0 || owner.ammo <= 0) return;
  owner.ammo--;
  owner.shootTimer = isPlayer ? cfg.shootCooldown : rand(.45, .8);
  state.bullets.push({
    x: owner.x + Math.cos(targetAngle) * (owner.radius + 7),
    y: owner.y + Math.sin(targetAngle) * (owner.radius + 7),
    vx: Math.cos(targetAngle) * cfg.bulletSpeed * speedScale,
    vy: Math.sin(targetAngle) * cfg.bulletSpeed * speedScale,
    life: cfg.bulletLife,
    owner: isPlayer ? 'player' : 'enemy',
    damage: isPlayer ? 19 : 11
  });
}

function spawnBurst(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(40, 180);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(.2, .6),
      color,
      size: rand(2, 5)
    });
  }
}

function applyDamage(unit, damage) {
  if (unit.shield > 0) {
    const absorb = Math.min(unit.shield, damage * 0.65);
    unit.shield -= absorb;
    damage -= absorb;
  }
  unit.hp -= damage;
}

function killEnemy(enemy) {
  enemy.dead = true;
  state.player.kills++;
  spawnBurst(enemy.x, enemy.y, enemy.color, 18);
  if (Math.random() > 0.5) {
    state.loot.push({ x: enemy.x + rand(-12, 12), y: enemy.y + rand(-12, 12), kind: 'ammo', amount: 18, radius: 12, pulse: 0 });
  }
  if (Math.random() > 0.7) {
    state.loot.push({ x: enemy.x + rand(-8, 8), y: enemy.y + rand(-8, 8), kind: 'medkit', amount: 30, radius: 12, pulse: 0 });
  }
}

function endGame(win) {
  state.running = false;
  gameOverEl.classList.remove('hidden');
  resultTitle.textContent = win ? 'Victory Royale' : 'انتهت الجولة';
  resultTag.textContent = win ? 'أنت البطل' : 'محاولة جديدة';
  resultText.textContent = win
    ? `عدد الإقصاءات: ${state.player.kills} — ممتاز!`
    : `وصلت إلى ${state.player.kills} إقصاء. حاول من جديد.`;
}

function updateHud() {
  const p = state.player;
  hpBar.style.width = `${p.hp}%`;
  shieldBar.style.width = `${Math.max(0, p.shield) * 2}%`;
  hpText.textContent = `${Math.max(0, p.hp).toFixed(0)} / 100`;
  shieldText.textContent = `${Math.max(0, p.shield).toFixed(0)} / 50`;
  const alive = 1 + state.enemies.filter(e => !e.dead).length;
  aliveBadge.textContent = `اللاعبون: ${alive}`;
  ammoBadge.textContent = `الذخيرة: ${Math.floor(p.ammo)} | الإسعاف: ${p.medkits}`;
  zoneBadge.textContent = `المنطقة: ${Math.round((state.safeZone.radius / cfg.safeZoneStart) * 100)}%`;
}

function moveWithCollision(unit, dx, dy, dt) {
  let nx = unit.x + dx * dt;
  let ny = unit.y + dy * dt;

  nx = clamp(nx, 30, cfg.worldSize - 30);
  ny = clamp(ny, 30, cfg.worldSize - 30);

  for (const o of state.obstacles) {
    const d = dist(nx, ny, o.x, o.y);
    const min = unit.radius + o.r;
    if (d < min) {
      const a = angle(o.x, o.y, nx, ny);
      nx = o.x + Math.cos(a) * min;
      ny = o.y + Math.sin(a) * min;
    }
  }

  unit.x = nx;
  unit.y = ny;
}

function updatePlayer(dt) {
  const p = state.player;
  if (p.dead) return;

  let mx = 0, my = 0;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  const len = Math.hypot(mx, my) || 1;
  mx /= len; my /= len;

  const mouseWorld = screenToWorld(mouse.x, mouse.y);
  p.facing = angle(p.x, p.y, mouseWorld.x, mouseWorld.y);
  moveWithCollision(p, mx * cfg.playerSpeed, my * cfg.playerSpeed, dt);

  if (p.reloadTimer > 0) p.reloadTimer -= dt;
  if (p.shootTimer > 0) p.shootTimer -= dt;

  if (mouse.down && p.shootTimer <= 0 && p.reloadTimer <= 0 && p.ammo > 0) {
    fireBullet(p, p.facing, 1);
    spawnBurst(p.x + Math.cos(p.facing) * 16, p.y + Math.sin(p.facing) * 16, '#ffd166', 4);
  }

  if (p.ammo <= 0 && p.reloadTimer <= 0) p.reloadTimer = 1.2;
  if (p.reloadTimer <= 0 && p.ammo < 12) {
    const reserve = 72;
    p.ammo = Math.min(p.ammo + reserve * dt * 0.9, 72);
  }

  for (let i = state.loot.length - 1; i >= 0; i--) {
    const item = state.loot[i];
    if (dist(p.x, p.y, item.x, item.y) < 26) {
      if (item.kind === 'ammo') p.ammo = Math.min(120, p.ammo + item.amount);
      if (item.kind === 'medkit') p.medkits = Math.min(5, p.medkits + 1);
      if (item.kind === 'shield') p.shield = clamp(p.shield + item.amount, 0, 50);
      spawnBurst(item.x, item.y, item.kind === 'ammo' ? '#ffd166' : item.kind === 'medkit' ? '#74ff9e' : '#57c7ff', 10);
      state.loot.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  const p = state.player;
  for (const e of state.enemies) {
    if (e.dead) continue;
    e.shootTimer -= dt;
    e.thinkTimer -= dt;

    const dToPlayer = dist(e.x, e.y, p.x, p.y);
    const seesPlayer = dToPlayer < 520;

    if (e.thinkTimer <= 0) {
      e.thinkTimer = rand(.35, 1.1);
      if (seesPlayer) {
        e.targetHeading = angle(e.x, e.y, p.x, p.y) + rand(-0.22, 0.22);
      } else {
        e.targetHeading = rand(-Math.PI, Math.PI);
      }
    }

    e.heading = lerp(e.heading, e.targetHeading, dt * 2.4);
    const speed = seesPlayer ? cfg.enemySpeed : cfg.enemySpeed * e.wanderSpeed;

    let dx = Math.cos(e.heading) * speed;
    let dy = Math.sin(e.heading) * speed;

    if (seesPlayer && dToPlayer < 180) {
      dx *= -0.5; dy *= -0.5;
    }

    moveWithCollision(e, dx, dy, dt);

    if (seesPlayer && e.shootTimer <= 0 && e.ammo > 0) {
      fireBullet(e, angle(e.x, e.y, p.x, p.y) + rand(-0.12, 0.12), rand(.82, .96));
      spawnBurst(e.x, e.y, '#ff8f8f', 3);
    }

    const zoneD = dist(e.x, e.y, state.safeZone.x, state.safeZone.y);
    if (zoneD > state.safeZone.radius) {
      applyDamage(e, dt * 7);
      if (e.hp <= 0) killEnemy(e);
    }
  }
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    let removed = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > cfg.worldSize || b.y > cfg.worldSize;

    for (const o of state.obstacles) {
      if (!removed && dist(b.x, b.y, o.x, o.y) < o.r + 2) {
        removed = true;
        spawnBurst(b.x, b.y, '#d0d7e6', 5);
      }
    }

    if (b.owner === 'player') {
      for (const e of state.enemies) {
        if (!e.dead && !removed && dist(b.x, b.y, e.x, e.y) < e.radius + 3) {
          applyDamage(e, b.damage);
          removed = true;
          spawnBurst(b.x, b.y, '#ffbf69', 7);
          if (e.hp <= 0) killEnemy(e);
        }
      }
    } else {
      const p = state.player;
      if (!removed && !p.dead && dist(b.x, b.y, p.x, p.y) < p.radius + 4) {
        applyDamage(p, b.damage);
        removed = true;
        spawnBurst(b.x, b.y, '#ff4d6d', 10);
        if (p.hp <= 0) {
          p.dead = true;
          endGame(false);
        }
      }
    }

    if (removed) state.bullets.splice(i, 1);
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

function updateSafeZone(dt) {
  const t = state.time;
  const zone = state.safeZone;
  if (t > cfg.shrinkDelay) {
    const progress = clamp((t - cfg.shrinkDelay) / cfg.shrinkDuration, 0, 1);
    zone.radius = lerp(cfg.safeZoneStart, cfg.safeZoneEnd, progress);
  }

  const p = state.player;
  const d = dist(p.x, p.y, zone.x, zone.y);
  if (d > zone.radius) {
    applyDamage(p, dt * 8.5);
    if (p.hp <= 0 && !p.dead) {
      p.dead = true;
      endGame(false);
    }
  }
}

function renderBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, innerHeight);
  grad.addColorStop(0, '#6ac6ff');
  grad.addColorStop(1, '#1b5a33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const step = 120;
  for (let x = -step; x < innerWidth + step; x += step) {
    for (let y = -step; y < innerHeight + step; y += step) {
      const wx = state.camera.x - innerWidth / 2 + x;
      const wy = state.camera.y - innerHeight / 2 + y;
      const seed = Math.sin(wx * 0.01) + Math.cos(wy * 0.012);
      ctx.fillStyle = seed > 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';
      ctx.fillRect(x, y, step, step);
    }
  }
}

function drawWorldRing() {
  const c = worldToScreen(state.safeZone.x, state.safeZone.y);
  ctx.beginPath();
  ctx.arc(c.x, c.y, state.safeZone.radius, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(77, 231, 255, 0.95)';
  ctx.shadowColor = 'rgba(77, 231, 255, 0.55)';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.rect(0, 0, innerWidth, innerHeight);
  ctx.arc(c.x, c.y, state.safeZone.radius, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(98, 0, 255, 0.10)';
  ctx.fill('evenodd');
}

function drawObstacle(o) {
  const p = worldToScreen(o.x, o.y);
  if (o.type === 'rock') {
    ctx.fillStyle = '#8590a2';
    ctx.beginPath();
    ctx.arc(p.x, p.y, o.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath();
    ctx.arc(p.x - o.r * .2, p.y - o.r * .15, o.r * .42, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#7c522a';
    ctx.fillRect(p.x - o.r, p.y - o.r, o.r * 2, o.r * 2);
    ctx.strokeStyle = '#b38755';
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x - o.r, p.y - o.r, o.r * 2, o.r * 2);
  }
}

function drawLoot(item) {
  const p = worldToScreen(item.x, item.y);
  item.pulse += 0.08;
  const pulse = Math.sin(item.pulse) * 2;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = item.kind === 'ammo' ? '#ffd166' : item.kind === 'medkit' ? '#74ff9e' : '#57c7ff';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, item.radius + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#102036';
  if (item.kind === 'ammo') {
    ctx.fillRect(-3, -8, 6, 16);
  } else if (item.kind === 'medkit') {
    ctx.fillRect(-8, -3, 16, 6);
    ctx.fillRect(-3, -8, 6, 16);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawUnit(u, isPlayer = false) {
  const p = worldToScreen(u.x, u.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(isPlayer ? state.player.facing : u.heading);

  ctx.fillStyle = isPlayer ? '#ffb703' : u.color;
  ctx.beginPath();
  ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#202b3d';
  ctx.fillRect(4, -4, u.radius + 12, 8);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(5, -5, 3, 0, Math.PI * 2);
  ctx.arc(5, 5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const w = 36;
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(p.x - w / 2, p.y - u.radius - 18, w, 6);
  ctx.fillStyle = isPlayer ? '#7CFC00' : '#ff7070';
  ctx.fillRect(p.x - w / 2, p.y - u.radius - 18, w * clamp(u.hp / 100, 0, 1), 6);
}

function drawBullets() {
  for (const b of state.bullets) {
    const p = worldToScreen(b.x, b.y);
    ctx.fillStyle = b.owner === 'player' ? '#ffd166' : '#ff8f8f';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const s = worldToScreen(p.x, p.y);
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMinimap() {
  mctx.clearRect(0, 0, minimap.width, minimap.height);
  mctx.fillStyle = '#102036';
  mctx.fillRect(0, 0, minimap.width, minimap.height);
  const scale = minimap.width / cfg.worldSize;

  mctx.strokeStyle = 'rgba(255,255,255,.08)';
  mctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const pos = i * minimap.width / 4;
    mctx.beginPath();
    mctx.moveTo(pos, 0); mctx.lineTo(pos, minimap.height); mctx.stroke();
    mctx.beginPath();
    mctx.moveTo(0, pos); mctx.lineTo(minimap.width, pos); mctx.stroke();
  }

  mctx.beginPath();
  mctx.arc(state.safeZone.x * scale, state.safeZone.y * scale, state.safeZone.radius * scale, 0, Math.PI * 2);
  mctx.strokeStyle = '#4de7ff';
  mctx.lineWidth = 2;
  mctx.stroke();

  for (const e of state.enemies) {
    if (e.dead) continue;
    mctx.fillStyle = '#ff647b';
    mctx.fillRect(e.x * scale - 2, e.y * scale - 2, 4, 4);
  }

  for (const item of state.loot.slice(0, 10)) {
    mctx.fillStyle = item.kind === 'ammo' ? '#ffd166' : item.kind === 'medkit' ? '#74ff9e' : '#57c7ff';
    mctx.fillRect(item.x * scale - 1, item.y * scale - 1, 2, 2);
  }

  const p = state.player;
  mctx.fillStyle = '#ffffff';
  mctx.beginPath();
  mctx.arc(p.x * scale, p.y * scale, 4, 0, Math.PI * 2);
  mctx.fill();
}

function render() {
  renderBackground();
  drawWorldRing();

  state.obstacles.forEach(drawObstacle);
  state.loot.forEach(drawLoot);
  state.enemies.filter(e => !e.dead).forEach(e => drawUnit(e, false));
  drawUnit(state.player, true);
  drawBullets();
  drawParticles();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 15px Tahoma';
  ctx.fillText(`إقصاءات: ${state.player.kills}`, 22, 120);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;

  if (state?.running) {
    state.time += dt;
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateSafeZone(dt);

    state.camera.x = lerp(state.camera.x, state.player.x, dt * 7);
    state.camera.y = lerp(state.camera.y, state.player.y, dt * 7);

    const aliveEnemies = state.enemies.filter(e => !e.dead).length;
    if (aliveEnemies === 0 && !state.player.dead) {
      endGame(true);
    }

    updateHud();
  }

  render();
  drawMinimap();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

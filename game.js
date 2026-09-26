/* =========================================================
 *  김밴던을 찾아라 — HTML5 + Vanilla JS 모바일 웹 게임
 *  Scene0(타이틀) → Scene1(숨은그림찾기) → Scene2(러너)
 *  → Scene3(컷씬) → Scene4(프로포즈) → Scene4-1(선물) → Scene5(엔딩)
 * ========================================================= */
'use strict';

/* ---------- 텍스트 (여기서 문구를 한 번에 수정할 수 있어요) ---------- */
const TEXT = {
  title: '김밴던을 찾아라',
  titleSub: '김엉덩슨 어딧누',
  help0: '은비가 사랑하는 고냥니 김밴던이 집을 나갔어요! 어떡하죠 은비가 너무 슬퍼해요. 밴던이를 찾지 못하면 평생 결혼은 안할거래! 숨은 밴던이 열마리를 모두 찾아 은비에게 프로포즈 하세요!',
  wrong: '웩슨!! 거기 아니에옹!!',
  found: '밴던이를 찾았습니다! 어서 은비에게 전해주세요!',
  runTitle: '은비에게 달려가자!',
  help2: '밴던이를 안고 장애물을 잘 피해 달려보아요!',
  dead: '웅억 여부 죽었어요 ㅠ',
  arrive: '도착!! 은비다!!',
  propose: '은비에게 프로포즈 하겠습니까?',
  no: '퉤! 다시 생각해보세요!',
  gift: '은비에게 무엇을 바치며 프로포즈 하시겠습니까?',
  ending: '축하합니다!! 은비가 당신의 프로포즈를 받아들였습니다!',
};

/* ---------- 에셋 ---------- */
const ASSET = {
  title: 'assets/title.jpg',
  village: 'assets/village.jpg',
  catPhoto: 'assets/cat-photo.png',
  cuts: ['assets/1.png', 'assets/2.png', 'assets/3.png'],
  wedding: 'assets/ending-wedding.png',
  weddingCat: 'assets/ending-cat.png',
  runner: 'assets/runner.png', // 선택: 있으면 러너 캐릭터로 사용, 없으면 캔버스로 직접 그림
};

/* 숨은 밴던이 히트박스 (village.jpg 기준 % 좌표) — 이 중 아무 곳이나 FIND_GOAL 마리 찾으면 클리어 */
const CAT_SPOTS = [
  { x: 14.9, y: 9.9 },
  { x: 12.3, y: 24.6 },
  { x: 37.0, y: 34.6 },
  { x: 8.5, y: 44.9 },
  { x: 87.8, y: 34.8 },
  { x: 89.4, y: 42.0 },
  { x: 48.1, y: 48.9 },
  { x: 60.8, y: 49.0 },
  { x: 13.8, y: 57.7 },
  { x: 76.5, y: 60.2 },
  { x: 88.3, y: 71.8 },
  { x: 7.6, y: 79.6 },
  { x: 68.7, y: 85.8 },
  { x: 13.1, y: 89.7 },
];
const FIND_GOAL = 10;

/* ---------- 전역 상태 ---------- */
let currentScene = 0;
const game = document.getElementById('game');
let timers = [];
let rafId = 0;
let cleanups = [];

function later(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function resetSceneResources() {
  timers.forEach(clearTimeout);
  timers = [];
  cancelAnimationFrame(rafId);
  rafId = 0;
  cleanups.forEach((fn) => fn());
  cleanups = [];
}

/* ---------- DOM 헬퍼 ---------- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function button(label, cls, onTap) {
  const b = el('button', 'btn ' + (cls || ''), label);
  b.type = 'button';
  b.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onTap(ev);
  });
  return b;
}

/** 이미지를 감싼 상자를 만든다. 로드 실패 시 대체 콘텐츠(도형/이모지)로 교체 */
function imageBox(src, cls, fallbackHtml, fallbackCls, onFail) {
  const box = el('div', 'imgbox ' + (cls || ''));
  const img = new Image();
  img.alt = '';
  img.draggable = false;
  img.onerror = () => {
    box.innerHTML = '';
    box.appendChild(el('div', 'fallback ' + (fallbackCls || ''), fallbackHtml));
    if (onFail) onFail();
  };
  img.src = src;
  box.appendChild(img);
  return box;
}

function toast(text, ms = 1200) {
  const old = game.querySelector('.toast');
  if (old) old.remove();
  const t = el('div', 'toast', text);
  game.appendChild(t);
  setTimeout(() => t.classList.add('out'), ms - 250);
  setTimeout(() => t.remove(), ms);
}

function modal(title, text) {
  const back = el('div', 'modal-back');
  const box = el('div', 'modal');
  box.appendChild(el('h2', '', title));
  box.appendChild(el('p', '', text));
  box.appendChild(button('닫기', 'lav small', () => back.remove()));
  back.appendChild(box);
  back.addEventListener('click', (ev) => {
    if (ev.target === back) back.remove();
  });
  game.appendChild(back);
}

function preload(srcs) {
  srcs.forEach((s) => {
    const i = new Image();
    i.src = s;
  });
}

/* ---------- 씬 전환 ---------- */
const scenes = {
  0: renderScene0,
  1: renderScene1,
  2: renderScene2,
  3: renderScene3,
  4: renderScene4,
  '4-1': renderScene4_1,
  5: renderScene5,
};

function goTo(scene) {
  resetSceneResources();
  currentScene = scene;
  game.innerHTML = '';
  scenes[scene]();
}

/* =========================================================
 *  Scene0 — 타이틀
 * ========================================================= */
function renderScene0() {
  const s = el('section', 'scene title-scene');
  s.appendChild(
    imageBox(ASSET.title, 'bg', '<div class="row">🏡🌸</div><div class="row">🐈‍⬛💗</div>', 'title-fallback')
  );
  s.appendChild(titleDeco());

  const card = el('div', 'title-card');
  card.appendChild(el('span', 'card-bow left', '🎀'));
  card.appendChild(el('span', 'card-bow right', '🎀'));
  card.appendChild(el('div', 'sub', `💕 ${TEXT.titleSub} 💕`));
  card.appendChild(el('h1', '', TEXT.title));
  card.appendChild(el('div', 'garland', '🍓🌼🍒🌼🍓'));
  s.appendChild(card);

  const col = el('div', 'btn-col');
  col.appendChild(button('🌼 게임 설명 🌼', 'lav', () => modal('게임 설명', TEXT.help0)));
  col.appendChild(button('🍓 게임 시작 🍓', '', () => goTo(1)));
  s.appendChild(col);
  game.appendChild(s);
  preload([ASSET.village, ASSET.catPhoto]);
}

/** 타이틀 화면 가장자리에 흩뿌리는 이모지 장식 (가운데 고양이 얼굴은 비워 둠) */
function titleDeco() {
  const items = [
    // [x%, y%, 크기(em), 이모지]
    [30, 2.5, 1.3, '🌼'], [50, 2, 1.1, '🍒'], [68, 2.5, 1.3, '💕'],
    [5, 29, 1.8, '🍓'], [89, 27, 1.7, '🌼'], [9, 40, 1.4, '💕'], [86, 39, 1.9, '🎀'],
    [4, 52, 1.7, '🌼'], [90, 51, 1.6, '🍓'], [11, 64, 2, '🍒'], [85, 63, 1.5, '💕'],
    [30, 41, 1.1, '💕'], [66, 42, 1.1, '✨'],
    [5, 78, 1.5, '💕'], [90, 77, 1.8, '🌼'],
    [12, 94, 1.5, '🍒'], [34, 95.5, 1.2, '🌼'], [52, 94.5, 1.4, '💕'], [70, 95.5, 1.2, '🍓'], [88, 94, 1.6, '🎀'],
  ];
  const layer = el('div', 'title-deco');
  items.forEach(([x, y, size, emoji], i) => {
    const d = el('span', 'deco-item', emoji);
    d.style.left = x + '%';
    d.style.top = y + '%';
    d.style.fontSize = size + 'em';
    d.style.animationDelay = (i * 0.37 % 2.4).toFixed(2) + 's';
    layer.appendChild(d);
  });
  return layer;
}

/* =========================================================
 *  Scene1 — 숨은그림찾기
 * ========================================================= */
function renderScene1() {
  const total = FIND_GOAL;
  let found = 0;
  let cleared = false;

  const s = el('section', 'scene find-scene');
  const hud = el('div', 'hud left', `찾은 고양이: <b>0</b> / ${total}`);
  const village = el('div', 'village');
  village.appendChild(
    imageBox(
      ASSET.village,
      '',
      '🏘️🌳🏠<br>🌸🏡🌷<small>(마을 그림이 없어서 밴던이가 살짝 보여요!)</small>',
      'village-fallback',
      () => s.classList.add('no-image')
    )
  );

  CAT_SPOTS.forEach((p) => {
    const h = el('button', 'hit');
    h.type = 'button';
    h.setAttribute('aria-label', '숨은 밴던이');
    h.style.left = p.x + '%';
    h.style.top = p.y + '%';
    h.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (cleared || h.classList.contains('found')) return;
      h.classList.add('found');
      found += 1;
      hud.querySelector('b').textContent = found;
      if (found >= total) {
        cleared = true;
        later(showClear, 450);
      }
    });
    village.appendChild(h);
  });

  s.addEventListener('click', () => {
    if (!cleared) toast(TEXT.wrong, 1200);
  });

  s.appendChild(village);
  s.appendChild(hud);
  game.appendChild(s);
  preload(ASSET.cuts);

  function showClear() {
    const layer = el('div', 'clear-layer');
    layer.appendChild(el('div', 'good', 'GOOD!'));
    layer.appendChild(imageBox(ASSET.catPhoto, 'cat-photo', '🐈‍⬛'));
    const hint = el('div', 'tap-hint', '화면을 터치하세요 ✨');
    hint.style.visibility = 'hidden';
    layer.appendChild(hint);
    s.appendChild(layer);

    let step = 0; // 0: 애니메이션 중, 1: 사진 도착, 2: 메시지 표시
    later(() => {
      step = 1;
      hint.style.visibility = 'visible';
    }, 1500);

    layer.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (step === 1) {
        step = 2;
        hint.remove();
        layer.appendChild(el('div', 'bubble', TEXT.found));
        const h2 = el('div', 'tap-hint', '터치해서 은비에게 가기 ▶');
        layer.appendChild(h2);
      } else if (step === 2) {
        goTo(2);
      }
    });
  }
}

/* =========================================================
 *  Scene2 — 러너 (대기화면 → 본게임)
 * ========================================================= */
function renderScene2() {
  const s = el('section', 'scene title-scene run-scene');
  s.appendChild(el('div', 'bg', '<div class="fallback run-wait-bg">🌷🏃‍♂️🐈‍⬛💨</div>'));

  const card = el('div', 'title-card');
  card.appendChild(el('div', 'sub', 'STAGE 2'));
  card.appendChild(el('h1', '', TEXT.runTitle));
  s.appendChild(card);

  const col = el('div', 'btn-col');
  col.appendChild(button('게임 설명', 'lav', () => modal('게임 설명', TEXT.help2)));
  col.appendChild(button('게임 시작', 'mint', () => startRunner()));
  s.appendChild(col);
  game.appendChild(s);
}

/* ---- 러너 캐릭터 이미지 (선택) ---- */
const runnerImg = new Image();
let runnerImgOk = false;
runnerImg.onload = () => { runnerImgOk = true; };
runnerImg.onerror = () => { runnerImgOk = false; };
runnerImg.src = ASSET.runner;

function startRunner() {
  resetSceneResources();
  game.innerHTML = '';

  const s = el('section', 'scene run-scene');
  const canvas = el('canvas');
  const hud = el('div', 'hud right', '은비에게 남은거리: <b>1KM</b>');
  const guide = el('div', 'tap-guide', '화면을 터치하면 점프! 🐾');
  s.appendChild(canvas);
  s.appendChild(hud);
  s.appendChild(guide);
  game.appendChild(s);
  later(() => guide.remove(), 3000);

  const ctx = canvas.getContext('2d');
  const RATIO = 16 / 9;          // 세계 좌표: 가로 1, 세로 16/9
  const GROUND = RATIO * 0.78;   // 땅 높이(y)
  const TOTAL_TIME = 50;         // 1KM → 0KM 까지 걸리는 시간(초)
  const GRAVITY = 5.2;
  const JUMP_V = 1.95;

  let W = 0;
  let dpr = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = r.width;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }
  resize();
  window.addEventListener('resize', resize);
  cleanups.push(() => window.removeEventListener('resize', resize));

  const player = { x: 0.14, y: GROUND, vy: 0, w: 0.2, h: 0.27, onGround: true };
  let obstacles = [];
  let nextSpawn = 1.6;
  let elapsed = 0;
  let scroll = 0;
  let state = 'run'; // run | dead | finish | done
  let finishX = null;
  let last = performance.now();

  const clouds = Array.from({ length: 5 }, (_, i) => ({
    x: i * 0.28 + Math.random() * 0.1,
    y: 0.12 + Math.random() * 0.45,
    s: 0.7 + Math.random() * 0.6,
  }));

  function jump(ev) {
    if (ev) ev.preventDefault();
    if (state !== 'run') return;
    if (player.onGround) {
      player.vy = -JUMP_V;
      player.onGround = false;
    }
  }
  s.addEventListener('pointerdown', jump);

  function speed() {
    return 0.62 + 0.18 * Math.min(elapsed / TOTAL_TIME, 1);
  }

  function spawn() {
    const types = ['rock', 'pot', 'fence'];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = {
      rock: { w: 0.13, h: 0.09 },
      pot: { w: 0.1, h: 0.13 },
      fence: { w: 0.14, h: 0.12 },
    }[type];
    obstacles.push({ type, x: 1.05, w: size.w, h: size.h });
  }

  function hitTest(o) {
    // 사각형(AABB) 충돌 — 억울하지 않게 캐릭터 박스를 살짝 줄임
    const px = player.x + player.w * 0.2;
    const pw = player.w * 0.6;
    const py = player.y - player.h * 0.9;
    const ph = player.h * 0.85;
    const ox = o.x + o.w * 0.08;
    const ow = o.w * 0.84;
    const oy = GROUND - o.h;
    const oh = o.h;
    return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
  }

  function update(dt) {
    if (state === 'dead' || state === 'done') return;
    const v = speed();
    scroll += v * dt;

    // 플레이어 물리 (포물선 점프)
    if (!player.onGround) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y >= GROUND) {
        player.y = GROUND;
        player.vy = 0;
        player.onGround = true;
      }
    }

    clouds.forEach((c) => {
      c.x -= v * 0.08 * dt;
      if (c.x < -0.3) c.x = 1.1 + Math.random() * 0.2;
    });

    obstacles.forEach((o) => { o.x -= v * dt; });
    obstacles = obstacles.filter((o) => o.x + o.w > -0.1);

    if (state === 'run') {
      elapsed += dt;
      const remain = Math.max(0, 1 - elapsed / TOTAL_TIME);
      hud.querySelector('b').textContent = remain <= 0 ? '0KM' : remain.toFixed(2) + 'KM';

      // 1.5 ~ 2초 간격 장애물 (결승 직전 2.5초는 쉬어가기)
      nextSpawn -= dt;
      if (nextSpawn <= 0 && elapsed < TOTAL_TIME - 2.5) {
        spawn();
        nextSpawn = 1.5 + Math.random() * 0.5;
      }

      for (const o of obstacles) {
        if (hitTest(o)) {
          die();
          return;
        }
      }

      if (remain <= 0) {
        state = 'finish';
        finishX = 1.05;
      }
    } else if (state === 'finish') {
      finishX -= v * dt;
      for (const o of obstacles) if (hitTest(o)) o.x = -1; // 결승 구간에선 무적
      if (finishX <= player.x + player.w * 0.6) {
        state = 'done';
        s.appendChild(el('div', 'big-msg', '🏁 ' + TEXT.arrive));
        later(() => goTo(3), 1600);
      }
    }
  }

  function die() {
    state = 'dead';
    s.appendChild(el('div', 'big-msg', TEXT.dead));
    later(() => goTo(2), 1700); // 대기화면으로 (거리 리셋)
  }

  /* ---- 그리기 ---- */
  function draw() {
    const k = W * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);

    // 하늘
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#a9d8ff');
    sky.addColorStop(0.7, '#ffd9ea');
    sky.addColorStop(1, '#fff0d9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1, RATIO);

    // 구름
    ctx.fillStyle = '#ffffff';
    clouds.forEach((c) => {
      const r = 0.045 * c.s;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.arc(c.x + r * 1.1, c.y - r * 0.4, r * 1.2, 0, Math.PI * 2);
      ctx.arc(c.x + r * 2.3, c.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(c.x, c.y - r * 0.2, r * 2.3, r * 1.2 - r * 0.2);
    });

    // 먼 언덕 (패럴랙스)
    drawHills(scroll * 0.15, GROUND - 0.2, 0.18, '#cdb8ef', 0.9);
    drawHills(scroll * 0.35, GROUND - 0.1, 0.12, '#a9e2c6', 0.6);

    // 땅
    ctx.fillStyle = '#9fdcae';
    ctx.fillRect(0, GROUND, 1, RATIO - GROUND);
    ctx.fillStyle = '#f5e2c4';
    ctx.fillRect(0, GROUND + 0.02, 1, 0.07);
    ctx.fillStyle = '#e8cfa8';
    const off = scroll % 0.12;
    for (let x = -off; x < 1.1; x += 0.12) ctx.fillRect(x, GROUND + 0.05, 0.05, 0.012);
    // 꽃
    const foff = scroll % 0.2;
    for (let x = -foff, i = 0; x < 1.2; x += 0.2, i++) {
      const fy = GROUND + 0.14 + ((i + Math.floor(scroll / 0.2)) % 3) * 0.05;
      flower(x + 0.05, fy, i % 2 ? '#ffb8d1' : '#fff3a6');
    }

    // 결승선
    if (finishX !== null) drawFinish(finishX);

    obstacles.forEach(drawObstacle);
    drawPlayer();
  }

  function drawHills(offset, baseY, amp, color, freq) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    for (let x = 0; x <= 1.01; x += 0.02) {
      const y = baseY + Math.sin((x + offset) * Math.PI * 2 * freq) * amp * 0.35 + amp * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1, GROUND);
    ctx.closePath();
    ctx.fill();
  }

  function flower(x, y, c) {
    ctx.fillStyle = c;
    for (let a = 0; a < 5; a++) {
      const t = (a / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(t) * 0.012, y + Math.sin(t) * 0.012, 0.009, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd36e';
    ctx.beginPath();
    ctx.arc(x, y, 0.007, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawObstacle(o) {
    const top = GROUND - o.h;
    ctx.lineWidth = 0.006;
    ctx.strokeStyle = '#6b4a72';
    if (o.type === 'rock') {
      ctx.fillStyle = '#b9b3c9';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, GROUND - o.h / 2, o.w / 2, o.h / 2, 0, Math.PI, 0);
      ctx.lineTo(o.x + o.w, GROUND);
      ctx.lineTo(o.x, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d8d3e6';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w * 0.35, top + o.h * 0.35, o.w * 0.12, o.h * 0.1, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === 'pot') {
      ctx.fillStyle = '#7fcf8f';
      ctx.beginPath();
      ctx.arc(o.x + o.w * 0.5, top + o.h * 0.25, o.w * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      flower(o.x + o.w * 0.5, top + o.h * 0.2, '#ff9cc4');
      ctx.fillStyle = '#e99a6d';
      ctx.beginPath();
      ctx.moveTo(o.x, top + o.h * 0.45);
      ctx.lineTo(o.x + o.w, top + o.h * 0.45);
      ctx.lineTo(o.x + o.w * 0.85, GROUND);
      ctx.lineTo(o.x + o.w * 0.15, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#d9a877';
      for (let i = 0; i < 3; i++) {
        const px = o.x + i * (o.w * 0.4);
        roundRect(px, top, o.w * 0.2, o.h, 0.01);
        ctx.fill();
        ctx.stroke();
      }
      roundRect(o.x - 0.005, top + o.h * 0.25, o.w + 0.01, o.h * 0.18, 0.006);
      ctx.fill();
      ctx.stroke();
      roundRect(o.x - 0.005, top + o.h * 0.6, o.w + 0.01, o.h * 0.18, 0.006);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawFinish(x) {
    const top = GROUND - 0.45;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, top, 0.012, 0.45);
    ctx.fillRect(x + 0.2, top, 0.012, 0.45);
    const cs = 0.025;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 ? '#6b4a72' : '#fff';
        ctx.fillRect(x + c * cs, top + r * cs, cs, cs);
      }
    }
    // 은비 (결승선 너머에서 기다림)
    const gx = x + 0.3;
    ctx.fillStyle = '#7b5a3e';
    roundRect(gx - 0.05, GROUND - 0.27, 0.1, 0.17, 0.04);
    ctx.fill();
    ctx.fillStyle = '#b8c3f0';
    roundRect(gx - 0.045, GROUND - 0.16, 0.09, 0.1, 0.02);
    ctx.fill();
    ctx.fillStyle = '#7f9bd6';
    ctx.fillRect(gx - 0.04, GROUND - 0.07, 0.035, 0.07);
    ctx.fillRect(gx + 0.005, GROUND - 0.07, 0.035, 0.07);
    ctx.fillStyle = '#ffe1cc';
    ctx.beginPath();
    ctx.arc(gx, GROUND - 0.22, 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7b5a3e';
    ctx.beginPath();
    ctx.arc(gx - 0.04, GROUND - 0.27, 0.018, 0, Math.PI * 2);
    ctx.arc(gx + 0.04, GROUND - 0.27, 0.018, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer() {
    const { x, y, w, h } = player;
    if (runnerImgOk) {
      ctx.drawImage(runnerImg, x, y - h, w, h);
      return;
    }
    const cx = x + w / 2;
    const t = scroll * 18;
    const legSwing = player.onGround && state !== 'dead' ? Math.sin(t) * 0.02 : 0.012;

    ctx.lineWidth = 0.005;
    ctx.strokeStyle = '#3a2a3e';

    // 그림자
    ctx.fillStyle = 'rgba(80,60,90,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, GROUND + 0.005, w * 0.35, 0.012, 0, 0, Math.PI * 2);
    ctx.fill();

    // 다리 (검은 카고바지) + 신발
    ctx.fillStyle = '#2f2a33';
    roundRect(cx - 0.045 + legSwing, y - h * 0.34, 0.04, h * 0.3, 0.012);
    ctx.fill();
    roundRect(cx + 0.005 - legSwing, y - h * 0.34, 0.04, h * 0.3, 0.012);
    ctx.fill();
    ctx.fillStyle = '#fff';
    roundRect(cx - 0.05 + legSwing, y - h * 0.06, 0.055, h * 0.07, 0.01);
    ctx.fill();
    ctx.stroke();
    roundRect(cx - legSwing, y - h * 0.06, 0.055, h * 0.07, 0.01);
    ctx.fill();
    ctx.stroke();

    // 몸통 (검은 자켓 + 흰 티)
    ctx.fillStyle = '#34303a';
    roundRect(cx - 0.06, y - h * 0.66, 0.12, h * 0.36, 0.03);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 0.018, y - h * 0.64, 0.036, h * 0.3);

    // 안고 있는 밴던이
    const catX = cx + 0.035;
    const catY = y - h * 0.5;
    ctx.fillStyle = '#1d1a20';
    ctx.beginPath();
    ctx.ellipse(catX, catY, 0.045, 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(catX + 0.03, catY - 0.035, 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(catX + 0.006, catY - 0.05);
    ctx.lineTo(catX + 0.012, catY - 0.08);
    ctx.lineTo(catX + 0.028, catY - 0.06);
    ctx.moveTo(catX + 0.035, catY - 0.062);
    ctx.lineTo(catX + 0.052, catY - 0.08);
    ctx.lineTo(catX + 0.058, catY - 0.048);
    ctx.fill();
    ctx.fillStyle = '#f7e27a';
    ctx.beginPath();
    ctx.arc(catX + 0.02, catY - 0.037, 0.0065, 0, Math.PI * 2);
    ctx.arc(catX + 0.042, catY - 0.037, 0.0065, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d1a20';
    ctx.lineWidth = 0.008;
    ctx.beginPath(); // 꼬리
    ctx.moveTo(catX - 0.04, catY + 0.01);
    ctx.quadraticCurveTo(catX - 0.08, catY - 0.02 + Math.sin(t * 0.5) * 0.01, catX - 0.06, catY - 0.05);
    ctx.stroke();

    // 팔 (고양이를 감싸 안음)
    ctx.fillStyle = '#34303a';
    roundRect(cx - 0.02, catY + 0.005, 0.1, 0.03, 0.014);
    ctx.fill();

    // 머리
    const hy = y - h * 0.8;
    ctx.fillStyle = '#ffe1cc';
    ctx.beginPath();
    ctx.arc(cx, hy, 0.055, 0, Math.PI * 2);
    ctx.fill();
    // 곰돌이 귀 머리띠
    ctx.fillStyle = '#f0dcc2';
    ctx.beginPath();
    ctx.arc(cx - 0.045, hy - 0.05, 0.02, 0, Math.PI * 2);
    ctx.arc(cx + 0.045, hy - 0.05, 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7b8c8';
    ctx.beginPath();
    ctx.arc(cx - 0.045, hy - 0.05, 0.009, 0, Math.PI * 2);
    ctx.arc(cx + 0.045, hy - 0.05, 0.009, 0, Math.PI * 2);
    ctx.fill();
    // 머리카락
    ctx.fillStyle = '#1f1b24';
    ctx.beginPath();
    ctx.arc(cx, hy - 0.008, 0.057, Math.PI * 1.02, Math.PI * 1.98);
    ctx.quadraticCurveTo(cx + 0.02, hy - 0.03, cx - 0.056, hy - 0.004);
    ctx.fill();
    // 안경
    ctx.strokeStyle = '#1f1b24';
    ctx.lineWidth = 0.004;
    ctx.beginPath();
    ctx.arc(cx - 0.018, hy + 0.008, 0.014, 0, Math.PI * 2);
    ctx.moveTo(cx + 0.032, hy + 0.008);
    ctx.arc(cx + 0.018, hy + 0.008, 0.014, 0, Math.PI * 2);
    ctx.moveTo(cx - 0.004, hy + 0.008);
    ctx.lineTo(cx + 0.004, hy + 0.008);
    ctx.stroke();
    ctx.fillStyle = '#1f1b24';
    ctx.beginPath();
    ctx.arc(cx - 0.018, hy + 0.009, 0.004, 0, Math.PI * 2);
    ctx.arc(cx + 0.018, hy + 0.009, 0.004, 0, Math.PI * 2);
    ctx.fill();
    // 볼터치
    ctx.fillStyle = 'rgba(255,150,170,0.5)';
    ctx.beginPath();
    ctx.arc(cx - 0.033, hy + 0.028, 0.008, 0, Math.PI * 2);
    ctx.arc(cx + 0.033, hy + 0.028, 0.008, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  // 탭이 백그라운드로 가면 시간 점프 방지
  const onVis = () => { last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVis));
}

/* =========================================================
 *  Scene3 — 컷씬 3장 (정적 일러스트, 터치마다 교체)
 * ========================================================= */
function renderScene3() {
  const fallbacks = [
    '🧍‍♀️ 🧍‍♂️🐈‍⬛<p>밴던이를 안고 은비 앞에 도착했어요</p>',
    '🧍‍♀️🤲🐈‍⬛🧍‍♂️<p>밴던이를 은비에게 건네요</p>',
    '🥰🐈‍⬛ 😊<p>은비가 밴던이를 꼭 안고 기뻐해요!</p>',
  ];
  let idx = 0;
  const s = el('section', 'scene cut-scene');
  const dots = el('div', 'cut-dots', '<i></i><i></i><i></i>');
  const hint = el('div', 'tap-hint', '터치해서 계속 ▶');

  function show() {
    const old = s.querySelector('.imgbox');
    const box = imageBox(ASSET.cuts[idx], 'enter', fallbacks[idx], 'cut-fallback');
    if (old) old.replaceWith(box);
    else s.prepend(box);
    dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i <= idx));
  }

  s.appendChild(dots);
  s.appendChild(hint);
  s.addEventListener('click', () => {
    if (idx < ASSET.cuts.length - 1) {
      idx += 1;
      show();
    } else {
      goTo(4);
    }
  });
  game.appendChild(s);
  show();
  preload([ASSET.wedding, ASSET.weddingCat]);
}

/* =========================================================
 *  Scene4 — 프로포즈 선택 / Scene4-1 — 선물 선택
 * ========================================================= */
function floaties(s, chars) {
  for (let i = 0; i < 8; i++) {
    const f = el('div', 'floaty', chars[i % chars.length]);
    f.style.left = Math.random() * 90 + '%';
    f.style.bottom = '-10%';
    f.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
    f.style.animationDuration = (5 + Math.random() * 4).toFixed(2) + 's';
    s.appendChild(f);
  }
}

function renderScene4() {
  const s = el('section', 'scene propose-scene');
  floaties(s, ['💗', '🌸', '✨']);
  s.appendChild(el('div', 'deco', '💌'));
  s.appendChild(el('div', 'question', TEXT.propose));
  const row = el('div', 'btn-row');
  let busy = false;
  row.appendChild(button('예', '', () => { if (!busy) goTo('4-1'); }));
  row.appendChild(
    button('아니오', 'lav', () => {
      if (busy) return;
      busy = true;
      toast(TEXT.no, 1500);
      later(() => goTo(4), 1500); // 같은 화면으로 복귀 (무한 루프)
    })
  );
  s.appendChild(row);
  game.appendChild(s);
}

function renderScene4_1() {
  const s = el('section', 'scene propose-scene');
  floaties(s, ['💍', '💗', '🎁']);
  s.appendChild(el('div', 'deco', '🎁'));
  s.appendChild(el('div', 'question', TEXT.gift));
  const row = el('div', 'btn-row');
  row.appendChild(button('💍 반지', 'butter', () => goTo(5)));
  row.appendChild(button('🍬 왁뿌', 'mint', () => goTo(5)));
  s.appendChild(row);
  game.appendChild(s);
}

/* =========================================================
 *  Scene5 — 엔딩
 * ========================================================= */
function renderScene5() {
  const s = el('section', 'scene ending-scene propose-scene');
  floaties(s, ['💗', '💐', '✨', '🐈‍⬛']);
  s.appendChild(el('div', 'question', TEXT.ending));
  const photos = el('div', 'wedding-photos');
  const pic = imageBox(
    ASSET.wedding,
    'wedding main',
    '👰‍♀️🤵‍♂️<p>은비 ♥ 그리고 당신</p>'
  );
  const catPic = imageBox(ASSET.weddingCat, 'wedding cat', '🐈‍⬛💍');
  photos.appendChild(pic);
  photos.appendChild(catPic);
  s.appendChild(photos);
  const again = button('다시 플레이', '', () => goTo(0));
  s.appendChild(again);
  s.appendChild(el('div', 'fin', 'THE END'));
  game.appendChild(s);

  later(() => pic.classList.add('show'), 900);
  later(() => catPic.classList.add('show'), 1600);
  later(() => again.classList.add('show'), 2500);
}

/* ---------- 시작 ---------- */
document.addEventListener('contextmenu', (e) => e.preventDefault());
goTo(0);

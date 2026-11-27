/* =========================================================
   The little engine that walks two people along a pink meadow.
   ========================================================= */
(function () {
  "use strict";

  const LA = window.LoveArt;
  const CFG = window.LOVE_CONFIG;
  const L = LA.LAYOUT;
  const COUPLE_ASSET = "assets/main.webp";
  const COUPLE_IMAGE_W = 246;
  const COUPLE_IMAGE_H = 279;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const el = {
    scene: $("#scene"),
    defs: $("#scene-defs"),
    bg: $("#bg-decor"),
    world: $("#world"),
    stairs: $("#stairs-layer"),
    scenery: $("#scenery-layer"),
    memories: $("#memories-layer"),
    finale: $("#finale-layer"),
    couple: $("#couple-layer"),
    particles: $("#particles-layer"),
    title: $("#siteTitle"),
    togetherDate: $("#togetherDate"),
    togetherDays: $("#togetherDays"),
    togetherClock: $("#togetherClock"),
    hintWrap: $("#hintWrap"),
    hint: $("#hint"),
    hintTitle: $("#hintTitle"),
    hintProgress: $("#hintProgress"),
    hintEnd: $("#hintEnd"),
    holdRing: $("#holdRing"),
    finaleNote: $("#finaleNote"),
    toast: $("#toast"),
    toastText: $("#toastText"),
    toastClose: $("#toastClose"),
    soundBtn: $("#soundBtn"),
    photosBtn: $("#photosBtn"),
    settingsBtn: $("#settingsBtn"),
    settingsDialog: $("#settingsDialog"),
    endingDialog: $("#endingDialog"),
    lightboxDialog: $("#lightboxDialog"),
    importDialog: $("#importDialog"),
    importStatus: $("#importStatus"),
    importBar: $("#importBar"),
    fileInput: $("#fileInput"),
    fieldTitle: $("#fieldTitle"),
    fieldBoy: $("#fieldBoy"),
    fieldGirl: $("#fieldGirl"),
    fieldDate: $("#fieldDate"),
    fieldMood: $("#fieldMood"),
    fieldMessage: $("#fieldMessage"),
    messageCount: $("#messageCount"),
    photoList: $("#photoList"),
    photoCountPill: $("#photoCountPill"),
    importBtn: $("#importBtn"),
    clearPhotosBtn: $("#clearPhotosBtn"),
    saveSettingsBtn: $("#saveSettingsBtn"),
    settingsStatus: $("#settingsStatus"),
    endingNames: $("#endingNames"),
    endingMessage: $("#endingMessage"),
    lightboxImg: $("#lightboxImg"),
    restartBtn: $("#restartBtn"),
    viewEndBtn: $("#viewEndBtn"),
    finaleRestartBtn: $("#finaleRestartBtn"),
    dropOverlay: $("#dropOverlay")
  };

  const STORAGE_KEY = "our-little-forever-settings-v1";
  const TIP_KEY = "our-little-forever-tip-seen-v1";

  const state = {
    settings: null,
    photos: [],
    realPhotos: [],
    demoMode: true,
    sourceMode: false,
    storageAvailable: true,
    W: 0,
    H: 0,
    scale: 1,
    nodes: [],
    finaleS: 0,
    maxS: 0,
    progress: 0,
    speed: 0,
    holding: false,
    holdStartedAt: 0,
    pointerId: null,
    complete: false,
    finaleAnnounced: false,
    endingShown: false,
    manageMode: false,
    lastTime: 0,
    phase: 0,
    camera: { x: 0, y: 0 },
    cameraReady: false,
    couple: null,
    activePhoto: null,
    particles: [],
    trailAccumulator: 0,
    lastTrailAt: 0,
    importing: false,
    audio: null,
    toastTimer: null,
    resizeTimer: null,
    dragDepth: 0,
    holdRingShown: 0,
    lastHud: {},
    settingsPhotoDraft: [],
    pendingDeletes: new Set(),
    pendingClear: false,
    photoBaseline: "",
    lastWorldTransform: "",
    lastFocusedHit: null,
    lastEndingStats: null
  };

  const reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     settings + copy
     --------------------------------------------------------- */

  function safeSettings(input) {
    const d = CFG.defaults;
    const raw = input || {};
    return {
      title: String(raw.title == null ? d.title : raw.title).trim().slice(0, 24) || d.title,
      boyName: String(raw.boyName == null ? d.boyName : raw.boyName).trim().slice(0, 12),
      girlName: String(raw.girlName == null ? d.girlName : raw.girlName).trim().slice(0, 12),
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate || "") ? raw.startDate : d.startDate,
      mood: String(raw.mood == null ? "" : raw.mood).trim().slice(0, 18),
      message: String(raw.message == null ? d.message : raw.message).trim().slice(0, 140) || d.message,
      sound: raw.sound !== false
    };
  }

  function loadSettings() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (err) {
      saved = null;
    }
    const merged = Object.assign({}, CFG.defaults, saved || {});
    // Migrate the first version's default before the meadow replaced the stairs.
    if (merged.message === "谢谢你陪我把普通的日子，走成了一条开满花的路。下一段台阶，也要一起走。") {
      merged.message = CFG.defaults.message;
    }
    merged.message = String(merged.message || "").replace(/下一段路，也要一起走。?/g, "").trim();
    if (!merged.message) merged.message = CFG.defaults.message;
    if (!merged.startDate) merged.startDate = CFG.defaults.startDate;
    state.settings = safeSettings(merged);
  }

  function persistSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    } catch (err) {
      // localStorage can be unavailable in private windows; the page still works.
    }
  }

  function parseLocalDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function daysTogether() {
    const start = parseLocalDate(state.settings.startDate);
    if (!start) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 0;
  }

  function prettyDate(value) {
    const d = parseLocalDate(value);
    if (!d) return "";
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  function slashDate(value) {
    const d = parseLocalDate(value);
    if (!d) return "2020/11/27";
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }

  function namesText() {
    const names = [state.settings.boyName, state.settings.girlName].filter(Boolean);
    return names.length ? names.join(" × ") : "";
  }

  function togetherNow() {
    const start = parseLocalDate(state.settings.startDate) || parseLocalDate("2020-11-27");
    if (!start) return null;
    const diff = Math.max(0, Date.now() - start.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400) + 1;
    const rest = totalSeconds % 86400;
    const hh = Math.floor(rest / 3600);
    const mm = Math.floor((rest % 3600) / 60);
    const ss = rest % 60;
    return {
      days,
      date: slashDate(state.settings.startDate),
      clock: `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`
    };
  }

  function updateTogether() {
    const now = togetherNow();
    if (!now) return;
    if (el.togetherDate) el.togetherDate.textContent = now.date;
    if (el.togetherDays) el.togetherDays.textContent = now.days.toLocaleString("zh-CN");
    if (el.togetherClock) el.togetherClock.textContent = now.clock;
  }

  function updateBrand() {
    const s = state.settings;
    el.title.textContent = s.title;
    document.title = `${s.title} · ${slashDate(s.startDate)}`;
    updateTogether();
  }

  function updateSoundUi() {
    const on = !!state.settings.sound;
    el.soundBtn.classList.toggle("is-muted", !on);
    el.soundBtn.setAttribute("aria-pressed", String(on));
    el.soundBtn.setAttribute("aria-label", on ? "关闭声音" : "打开声音");
    el.soundBtn.title = on ? "关闭声音" : "打开声音";
  }

  /* ---------------------------------------------------------
     photos
     --------------------------------------------------------- */

  function revokePhotoUrls(rows) {
    (rows || []).forEach((row) => {
      if (row && row.url) {
        try {
          URL.revokeObjectURL(row.url);
        } catch (err) {
          // ignore
        }
      }
    });
  }

  function demoPhotos() {
    return (CFG.demoPhotos || []).map((item, index) => ({
      id: "demo-" + index,
      src: LA.demoPhoto(item.kind),
      caption: item.caption || "",
      isDemo: true
    }));
  }

  function sourcePhotoList() {
    return Array.isArray(window.SOURCE_PHOTOS) ? window.SOURCE_PHOTOS.filter((row) => row && row.src) : [];
  }

  async function loadRealPhotos() {
    const source = sourcePhotoList();
    if (source.length) {
      revokePhotoUrls(state.realPhotos);
      state.realPhotos = [];
      state.demoMode = false;
      state.sourceMode = true;
      state.photos = source.map((row, index) => ({
        id: "source-" + index,
        src: row.src,
        caption: "",
        width: Number(row.w) || 0,
        height: Number(row.h) || 0,
        folder: row.folder || "",
        isSource: true
      }));
      return;
    }

    if (!state.storageAvailable) {
      state.realPhotos = [];
      state.photos = demoPhotos();
      state.demoMode = true;
      return;
    }
    try {
      const rows = await window.PhotoStore.getAll();
      revokePhotoUrls(state.realPhotos);
      state.realPhotos = rows.map((row) => {
        let url = "";
        try {
          url = URL.createObjectURL(row.blob);
        } catch (err) {
          url = "";
        }
        return Object.assign({}, row, { url });
      }).filter((row) => row.url);

      if (state.realPhotos.length) {
        state.demoMode = false;
        state.photos = state.realPhotos.map((row) => ({
          id: row.id,
          src: row.url,
          caption: row.caption || "",
          isDemo: false
        }));
      } else {
        state.demoMode = true;
        state.photos = demoPhotos();
      }
    } catch (err) {
      console.warn("Photo store unavailable:", err);
      state.storageAvailable = false;
      state.realPhotos = [];
      state.demoMode = true;
      state.photos = demoPhotos();
    }
  }

  function photoCount() {
    return state.photos.length;
  }

  /* ---------------------------------------------------------
     scene construction
     --------------------------------------------------------- */

  function measure() {
    state.W = Math.max(320, window.innerWidth || document.documentElement.clientWidth);
    state.H = Math.max(360, window.innerHeight || document.documentElement.clientHeight);
    const shortLandscape = state.W > state.H * 1.15 && state.H < 620;
    const floor = shortLandscape ? 0.58 : 0.8;
    state.scale = Math.max(floor, Math.min(1.14, Math.min(state.W / 1240, state.H / 790)));
  }

  function maxWalkSpeed() {
    return Math.min(360, 250 + photoCount() * 4);
  }

  function focusPoint() {
    return {
      x: state.W < 760 ? state.W * 0.59 : state.W * 0.55,
      y: state.H * (state.W < 760 ? 0.76 : 0.74)
    };
  }

  function cameraTarget() {
    const f = focusPoint();
    return {
      x: f.x - state.progress * state.scale,
      y: f.y + state.progress * L.slope * state.scale
    };
  }

  function snapCamera() {
    const t = cameraTarget();
    state.camera.x = t.x;
    state.camera.y = t.y;
    state.cameraReady = true;
    applyWorldTransform();
  }

  function applyWorldTransform() {
    const transform = `translate(${state.camera.x.toFixed(2)} ${state.camera.y.toFixed(2)}) scale(${state.scale.toFixed(4)})`;
    if (transform !== state.lastWorldTransform) {
      el.world.setAttribute("transform", transform);
      state.lastWorldTransform = transform;
    }
  }

  function clearScene() {
    [el.stairs, el.scenery, el.memories, el.finale, el.couple, el.particles].forEach((layer) => {
      layer.innerHTML = "";
    });
    state.particles = [];
    state.couple = null;
    state.trailAccumulator = 0;
  }

  function loadPhotoImage(node) {
    if (!node || node.loaded) return;
    const image = node.memory && node.memory.image;
    if (!image) return;
    if (!image.getAttribute("href")) {
      const src = image.getAttribute("data-src");
      if (src) image.setAttribute("href", src);
    }
    node.loaded = true;
  }

  function applyPhotoVisibility(node, opacity) {
    const memory = node.memory;
    if (!memory) return;
    const rounded = Math.round(opacity * 100) / 100;
    if (node._opacity !== rounded) {
      memory.group.setAttribute("opacity", rounded.toFixed(2));
      node._opacity = rounded;
    }
    const visible = opacity > 0.18;
    if (node._visible !== visible) {
      memory.group.classList.toggle("is-revealed", visible);
      memory.group.style.pointerEvents = visible ? "auto" : "none";
      if (memory.hit) memory.hit.style.pointerEvents = visible ? "auto" : "none";
      node._visible = visible;
    }
  }

  function buildImageCouple(layer) {
    const height = 210;
    const width = height * (COUPLE_IMAGE_W / COUPLE_IMAGE_H);
    layer.innerHTML = `<g class="couple-root">
      <g class="couple-bob">
        <g class="couple-sticker">
          <ellipse cx="1" cy="4" rx="${(width * 0.38).toFixed(1)}" ry="8.5" fill="#B94F71" opacity=".14"/>
          <image href="${COUPLE_ASSET}" x="${(-width / 2).toFixed(1)}" y="${(-height).toFixed(1)}" width="${width.toFixed(1)}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
        </g>
      </g>
    </g>`;
    const root = layer.querySelector(".couple-root");
    return {
      root,
      bob: root.querySelector(".couple-bob"),
      imageGroup: root.querySelector(".couple-sticker"),
      parts: {}
    };
  }

  function buildScene(options) {
    const opts = options || {};
    const preserve = !!opts.preserve;

    measure();
    el.scene.setAttribute("viewBox", `0 0 ${state.W} ${state.H}`);

    LA.buildBackground(el.bg, state.W, state.H);

    const angles = [-2.2, 1.4, -1.1, 2.5, 0.4, -2.7, 1.9, -0.6, 1.1, -1.8];
    const galleryLift = 214;
    let cursor = 300;
    const layout = state.photos.map((photo, index) => {
      const aspect = photo.width && photo.height ? photo.width / photo.height : 1;
      let height = aspect < 0.95 ? 188 + (index % 3) * 6 : 132 + (index % 3) * 6;
      let width = height * aspect;
      if (width > 290) {
        width = 290;
        height = width / aspect;
      }
      if (width < 112) {
        width = 112;
        height = width / aspect;
      }
      const anchorX = cursor;
      const x = anchorX + width / 2;
      const y = LA.surfaceY(anchorX) - galleryLift - (index % 3) * 7;
      const angle = angles[index % angles.length];
      cursor = anchorX + width + 70;
      return { photo, index, anchorX, x, y, width, height, angle };
    });

    const lastAnchorX = layout.length ? layout[layout.length - 1].anchorX : 300;
    const finaleS = lastAnchorX + 620;
    state.finaleS = finaleS;
    state.maxS = finaleS;

    clearScene();

    const drawingLength = finaleS + L.stepW * 8;
    LA.buildMeadow(el.stairs, drawingLength, el.defs);
    LA.buildScenery(el.scenery, drawingLength);
    LA.buildFinale(el.finale, finaleS, LA.surfaceY(finaleS));

    state.nodes = layout.map((item) => {
      const memory = LA.buildMemory(el.memories, {
        photo: item.photo,
        index: item.index,
        x: item.x,
        y: item.y,
        angle: item.angle,
        dispW: item.width,
        dispH: item.height,
        clipId: `mem-clip-${Date.now()}-${item.index}`
      });
      const group = memory.group;
      group.setAttribute("opacity", "0");
      group.style.pointerEvents = "none";
      if (memory.anim) memory.anim.setAttribute("transform", "scale(1) rotate(0)");
      return {
        index: item.index,
        s: item.anchorX,
        anchorX: item.anchorX,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        photo: item.photo,
        memory,
        marker: null,
        loaded: false
      };
    });

    // Load all photos at once so nothing has to appear mid-load on mobile.
    for (const node of state.nodes) loadPhotoImage(node);

    const couple = buildImageCouple(el.couple);
    state.couple = couple;

    if (!preserve) {
      state.progress = 0;
      state.speed = 0;
      state.holding = false;
      state.complete = false;
      state.finaleAnnounced = false;
      state.endingShown = false;
      state.phase = 0;
      el.hint.hidden = false;
      el.hintEnd.hidden = true;
      el.finaleNote.hidden = true;
    } else {
      state.progress = clamp(state.progress, 0, state.maxS);
      state.speed = 0;
      state.holding = false;
    }

    state.cameraReady = false;
    snapCamera();
    state.activePhoto = null;
    updateCouple(performance.now(), 0, true);
    updateCamera(0.016, true);
    updatePhotoMoment();
    updateHud(true);

    if (state.complete) {
      el.hint.hidden = true;
      el.hintEnd.hidden = false;
    }

    document.body.dataset.ready = "1";
    window.__loveReady = true;
  }

  /* ---------------------------------------------------------
     layout maths
     --------------------------------------------------------- */

  function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /* ---------------------------------------------------------
     the walking loop
     --------------------------------------------------------- */

  function setupLoop() {
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - state.lastTime) / 1000));
    state.lastTime = now;
    update(dt, now);
    render(now, dt);
    requestAnimationFrame(loop);
  }

  function update(dt, now) {
    if (!state.nodes.length) return;

    const wantHold = state.holding && !state.complete;
    const target = wantHold ? maxWalkSpeed() : 0;
    const response = target > state.speed ? 4.2 : 7.4;
    state.speed += (target - state.speed) * (1 - Math.exp(-response * dt));
    if (!wantHold && state.speed < 1.4) state.speed = 0;

    if (state.speed > 0) {
      state.progress += state.speed * dt;
      state.phase += (state.speed * dt) / 52;
    } else if (!state.complete) {
      state.phase += dt * 0.35;
    }

    if (state.progress >= state.maxS) {
      state.progress = state.maxS;
      state.speed = 0;
      if (!state.complete) finishJourney(now);
    }

    updateCamera(dt, false);
    updateParticles(dt);

    if (state.holding && !reducedMotion && state.speed > 26) {
      state.trailAccumulator += dt;
      if (state.trailAccumulator > 0.13) {
        state.trailAccumulator = 0;
        spawnTrail();
      }
    }
  }

  function updatePhotoMoment() {
    let nearest = null;
    let nearestDist = Infinity;
    for (const node of state.nodes) {
      const d = Math.abs(state.progress - node.anchorX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = node;
      }
    }

    let active = null;
    let opacity = 0;
    if (nearest) {
      const half = nearest.width / 2;
      if (nearestDist <= half) {
        active = nearest;
        opacity = 1;
      } else if (nearestDist < half + 34) {
        active = nearest;
        opacity = 1 - (nearestDist - half) / 34;
      }
    }

    if (state.activePhoto !== active) {
      if (state.activePhoto) applyPhotoVisibility(state.activePhoto, 0);
      state.activePhoto = active;

    }

    if (active) {
      applyPhotoVisibility(active, opacity);
    }
  }

  function updateCamera(dt, snap) {
    const target = cameraTarget();
    if (snap || !state.cameraReady) {
      state.camera.x = target.x;
      state.camera.y = target.y;
      state.cameraReady = true;
    } else {
      const k = 1 - Math.exp(-5.1 * Math.max(dt, 0.001));
      state.camera.x = lerp(state.camera.x, target.x, k);
      state.camera.y = lerp(state.camera.y, target.y, k);
    }
    applyWorldTransform();
  }

  function updateCouple(now, dt, snap) {
    const couple = state.couple;
    if (!couple) return;

    const t = now / 1000;
    const speedAmp = clamp(state.speed / 175, 0, 1);
    const phase = state.phase;
    const gait = Math.sin(phase);
    const gaitB = Math.sin(phase + 0.55);

    couple.root.setAttribute("transform", `translate(${state.progress.toFixed(2)} ${LA.surfaceY(state.progress).toFixed(2)})`);

    const idle = Math.sin(t * 1.6);
    const bob = -Math.abs(gait) * 2.2 * speedAmp + idle * 0.55 * (1 - speedAmp);
    couple.bob.setAttribute("transform", `translate(0 ${bob.toFixed(2)})`);

    const farA = gait * 8.5 * speedAmp - 2.2 * (1 - speedAmp);
    const nearA = -gait * 8.5 * speedAmp + 2.8 * (1 - speedAmp);
    const farB = gaitB * 8 * speedAmp - 2 * (1 - speedAmp);
    const nearB = -gaitB * 8 * speedAmp + 2.5 * (1 - speedAmp);
    const farKnee = Math.max(0, -gait) * 10 * speedAmp;
    const nearKnee = Math.max(0, gait) * 11 * speedAmp;
    const farKneeB = Math.max(0, -gaitB) * 9 * speedAmp;
    const nearKneeB = Math.max(0, gaitB) * 10 * speedAmp;

    setRotate(couple.parts.girlFarUpper, farA);
    setRotate(couple.parts.girlNearUpper, nearA);
    setRotate(couple.parts.girlFarLower, farKnee);
    setRotate(couple.parts.girlNearLower, nearKnee);
    setRotate(couple.parts.boyFarUpper, farB);
    setRotate(couple.parts.boyNearUpper, nearB);
    setRotate(couple.parts.boyFarLower, farKneeB);
    setRotate(couple.parts.boyNearLower, nearKneeB);

    if (couple.parts.boyFreeArm) {
      couple.parts.boyFreeArm.setAttribute("transform", `rotate(${(-gaitB * 8.5 * speedAmp).toFixed(2)} 21 -124)`);
    }
    if (couple.balloon) {
      const angle = Math.sin(t * 1.15) * 2.1 + gait * 1.3 * speedAmp;
      couple.balloon.setAttribute("transform", `rotate(${angle.toFixed(2)})`);
    }

    if (couple.imageGroup) {
      const sway = Math.sin(phase) * 0.55 * speedAmp;
      couple.imageGroup.setAttribute("transform", `rotate(${sway.toFixed(2)})`);
    }

    if (couple.hands) {
      couple.hands.setAttribute("transform", `translate(0 ${(Math.sin(t * 1.8) * 0.35).toFixed(2)})`);
    }
  }

  function setRotate(node, deg) {
    if (!node) return;
    node.setAttribute("transform", `rotate(${deg.toFixed(2)})`);
  }

  function render(now, dt) {
    if (!state.nodes.length) return;

    updateCouple(now, dt, false);
    updatePhotoMoment();
    updateHud(false, now);
  }

  /* ---------------------------------------------------------
     HUD
     --------------------------------------------------------- */

  function updateHud(force, now) {
    if (!state.nodes.length) return;
    const progress = state.progress / Math.max(1, state.maxS);
    const pct = clamp(progress * 100, 0, 100).toFixed(2);

    if (force || state.lastHud.pct !== pct) {
      el.hintProgress.style.width = pct + "%";
      state.lastHud.pct = pct;
    }

    let mode = "start";
    let title = "长按屏幕，牵着我往上走";
    if (state.complete) {
      mode = "done";
    } else if (state.holding) {
      mode = "holding";
      title = "握紧手，继续往上走";
    } else if (state.progress > 8) {
      mode = "paused";
      title = "接着长按，继续走";
    }

    if (force || state.lastHud.mode !== mode) {
      el.hint.classList.toggle("is-holding", mode === "holding");
      state.lastHud.mode = mode;
    }
    if (force || state.lastHud.title !== title) {
      el.hintTitle.textContent = title;
      state.lastHud.title = title;
    }
    const ringShown = !state.complete && state.holding
      ? clamp((now - state.holdStartedAt) / 560, 0, 1)
      : 0;
    if (el.holdRing) {
      const circumference = 113.1;
      const offset = circumference * (1 - ringShown);
      el.holdRing.setAttribute("stroke-dashoffset", offset.toFixed(1));
    }

    if (state.complete) {
      el.hint.hidden = true;
      el.hintEnd.hidden = false;
    } else {
      el.hint.hidden = false;
      el.hintEnd.hidden = true;
      el.finaleNote.hidden = true;
    }
  }

  /* ---------------------------------------------------------
     finale + restart
     --------------------------------------------------------- */

  function finishJourney(now) {
    if (state.finaleAnnounced) return;
    state.finaleAnnounced = true;
    state.complete = true;
    state.holding = false;
    state.speed = 0;
    el.hint.classList.remove("is-holding");
    el.hint.hidden = true;
    el.hintEnd.hidden = false;
    el.finaleNote.hidden = false;
    playFinaleChord();
    if (!reducedMotion) {
      spawnBurst(state.finaleS, LA.surfaceY(state.finaleS) - 120, 36, 1.6);
      spawnBurst(state.finaleS + 15, LA.surfaceY(state.finaleS) - 210, 18, 1.2);
    }
    updateHud(true, now);
    setTimeout(() => {
      if (!state.endingShown) showEnding(false);
    }, 850);
  }

  function resetJourney() {
    closeDialogs();
    state.complete = false;
    state.finaleAnnounced = false;
    state.endingShown = false;
    el.hint.classList.remove("is-holding");
    el.hint.hidden = false;
    el.hintEnd.hidden = true;
    el.finaleNote.hidden = true;
    buildScene({ preserve: false });
  }

  /* ---------------------------------------------------------
     audio
     --------------------------------------------------------- */

  function ensureAudio() {
    if (!state.settings.sound) return null;
    if (!state.audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        state.audio = new AC();
      } catch (err) {
        return null;
      }
    }
    if (state.audio.state === "suspended") {
      state.audio.resume().catch(() => {});
    }
    return state.audio;
  }

  function tone(freq, when, duration, volume, type) {
    const ctx = state.audio;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.04);
  }

  function playChime(index) {
    if (!state.settings.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = notes[index % notes.length];
    const t = ctx.currentTime + 0.015;
    tone(freq, t, 1.3, 0.032, "sine");
    tone(freq * 1.5, t + 0.018, 1.0, 0.011, "sine");
    tone(freq * 2, t + 0.04, 0.55, 0.005, "triangle");
  }

  function playFinaleChord() {
    if (!state.settings.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone(freq, t + i * 0.11, 2.0, 0.026, "sine");
      tone(freq * 1.5, t + i * 0.11 + 0.02, 1.5, 0.007, "sine");
    });
  }

  function toggleSound() {
    state.settings.sound = !state.settings.sound;
    persistSettings();
    updateSoundUi();
    if (state.settings.sound) {
      const ctx = ensureAudio();
      if (ctx) {
        tone(659.25, ctx.currentTime + 0.02, 0.6, 0.02, "sine");
        tone(880, ctx.currentTime + 0.08, 0.7, 0.012, "sine");
      }
    }
  }

  /* ---------------------------------------------------------
     particles
     --------------------------------------------------------- */

  function addParticle(kind, x, y, opts) {
    if (reducedMotion) return;
    if (state.particles.length > 110) {
      const oldest = state.particles.shift();
      if (oldest && oldest.g.parentNode) oldest.g.parentNode.removeChild(oldest.g);
    }
    const o = opts || {};
    const size = o.size || 6;
    const color = o.color || "#ef87a3";
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let inner = "";
    if (kind === "heart") {
      inner = LA.heart(0, 0, size, { fill: color, opacity: 0.9 });
    } else if (kind === "sparkle") {
      inner = LA.sparkle(0, 0, size, color, 0.9);
    } else {
      inner = `<circle cx="0" cy="0" r="${size}" fill="${color}" opacity=".9"/>`;
    }
    g.innerHTML = inner;
    el.particles.appendChild(g);
    const p = {
      g,
      x,
      y,
      vx: o.vx || 0,
      vy: o.vy || 0,
      gravity: o.gravity == null ? 35 : o.gravity,
      life: o.life || 1.1,
      maxLife: o.life || 1.1,
      rot: o.rot || 0,
      spin: o.spin || 0,
      baseOpacity: o.opacity == null ? 0.95 : o.opacity
    };
    g.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${p.rot.toFixed(2)})`);
    g.setAttribute("opacity", String(p.baseOpacity));
    state.particles.push(p);
  }

  function spawnBurst(x, y, count, power) {
    if (reducedMotion) return;
    const pw = power || 1;
    const palette = ["#ef87a3", "#f7b5c4", "#fff1dd", "#e8bb72", "#e16b8f"];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.94 + Math.random() * Math.PI * 0.7;
      const speed = (45 + Math.random() * 110) * pw;
      addParticle(Math.random() > 0.35 ? "heart" : "sparkle", x + (Math.random() - 0.5) * 20, y - 8, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30 * pw,
        gravity: 75,
        life: 0.85 + Math.random() * 0.8,
        size: 4 + Math.random() * 7,
        color: palette[i % palette.length],
        rot: Math.random() * 40 - 20,
        spin: (Math.random() - 0.5) * 110,
        opacity: 0.55 + Math.random() * 0.4
      });
    }
  }

  function spawnTrail() {
    if (!state.couple || reducedMotion) return;
    const x = state.progress - 48 + (Math.random() - 0.5) * 30;
    const y = LA.surfaceY(state.progress) - 13 + (Math.random() - 0.5) * 8;
    addParticle(Math.random() > 0.28 ? "heart" : "sparkle", x, y, {
      vx: -14 - Math.random() * 24,
      vy: -8 - Math.random() * 15,
      gravity: 14,
      life: 0.65 + Math.random() * 0.55,
      size: 2.5 + Math.random() * 4,
      color: Math.random() > 0.4 ? "#ef9bb1" : "#f7d9bd",
      rot: Math.random() * 50 - 25,
      spin: (Math.random() - 0.5) * 70,
      opacity: 0.42 + Math.random() * 0.3
    });
  }

  function updateParticles(dt) {
    if (!state.particles.length) return;
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        if (p.g.parentNode) p.g.parentNode.removeChild(p.g);
        state.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      const lifeRatio = clamp(p.life / p.maxLife, 0, 1);
      p.g.setAttribute("opacity", String(p.baseOpacity * Math.min(1, lifeRatio * 2.4)));
      p.g.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(2)})`);
    }
  }

  /* ---------------------------------------------------------
     toast
     --------------------------------------------------------- */

  function showToast(text, duration) {
    clearTimeout(state.toastTimer);
    el.toastText.textContent = text;
    el.toast.hidden = false;
    requestAnimationFrame(() => el.toast.classList.add("is-visible"));
    state.toastTimer = setTimeout(hideToast, duration || 5200);
  }

  function hideToast() {
    el.toast.classList.remove("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      if (!el.toast.classList.contains("is-visible")) el.toast.hidden = true;
    }, 260);
  }

  /* ---------------------------------------------------------
     dialogs
     --------------------------------------------------------- */

  function anyDialogOpen() {
    return !!document.querySelector("dialog[open]");
  }

  function closeDialogs(except) {
    $$("dialog[open]").forEach((dialog) => {
      if (dialog !== except) {
        try {
          dialog.close();
        } catch (err) {
          // ignore
        }
      }
    });
  }

  function closeById(id) {
    const dialog = document.getElementById(id);
    if (dialog && dialog.open) dialog.close();
  }

  function setupDialogs() {
    $$("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          const button = dialog.querySelector('[data-close="' + dialog.id + '"]');
          if (button) {
            try {
              dialog.close();
            } catch (err) {
              // ignore
            }
          }
        }
      });
    });
    $$("[data-close]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = document.getElementById(button.getAttribute("data-close"));
        if (dialog && dialog.open) dialog.close();
      });
    });
    el.settingsDialog.addEventListener("close", () => {
      state.settingsPhotoDraft = [];
      state.pendingDeletes.clear();
      state.pendingClear = false;
      el.settingsStatus.textContent = "";
    });
    if (el.importDialog) {
      el.importDialog.addEventListener("cancel", (event) => {
        if (state.importing) event.preventDefault();
      });
    }
  }

  /* ---------------------------------------------------------
     settings / photo manager
     --------------------------------------------------------- */

  function metaSignature(items) {
    return JSON.stringify((items || []).map((item, index) => [
      item.id,
      String(item.caption || ""),
      index
    ]));
  }

  function draftIsDirty() {
    if (!el.settingsDialog.open) return false;
    return (
      state.pendingClear ||
      state.pendingDeletes.size > 0 ||
      metaSignature(state.settingsPhotoDraft) !== state.photoBaseline
    );
  }

  function syncPhotoDraft() {
    state.settingsPhotoDraft = state.realPhotos.map((row) => ({
      id: row.id,
      url: row.url,
      caption: row.caption || "",
      order: row.order
    }));
    state.pendingDeletes.clear();
    state.pendingClear = false;
    state.photoBaseline = metaSignature(state.settingsPhotoDraft);
  }

  function openSettings() {
    if (state.importing) return;
    stopHolding();
    closeDialogs();
    const s = state.settings;
    el.fieldTitle.value = s.title;
    el.fieldBoy.value = s.boyName;
    el.fieldGirl.value = s.girlName;
    el.fieldDate.value = s.startDate;
    el.fieldMood.value = s.mood;
    el.fieldMessage.value = s.message;
    el.messageCount.textContent = String(s.message.length);
    el.settingsStatus.textContent = "";
    syncPhotoDraft();
    renderPhotoList();
    el.settingsDialog.showModal();
  }

  function closeSettings() {
    if (el.settingsDialog.open) el.settingsDialog.close();
  }

  function updateMessageCount() {
    el.messageCount.textContent = String(el.fieldMessage.value.length);
  }

  function renderPhotoList() {
    const list = el.photoList;
    list.innerHTML = "";
    const items = state.settingsPhotoDraft;
    el.photoCountPill.textContent = `${items.length} 张`;
    el.clearPhotosBtn.hidden = items.length === 0;

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "photo-empty";
      const strong = document.createElement("strong");
      strong.textContent = state.demoMode ? "当前展示的是示例插画" : "照片已经清空";
      const span = document.createElement("span");
      span.textContent = state.pendingClear
        ? "保存后会换回示例插画，可以随时再放回来。"
        : "点上面的「放入照片」，把你们的照片放到草坡上。";
      empty.appendChild(strong);
      empty.appendChild(span);
      list.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "photo-item";
      row.dataset.id = item.id;
      row.setAttribute("draggable", "true");

      const handle = document.createElement("div");
      handle.className = "drag-handle";
      handle.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 6; i++) handle.appendChild(document.createElement("i"));

      const img = document.createElement("img");
      img.className = "photo-thumb";
      img.src = item.url;
      img.alt = `第 ${index + 1} 张照片`;
      img.loading = "lazy";

      const wrap = document.createElement("div");
      wrap.className = "photo-caption-wrap";
      const order = document.createElement("span");
      order.className = "photo-order";
      order.textContent = `STEP ${pad2(index + 1)}`;
      const input = document.createElement("input");
      input.className = "photo-caption-input";
      input.type = "text";
      input.maxLength = 24;
      input.value = item.caption || "";
      input.placeholder = "给这张照片写一句话";
      input.setAttribute("aria-label", `第 ${index + 1} 张照片的说明`);
      input.addEventListener("input", () => {
        item.caption = input.value;
        markSettingsDirty();
      });
      wrap.appendChild(order);
      wrap.appendChild(input);

      const controls = document.createElement("div");
      controls.className = "photo-controls";

      const up = miniButton("↑", "向前移一张", () => moveDraft(index, -1));
      up.disabled = index === 0;
      const down = miniButton("↓", "向后移一张", () => moveDraft(index, 1));
      down.disabled = index === items.length - 1;
      const remove = miniButton("×", "移除这张照片", () => removeDraft(index));
      remove.classList.add("remove");

      controls.appendChild(up);
      controls.appendChild(down);
      controls.appendChild(remove);

      row.appendChild(handle);
      row.appendChild(img);
      row.appendChild(wrap);
      row.appendChild(controls);

      row.addEventListener("dragstart", (event) => {
        state.draggingPhotoId = item.id;
        event.dataTransfer.effectAllowed = "move";
        try {
          event.dataTransfer.setData("text/plain", item.id);
        } catch (err) {
          // ignore
        }
        row.classList.add("is-dragging");
      });
      row.addEventListener("dragend", () => {
        state.draggingPhotoId = null;
        row.classList.remove("is-dragging");
        $$(".photo-item.is-drop-target").forEach((n) => n.classList.remove("is-drop-target"));
      });
      row.addEventListener("dragover", (event) => {
        if (!state.draggingPhotoId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        row.classList.add("is-drop-target");
      });
      row.addEventListener("dragleave", () => row.classList.remove("is-drop-target"));
      row.addEventListener("drop", (event) => {
        if (!state.draggingPhotoId) return;
        event.preventDefault();
        row.classList.remove("is-drop-target");
        const from = state.settingsPhotoDraft.findIndex((p) => p.id === state.draggingPhotoId);
        const to = state.settingsPhotoDraft.findIndex((p) => p.id === item.id);
        if (from >= 0 && to >= 0 && from !== to) {
          const [moved] = state.settingsPhotoDraft.splice(from, 1);
          state.settingsPhotoDraft.splice(to, 0, moved);
          markSettingsDirty();
          renderPhotoList();
        }
      });
      input.addEventListener("dragstart", (event) => event.preventDefault());

      list.appendChild(row);
    });
  }

  function miniButton(label, labelText, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-btn";
    button.textContent = label;
    button.setAttribute("aria-label", labelText);
    button.addEventListener("click", onClick);
    return button;
  }

  function moveDraft(index, delta) {
    const target = index + delta;
    const items = state.settingsPhotoDraft;
    if (target < 0 || target >= items.length) return;
    const [item] = items.splice(index, 1);
    items.splice(target, 0, item);
    markSettingsDirty();
    renderPhotoList();
  }

  function removeDraft(index) {
    const item = state.settingsPhotoDraft[index];
    if (!item) return;
    state.settingsPhotoDraft.splice(index, 1);
    state.pendingDeletes.add(item.id);
    markSettingsDirty("移除会在保存后生效");
    renderPhotoList();
  }

  function markSettingsDirty(message) {
    if (message) el.settingsStatus.textContent = message;
    else if (!el.settingsStatus.textContent) el.settingsStatus.textContent = "改动会在保存后生效";
  }

  function clearPhotographs() {
    if (!state.settingsPhotoDraft.length) return;
    if (!window.confirm("保存后，所有已放入的照片都会从这台设备移除。确定要清空吗？")) return;
    state.settingsPhotoDraft = [];
    state.pendingClear = true;
    state.pendingDeletes.clear();
    markSettingsDirty("保存后会清空全部照片");
    renderPhotoList();
  }

  async function persistPhotoDraft() {
    if (!(state.pendingClear || state.pendingDeletes.size || metaSignature(state.settingsPhotoDraft) !== state.photoBaseline)) {
      return false;
    }
    if (!state.storageAvailable) throw new Error("照片存储不可用。");
    if (state.pendingClear) {
      await window.PhotoStore.clearAll();
    } else {
      for (const id of state.pendingDeletes) {
        await window.PhotoStore.deleteOne(id);
      }
      await window.PhotoStore.updateMeta(
        state.settingsPhotoDraft.map((item, index) => ({
          id: item.id,
          caption: item.caption || "",
          order: index
        }))
      );
    }
    state.pendingDeletes.clear();
    state.pendingClear = false;
    return true;
  }

  async function saveSettings() {
    const title = el.fieldTitle.value.trim() || CFG.defaults.title;
    const next = safeSettings({
      title,
      boyName: el.fieldBoy.value,
      girlName: el.fieldGirl.value,
      startDate: el.fieldDate.value,
      mood: el.fieldMood.value,
      message: el.fieldMessage.value,
      sound: state.settings.sound
    });

    el.saveSettingsBtn.disabled = true;
    el.settingsStatus.textContent = "";
    try {
      const photoChanged = draftIsDirty();
      if (photoChanged) {
        await persistPhotoDraft();
      }
      state.settings = next;
      persistSettings();
      updateBrand();
      if (photoChanged) {
        await loadRealPhotos();
        buildScene({ preserve: false });
        closeSettings();
        showToast("回忆重新排好了，从第一步再走一遍吧 ♡", 4600);
      } else {
        closeSettings();
        showToast("收好了。画面里的话，已经换成我们的了。", 3800);
      }
    } catch (err) {
      console.error(err);
      el.settingsStatus.textContent = "照片没有保存成功，请从「启动网站.bat」打开后再试。";
    } finally {
      el.saveSettingsBtn.disabled = false;
    }
  }

  /* ---------------------------------------------------------
     importing
     --------------------------------------------------------- */

  function setImportProgress(done, total) {
    el.importStatus.textContent = `${done} / ${total}`;
    el.importBar.style.width = `${total ? (done / total) * 100 : 0}%`;
  }

  async function ingestFiles(files) {
    if (state.importing || !files || !files.length) return;
    if (!state.storageAvailable) {
      showToast("照片存储没有打开，请双击「启动网站.bat」后再试。", 6500);
      return;
    }
    state.importing = true;
    el.photosBtn.disabled = true;
    el.importBtn.disabled = true;

    try {
      if (el.settingsDialog.open && draftIsDirty()) {
        await persistPhotoDraft();
        syncPhotoDraft();
      }
    } catch (err) {
      state.importing = false;
      el.photosBtn.disabled = false;
      el.importBtn.disabled = false;
      showToast("先把刚才的照片顺序保存好，再来放新照片。", 4800);
      return;
    }

    setImportProgress(0, files.length);
    try {
      if (el.importDialog) el.importDialog.showModal();
    } catch (err) {
      // ignore; the overlay may already be open
    }

    try {
      const result = await window.PhotoStore.addFiles(files, (done, total) => {
        setImportProgress(done, total);
      });
      if (result.added > 0) {
        await loadRealPhotos();
        buildScene({ preserve: false });
        if (el.settingsDialog.open) {
          syncPhotoDraft();
          renderPhotoList();
        }
      }
      const failed = result.failed || 0;
      let message;
      if (!result.added && failed) {
        message = "这些照片没有读取成功，可能是 HEIC 格式；先转成 JPG 再放进来吧。";
      } else if (!result.added) {
        message = "没有新的照片被放进来。";
      } else if (failed) {
        message = `放好了 ${result.added} 张照片，有 ${failed} 张无法读取（可能是 HEIC，需要先转成 JPG）。`;
      } else {
        message = `放好了 ${result.added} 张照片，从第一步重新出发吧 ♡`;
      }
      if (el.settingsDialog.open) {
        el.settingsStatus.textContent = result.added
          ? `${message} 回到草地后会重新出发。`
          : message;
      } else if (result.added > 0) {
        showToast(message, 5600);
      } else {
        showToast(message, 6000);
      }
    } catch (err) {
      console.error("Import failed:", err);
      state.storageAvailable = window.PhotoStore.isSupported ? state.storageAvailable : false;
      if (el.settingsDialog.open) {
        el.settingsStatus.textContent = "照片没有放好。请关掉页面，用「启动网站.bat」重新打开再试。";
      } else {
        showToast("照片没有放好。请用「启动网站.bat」打开页面后再试。", 6000);
      }
    } finally {
      if (el.importDialog && el.importDialog.open) {
        try {
          el.importDialog.close();
        } catch (err) {
          // ignore
        }
      }
      state.importing = false;
      el.photosBtn.disabled = false;
      el.importBtn.disabled = false;
      el.fileInput.value = "";
    }
  }

  /* ---------------------------------------------------------
     lightbox
     --------------------------------------------------------- */

  function openLightbox(index) {
    const photo = state.photos[index];
    if (!photo) return;
    stopHolding();
    closeDialogs(el.lightboxDialog);
    el.lightboxImg.src = photo.src;
    el.lightboxImg.alt = "我们的照片";
    try {
      el.lightboxDialog.showModal();
    } catch (err) {
      console.warn(err);
    }
  }

  /* ---------------------------------------------------------
     ending
     --------------------------------------------------------- */

  function showEnding(manual) {
    if (!manual && anyDialogOpen()) return;
    stopHolding();
    closeDialogs(el.endingDialog);
    const names = namesText();
    el.endingNames.textContent = names ? `致 ${names}` : "致 我们";
    el.endingMessage.textContent = state.settings.message;
    state.endingShown = true;
    try {
      el.endingDialog.showModal();
    } catch (err) {
      console.warn(err);
    }
  }

  /* ---------------------------------------------------------
     input
     --------------------------------------------------------- */

  function canStartHold(target) {
    if (state.complete || state.importing) return false;
    if (anyDialogOpen()) return false;
    if (target && target.closest && target.closest("button, a, input, textarea, select, dialog, .toast, .memory, .together, [contenteditable='true']")) {
      return false;
    }
    return true;
  }

  function startHold(pointerId) {
    if (state.holding) return;
    ensureAudio();
    state.holding = true;
    state.pointerId = pointerId == null ? null : pointerId;
    state.holdStartedAt = performance.now();
    el.hint.classList.add("is-holding");
    updateHud(true);
  }

  function stopHolding() {
    if (!state.holding && !state.pointerId) return;
    state.holding = false;
    state.pointerId = null;
    el.hint.classList.remove("is-holding");
    if (el.holdRing) el.holdRing.setAttribute("stroke-dashoffset", "113.1");
    updateHud(true);
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!canStartHold(event.target)) return;
    if (state.holding) return;
    if (event.cancelable) event.preventDefault();
    startHold(event.pointerId);
  }

  function onPointerUp(event) {
    if (!state.holding) return;
    if (state.pointerId == null || event.pointerId === state.pointerId) {
      stopHolding();
    }
  }

  function onKeyDown(event) {
    const key = event.key;
    if (key !== " " && key !== "Spacebar" && key !== "ArrowRight" && key !== "ArrowUp") return;
    const target = event.target;
    if (target && target.closest && target.closest("input, textarea, select, button, a, dialog, [contenteditable='true']")) return;
    if (anyDialogOpen() || state.complete) return;
    if (state.holding) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    startHold("keyboard");
  }

  function onKeyUp(event) {
    if (!state.holding || state.pointerId !== "keyboard") return;
    if ([" ", "Spacebar", "ArrowRight", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      stopHolding();
    }
  }

  /* ---------------------------------------------------------
     drag files onto the page
     --------------------------------------------------------- */

  function hasFiles(event) {
    const dt = event.dataTransfer;
    if (!dt) return false;
    if (dt.types) {
      return Array.from(dt.types).includes("Files");
    }
    return false;
  }

  function setupDragDrop() {
    window.addEventListener("dragenter", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (!state.manageMode) return;
      state.dragDepth++;
      el.dropOverlay.hidden = false;
    });
    window.addEventListener("dragover", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (!state.manageMode) return;
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    });
    window.addEventListener("dragleave", (event) => {
      if (!hasFiles(event)) return;
      if (!state.manageMode) return;
      state.dragDepth = Math.max(0, state.dragDepth - 1);
      if (state.dragDepth === 0) el.dropOverlay.hidden = true;
    });
    window.addEventListener("drop", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      state.dragDepth = 0;
      el.dropOverlay.hidden = true;
      if (!state.manageMode) return;
      const files = Array.from(event.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
      if (files.length) ingestFiles(files);
      else showToast("没有找到可以放入的图片。", 3600);
    });
  }

  function setManageMode(enabled, announce) {
    state.manageMode = !!enabled;
    document.body.classList.toggle("manage-mode", state.manageMode);
    if (!state.manageMode) {
      closeDialogs();
      hideToast();
      stopHolding();
      state.dragDepth = 0;
      el.dropOverlay.hidden = true;
      try {
        const url = new URL(window.location.href);
        let changed = false;
        if (url.searchParams.has("manage")) {
          url.searchParams.delete("manage");
          changed = true;
        }
        if (/(^|[#&])manage\b/i.test(url.hash || "")) {
          url.hash = "";
          changed = true;
        }
        if (changed) window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (err) {
        // ignore
      }
    } else if (announce) {
      if (state.demoMode) {
        showToast("管理模式已打开 · 右上角「放入照片」换成你们的照片", 4600);
      } else {
        showToast("管理模式已打开 · 右上角可以修改设置", 3600);
      }
    }
  }

  function manageModeFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("manage") === "1") return true;
      return /(^|[#&])manage\b/i.test(window.location.hash || "");
    } catch (err) {
      return false;
    }
  }

  /* ---------------------------------------------------------
     event wiring
     --------------------------------------------------------- */

  function setupEvents() {
    setupDialogs();
    setupDragDrop();

    document.addEventListener("pointerdown", onPointerDown, { passive: false });
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
    window.addEventListener("blur", stopHolding);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopHolding();
    });

    document.addEventListener("keydown", onKeyDown, { passive: false });
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("contextmenu", (event) => {
      if (event.target.closest && event.target.closest("input, textarea, dialog")) return;
      event.preventDefault();
    });

    el.soundBtn.addEventListener("click", toggleSound);
    el.photosBtn.addEventListener("click", () => el.fileInput.click());
    el.settingsBtn.addEventListener("click", openSettings);
    el.importBtn.addEventListener("click", () => el.fileInput.click());
    el.fileInput.addEventListener("change", () => {
      const files = Array.from(el.fileInput.files || []);
      if (files.length) ingestFiles(files);
      else el.fileInput.value = "";
    });

    el.fieldMessage.addEventListener("input", updateMessageCount);
    el.saveSettingsBtn.addEventListener("click", saveSettings);
    el.clearPhotosBtn.addEventListener("click", clearPhotographs);
    el.toastClose.addEventListener("click", () => {
      hideToast();
      try {
        localStorage.setItem(TIP_KEY, "1");
      } catch (err) {
        // ignore
      }
    });

    el.restartBtn.addEventListener("click", resetJourney);
    el.viewEndBtn.addEventListener("click", () => showEnding(true));
    el.finaleRestartBtn.addEventListener("click", resetJourney);

    el.scene.addEventListener("click", (event) => {
      const hit = event.target.closest && event.target.closest(".memory-hit");
      if (!hit) return;
      const memory = hit.closest(".memory");
      if (!memory || !memory.classList.contains("is-revealed")) return;
      const index = Number(memory.getAttribute("data-index"));
      if (Number.isFinite(index)) openLightbox(index);
    });

    el.scene.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const hit = event.target.closest && event.target.closest(".memory-hit");
      if (!hit) return;
      const memory = hit.closest(".memory");
      if (!memory || !memory.classList.contains("is-revealed")) return;
      event.preventDefault();
      const index = Number(memory.getAttribute("data-index"));
      if (Number.isFinite(index)) openLightbox(index);
    });

    window.addEventListener("resize", () => {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(() => {
        if (state.nodes.length) buildScene({ preserve: true });
      }, 160);
    });

    window.addEventListener("beforeunload", () => {
      revokePhotoUrls(state.realPhotos);
    });
  }

  function maybeShowDemoTip() {
    if (!state.demoMode || !state.manageMode) return;
    let seen = false;
    try {
      seen = localStorage.getItem(TIP_KEY) === "1";
    } catch (err) {
      seen = false;
    }
    if (seen) return;
    setTimeout(() => {
      if (state.demoMode && state.manageMode && !state.importing) {
        showToast("示例插画 · 点右上角「放入照片」换成你们的照片", 7600);
      }
    }, 1300);
  }

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */

  async function init() {
    loadSettings();
    state.manageMode = false;
    document.body.classList.remove("manage-mode");
    updateBrand();
    updateSoundUi();
    setupEvents();
    window.setInterval(updateTogether, 1000);

    if (!window.PhotoStore || !window.PhotoStore.isSupported) {
      state.storageAvailable = false;
    }

    try {
      await loadRealPhotos();
    } catch (err) {
      console.error(err);
      state.storageAvailable = false;
      await loadRealPhotos();
    }

    buildScene({ preserve: false });
    setupLoop();
    maybeShowDemoTip();
  }

  // A tiny hook used while building/verifying the page.
  window.__loveDebug = {
    state,
    jumpTo(fraction) {
      const f = clamp(Number(fraction) || 0, 0, 1);
      state.progress = state.maxS * f;
      state.speed = 0;
      state.holding = false;
      state.complete = f >= 1;
      state.cameraReady = false;
      snapCamera();
      updateCouple(performance.now(), 0, true);
      updatePhotoMoment();
      updateHud(true);
      if (state.complete) finishJourney(performance.now());
    }
  };

  init().catch((err) => {
    console.error("Init failed:", err);
    document.body.dataset.ready = "error";
  });
})();

/* =========================================================
   All artwork on this page is drawn by hand, in SVG.
   No external images, no stock assets, no network required.
   ========================================================= */
(function () {
  "use strict";

  const HEART_PATH =
    "M12 21.1C10.9 20.2 2 14.1 2 8.2 2 5.4 4.2 3.1 7 3.1c1.8 0 3.5.9 4.5 2.4 1-1.5 2.7-2.4 4.5-2.4 2.8 0 5 2.3 5 5.1 0 5.9-8.9 12-10 12.9Z";

  const LAYOUT = {
    stepW: 190,
    stepH: 44,
    slope: 44 / 190,
    cardW: 224,
    cardH: 258,
    cardPad: 10,
    photoH: 184,
    nodeFirst: 2.5,
    nodeGap: 2,
    tailSteps: 3.25
  };

  const COLORS = {
    ink: "#653f4a",
    inkSoft: "#8b5a66",
    skin: "#ffdbc6",
    skinShade: "#f2bda9",
    hair: "#62403f",
    hairGirl: "#74454d",
    hairLight: "#8c5b5e",
    cream: "#fff5e7",
    creamDeep: "#ffe9d8",
    dress: "#f28fac",
    dressDark: "#dc6f92",
    dressLight: "#ffb7c9",
    pants: "#b77586",
    pantsDark: "#a36476",
    shoe: "#d45d7d",
    shoeBoy: "#b9667b",
    sock: "#fff3e7",
    mint: "#a6cdbd",
    gold: "#e8bb72",
    pin: "#e26489"
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function heart(cx, cy, size, opts) {
    const o = opts || {};
    const fill = o.fill || COLORS.dress;
    const opacity = o.opacity == null ? 1 : o.opacity;
    const rotate = o.rotate || 0;
    const stroke = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.strokeWidth || 1.6}"` : "";
    const scale = size / 24;
    return `<path d="${HEART_PATH}" transform="translate(${cx} ${cy}) rotate(${rotate}) translate(-12 -12) scale(${scale})" fill="${fill}"${stroke} opacity="${opacity}"/>`;
  }

  function sparkle(cx, cy, size, fill, opacity) {
    const s = size;
    return `<path d="M ${cx} ${cy - s} C ${cx + s * 0.18} ${cy - s * 0.2}, ${cx + s * 0.2} ${cy - s * 0.18}, ${cx + s} ${cy} C ${cx + s * 0.2} ${cy + s * 0.18}, ${cx + s * 0.18} ${cy + s * 0.2}, ${cx} ${cy + s} C ${cx - s * 0.18} ${cy + s * 0.2}, ${cx - s * 0.2} ${cy + s * 0.18}, ${cx - s} ${cy} C ${cx - s * 0.2} ${cy - s * 0.18}, ${cx - s * 0.18} ${cy - s * 0.2}, ${cx} ${cy - s} Z" fill="${fill}" opacity="${opacity == null ? 1 : opacity}"/>`;
  }

  function circle(cx, cy, r, fill, opacity) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity == null ? 1 : opacity}"/>`;
  }

  function flower(x, y, scale, petal, center) {
    let petals = "";
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      petals += circle(
        x + Math.cos(a) * 5.1 * scale,
        y + Math.sin(a) * 5.1 * scale,
        4.1 * scale,
        petal || "#fff3e1"
      );
    }
    return `<g>
      <path d="M${x} ${y + 5} C ${x - 2} ${y + 15}, ${x + 3} ${y + 22}, ${x - 1} ${y + 32}" fill="none" stroke="#b9a184" stroke-width="${1.25 * scale}" stroke-linecap="round" opacity=".7"/>
      <path d="M${x} ${y + 16} q ${-8 * scale} ${-1 * scale} ${-10 * scale} ${7 * scale} q ${8 * scale} ${1 * scale} ${10 * scale} ${-7 * scale}Z" fill="#a9c4a7" opacity=".75"/>
      ${petals}
      ${circle(x, y, 3 * scale, center || COLORS.gold)}
    </g>`;
  }

  function cloud(x, y, scale, fill, opacity) {
    const f = fill || "#fff9f1";
    const o = opacity == null ? 0.9 : opacity;
    return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${f}" opacity="${o}">
      <ellipse cx="0" cy="5" rx="72" ry="27"/>
      <circle cx="-42" cy="-4" r="28"/>
      <circle cx="-9" cy="-16" r="36"/>
      <circle cx="37" cy="-5" r="27"/>
      <circle cx="61" cy="9" r="19"/>
      <rect x="-64" y="-2" width="122" height="30" rx="15"/>
    </g>`;
  }

  function meadowEdgeY(x, offset, amp, phase) {
    return (
      -x * LAYOUT.slope +
      offset +
      Math.sin(x * 0.0063 + phase) * amp +
      Math.sin(x * 0.0167 + phase * 1.73) * amp * 0.34
    );
  }

  function meadowEdgePoints(xStart, xEnd, offset, amp, phase, step) {
    const points = [];
    const stride = step || 64;
    for (let x = xStart; x < xEnd; x += stride) {
      points.push([x, meadowEdgeY(x, offset, amp, phase)]);
    }
    points.push([xEnd, meadowEdgeY(xEnd, offset, amp, phase)]);
    return points;
  }

  function meadowPath(points, closeWith) {
    const start = points
      .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    if (!closeWith) return start;
    const back = closeWith
      .slice()
      .reverse()
      .map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    return `${start} ${back} Z`;
  }

  function grassTuft(x, y, scale, dark, flip) {
    const c1 = dark ? "#c75f83" : "#e58aa5";
    const c2 = dark ? "#dd7898" : "#f4aec1";
    const sy = flip ? -scale : scale;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)} ${sy.toFixed(2)})" fill="none" stroke-linecap="round">
      <path d="M0 0 C -2 -7 -5 -12 -8 -15" stroke="${c1}" stroke-width="1.55"/>
      <path d="M0 0 C -1 -8 0 -14 1 -20" stroke="${c2}" stroke-width="1.8"/>
      <path d="M0 0 C 4 -6 7 -9 11 -12" stroke="${c1}" stroke-width="1.5"/>
      <path d="M1 0 C 3 -4 5 -6 8 -8" stroke="${c2}" stroke-width="1.1" opacity=".7"/>
    </g>`;
  }

  function buildMeadow(layer, totalS, defs) {
    if (defs && !document.getElementById("meadowGrad")) {
      defs.insertAdjacentHTML(
        "beforeend",
        `<linearGradient id="meadowGrad" x1="0" y1="0" x2=".25" y2="1">
          <stop offset="0" stop-color="#ffdce7"/>
          <stop offset=".42" stop-color="#f8b4ca"/>
          <stop offset="1" stop-color="#eb92b1"/>
        </linearGradient>
        <linearGradient id="meadowRidgeGrad" x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0" stop-color="#ffeaf0"/>
          <stop offset="1" stop-color="#ffd2e0" stop-opacity=".25"/>
        </linearGradient>
        <pattern id="meadowTexture" width="128" height="96" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#fff1e4" stroke-width="1.05" stroke-linecap="round" opacity=".22">
            <path d="M14 76 l -3 -9 M18 78 l 1 -11 M23 76 l 5 -8"/>
            <path d="M88 28 l -2 -8 M92 30 l 2 -10"/>
            <path d="M52 66 l -2 -6 M55 68 l 1 -7"/>
          </g>
          <g fill="none" stroke="#c96283" stroke-width="1" stroke-linecap="round" opacity=".1">
            <path d="M48 54 l -2 -7 M51 55 l 1 -8"/>
            <path d="M110 84 l -3 -6"/>
          </g>
          <circle cx="68" cy="16" r="1.1" fill="#fff1e4" opacity=".3"/>
          <circle cx="20" cy="46" r="1" fill="#fff1e4" opacity=".2"/>
        </pattern>`
      );
    }

    const startX = -1500;
    const endX = totalS + 1700;
    const topPts = meadowEdgePoints(startX, endX, -30, 8, 0.8, 62);
    const ridgeInnerPts = meadowEdgePoints(startX, endX, -12, 7, 1.1, 62);
    const bottomPts = meadowEdgePoints(startX, endX, 152, 15, 2.5, 62);
    const lowerShadePts = meadowEdgePoints(startX, endX, 104, 12, 2.2, 62);
    const pathTopPts = meadowEdgePoints(startX, endX, -13, 1.6, 0.4, 80);
    const pathBottomPts = meadowEdgePoints(startX, endX, 14, 1.8, 0.4, 80);
    const trackPts = meadowEdgePoints(startX, endX, 1.5, 1.2, 0.4, 80);

    const bandD = meadowPath(topPts, bottomPts);
    const ridgeD = meadowPath(topPts, ridgeInnerPts);
    const shadeD = meadowPath(lowerShadePts, bottomPts);
    const pathD = meadowPath(pathTopPts, pathBottomPts);

    let markup = `<g class="meadow-band">
      <path d="${bandD}" fill="#b85677" opacity=".08" transform="translate(0 13)"/>
      <path d="${bandD}" fill="url(#meadowGrad)"/>
      <path d="${bandD}" fill="url(#meadowTexture)"/>
      <path d="${ridgeD}" fill="url(#meadowRidgeGrad)"/>
      <path d="${shadeD}" fill="#d86f94" opacity=".11"/>`;

    // soft contour lines, like wind moving over a meadow
    const contours = [
      [38, 10, 1.4, "#fff0e7", 0.16],
      [68, 13, 3.1, "#ffd7e3", 0.14],
      [104, 9, 4.4, "#f5a8c0", 0.14],
      [130, 13, 0.2, "#d76f94", 0.09]
    ];
    contours.forEach(([offset, amp, phase, color, opacity]) => {
      const pts = meadowEdgePoints(startX, endX, offset, amp, phase, 88);
      markup += `<path d="${meadowPath(pts)}" fill="none" stroke="${color}" stroke-width="1.1" stroke-linecap="round" opacity="${opacity}"/>`;
    });

    // a mown path, with a fine stitched line, running along the walk
    markup += `<path d="${pathD}" fill="#ffe9ed" opacity=".2"/>`;
    markup += `<path d="${meadowPath(trackPts)}" fill="none" stroke="#fff6e8" stroke-width="1.45" stroke-linecap="round" stroke-dasharray="8 14" opacity=".58"/>`;

    // the sunlit top edge and its soft shadow
    markup += `<path d="${meadowPath(topPts)}" fill="none" stroke="#c85f83" stroke-width="13" stroke-linejoin="round" opacity=".07" transform="translate(0 8)"/>`;
    markup += `<path d="${meadowPath(topPts)}" fill="none" stroke="#ffeff2" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round" opacity=".92"/>`;
    markup += `<path d="${meadowPath(bottomPts)}" fill="none" stroke="#d97596" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".38"/>`;

    // a little deterministic scatter, so every visit feels the same
    let seed = 11272020;
    const rand = () => {
      seed += 0x6d2b79f5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // grass along the upper ridge
    for (let x = startX + 20; x < endX; x += 48 + rand() * 58) {
      const y = meadowEdgeY(x, -30, 8, 0.8);
      markup += grassTuft(x, y + 3, 0.62 + rand() * 0.58, rand() > 0.55, false);
      if (rand() > 0.72) {
        markup += flower(x + 10 + rand() * 18, y + 7, 0.46 + rand() * 0.34, rand() > 0.35 ? "#fff5e7" : "#ffd8e3", "#e6b86e");
      }
    }

    // grass hanging over the lower edge
    for (let x = startX + 34; x < endX; x += 55 + rand() * 52) {
      const y = meadowEdgeY(x, 152, 15, 2.5);
      markup += grassTuft(x, y - 1, 0.42 + rand() * 0.45, true, true);
    }

    // smaller tufts and flowers inside the meadow
    for (let x = startX + 40; x < endX; x += 76 + rand() * 54) {
      const offset = 22 + rand() * 108;
      const y = meadowEdgeY(x, offset, 10, 1.6);
      markup += grassTuft(x, y, 0.4 + rand() * 0.42, rand() > 0.55, false);
      if (rand() > 0.8) {
        markup += flower(x + 7, y - 2, 0.38 + rand() * 0.26, "#ffe0e8", "#e2ae66");
      }
    }

    // a few bigger blossoms tucked near the path
    for (let x = startX + 170; x < endX; x += 240 + rand() * 170) {
      const y = meadowEdgeY(x, 18 + rand() * 25, 8, 1.9);
      markup += flower(x, y, 0.62 + rand() * 0.34, rand() > 0.28 ? "#fff4e3" : "#ffd1dd", "#e1b167");
    }

    // tiny sparkles like dew on the grass
    for (let x = startX + 90; x < endX; x += 260 + rand() * 180) {
      const y = meadowEdgeY(x, rand() > 0.5 ? -19 : 34, 5, 1.4);
      markup += sparkle(x, y, 2.3 + rand() * 2, "#fff2d9", 0.4 + rand() * 0.24);
    }

    // cloud puffs peeking out beneath the floating meadow
    for (let x = startX + 260; x < endX; x += 770 + rand() * 160) {
      const y = meadowEdgeY(x, 174, 12, 2.8);
      markup += cloud(x, y, 0.48 + rand() * 0.3, "#fff8ef", 0.48 + rand() * 0.14);
    }
    markup += `</g>`;

    layer.innerHTML = markup;
  }

  function buildScenery(layer, totalS) {
    const rand = (function () {
      let a = 20240520 >>> 0;
      return function () {
        a += 0x6d2b79f5;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })();

    let markup = `<g class="scenery">`;

    // distant clouds, kept low so the photo wall stays airy
    for (let x = -800; x < totalS + 1500; x += 470) {
      const y = -x * LAYOUT.slope + 165 + rand() * 160;
      markup += cloud(
        x + rand() * 220,
        y,
        0.45 + rand() * 0.42,
        rand() > 0.45 ? "#fff8f0" : "#ffeef2",
        0.42 + rand() * 0.22
      );
    }

    // floating hearts and tiny stars along the climb
    for (let x = -650; x < totalS + 1400; x += 135) {
      const baseY = -x * LAYOUT.slope;
      const side = rand() > 0.5 ? -1 : 1;
      const y = baseY + (side < 0 ? -90 - rand() * 300 : 120 + rand() * 160);
      const size = 5 + rand() * 13;
      const opacity = 0.11 + rand() * 0.19;
      const rot = -18 + rand() * 36;
      const delay = (rand() * 7).toFixed(2);
      if (rand() > 0.64) {
        markup += `<g transform="translate(${(x + rand() * 100).toFixed(1)} ${y.toFixed(1)})"><g class="bg-float" style="animation-delay:-${delay}s;animation-duration:${7 + rand() * 6}s">${heart(0, 0, size, { fill: rand() > 0.22 ? "#fff6ed" : "#e97899", opacity: opacity, rotate: rot })}</g></g>`;
      } else if (rand() > 0.58) {
        markup += `<g transform="translate(${(x + rand() * 100).toFixed(1)} ${y.toFixed(1)})"><g class="bg-float" style="animation-delay:-${delay}s;animation-duration:${8 + rand() * 6}s">${sparkle(0, 0, size * 0.38, "#fff7e7", opacity + 0.12)}</g></g>`;
      }
    }

    // tiny seed-pods / petals drifting under the meadow
    for (let x = -500; x < totalS + 1200; x += 320) {
      const y = -x * LAYOUT.slope + 240 + rand() * 80;
      markup += `<g opacity="${0.18 + rand() * 0.16}" fill="${rand() > 0.5 ? "#f4abc0" : "#fff4e9"}">
        <ellipse cx="${x + rand() * 100}" cy="${y}" rx="${2.5 + rand() * 2.5}" ry="${1.4 + rand() * 1.3}" transform="rotate(${rand() * 70} ${x} ${y})"/>
      </g>`;
    }

    // a small paper plane near the beginning
    markup += `<g transform="translate(360 -245) rotate(-12)" opacity=".5">
      <path d="M0 0 L43 13 L11 18 L4 8 L0 0Z" fill="#fff9f1"/>
      <path d="M43 13 L11 18 L12 10Z" fill="#f3c4d0"/>
      <path d="M-140 62 C -88 45 -38 34 12 27" fill="none" stroke="#fff9f1" stroke-width="1" stroke-dasharray="2 6" stroke-linecap="round" opacity=".5"/>
    </g>`;

    markup += `</g>`;
    layer.innerHTML = markup;
  }

  function legMarkup(opts) {
    const {
      x,
      y,
      colors,
      upper = 27,
      lower = 27,
      far = false,
      width = 11,
      lowerWidth = 10,
      shoe = COLORS.shoe,
      shoeKind = "mary",
      shoeScale = 1
    } = opts;
    const upperColor = far ? colors.upperDark : colors.upper;
    const lowerColor = far ? colors.lowerDark : colors.lower;
    const shoeTop = shoeKind === "sneaker"
      ? `<path d="M-8 -1 C -8 -6 0 -8 8 -5 L13 -3 C 15 -2 14 1 11 2 L-7 3 C -10 3 -10 1 -8 -1Z" fill="${shoe}"/>
         <path d="M-8 1 L12 1 L11 4 C 2 6 -5 5 -8 4Z" fill="#fff8ed"/>
         <path d="M-2 -4 L4 -4" stroke="#fff4e9" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`
      : `<path d="M-8 0 C -8 -5 -1 -8 7 -5 L12 -2 C 14 0 13 2 10 3 L-7 3 C -9 3 -10 1 -8 0Z" fill="${shoe}"/>
         <path d="M-5 -4 C -1 -8 5 -7 8 -5" fill="none" stroke="#f4a3b6" stroke-width="1.1" opacity=".75"/>
         <path d="M1 -1 L1 2" stroke="#b14565" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>`;
    return `<g transform="translate(${x} ${y})" class="leg ${far ? "leg-far" : "leg-near"}">
      <g class="leg-upper">
        <path d="M0 0 C -1 ${upper * 0.35} -1 ${upper * 0.7} 0 ${upper}" fill="none" stroke="${upperColor}" stroke-width="${width}" stroke-linecap="round"/>
        <g transform="translate(0 ${upper})">
          <g class="leg-lower">
            <path d="M0 0 C 1 ${lower * 0.35} 2 ${lower * 0.68} 2 ${lower}" fill="none" stroke="${lowerColor}" stroke-width="${lowerWidth}" stroke-linecap="round"/>
            <g transform="translate(2 ${lower}) scale(${shoeScale})" class="shoe">${shoeTop}</g>
          </g>
        </g>
      </g>
    </g>`;
  }

  function buildGirl() {
    const hair = COLORS.hairGirl;
    const hairLight = COLORS.hairLight;
    const skin = COLORS.skin;

    return `<g class="girl character" transform="translate(-56 0)">
      <!-- legs -->
      ${legMarkup({
        x: -6,
        y: -57,
        far: true,
        colors: { upper: "#f4d9cf", upperDark: "#efd0c6", lower: "#f3d8cd", lowerDark: "#edd0c6" },
        shoe: "#b6526f",
        width: 10.5,
        lowerWidth: 9.5
      })}
      ${legMarkup({
        x: 7,
        y: -57,
        colors: { upper: COLORS.sock, upperDark: COLORS.sock, lower: COLORS.sock, lowerDark: COLORS.sock },
        shoe: COLORS.shoe,
        width: 11,
        lowerWidth: 10
      })}

      <!-- hair behind -->
      <path d="M4 -181 C -18 -184 -35 -170 -32 -148 C -44 -134 -42 -111 -31 -99 C -26 -113 -18 -120 -8 -126 C 5 -133 11 -143 11 -157 C 15 -171 10 -180 4 -181Z" fill="${hair}"/>
      <path d="M-26 -104 C -31 -118 -25 -131 -17 -137" fill="none" stroke="${hairLight}" stroke-width="2" stroke-linecap="round" opacity=".45"/>

      <!-- neck -->
      <path d="M-4 -132 L8 -132 L8 -119 L-4 -119Z" fill="${COLORS.skinShade}"/>
      <path d="M-4 -131 L8 -131 L8 -122 L-4 -122Z" fill="${skin}"/>

      <!-- dress -->
      <path d="M-21 -126 C -13 -137 13 -137 22 -124 C 17 -108 21 -88 31 -54 C 12 -45 -17 -46 -33 -55 C -21 -87 -19 -109 -21 -126Z" fill="${COLORS.dress}"/>
      <path d="M-21 -126 C -29 -111 -28 -90 -33 -55 C -24 -51 -16 -49 -8 -48 C -16 -83 -12 -109 -9 -125Z" fill="${COLORS.dressDark}" opacity=".28"/>
      <path d="M17 -124 C 23 -108 21 -90 28 -58 C 22 -55 17 -53 12 -52 C 15 -84 12 -108 10 -124Z" fill="${COLORS.dressLight}" opacity=".36"/>
      <path d="M-31 -54 C -14 -47 14 -46 30 -54" fill="none" stroke="#ffd4de" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
      <path d="M-30 -58 C -12 -51 12 -50 29 -58" fill="none" stroke="#d9688c" stroke-width="1.1" stroke-linecap="round" opacity=".28"/>

      <!-- collar and sash -->
      <path d="M-18 -127 C -9 -134 1 -134 5 -125 C -2 -121 -10 -121 -18 -127Z" fill="${COLORS.cream}"/>
      <path d="M1 -126 C 7 -135 16 -133 21 -124 C 14 -121 7 -121 1 -126Z" fill="${COLORS.cream}"/>
      <path d="M-20 -88 C -9 -83 10 -82 23 -89" fill="none" stroke="#fff0e2" stroke-width="5" stroke-linecap="round"/>
      <path d="M-19 -88 C -24 -95 -28 -94 -29 -89 C -30 -84 -24 -82 -19 -87 C -14 -82 -10 -84 -10 -89 C -11 -94 -15 -94 -19 -88Z" fill="#ffd3dd"/>
      <circle cx="-19" cy="-88" r="2.3" fill="#e48aa1"/>
      ${heart(-1, -109, 8, { fill: "#fff4e7", opacity: 0.9 })}
      ${heart(7, -72, 5, { fill: "#fff0e3", opacity: 0.48 })}
      ${heart(-10, -64, 4, { fill: "#fff0e3", opacity: 0.42 })}

      <!-- sleeves -->
      <circle cx="19" cy="-120" r="10.5" fill="${COLORS.dressLight}"/>
      <circle cx="-18" cy="-115" r="9" fill="${COLORS.dressDark}"/>

      <!-- far arm, visible on her left, holding the balloon string -->
      <g class="girl-free-arm">
        <path d="M-21 -110 C -28 -102 -34 -96 -39 -91" fill="none" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>
        <path d="M-33 -97 C -36 -95 -38 -93 -39 -91" fill="none" stroke="${COLORS.skinShade}" stroke-width="1" stroke-linecap="round" opacity=".5"/>
        <circle cx="-39" cy="-90" r="4.5" fill="${skin}"/>
        <path d="M-42 -92 C -45 -90 -45 -87 -43 -85" fill="none" stroke="${COLORS.skinShade}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
      </g>

      <!-- head -->
      <g class="girl-head head">
        <circle cx="-24" cy="-173" r="12" fill="${hair}"/>
        <circle cx="-27" cy="-176" r="4" fill="#8b5a5e" opacity=".55"/>
        <path d="M-34 -180 C -42 -187 -46 -180 -39 -175 C -47 -170 -40 -163 -33 -169Z" fill="#ee8daa"/>
        <circle cx="-36" cy="-176" r="2.1" fill="#ffd4dd"/>

        <ellipse cx="2" cy="-152" rx="27.5" ry="27" fill="${skin}"/>
        <ellipse cx="-3" cy="-147" rx="17" ry="19" fill="${COLORS.skinShade}" opacity=".18"/>
        <circle cx="-20" cy="-149" r="5" fill="${COLORS.skinShade}"/>
        <circle cx="-20" cy="-149" r="2.4" fill="#e7a28f" opacity=".55"/>
        ${heart(-22, -140, 5.5, { fill: COLORS.gold, opacity: 0.9 })}

        <!-- hair fringe -->
        <path d="M-25 -160 C -24 -181 4 -190 21 -172 C 25 -166 26 -160 25 -157 C 17 -167 7 -168 0 -159 C -4 -170 -17 -171 -25 -160Z" fill="${hair}"/>
        <path d="M-19 -169 C -9 -178 7 -179 16 -171" fill="none" stroke="${hairLight}" stroke-width="2" stroke-linecap="round" opacity=".55"/>
        <path d="M23 -159 C 28 -153 27 -146 23 -143" fill="none" stroke="${hair}" stroke-width="3.1" stroke-linecap="round"/>

        <!-- nose + face -->
        <path d="M28 -150 C 31 -149 31 -145 28 -144" fill="${skin}" stroke="${COLORS.skinShade}" stroke-width="1" stroke-linecap="round"/>
        <circle cx="12" cy="-143" r="6" fill="#f6a2a7" opacity=".55"/>
        <g class="eye girl-eye">
          <ellipse cx="16" cy="-155" rx="2.5" ry="3.4" fill="#59333d"/>
          <circle cx="16.8" cy="-156.3" r=".95" fill="#fff9ec"/>
          <path d="M13 -159.5 C 15 -161 18 -161 20 -159" fill="none" stroke="#59333d" stroke-width="1.4" stroke-linecap="round"/>
        </g>
        <path d="M18 -142 C 20 -139 23 -139 25 -141" fill="none" stroke="#b75868" stroke-width="1.5" stroke-linecap="round"/>
      </g>

      <!-- front lock -->
      <path d="M-27 -139 C -34 -129 -32 -113 -28 -102 C -24 -109 -23 -123 -22 -133Z" fill="${hair}" opacity=".95"/>
      <path d="M-27 -135 C -30 -124 -29 -113 -27 -106" fill="none" stroke="${hairLight}" stroke-width="1.4" stroke-linecap="round" opacity=".4"/>

      <!-- near arm reaching for his hand -->
      <path d="M18 -116 C 31 -113 41 -108 50 -102" fill="none" stroke="${skin}" stroke-width="7.5" stroke-linecap="round"/>
      <path d="M18 -116 C 22 -119 27 -120 31 -120" fill="none" stroke="${COLORS.dressDark}" stroke-width="1.4" stroke-linecap="round" opacity=".32"/>
      <circle cx="51" cy="-102" r="4.6" fill="${skin}"/>
    </g>`;
  }

  function buildBoy() {
    const hair = COLORS.hair;
    const skin = COLORS.skin;

    return `<g class="boy character" transform="translate(54 0)">
      <!-- free arm behind -->
      <g class="boy-free-arm">
        <path d="M16 -121 C 20 -109 24 -100 27 -94" fill="none" stroke="${COLORS.cream}" stroke-width="11" stroke-linecap="round"/>
        <path d="M26 -97 C 28 -94 29 -91 29 -88" fill="none" stroke="${skin}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="29" cy="-87" r="4" fill="${skin}"/>
        <circle cx="16" cy="-122" r="8.5" fill="${COLORS.cream}"/>
      </g>

      <!-- legs -->
      ${legMarkup({
        x: -5,
        y: -61,
        far: true,
        colors: { upper: COLORS.pantsDark, upperDark: COLORS.pantsDark, lower: "#eed8cd", lowerDark: "#e9d1c6" },
        shoe: "#a3586b",
        shoeKind: "sneaker",
        width: 11.5,
        lowerWidth: 9.5
      })}
      ${legMarkup({
        x: 7,
        y: -61,
        colors: { upper: COLORS.pants, upperDark: COLORS.pants, lower: COLORS.sock, lowerDark: COLORS.sock },
        shoe: COLORS.shoeBoy,
        shoeKind: "sneaker",
        width: 12,
        lowerWidth: 10
      })}

      <!-- neck -->
      <path d="M-4 -136 L8 -136 L8 -121 L-4 -121Z" fill="${COLORS.skinShade}"/>
      <path d="M-4 -135 L8 -135 L8 -125 L-4 -125Z" fill="${skin}"/>

      <!-- sweater -->
      <path d="M-22 -126 C -12 -138 12 -138 22 -126 L24 -76 C 12 -68 -12 -68 -24 -76Z" fill="${COLORS.cream}"/>
      <path d="M-22 -126 C -28 -111 -26 -91 -24 -76 C -18 -73 -12 -71 -6 -70 C -12 -92 -14 -113 -11 -128Z" fill="#f5d9c5" opacity=".55"/>
      <path d="M20 -127 C 24 -112 23 -91 21 -78 C 16 -75 11 -73 7 -72 C 12 -94 13 -113 11 -132Z" fill="#fffaf0" opacity=".7"/>
      <path d="M-23 -88 C -9 -82 10 -83 23 -89" fill="none" stroke="#efa3ae" stroke-width="3.1" stroke-linecap="round" opacity=".72"/>
      <path d="M-24 -76 C -12 -69 12 -69 24 -77" fill="none" stroke="#e7c1ad" stroke-width="2" stroke-linecap="round" opacity=".75"/>
      ${heart(-8, -108, 8.5, { fill: "#e88fa8", opacity: 0.9 })}

      <!-- camera on a strap -->
      <path d="M-15 -126 C -5 -115 10 -105 19 -96" fill="none" stroke="#9a6d64" stroke-width="1.6" opacity=".55"/>
      <g transform="translate(6 -94) rotate(3)">
        <rect x="-10" y="-7" width="20" height="14" rx="4" fill="${COLORS.mint}"/>
        <rect x="-5" y="-9" width="9" height="4" rx="1.5" fill="#8bbcab"/>
        <circle cx="1" cy="0" r="5" fill="#577f79"/>
        <circle cx="1" cy="0" r="3.2" fill="#b8e0d3"/>
        <circle cx="-0.8" cy="-1.2" r="1" fill="#fff" opacity=".8"/>
        <circle cx="7" cy="-4" r="1.2" fill="#f6cf91"/>
      </g>

      <!-- scarf -->
      <path d="M-18 -131 C -8 -124 8 -124 17 -133 C 19 -128 18 -123 14 -119 C 3 -114 -10 -116 -20 -124 C -22 -128 -21 -131 -18 -131Z" fill="#e98fa8"/>
      <path d="M-14 -126 C -20 -117 -26 -110 -33 -105 C -35 -110 -32 -116 -26 -122 C -22 -126 -18 -128 -14 -126Z" fill="#dc7998"/>
      <path d="M-33 -105 C -28 -108 -24 -110 -20 -111" fill="none" stroke="#ffc5d1" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>

      <!-- head -->
      <g class="boy-head head">
        <path d="M-27 -170 C -37 -156 -35 -143 -25 -138 C -24 -148 -23 -158 -19 -166Z" fill="${hair}"/>
        <ellipse cx="1" cy="-160" rx="28" ry="27.5" fill="${skin}"/>
        <ellipse cx="-4" cy="-155" rx="17" ry="19" fill="${COLORS.skinShade}" opacity=".16"/>

        <!-- hair -->
        <path d="M-26 -168 C -30 -185 -17 -195 1 -193 C 17 -192 27 -182 26 -169 C 19 -177 10 -179 4 -171 C -1 -181 -15 -183 -26 -168Z" fill="${hair}"/>
        <path d="M-26 -166 C -33 -158 -32 -148 -24 -143 C -21 -148 -20 -157 -17 -163Z" fill="${hair}"/>
        <path d="M22 -180 C 27 -186 33 -182 29 -176 C 34 -171 30 -164 26 -168Z" fill="${hair}"/>
        <path d="M-16 -184 C -5 -190 9 -190 19 -183" fill="none" stroke="${COLORS.hairLight}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
        <path d="M12 -190 C 15 -196 21 -197 24 -193 C 20 -193 17 -190 17 -187Z" fill="${hair}"/>

        <!-- face -->
        <path d="M29 -158 C 32 -157 32 -153 29 -152" fill="${skin}" stroke="${COLORS.skinShade}" stroke-width="1" stroke-linecap="round"/>
        <path d="M11 -176 C 14 -178 18 -177 20 -174" fill="none" stroke="#6d4443" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
        <circle cx="13" cy="-151" r="6.3" fill="#f5a0a4" opacity=".5"/>
        <g class="eye boy-eye">
          <ellipse cx="17" cy="-163" rx="2.5" ry="3.4" fill="#55343b"/>
          <circle cx="17.8" cy="-164.3" r=".95" fill="#fff9ec"/>
          <path d="M14 -167.5 C 16 -169 19 -169 21 -167" fill="none" stroke="#55343b" stroke-width="1.4" stroke-linecap="round"/>
        </g>
        <path d="M18 -150 C 21 -146 25 -146 27 -149" fill="none" stroke="#ad5964" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M6 -141 C 10 -139 14 -140 16 -142" fill="none" stroke="${COLORS.skinShade}" stroke-width="1" stroke-linecap="round" opacity=".55"/>
      </g>

      <!-- near arm reaching back to her -->
      <path d="M-17 -121 C -29 -116 -40 -109 -49 -104" fill="none" stroke="${COLORS.cream}" stroke-width="10.5" stroke-linecap="round"/>
      <path d="M-45 -107 C -48 -105 -50 -103 -51 -101" fill="none" stroke="${skin}" stroke-width="6.5" stroke-linecap="round"/>
      <circle cx="-51" cy="-101" r="4.8" fill="${skin}"/>
      <circle cx="-17" cy="-122" r="8.5" fill="${COLORS.cream}"/>
    </g>`;
  }

  function buildCouple(layer) {
    const balloon = `<g class="balloon-assembly" transform="translate(-95 -90)">
      <g class="balloon-sway">
        <path d="M0 0 C -17 -41 -8 -101 -36 -147" fill="none" stroke="#d48194" stroke-width="1.25" stroke-linecap="round" opacity=".82"/>
        <g transform="translate(-38 -158)">
          <path d="M0 -38 C -6 -59 -40 -57 -40 -35 C -40 -16 -12 -5 0 8 C 12 -5 40 -16 40 -35 C 40 -57 6 -59 0 -38Z" fill="#f07f9e"/>
          <path d="M-27 -38 C -32 -49 -25 -59 -13 -55 C -7 -49 -16 -33 -27 -38Z" fill="#ffb3c4" opacity=".55"/>
          <ellipse cx="-11" cy="-39" rx="7" ry="12" transform="rotate(-25 -11 -39)" fill="#fff1f0" opacity=".55"/>
          <path d="M0 8 L -6 16 L 6 16Z" fill="#d6577d"/>
          <path d="M0 14 C -10 9 -16 18 -7 20 C -3 21 0 18 0 14Z" fill="#ffd2dc"/>
          <path d="M0 14 C 8 8 15 15 8 20 C 4 23 1 18 0 14Z" fill="#ffd2dc"/>
          <circle cx="0" cy="16" r="2.3" fill="${COLORS.gold}"/>
        </g>
      </g>
    </g>`;

    layer.innerHTML = `<g class="couple-root">
      <g class="couple-shadow" opacity=".9">
        <ellipse cx="0" cy="3" rx="102" ry="12" fill="#b94f71" opacity=".16"/>
        <ellipse cx="1" cy="1" rx="65" ry="7" fill="#a84264" opacity=".12"/>
      </g>
      <g class="couple-bob">
        ${balloon}
        ${buildGirl()}
        ${buildBoy()}
        <g class="joined-hands">
          <circle cx="-4" cy="-101" r="4.6" fill="${COLORS.skin}"/>
          <circle cx="3" cy="-102" r="4.8" fill="${COLORS.skin}"/>
          <path d="M-4 -103 C -1 -105 2 -105 5 -103" fill="none" stroke="${COLORS.skinShade}" stroke-width="1.1" stroke-linecap="round"/>
          <path d="M-4 -99 C -1 -98 2 -98 5 -100" fill="none" stroke="${COLORS.skinShade}" stroke-width="1" stroke-linecap="round" opacity=".8"/>
          <g class="hand-heart" opacity=".92">
            ${heart(0, -119, 11, { fill: "#e87698" })}
            <circle cx="8" cy="-122" r="1" fill="#fff7e8"/>
            <circle cx="-8" cy="-114" r=".8" fill="#fff7e8"/>
          </g>
        </g>
      </g>
    </g>`;

    const root = layer.querySelector(".couple-root");
    const girl = root.querySelector(".girl");
    const boy = root.querySelector(".boy");
    return {
      root,
      bob: root.querySelector(".couple-bob"),
      girl,
      boy,
      hands: root.querySelector(".joined-hands"),
      balloon: root.querySelector(".balloon-sway"),
      parts: {
        girlFarUpper: girl.querySelector(".leg-far .leg-upper"),
        girlFarLower: girl.querySelector(".leg-far .leg-lower"),
        girlNearUpper: girl.querySelector(".leg-near .leg-upper"),
        girlNearLower: girl.querySelector(".leg-near .leg-lower"),
        boyFarUpper: boy.querySelector(".leg-far .leg-upper"),
        boyFarLower: boy.querySelector(".leg-far .leg-lower"),
        boyNearUpper: boy.querySelector(".leg-near .leg-upper"),
        boyNearLower: boy.querySelector(".leg-near .leg-lower"),
        boyFreeArm: boy.querySelector(".boy-free-arm"),
        girlFreeArm: girl.querySelector(".girl-free-arm"),
        girlHead: girl.querySelector(".girl-head"),
        boyHead: boy.querySelector(".boy-head")
      }
    };
  }

  function wrapTwoLines(text, max) {
    const str = String(text || "").trim();
    if (!str) return ["和你在一起的", "某一天"];
    const chars = Array.from(str);
    if (chars.length <= max) return [str];
    const lines = [];
    let current = "";
    let width = 0;
    for (const ch of chars) {
      const w = /[　-鿿＀-￯]/.test(ch) ? 1 : 0.58;
      if (width + w > max && current) {
        lines.push(current);
        current = "";
        width = 0;
        if (lines.length === 2) {
          current = "…";
          break;
        }
      }
      current += ch;
      width += w;
    }
    if (current && lines.length < 2) lines.push(current);
    if (lines.length === 2 && lines[1].length > max + 2) {
      lines[1] = Array.from(lines[1]).slice(0, Math.ceil(max)).join("") + "…";
    }
    return lines;
  }

  function buildMemory(layer, opts) {
    const { photo, index, x, y, angle, clipId, dispW, dispH } = opts;
    const W = dispW || 220;
    const H = dispH || 180;
    const href = esc(photo.src);
    const thumb = photo.thumb ? esc(photo.thumb) : "";
    const preview = thumb ? ` href="${thumb}" data-thumb="1"` : "";
    const radius = Math.min(10, Math.min(W, H) * 0.04);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "memory");
    group.setAttribute("data-index", String(index));
    group.setAttribute("opacity", "1");
    group.setAttribute("transform", `translate(${x} ${y})`);
    group.innerHTML = `
      <g class="memory-tilt" transform="rotate(${angle})">
        <g class="memory-anim" transform="scale(1) rotate(0)">
          <rect x="${-W - 5}" y="${-H + 8}" width="${W}" height="${H}" rx="${radius}" fill="#8e405c" opacity=".13"/>
          <clipPath id="${clipId}">
            <rect x="${-W}" y="${-H}" width="${W}" height="${H}" rx="${radius}"/>
          </clipPath>
          <rect x="${-W}" y="${-H}" width="${W}" height="${H}" rx="${radius}" fill="#fff7ee"/>
          <image class="memory-photo"${preview} data-src="${href}" x="${-W}" y="${-H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
          <rect x="${-W}" y="${-H}" width="${W}" height="${H}" rx="${radius}" fill="none" stroke="#fff8ef" stroke-width="2.6" opacity=".92"/>
          <rect x="${-W + 1.4}" y="${-H + 1.4}" width="${W - 2.8}" height="${H - 2.8}" rx="${Math.max(2, radius - 1.4)}" fill="none" stroke="#e7c8d1" stroke-width=".7" opacity=".55"/>
          <rect class="memory-hit" x="${-W}" y="${-H}" width="${W}" height="${H}" rx="${radius}" fill="transparent" tabindex="0" role="button" aria-label="查看第 ${index + 1} 张照片"/>
        </g>
      </g>`;
    layer.appendChild(group);
    return {
      group,
      anim: group.querySelector(".memory-anim"),
      image: group.querySelector(".memory-photo"),
      hit: group.querySelector(".memory-hit"),
      angle
    };
  }

  function buildMarker(layer, opts) {
    const { x, y, index } = opts;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "memory-marker");
    group.setAttribute("data-marker", String(index));
    group.setAttribute("transform", `translate(${x} ${y})`);
    group.innerHTML = `<g class="marker-inner">
      <ellipse cx="0" cy="2" rx="17" ry="4.5" fill="#b34d70" opacity=".14"/>
      <circle cx="0" cy="-2" r="16" fill="#fff5e8" opacity=".42"/>
      <circle cx="0" cy="-2" r="10.5" fill="#fff9f1" opacity=".9"/>
      ${heart(0, -3, 16, { fill: "#ec7c9c" })}
      <circle cx="-2.6" cy="-6.5" r="1.7" fill="#fff9f2" opacity=".9"/>
    </g>`;
    layer.appendChild(group);
    return group;
  }

  function buildFinale(layer, x, y) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "finale");
    group.setAttribute("transform", `translate(${x} ${y})`);
    group.innerHTML = `<g class="finale-inner">
      <ellipse cx="0" cy="6" rx="95" ry="13" fill="#ad4c6d" opacity=".12"/>
      <circle cx="0" cy="-190" r="102" fill="#fff0e1" opacity=".22"/>
      <circle cx="0" cy="-190" r="74" fill="#fff8ed" opacity=".22"/>
      <path d="M -55 0 C -54 -90 -37 -145 0 -186" fill="none" stroke="#d9a76f" stroke-width="2" opacity=".75"/>
      <path d="M 55 0 C 54 -90 37 -145 0 -186" fill="none" stroke="#d9a76f" stroke-width="2" opacity=".75"/>
      <path d="M -55 0 C -54 -90 -37 -145 0 -186" fill="none" stroke="#fff2dd" stroke-width=".8" opacity=".9"/>
      <path d="M 55 0 C 54 -90 37 -145 0 -186" fill="none" stroke="#fff2dd" stroke-width=".8" opacity=".9"/>
      ${heart(0, -202, 68, { fill: "none", stroke: "#fff4e5", strokeWidth: 2.2, opacity: 0.9 })}
      ${heart(0, -202, 54, { fill: "#f08caa", opacity: 0.94 })}
      ${heart(0, -204, 24, { fill: "#fff1e3", opacity: 0.9 })}
      <circle cx="-75" cy="-244" r="3" fill="#fff3df" opacity=".9"/>
      <circle cx="68" cy="-258" r="2.4" fill="#fff3df" opacity=".8"/>
      <circle cx="87" cy="-168" r="2.8" fill="#fff3df" opacity=".8"/>
      <circle cx="-94" cy="-171" r="2" fill="#fff3df" opacity=".8"/>
      ${flower(-39, -81, 0.95, "#fff7ea", "#e5b66c")}
      ${flower(43, -113, 0.8, "#ffdfe8", "#d9a45d")}
      ${flower(25, -43, 0.7, "#fff2e2", "#e5b66c")}
      <g transform="translate(0 -110)">
        <rect x="-53" y="-12" width="106" height="26" rx="5" fill="#fff7ec" opacity=".9"/>
        <text x="0" y="5" text-anchor="middle" font-family="Georgia, serif" font-size="8" letter-spacing="2.3" fill="#a66e7c">TO BE CONTINUED</text>
        <path d="M -53 -3 L -65 1 L -53 7Z" fill="#f4c8d2"/>
        <path d="M 53 -3 L 65 1 L 53 7Z" fill="#f4c8d2"/>
      </g>
    </g>`;
    layer.appendChild(group);
    return group;
  }

  function buildBackground(svg, w, h) {
    const s = Math.min(w, h);
    const hearts = [
      [0.08, 0.28, 0.9, 11, 0.26, -14],
      [0.2, 0.15, 1.1, 7, 0.22, 12],
      [0.92, 0.39, 0.75, 15, 0.18, 18],
      [0.75, 0.08, 0.6, 9, 0.24, -8],
      [0.47, 0.17, 0.4, 6, 0.2, 22],
      [0.87, 0.69, 0.5, 8, 0.16, -16],
      [0.13, 0.7, 0.65, 13, 0.16, 8],
      [0.37, 0.28, 0.7, 9, 0.18, 14],
      [0.51, 0.1, 0.5, 7, 0.2, -10],
      [0.7, 0.24, 0.55, 8, 0.15, 20],
      [0.31, 0.43, 0.42, 5, 0.2, -18]
    ];
    let markup = `<defs>
      <radialGradient id="sunGlow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#fff9e8" stop-opacity=".92"/>
        <stop offset=".45" stop-color="#fff2d5" stop-opacity=".48"/>
        <stop offset="1" stop-color="#ffe9d5" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffdf7" stop-opacity=".9"/>
        <stop offset="1" stop-color="#ffe9ec" stop-opacity=".4"/>
      </linearGradient>
    </defs>
    <circle cx="${w * 0.84}" cy="${h * 0.12}" r="${s * 0.29}" fill="url(#sunGlow)"/>
    <circle cx="${w * 0.84}" cy="${h * 0.12}" r="${s * 0.125}" fill="#fff9ec" opacity=".44"/>
    <circle cx="${w * 0.84}" cy="${h * 0.12}" r="${s * 0.084}" fill="#fffdf6" opacity=".34"/>`;

    // clouds, fixed in the sky and lazily drifting
    markup += `<g transform="translate(${w * 0.08} ${h * 0.22}) scale(${0.85 + s / 1800})">
      <g class="bg-drift" style="animation-duration:28s">
        ${cloud(0, 0, 1.1, "#fffaf3", 0.46)}
      </g>
    </g>`;
    markup += `<g transform="translate(${w * 0.79} ${h * 0.31}) scale(${0.52 + s / 2600})">
      <g class="bg-drift" style="animation-duration:36s;animation-direction:alternate-reverse">
        <g fill="#fff9f3" opacity=".38">
          <ellipse cx="0" cy="0" rx="66" ry="23"/>
          <circle cx="-35" cy="-10" r="25"/>
          <circle cx="0" cy="-19" r="31"/>
          <circle cx="37" cy="-7" r="22"/>
        </g>
      </g>
    </g>`;
    markup += `<g transform="translate(${w * 0.17} ${h * 0.55}) scale(${0.38 + s / 3200})">
      <g class="bg-drift" style="animation-duration:32s">
        <g fill="#fff9f3" opacity=".28">
          <ellipse cx="0" cy="0" rx="84" ry="25"/>
          <circle cx="-45" cy="-12" r="28"/>
          <circle cx="-3" cy="-22" r="37"/>
          <circle cx="49" cy="-9" r="25"/>
        </g>
      </g>
    </g>`;

    // small birds, far away
    markup += `<g fill="none" stroke="#b57683" stroke-width="1.2" stroke-linecap="round" opacity=".28">
      <path d="M ${w * 0.62} ${h * 0.17} q 5 -5 10 0 q 5 -5 10 0"/>
      <path d="M ${w * 0.66} ${h * 0.14} q 4 -4 8 0 q 4 -4 8 0"/>
      <path d="M ${w * 0.58} ${h * 0.13} q 3 -3 6 0 q 3 -3 6 0"/>
    </g>`;

    // floating hearts
    hearts.forEach((it, i) => {
      const [px, py, sc, size, op, rot] = it;
      markup += `<g transform="translate(${w * px} ${h * py}) scale(${sc})">
        <g class="bg-float" style="animation-delay:-${i * 1.3}s;animation-duration:${8 + i * 0.8}s">
          ${heart(0, 0, size, { fill: i % 3 === 0 ? "#ef89a5" : "#fff7ef", opacity: op, rotate: rot })}
        </g>
      </g>`;
    });

    // tiny sparkles
    for (let i = 0; i < 14; i++) {
      const px = (i * 0.173 + 0.13) % 1;
      const py = (i * 0.291 + 0.08) % 1;
      const size = 2.2 + (i % 3) * 1.2;
      markup += `<g transform="translate(${px * w} ${py * h})"><g class="bg-float" style="animation-delay:-${i * 0.7}s;animation-duration:${7 + (i % 4)}s">${sparkle(0, 0, size, "#fff6df", 0.46)}</g></g>`;
    }

    svg.innerHTML = markup;
  }

  /* ---------------------------------------------------------
     Demo "photos" – small original illustrations, used until
     the real photos are added.
     --------------------------------------------------------- */

  function svgData(inner, defs) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700" viewBox="0 0 800 700">${defs || ""}${inner}</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function tinyCouple(x, y, scale, color, opacity) {
    return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}" opacity="${opacity == null ? 1 : opacity}">
      <circle cx="-18" cy="-57" r="9"/>
      <path d="M-28 -46 C -30 -34 -34 -20 -36 -6 L -20 -6 C -20 -18 -20 -31 -17 -42Z"/>
      <circle cx="13" cy="-63" r="10"/>
      <path d="M2 -52 C 1 -38 1 -24 3 -6 L 20 -6 C 19 -22 19 -36 22 -50Z"/>
      <path d="M-17 -41 C -8 -36 0 -36 8 -42" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
      <path d="M-24 -3 L -15 -3" stroke="${color}" stroke-width="2" opacity=".2"/>
    </g>`;
  }

  function demoPhoto(kind) {
    const baseDefs = `<defs>
      <linearGradient id="dSky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffddca"/><stop offset="1" stop-color="#f6b9cb"/></linearGradient>
      <linearGradient id="dSea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e991ad"/><stop offset="1" stop-color="#d57498"/></linearGradient>
      <linearGradient id="dNight" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8c6b9a"/><stop offset=".55" stop-color="#b881a2"/><stop offset="1" stop-color="#e2a2b8"/></linearGradient>
      <linearGradient id="dDusk" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c7b3e0"/><stop offset=".55" stop-color="#e9b0cb"/><stop offset="1" stop-color="#ffd9cf"/></linearGradient>
      <linearGradient id="dCream" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff0db"/><stop offset="1" stop-color="#ffd9d6"/></linearGradient>
      <linearGradient id="dTulip" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffe9c7"/><stop offset="1" stop-color="#f7c0c7"/></linearGradient>
      <radialGradient id="dSun" cx=".5" cy=".5" r=".5"><stop stop-color="#fff8dc"/><stop offset="1" stop-color="#ffedbd"/></radialGradient>
      <radialGradient id="dGlow" cx=".5" cy=".5" r=".5"><stop stop-color="#fff7df" stop-opacity=".85"/><stop offset="1" stop-color="#fff7df" stop-opacity="0"/></radialGradient>
    </defs>`;

    if (kind === "sea") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="url(#dSky)"/>
        <circle cx="590" cy="180" r="88" fill="url(#dSun)"/>
        <circle cx="590" cy="180" r="118" fill="url(#dGlow)" opacity=".62"/>
        <g fill="#fff5e3" opacity=".54">
          <ellipse cx="180" cy="190" rx="90" ry="24"/><circle cx="140" cy="177" r="28"/><circle cx="184" cy="166" r="35"/><circle cx="230" cy="184" r="23"/>
          <ellipse cx="660" cy="310" rx="66" ry="17"/><circle cx="635" cy="300" r="20"/><circle cx="668" cy="295" r="24"/>
        </g>
        <path d="M0 385 C 120 370 220 398 340 386 C 470 372 600 392 800 378 L800 700 L0 700Z" fill="url(#dSea)"/>
        <path d="M0 442 C 150 420 280 455 430 438 C 590 420 690 445 800 432 L800 700 L0 700Z" fill="#e58aa7" opacity=".72"/>
        <path d="M0 515 C 120 495 260 525 410 510 C 570 494 700 515 800 502 L800 700 L0 700Z" fill="#d8789b" opacity=".84"/>
        <g fill="none" stroke="#fff2e5" stroke-linecap="round" opacity=".65">
          <path d="M90 466 C 150 456 190 468 240 462" stroke-width="3"/>
          <path d="M420 505 C 490 496 530 508 590 499" stroke-width="2.4"/>
          <path d="M620 458 C 665 453 700 459 740 454" stroke-width="2.2"/>
          <path d="M180 579 C 250 570 310 580 380 572" stroke-width="2"/>
          <path d="M580 612 C 640 605 690 612 740 606" stroke-width="2"/>
        </g>
        <path d="M0 592 C 160 568 300 603 470 588 C 620 575 710 590 800 582 L800 700 L0 700Z" fill="#ffddca"/>
        <g opacity=".6" fill="none" stroke="#d79a91" stroke-width="2" stroke-linecap="round">
          <path d="M540 130 q 9 -9 18 0 q 9 -9 18 0"/>
          <path d="M600 95 q 7 -7 14 0 q 7 -7 14 0"/>
        </g>
        ${tinyCouple(334, 566, 1.38, "#8e5460", 0.92)}
        <g fill="none" stroke="#a9656d" stroke-width="2" opacity=".35">
          <path d="M300 589 C 370 594 420 590 466 585"/>
          <ellipse cx="383" cy="593" rx="120" ry="12"/>
        </g>
        <g fill="#fff2df" opacity=".88"><circle cx="112" cy="112" r="3"/><circle cx="248" cy="86" r="2"/><circle cx="706" cy="128" r="2.5"/></g>`);
    }

    if (kind === "rain") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="#e7cfe0"/>
        <rect width="800" height="700" fill="url(#dDusk)" opacity=".55"/>
        <circle cx="160" cy="160" r="210" fill="#fff4de" opacity=".2"/>
        <g fill="#b58ba9" opacity=".22">
          <rect x="0" y="330" width="135" height="370" rx="8"/>
          <rect x="155" y="280" width="100" height="420" rx="6"/>
          <rect x="678" y="350" width="122" height="350" rx="7"/>
          <rect x="580" y="300" width="76" height="400" rx="5"/>
          <rect x="270" y="365" width="80" height="335" rx="4"/>
        </g>
        <g stroke="#fff4e8" stroke-width="1.2" opacity=".33" stroke-linecap="round">
          <path d="M80 40 L52 128"/><path d="M226 30 L198 118"/><path d="M350 60 L322 148"/><path d="M530 22 L502 110"/><path d="M690 54 L662 142"/><path d="M760 210 L732 298"/><path d="M114 250 L86 338"/><path d="M310 250 L282 338"/><path d="M460 210 L432 298"/><path d="M620 250 L592 338"/><path d="M40 420 L12 508"/><path d="M740 430 L712 518"/>
        </g>
        <g transform="translate(400 396)">
          <path d="M-154 0 C -120 -112 -20 -150 36 -128 C 86 -108 120 -56 145 0Z" fill="#e86f8f"/>
          <path d="M-154 0 C -120 -112 -20 -150 36 -128 C 86 -108 120 -56 145 0Z" fill="none" stroke="#c95576" stroke-width="3" opacity=".35"/>
          <path d="M-152 0 C -96 14 -38 14 2 2 C 48 14 104 14 144 0" fill="none" stroke="#ffd9d4" stroke-width="9" stroke-linecap="round"/>
          <path d="M-150 3 q 17 18 34 0 q 17 18 34 0 q 17 18 34 0 q 17 18 34 0 q 17 18 34 0 q 17 18 34 0 q 17 18 34 0 q 17 18 34 0" fill="none" stroke="#ffd9d4" stroke-width="5" stroke-linecap="round"/>
          <path d="M0 -132 q -9 -32 13 -48" fill="none" stroke="#d8a7ae" stroke-width="3" stroke-linecap="round"/>
          <path d="M-6 5 C -4 54 -2 83 12 100" fill="none" stroke="#90616e" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M13 99 q 18 8 20 -4 q 2 -10 -17 -9" fill="none" stroke="#90616e" stroke-width="3.2" stroke-linecap="round"/>
          <g fill="#935d6d" opacity=".9">
            <circle cx="18" cy="43" r="11"/><path d="M4 58 C 8 70 25 72 35 60 L32 98 L6 98Z"/>
            <circle cx="-38" cy="56" r="10"/><path d="M-51 70 C -48 80 -30 82 -23 70 L-26 98 L-48 98Z"/>
          </g>
          <path d="M-8 73 C 2 80 13 80 23 72" fill="none" stroke="#935d6d" stroke-width="4" stroke-linecap="round"/>
        </g>
        <path d="M220 552 C 270 542 330 542 380 552 C 348 570 252 570 220 552Z" fill="#d7b0c6" opacity=".5"/>
        <g fill="none" stroke="#fff1e7" opacity=".6">
          <ellipse cx="300" cy="568" rx="66" ry="12"/>
          <ellipse cx="300" cy="568" rx="91" ry="17"/>
          <ellipse cx="300" cy="568" rx="118" ry="21"/>
        </g>
        ${heart(300, 558, 17, { fill: "#fff1e7", opacity: 0.35 })}
        <g fill="#fff3e8" opacity=".55"><circle cx="640" cy="590" r="3"/><circle cx="676" cy="560" r="2"/><circle cx="590" cy="620" r="2.4"/></g>`);
    }

    if (kind === "cat") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="#fff0df"/>
        <rect x="480" y="80" width="260" height="330" rx="135" fill="#f6c9d2"/>
        <rect x="480" y="80" width="260" height="330" rx="135" fill="none" stroke="#fff8ed" stroke-width="16" opacity=".8"/>
        <path d="M492 80 L492 410 M728 80 L728 410" stroke="#dca6ab" stroke-width="6" opacity=".4"/>
        <path d="M610 80 L610 410" stroke="#fff8ed" stroke-width="8" opacity=".75"/>
        <path d="M350 60 C 318 140 346 260 290 410" fill="none" stroke="#e7b7c1" stroke-width="5" opacity=".4"/>
        <circle cx="610" cy="235" r="88" fill="#fff2c8" opacity=".7"/>
        <path d="M0 540 C 120 525 260 530 390 540 C 540 552 680 528 800 542 L800 700 L0 700Z" fill="#f2d6c8"/>
        <path d="M0 620 C 180 600 330 616 520 610 C 650 606 740 614 800 608 L800 700 L0 700Z" fill="#e8c3b5" opacity=".6"/>
        <g transform="translate(292 540)">
          <ellipse cx="0" cy="40" rx="150" ry="38" fill="#e6c3b4"/>
          <ellipse cx="0" cy="30" rx="132" ry="34" fill="#f6d9ca"/>
          <path d="M-88 20 C -105 -32 -68 -84 -5 -93 C 66 -103 113 -55 100 3 C 92 42 56 64 6 62 C -41 60 -77 45 -88 20Z" fill="#a36c72"/>
          <path d="M-72 -20 C -63 20 -31 42 15 40 C 56 38 81 15 86 -12" fill="none" stroke="#c88d8b" stroke-width="9" stroke-linecap="round" opacity=".35"/>
          <path d="M-4 57 C 35 66 88 57 120 28 C 138 12 149 27 137 48 C 121 75 61 92 17 83Z" fill="#a36c72"/>
          <path d="M-60 -68 C -74 -96 -48 -108 -36 -85 C -26 -68 -34 -49 -45 -51 C -56 -54 -54 -61 -60 -68Z" fill="#a36c72"/>
          <path d="M47 -83 C 48 -111 75 -112 74 -87 C 73 -69 62 -57 55 -57 C 48 -57 47 -70 47 -83Z" fill="#a36c72"/>
          <path d="M-40 0 C -34 8 -24 8 -18 0" fill="none" stroke="#5d3d43" stroke-width="3" stroke-linecap="round"/>
          <path d="M46 0 C 52 8 62 8 68 0" fill="none" stroke="#5d3d43" stroke-width="3" stroke-linecap="round"/>
          <path d="M12 14 C 16 18 20 18 23 14" fill="none" stroke="#5d3d43" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M-36 20 L-22 24 M48 22 L62 18" stroke="#ddb4aa" stroke-width="2" opacity=".7"/>
        </g>
        <g transform="translate(577 490)">
          <path d="M0 23 C 0 12 10 4 21 6 C 34 8 38 22 30 32 L-13 32 C -25 20 -13 1 3 5" fill="#a8b795" opacity=".85"/>
          <path d="M-13 32 L34 32" stroke="#8a9b79" stroke-width="4" opacity=".5"/>
        </g>
        <g fill="#e9a4b3" opacity=".6">
          <circle cx="130" cy="170" r="7"/><circle cx="176" cy="132" r="4"/><circle cx="228" cy="212" r="5"/>
          <path d="M162 240 C 170 230 180 234 181 244 C 173 252 162 250 162 240Z"/>
        </g>
        ${heart(700, 200, 21, { fill: "#fff8e9", opacity: 0.55 })}`);
    }

    if (kind === "cake") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="#f5d9e0"/>
        <path d="M0 0 C 90 80 130 190 120 330 C 200 210 250 90 270 0Z" fill="#ffe8d2" opacity=".7"/>
        <circle cx="640" cy="180" r="200" fill="#fff3d0" opacity=".25"/>
        <g fill="#fff4e6" opacity=".7">
          <circle cx="690" cy="92" r="6"/><circle cx="740" cy="160" r="4"/><circle cx="110" cy="95" r="4"/><circle cx="250" cy="180" r="3"/><circle cx="700" cy="270" r="3"/><circle cx="120" cy="250" r="3"/>
          <path d="M445 105 l7 17 17 7 -17 7 -7 17 -7-17 -17-7 17-7Z"/>
        </g>
        <path d="M0 575 L800 575 L800 700 L0 700Z" fill="#e7a9b7"/>
        <path d="M0 575 L800 575 L800 600 L0 600Z" fill="#f7cbd1"/>
        <g transform="translate(410 470)">
          <ellipse cx="0" cy="123" rx="252" ry="28" fill="#a86174" opacity=".16"/>
          <ellipse cx="0" cy="104" rx="230" ry="40" fill="#fff4e4"/>
          <path d="M-165 100 L-145 0 C -142 -25 142 -25 145 0 L165 100 C 145 122 -143 122 -165 100Z" fill="#fff0db"/>
          <path d="M-145 0 C -80 -13 80 -13 145 0 L150 24 C 100 42 72 12 30 30 C -8 48 -46 43 -72 30 C -104 14 -130 37 -148 24Z" fill="#f18ca4"/>
          <path d="M-154 82 C -113 100 -84 72 -41 94 C -7 112 30 94 72 88 C 111 82 135 98 159 84 L165 100 C 145 122 -143 122 -165 100Z" fill="#e9c4b2" opacity=".45"/>
          <path d="M-140 34 C -80 52 -40 28 0 46 C 40 64 96 41 144 34" fill="none" stroke="#fff8ee" stroke-width="14" stroke-linecap="round"/>
          <path d="M-125 -55 C -118 -95 -76 -112 -40 -93 C -3 -74 6 -104 41 -104 C 77 -104 103 -76 100 -48 C 73 -26 46 -47 16 -30 C -14 -13 -50 -29 -80 -22 C -108 -15 -130 -34 -125 -55Z" fill="#fff3df"/>
          <path d="M-124 -58 C -106 -47 -95 -63 -78 -55 C -60 -46 -48 -58 -30 -49 C -11 -40 8 -54 29 -44 C 50 -34 72 -48 96 -48" fill="none" stroke="#f2c9c1" stroke-width="5" stroke-linecap="round" opacity=".7"/>
          <g>
            <rect x="-58" y="-142" width="7" height="46" rx="3.5" fill="#e894a6"/>
            <path d="M-54 -142 C -64 -154 -48 -168 -44 -151 C -47 -146 -50 -143 -54 -142Z" fill="#f2b34f"/>
            <rect x="18" y="-138" width="7" height="44" rx="3.5" fill="#e894a6"/>
            <path d="M22 -138 C 12 -150 28 -164 32 -147 C 29 -142 26 -139 22 -138Z" fill="#f2b34f"/>
          </g>
          <g>
            <circle cx="-80" cy="-62" r="16" fill="#ec7390"/><circle cx="-80" cy="-62" r="8" fill="#ffadb4"/>
            <path d="M-88 -76 q -8 -13 4 -15 q 11 2 4 15" fill="#9dbd87"/>
            <circle cx="82" cy="-55" r="14" fill="#ec7390"/><circle cx="82" cy="-55" r="7" fill="#ffadb4"/>
            <path d="M76 -67 q -7 -12 3 -14 q 10 2 4 14" fill="#9dbd87"/>
            <circle cx="3" cy="-84" r="12" fill="#ec7390"/><circle cx="3" cy="-84" r="6" fill="#ffadb4"/>
          </g>
          <g fill="#fff9ef">
            <circle cx="-110" cy="9" r="3"/><circle cx="-85" cy="17" r="2"/><circle cx="-40" cy="7" r="2.4"/><circle cx="95" cy="12" r="2"/><circle cx="60" cy="18" r="2.4"/>
          </g>
        </g>
        <g stroke="#8a5962" stroke-width="1.3" opacity=".24" fill="none">
          <path d="M70 470 C 110 440 170 435 220 455"/><path d="M640 430 C 680 400 730 410 760 450"/>
        </g>
        ${heart(675, 380, 30, { fill: "#f2859f", opacity: 0.24 })}`);
    }

    if (kind === "train") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="#ffe6cf"/>
        <circle cx="620" cy="190" r="115" fill="#fff6d9" opacity=".8"/>
        <circle cx="620" cy="190" r="165" fill="#fff6d9" opacity=".22"/>
        <path d="M-30 420 C 95 300 220 330 310 390 C 400 450 470 310 590 340 C 690 365 730 420 830 390 L830 700 L-30 700Z" fill="#e8a3b3" opacity=".7"/>
        <path d="M-30 500 C 100 400 210 430 330 490 C 440 545 560 430 690 455 C 760 468 790 500 830 480 L830 700 L-30 700Z" fill="#d98aa3" opacity=".65"/>
        <path d="M0 590 C 130 545 260 570 390 585 C 520 600 650 555 800 580 L800 700 L0 700Z" fill="#f6d7c4"/>
        <g fill="#fff4e4" opacity=".7">
          <ellipse cx="140" cy="160" rx="70" ry="19"/><circle cx="108" cy="150" r="23"/><circle cx="147" cy="141" r="28"/><circle cx="185" cy="155" r="19"/>
          <ellipse cx="440" cy="235" rx="58" ry="16"/><circle cx="416" cy="226" r="19"/><circle cx="447" cy="218" r="23"/><circle cx="477" cy="230" r="16"/>
        </g>
        <g transform="translate(408 565)">
          <path d="M-240 76 L310 76" stroke="#9d6c6f" stroke-width="5" opacity=".5"/>
          <path d="M-250 96 L320 96" stroke="#9d6c6f" stroke-width="2" opacity=".3"/>
          <g fill="#a46372">
            <rect x="-95" y="-20" width="150" height="76" rx="16"/>
            <rect x="-40" y="-74" width="82" height="56" rx="12"/>
            <rect x="-184" y="10" width="76" height="46" rx="12"/>
            <rect x="64" y="14" width="84" height="42" rx="12"/>
            <rect x="156" y="10" width="74" height="46" rx="12"/>
          </g>
          <g fill="#ffe6d1">
            <rect x="-72" y="-5" width="30" height="27" rx="5"/>
            <rect x="-29" y="-5" width="30" height="27" rx="5"/>
            <rect x="14" y="-5" width="28" height="27" rx="5"/>
            <rect x="-24" y="-62" width="48" height="28" rx="6"/>
            <rect x="-170" y="20" width="22" height="20" rx="4"/><rect x="-137" y="20" width="22" height="20" rx="4"/>
            <rect x="78" y="24" width="20" height="18" rx="4"/><rect x="108" y="24" width="20" height="18" rx="4"/>
            <rect x="235" y="20" width="20" height="18" rx="4"/>
          </g>
          <circle cx="-65" cy="59" r="16" fill="#6e4f54"/><circle cx="-65" cy="59" r="7" fill="#c89693"/>
          <circle cx="20" cy="59" r="16" fill="#6e4f54"/><circle cx="20" cy="59" r="7" fill="#c89693"/>
          <circle cx="-142" cy="59" r="12" fill="#6e4f54"/><circle cx="110" cy="59" r="12" fill="#6e4f54"/><circle cx="196" cy="59" r="12" fill="#6e4f54"/>
          <path d="M-59 -74 C -56 -114 -31 -126 2 -132 C 35 -138 57 -119 65 -89" fill="none" stroke="#fff0df" stroke-width="16" stroke-linecap="round" opacity=".8"/>
          <g fill="#fff5e9" opacity=".8"><circle cx="-49" cy="-107" r="17"/><circle cx="-20" cy="-128" r="23"/><circle cx="18" cy="-128" r="18"/><circle cx="48" cy="-108" r="14"/></g>
          <path d="M-111 67 L-111 88" stroke="#8b5c65" stroke-width="2"/><path d="M238 67 L238 88" stroke="#8b5c65" stroke-width="2"/>
        </g>
        <g transform="translate(220 420) scale(.85)">
          <circle cx="0" cy="0" r="49" fill="#f4c66d" opacity=".22"/>
          <circle cx="0" cy="0" r="38" fill="none" stroke="#f4c66d" stroke-width="2" opacity=".5"/>
          <g fill="#e8879c" opacity=".6"><circle cx="-29" cy="-9" r="11"/><circle cx="30" cy="7" r="12"/><circle cx="-6" cy="31" r="9"/></g>
        </g>
        <g fill="#fff5e4" opacity=".6"><circle cx="710" cy="430" r="3"/><circle cx="745" cy="395" r="2"/><circle cx="670" cy="470" r="2"/></g>`);
    }

    if (kind === "ferris") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="url(#dNight)"/>
        <circle cx="640" cy="140" r="250" fill="#ffe9cf" opacity=".12"/>
        <circle cx="660" cy="126" r="54" fill="#fff4df" opacity=".9"/>
        <circle cx="680" cy="108" r="48" fill="#dca7c5" opacity=".55"/>
        <g fill="#fff1df" opacity=".55">
          <circle cx="160" cy="110" r="2.5"/><circle cx="260" cy="70" r="2"/><circle cx="370" cy="150" r="3"/><circle cx="500" cy="90" r="2"/><circle cx="760" cy="200" r="2"/><circle cx="100" cy="240" r="2"/><circle cx="720" cy="300" r="2.5"/><circle cx="320" cy="240" r="1.6"/>
        </g>
        <g transform="translate(410 395)">
          <circle cx="0" cy="0" r="236" fill="none" stroke="#ffe9d8" stroke-width="3" opacity=".5"/>
          <circle cx="0" cy="0" r="224" fill="none" stroke="#ffe9d8" stroke-width="1.2" opacity=".3"/>
          <g stroke="#ffe9d8" stroke-width="2" opacity=".4">
            <path d="M0 0 L0 -224"/><path d="M0 0 L107 -196"/><path d="M0 0 L196 -107"/><path d="M0 0 L224 0"/><path d="M0 0 L196 107"/><path d="M0 0 L107 196"/><path d="M0 0 L0 224"/><path d="M0 0 L-107 196"/><path d="M0 0 L-196 107"/><path d="M0 0 L-224 0"/><path d="M0 0 L-196 -107"/><path d="M0 0 L-107 -196"/>
          </g>
          <g fill="#ffe4d2">
            <circle cx="0" cy="-224" r="7"/><circle cx="107" cy="-196" r="7"/><circle cx="196" cy="-107" r="7"/><circle cx="224" cy="0" r="7"/><circle cx="196" cy="107" r="7"/><circle cx="107" cy="196" r="7"/><circle cx="0" cy="224" r="7"/><circle cx="-107" cy="196" r="7"/><circle cx="-196" cy="107" r="7"/><circle cx="-224" cy="0" r="7"/><circle cx="-196" cy="-107" r="7"/><circle cx="-107" cy="-196" r="7"/>
          </g>
          <g fill="#f19bb0">
            <g transform="translate(0 -224)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
            <g transform="translate(107 -196)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
            <g transform="translate(196 -107)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
            <g transform="translate(224 0)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
            <g transform="translate(107 196)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
            <g transform="translate(-107 196)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
            <g transform="translate(-224 0)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
            <g transform="translate(-107 -196)"><rect x="-15" y="5" width="30" height="23" rx="5"/><path d="M-15 5 Q0 -5 15 5" fill="#ffe9d8"/></g>
          </g>
          <circle cx="0" cy="0" r="17" fill="#ffe4d2"/>
          <circle cx="0" cy="0" r="7" fill="#b57b92"/>
          <path d="M0 -17 L-92 315 M0 -17 L92 315" stroke="#e9cfc9" stroke-width="7" opacity=".55"/>
          <path d="M0 -17 L-92 315 M0 -17 L92 315" stroke="#ffece0" stroke-width="2" opacity=".6"/>
        </g>
        <path d="M0 592 C 100 540 200 555 310 585 C 430 618 540 550 650 565 C 720 575 760 590 800 576 L800 700 L0 700Z" fill="#705b80"/>
        <path d="M0 635 C 150 610 250 625 380 640 C 520 656 660 620 800 635 L800 700 L0 700Z" fill="#5f4a70"/>
        <g transform="translate(310 560)">
          <ellipse cx="0" cy="48" rx="90" ry="15" fill="#4a3b58" opacity=".5"/>
          ${tinyCouple(0, 40, 0.9, "#3f3148", 0.95)}
        </g>
        <g fill="#ffd9c3">
          <circle cx="730" cy="555" r="3"/><circle cx="760" cy="530" r="2"/><circle cx="700" cy="520" r="2"/>
        </g>
        <path d="M100 480 C 104 460 130 454 145 470 C 160 454 186 460 190 480 C 184 504 155 516 145 523 C 135 516 106 504 100 480Z" fill="#fbd9d6" opacity=".16"/>
        ${heart(610, 460, 26, { fill: "#ffe8dc", opacity: 0.2 })}`);
    }

    if (kind === "tulips") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="url(#dTulip)"/>
        <circle cx="176" cy="170" r="105" fill="#fff7da" opacity=".8"/>
        <circle cx="176" cy="170" r="155" fill="#fff7da" opacity=".2"/>
        <g fill="#fff6e4" opacity=".62">
          <ellipse cx="610" cy="170" rx="85" ry="22"/><circle cx="572" cy="158" r="27"/><circle cx="611" cy="147" r="32"/><circle cx="652" cy="161" r="23"/>
          <ellipse cx="390" cy="105" rx="56" ry="15"/><circle cx="370" cy="96" r="18"/><circle cx="397" cy="88" r="21"/>
        </g>
        <path d="M0 400 C 120 350 260 380 380 395 C 530 414 650 350 800 380 L800 700 L0 700Z" fill="#e8bfb1" opacity=".5"/>
        <path d="M0 465 C 120 420 260 455 380 465 C 540 480 650 430 800 455 L800 700 L0 700Z" fill="#c9b28f" opacity=".55"/>
        <g transform="translate(0 470)">
          <g stroke="#889f79" stroke-width="4" stroke-linecap="round" opacity=".65">
            <path d="M40 120 L36 220"/><path d="M96 130 L100 230"/><path d="M154 112 L150 218"/><path d="M175 155 L174 260"/>
            <path d="M660 95 L665 215"/><path d="M710 120 L705 230"/><path d="M760 105 L762 220"/><path d="M620 155 L618 250"/>
          </g>
          <g fill="#ef9caf">
            <path d="M22 98 C 23 74 41 63 48 78 C 57 63 73 75 72 99 C 70 122 55 130 49 139 C 41 128 21 120 22 98Z"/>
            <path d="M82 108 C 82 84 101 73 108 88 C 117 73 134 86 132 110 C 130 134 113 142 107 152 C 99 140 82 132 82 108Z"/>
            <path d="M144 94 C 144 70 163 59 170 74 C 179 59 196 72 194 96 C 192 120 175 128 169 138 C 161 126 144 118 144 94Z"/>
            <path d="M650 76 C 650 52 669 41 676 56 C 685 41 702 54 700 78 C 698 102 681 110 675 120 C 667 108 650 100 650 76Z"/>
            <path d="M704 100 C 704 76 723 65 730 80 C 739 65 756 78 754 102 C 752 126 735 134 729 144 C 721 132 704 124 704 100Z"/>
            <path d="M748 82 C 748 58 767 47 774 62 C 783 47 800 60 798 84 C 796 108 779 116 773 126 C 765 114 748 106 748 82Z"/>
          </g>
          <g fill="#f7bcc2">
            <path d="M170 156 C 173 130 193 123 199 137 C 208 127 222 141 216 163 C 210 183 195 188 189 198 C 184 184 169 174 170 156Z"/>
            <path d="M608 139 C 611 113 631 106 637 120 C 646 110 660 124 654 146 C 648 166 633 171 627 181 C 622 167 607 157 608 139Z"/>
          </g>
        </g>
        <path d="M0 610 C 130 575 260 598 390 608 C 540 620 660 585 800 602 L800 700 L0 700Z" fill="#b3a47e" opacity=".5"/>
        <g transform="translate(400 570)">
          <ellipse cx="0" cy="55" rx="120" ry="16" fill="#8b8568" opacity=".28"/>
          ${tinyCouple(0, 35, 1.32, "#8e6670", 0.9)}
          <path d="M-79 26 C -58 8 -28 3 0 3 C 35 3 60 14 82 29" fill="none" stroke="#8e6670" stroke-width="3" stroke-linecap="round" opacity=".45"/>
        </g>
        <g fill="#fff4df" opacity=".55">
          <circle cx="520" cy="280" r="2.5"/><circle cx="570" cy="250" r="2"/><circle cx="250" cy="300" r="2"/><circle cx="680" cy="300" r="2"/>
          <path d="M540 380 C 547 364 562 362 568 374 C 574 362 590 365 594 380 C 588 394 568 402 566 408 C 560 399 544 392 540 380Z" opacity=".35"/>
        </g>
        <g transform="translate(610 420) rotate(-10)">
          <path d="M0 0 C 14 -14 30 -4 25 9 C 20 22 2 26 -8 17 C -16 9 -10 -2 0 0Z" fill="#fff2dd" opacity=".7"/>
          <path d="M-1 2 C -10 6 -14 13 -13 20" fill="none" stroke="#fff2dd" stroke-width="1.5" opacity=".5"/>
        </g>`);
    }

    if (kind === "fireworks") {
      return svgData(`${baseDefs}
        <rect width="800" height="700" fill="#9d769d"/>
        <rect width="800" height="700" fill="url(#dNight)" opacity=".72"/>
        <circle cx="620" cy="130" r="260" fill="#ffe8d4" opacity=".1"/>
        <g stroke-linecap="round">
          <g transform="translate(240 190)" stroke="#ffdcc5" stroke-width="4" opacity=".9">
            <path d="M0 0 L0 -82"/><path d="M0 0 L58 -58"/><path d="M0 0 L82 0"/><path d="M0 0 L58 58"/><path d="M0 0 L0 82"/><path d="M0 0 L-58 58"/><path d="M0 0 L-82 0"/><path d="M0 0 L-58 -58"/>
            <path d="M0 0 L33 -75" opacity=".6"/><path d="M0 0 L75 -33" opacity=".6"/><path d="M0 0 L75 33" opacity=".6"/><path d="M0 0 L33 75" opacity=".6"/>
            <path d="M0 0 L-33 75" opacity=".6"/><path d="M0 0 L-75 33" opacity=".6"/><path d="M0 0 L-75 -33" opacity=".6"/><path d="M0 0 L-33 -75" opacity=".6"/>
          </g>
          <g transform="translate(560 260)" stroke="#ffc2cb" stroke-width="3" opacity=".8">
            <path d="M0 0 L0 -62"/><path d="M0 0 L44 -44"/><path d="M0 0 L62 0"/><path d="M0 0 L44 44"/><path d="M0 0 L0 62"/><path d="M0 0 L-44 44"/><path d="M0 0 L-62 0"/><path d="M0 0 L-44 -44"/>
            <path d="M0 0 L26 -56" opacity=".5"/><path d="M0 0 L56 -26" opacity=".5"/><path d="M0 0 L56 26" opacity=".5"/><path d="M0 0 L26 56" opacity=".5"/>
          </g>
          <g transform="translate(676 110)" stroke="#f8d1a2" stroke-width="2.4" opacity=".7">
            <path d="M0 0 L0 -46"/><path d="M0 0 L33 -33"/><path d="M0 0 L46 0"/><path d="M0 0 L33 33"/><path d="M0 0 L0 46"/><path d="M0 0 L-33 33"/><path d="M0 0 L-46 0"/><path d="M0 0 L-33 -33"/>
          </g>
        </g>
        <g fill="#ffe3c9" opacity=".8">
          <circle cx="176" cy="128" r="2"/><circle cx="332" cy="310" r="2"/><circle cx="420" cy="102" r="2.5"/><circle cx="740" cy="340" r="2"/><circle cx="510" cy="160" r="1.8"/><circle cx="100" cy="320" r="2"/>
        </g>
        <path d="M0 552 C 90 480 160 500 220 530 C 300 570 360 490 440 505 C 520 520 560 565 630 530 C 700 495 750 520 800 505 L800 700 L0 700Z" fill="#725470"/>
        <path d="M0 610 C 120 585 230 605 350 615 C 490 626 620 580 800 608 L800 700 L0 700Z" fill="#5c415c"/>
        <g fill="#4a334a" opacity=".9">
          <rect x="88" y="530" width="42" height="102" rx="3"/><rect x="150" y="500" width="55" height="132" rx="3"/><rect x="625" y="520" width="60" height="112" rx="3"/><rect x="700" y="490" width="44" height="144" rx="3"/>
          <path d="M154 500 L178 465 L201 500Z"/><rect x="704" y="490" width="34" height="8" opacity=".6"/>
        </g>
        <g fill="#ffd9b0" opacity=".65">
          <rect x="101" y="552" width="3" height="10"/><rect x="117" y="570" width="3" height="10"/><rect x="163" y="530" width="4" height="10"/><rect x="181" y="550" width="4" height="10"/><rect x="641" y="548" width="3" height="9"/><rect x="663" y="575" width="3" height="9"/><rect x="714" y="520" width="3" height="8"/>
        </g>
        <g transform="translate(405 566)">
          <ellipse cx="0" cy="58" rx="105" ry="15" fill="#3f2e40" opacity=".35"/>
          ${tinyCouple(0, 40, 1.35, "#392a3c", 0.98)}
          <path d="M-82 34 C -50 15 -10 10 20 12 C 54 14 80 28 96 45" fill="none" stroke="#392a3c" stroke-width="3" stroke-linecap="round" opacity=".25"/>
        </g>
        ${heart(100, 470, 22, { fill: "#ffded0", opacity: 0.24 })}
        ${heart(710, 440, 30, { fill: "#ffded0", opacity: 0.18 })}`);
    }

    // fallback
    return svgData(`${baseDefs}<rect width="800" height="700" fill="url(#dSky)"/>
      <circle cx="400" cy="300" r="110" fill="#fff1d6" opacity=".6"/>
      ${heart(400, 330, 120, { fill: "#ef8ca7", opacity: 0.8 })}`);
  }

  window.LoveArt = {
    LAYOUT,
    COLORS,
    escape: esc,
    heart,
    sparkle,
    surfaceY(s) {
      return -s * LAYOUT.slope;
    },
    buildBackground,
    buildMeadow,
    buildScenery,
    buildCouple,
    buildMemory,
    buildMarker,
    buildFinale,
    demoPhoto,
    wrapTwoLines
  };
})();

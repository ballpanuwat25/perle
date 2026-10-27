// Ripples drawn over a still Blender plate of an oil "sea". The plate's camera is known, so every
// pixel below the horizon maps to a point on the water. A wave-equation height field lives on a
// patch of that water; its slopes bend the plate (refraction), brighten the crests (Fresnel) and
// focus light (caustics). Drops are Blender-rendered beads (transmit + glow maps) that wobble,
// invert the scene behind them like a glass bead, cast a soft shadow and reflect in the oil.

const SIM = 384;
const AMP = 0.14;   // world height of one unit of the ripple field

const VERT = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const SIM_FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D prev; uniform vec2 texel;
uniform vec3 hit; uniform float hitR;
void main(){
  vec4 c = texture(prev, vUv);
  float avg = (texture(prev, vUv + vec2(texel.x, 0)).r + texture(prev, vUv - vec2(texel.x, 0)).r +
               texture(prev, vUv + vec2(0, texel.y)).r + texture(prev, vUv - vec2(0, texel.y)).r) * 0.25;
  c.g += (avg - c.r) * 0.85;      // slower than water
  c.g *= 0.996;
  c.r += c.g;
  c.r = mix(c.r, avg, 0.035);     // viscosity: oil smooths its smallest ripples away
  float d = length(vUv - hit.xy);
  c.r -= hit.z * exp(-d * d / (hitR * hitR));
  // open water: soak the waves up at the patch edge instead of bouncing them back
  vec2 e = min(vUv, 1.0 - vUv);
  c *= mix(0.9, 1.0, smoothstep(0.0, 0.08, min(e.x, e.y)));
  o = c;
}`;

const DRAW_FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D plate, field, dropT, dropF;
uniform vec2 res, plateSize, texel; uniform float shiftY, shiftX;
uniform vec3 zoomWin;   // a camera move drawn live: screen = offset + scale * view (top-left based, 0..1)
uniform vec3 camPos, camR, camU, camF; uniform vec2 tanXY;
uniform vec4 wpatch;          // field centre xy, size
uniform vec4 drops[8]; uniform vec2 squash[8]; uniform int nDrops;
uniform float open; uniform vec3 ringC; uniform vec4 rings; uniform float ringR;
uniform vec3 ringTint[5];
uniform sampler2D env; uniform float envGain, time, focusD, blurK; uniform vec3 envTint;
uniform float metal, swellAmp, waveScale, AMPL; uniform vec3 metalF0;
uniform sampler2D bottleMask, bottleRefl, dropperT, dropperF; uniform float hasDropper; uniform vec3 dropperTip; uniform vec3 dropperSprite;

// screen uv -> plate uv (object-fit: cover)
vec2 toPlate(vec2 s){
  s.y += shiftY;   // the plate slides down to put the horizon under the page's intro
  s.x += shiftX;   // and sideways, to keep the product in frame on narrower screens
  float sa = res.x / res.y, pa = plateSize.x / plateSize.y;
  vec2 k = sa > pa ? vec2(1.0, pa / sa) : vec2(sa / pa, 1.0);
  return (s - 0.5) * k + 0.5;
}
vec2 fromPlate(vec2 p){
  float sa = res.x / res.y, pa = plateSize.x / plateSize.y;
  vec2 k = sa > pa ? vec2(1.0, pa / sa) : vec2(sa / pa, 1.0);
  return (p - 0.5) / k + 0.5 - vec2(shiftX, shiftY);
}
vec3 rayOf(vec2 puv){ vec2 n = puv * 2.0 - 1.0; return normalize(camF + n.x * tanXY.x * camR + n.y * tanXY.y * camU); }
vec2 project(vec3 q){
  vec3 v = q - camPos; float z = dot(v, camF);
  return vec2(dot(v, camR) / (z * tanXY.x), dot(v, camU) / (z * tanXY.y)) * 0.5 + 0.5;
}
float H(vec2 xy){
  vec2 uv = (xy - wpatch.xy) / wpatch.z + 0.5;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return 0.0;
  return texture(field, uv).r;
}

// the carded studio, as Blender sees it: u = 0.5 - atan2(y, x) / 2pi, v = 0.5 + asin(z) / pi
vec3 envAt(vec3 d){
  vec2 uv = vec2(0.5 - atan(d.y, d.x) / 6.2831853, 0.5 + asin(clamp(d.z, -1.0, 1.0)) / 3.1415927);
  vec3 c = pow(texture(env, vec2(uv.x, 1.0 - uv.y)).rgb, vec3(2.2)) * envGain;
  // a warm studio, as if the walls were cream: the far sea reads cream-gold, not cold silver,
  // and the black cards reflect as deep amber-brown
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  c = mix(vec3(lum), c, 0.25);   // drop the studio's own cool casts before warming it
  // expose for the oil, not the walls: a soft shoulder keeps the bright studio from blowing
  // out to flat white, so the far sea stays cream-gold
  c = c / (1.0 + c * 0.55) * 1.25;
  return c * envTint + vec3(0.11, 0.055, 0.012) * (1.0 - smoothstep(0.0, 0.35, lum));
}
vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }

// the studio as a gold mirror sees it: no warm wash (the metal tints it), a lighter shoulder so
// highlights stay hot, and the darks pushed down for the contrast of molten metal
vec3 envMetal(vec3 d){
  // turned to face the dark side of the studio, with its octaboxes: molten gold reads by its
  // darks and a few hot lights, not by a white wall
  vec2 uv = vec2(0.5 - atan(d.y, d.x) / 6.2831853 + 0.5, 0.5 + asin(clamp(d.z, -1.0, 1.0)) / 3.1415927);
  vec3 c = pow(texture(env, vec2(uv.x, 1.0 - uv.y)).rgb, vec3(2.2)) * envGain;
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  c = vec3(lum);                     // all colour comes from the gold itself
  c = c / (1.0 + c * 0.18) * 2.1;   // exposed up: bright gold with deep accents
  return pow(c, vec3(1.15));
}

// a swell that keeps rolling toward the camera: a few long waves, slowed down as oil is
// slower than water; each fades out of focus by its own size, small ones first
vec3 swell(vec2 xy, float blur){
  vec2 g = vec2(0.0);
  const int N = 6;
  float L[6] = float[6](3.4, 1.9, 1.15, 0.72, 0.46, 0.3);
  float A[6] = float[6](0.0055, 0.0032, 0.0016, 0.0008, 0.00035, 0.00015);
  float D[6] = float[6](0.0, 0.32, -0.27, 0.55, -0.48, 0.15);
  for (int i = 0; i < N; i++){
    float k = 6.2831853 / (L[i] * waveScale);
    vec2 dir = vec2(sin(D[i]), -cos(D[i]));          // travelling toward the camera (-y)
    float w = sqrt(9.8 * k) * 0.45;
    float ph = k * dot(dir, xy) - w * time + float(i) * 1.7;
    float f = 1.0 / (1.0 + pow(blur / (L[i] * waveScale) * 6.0, 2.0));
    g += dir * k * A[i] * waveScale * swellAmp * cos(ph) * f;
  }
  return vec3(-g, 1.0);
}

// the plate's white sky, read from its top row so no far water leaks in (linear)
vec3 skyAt(vec2 puv){ return toLin(texture(plate, vec2(puv.x, 0.0)).rgb); }

// the water as seen at plate uv; also returns the water point (w = 1 if water)
vec3 water(vec2 puv, out vec4 wp){
  vec3 rd = rayOf(puv);
  wp = vec4(0.0);
  if (rd.z > -0.002) return pow(skyAt(puv), vec3(1.0 / 2.2));
  float t = -camPos.z / rd.z;
  vec3 p = camPos + rd * t;
  wp = vec4(p, 1.0);
  // circle of confusion, relative to the focal plane
  float blur = abs(t - focusD) / t * blurK;
  float e = wpatch.z / ${SIM}.0;
  float rf = 1.0 / (1.0 + pow(blur / (0.12 * waveScale) * 3.0, 2.0));
  float hx = (H(p.xy + vec2(e, 0)) - H(p.xy - vec2(e, 0))) / (2.0 * e) * AMPL * rf;
  float hy = (H(p.xy + vec2(0, e)) - H(p.xy - vec2(0, e))) / (2.0 * e) * AMPL * rf;
  float lap = (H(p.xy + vec2(e, 0)) + H(p.xy - vec2(e, 0)) + H(p.xy + vec2(0, e)) + H(p.xy - vec2(0, e)) - 4.0 * H(p.xy)) * rf;
  vec3 n = normalize(swell(p.xy, blur) + vec3(-hx, -hy, 0.0));
  // the body of the oil, seen through a surface that bends it
  vec2 q = project(p + vec3(n.xy, 0.0) * 0.35);
  vec3 body = toLin(texture(plate, vec2(q.x, 1.0 - q.y)).rgb);
  body *= 1.0 + clamp(-lap * 7.0, -0.25, 0.35);        // light focused by the troughs
  // reflection of the carded studio, weighted by the oil's Fresnel (IOR 1.47)
  vec3 r = reflect(rd, n); r.z = abs(r.z);
  float cosi = clamp(dot(-rd, n), 0.0, 1.0);
  float F = 0.036 + 0.964 * pow(1.0 - cosi, 5.0);
  // a touch less mirror toward the horizon, so the gold carries further back
  // (at a grazing angle the oil would mirror the bright studio almost whole and the far sea
  // would turn into a white band: keep it the oil's colour instead)
  F *= mix(1.0, 0.68, smoothstep(focusD * 0.8, focusD * 4.0, t));
  // the bottle's own reflection (rendered apart, alpha is where it falls), bent by the ripples
  vec4 br = texture(bottleRefl, vec2(puv.x, 1.0 - puv.y) + n.xy * 0.12);
  vec3 c = body * (1.0 - F) + mix(envAt(r), toLin(br.rgb), br.a) * F;
  if (metal > 0.5){
    // liquid gold: a metal has no body to see into, only its gold-tinted reflection
    vec3 Fm = metalF0 + (1.0 - metalF0) * pow(1.0 - cosi, 5.0);
    c = envMetal(r) * Fm;
  }
  // once opened, the oil splits into rings, each its own oil
  if (open > 0.0){
    float rr = length(p.xy - ringC.xy) / ringR;
    int i = rr < rings.x ? 0 : rr < rings.y ? 1 : rr < rings.z ? 2 : rr < rings.w ? 3 : rr < 1.0 ? 4 : -1;
    if (i >= 0){
      c = mix(c, c * ringTint[i], open);
      float seam = 0.0;
      for (int k = 0; k < 4; k++) seam = max(seam, 1.0 - smoothstep(0.0, 0.006, abs(rr - rings[k])));
      seam = max(seam, 1.0 - smoothstep(0.0, 0.006, abs(rr - 1.0)));
      c *= 1.0 - 0.4 * seam * open;
    }
  }
  // the oil runs right up to the horizon and meets the white sky there, with only a hair of
  // softening so the line does not step
  c = mix(skyAt(puv), c, smoothstep(-0.002, -0.006, rd.z));
  return pow(c, vec3(1.0 / 2.2));
}

// one bead, at plate-uv centre and plate-uv radius; adds itself over col
vec3 bead(vec2 puv, vec2 cen, vec2 rad, vec2 sq, vec3 col, bool mirrored){
  vec2 l = (puv - cen) / rad / sq;
  if (mirrored) l.y = -l.y;
  vec2 suv = l / 1.15 * 0.5 + 0.5;
  if (any(lessThan(suv, vec2(0.0))) || any(greaterThan(suv, vec2(1.0)))) return col;
  vec3 T = texture(dropT, vec2(suv.x, 1.0 - suv.y)).rgb;
  vec3 F = texture(dropF, vec2(suv.x, 1.0 - suv.y)).rgb;
  if (length(l) > 1.0) return col;
  // a bead inverts what is behind it, smaller
  vec4 wp; vec3 behind = water(cen - (puv - cen) * 0.55, wp);
  return mirrored ? mix(col, col * T + F, 0.38) : behind * T + F;
}

void main(){
  vec2 sc = gl_FragCoord.xy / res;
  // undo the zoom: which point of the unzoomed view this pixel shows, so a close-up stays sharp
  vec2 st = (vec2(sc.x, 1.0 - sc.y) - zoomWin.xy) / zoomWin.z;
  vec2 s = vec2(st.x, 1.0 - st.y);
  vec2 puv = toPlate(s);
  vec4 wp;
  vec3 col = water(puv, wp);
  // the bottle stands above the oil: show the plate there, untouched by ripples and reflections
  float bm = texture(bottleMask, vec2(puv.x, 1.0 - puv.y)).r;
  col = mix(col, texture(plate, vec2(puv.x, 1.0 - puv.y)).rgb, bm);
  for (int i = 0; i < 8; i++){
    if (i >= nDrops) break;
    vec4 d = drops[i];
    vec2 asp = vec2(1.0, (plateSize.x / plateSize.y));
    if (wp.w > 0.5){
      // shadow: light from high and a little behind
      float hgt = d.z;
      vec2 off = wp.xy - d.xy - vec2(0.0, 0.25) * hgt;
      float rr = d.w * (1.2 + hgt * 0.8);
      col *= 1.0 - 0.22 * exp(-dot(off, off) / (rr * rr)) / (1.0 + hgt * 1.5);
      // reflection in the oil
      vec2 mc = project(vec3(d.xy, -d.z));
      vec3 v = vec3(d.xy, -d.z) - camPos; float z = dot(v, camF);
      vec2 mr = vec2(d.w / (z * tanXY.x), d.w / (z * tanXY.y)) * 0.5;
      col = bead(puv, mc, mr, squash[i], col, true);
    }
  }
  // the dropper hangs where the next drop will fall from
  if (hasDropper > 0.5){
    vec2 tc = project(dropperTip);
    vec3 v = dropperTip - camPos; float z = dot(v, camF);
    vec2 span = vec2(dropperSprite.z / (z * tanXY.x), dropperSprite.z / (z * tanXY.y)) * 0.5;
    vec2 su = (puv - tc) / span + dropperSprite.xy;
    if (all(greaterThan(su, vec2(0.0))) && all(lessThan(su, vec2(1.0)))){
      vec3 T = texture(dropperT, vec2(su.x, 1.0 - su.y)).rgb;
      vec3 F = texture(dropperF, vec2(su.x, 1.0 - su.y)).rgb;
      col = col * T + F;
    }
  }
  for (int i = 0; i < 8; i++){
    if (i >= nDrops) break;
    vec4 d = drops[i];
    vec2 c = project(d.xyz);
    vec3 v = d.xyz - camPos; float z = dot(v, camF);
    vec2 r = vec2(d.w / (z * tanXY.x), d.w / (z * tanXY.y)) * 0.5;
    col = bead(puv, c, r, squash[i], col, false);
  }
  // film finish: a gentle S-curve, a little vignette, fine moving grain
  col = clamp(col, 0.0, 1.0);   // the S-curve below turns values past white negative
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.35);
  vec2 vg = sc - 0.5;
  col *= 1.0 - 0.12 * dot(vg, vg);
  float gr = fract(sin(dot(gl_FragCoord.xy + fract(time * 13.0) * 97.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (gr - 0.5) * 0.022;
  o = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'p');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[name] = gl.getUniformLocation(p, name); }
  return { p, u };
}
const loadImage = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
const fetchJson = (src) => fetch(src).then((r) => r.json());

// views: { plate, camera, patch: [cx, cy, size], drop radius, ring radius }
export async function createOilSea(canvas, { view, sprite, shares, scale = 1 }) {
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
  const sim = program(gl, SIM_FRAG);
  const draw = program(gl, DRAW_FRAG);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const tex = (img, unit) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const target = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.HALF_FLOAT, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { t, fb };
  };
  let pair = [target(), target()];
  const E = await loadImage(sprite.env);
  const envTex = tex(E, 4);
  let dropT = null, dropF = null, shift = 0, shiftX = 0, zoom = [0, 0, 1];
  gl.bindTexture(gl.TEXTURE_2D, envTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  let clock = 0;

  let v = null, plateTex = null, plateSize = [1, 1], cam = null;
  let maskTex = null, reflTex = null, dropperTex = null, dropperMeta = null, dropperAt = null;
  const clear = (() => { const c = document.createElement('canvas'); c.width = c.height = 1; return c; })();
  const blank = (() => { const c = document.createElement('canvas'); c.width = c.height = 1; c.getContext('2d').fillRect(0, 0, 1, 1); return c; })();
  async function setView(next) {
    const [img, c, T, F] = await Promise.all([loadImage(next.plate), fetchJson(next.camera), loadImage(next.transmit), loadImage(next.glow)]);
    if (plateTex) gl.deleteTexture(plateTex);
    if (dropT) { gl.deleteTexture(dropT); gl.deleteTexture(dropF); }
    plateTex = tex(img, 1);
    dropT = tex(T, 2); dropF = tex(F, 3);
    if (maskTex) gl.deleteTexture(maskTex);
    maskTex = tex(next.mask ? await loadImage(next.mask) : blank, 5);
    if (reflTex) gl.deleteTexture(reflTex);
    reflTex = tex(next.refl ? await loadImage(next.refl) : clear, 8);
    if (dropperTex) { gl.deleteTexture(dropperTex[0]); gl.deleteTexture(dropperTex[1]); dropperTex = null; dropperMeta = null; }
    if (next.dropper) {
      const [dt, df, meta] = await Promise.all([loadImage(next.dropper.transmit), loadImage(next.dropper.glow), fetchJson(next.dropper.meta)]);
      dropperTex = [tex(dt, 6), tex(df, 7)]; dropperMeta = meta;
    }
    plateSize = [img.width, img.height];
    cam = c; v = next;
    pair = [target(), target()];
    drops.length = 0;
  }

  let acc = 0;
  const bounds = shares.slice(0, 4).map((s) => { acc += s / 100; return Math.sqrt(acc); });
  // each oil's ring, as a multiplier on the plate's gold: clear squalane, deep rice bran,
  // pale camellia, green moringa, amber vitamin E
  const TINT = [[1.05, 1.08, 1.45], [0.98, 0.82, 0.55], [1.03, 1.02, 1.2], [0.86, 0.92, 0.62], [0.95, 0.66, 0.4]].flat();

  const drops = [], impacts = [];
  let W = 1, H = 1;
  function resize() {
    const dpr = Math.min(devicePixelRatio, 1.5) * scale;
    W = Math.max(2, Math.round(canvas.clientWidth * dpr));
    H = Math.max(2, Math.round(canvas.clientHeight * dpr));
    canvas.width = W; canvas.height = H;
  }
  // screen (0..1, y down) -> plate uv (y up)
  // screen (0..1, y down) <-> plate uv (y up), with the plate slid down by `shift` screens
  function toPlate(sx, sy) {
    const sa = W / H, pa = plateSize[0] / plateSize[1];
    const k = sa > pa ? [1, pa / sa] : [sa / pa, 1];
    return [(sx + shiftX - 0.5) * k[0] + 0.5, (1 - sy + shift - 0.5) * k[1] + 0.5];
  }
  function fromPlate(px, py, s = shift) {
    const sa = W / H, pa = plateSize[0] / plateSize[1];
    const k = sa > pa ? [1, pa / sa] : [sa / pa, 1];
    return [(px - 0.5) / k[0] + 0.5 - shiftX, 1 - ((py - 0.5) / k[1] + 0.5 - s)];
  }
  function ray(px, py) {
    const nx = px * 2 - 1, ny = py * 2 - 1;
    const d = [0, 1, 2].map((i) => cam.forward[i] + nx * cam.tanX * cam.right[i] + ny * cam.tanY * cam.up[i]);
    const l = Math.hypot(...d);
    return d.map((x) => x / l);
  }
  function stepSim(hit) {
    const [src, dst] = pair;
    gl.useProgram(sim.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, SIM, SIM);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.t);
    gl.uniform1i(sim.u.prev, 0);
    gl.uniform2f(sim.u.texel, 1 / SIM, 1 / SIM);
    gl.uniform3f(sim.u.hit, hit ? hit.u : 0, hit ? hit.v : 0, hit ? hit.s : 0);
    gl.uniform1f(sim.u.hitR, hit ? hit.r : 0.01);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    pair = [dst, src];
  }

  await setView(view);
  return {
    resize,
    setView,
    get view() { return v; },
    // where the horizon falls on screen (0..1, y down) before any shift
    horizonY() {
      const ny = -cam.forward[2] / (cam.tanY * cam.up[2]);
      return fromPlate(0.5, ny * 0.5 + 0.5, 0)[1];
    },
    // slide the plate: dy down, dx left (fractions of the screen)
    setShift(dy, dx = 0) { shift = dy; shiftX = dx; },
    // close in on part of the view: x, y (fractions of the screen) and scale, as a CSS translate
    // then scale from the top left would; drawn in the shader, so it stays sharp
    setZoom(x, y, s) { zoom = [x, y, s]; },
    // where the dropper's tip is, in world units (null hides it)
    setDropper(p) { dropperAt = p; },
    ringBounds: bounds,
    // screen point -> water point [x, y], or null above the horizon
    pick(sx, sy) {
      const [px, py] = toPlate(sx, sy);
      const d = ray(px, py);
      if (d[2] > -0.002) return null;
      const t = -cam.pos[2] / d[2];
      return [cam.pos[0] + d[0] * t, cam.pos[1] + d[1] * t];
    },
    // world point -> screen (0..1, y down)
    project(p) {
      const q = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
      const dot = (a) => q[0] * a[0] + q[1] * a[1] + q[2] * a[2];
      const z = dot(cam.forward);
      const px = (dot(cam.right) / (z * cam.tanX)) * 0.5 + 0.5, py = (dot(cam.up) / (z * cam.tanY)) * 0.5 + 0.5;
      return fromPlate(px, py);
    },
    // h is where the drop starts; with hang, it grows from nothing at h and hangs there (its top
    // at h) until the caller sets d.hang = false. Returns the drop.
    // take a drop away again (one the page drives itself and no longer wants)
    remove(d) { const i = drops.indexOf(d); if (i >= 0) drops.splice(i, 1); },
    // take a drop away again (one the page drives itself and no longer wants)
    remove(d) { const i = drops.indexOf(d); if (i >= 0) drops.splice(i, 1); },
    drop(x, y, r = v.drop, h = v.fall, hang = false) {
      const d = { x, y, z: h, top: h, vz: 0, r, grow: hang ? 0 : 1, hang, age: Math.random() * 6, rebound: r > v.drop * 0.6 };
      drops.push(d);
      if (drops.length > 8) drops.splice(drops.findIndex((o) => !o.hang), 1);
      return d;
    },
    tick(dt, open = 0) {
      clock += dt;
      for (const d of [...drops]) {
        d.grow = Math.min(1, d.grow + dt / 0.7);
        if (d.hang || d.grow < 1) { d.z = d.top - d.r * d.grow; d.age += dt; continue; }
        d.vz -= 9.8 * dt * v.gravity;
        d.z += d.vz * dt;
        d.age += dt;
        if (d.z - d.r * 0.6 <= 0 && d.vz < 0) {
          const [cx, cy, size] = v.patch;
          impacts.push({ u: (d.x - cx) / size + 0.5, v: (d.y - cy) / size + 0.5, s: 2.6 * (d.r / v.drop) ** 2, r: (d.r * 1.3) / size });
          drops.splice(drops.indexOf(d), 1);
          // the rebound jet throws up a droplet a few of the drop's radii, not more
          if (d.rebound) setTimeout(() => drops.push({ x: d.x, y: d.y, z: d.r * 0.4, vz: Math.sqrt(2 * 9.8 * v.gravity * d.r * 2.5), r: d.r * 0.42, grow: 1, age: 0, rebound: false }), 120);
        }
      }
      stepSim(impacts.shift());
      stepSim(null);

      gl.useProgram(draw.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, pair[0].t);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, plateTex);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, dropT);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, dropF);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, envTex);
      const u = draw.u;
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.uniform1i(u.bottleMask, 5);
      gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, reflTex);
      gl.uniform1i(u.bottleRefl, 8);
      const showDropper = !!(dropperTex && dropperAt);
      gl.uniform1f(u.hasDropper, showDropper ? 1 : 0);
      if (showDropper) {
        gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, dropperTex[0]);
        gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, dropperTex[1]);
        gl.uniform1i(u.dropperT, 6); gl.uniform1i(u.dropperF, 7);
        gl.uniform3fv(u.dropperTip, dropperAt);
        gl.uniform3f(u.dropperSprite, dropperMeta.tip[0], dropperMeta.tip[1], dropperMeta.size * (v.dropperScale ?? 1));
      }
      gl.uniform1i(u.field, 0); gl.uniform1i(u.plate, 1); gl.uniform1i(u.dropT, 2); gl.uniform1i(u.dropF, 3); gl.uniform1i(u.env, 4);
      // the HDRI was stored as value / 4 and Blender lights with it at strength 1.3
      gl.uniform1f(u.envGain, 4 * 1.3 * (v.reflect ?? 1)); gl.uniform1f(u.time, clock);
      gl.uniform1f(u.focusD, v.focus); gl.uniform1f(u.blurK, v.blur);
      gl.uniform3fv(u.envTint, v.tint ?? [1, 1, 1]);
      gl.uniform1f(u.metal, v.metal ? 1 : 0); gl.uniform1f(u.swellAmp, v.swell ?? 1);
      // waves and ripples scale with the view: a macro lens sees millimetres, not metres
      gl.uniform1f(u.waveScale, v.waveScale ?? 1); gl.uniform1f(u.AMPL, AMP * (v.waveScale ?? 1));
      gl.uniform3f(u.metalF0, 1.0, 0.66, 0.2);    // gold's reflectance, linear, a little richer
      gl.uniform2f(u.res, W, H); gl.uniform2f(u.plateSize, ...plateSize); gl.uniform1f(u.shiftY, shift); gl.uniform1f(u.shiftX, shiftX); gl.uniform3fv(u.zoomWin, zoom); gl.uniform2f(u.texel, 1 / SIM, 1 / SIM);
      gl.uniform3fv(u.camPos, cam.pos); gl.uniform3fv(u.camR, cam.right); gl.uniform3fv(u.camU, cam.up); gl.uniform3fv(u.camF, cam.forward);
      gl.uniform2f(u.tanXY, cam.tanX, cam.tanY);
      gl.uniform4f(u.wpatch, ...v.patch, 0);
      // far drops first, so near ones draw over them
      const order = [...drops].sort((a, b) => b.y - a.y);
      const dv = new Float32Array(32), sq = new Float32Array(16);
      order.forEach((d, i) => {
        dv.set([d.x, d.y, d.z, d.r * d.grow], i * 4);
        const k = 0.12 * Math.sin(d.age * 24) * Math.exp(-d.age * 0.5) + 0.04 * Math.sin(d.age * 8);
        sq.set([1 + k, 1 / (1 + k) ** 2], i * 2);
      });
      gl.uniform4fv(u.drops, dv); gl.uniform2fv(u.squash, sq); gl.uniform1i(u.nDrops, order.length);
      gl.uniform1f(u.open, open);
      gl.uniform3f(u.ringC, v.ring[0], v.ring[1], 0);
      gl.uniform1f(u.ringR, v.ring[2]);
      gl.uniform4f(u.rings, ...bounds);
      gl.uniform3fv(u.ringTint, TINT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

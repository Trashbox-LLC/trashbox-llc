/**
 * Builds public/animations/trashbox-logo-plug.json from the outlined logo SVG.
 * The box and keyboard stay put. The cable bends from a slack curve and
 * the plug follows its free end into the socket.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(resolve(root, "public/images/trashbox-logo-outlined.svg"), "utf8");

const BOX = new Set([
  "274ab5e1-2fff-80bc-8008-df89f7c435c6",
  "274ab5e1-2fff-80bc-8008-df89f7c435c7",
  "274ab5e1-2fff-80bc-8008-df89f7c435c8",
  "274ab5e1-2fff-80bc-8008-df89f7c435c9",
  "274ab5e1-2fff-80bc-8008-df89f7c435ca",
  "274ab5e1-2fff-80bc-8008-df89f7c435cb",
  "274ab5e1-2fff-80bc-8008-df89f7c435cc",
  "274ab5e1-2fff-80bc-8008-df89f7c435cd",
  "274ab5e1-2fff-80bc-8008-df89f7c435ce",
]);
const CABLE = "274ab5e1-2fff-80bc-8008-df89f7c435d3";
const PLUG = "274ab5e1-2fff-80bc-8008-df89f7c435d4";
const SLAB = "274ab5e1-2fff-80bc-8008-df89f7c435d0";
const KEYS = "d240f82a-fd4e-8037-8008-df8e99d1ae09";

const FPS = 30;
const HOLD_OUT = 10;
const WHIP = 28;
const SOFT = 48;
const REST = 66;
const HOLD_IN = 96;

function round(n) {
  return Math.round(n * 100) / 100;
}

function tokenize(d) {
  return d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
}

function parsePath(d) {
  const tokens = tokenize(d);
  const subpaths = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let current = null;

  function start(x, y) {
    if (current && current.v.length) subpaths.push(current);
    current = { v: [[round(x), round(y)]], i: [[0, 0]], o: [[0, 0]], c: false };
    cx = x;
    cy = y;
    sx = x;
    sy = y;
  }

  function line(x, y) {
    current.v.push([round(x), round(y)]);
    current.i.push([0, 0]);
    current.o.push([0, 0]);
    cx = x;
    cy = y;
  }

  function cubic(x1, y1, x2, y2, x, y) {
    const last = current.v.length - 1;
    current.o[last] = [round(x1 - cx), round(y1 - cy)];
    current.v.push([round(x), round(y)]);
    current.i.push([round(x2 - x), round(y2 - y)]);
    current.o.push([0, 0]);
    cx = x;
    cy = y;
  }

  function close() {
    const [fx, fy] = current.v[0];
    const [lx, ly] = current.v[current.v.length - 1];
    if (Math.hypot(fx - lx, fy - ly) > 0.05) {
      current.v.push([fx, fy]);
      current.i.push([0, 0]);
      current.o.push([0, 0]);
    }
    current.c = true;
    cx = sx;
    cy = sy;
  }

  while (i < tokens.length) {
    const cmd = tokens[i];
    if (!/[a-zA-Z]/.test(cmd)) throw new Error(`Expected command at ${i}: ${cmd}`);
    i += 1;
    const rel = cmd === cmd.toLowerCase();
    const op = cmd.toUpperCase();

    if (op === "Z") {
      close();
      continue;
    }

    const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4 }[op];
    if (!arity) throw new Error(`Unsupported path command ${cmd}`);

    let pair = 0;
    while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
      const nums = [];
      for (let n = 0; n < arity; n += 1) nums.push(parseFloat(tokens[i++]));
      const absolute = (x, y) => (rel ? [cx + x, cy + y] : [x, y]);

      if (op === "M") {
        const [x, y] = absolute(nums[0], nums[1]);
        if (pair === 0) start(x, y);
        else line(x, y);
      } else if (op === "L") {
        const [x, y] = absolute(nums[0], nums[1]);
        line(x, y);
      } else if (op === "H") {
        const x = rel ? cx + nums[0] : nums[0];
        line(x, cy);
      } else if (op === "V") {
        const y = rel ? cy + nums[0] : nums[0];
        line(cx, y);
      } else if (op === "C") {
        const [x1, y1] = absolute(nums[0], nums[1]);
        const [x2, y2] = absolute(nums[2], nums[3]);
        const [x, y] = absolute(nums[4], nums[5]);
        cubic(x1, y1, x2, y2, x, y);
      } else if (op === "S" || op === "Q") {
        throw new Error(`Smooth/quadratic commands are not used by this logo (${cmd})`);
      }
      pair += 1;
    }
  }

  if (current && current.v.length) subpaths.push(current);
  return subpaths;
}

function walkShapes(markup) {
  const shapes = [];
  const stack = [];
  const tag = /<\/?g\b[^>]*>|<path\b[^>]*\/?>/g;
  let match;
  while ((match = tag.exec(markup))) {
    const token = match[0];
    if (token.startsWith("</g")) {
      stack.pop();
      continue;
    }
    if (token.startsWith("<g")) {
      const id = /id="([^"]+)"/.exec(token)?.[1] ?? "";
      const hidden = /display:\s*none/.test(token);
      stack.push({ id, hidden: hidden || stack.some((frame) => frame.hidden) });
      continue;
    }
    const d = /d="([^"]+)"/.exec(token)?.[1];
    if (!d) continue;
    const style = /style="([^"]*)"/.exec(token)?.[1] ?? "";
    const owner = [...stack].reverse().find((frame) => frame.id.startsWith("shape-"));
    if (!owner || owner.hidden) continue;
    const stroke = /stroke:\s*rgb\(255,\s*255,\s*255\)/.test(style);
    const fill = /fill:\s*rgb\(255,\s*255,\s*255\)/.test(style);
    if (!stroke && !fill) continue;
    const width = parseFloat(/stroke-width:\s*([0-9.]+)/.exec(style)?.[1] ?? "0");
    shapes.push({
      id: owner.id.replace(/^shape-/, ""),
      stroke,
      fill,
      width,
      subpaths: parsePath(d),
    });
  }
  return shapes;
}

function staticProp(value) {
  return { a: 0, k: value };
}

function transform(position) {
  return {
    ty: "tr",
    p: staticProp(position ?? [0, 0]),
    a: staticProp([0, 0]),
    s: staticProp([100, 100]),
    r: staticProp(0),
    o: staticProp(100),
    sk: staticProp(0),
    sa: staticProp(0),
  };
}

function shapeGroup(name, subpaths, paint) {
  const items = subpaths.map((path) => ({
    ty: "sh",
    nm: name,
    ks: staticProp({ i: path.i, o: path.o, v: path.v, c: path.c }),
  }));
  if (paint.fill) {
    items.push({
      ty: "fl",
      c: staticProp([1, 1, 1, 1]),
      o: staticProp(100),
      r: 1,
    });
  }
  if (paint.stroke) {
    items.push({
      ty: "st",
      c: staticProp([1, 1, 1, 1]),
      o: staticProp(100),
      w: staticProp(paint.width),
      lc: 2,
      lj: 2,
      ml: 4,
    });
  }
  items.push(transform());
  return { ty: "gr", nm: name, it: items };
}

function layer(name, index, groups, position) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: staticProp(100),
      r: staticProp(0),
      p: position,
      a: staticProp([0, 0, 0]),
      s: staticProp([100, 100, 100]),
    },
    ao: 0,
    shapes: groups,
    ip: 0,
    op: HOLD_IN,
    st: 0,
    bm: 0,
  };
}

function pathValue(path) {
  return {
    i: path.i.map(([x, y]) => [round(x), round(y)]),
    o: path.o.map(([x, y]) => [round(x), round(y)]),
    v: path.v.map(([x, y]) => [round(x), round(y)]),
    c: path.c,
  };
}

function smoothPath(points) {
  const v = points.map(([x, y]) => [round(x), round(y)]);
  const i = v.map(() => [0, 0]);
  const o = v.map(() => [0, 0]);
  for (let index = 0; index < v.length; index += 1) {
    const prev = v[Math.max(0, index - 1)];
    const next = v[Math.min(v.length - 1, index + 1)];
    const tx = (next[0] - prev[0]) / 6;
    const ty = (next[1] - prev[1]) / 6;
    if (index > 0) i[index] = [round(-tx), round(-ty)];
    if (index < v.length - 1) o[index] = [round(tx), round(ty)];
  }
  return { i, o, v, c: false };
}

function cubicAt(p0, c1, c2, p3, t) {
  const u = 1 - t;
  const b0 = u * u * u;
  const b1 = 3 * u * u * t;
  const b2 = 3 * u * t * t;
  const b3 = t * t * t;
  return [
    b0 * p0[0] + b1 * c1[0] + b2 * c2[0] + b3 * p3[0],
    b0 * p0[1] + b1 * c1[1] + b2 * c2[1] + b3 * p3[1],
  ];
}

function sampleCord(path, steps) {
  const points = [];
  for (let index = 0; index < path.v.length - 1; index += 1) {
    const p0 = path.v[index];
    const p3 = path.v[index + 1];
    const c1 = [p0[0] + path.o[index][0], p0[1] + path.o[index][1]];
    const c2 = [p3[0] + path.i[index + 1][0], p3[1] + path.i[index + 1][1]];
    for (let step = 0; step < steps; step += 1) {
      points.push(cubicAt(p0, c1, c2, p3, step / steps));
    }
  }
  points.push(path.v[path.v.length - 1]);
  return points;
}

const BEND_EASE = {
  o: { x: [0.45], y: [0.05] },
  i: { x: [0.25], y: [1] },
};

function motionKeys(samples, frameAt, spatial = false) {
  return {
    a: 1,
    k: samples.map((sample, index) => {
      const frame = { t: frameAt[index], s: sample };
      if (index === 0) frame.h = 1;
      else if (index < samples.length - 1) {
        Object.assign(frame, BEND_EASE);
        if (spatial) {
          frame.to = [0, 0, 0];
          frame.ti = [0, 0, 0];
        }
      }
      return frame;
    }),
  };
}

const drawn = walkShapes(svg);
const byId = new Map();
for (const shape of drawn) {
  const list = byId.get(shape.id) ?? [];
  list.push(shape);
  byId.set(shape.id, list);
}

function groupsFor(id) {
  const parts = byId.get(id);
  if (!parts?.length) throw new Error(`Missing shape ${id}`);
  return parts.map((part, index) =>
    shapeGroup(`${id}-${index}`, part.subpaths, {
      fill: part.fill,
      stroke: part.stroke,
      width: part.width,
    }),
  );
}

const cable = byId.get(CABLE)?.find((part) => part.stroke);
if (!cable || cable.subpaths.length !== 1) {
  throw new Error("Expected one visible cable stroke");
}
const cord = cable.subpaths[0];
const restCord = pathValue(cord);
const cordPoints = sampleCord(restCord, 4);
const plugPoint = cordPoints[0];
const keyboardPoint = cordPoints[cordPoints.length - 1];
const travel = [
  keyboardPoint[0] - plugPoint[0],
  keyboardPoint[1] - plugPoint[1],
];
const travelLength = Math.hypot(travel[0], travel[1]) || 1;
const outward = [travel[1] / travelLength, -travel[0] / travelLength];

function flexPose(plugOffset, bulge) {
  const last = cordPoints.length - 1;
  const points = cordPoints.map((point, index) => {
    const along = index / last;
    const endWeight = 1 - along;
    const bow = Math.sin(Math.PI * along);
    return [
      point[0] + plugOffset[0] * endWeight + outward[0] * bulge * bow,
      point[1] + plugOffset[1] * endWeight + outward[1] * bulge * bow,
    ];
  });
  return smoothPath(points);
}

const poses = [
  flexPose([32, -42], 46),
  flexPose([32, -42], 46),
  flexPose([6, -8], 72),
  flexPose([0, 2], 28),
  flexPose([0, 0], 0),
];
const frames = [0, HOLD_OUT, WHIP, SOFT, REST];
const plugShift = poses.map((pose) => {
  const [x, y] = pose.v[0];
  return [round(x - plugPoint[0]), round(y - plugPoint[1]), 0];
});

function shapeBounds(id) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const part of byId.get(id) ?? []) {
    for (const path of part.subpaths) {
      for (const [x, y] of path.v) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

const plugBounds = shapeBounds(PLUG);
const socketCenter = [
  (plugBounds.minX + plugBounds.maxX) / 2,
  (plugBounds.minY + plugBounds.maxY) / 2,
];

function socketGroup() {
  return {
    ty: "gr",
    nm: "Socket",
    it: [
      {
        ty: "rc",
        d: 1,
        s: staticProp([28, 28]),
        p: staticProp([round(socketCenter[0]), round(socketCenter[1])]),
        r: staticProp(0),
      },
      {
        ty: "fl",
        c: staticProp([1, 1, 1, 1]),
        o: staticProp(100),
        r: 1,
      },
      transform(),
    ],
  };
}

function cableGroup() {
  return {
    ty: "gr",
    nm: "Cable",
    it: [
      {
        ty: "sh",
        nm: "Cable",
        ks: motionKeys(
          poses.map((pose) => [pose]),
          frames,
        ),
      },
      {
        ty: "st",
        c: staticProp([1, 1, 1, 1]),
        o: staticProp(100),
        w: staticProp(cable.width),
        lc: 2,
        lj: 2,
        ml: 4,
      },
      transform(),
    ],
  };
}

const still = staticProp([0, 0, 0]);
const boxGroups = [...BOX].flatMap((id) => groupsFor(id));

const lottie = {
  v: "5.7.4",
  fr: FPS,
  ip: 0,
  op: HOLD_IN,
  w: 1024,
  h: 1024,
  nm: "Trashbox outline logo plug",
  ddd: 0,
  assets: [],
  layers: [
    layer("Keyboard", 1, groupsFor(KEYS), still),
    layer("Keyboard slab", 2, groupsFor(SLAB), still),
    layer("Cable", 3, [cableGroup()], still),
    layer(
      "Plug",
      4,
      groupsFor(PLUG),
      motionKeys(plugShift, frames, true),
    ),
    layer("Socket", 5, [socketGroup()], still),
    layer("Box", 6, boxGroups, still),
  ],
  markers: [],
};

const out = resolve(root, "public/animations/trashbox-logo-plug.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(lottie));

console.log(
  JSON.stringify(
    {
      out,
      bytes: Buffer.byteLength(JSON.stringify(lottie)),
      shapes: drawn.map((shape) => ({
        id: shape.id.slice(-4),
        stroke: shape.stroke,
        fill: shape.fill,
        width: shape.width,
        subpaths: shape.subpaths.length,
      })),
      cableStart: plugPoint,
      cableEnd: keyboardPoint,
      socketCenter: socketCenter.map(round),
      plugShift,
      frames: HOLD_IN,
    },
    null,
    2,
  ),
);

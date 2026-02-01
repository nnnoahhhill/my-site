export type PhysicsBody = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  mass: number;
  color?: string; // For the random mode
};

export const RESOLUTION_STEPS = 1; // can increase for better stability if needed

export function resolveCollisions(items: PhysicsBody[], bounds: { width: number; height: number }) {
  // 1. Wall Collisions
  for (const item of items) {
    if (item.x <= 0) {
      item.x = 0;
      item.vx *= -1;
    } else if (item.x + item.width >= bounds.width) {
      item.x = bounds.width - item.width;
      item.vx *= -1;
    }

    if (item.y <= 0) {
      item.y = 0;
      item.vy *= -1;
    } else if (item.y + item.height >= bounds.height) {
      item.y = bounds.height - item.height;
      item.vy *= -1;
    }
  }

  // 2. Object Collisions (AABB)
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      ) {
        resolveElasticCollision(a, b);
      }
    }
  }
}

function resolveElasticCollision(a: PhysicsBody, b: PhysicsBody) {
  // Find centers
  const cxA = a.x + a.width / 2;
  const cyA = a.y + a.height / 2;
  const cxB = b.x + b.width / 2;
  const cyB = b.y + b.height / 2;

  // Normal vector
  let nx = cxB - cxA;
  let ny = cyB - cyA;

  // Distance
  const dist = Math.sqrt(nx * nx + ny * ny) || 1; // avoid divide by zero

  // Normalize
  const ux = nx / dist;
  const uy = ny / dist;

  // Separate the objects to prevent sticking (push them apart based on overlap)
  // Calculate overlap
  const overlapX = (a.width / 2 + b.width / 2) - Math.abs(cxA - cxB);
  const overlapY = (a.height / 2 + b.height / 2) - Math.abs(cyA - cyB);

  // We need a better separation logic for rectangles, but simple projection along the normal vector works for now
  // A simple approximation: push them apart along the collision normal
  // (A more robust AABB response would check the "minimum translation vector" but this might suffice for "chaotic")
  
  // Actually, for rectangles, determining the "normal" of collision is tricky without previous frame data.
  // We'll stick to the center-to-center normal for momentum, but we need to push them out of overlap.
  // Let's barely separate them.
  const totalMass = a.mass + b.mass;
  const mRatioA = b.mass / totalMass;
  const mRatioB = a.mass / totalMass;
  
  // Separation factor (small push)
  const nudge = 1.0; 
  // Move A
  a.x -= ux * nudge * mRatioA;
  a.y -= uy * nudge * mRatioA;
  // Move B
  b.x += ux * nudge * mRatioB;
  b.y += uy * nudge * mRatioB;


  // Relative velocity
  const va = a.vx * ux + a.vy * uy;
  const vb = b.vx * ux + b.vy * uy;

  // 1D Elastic Collision on the normal
  const m1 = a.mass;
  const m2 = b.mass;

  const vaPrime = (va * (m1 - m2) + 2 * m2 * vb) / (m1 + m2);
  const vbPrime = (vb * (m2 - m1) + 2 * m1 * va) / (m1 + m2);

  // Apply changes to velocity vectors
  a.vx += (vaPrime - va) * ux;
  a.vy += (vaPrime - va) * uy;
  b.vx += (vbPrime - vb) * ux;
  b.vy += (vbPrime - vb) * uy;
}
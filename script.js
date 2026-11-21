const canvas = document.querySelector("#pint");
const ctx = canvas.getContext("2d");
const motionButton = document.querySelector("#enable-motion");
const motionStatus = document.querySelector("#motion-status");
const refillButton = document.querySelector("#refill");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const initialBeer = 0.88;
let width = 0;
let height = 0;
let beer = initialBeer;
let targetTilt = 0;
let tilt = 0;
let velocity = 0;
let sipAmount = 0;
let lastTime = 0;
let motionReceived = false;
let motionListening = false;
let motionTimeout;

const bubbles = Array.from({ length: 60 }, (_, i) => ({
  x: ((i * 97 + 31) % 997) / 997,
  y: ((i * 137 + 41) % 991) / 991,
  radius: 1.2 + (i % 4) * 0.65,
  speed: 9 + (i % 6) * 3,
}));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function waveY(x, surface, time) {
  const slant = tilt * (x - width / 2) * 0.7;
  const movement = reducedMotion.matches ? 0 : Math.sin(x / 47 + time * 2.2) * (2 + Math.abs(velocity) * 4);
  return surface + slant + movement;
}

function wavePath(surface, time, offset) {
  ctx.beginPath();
  ctx.moveTo(0, waveY(0, surface, time) + offset);
  for (let x = 5; x < width; x += 5) {
    ctx.lineTo(x, waveY(x, surface, time) + offset);
  }
  ctx.lineTo(width, waveY(width, surface, time) + offset);
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);
  if (beer <= 0.001) return;

  const surface = height * (1 - beer);
  const beerGradient = ctx.createLinearGradient(0, 0, width, 0);
  beerGradient.addColorStop(0, "#bc690e");
  beerGradient.addColorStop(0.22, "#e39a24");
  beerGradient.addColorStop(0.58, "#f5b935");
  beerGradient.addColorStop(1, "#b7650c");
  wavePath(surface, time, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = beerGradient;
  ctx.fill();

  ctx.save();
  wavePath(surface, time, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "rgba(255, 230, 154, .46)";
  for (const bubble of bubbles) {
    const rise = reducedMotion.matches ? 0 : time * bubble.speed;
    const y = height - ((bubble.y * height + rise) % height);
    ctx.beginPath();
    ctx.arc(bubble.x * width, y, bubble.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const foamDepth = Math.min(34, beer * height);
  wavePath(surface, time, 0);
  for (let x = width; x > 0; x -= 5) {
    ctx.lineTo(x, waveY(x, surface, time) + foamDepth + Math.sin(x / 22 + time) * (reducedMotion.matches ? 0 : 2));
  }
  ctx.lineTo(0, waveY(0, surface, time) + foamDepth);
  ctx.closePath();
  const foamGradient = ctx.createLinearGradient(0, surface, 0, surface + foamDepth);
  foamGradient.addColorStop(0, "#fff9df");
  foamGradient.addColorStop(1, "#e8d5a5");
  ctx.fillStyle = foamGradient;
  ctx.fill();
}

function animate(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
  lastTime = timestamp;
  velocity += (targetTilt - tilt) * 18 * dt;
  velocity *= Math.exp(-5 * dt);
  tilt += velocity * dt;
  if (sipAmount > 0) beer = Math.max(0, beer - sipAmount * dt * 0.13);
  draw(timestamp / 1000);
  requestAnimationFrame(animate);
}

function handleOrientation(event) {
  if (event.beta == null || event.gamma == null) return;
  if (!motionReceived) {
    motionReceived = true;
    clearTimeout(motionTimeout);
    motionStatus.textContent = "Tilt to slosh. Tip back to drink.";
    motionButton.textContent = "Tilt enabled";
    motionButton.disabled = true;
  }
  targetTilt = clamp(-event.gamma / 45, -1, 1);
  // An upright phone is about 90 degrees; tipping it toward horizontal pours a sip.
  sipAmount = clamp((Math.abs(event.beta - 90) - 55) / 25, 0, 1);
}

motionButton.addEventListener("click", async () => {
  if (typeof DeviceOrientationEvent === "undefined") {
    motionStatus.textContent = "Motion isn't available here. Try opening the site over HTTPS.";
    return;
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        motionStatus.textContent = "Motion permission wasn't granted.";
        return;
      }
    }
    if (!motionListening) {
      window.addEventListener("deviceorientation", handleOrientation);
      motionListening = true;
    }
    motionStatus.textContent = "Waiting for your phone's motion sensor...";
    clearTimeout(motionTimeout);
    motionTimeout = setTimeout(() => {
      if (!motionReceived) motionStatus.textContent = "No motion sensor detected.";
    }, 3000);
  } catch {
    motionStatus.textContent = "Couldn't access motion.";
  }
});

refillButton.addEventListener("click", () => {
  beer = initialBeer;
  velocity += 0.8;
  sipAmount = 0;
});

window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => {
  lastTime = 0;
  if (document.hidden) sipAmount = 0;
});

resize();
requestAnimationFrame(animate);

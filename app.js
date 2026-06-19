import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const canvas = document.querySelector("#hero-canvas");
const hero = document.querySelector(".hero");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.05, 6.8);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const group = new THREE.Group();
group.position.set(0.25, 0.02, 0);
scene.add(group);

const geometry = new THREE.IcosahedronGeometry(1.46, 5);
const basePositions = Float32Array.from(geometry.attributes.position.array);
const material = new THREE.MeshPhysicalMaterial({
  color: 0x535c91,
  emissive: 0x1b1a55,
  emissiveIntensity: 0.35,
  metalness: 0.42,
  roughness: 0.18,
  clearcoat: 0.9,
  clearcoatRoughness: 0.18,
  transmission: 0.12,
});
const core = new THREE.Mesh(geometry, material);
group.add(core);

const ribbon = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.12, 0.035, 240, 18, 2, 5),
  new THREE.MeshPhysicalMaterial({
    color: 0x9290c3,
    emissive: 0x535c91,
    emissiveIntensity: 0.38,
    metalness: 0.18,
    roughness: 0.16,
    clearcoat: 0.84,
    transparent: true,
    opacity: 0.82,
  }),
);
ribbon.rotation.set(1.2, 0.18, 0.42);
group.add(ribbon);

const wire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.55, 3),
  new THREE.MeshBasicMaterial({
    color: 0x9290c3,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  }),
);
group.add(wire);

const rings = [];
const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x9290c3,
  transparent: true,
  opacity: 0.5,
});

for (let index = 0; index < 4; index += 1) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.92 + index * 0.22, 0.01, 12, 180), ringMaterial);
  ring.rotation.x = 1.15 + index * 0.35;
  ring.rotation.y = 0.36 + index * 0.42;
  rings.push(ring);
  group.add(ring);
}

const satelliteGroup = new THREE.Group();
const satelliteMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x9290c3,
  emissive: 0x535c91,
  emissiveIntensity: 0.8,
  metalness: 0.2,
  roughness: 0.28,
});

for (let index = 0; index < 7; index += 1) {
  const satellite = new THREE.Mesh(new THREE.OctahedronGeometry(0.085 + (index % 3) * 0.025, 0), satelliteMaterial);
  satellite.userData.phase = (Math.PI * 2 * index) / 7;
  satelliteGroup.add(satellite);
}

group.add(satelliteGroup);

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 980;
const positions = new Float32Array(particleCount * 3);

for (let index = 0; index < particleCount; index += 1) {
  const radius = 3.2 + Math.random() * 4.4;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[index * 3 + 2] = radius * Math.cos(phi);
}

particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    color: 0x9290c3,
    size: 0.018,
    transparent: true,
    opacity: 0.7,
  }),
);
scene.add(particles);

const keyLight = new THREE.PointLight(0x9290c3, 34, 10);
keyLight.position.set(3.4, 2.4, 4.2);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x535c91, 24, 10);
fillLight.position.set(-3.2, -1.4, 3.4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x9290c3, 2.5);
rimLight.position.set(-1, 2, 2);
scene.add(rimLight);

let pointerX = 0;
let pointerY = 0;
let smoothPointerX = 0;
let smoothPointerY = 0;
let scrollProgress = 0;
let smoothScrollProgress = 0;
const animatedSections = [...document.querySelectorAll(".section, .contact-section")];
const projectCardParallax = [...document.querySelectorAll(".project-card")];
const tickerItems = [...document.querySelectorAll(".ticker span")];

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(value) {
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
}

function updatePageParallax() {
  const viewportHeight = window.innerHeight;

  animatedSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const rawProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
    const progress = smoothstep(rawProgress);
    const centered = clamp(1 - Math.abs(progress - 0.54) * 1.85);

    section.style.setProperty("--section-shift", `${(1 - centered) * 72 - progress * 16}px`);
    section.style.setProperty("--section-fade", `${0.38 + centered * 0.62}`);
    section.style.setProperty("--section-scale", `${0.965 + centered * 0.035}`);
    section.style.setProperty("--section-tilt", `${(0.5 - progress) * 3.5}deg`);
  });

  projectCardParallax.forEach((card, index) => {
    if (card.classList.contains("is-hidden")) return;

    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const horizontalProgress = clamp(cardCenter / Math.max(window.innerWidth, 1));
    const verticalProgress = smoothstep((viewportHeight - rect.top) / (viewportHeight + rect.height));
    const stagger = (index % 4) * 14;

    card.style.setProperty("--card-shift", `${(1 - verticalProgress) * (54 + stagger) - verticalProgress * 18}px`);
    card.style.setProperty("--card-scale", `${0.965 + verticalProgress * 0.035}`);
    card.style.setProperty("--visual-shift", `${(0.5 - horizontalProgress) * 34 + (0.5 - verticalProgress) * 40}px`);
  });

  tickerItems.forEach((item, index) => {
    item.style.setProperty("--ticker-shift", `${Math.sin(window.scrollY * 0.004 + index * 0.7) * 26}px`);
  });

}

function updateScrollProgress() {
  const heroRect = hero.getBoundingClientRect();
  const scrollableDistance = Math.max(hero.offsetHeight - window.innerHeight, 1);
  scrollProgress = Math.min(Math.max(-heroRect.top / scrollableDistance, 0), 1);
  updatePageParallax();
}

window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
});
window.addEventListener("scroll", updateScrollProgress, { passive: true });

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateScrollProgress();
  updatePageParallax();
}

window.addEventListener("resize", resize);
updateScrollProgress();
updatePageParallax();

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  smoothPointerX += (pointerX - smoothPointerX) * 0.055;
  smoothPointerY += (pointerY - smoothPointerY) * 0.055;
  smoothScrollProgress += (scrollProgress - smoothScrollProgress) * 0.075;

  const isMobile = window.innerWidth < 760;
  const baseX = isMobile ? 0.28 : 0.34;
  const travelX = isMobile ? -0.38 : -0.9;
  const travelY = isMobile ? 0.95 : 1.12;
  const scrollEase = smoothScrollProgress * smoothScrollProgress * (3 - 2 * smoothScrollProgress);
  const scrollSpin = scrollEase * Math.PI * 3.25;

  const positionsAttribute = geometry.attributes.position;
  for (let index = 0; index < positionsAttribute.count; index += 1) {
    const x = basePositions[index * 3];
    const y = basePositions[index * 3 + 1];
    const z = basePositions[index * 3 + 2];
    const pulse = Math.sin(elapsed * 1.6 + x * 2.1 + y * 1.5 + scrollEase * 7.5) * 0.032;
    const scrollFacet = Math.sin(scrollEase * Math.PI + z * 2.2) * 0.055;
    const scale = 1 + pulse + scrollFacet;
    positionsAttribute.setXYZ(index, x * scale, y * scale, z * scale);
  }
  positionsAttribute.needsUpdate = true;
  geometry.computeVertexNormals();

  core.rotation.x = elapsed * 0.44 + smoothPointerY * 0.42 + scrollSpin * 0.58;
  core.rotation.y = elapsed * 0.62 + smoothPointerX * 0.55 + scrollSpin;
  core.rotation.z = Math.sin(elapsed * 0.42) * 0.2 + scrollSpin * 0.22;
  ribbon.rotation.x = 1.2 + elapsed * 0.24 + smoothScrollProgress * 1.15;
  ribbon.rotation.y = 0.18 - elapsed * 0.16 + smoothPointerX * 0.32;
  ribbon.rotation.z = 0.42 + elapsed * 0.32 + scrollSpin * 0.62;
  wire.rotation.x = -elapsed * 0.26 + scrollSpin * 0.42;
  wire.rotation.z = elapsed * 0.34 + smoothPointerX * 0.42;

  rings.forEach((ring, index) => {
    ring.rotation.x = 1.15 + index * 0.35 + scrollSpin * (0.22 + index * 0.04);
    ring.rotation.y = 0.36 + index * 0.42 + elapsed * (0.05 + index * 0.015);
    ring.rotation.z = elapsed * (0.08 + index * 0.02) - scrollSpin * 0.18;
    ring.scale.setScalar(1 + scrollEase * (0.12 + index * 0.05));
  });

  satelliteGroup.children.forEach((satellite) => {
    const phase = satellite.userData.phase + elapsed * 0.75 + scrollSpin * 0.42;
    const radius = 2.15 + Math.sin(phase * 1.7) * 0.34 + scrollEase * 0.48;
    satellite.position.set(
      Math.cos(phase) * radius,
      Math.sin(phase * 1.2) * 0.82,
      Math.sin(phase) * radius * 0.36,
    );
    satellite.rotation.set(elapsed + phase, phase * 0.7, elapsed * 0.6);
    satellite.scale.setScalar(1 + scrollEase * 0.65);
  });

  group.rotation.y = Math.sin(elapsed * 0.34) * 0.28 + smoothPointerX * 0.34 + scrollSpin * 0.22;
  group.rotation.x = Math.cos(elapsed * 0.28) * 0.14 - smoothPointerY * 0.25 - scrollEase * 0.2;
  group.position.x = baseX + smoothPointerX * 0.44 + travelX * scrollEase;
  group.position.y = 0.02 - smoothPointerY * 0.28 + travelY * scrollEase;
  group.position.z = -smoothScrollProgress * 1.35;
  group.scale.setScalar((isMobile ? 1.2 : 1.32) + scrollEase * 0.5);

  particles.rotation.y = elapsed * 0.055 + smoothPointerX * 0.12 + scrollEase * 0.55;
  particles.rotation.x = elapsed * 0.02 + scrollEase * 0.34;
  particles.position.x = smoothPointerX * -0.2 + scrollEase * -0.35;
  particles.position.y = travelY * scrollEase * 0.32;

  camera.position.x = smoothPointerX * 0.22 - scrollEase * 0.16;
  camera.position.y = 0.05 - smoothPointerY * 0.12 + scrollEase * 0.34;
  camera.position.z = 6.55 - scrollEase * 1.15;
  camera.lookAt(group.position.x * 0.2, group.position.y * 0.12, 0);

  document.body.style.setProperty("--parallax-text", `${scrollEase * -160}px`);
  document.body.style.setProperty("--parallax-panel", `${scrollEase * -78}px`);
  document.body.style.setProperty("--parallax-fade", `${Math.max(1 - scrollEase * 0.45, 0.42)}`);
  document.body.style.setProperty("--stage-progress", `${Math.round(scrollEase * 100)}%`);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

const filterButtons = document.querySelectorAll(".filter");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    projectCards.forEach((card) => {
      card.classList.toggle("is-hidden", filter !== "all" && card.dataset.type !== filter);
    });
    updatePageParallax();
  });
});

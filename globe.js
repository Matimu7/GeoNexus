console.log("globe-v2.js loaded");
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// GEONEXUS 3D EARTH
// Upright fly-to + idle sway + Hatfield label + re-centre button

const canvas = document.getElementById("globeCanvas");
const container = canvas.parentElement; // .globe-container (position: relative)

// SCENE
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera(
    35,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
);
camera.position.z = 4.2; // Start zoomed out for the cinematic fly-in

// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

// Keep the canvas sharp if the window is resized
window.addEventListener("resize", () => {
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});

// EARTH GROUP
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// EARTH SPHERE
const earthGeometry = new THREE.SphereGeometry(1, 96, 96);
const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x07151c,
    emissive: 0x062b2b,
    emissiveIntensity: 0.45,
    shininess: 100,
    specular: 0x000000
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earthGroup.add(earth);

// ATMOSPHERE
const atmosphereGeometry = new THREE.SphereGeometry(1.08, 96, 96);
const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x48e5c2,
    transparent: true,
    opacity: 0.10,
    side: THREE.BackSide
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
earthGroup.add(atmosphere);

// LAT/LON TO 3D CONVERSION FUNCTION
function latLonToVector3(latitude, longitude, radius = 1.012) {
    const phi = (90 - latitude) * Math.PI / 180;
    const theta = (longitude + 180) * Math.PI / 180;

    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// -----------------------------------------------------------------
// HATFIELD CAMPUS / SOUTH AFRICA TARGET CALCULATIONS
// -----------------------------------------------------------------
const hatfieldLat = -25.7556;
const hatfieldLon = 28.2332;
const markerPos = latLonToVector3(hatfieldLat, hatfieldLon, 1.02);

// Turn the globe in two steps so the poles stay vertical (no roll):
// 1) spin around Y so Hatfield's longitude faces the camera
// 2) tilt around X so its latitude sits at the centre
const hatfieldVector = latLonToVector3(hatfieldLat, hatfieldLon, 1);
const yaw = -Math.atan2(hatfieldVector.x, hatfieldVector.z);
const pitch = Math.atan2(hatfieldVector.y, Math.hypot(hatfieldVector.x, hatfieldVector.z));

const targetQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(pitch, yaw, 0, "XYZ")
);

// Starting rotation so it flies in from a neutral angle
earthGroup.rotation.y = 1.5;
const startQuaternion = earthGroup.quaternion.clone();

const targetCameraZ = 3.1;

// -----------------------------------------------------------------
// STATE:  "flying"  -> fly-in / re-centre animation
//         "idle"    -> landed on Hatfield, gently swaying
//         "user"    -> visitor has taken control (drag / zoom)
// -----------------------------------------------------------------
let mode = "flying";
let flyProgress = 0;
let idleTime = 0;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Replays the fly-in from wherever the globe currently is
window.flyToSouthAfrica = function () {
    startQuaternion.copy(earthGroup.quaternion);
    flyProgress = 0;
    mode = "flying";
    updateUI();
};

// -----------------------------------------------------------------
// UI: Hatfield label + re-centre button (created here, no HTML changes)
// -----------------------------------------------------------------
const uiStyle = document.createElement("style");
uiStyle.textContent = `
    .globe-marker-label {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 3;
        padding: 5px 14px;
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 500;
        white-space: nowrap;
        color: #E2E8F0;
        background: rgba(11, 19, 34, 0.92);
        border: 1px solid rgba(72, 229, 194, 0.6);
        border-radius: 999px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    .globe-recenter {
        position: absolute;
        right: 4%;
        bottom: 4%;
        z-index: 4;
        padding: 7px 16px;
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 500;
        color: #48E5C2;
        background: rgba(11, 19, 34, 0.92);
        border: 1px solid rgba(35, 181, 164, 0.6);
        border-radius: 999px;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease, background 0.2s ease, color 0.2s ease;
    }
    .globe-recenter.visible { opacity: 1; pointer-events: auto; }
    .globe-recenter:hover { background: #48E5C2; color: #05070D; }
    .globe-recenter:focus-visible { outline: 2px solid #48E5C2; outline-offset: 2px; }
`;
document.head.appendChild(uiStyle);

const markerLabel = document.createElement("div");
markerLabel.className = "globe-marker-label";
markerLabel.textContent = "Hatfield Campus, Pretoria";
container.appendChild(markerLabel);

const recenterBtn = document.createElement("button");
recenterBtn.type = "button";
recenterBtn.className = "globe-recenter";
recenterBtn.textContent = "Re-centre";
recenterBtn.addEventListener("click", () => window.flyToSouthAfrica());
container.appendChild(recenterBtn);

// Show the re-centre button only once the visitor has moved the globe
function updateUI() {
    recenterBtn.classList.toggle("visible", mode === "user");
    if (mode === "flying") markerLabel.style.opacity = "0";
}

// Keep the label attached to the red marker as the globe moves
const labelWorldPos = new THREE.Vector3();
function updateLabel() {
    if (mode === "flying") return;

    markerMesh.getWorldPosition(labelWorldPos);

    // Only show it while the marker faces the camera (camera sits on +Z)
    const facing = labelWorldPos.z / labelWorldPos.length();
    if (facing < 0.2) {
        markerLabel.style.opacity = "0";
        return;
    }

    labelWorldPos.project(camera);
    const x = (labelWorldPos.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-labelWorldPos.y * 0.5 + 0.5) * canvas.clientHeight;

    markerLabel.style.transform = `translate(${x + 16}px, ${y - 14}px)`;
    markerLabel.style.opacity = "1";
}

// Marker Core (Point/Dot)
const markerGeo = new THREE.SphereGeometry(0.02, 16, 16);
const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
const markerMesh = new THREE.Mesh(markerGeo, markerMat);
markerMesh.position.copy(markerPos);
earthGroup.add(markerMesh);

// Pulsing Radar Ring
const ringGeo = new THREE.RingGeometry(0.02, 0.04, 32);
const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff3366,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
});
const pulseRing = new THREE.Mesh(ringGeo, ringMat);
pulseRing.position.copy(markerPos);
pulseRing.lookAt(earthGroup.position);
earthGroup.add(pulseRing);

// Vertical Beacon Beam
const beamPoints = [
    markerPos,
    latLonToVector3(hatfieldLat, hatfieldLon, 1.15)
];
const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
const beamMat = new THREE.LineBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.7 });
const beamLine = new THREE.Line(beamGeo, beamMat);
earthGroup.add(beamLine);

// GEOJSON COUNTRY BORDERS
const borderGroup = new THREE.Group();
earthGroup.add(borderGroup);

function drawPolygon(coordinates) {
    const points = [];
    for (const coordinate of coordinates) {
        points.push(latLonToVector3(coordinate[1], coordinate[0], 1.015));
    }
    if (points.length < 2) return;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x48e5c2,
        transparent: true,
        opacity: 0.75
    });
    const line = new THREE.Line(geometry, material);
    borderGroup.add(line);
}

function processGeometry(geometry) {
    if (!geometry) return;
    if (geometry.type === "Polygon") {
        geometry.coordinates.forEach(polygon => drawPolygon(polygon));
    } else if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach(mp => mp.forEach(polygon => drawPolygon(polygon)));
    }
}

fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
    .then(res => res.json())
    .then(data => {
        data.features.forEach(feature => processGeometry(feature.geometry));
    })
    .catch(err => console.error("Map load error:", err));

// LIGHTING
scene.add(new THREE.AmbientLight(0x48e5c2, 1.4));
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// OUTER ORBIT RINGS & STARS
function createOrbitRing(radius, rotationX, rotationY) {
    const geometry = new THREE.RingGeometry(radius, radius + 0.002, 128);
    const material = new THREE.MeshBasicMaterial({
        color: 0x48e5c2,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = rotationX;
    ring.rotation.y = rotationY;
    scene.add(ring);
    return ring;
}

// Both rings tilt only toward/away from the viewer, so they stay level on screen
const orbit1 = createOrbitRing(1.28, Math.PI / 2.5, 0);
const orbit2 = createOrbitRing(1.35, Math.PI / 2.2, 0);

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 700; i++) {
    const radius = 3 + Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
    );
}
starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0x48e5c2, size: 0.012, transparent: true, opacity: 0.55 })
);
scene.add(stars);

// MOUSE INTERACTION
let mouseDown = false;
let previousMouseX = 0;
let previousMouseY = 0;

canvas.addEventListener("pointerdown", e => {
    mode = "user"; // visitor takes control: stop fly-in and sway
    updateUI();
    mouseDown = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", e => {
    if (!mouseDown) return;
    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;

    earthGroup.rotation.y += deltaX * 0.006;
    earthGroup.rotation.x += deltaY * 0.003;
    earthGroup.rotation.x = Math.max(-0.5, Math.min(0.5, earthGroup.rotation.x));

    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

canvas.addEventListener("pointerup", () => mouseDown = false);
canvas.addEventListener("pointerleave", () => mouseDown = false);

// ZOOM
canvas.addEventListener("wheel", e => {
    e.preventDefault();
    mode = "user";
    updateUI();
    camera.position.z += e.deltaY * 0.001;
    camera.position.z = Math.max(2.1, Math.min(4.5, camera.position.z));
}, { passive: false });

// ANIMATION LOOP
const clock = new THREE.Clock();
let ringScale = 1;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (mode === "flying") {
        flyProgress += 0.02; // Adjust speed here (higher = faster)
        const alpha = Math.min(flyProgress, 1);

        // Smooth spherical interpolation of rotation
        earthGroup.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, alpha);
        // Smooth camera zoom interpolation
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraZ, 0.05);

        // Landed: hand over to the idle sway
        if (alpha >= 1) {
            mode = "idle";
            idleTime = 0;
            updateUI();
        }
    } else if (mode === "idle") {
        idleTime += delta;

        // Gentle sway around Hatfield; poles stay vertical.
        // Starts at exactly the landing pose (sin(0) = 0), so there is no jump.
        const sway = reduceMotion ? 0 : 1;
        earthGroup.rotation.set(
            pitch + Math.sin(idleTime * 0.7) * 0.02 * sway,
            yaw + Math.sin(idleTime * 0.5) * 0.12 * sway,
            0
        );
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraZ, 0.05);
    }

    ringScale += 0.015;
    if (ringScale > 2.5) ringScale = 1;
    pulseRing.scale.set(ringScale, ringScale, ringScale);
    ringMat.opacity = Math.max(0, 1 - (ringScale - 1) / 1.5);

    orbit1.rotation.z += 0.0005;
    orbit2.rotation.z -= 0.0003;
    stars.rotation.y += 0.0001;

    renderer.render(scene, camera);
    updateLabel(); // after render so it follows the latest camera/globe pose
}
animate();

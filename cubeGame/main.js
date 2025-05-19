import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let gameStartTime = null;
let elapsedTime = 0;

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // kolor, intensywność
scene.add(ambientLight);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

scene.background = new THREE.Color("#87CEEB");

camera.position.set(0, 2, 27);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color = "#f0000f",
    velocity = {
      x: 0,
      y: 0,
      z: 0,
    },
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    zAcceleration = false,
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: color })
    );
    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = -0.03;

    this.zAcceleration = zAcceleration;
  }

  updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  update(ground) {
    this.updateSides();

    if (this.zAcceleration) {
      this.velocity.z += 0.0004;
    }

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    if (
      boxCollision({
        box1: this,
        box2: ground,
      })
    ) {
      this.velocity.y *= 0.8;
      this.velocity.y = -this.velocity.y;
    } else this.position.y += this.velocity.y;
  }
}

function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right;
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
  const zCollision = box1.front >= box2.back && box1.back <= box2.front;

  return xCollision && yCollision && zCollision;
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  color: "#FFF700",
  velocity: {
    x: 0,
    y: -0.03,
    z: 0,
  },
  position: {
    x: 0,
    y: 0,
    z: 20,
  },
});
scene.add(cube);
camera.lookAt(cube.position);
const ground = new Box({
  width: 10,
  height: 0.5,
  depth: 50,
  color: "#0369a1",
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});
scene.add(ground);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 2;
light.position.z = 5;

scene.add(light);

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
};

window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = true;
      break;
    case "KeyD":
      keys.d.pressed = true;
      break;
    case "KeyW":
      keys.w.pressed = true;
      break;
    case "KeyS":
      keys.s.pressed = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
    case "KeyW":
      keys.w.pressed = false;
      break;
    case "KeyS":
      keys.s.pressed = false;
      break;
  }
});

const enemies = [];

let frames = 0;

let animationId = null;

function animate() {
  if (gameStartTime) {
    elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    document.getElementById(
      "timer"
    ).innerText = `Czas gry: ${minutes}m ${seconds}s`;
  }

  animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);

  cube.velocity.x = 0;
  cube.velocity.z = 0;

  if (keys.a.pressed) {
    cube.velocity.x = -0.05;
  } else if (keys.d.pressed) {
    cube.velocity.x = 0.05;
  }

  if (keys.w.pressed) cube.velocity.z = -0.05;
  else if (keys.s.pressed) cube.velocity.z = 0.05;

  cube.update(ground);
  enemies.forEach((enemy, index) => {
    enemy.update(ground);
    if (
      boxCollision({
        box1: cube,
        box2: enemy,
      })
    ) {
      cancelAnimationFrame(animationId);
      document.getElementById("gameOver").style.display = "block";
    }

    if (enemy.position.z > 25) {
      scene.remove(enemy);
      enemies.splice(index, 1);
    }
  });

  if (cube.position.y < -5) {
    cancelAnimationFrame(animationId);
    document.getElementById("gameOver").style.display = "block";
  }

  if (frames % 100 === 0) {
    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      color: "#FF3300",
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: -25,
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0.065,
      },
      zAcceleration: false,
    });

    scene.add(enemy);
    enemies.push(enemy);
  }
  frames++;

  camera.position.z = cube.position.z + 5;
  camera.position.x = cube.position.x;
  controls.target.set(cube.position.x, cube.position.y, cube.position.z);
  controls.update();
}

function resetGame() {
  cancelAnimationFrame(animationId);
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("play").style.display = "none";

  enemies.forEach((enemy) => scene.remove(enemy));
  enemies.length = 0;
  cube.position.set(0, 0, 20);
  cube.velocity = { x: 0, y: 0, z: 0 };
  frames = 0;

  camera.position.set(0, 2, 27);

  gameStartTime = Date.now();
  elapsedTime = 0;

  animate();
}

document.getElementById("restart").addEventListener("click", () => {
  resetGame();
});

document.getElementById("play").style.display = "block";

renderer.render(scene, camera);

document.getElementById("play").addEventListener("click", () => {
  gameStartTime = Date.now();
  elapsedTime = 0;

  document.getElementById("restart").style.display = "";
  document.getElementById("play").style.display = "none";
  animate();
});

/*
  Week 6 — Example 2: Tile-Based Level & Basic Movement
*/

let ground;
let jumpSound;
let dustParticles = [];
let landed = false;

let player;
let playerImg, bgImg;

let playerAnis = {
  idle: { row: 0, frames: 4, frameDelay: 10 },
  run: { row: 1, frames: 4, frameDelay: 3 },
  jump: { row: 2, frames: 3, frameDelay: Infinity, frame: 0 },
  attack: { row: 3, frames: 6, frameDelay: 2 },
};

let groundDeep;
let groundImg, groundDeepImg;

let attacking = false;
let attackFrameCounter = 0;

// --- DEBUG ---
let debugMode = false;
let moonGravity = false;
let showHitboxes = false;

const NORMAL_GRAVITY = 10;
const MOON_GRAVITY = 3;

// --- TILE MAP ---
let level = [
  "              ",
  "              ",
  "              ",
  "              ",
  "           gg  ",
  "       ggg    ",
  "gggggggggggggg",
  "dddddddddddddd",
];

// --- CONSTANTS ---
const VIEWW = 320;
const VIEWH = 180;

const TILE_W = 24;
const TILE_H = 24;

const FRAME_W = 32;
const FRAME_H = 32;

const MAP_START_Y = VIEWH - TILE_H * 4;

function preload() {
  playerImg = loadImage("assets/foxSpriteSheet.png");
  bgImg = loadImage("assets/combinedBackground.png");
  groundImg = loadImage("assets/groundTile.png");
  groundDeepImg = loadImage("assets/groundTileDeep.png");
}

function setup() {
  createCanvas(800, 400);

  new Canvas(VIEWW, VIEWH, "pixelated");

  allSprites.pixelPerfect = true;

  world.gravity.y = NORMAL_GRAVITY;

  // --- TILE GROUPS ---
  ground = new Group();
  ground.physics = "static";
  ground.img = groundImg;
  ground.tile = "g";

  groundDeep = new Group();
  groundDeep.physics = "static";
  groundDeep.img = groundDeepImg;
  groundDeep.tile = "d";

  new Tiles(level, 0, 0, TILE_W, TILE_H);

  // --- PLAYER ---
  player = new Sprite(FRAME_W, MAP_START_Y, FRAME_W, FRAME_H);
  player.spriteSheet = playerImg;
  player.rotationLock = true;

  player.anis.w = FRAME_W;
  player.anis.h = FRAME_H;
  player.anis.offset.y = -4;
  player.addAnis(playerAnis);
  player.ani = "idle";

  player.w = 18;
  player.h = 20;
  player.friction = 0;
  player.bounciness = 0;

  // --- SENSOR ---
  sensor = new Sprite();
  sensor.x = player.x;
  sensor.y = player.y + player.h / 2;
  sensor.w = player.w;
  sensor.h = 2;
  sensor.mass = 0.01;
  sensor.removeColliders();
  sensor.visible = false;

  let sensorJoint = new GlueJoint(player, sensor);
  sensorJoint.visible = false;
}

function draw() {
  // --- BACKGROUND ---
  camera.off();
  imageMode(CORNER);
  image(bgImg, 0, 0, bgImg.width, bgImg.height);
  camera.on();

  // --- GRAVITY TOGGLE ---
  world.gravity.y = moonGravity ? MOON_GRAVITY : NORMAL_GRAVITY;

  // --- GROUND CHECK ---
  let grounded = sensor.overlapping(ground);

  // --- ATTACK ---
  if (grounded && !attacking && kb.presses("space")) {
    attacking = true;
    attackFrameCounter = 0;
    player.vel.x = 0;
    player.ani.frame = 0;
    player.ani = "attack";
    player.ani.play();
  }

  // --- JUMP ---
  if (kb.presses("up") && grounded) {
    player.vel.y = -4.5;
  }

  // --- STATE MACHINE ---
  if (attacking) {
    attackFrameCounter++;
    if (attackFrameCounter > 12) {
      attacking = false;
      attackFrameCounter = 0;
    }
  } else if (!grounded) {
    player.ani = "jump";
    player.ani.frame = player.vel.y < 0 ? 0 : 1;
  } else {
    player.ani = kb.pressing("left") || kb.pressing("right") ? "run" : "idle";
  }

  // --- LANDING DUST ---
  if (player.collides(ground) && !landed) {
    for (let i = 0; i < 6; i++) {
      let dust = new Sprite(
        player.x + random(-6, 6),
        player.y + 12,
        random(3, 6),
      );

      dust.color = "#d6d6d6";
      dust.vel.y = random(-0.2, -0.6);
      dust.vel.x = random(-0.5, 0.5);
      dust.life = 25;
    }

    landed = true;
  }

  if (!player.colliding(ground)) {
    landed = false;
  }

  // --- MOVEMENT ---
  if (!attacking) {
    player.vel.x = 0;

    if (kb.pressing("left")) {
      player.vel.x = -1.5;
      player.mirror.x = true;
    } else if (kb.pressing("right")) {
      player.vel.x = 1.5;
      player.mirror.x = false;
    }
  }

  // --- KEEP IN VIEW ---
  player.pos.x = constrain(player.pos.x, FRAME_W / 2, VIEWW - FRAME_W / 2);

  // --- DEBUG UI ---
  if (debugMode) {
    drawDebugPanel();
  }

  if (debugMode && showHitboxes) {
    drawHitboxes();
  }
}

// --- DEBUG CONTROLS ---
function keyPressed() {
  if (key === "d" || key === "D") {
    debugMode = !debugMode;
  }

  if (debugMode) {
    if (key === "g" || key === "G") {
      moonGravity = !moonGravity;
    }

    if (key === "h" || key === "H") {
      showHitboxes = !showHitboxes;
    }
  }
}

// --- DEBUG PANEL ---
function drawDebugPanel() {
  camera.off();

  push();
  fill(0, 180);
  rect(10, 10, 220, 130, 8);

  fill(255);
  textSize(10);

  text("DEBUG MODE (D)", 20, 25);
  text("G: Moon Gravity → " + (moonGravity ? "ON" : "OFF"), 20, 45);
  text("H: Hitboxes → " + (showHitboxes ? "ON" : "OFF"), 20, 60);

  text("FPS: " + floor(frameRate()), 20, 80);
  text("X: " + floor(player.x), 20, 95);
  text("Y: " + floor(player.y), 20, 110);
  text("State: " + player.ani.name, 20, 125);

  pop();

  camera.on();
}

// --- HITBOXES ---
function drawHitboxes() {
  push();
  noFill();
  strokeWeight(1);

  // player
  stroke(255, 0, 0);
  rect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);

  // sensor
  stroke(0, 255, 0);
  rect(sensor.x - sensor.w / 2, sensor.y - sensor.h / 2, sensor.w, sensor.h);

  pop();
}

/* smooth cursor functionality */
let videHandler;
let smooth = false;

const initVide = () => {
  // create cursor canvas (prioritized blank canvas that draws cursor animations)
  cvs = document.createElement("canvas");
  cvs.style.position = "absolute";
  cvs.style.pointerEvents = "none";
  cvs.style.top = "0px";
  cvs.style.left = "0px";
  cvs.style.zIndex = "1000";
  document.body.appendChild(cvs);
  videHandler = createTrail();
  smooth = true;
  updateLoop();
}


let cvs;
let cursorIsInit = false;

// heavily inspired from https://github.com/qwreey/dotfiles/blob/master/vscode/trailCursorEffect/index.js
// https://github.com/tholman/cursor-effects the useless web
const createTrail = () => {
  const totalParticles = 4;
  let particlesColor = "white"; // cursor color here
  const style = cursors.block; // can change later
  const context = cvs.getContext("2d");
  let cursor = { x: 0, y: 0 }; // coords here
  let particles = [];
  let width = document.body.clientWidth;
  let height = document.body.clientHeight;
  let sizeX = 9.3;
  // let sizeY = sizeX*2.2;
  let sizeY = 17;
  const updateSize = (x, y) => {
    width = x;
    height = y;
    cvs.width = x;
    cvs.height = y;
  }
  updateSize(width, height);

  class Vec2 {
    constructor(x, y) {
      this.position = { x: x, y: y };
    }
  }

  const addParticle = (x, y, image) => {
    particles.push(new Vec2(x, y, image))
  }

  const calculatePosition = () => {
    let x = cursor.x, y = cursor.y;

    for (const particleIndex in particles) {
      const nextParticlePos = (particles[+particleIndex + 1] || particles[0]).position
      const particlePos = particles[+particleIndex].position

      particlePos.x = x;
      particlePos.y = y;

      x += (nextParticlePos.x - particlePos.x) * 0.42
      y += (nextParticlePos.y - particlePos.y) * 0.35
    }
  }

  const move = (x, y) => {
    x = x + sizeX / 2;
    cursor.x = x;
    cursor.y = y;
    if (cursorIsInit === false) {
      cursorIsInit = true
      for (let i = 0; i < totalParticles; i++) {
        addParticle(x, y);
      }
    }
  }

  const drawLines = () => {
    context.beginPath();
    context.lineJoin = "round";
    context.strokeStyle = particlesColor;
    const lineWidth = Math.min(sizeX, sizeY);
    context.lineWidth = lineWidth;

    let ymut = (sizeY - lineWidth) / 3
    for (let yoffset = 0; yoffset <= 3; yoffset++) {
      let offset = yoffset * ymut
      for (const particleIndex in particles) {
        const pos = particles[particleIndex].position
        if (particleIndex == 0) {
          context.moveTo(pos.x, pos.y + offset + lineWidth / 2)
        } else {
          context.lineTo(pos.x, pos.y + offset + lineWidth / 2)
        }
      }
    }
    context.stroke();
  }

  const updateParticles = () => {
    if (!cursorIsInit) return;
    const rect = document.getElementById("livecursor").getBoundingClientRect();

    context.clearRect(0, 0, width, height);
    calculatePosition();

    if (currentState === states.normal) {
      sizeX = 9.3;
    }
    else if (currentState === states.insert) {
      sizeX = 1;
    }
    drawLines();
  }
  return {
    updateParticles: updateParticles,
    move: move,
    updateSize: updateSize,
  }
}

const updateLoop = () => {
  videHandler.updateParticles();
  requestAnimationFrame(updateLoop)
}

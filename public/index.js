
import Game from "@app/stuff";

// get dom stuff
const dom = {
  pause: document.getElementById("pause"),
  canvas: document.querySelector("canvas"),
  step: document.getElementById("step"),
  imgChar: document.getElementById("adventurer"),
  imgFood: document.getElementById("food"),
  imgEnv: document.getElementById("environment"),
  stats: document.getElementById("stats"),
  imgTrees: document.getElementById("trees")
};

// init game
const game = new Game(dom.canvas, [dom.imgChar, dom.imgFood, dom.imgEnv, dom.imgTrees], dom.stats);

// bind controls

// play pause button
dom.pause.addEventListener("click", () => {
  game.setRunning(!game.running);
  dom.pause.innerText = game.running ? "Pause" : "Play";
});
dom.pause.innerText = game.running ? "Pause" : "Play";

// step - play 1 iteration and then pause
dom.step.addEventListener("click", () => {
  game.step();
})

// play
game.loop();

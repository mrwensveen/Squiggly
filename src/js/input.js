const INPUT = {
  keys: [],
  shift: false,
  keyDownHandlers: new Map(),
  keyUpHandlers: new Map()
}

document.addEventListener("keydown", event => {
  if (event.isComposing || event.keyCode === 229) {
    return;
  }

  if (event.key.startsWith("Shift")) {
    INPUT.shift = true;
  } else {
    INPUT.keys[event.keyCode] = true;
  }

  if(INPUT.keyDownHandlers && INPUT.keyDownHandlers.size) {
    INPUT.keyDownHandlers.forEach(h => h && h(event));
  }
});

document.addEventListener("keyup", event => {
  if (event.isComposing || event.keyCode === 229) {
    return;
  }

  if (event.key.startsWith("Shift")) {
    INPUT.shift = false;
  } else {
    delete INPUT.keys[event.keyCode];
  }

  if(INPUT.keyUpHandlers && INPUT.keyUpHandlers.size) {
    INPUT.keyUpHandlers.forEach(h => h && h(event));
  }
});

export default INPUT;

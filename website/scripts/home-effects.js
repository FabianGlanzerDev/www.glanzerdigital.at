const TERMINAL_SNIPPETS = [
  {
    code: `const developer = {\n  coffee: true,\n  bugs: 0,\n};\n\nif (developer.bugs === 0) {\n  console.log('Noch nicht getestet.');\n}`,
    output: 'Der Code funktioniert. Die Frage ist nur: warum?'
  },
  {
    code: `function fixBug(bug) {\n  if (!bug) return 'feature';\n  return fixBug(null);\n}`,
    output: '90 % Debugging, 10 % herausfinden, was man eigentlich gebaut hat.'
  },
  {
    code: `const coffee = 0;\n\nwhile (coffee === 0) {\n  console.log('Compiler wartet …');\n  break;\n}`,
    output: 'Kein Kaffee, kein Deployment.'
  },
  {
    code: `const binaryJoke = 10;\n\nconsole.log(\n  'Es gibt ' + binaryJoke +\n  ' Arten von Menschen.'\n);`,
    output: 'Die, die Binär verstehen – und die anderen.'
  }
];


let terminalIndex = 0;
let terminalCharacter = 0;
let terminalTimer = 0;
let terminalPaused = false;


function getTerminalElements() {
  return {
    code: document.querySelector('[data-terminal-code]'),
    output: document.querySelector('[data-terminal-output]'),
    pause: document.querySelector('[data-terminal-pause]')
  };
}


function clearTerminalTimer() {
  window.clearTimeout(terminalTimer);
}


function setPauseButton(button) {
  button.setAttribute('aria-pressed', String(terminalPaused));
  button.textContent = terminalPaused ? 'Animation fortsetzen' : 'Animation pausieren';
}


function showTerminalOutput(output) {
  const snippet = TERMINAL_SNIPPETS[terminalIndex];
  output.textContent = snippet.output;
  terminalTimer = window.setTimeout(nextTerminalSnippet, 3200);
}


function typeTerminalCharacter(code, output) {
  if (terminalPaused) return;
  const snippet = TERMINAL_SNIPPETS[terminalIndex];
  code.textContent = snippet.code.slice(0, terminalCharacter += 1);
  if (terminalCharacter >= snippet.code.length) return showTerminalOutput(output);
  terminalTimer = window.setTimeout(() => typeTerminalCharacter(code, output), 22);
}


function startTerminalSnippet() {
  const elements = getTerminalElements();
  if (!elements.code || !elements.output || terminalPaused) return;
  terminalCharacter = 0;
  elements.code.textContent = '';
  elements.output.textContent = 'Code wird ausgeführt …';
  typeTerminalCharacter(elements.code, elements.output);
}


function nextTerminalSnippet() {
  terminalIndex = (terminalIndex + 1) % TERMINAL_SNIPPETS.length;
  startTerminalSnippet();
}


function toggleTerminal() {
  const { pause } = getTerminalElements();
  if (!pause) return;
  terminalPaused = !terminalPaused;
  clearTerminalTimer();
  setPauseButton(pause);
  if (!terminalPaused) startTerminalSnippet();
}


function renderReducedMotionTerminal() {
  const { code, output, pause } = getTerminalElements();
  if (!code || !output || !pause) return;
  code.textContent = TERMINAL_SNIPPETS[0].code;
  output.textContent = TERMINAL_SNIPPETS[0].output;
  pause.hidden = true;
}


function initializeTerminal() {
  const { pause } = getTerminalElements();
  if (!pause) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return renderReducedMotionTerminal();
  pause.addEventListener('click', toggleTerminal);
  startTerminalSnippet();
}


initializeTerminal();

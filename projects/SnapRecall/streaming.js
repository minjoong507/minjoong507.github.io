(() => {
  const demo = document.querySelector('.stream-demo');
  const layout = demo.querySelector('.stream-layout');
  const canvas = demo.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const film = new Image();
  const play = demo.querySelector('[data-play]');
  const previous = demo.querySelector('[data-previous]');
  const next = demo.querySelector('[data-next]');
  const restart = demo.querySelector('[data-restart]');
  const progress = demo.querySelector('.stream-progress span');
  const explanation = demo.querySelector('[data-explanation]');
  const narration = demo.querySelector('[data-narration]');
  const steps = [...demo.querySelectorAll('[data-step]')];
  const lanes = [...demo.querySelectorAll('[data-lane]')];
  const captions = [
    'A person in a pale top stands at the kitchen counter.',
    'They take a step to the right along the counter.',
    'The person on the right points toward the cabinets.',
    'The person at the counter raises an arm toward an upper cabinet.',
    'They swing the upper cabinet door open.',
    'They reach up into the open cabinet.'
  ];
  const colors = ['#2371ac', '#7750a5', '#12705c', '#a65721', '#a63e70', '#455ab0'];
  const stepTime = 1600;
  const lastStep = captions.length * steps.length - 1;
  let elapsed = 0;
  let playing = false;
  let visible = false;
  let request = null;
  let lastTime;
  let lastFrame = -1;
  let renderedStep = -1;

  function chip(id, snapshot, status = '') {
    const group = document.createElement('span');
    group.className = 'stream-token-group';
    group.dataset.status = status;
    group.append(snapshot ? `M${id}` : `S${id}`);
    if (status) {
      const label = document.createElement('small');
      label.textContent = status;
      group.append(label);
    }
    const bars = document.createElement('span');
    bars.className = 'stream-token-bars';
    bars.setAttribute('aria-hidden', 'true');
    for (const color of snapshot ? colors.slice(0, id) : [colors[id - 1]]) {
      const bar = document.createElement('span');
      bar.style.backgroundColor = color;
      bars.append(bar);
    }
    group.append(bars);
    return group;
  }

  function render(announce = false) {
    const step = Math.min(lastStep, Math.floor(elapsed / stepTime));
    const phase = step % steps.length;
    const stage = steps[phase].dataset.step;
    const segment = Math.floor(step / steps.length) + 1;
    const fraction = phase === 0 ? (elapsed % stepTime) / stepTime : 1;
    const frame = (segment - 1) * 28 + Math.min(27, Math.floor(fraction * 28));
    if (film.naturalWidth && frame !== lastFrame) {
      const x = (frame % 12) * canvas.width;
      const y = Math.floor(frame / 12) * canvas.height;
      context.drawImage(film, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      lastFrame = frame;
    }
    progress.style.transform = `scaleX(${fraction})`;
    if (renderedStep === step && !announce) return;
    renderedStep = step;

    const latestLocal = phase === 0 ? segment - 1 : segment;
    const evicted = Math.max(0, segment - 2);
    const latestMemory = phase < 2 ? Math.max(0, evicted - 1) : evicted;
    const selected = latestMemory;
    const local = [];
    const memory = [];
    for (let id = Math.max(1, latestLocal - 1); id <= latestLocal; id++) {
      local.push(chip(id, false, stage === 'local' && id === segment ? 'New' : ''));
    }
    for (let id = Math.max(1, latestMemory - 2); id <= latestMemory; id++) {
      const status = stage === 'memory' && id === latestMemory ? 'Written'
        : (stage === 'route' || stage === 'output') && id === selected ? 'Read' : '';
      memory.push(chip(id, true, status));
    }
    const localContext = Array.from({ length: Math.min(2, segment) }, (_, index) =>
      `S${Math.max(1, segment - 1) + index}`).join(' + ');
    const messages = {
      capture: `Frames arrive for segment S${segment}.`,
      local: evicted ? `S${segment} enters the window. S${evicted} leaves for the snapshot write.`
        : `S${segment} enters the local window.`,
      memory: evicted
        ? `M${evicted} adds S${evicted} to ${evicted === 1 ? 'an empty memory state' : `M${evicted - 1}`}.${evicted > 3 ? ` The bank drops M${evicted - 3}. Its history survives in the remaining snapshots.` : ''}`
        : 'All received segments still fit in the local window.',
      route: selected
        ? `The model scores the available snapshots for tokens in S${segment}. In this example it reads M${selected}, which covers S1 through S${selected}.`
        : 'The model attends to the local window. The snapshot bank is empty.',
      output: selected
        ? `A learned gate controls how much of the M${selected} readout is added to local attention.`
        : 'The narration uses context from local attention.'
    };
    demo.querySelector('[data-local]').replaceChildren(...(local.length ? local : ['Empty']));
    demo.querySelector('[data-memory]').replaceChildren(...(memory.length ? memory : ['Empty']));
    demo.querySelector('[data-output]').textContent = stage === 'output'
      ? `Local attention (${localContext})${selected ? ` + gated readout (M${selected})` : ''}`
      : 'Waiting for this segment';
    demo.querySelector('[data-segment]').textContent = `Segment ${segment} of ${captions.length}`;
    explanation.textContent = messages[stage];
    demo.querySelector('[data-announcement]').textContent = announce
      ? `Segment ${segment}. ${steps[phase].textContent}. ${messages[stage]}` : '';
    narration.textContent = captions[segment - (stage === 'output' ? 1 : 2)]
      ?? 'Waiting for the first segment to finish.';
    steps.forEach((item, index) => {
      if (index === phase) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    lanes.forEach(lane => {
      const name = lane.dataset.lane;
      lane.dataset.active = String(name === stage || (stage === 'route' && name === (selected ? 'memory' : 'local')));
    });
    previous.disabled = step === 0;
    next.disabled = step === lastStep;
  }

  function syncPlayback() {
    play.textContent = playing ? 'Pause' : elapsed >= (lastStep + 1) * stepTime ? 'Replay' : 'Play';
    if (playing && visible && !document.hidden) {
      if (request === null) request = requestAnimationFrame(tick);
    } else {
      if (request !== null) cancelAnimationFrame(request);
      request = null;
      lastTime = undefined;
    }
  }

  function tick(time) {
    request = null;
    if (lastTime !== undefined) elapsed = Math.min((lastStep + 1) * stepTime, elapsed + time - lastTime);
    lastTime = time;
    if (elapsed >= (lastStep + 1) * stepTime) playing = false;
    render();
    syncPlayback();
  }

  function goTo(step) {
    playing = false;
    elapsed = step * stepTime;
    render(true);
    syncPlayback();
  }

  previous.addEventListener('click', () => goTo(Math.max(0, renderedStep - 1)));
  next.addEventListener('click', () => goTo(Math.min(lastStep, renderedStep + 1)));
  restart.addEventListener('click', () => goTo(0));
  play.addEventListener('click', () => {
    if (elapsed >= (lastStep + 1) * stepTime) elapsed = 0;
    playing = !playing;
    render();
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(layout);

  film.addEventListener('load', () => render());
  film.addEventListener('error', () => {
    canvas.hidden = true;
    demo.querySelector('.stream-progress').hidden = true;
  });
  film.src = 'assets/kitchen-stream.webp';
  render();
  layout.hidden = false;
  syncPlayback();
})();

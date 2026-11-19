// The teaser uses the paper's reported OVO-Bench averages.
(() => {
  const svg = document.getElementById("teaser-chart");
  const entries = document.getElementById("teaser-models").content.querySelectorAll("option");
  const realtimeScore = document.getElementById("teaser-realtime");
  const backwardScore = document.getElementById("teaser-backward");
  const models = Array.from(entries, option => ({
    label: option.dataset.label, name: option.textContent, realtime: Number(option.dataset.realtime), backward: Number(option.dataset.backward),
  }));
  const make = (tag, attrs, text) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  // Keep names clear of neighboring points, especially in the upper-right cluster.
  const labelOffsets = {
    Dispider: [9, 0],
    "TimeChat-Online": [0, -10],
    StreamAgent: [9, 14],
    Streamo: [9, -5],
    HERMES: [-9, -6],
    SimpleStream: [-9, 16],
    StreamTTT: [-10, 4],
    SnapRecall: [-10, -10],
  };
  let markers = [];
  let selectedIndex = models.findIndex((_, index) => entries[index].hasAttribute("data-default"));
  function select(index) {
    selectedIndex = index;
    const {realtime, backward} = models[index];
    realtimeScore.textContent = realtime.toFixed(1) + "%";
    backwardScore.textContent = backward.toFixed(1) + "%";
    markers.forEach((mark, i) => {
      mark.classList.toggle("selected", i === index);
      mark.setAttribute("aria-pressed", String(i === index));
    });
  }
  function draw() {
    const bounds = svg.getBoundingClientRect();
    const width = Math.round(bounds.width);
    const height = Math.round(bounds.height);
    const style = getComputedStyle(svg);
    const left = parseFloat(style.getPropertyValue("--teaser-plot-left"));
    const right = width - parseFloat(style.getPropertyValue("--teaser-plot-right"));
    const top = 16, bottom = height - 39;
    const x = v => left + (v - 50) / 31 * (right - left);
    const y = v => bottom - (v - 35) / 30 * (bottom - top);
    svg.setAttribute("viewBox", [0, 0, width, height].join(" "));
    svg.replaceChildren();
    function text(px, py, str, anchor, cls) {
      return make("text", {x: px, y: py, "text-anchor": anchor, class: cls}, str);
    }
    for (let v = 35; v <= 65; v += 5) {
      svg.append(make("line", {x1:left, x2:right, y1:y(v), y2:y(v), class:"plot-grid"}),
        text(left - 6, y(v) + 4, v, "end", "tick"));
    }
    for (let v = 50; v <= 80; v += 5) {
      svg.append(make("line", {x1:x(v), x2:x(v), y1:top, y2:bottom, class:"plot-grid"}),
        text(x(v), bottom + 16, v, "middle", "tick"));
    }
    svg.append(make("text", {
      transform: `translate(12,${(top + bottom) / 2}) rotate(-90)`,
      "text-anchor": "middle", class: "axis-title",
    }, "Backward tracing avg. (%)"),
      text((left + right) / 2, height - 3, "Real-time perception avg. (%)", "middle", "axis-title"));
    markers = models.map(({label, name, realtime, backward}, i) => {
      const summary = `${name} · ${realtime.toFixed(1)}% real-time · ${backward.toFixed(1)}% backward`;
      const point = make("g", {
        class: "teaser-point", transform: `translate(${x(realtime)},${y(backward)})`,
        tabindex: 0, role: "button", "aria-label": summary,
      });
      const ours = label === "SnapRecall", ttt = label === "StreamTTT";
      point.classList.toggle("ours", ours);
      point.classList.toggle("ttt", ttt);
      point.append(make("title", {}, summary),
        make("circle", {r:10, fill:"transparent"}), make("circle", {r:8.5, class:"halo"}));
      const symbol = ours
        ? make("path", {d:"M0,-8 2.3,-2.6 8,-2.4 3.5,1.4 5,7 0,3.8 -5,7 -3.5,1.4 -8,-2.4 -2.3,-2.6Z"})
        : make("circle", {r:4.6});
      symbol.setAttribute("class", "symbol");
      point.append(symbol);
      const [dx, dy] = labelOffsets[label];
      const anchor = dx < 0 ? "end" : dx === 0 ? "middle" : "start";
      point.append(text(dx, dy, name, anchor, "point-label"));
      point.addEventListener("pointerenter", () => select(i));
      point.addEventListener("click", () => select(i));
      point.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(i);
        }
      });
      svg.append(point);
      return point;
    });
    select(selectedIndex);
  }
  document.getElementById("teaser-explorer").hidden = false;
  draw();
  document.getElementById("teaser-fallback").hidden = true;
  new ResizeObserver(draw).observe(svg);
})();

// The memory plot shares its selection with the duration slider.
(() => {
  if (typeof snapRecallMeasurements === "undefined") return;
  const byId = id => document.getElementById(id);
  const colors = { purple: "#73539f", gold: "#9b610e", rose: "#b7385b" };
  const models = [
    ["native_full", "Full attention", colors.gold],
    ["streamttt", "StreamTTT", colors.purple],
    ["mc_top4", "SnapRecall", colors.rose],
  ];
  const svgNS = "http://www.w3.org/2000/svg";
  function svgElement(tag, attributes, text) {
    const node = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function seriesLabel(name, color) {
    const label = document.createElement("span");
    label.className = "series-label";
    label.style.setProperty("--series-color", color);
    label.textContent = name;
    return label;
  }

  // Points are [x, y] or [x, y, lower, upper]. Only recorded x values have markers/readouts.
  function lineChart(host, series, options, selectX) {
    const svg = svgElement("svg", { role: "img", "aria-label": options.label });
    const grid = svgElement("g", {});
    const data = svgElement("g", {});
    const cursor = svgElement("g", {});
    svg.append(grid, data, cursor);
    host.append(svg);
    const left = 45, right = 15, top = 12;
    const bottom = options.xLabel ? 43 : 27;
    let width, height, selected;
    const xPixel = x => left + (x - options.xMin) / (options.xMax - options.xMin) * (width - left - right);
    const yPixel = y => height - bottom - (y - options.yMin) / (options.yMax - options.yMin) * (height - top - bottom);
    function points(rows, index) {
      return rows.map(row => [xPixel(row[0]), yPixel(row[index])].join(",")).join(" ");
    }
    function highlight(x) {
      selected = x;
      if (!width) return;
      const px = xPixel(x);
      cursor.replaceChildren(svgElement("line", {x1: px, x2: px, y1: top, y2: height - bottom, class: "plot-guide"}));
      for (const {rows, color} of series) {
        const row = rows.find(row => row[0] === x);
        if (row) cursor.append(svgElement("circle", {cx: px, cy: yPixel(row[1]), r: 4, fill: color, stroke: "white", "stroke-width": 1.4}));
      }
    }
    function draw() {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(100, Math.round(bounds.height));
      svg.setAttribute("viewBox", [0, 0, width, height].join(" "));
      grid.replaceChildren();
      data.replaceChildren();
      for (const y of options.yTicks) {
        const py = yPixel(y);
        grid.append(svgElement("line", {x1: left, x2: width - right, y1: py, y2: py, class: "plot-grid"}));
        grid.append(svgElement("text", {x: left - 7, y: py + 4, "text-anchor": "end"}, options.formatTick(y)));
      }
      for (const x of options.xTicks) {
        grid.append(svgElement("text", {x: xPixel(x), y: height - bottom + 17, "text-anchor": "middle"}, x));
      }
      grid.append(svgElement("text", {
        transform: `translate(12,${(top + height - bottom) / 2}) rotate(-90)`,
        "text-anchor": "middle", class: "plot-unit",
      }, options.unit));
      if (options.xLabel) {
        grid.append(svgElement("text", {x: (left + width - right) / 2, y: height - 3, "text-anchor": "middle"}, options.xLabel));
      }
      for (const {rows, color} of series) {
        if (rows[0].length === 4) {
          data.append(svgElement("polygon", {points: points(rows, 2) + " " + points([...rows].reverse(), 3), fill: color, opacity: 0.11}));
        }
      }
      for (const {rows, color} of series) {
        data.append(svgElement("polyline", {points: points(rows, 1), fill: "none", stroke: color, "stroke-width": 2.4, "stroke-linejoin": "round", "stroke-linecap": "round"}));
      }
      if (selected !== undefined) highlight(selected);
    }
    function inspect(event) {
      if (event.type === "pointermove" && event.pointerType === "touch") return;
      const relative = (event.clientX - svg.getBoundingClientRect().left - left) / (width - left - right);
      selectX(options.xMin + Math.min(1, Math.max(0, relative)) * (options.xMax - options.xMin));
    }
    svg.addEventListener("pointermove", inspect);
    svg.addEventListener("pointerdown", inspect);
    draw();
    new ResizeObserver(draw).observe(host);
    return highlight;
  }

  function memoryExplorer() {
    const profiles = snapRecallMeasurements.memory;
    const rows = models.map(([id, name, color]) => ({name, color, rows: profiles[id]}));
    const times = [0, ...new Set(rows.flatMap(s => s.rows.map(p => p[0])))].sort((a,b) => a-b);
    const slider = byId("duration-step");
    slider.max = times.length - 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let timer;
    let index = 0;
    const values = rows.map(({name, color}) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      const value = document.createElement("dd");
      term.append(seriesLabel(name, color));
      group.append(term, value);
      byId("memory-values").append(group);
      return value;
    });
    byId("memory-explorer").hidden = false;
    const highlight = lineChart(byId("memory-chart"), rows, {
      label: "Peak GPU allocation by observed video duration", unit: "GiB",
      xMin: 0, xMax: 3600, yMin: 0, yMax: 45, xTicks: [0, 900, 1800, 2700, 3600], yTicks: [0, 10, 20, 30, 40], formatTick: String,
    }, x => {
      const i = times.reduce((best,t,i) => Math.abs(t-x) < Math.abs(times[best]-x) ? i : best, 0);
      update(i);
      syncPlayback(1800);
    });
    function update(i) {
      index = i;
      slider.value = i;
      const t = times[i], label = Math.round(t).toLocaleString("en-US") + " s";
      byId("duration-value").textContent = label;
      slider.setAttribute("aria-valuetext", label);
      highlight(t);
      rows.forEach(({rows}, j) => {
        const point = rows.find(p => p[0] === t);
        values[j].textContent = point ? point[1].toFixed(1) + " GiB" : "--";
      });
    }
    function syncPlayback(delay) {
      window.clearTimeout(timer);
      if (!reducedMotion.matches && visible && !document.hidden) {
        const atEnd = index === times.length - 1;
        timer = window.setTimeout(() => {
          update(atEnd ? 0 : index + 1);
          syncPlayback();
        }, delay ?? (atEnd ? 1200 : 220));
      }
    }
    slider.addEventListener("input", () => {
      update(Number(slider.value));
      syncPlayback(1800);
    });
    reducedMotion.addEventListener("change", () => syncPlayback());
    document.addEventListener("visibilitychange", () => syncPlayback());
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }).observe(byId("memory-chart"));
    update(0);
    syncPlayback();
    byId("memory-fallback").hidden = true;
  }

  memoryExplorer();
})();

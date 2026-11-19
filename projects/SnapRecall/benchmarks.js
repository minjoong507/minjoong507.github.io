(() => {
  const benchmarks = {
    "ovo-bench": {
      defaultColumn: 6,
      unit: "Accuracy",
      labels: {6: "Real-time perception average", 10: "Backward tracing average", 14: "Forward active responding average"},
    },
    streamingbench: {defaultColumn: 10, unit: "Accuracy", labels: {10: "Overall average"}},
    "proactive-video-qa": {defaultColumn: 0, unit: "PAUC (ω = 0.5)", labels: {}},
    "spot-bench": {defaultColumn: 6, unit: "Timeliness-Score", alternateUnit: "Timeliness-F1@5", labels: {6: "Overall average"}},
  };

  for (const [id, config] of Object.entries(benchmarks)) {
    const section = document.getElementById(id).closest(".benchmark");
    const details = section.querySelector(".benchmark-table");
    const table = details.querySelector("table");
    const columns = [...table.tHead.querySelectorAll('th[scope="col"]')].slice(3);
    const rows = [...table.tBodies].flatMap(body => {
      const group = body.querySelector('[scope="rowgroup"]');
      if (id !== "spot-bench" && !group?.textContent.trim().startsWith("Streaming VLMs")) return [];
      return [...body.rows].filter(row => row.querySelector('[scope="row"]')).map(row => {
        const [name, input, size, ...values] = [...row.cells].map(cell => cell.textContent.trim());
        return {name, input, size, values, snapRecall: row.classList.contains("highlight")};
      });
    });

    const chart = document.createElement("div");
    chart.className = "figure benchmark-chart";
    const controls = document.createElement("div");
    controls.className = "benchmark-controls";
    const metricLabel = document.createElement("label");
    metricLabel.textContent = id === "proactive-video-qa" ? "Domain" : "Result";
    const metric = document.createElement("select");
    for (const [part, unit] of [config.unit, config.alternateUnit].entries()) {
      if (!unit) continue;
      columns.forEach((header, index) => {
        const label = config.labels[index] ?? header.textContent.trim();
        metric.add(new Option(config.alternateUnit ? `${unit} · ${label}` : label, `${index}:${part}`));
      });
    }
    metric.value = `${config.defaultColumn}:0`;
    metricLabel.append(metric);
    const allLabel = document.createElement("label");
    const all = document.createElement("input");
    all.type = "checkbox";
    allLabel.append(all, " Show all streaming competitors");
    controls.append(metricLabel, allLabel);

    const result = document.createElement("p");
    result.className = "benchmark-chart-label";
    result.setAttribute("role", "status");
    const bars = document.createElement("ol");
    bars.className = "benchmark-bars";
    const plot = document.createElement("div");
    plot.className = "benchmark-plot";
    bars.tabIndex = 0;
    plot.setAttribute("role", "region");
    plot.setAttribute("aria-label", `${document.getElementById(id).textContent} score chart`);
    const axis = document.createElement("div");
    axis.className = "benchmark-axis";
    plot.append(axis, bars);
    chart.append(controls, result, plot);
    details.before(chart);

    function render() {
      const [column, part] = metric.value.split(":").map(Number);
      const scored = rows.flatMap(row => {
        const score = Number.parseFloat(row.values[column].split("/")[part]);
        return Number.isFinite(score) ? [{...row, score}] : [];
      });
      const competitors = scored.filter(row => !row.snapRecall).sort((a, b) => b.score - a.score);
      const canExpand = competitors.length > 5;
      allLabel.hidden = !canExpand;
      const showAll = !canExpand || all.checked;
      const selected = [
        ...(showAll ? competitors : competitors.slice(0, 5)),
        ...scored.filter(row => row.snapRecall),
      ];
      const unit = part === 1 ? config.alternateUnit : config.unit;
      const coverage = showAll ? `${competitors.length} streaming competitors` : `top 5 of ${competitors.length} streaming competitors`;
      result.textContent = `${unit} (%) · SnapRecall and ${coverage} with reported scores`;
      const scores = selected.map(row => row.score);
      const low = Math.min(...scores);
      const high = Math.max(...scores);
      const step = [1, 2, 5, 10, 20, 25].find(increment => (high - low) / increment <= 4) ?? 25;
      const min = Math.max(0, Math.floor((low - step / 2) / step) * step);
      const max = Math.min(100, Math.ceil((high + step / 2) / step) * step);
      const ticks = [];
      for (let tick = min; tick <= max; tick += step) {
        const label = document.createElement("span");
        label.textContent = tick + "%";
        label.style.bottom = (tick - min) / (max - min) * 100 + "%";
        ticks.push(label);
      }
      axis.setAttribute("aria-label", `Y-axis from ${min}% to ${max}%`);
      axis.replaceChildren(...ticks);
      const tickSpacing = step / (max - min) * 100;
      bars.style.setProperty("--benchmark-tick-spacing", tickSpacing + "%");
      bars.replaceChildren(...selected.map(row => {
        const item = document.createElement("li");
        if (row.snapRecall) item.classList.add("benchmark-snaprecall");
        const name = document.createElement("span");
        if (row.snapRecall) {
          const variant = row.name.match(/\(([^)]+)\)$/)[1];
          name.textContent = `SnapRecall-${variant}-${row.size}`;
        } else {
          name.textContent = row.size === "–" ? row.name : `${row.name}-${row.size}`;
        }
        if (row.input !== "–") {
          const input = document.createElement("small");
          input.className = "benchmark-input";
          const [sampling, budget] = row.input.split(" / ");
          const samplingLabel = /^\d+$/.test(sampling) ? `${sampling} frames` : sampling;
          input.textContent = budget ? `${samplingLabel} · ${budget} tokens` : samplingLabel;
          name.append(input);
        }
        const track = document.createElement("span");
        track.className = "benchmark-track";
        track.setAttribute("aria-hidden", "true");
        const fill = document.createElement("span");
        fill.style.height = (row.score - min) / (max - min) * 100 + "%";
        track.append(fill);
        const value = document.createElement("span");
        value.textContent = row.score.toFixed(1) + "%";
        item.append(name, track, value);
        return item;
      }));
    }
    metric.addEventListener("change", render);
    all.addEventListener("change", render);
    render();
  }
})();

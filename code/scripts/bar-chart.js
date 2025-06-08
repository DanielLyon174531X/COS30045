// scripts/bar-chart.js
// Author: Daniel Lyon - 174531x
// COS30045 Assignment 3

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    renderCharts();
    setupSlider();
    setupPlayback();
    setupSliderTooltip();
    window.addEventListener("resize", () => {
      updateCharts(); // just update layout/scales
    });
  });

  const margin = { top: 20, right: 60, bottom: 100, left: 100 };
  const height = 500;
  const barWidth = 30;
  const barSpacing = 10;
  const ColourA = "#377eb8";
  const ColourB = "#e41a1c";

  let currentYear = 2016;
  let playInterval = null;

  function renderCharts() {
    document.querySelectorAll(".chart[data-year]").forEach((container) => {
      const year = container.getAttribute("data-year");
      const elementId = container.getAttribute("id");
      loadDataAndDraw(year, elementId);
    });
  }

  function setupSlider() {
    const slider = document.getElementById("yearRange");
    slider.addEventListener("input", () => {
      currentYear = +slider.value;
      updateCharts();
      updateLabels(currentYear);
      stopPlayback();
    });
  }

  function setupPlayback() {
    const slider = document.getElementById("yearRange");
    const playButton = document.getElementById("playButton");
    playButton.addEventListener("click", () => {
      if (playInterval) {
        stopPlayback();
      } else {
        slider.value = 2016;
        currentYear = 2016;
        updateCharts();
        updateLabels(currentYear);
        startPlayback();
      }
    });
  }

  function startPlayback() {
    const slider = document.getElementById("yearRange");
    const playButton = document.getElementById("playButton");
    playButton.textContent = "⏸ Pause";

    playInterval = setInterval(() => {
      let next = parseInt(slider.value) + 1;
      if (next > 2022) next = 2016;
      slider.value = next;
      currentYear = next;
      updateCharts();
      updateLabels(currentYear);
    }, 1200);
  }

  function stopPlayback() {
    clearInterval(playInterval);
    playInterval = null;
    document.getElementById("playButton").textContent = "▶ Play";
  }

  function setupSliderTooltip() {
    const slider = document.getElementById("yearRange");
    const tooltip = document.getElementById("sliderTooltip");

    slider.addEventListener("mousemove", (e) => {
      const rect = slider.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const year = 2016 + Math.round(percent * 6);
      tooltip.textContent = year;
      tooltip.style.left = `${e.clientX}px`;
      tooltip.style.top = `${rect.top - 30}px`;
      tooltip.style.opacity = 1;
    });

    slider.addEventListener("mouseleave", () => {
      tooltip.style.opacity = 0;
    });
  }

  function updateCharts() {
    document.querySelectorAll(".chart[data-year]").forEach((container) => {
      const elementId = container.getAttribute("id");
      loadDataAndUpdate(currentYear, elementId);
    });
  }

  function updateLabels(year) {
    const chartHeading = document.querySelector("#bar h2");
    if (chartHeading)
      chartHeading.textContent = `Hospital Expenditure (% GDP) by Country - ${year}`;

    const caption = document.querySelector("#bar .figure-caption");
    if (caption)
      caption.innerHTML = `<strong>Figure 1.</strong> Hospital expenditure (% of GDP) by country, ${year}`;
  }

  function cleanData(data) {
    const seen = new Set();
    return data.filter((d) => {
      if (!d.Country || typeof d.Value !== "number") return false;
      if (seen.has(d.Country)) return false;
      seen.add(d.Country);
      return true;
    });
  }

  function calculateChartWidth(numBars) {
    return Math.max(
      window.innerWidth * 0.9,
      (numBars + 1) * (barWidth + barSpacing)
    );
  }

  function createScales(data) {
    const width = calculateChartWidth(data.length);
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.Country))
      .range([0, width])
      .padding(0.1);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.Value)])
      .nice()
      .range([height, 0]);
    return { x, y, width };
  }

  function loadDataAndDraw(year, id) {
    d3.json(`../data/clean/hospital-expenditure-${year}.json`).then((raw) => {
      const data = cleanData(raw);
      const { x, y, width } = createScales(data);
      const fullWidth = width + margin.left + margin.right;
      const fullHeight = height + margin.top + margin.bottom;

      const svg = d3
        .select(`#${id}`)
        .append("svg")
        .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto");

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickFormat((d) => d + "%"));

      g.selectAll("rect.bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.Country))
        .attr("width", x.bandwidth())
        .attr("y", (d) => y(d.Value))
        .attr("height", (d) => height - y(d.Value))
        .attr("fill", (d, i) => (i % 2 === 0 ? ColourA : ColourB));
    });
  }

  function loadDataAndUpdate(year, id) {
    d3.json(`../data/clean/hospital-expenditure-${year}.json`).then((raw) => {
      const data = cleanData(raw);
      const { x, y, width } = createScales(data);
      const svg = d3.select(`#${id} svg`);
      const g = svg.select("g");

      svg.attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      );

      g.select(".x-axis")
        .transition()
        .duration(500)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      g.select(".y-axis")
        .transition()
        .duration(500)
        .call(d3.axisLeft(y).tickFormat((d) => d + "%"));

      const bars = g.selectAll("rect.bar").data(data, (d) => d.Country);

      bars.join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d) => x(d.Country))
            .attr("width", x.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .attr("fill", (d, i) => (i % 2 === 0 ? ColourA : ColourB))
            .call((enter) =>
              enter
                .transition()
                .duration(800)
                .attr("y", (d) => y(d.Value))
                .attr("height", (d) => height - y(d.Value))
            ),
        (update) =>
          update
            .transition()
            .duration(800)
            .attr("x", (d) => x(d.Country))
            .attr("width", x.bandwidth())
            .attr("y", (d) => y(d.Value))
            .attr("height", (d) => height - y(d.Value)),
        (exit) =>
          exit
            .transition()
            .duration(500)
            .attr("y", height)
            .attr("height", 0)
            .remove()
      );
    });
  }
})();

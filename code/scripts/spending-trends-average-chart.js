// ========== Entry Point ==========
document.addEventListener("DOMContentLoaded", () => {
  fetchDataAndRenderAverageChart("../../data/clean/hospital-expenditure.json");
});

// ========== Load & Parse ==========
function fetchDataAndRenderAverageChart(url) {
  d3.json(url)
    .then((rawData) => {
      const yearlyAverages = calculateYearlyAverages(rawData);
      renderAverageTrendChart(yearlyAverages);
    })
    .catch((error) => console.error("Failed to load data:", error));
}

// ========== Compute Averages ==========
function calculateYearlyAverages(data) {
  const grouped = d3.group(data, (d) => d.Year);

  return Array.from(grouped, ([year, records]) => {
    const validValues = records.map((d) => +d.Value).filter(isFinite);
    const avg = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
    return { year: +year, average: +avg.toFixed(3) };
  }).sort((a, b) => d3.ascending(a.year, b.year));
}

// ========== Render Line Chart ==========
function renderAverageTrendChart(data) {
  const width = 900;
  const height = 500;
  const margin = { top: 40, right: 40, bottom: 50, left: 60 };

  const svg = d3
    .select("#spending-trends-average-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.average)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.average));

  // Axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Line
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#0084c4")
    .attr("stroke-width", 3)
    .attr("d", line);

  // Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 15)
    .attr("text-anchor", "middle")
    .attr("class", "chart-title")
    .text("Average Hospital Expenditure (% of GDP) Across Countries");

  // Labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Year");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", margin.left - 45)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Average % of GDP");
}

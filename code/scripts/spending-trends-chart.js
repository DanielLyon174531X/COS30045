// spending-trends-chart.js
// Author: Daniel Lyon - 174531X

// ========== Entry Point ==========
document.addEventListener("DOMContentLoaded", () => {
  fetchDataAndInitDropdown("../../data/clean/hospital-expenditure.json");
});

// ========== Load & Prepare ==========
function fetchDataAndInitDropdown(url) {
  d3.json(url)
    .then((rawData) => {
      const parsedData = structureDataByCountry(rawData);
      populateDropdown(parsedData);
      renderSingleCountryChart(parsedData, parsedData[0].country); // Initial draw
    })
    .catch((error) => console.error("Failed to load data:", error));
}

// ========== Structure Data ==========
function structureDataByCountry(data) {
  const grouped = d3.group(data, (d) => d.Country);
  return Array.from(grouped, ([country, records]) => ({
    country,
    values: records
      .filter((d) => isFinite(+d.Value) && !isNaN(+d.Year)) // ensure numeric
      .sort((a, b) => d3.ascending(+a.Year, +b.Year))
      .map((d) => ({
        year: +d.Year,
        value: +d.Value,
      })),
  }));
}

// ========== Dropdown Handling ==========
function populateDropdown(dataset) {
  const select = d3.select("#country-select");

  select
    .selectAll("option")
    .data(dataset)
    .enter()
    .append("option")
    .attr("value", (d) => d.country)
    .text((d) => d.country);

  select.on("change", function () {
    const selectedCountry = this.value;
    d3.select("#spending-trends-chart").select("svg").remove(); // Clear chart
    renderSingleCountryChart(dataset, selectedCountry);
  });
}

// ========== Render Single Country Chart ==========
function renderSingleCountryChart(dataset, countryName) {
  const countryData = dataset.find((d) => d.country === countryName);

  const width = 900;
  const height = 500;
  const margin = { top: 40, right: 50, bottom: 50, left: 60 };

  const svg = d3
    .select("#spending-trends-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(countryData.values, (d) => d.year)) // ← must be numeric
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(countryData.values, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Axes Labels
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
    .text("% of GDP");

  // Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 15)
    .attr("text-anchor", "middle")
    .attr("class", "chart-title")
    .text(`Hospital Expenditure (% GDP) – ${countryName}`);

  // Line
  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.value));

  svg
    .append("path")
    .datum(countryData.values)
    .attr("fill", "none")
    .attr("stroke", "#007ACC")
    .attr("stroke-width", 2)
    .attr("d", line);
}

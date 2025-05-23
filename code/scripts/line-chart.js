// scripts/line-chart.js
// Author: Daniel Lyon 174531x

(function () {
  // === Constants for Chart Dimensions ===
  const margin = { top: 20, right: 60, bottom: 20, left: 60 };
  const width = 900 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // === SVG Container ===
  function createSVGContainer() {
    return d3
      .select("#line-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  }

  // === Tooltip Configuration ===
  function createTooltipElement() {
    return d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px 12px")
      .style("background", "#333")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  // === Populate Country Dropdown ===
  function populateCountryDropdown(data, onChange) {
    const countries = [...new Set(data.map((d) => d.Country))].sort();
    const select = d3.select("#country-select").on("change", function () {
      onChange(this.value);
    });

    select
      .selectAll("option")
      .data(countries)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);
  }

  // === Draw Line Paths and Data Points ===
  function drawCountryLines(svg, data, country, xScale, yScale, tooltip) {
    const countryData = data.filter((d) => d.Country === country);
    const groupedLines = d3.groups(countryData, (d) => d.IncomeQuintile);

    const color = d3
      .scaleOrdinal()
      .domain(["Q1", "Q5"])
      .range(["#1f77b4", "#ff7f0e"]);

    svg.selectAll(".line-path").remove();
    svg.selectAll(".dot").remove();

    groupedLines.forEach(([quintile, values]) => {
      values.sort((a, b) => a.Year - b.Year);

      // Draw Line
      svg
        .append("path")
        .datum(values)
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke", color(quintile))
        .attr("stroke-width", 2)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.Year))
            .y((d) => yScale(d.Value))
        );

      // Draw Data Points
      svg
        .selectAll(`.dot-${quintile}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.Year))
        .attr("cy", (d) => yScale(d.Value))
        .attr("r", 4)
        .attr("fill", color(quintile))
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip
            .html(
              `${d.Country}<br>${d.IncomeQuintile}<br>${
                d.Year
              }: ${d.Value.toFixed(1)}%`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(200).style("opacity", 0);
        });
    });
  }

  // === Axis Render Functions ===
  function renderXAxis(svg, xScale) {
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis);
  }

  function renderYAxis(svg, yScale) {
    const yAxis = d3.axisLeft(yScale);
    svg.append("g").call(yAxis);
  }

  function labelXAxis(svg) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 40) // corrected to show inside bottom margin
      .attr("text-anchor", "middle")
      .text("Year");
  }

  function labelYAxis(svg) {
    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("% Reporting Good/Very Good Health");
  }

  function renderChartAxes(svg, xScale, yScale) {
    renderXAxis(svg, xScale);
    renderYAxis(svg, yScale);
    labelXAxis(svg);
    labelYAxis(svg);
  }

  // === Load JSON Data and Build Chart ===
  function loadChartDataAndRender() {
    const svg = createSVGContainer();
    const tooltip = createTooltipElement();

    d3.json("../data/clean/perceived-health-status-by-country.json").then(
      (data) => {
        data.forEach((d) => {
          d.Year = +d.Year;
          d.Value = +d.Value;
        });

        const xScale = d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d.Year))
          .range([0, width]);

        const yScale = d3
          .scaleLinear()
          .domain([0, 100]) // fixed maximum to 100 for visibility
          .nice()
          .range([height, 0]);

        renderChartAxes(svg, xScale, yScale);
        populateCountryDropdown(data, (selectedCountry) => {
          drawCountryLines(svg, data, selectedCountry, xScale, yScale, tooltip);
        });

        const defaultCountry = [...new Set(data.map((d) => d.Country))][0];
        drawCountryLines(svg, data, defaultCountry, xScale, yScale, tooltip);
      }
    );
  }

  // === Initialize Chart After DOM Ready ===
  document.addEventListener("DOMContentLoaded", loadChartDataAndRender);
})();

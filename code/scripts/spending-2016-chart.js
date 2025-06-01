// scripts/bar-chart.js
// Author: Daniel Lyon 174531X
//Wrap entire script in a function to make all const/lets scope local
(function () {
  // Define chart dimensions and margins
  const margin = { top: 20, right: 60, bottom: 20, left: 60 };
  const width = 900;
  const height = 500 - margin.top - margin.bottom;

  // Create and configure the main SVG container
  function createSVGContainer() {
    let yPadding = 50;
    return d3
      .select("#bar-chart-2016")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + yPadding)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  }

  // Create and style the tooltip for mouseover labels
  function createTooltip() {
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

  // Create the X axis with rotated labels for readability
  function createXAxis(svg, xScale) {
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .remove();
    //  .attr("transform", "rotate(-45)")
    //  .style("text-anchor", "end");
  }

  // Add a label below the X axis
  function labelXAxis(svg) {
    svg
      .append("text")
      .attr("class", "x axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 20)
      .text("Country");
  }

  // Create the Y axis with formatted percentage ticks
  function createYAxis(svg, yScale) {
    svg.append("g").call(
      d3
        .axisLeft(yScale)
        .ticks(10)
        .tickFormat((d) => d + "%")
    );
  }

  // Add a label to the left of the Y axis
  function labelYAxis(svg) {
    svg
      .append("text")
      .attr("class", "y axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .text("Hospital Expenditure (% of GDP)");
  }

  // Render the bar chart with animated transitions
  function renderBars(svg, data, xScale, yScale, tooltip) {
    svg
      .selectAll("rect.bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.Country))
      .attr("width", xScale.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`${d.Country}<br>${d.Value.toFixed(2)}% GDP`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(1000)
      .attr("y", (d) => {
        const y = yScale(d.Value);
        return isFinite(y) ? y : height;
      })
      .attr("height", (d) => {
        const h = height - yScale(d.Value);
        return h < 1 ? 1 : h; // min height of 1px
      });

    // Optional: Transparent overlay for better hover experience
    svg
      .selectAll("rect.overlay")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "overlay")
      .attr("x", (d) => xScale(d.Country))
      .attr("width", xScale.bandwidth())
      .attr("y", 0)
      .attr("height", height)
      .style("fill", "transparent")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`${d.Country}<br>${d.Value.toFixed(2)}% GDP`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      });
  }

  function debugEdge(svg) {
    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height + 100)
      .attr("fill", "none")
      .attr("stroke", "red");
  }

  // Load data and build the chart
  function loadAndRenderChart() {
    const svg = createSVGContainer();
    const tooltip = createTooltip();

    d3.json("../data/clean/hospital-expenditure-2016.json").then((rawData) => {
      // Filter: remove entries with missing or empty Country or Value
      const data = rawData.filter(
        (d) => d.Country && typeof d.Value === "number" && !isNaN(d.Value)
      );

      // Remove duplicates (keep first occurrence)
      const uniqueCountries = new Set();
      const filteredData = data.filter((d) => {
        if (uniqueCountries.has(d.Country)) return false;
        uniqueCountries.add(d.Country);
        return true;
      });

      const xScale = d3
        .scaleBand()
        .domain(filteredData.map((d) => d.Country))
        .range([0, width])
        .padding(0.1);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => d.Value)])
        .nice()
        .range([height, 0]);

      createXAxis(svg, xScale);
      createYAxis(svg, yScale);
      labelXAxis(svg);
      labelYAxis(svg);
      //  debugEdge(svg);
      renderBars(svg, filteredData, xScale, yScale, tooltip);
    });
  }

  // Run the chart rendering process once DOM is ready
  document.addEventListener("DOMContentLoaded", loadAndRenderChart);
})();

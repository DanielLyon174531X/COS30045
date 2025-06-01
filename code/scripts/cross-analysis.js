// scripts/cross-analysis.js
// Author: Daniel Lyon 174531x

(function () {
  const chartConfig = {
    margin: { top: 20, right: 60, bottom: 20, left: 70 },
    width: 900,
    height: 500,
    pointRadius: 7,
    pointColor: "#007acc",
  };

  function createSVG(selector) {
    const { width, height, margin } = chartConfig;
    return d3
      .select(selector)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  }

  function createScales(data, xKey, yKey) {
    const { width, height, margin } = chartConfig;
    return {
      x: d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[xKey]))
        .nice()
        .range([0, width - margin.left - margin.right]),
      y: d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[yKey]))
        .nice()
        .range([height - margin.top - margin.bottom, 0]),
    };
  }

  function renderAxes(svg, scales, labels) {
    const { width, height, margin } = chartConfig;
    const innerHeight = height - margin.top - margin.bottom;

    // Gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(scales.y)
          .tickSize(-width + margin.left + margin.right)
          .tickFormat("")
      );

    svg
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(scales.x));

    svg.append("g").call(d3.axisLeft(scales.y));

    svg
      .append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .text(labels.xLabel);

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text(labels.yLabel);
  }

  function createTooltip() {
    return d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "6px 12px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  function renderPoints(svg, data, scales, xKey, yKey) {
    const tooltip = createTooltip();

    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => scales.x(d[xKey]))
      .attr("cy", (d) => scales.y(d[yKey]))
      .attr("r", chartConfig.pointRadius)
      .style("fill", chartConfig.pointColor)
      .style("opacity", 0.85)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(
            `<strong>${d.Country}</strong><br>${xKey}: ${d[xKey]}<br>${yKey}: ${d[yKey]}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () =>
        tooltip.transition().duration(300).style("opacity", 0)
      );

    svg
      .selectAll("text.label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d) => scales.x(d[xKey]) + 8)
      .attr("y", (d) => scales.y(d[yKey]) + 4)
      .text((d) => d.Country)
      .style("font-size", "10px")
      .style("fill", "#333");
  }

  function addTrendline(svg, data, xKey, yKey, scales) {
    const xVals = data.map((d) => d[xKey]);
    const yVals = data.map((d) => d[yKey]);
    const { slope, intercept } = linearRegression(xVals, yVals);

    const line = d3
      .line()
      .x((d) => scales.x(d))
      .y((d) => scales.y(slope * d + intercept));

    svg
      .append("path")
      .datum(d3.extent(xVals))
      .attr("class", "trendline")
      .attr("d", line)
      .style("stroke", "red")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "4 2")
      .style("fill", "none");
  }

  function linearRegression(x, y) {
    const n = x.length;
    const sumX = d3.sum(x);
    const sumY = d3.sum(y);
    const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = d3.sum(x.map((xi) => xi * xi));
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }

  function renderScatterPlot(data, xKey, yKey, selector, xLabel, yLabel) {
    const svg = createSVG(selector);
    const scales = createScales(data, xKey, yKey);

    renderAxes(svg, scales, { xLabel, yLabel });
    renderPoints(svg, data, scales, xKey, yKey);
    addTrendline(svg, data, xKey, yKey, scales);
  }

  d3.json("../data/clean/merged_cross_analysis.json").then((data) => {
    renderScatterPlot(
      data,
      "Spending",
      "Q5",
      "#scatter-q5",
      "Spending (% GDP)",
      "Q5 Health (%)"
    );
    renderScatterPlot(
      data,
      "Spending",
      "Q1",
      "#scatter-q1",
      "Spending (% GDP)",
      "Q1 Health (%)"
    );
    renderScatterPlot(
      data,
      "Spending",
      "Gap",
      "#scatter-gap",
      "Spending (% GDP)",
      "Health Gap (Q5 - Q1)"
    );
  });
})();

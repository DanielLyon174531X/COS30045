// scripts/cross-analysis.js
// Author: Daniel Lyon 174531X
// COS30045 Assignment 3

(function () {
  const margin = { top: 20, right: 60, bottom: 40, left: 70 };
  const width = 960;
  const height = 500;
  const Colour = "#007acc";

  const plots = [
    { selector: "#scatter-q1", yKey: "Q1", yLabel: "Q1 Health (%)" },
    { selector: "#scatter-q5", yKey: "Q5", yLabel: "Q5 Health (%)" },
    { selector: "#scatter-gap", yKey: "Gap", yLabel: "Gap (Q5 - Q1)" },
  ];

  function createSVGContainer(selector) {
    return d3
      .select(selector)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr(
        "aria-label",
        "Scatterplot comparing health metrics to GDP spending"
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  }

  function createTooltip() {
    return d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "6px 12px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);
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

  function renderPlot(data, selector, yKey, yLabel) {
    const svg = createSVGContainer(selector);
    const tooltip = createTooltip();

    const x = d3
      .scaleLinear()
      .domain([1, 5])
      .range([0, width - margin.left - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[yKey]) + 10])
      .range([height - margin.top - margin.bottom, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0, ${y.range()[0]})`)
      .call(d3.axisBottom(x));

    svg.append("g").call(d3.axisLeft(y));

    svg
      .append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", height - margin.top - 5)
      .attr("text-anchor", "middle")
      .text("Spending (% GDP)");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -((height - margin.top - margin.bottom) / 2))
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text(yLabel);

    const points = svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.Spending))
      .attr("cy", (d) => y(d[yKey]))
      .attr("r", 0)
      .style("fill", Colour)
      .style("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltip
          .html(
            `<strong>${d.Country}</strong><br>Spending: ${d.Spending}<br>${yKey}: ${d[yKey]}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", () =>
        tooltip.transition().duration(300).style("opacity", 0)
      );

    points
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr("r", 7);

    svg
      .selectAll("text.country-label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.Spending) + 9)
      .attr("y", (d) => y(d[yKey]) + 3)
      .text((d) => d.Country)
      .style("font-size", "10px")
      .style("fill", "#333");

    const xVals = data.map((d) => d.Spending);
    const yVals = data.map((d) => d[yKey]);
    const { slope, intercept } = linearRegression(xVals, yVals);

    svg
      .append("path")
      .datum(d3.extent(xVals))
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-dasharray", "4 2")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d))
          .y((d) => y(slope * d + intercept))
      );
  }

  d3.json("../data/clean/merged_cross_analysis.json").then((data) => {
    plots.forEach(({ selector, yKey, yLabel }) =>
      renderPlot(data, selector, yKey, yLabel)
    );
  });
})();

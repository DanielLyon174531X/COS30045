// scripts/spending-trends-average-chart.js
// Author: Daniel Lyon - 174531x
// COS30045 Assignment 3

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    fetchDataAndRenderAverageChart("../data/clean/hospital-expenditure.json");
  });

  const margin = { top: 40, right: 100, bottom: 60, left: 100 };
  const height = 400;
  const ColourA = "#377eb8";
  const ColourB = "#e41a1c";

  function fetchDataAndRenderAverageChart(url) {
    d3.json(url)
      .then((rawData) => {
        const data = calculateYearlyAverages(rawData);
        renderAverageTrendChart(data);
      })
      .catch((error) => console.error("Failed to load data:", error));
  }

  function calculateYearlyAverages(data) {
    const grouped = d3.group(data, (d) => d.Year);
    return Array.from(grouped, ([year, records]) => {
      const values = records.map((d) => +d.Value).filter(isFinite);
      const avg = d3.mean(values);
      return { year: +year, value: +avg.toFixed(3) };
    }).sort((a, b) => d3.ascending(a.year, b.year));
  }

  function renderAverageTrendChart(data) {
    const containerId = "spending-trends-average-chart";
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const tooltip = createTooltip();
    const fullWidth = Math.max(window.innerWidth * 0.8, 800);
    const innerWidth = fullWidth - margin.left - margin.right;
    const fullHeight = height + margin.top + margin.bottom;

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height, 0]);

    const svg = d3
      .select(`#${containerId}`)
      .append("svg")
      .attr("role", "img")
      .attr(
        "aria-label",
        "Line chart showing average hospital expenditure as percentage of GDP from 2016 to 2022"
      )
      .attr(
        "viewBox",
        `${-margin.left} ${-margin.top} ${fullWidth} ${fullHeight}`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto");

    const g = svg.append("g");

    // Highlight COVID years (2020–2021)
    g.append("rect")
      .attr("x", x(2019))
      .attr("y", 0)
      .attr("width", x(2021) - x(2019))
      .attr("height", height)
      .attr("fill", "#f0f0f0")
      .attr("opacity", 0.6)
      .lower(); // Send behind other elements

    // Label for COVID-19 period
    g.append("text")
      .attr("x", x(2019) + (x(2021) - x(2019)) / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#555")
      .attr("font-size", "0.8rem")
      .attr("font-style", "italic")
      .text("COVID-19 period");

    // Gridlines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(6).tickSize(-innerWidth).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#ddd");

    // Axes
    const xAxis = d3
      .axisBottom(x)
      .ticks(data.length)
      .tickFormat(d3.format("d"));
    const yAxis = d3
      .axisLeft(y)
      .ticks(6)
      .tickFormat((d) => `${d}%`);

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    g.append("g").attr("class", "y-axis").call(yAxis);

    // Axis labels
    g.append("text")
      .attr("class", "axis-label")
      .attr("x", innerWidth / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Year");

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Average % of GDP");

    // Line path
    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.value));

    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", ColourA)
      .attr("stroke-width", 2)
      .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeCubic)
      .attr("stroke-dashoffset", 0);

    // Dots
    g.selectAll("circle.dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 4)
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.value))
      .attr("fill", ColourB)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#000");
        tooltip
          .style("opacity", 1)
          .html(`Year: ${d.year}<br>${d.value.toFixed(2)}% GDP`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", ColourB);
        tooltip.style("opacity", 0);
      });
  }

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
})();

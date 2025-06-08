// scripts/line-chart.js
// Author: Daniel Lyon - 174531x
// COS30045 Assignment 3

(function () {
  const margin = { top: 100, right: 100, bottom: 60, left: 100 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  const ColourA = "#377eb8"; // Q1
  const ColourB = "#e41a1c"; // Q5

  function createSVGContainer() {
    return d3
      .select("#line-chart")
      .append("svg")
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .attr("role", "img")
      .attr(
        "aria-label",
        "Line chart showing percentage of people reporting good or very good health, by income group and country"
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  }

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

  function populateCountryDropdown(data, onSelect, defaultCountry) {
    const countryList = [...new Set(data.map((d) => d.Country))];
    const select = d3.select("#country-select");

    select
      .selectAll("option")
      .data(countryList)
      .enter()
      .append("option")
      .text((d) => d)
      .attr("value", (d) => d)
      .property("selected", (d) => d === defaultCountry);

    select.on("change", function () {
      const selected = this.value;
      onSelect(selected);
    });
  }

  function renderAxes(svg, xScale, yScale) {
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8);
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale);
    svg.append("g").attr("class", "y-axis").call(yAxis);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Year");

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("% Reporting Good/Very Good Health");
  }

  function drawLegend(svg) {
    const legendData = [
      { label: "Lowest Income Quintile (Q1)", color: ColourA },
      { label: "Highest Income Quintile (Q5)", color: ColourB },
    ];

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 250}, -40)`);

    legendData.forEach((d, i) => {
      const group = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);
      group
        .append("rect")
        .attr("x", 0)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d.color);

      group
        .append("text")
        .attr("x", 20)
        .attr("y", 0)
        .text(d.label)
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  }

  function drawCountryLines(svg, data, country, xScale, yScale, tooltip) {
    const countryData = data.filter((d) => d.Country === country);
    const grouped = d3.groups(countryData, (d) => d.IncomeQuintile);
    const color = d3
      .scaleOrdinal()
      .domain(["Q1", "Q5"])
      .range([ColourA, ColourB]);

    svg.selectAll(".line-path").remove();
    svg.selectAll(".dot").remove();
    svg.selectAll(".legend").remove();
    drawLegend(svg);

    grouped.forEach(([quintile, values]) => {
      values.sort((a, b) => a.Year - b.Year);

      const line = svg
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

      const totalLength = line.node().getTotalLength();

      line
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

      // Animated dots
      svg
        .selectAll(null)
        .data(values)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.Year))
        .attr("cy", (d) => yScale(d.Value))
        .attr("r", 4)
        .attr("fill", color(quintile))
        .style("opacity", 0)
        .transition()
        .delay((_, i) => i * 150)
        .duration(300)
        .style("opacity", 1);

      // Tooltips (attach to new selection)
      svg
        .selectAll("circle")
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
          .domain([0, 100])
          .nice()
          .range([height, 0]);
        const defaultCountry = "Norway";

        renderAxes(svg, xScale, yScale);
        populateCountryDropdown(
          data,
          (selected) => {
            drawCountryLines(svg, data, selected, xScale, yScale, tooltip);
          },
          defaultCountry
        );
        drawCountryLines(svg, data, defaultCountry, xScale, yScale, tooltip);
      }
    );
  }

  document.addEventListener("DOMContentLoaded", loadChartDataAndRender);
})();

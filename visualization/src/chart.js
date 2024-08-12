import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const Chart = ({
  data,
  xAxis,
  yAxis,
  selectedChart,
  dimensions,
  sortOrder,
}) => {
  const svgRef = useRef();

  useEffect(() => {
    if (
      data &&
      xAxis &&
      yAxis &&
      dimensions.width > 0 &&
      dimensions.height > 0
    ) {
      createChart();
    }
  }, [data, xAxis, yAxis, selectedChart, dimensions, sortOrder]);

  const createChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 30, left: 60 };

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[xAxis]))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[yAxis])])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xAxisGenerator = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxisGenerator = d3.axisLeft(yScale);

    svg
      .attr("viewBox", [0, 0, width, height])
      .attr(
        "style",
        `max-width: ${width}px; height: auto; font: 12px sans-serif;`,
      );

    if (selectedChart === "bar") {
      const bars = svg.selectAll("rect").data(data, (d) => d[xAxis]);

      // Enter selection for new bars
      bars
        .enter()
        .append("rect")
        .attr("fill", "steelblue")
        .attr("x", (d) => xScale(d[xAxis]))
        .attr("y", yScale(0))
        .attr("height", 0)
        .attr("width", xScale.bandwidth())
        .merge(bars) // Update existing bars
        .transition()
        .duration(750)
        .attr("x", (d) => xScale(d[xAxis]))
        .attr("y", (d) => yScale(d[yAxis]))
        .attr("height", (d) => yScale(0) - yScale(d[yAxis]))
        .attr("width", xScale.bandwidth());

      // Remove bars that no longer exist
      bars
        .exit()
        .transition()
        .duration(750)
        .attr("y", yScale(0))
        .attr("height", 0)
        .remove();

      // Update the x-axis with transition
      svg.select(".x-axis").transition().duration(750).call(xAxisGenerator);

      // Update the y-axis with transition
      svg.select(".y-axis").transition().duration(750).call(yAxisGenerator);

      // Function to update the chart with a smooth transition
      const update = (order) => {
        const sortedData = data.sort((a, b) => {
          if (order === "asc") {
            return a[yAxis] - b[yAxis];
          } else {
            return b[yAxis] - a[yAxis];
          }
        });

        xScale.domain(sortedData.map((d) => d[xAxis]));

        const t = svg.transition().duration(750);

        bars
          .data(sortedData, (d) => d[xAxis])
          .order()
          .transition(t)
          .delay((d, i) => i * 20)
          .attr("x", (d) => xScale(d[xAxis]));

        svg
          .select(".x-axis")
          .transition(t)
          .call(xAxisGenerator)
          .selectAll(".tick")
          .delay((d, i) => i * 20);
      };

      // Call update if sortOrder is set
      if (sortOrder) {
        update(sortOrder);
      }
    } else if (selectedChart === "scatter") {
      const circles = svg.selectAll("circle").data(data, (d) => d[xAxis]);

      // Enter selection for new circles
      circles
        .enter()
        .append("circle")
        .attr("fill", "steelblue")
        .attr("cx", (d) => xScale(d[xAxis]) + xScale.bandwidth() / 2)
        .attr("cy", yScale(0))
        .attr("r", 0)
        .merge(circles) // Update existing circles
        .transition()
        .duration(750)
        .attr("cx", (d) => xScale(d[xAxis]) + xScale.bandwidth() / 2)
        .attr("cy", (d) => yScale(d[yAxis]))
        .attr("r", 5);

      // Remove circles that no longer exist
      circles.exit().transition().duration(750).attr("r", 0).remove();
    }

    // Update the x-axis
    if (svg.select(".x-axis").empty()) {
      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxisGenerator);
    }

    // Update the y-axis
    if (svg.select(".y-axis").empty()) {
      svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxisGenerator);
    }
  };

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      className="bg-gray-50"
    ></svg>
  );
};

export default Chart;

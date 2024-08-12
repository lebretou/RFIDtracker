import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import AnalyticsToolBar from "./AnalyticsToolBar";

const DataAnalyticsTool = () => {
  const [data, setData] = useState(null);
  const [selectedChart, setSelectedChart] = useState("bar");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [contentRating, setContentRating] = useState("PG");
  const [imdbRating, setImdbRating] = useState([1.7, 9.1]);
  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [sortOrder, setSortOrder] = useState(null);

  const svgRef = useRef();
  const containerRef = useRef(null);

  const handleFileUpload = (event) => {
    setIsLoading(true);
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split("\n");
        const headers = lines[0]
          .split(",")
          .map((header) => header.replace(/"/g, "").trim());
        const jsonData = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          if (values.length === headers.length) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
              const value = values[j].trim();
              row[headers[j]] = isNaN(value) ? value : Number(value);
            }
            jsonData.push(row);
          }
        }

        setData(jsonData);
        setIsLoading(false);

        // Set initial x and y axes
        const numericColumns = headers.filter(
          (header) => typeof jsonData[0][header] === "number",
        );
        if (numericColumns.length >= 2) {
          setXAxis(numericColumns[0]);
          setYAxis(numericColumns[1]);
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width * 0.95,
          height: height * 0.9, // 90% of the container height for the chart
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

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
  }, [data, xAxis, yAxis, selectedChart, dimensions]);

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
      //   svg
      //     .append("g")
      //     .attr("fill", "steelblue")
      //     .selectAll("circle")
      //     .data(data)
      //     .join("circle")
      //     .attr("cx", (d) => xScale(d[xAxis]) + xScale.bandwidth() / 2)
      //     .attr("cy", (d) => yScale(d[yAxis]))
      //     .attr("r", 5);
      // }

      // svg
      //   .append("g")
      //   .attr("class", "x-axis")
      //   .attr("transform", `translate(0,${height - margin.bottom})`)
      //   .call(xAxisGenerator);

      // svg
      //   .append("g")
      //   .attr("class", "y-axis")
      //   .attr("transform", `translate(${margin.left},0)`)
      //   .call(yAxisGenerator);
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

  const handleSort = (column) => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);

    const sortedData = [...data].sort((a, b) => {
      if (newSortOrder === "asc") {
        return a[column] - b[column];
      } else {
        return b[column] - a[column];
      }
    });

    setData(sortedData);
    createChart(); // This call ensures that the chart updates after sorting
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/5 p-4 bg-white shadow-md">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 text-gray-800">Data</h2>
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".csv"
            className="w-full p-2 border border-gray-300 rounded"
          />
          {isLoading && <p className="mt-2 text-gray-600">Loading...</p>}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-3 text-gray-800">Attributes</h2>
          {data && data.length > 0 && (
            <ul className="space-y-2">
              {Object.keys(data[0]).map((key) => (
                <li key={key} className="p-2 bg-gray-200 rounded">
                  {key}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="w-1/5 p-4 flex flex-col">
        <div className="mb-6 bg-white p-4 rounded shadow-md">
          <h2 className="text-xl font-bold mb-3 text-gray-800">Encoding</h2>
          <div className="flex flex-col space-y-2">
            <select
              className="p-2 border border-gray-300 rounded w-full"
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
            >
              <option value="scatter">Scatter Plot</option>
              <option value="bar">Bar Chart</option>
            </select>
            <select
              className="p-2 border border-gray-300 rounded w-full"
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
            >
              <option value="">Select X Axis</option>
              {data &&
                Object.keys(data[0]).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
            </select>
            <select
              className="p-2 border border-gray-300 rounded w-full"
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
            >
              <option value="">Select Y Axis</option>
              {data &&
                Object.keys(data[0]).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <AnalyticsToolBar
          selectedChart={selectedChart}
          onSort={handleSort}
          yAxis={yAxis}
        />
      </div>
      <div className="w-3/5 p-4 bg-white shadow-md">
        <div
          ref={containerRef}
          className="h-2/3 flex-grow bg-white p-4 rounded shadow-md"
          style={{ height: "60vh" }}
        >
          <h2 className="text-xl font-bold mb-3 text-gray-800">
            Visualization
          </h2>
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-gray-50"
          ></svg>
        </div>

        <div className="h-1/3 flex-grow bg-white p-4 rounded shadow-md">
          <h2 className="text-xl font-bold mb-3 text-gray-800">Details</h2>
          {data && (
            <table className="w-full">
              <tbody>
                {Object.entries(data[0]).map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="font-bold py-2 text-gray-700">{key}</td>
                    <td className="py-2 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataAnalyticsTool;

import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

const DataAnalyticsTool = () => {
  const [data, setData] = useState(null);
  const [selectedChart, setSelectedChart] = useState("scatter");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [contentRating, setContentRating] = useState("PG");
  const [imdbRating, setImdbRating] = useState([1.7, 9.1]);
  const [isLoading, setIsLoading] = useState(false);

  const svgRef = useRef();
  const containerRef = useRef(null);

  // Mock data for demonstration
  const mockData = [
    { id: 1, genre: "Action", budget: 100, gross: 200, rating: 7.5 },
    { id: 2, genre: "Comedy", budget: 50, gross: 150, rating: 6.8 },
    { id: 3, genre: "Drama", budget: 80, gross: 180, rating: 8.2 },
    // Add more mock data as needed
  ];

  const handleFileUpload = (event) => {
    // // Handle file upload logic here
    // console.log("File uploaded:", event.target.files[0]);
    // setData(mockData);
    setIsLoading(true);
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split("\n");
        // const headers = lines[0].split(",");
        const headers = lines[0]
          .split(",")
          .map((header) => header.replace(/"/g, ""));
        const jsonData = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          if (values.length === headers.length) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
              row[headers[j].trim()] = values[j].trim();
            }
            jsonData.push(row);
          }
        }

        setData(jsonData);
        setIsLoading(false);
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (data && xAxis && yAxis) {
      createChart();
    }
  }, [data, xAxis, yAxis, selectedChart]);

  const createChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const width = 400;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[xAxis]))
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[yAxis]))
      .range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    if (selectedChart === "scatter") {
      svg
        .append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => x(d[xAxis]))
        .attr("cy", (d) => y(d[yAxis]))
        .attr("r", 5)
        .attr("fill", "steelblue");
    } else if (selectedChart === "bar") {
      svg
        .append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d) => x(d[xAxis]))
        .attr("y", (d) => y(d[yAxis]))
        .attr("height", (d) => y(0) - y(d[yAxis]))
        .attr("width", 20)
        .attr("fill", "steelblue");
    }
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
        <div className="mb-6 bg-white p-4 rounded shadow-md">
          <h2 className="text-xl font-bold mb-3 text-gray-800">Filters</h2>
          <div className="flex mb-2">
            <select
              className="mr-2 p-2 border border-gray-300 rounded"
              value={contentRating}
              onChange={(e) => setContentRating(e.target.value)}
            >
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
            </select>
          </div>
          <div>
            <input
              type="range"
              min="1.7"
              max="9.1"
              step="0.1"
              value={imdbRating[1]}
              onChange={(e) => setImdbRating([1.7, parseFloat(e.target.value)])}
              className="w-full"
            />
            <span className="text-sm text-gray-600">
              IMDB Rating: {imdbRating[0]} - {imdbRating[1]}
            </span>
          </div>
        </div>
      </div>
      <div className="w-3/5 p-4 bg-white shadow-md">
        <div className="h-2/3 flex-grow bg-white p-4 rounded shadow-md">
          <h2 className="text-xl font-bold mb-3 text-gray-800">
            Visualization
          </h2>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
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

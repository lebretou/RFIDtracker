import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import AnalyticsToolBar from "./AnalyticsToolBar";
import Chart from "./Chart";
import StickerInput from "./StickerInput";

const DataAnalyticsTool = () => {
  const [originalData, setOriginalData] = useState(null);
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
        setOriginalData(jsonData);
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

  const handleSort = (column, order) => {
    setSortOrder(order);

    if (order === "unsorted") {
      // Reset to original order
      setData([...originalData]);
    } else {
      const sortedData = [...originalData].sort((a, b) => {
        if (order === "asc") {
          return a[column] - b[column];
        } else {
          return b[column] - a[column];
        }
      });
      setData(sortedData);
    }
  };

  const handleDragStart = (e, button) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(button));
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
        <StickerInput onDragStart={handleDragStart} />
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
          <Chart
            data={data}
            xAxis={xAxis}
            yAxis={yAxis}
            selectedChart={selectedChart}
            dimensions={dimensions}
            sortOrder={sortOrder}
          />
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

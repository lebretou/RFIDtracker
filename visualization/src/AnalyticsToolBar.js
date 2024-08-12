import React, { useState } from "react";

const ANALYTICS_TASKS = [
  { id: "sort", name: "Sort", widget: "button" },
  { id: "filter", name: "Filter", widget: "selector" },
  { id: "cluster", name: "Cluster", widget: "button" },
];

const AnalyticsToolBar = ({ selectedChart, onSort, yAxis }) => {
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [error, setError] = useState(null);

  const addTask = (task) => {
    if (!selectedTasks.find((t) => t.id === task.id)) {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const removeTask = (taskId) => {
    setSelectedTasks(selectedTasks.filter((task) => task.id !== taskId));
  };

  const handleSort = (order) => {
    if (selectedChart !== "bar") {
      setError("Current chart and interaction type not compatible");
      setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
    } else {
      onSort(yAxis, order);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h2 className="text-xl font-bold mb-3 text-gray-800">
        Analytics Tool Bar
      </h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4 flex flex-wrap gap-2">
        {ANALYTICS_TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => addTask(task)}
            className="bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
          >
            {task.name}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {selectedTasks.map((task) => (
          <div key={task.id} className="flex flex-col bg-gray-100 p-2 rounded">
            <div className="flex items-center justify-between">
              <span>{task.name}</span>
              <button
                onClick={() => removeTask(task.id)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
            {task.id === "sort" && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleSort("unsorted")}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                >
                  Unsorted
                </button>
                <button
                  onClick={() => handleSort("asc")}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                >
                  Asc
                </button>
                <button
                  onClick={() => handleSort("desc")}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  Desc
                </button>
              </div>
            )}
            {task.id === "filter" && (
              <select className="mt-2 border rounded px-2 py-1">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsToolBar;

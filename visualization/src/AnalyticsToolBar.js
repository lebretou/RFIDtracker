import React, { useState } from "react";

const ANALYTICS_TASKS = [
  { id: "sort", name: "Sort", widget: "button" },
  { id: "filter", name: "Filter", widget: "selector" },
  { id: "cluster", name: "Cluster", widget: "button" },
];

const AnalyticsToolBar = ({
  selectedChart,
  onSort,
  yAxis,
  buttonAssignments,
  onAssignment,
}) => {
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [error, setError] = useState(null);
  // const [buttonAssignments, setButtonAssignments] = useState({});

  const addTask = (task) => {
    if (!selectedTasks.find((t) => t.id === task.id)) {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const removeTask = (taskId) => {
    setSelectedTasks(selectedTasks.filter((task) => task.id !== taskId));
    // Remove any button assignments for this task
    // const newAssignments = { ...buttonAssignments };
    // delete newAssignments[taskId];
    // setButtonAssignments(newAssignments);
  };

  const handleSort = (order) => {
    if (selectedChart !== "bar") {
      setError("Current chart and interaction type not compatible");
      setTimeout(() => setError(null), 3000);
    } else {
      onSort(yAxis, order);
    }
  };

  const handleDrop = (e, taskId, buttonType) => {
    e.preventDefault();
    const buttonData = JSON.parse(e.dataTransfer.getData("text"));
    // setButtonAssignments({
    //   ...buttonAssignments,
    //   [`${taskId}-${buttonType}`]: buttonData,
    // });
    onAssignment(taskId, buttonType, buttonData);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const renderButton = (taskId, buttonType, label, className, onClick) => {
    const assignment = buttonAssignments[`${taskId}-${buttonType}`];
    const style = assignment
      ? { borderColor: assignment.color, borderWidth: 4 }
      : {};

    return (
      <button
        onClick={onClick}
        onDrop={(e) => handleDrop(e, taskId, buttonType)}
        onDragOver={handleDragOver}
        className={`${className} border-2`}
        style={style}
      >
        {label}
      </button>
    );
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
              <div className="mt-2 flex flex-wrap gap-2">
                {renderButton(
                  task.id,
                  "unsorted",
                  "Unsorted",
                  "bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 transition-colors",
                  () => handleSort(null),
                )}
                {renderButton(
                  task.id,
                  "ascending",
                  "Ascending",
                  "bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors",
                  () => handleSort("asc"),
                )}
                {renderButton(
                  task.id,
                  "descending",
                  "Descending",
                  "bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors",
                  () => handleSort("desc"),
                )}
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

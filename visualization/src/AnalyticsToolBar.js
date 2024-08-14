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
  const [longPressTimeout, setLongPressTimeout] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const addTask = (task) => {
    if (!selectedTasks.find((t) => t.id === task.id)) {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const removeTask = (taskId) => {
    setSelectedTasks(selectedTasks.filter((task) => task.id !== taskId));
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

  const handleLongPress = (order) => {
    setIsLongPressing(true);
    setLongPressTimeout(
      setTimeout(() => {
        if (selectedChart !== "bar") {
          setError("Current chart and interaction type not compatible");
          setTimeout(() => setError(null), 3000);
        } else {
          onSort(yAxis, order);
        }
      }, 300), // 500ms delay before triggering sort
    );
  };

  // const cancelLongPress = () => {
  //   clearTimeout(longPressTimeout);
  // };
  const cancelLongPress = () => {
    clearTimeout(longPressTimeout);
    if (isLongPressing) {
      // Add a small delay before resetting to the original order
      setTimeout(() => {
        onSort(yAxis, null);
        setIsLongPressing(false);
      }, 100); // 300ms delay before reverting to the original order
    } else {
      setIsLongPressing(false);
    }
  };

  const renderButton = (taskId, buttonType, label, className, order) => {
    const assignment = buttonAssignments[`${taskId}-${buttonType}`];
    const style = assignment
      ? { borderColor: assignment.color, borderWidth: 4 }
      : {};

    return (
      <button
        onMouseDown={() => handleLongPress(order)}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
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
                  "ascending",
                  "Ascending",
                  "bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors",
                  "asc",
                )}
                {renderButton(
                  task.id,
                  "descending",
                  "Descending",
                  "bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors",
                  "desc",
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsToolBar;

// const handleDrop = (e, taskId, buttonType) => {
//   e.preventDefault();
//   const buttonData = JSON.parse(e.dataTransfer.getData("text"));
//   // setButtonAssignments({
//   //   ...buttonAssignments,
//   //   [`${taskId}-${buttonType}`]: buttonData,
//   // });
//   onAssignment(taskId, buttonType, buttonData);
// };

// const handleDragOver = (e) => {
//   e.preventDefault();
// };

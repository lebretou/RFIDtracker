import React, { useEffect, useState } from "react";

const StickerInput = ({ onDragStart, onReset }) => {
  const [data, setData] = useState({});

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8765");
    ws.onopen = () => {
      console.log("Connected to server");
    };
    ws.onmessage = (event) => {
      console.log("Received message:", event.data);
      try {
        const receivedData = JSON.parse(event.data);
        setData(receivedData);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    return () => ws.close();
  }, []);

  const getButtonColor = (id) => {
    const colors = ["orange", "lightblue", "magenta", "lime", "cyan", "yellow"];
    return colors[id % colors.length];
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-3 text-gray-800">Stickers</h2>
      <div className="space-y-2">
        {Object.entries(data).map(([epc, stickerData]) => (
          <div
            key={epc}
            draggable
            onDragStart={(e) =>
              onDragStart(e, {
                id: stickerData.id,
                label: `Sticker ${stickerData.id}`,
                color: getButtonColor(stickerData.id),
              })
            }
            className={`p-2 rounded cursor-move transition-colors text-white flex justify-between items-center`}
            style={{ backgroundColor: getButtonColor(stickerData.id) }}
          >
            <span>{`Sticker ${stickerData.id}`}</span>
            <span
              className={`w-3 h-3 rounded-full ${stickerData.tag_state === "Not Covered" ? "bg-green-500" : "bg-red-500"}`}
            ></span>
          </div>
        ))}
        <button
          onClick={onReset}
          className="mt-4 bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors w-full"
        >
          Reset All Assignments
        </button>
      </div>
    </div>
  );
};

export default StickerInput;

import React from "react";
import { useEffect, useState } from "react";

const StickerInput = ({ onDragStart, onReset }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Assuming you're using WebSocket
    const ws = new WebSocket("ws://localhost:8765");

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onmessage = (event) => {
      console.log("Received message:", event.data); // Debug log
      try {
        const receivedData = JSON.parse(event.data);
        setData(receivedData);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => ws.close();
  }, []);

  const buttons = [
    { id: "button1", label: "Sticker 1", color: "orange" },
    { id: "button2", label: "Sticker 2", color: "lightblue" },
    { id: "button3", label: "Sticker 3", color: "magenta" },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-3 text-gray-800">Stickers</h2>
      <div className="space-y-2">
        {buttons.map((button) => (
          <div
            key={button.id}
            draggable
            onDragStart={(e) => onDragStart(e, button)}
            className={`p-2 rounded cursor-move transition-colors text-white`}
            style={{ backgroundColor: button.color }}
          >
            {button.label}
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

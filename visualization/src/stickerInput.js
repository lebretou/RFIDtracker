import React from "react";

const StickerInput = ({ onDragStart }) => {
  const buttons = [
    { id: "button1", label: "Button 1" },
    { id: "button2", label: "Button 2" },
    { id: "button3", label: "Button 3" },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-3 text-gray-800">Physical Buttons</h2>
      <div className="space-y-2">
        {buttons.map((button) => (
          <div
            key={button.id}
            draggable
            onDragStart={(e) => onDragStart(e, button)}
            className="bg-gray-200 p-2 rounded cursor-move hover:bg-gray-300 transition-colors"
          >
            {button.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickerInput;

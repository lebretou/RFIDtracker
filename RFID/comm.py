import asyncio
import websockets
import json
from rfid_tracker import RFIDTracker  # Assuming this is your custom module

# Initialize the RFID tracker
tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)

async def handler(websocket, path):
    """Handle incoming WebSocket connections and send RFID tag data."""
    print(f"Client connected: {path}")

    if not tracker.serial.is_open:
                tracker.serial.open()

    try:
        while True:
            # Read and update RFID tags
            tracker.read_and_update()
            tags = tracker.get_all_tags()
            print(f"Sending tags: {tags}")

            # Send the tags to the connected client
            await websocket.send(json.dumps(tags))

            await asyncio.sleep(0.1)  # Small delay to prevent overwhelming the system

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        tracker.close()

async def main():
    """Main function to run the WebSocket server."""
    server = await websockets.serve(handler, "localhost", 8765)
    print("WebSocket server started on ws://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        if 'tracker' in locals():
            tracker.close()

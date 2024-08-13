import asyncio
import websockets

# Store connected clients
connected_clients = set()

async def handler(websocket, path):
    """Handle incoming WebSocket connections."""
    connected_clients.add(websocket)
    try:
        while True:
            message = "hello world"
            print(f"Sending message: {message}")
            await websocket.send(message)
            await asyncio.sleep(1)  # Send a message every 1 second
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed: {e}")
    finally:
        connected_clients.remove(websocket)

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

import serial
import time
from typing import Dict, Optional, Tuple
from prettytable import PrettyTable
import os
import numpy as np
from scipy.stats import norm
from collections import deque
from rfid import RFIDTag
import asyncio
import websockets
import json

class RFIDTracker:
    def __init__(self, port: str, baud_rate: int, max_tags: int):
        try:
            self.serial = serial.Serial(port, baud_rate, timeout=1)
        except serial.SerialException as e:
            print(f"Error opening serial port: {e}")
            os._exit(1)


        self.max_tags = max_tags
        self.tags: Dict[str, RFIDTag] = {}
        self.next_id = 1

    def read_serial(self) -> Optional[Tuple[str, float, int, int]]:
        """Read and parse a single RFID tag data from serial."""
        line = self.serial.readline().decode('utf-8').strip()
        if line.startswith("TAG,"):
            parts = line.split(',')
            if len(parts) == 5:
                _, rssi, freq, timestamp, epc = parts
                return epc, time.time(), int(rssi), int(freq)
        return None

    def update_tag(self, epc: str, timestamp: float, rssi: int, freq: int) -> None:
        """Update or add a tag to the tracker."""
        if epc in self.tags:
            tag = self.tags[epc]
            elapsed_time = timestamp - tag.last_read_time
            tag.total_read_time += elapsed_time
            tag.read_count += 1
            tag.read_times.append(elapsed_time)
            tag.avg_read_time = tag.total_read_time / tag.read_count
            if len(tag.read_times) > 1:
                tag.var_read_time = np.var(list(tag.read_times))
        elif len(self.tags) < self.max_tags:
            tag = RFIDTag(epc, self.next_id, self.max_tags)
            self.tags[epc] = tag
            self.next_id += 1
        else:
            return # Ignore new tags if max limit reached

        tag.last_read_time = timestamp
        tag.rssi = rssi
        tag.frequency = freq

    def update_all_tags_visibility(self, current_time):
        """Update visibility probabilities and detect events for all tags."""
        for tag in self.tags.values():
            tag.update_visibility(current_time)

    def read_and_update(self) -> None:
        """Read from serial and update tag data."""
        current_time = time.time()
        tag_data = self.read_serial()
        if tag_data:
            self.update_tag(*tag_data)
        self.update_all_tags_visibility(current_time)

    def get_tag_data(self, epc: str) -> Optional[Dict]:
        """Get data for a specific tag."""
        if epc in self.tags:
            tag = self.tags[epc]
            return {
                "id": tag.id,
                "epc": tag.epc,
                "last_read_time": tag.last_read_time,
                "rssi": tag.rssi,
                "frequency": tag.frequency,
                "read_count": tag.read_count,
                "avg_read_time": tag.avg_read_time,
                "var_read_time": tag.var_read_time,
                "visibility_prob": tag.visibility_prob,
                "average_prob": tag.avg_last_10_prob,
                "tag_state": tag.tag_state
            }
        return None

    def get_all_tags(self) -> Dict[str, Dict]:
        """Get data for all tracked tags."""
        return {epc: self.get_tag_data(epc) for epc in self.tags}

    def close(self) -> None:
        """Close the serial connection."""
        self.serial.close()


def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_table(tags: Dict[str, Dict]):
    table = PrettyTable()
    table.field_names = ["ID", "EPC", "Last Read Time", "RSSI", "Frequency", "Read Count", "Visibility Prob",
                         "Average Prob",
                         "Tag State"]
    for tag in tags.values():
        table.add_row([
            tag['id'],
            tag['epc'],
            f"{time.time() - tag['last_read_time']:.2f}s ago",
            tag['rssi'],
            tag['frequency'],
            tag['read_count'],
            # f"{tag['avg_read_time']:.4f}s",
            # f"{tag['var_read_time']:.6f}s²",
            f"{tag['visibility_prob']:.4f}",
            f"{tag['average_prob']:.4f}",
            tag['tag_state']
        ])
    clear_screen()
    print(table)

if __name__ == "__main__":
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)  # Set to 3 tags
    try:
        while True:
            tracker.read_and_update()
            print_table(tracker.get_all_tags())
            # print(tracker.get_all_tags())
            # time.sleep(0.1)  # Short delay between reads
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        tracker.close()

# if __name__ == "__main__":
#     tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)  # Set to 3 tags
#     try:
#         async def send_tags():
#             while True:
#                 tracker.read_and_update()
#                 tags = tracker.get_all_tags()
#                 print(tags)
#                 async with websockets.connect("ws://localhost:3000") as websocket:
#                     await websocket.send(json.dumps(tags))
#                 # await asyncio.sleep(0.1)
#                 print("hello")
#         asyncio.get_event_loop().run_until_complete(send_tags())
#         asyncio.get_event_loop().run_forever()
#     except KeyboardInterrupt:
#         print("\nInterrupted by user")
#     finally:
#         tracker.close()

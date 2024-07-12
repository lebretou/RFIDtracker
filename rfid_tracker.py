import serial
import time
from typing import Dict, Optional, Tuple
from prettytable import PrettyTable
import os

class RFIDTag:
    def __init__(self, epc: str, tag_id: int):
        self.epc = epc
        self.id = tag_id
        self.last_read_time = 0
        self.rssi = 0
        self.frequency = 0
        self.read_count = 0

class RFIDTracker:
    def __init__(self, port: str, baud_rate: int, max_tags: int):
        self.serial = serial.Serial(port, baud_rate, timeout=1)
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
        elif len(self.tags) < self.max_tags:
            tag = RFIDTag(epc, self.next_id)
            self.tags[epc] = tag
            self.next_id += 1
        else:
            # If we've reached max tags, don't add a new one
            return

        tag.last_read_time = timestamp
        tag.rssi = rssi
        tag.frequency = freq
        tag.read_count += 1

    def read_and_update(self) -> None:
        """Read from serial and update tag data."""
        tag_data = self.read_serial()
        if tag_data:
            self.update_tag(*tag_data)

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
                "read_count": tag.read_count
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
    table.field_names = ["ID", "EPC", "Last Read Time", "RSSI", "Frequency", "Read Count"]
    for tag in tags.values():
        table.add_row([
            tag['id'],
            tag['epc'],
            f"{time.time() - tag['last_read_time']:.2f}s ago",
            tag['rssi'],
            tag['frequency'],
            tag['read_count']
        ])
    clear_screen()
    print(table)

# Example usage
if __name__ == "__main__":
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=10)
    try:
        while True:
            tracker.read_and_update()
            print_table(tracker.get_all_tags())
            time.sleep(0.1)  # Short delay between reads
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        tracker.close()
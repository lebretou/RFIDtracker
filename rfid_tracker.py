import serial
import time
from typing import Dict, Optional, Tuple

class RFIDTag:
    def __init__(self, epc: str):
        self.epc = epc
        self.last_read_time = 0
        self.rssi = 0
        self.frequency = 0
        self.read_count = 0

class RFIDTracker:
    def __init__(self, port: str, baud_rate: int, max_tags: int):
        self.serial = serial.Serial(port, baud_rate, timeout=1)
        self.max_tags = max_tags
        self.tags: Dict[str, RFIDTag] = {}

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
            tag = RFIDTag(epc)
            self.tags[epc] = tag
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

# Example usage
if __name__ == "__main__":
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=10)
    try:
        for _ in range(100):  # Read 100 times
            tracker.read_and_update()
            time.sleep(0.1)  # Short delay between reads
        
        # Print all tag data
        all_tags = tracker.get_all_tags()
        for epc, data in all_tags.items():
            print(f"Tag EPC: {epc}")
            print(f"  Last Read Time: {data['last_read_time']}")
            print(f"  RSSI: {data['rssi']}")
            print(f"  Frequency: {data['frequency']}")
            print(f"  Read Count: {data['read_count']}")
    finally:
        tracker.close()
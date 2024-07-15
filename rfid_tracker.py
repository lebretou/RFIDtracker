import serial
import time
from typing import Dict, Optional, Tuple, List
from prettytable import PrettyTable
import os
import numpy as np
from scipy.stats import norm
from collections import deque

class RFIDTag:
    def __init__(self, epc: str, tag_id: int):
        self.epc = epc
        self.id = tag_id
        self.last_read_time = time.time()
        self.rssi = 0
        self.frequency = 0
        self.read_count = 0
        self.total_read_time = 0
        self.avg_read_time = 0
        self.read_times = deque(maxlen=100)  # Keep last 100 read times
        self.var_read_time = 0
        self.visibility_prob = 0.5  # Initial probability of being visible
        
        # Bayesian filter parameters
        self.visible_mean = 0.0956
        self.visible_var = 0.0051
        self.covered_mean = 0.62
        self.covered_var = 7.38
        self.transition_rate = 0.1  # Probability of transitioning between states

    def update_visibility(self, current_time, num_samples=10):
        elapsed_time = current_time - self.last_read_time
        self.read_times.append(elapsed_time)
        
        visibility_samples = []
        for _ in range(num_samples):
            # Sample an elapsed time from recent history
            sampled_time = np.random.choice(self.read_times)
            
            # Transition model
            v_prob = 0.5 + (self.visibility_prob - 0.5) * (1 - self.transition_rate)
            
            # Observation model
            p_visible = norm.pdf(sampled_time, self.visible_mean, np.sqrt(self.visible_var))
            p_covered = norm.pdf(sampled_time, self.covered_mean, np.sqrt(self.covered_var))
            
            # Bayes update
            likelihood_visible = p_visible * v_prob
            likelihood_covered = p_covered * (1 - v_prob)
            total_likelihood = likelihood_visible + likelihood_covered
            
            if total_likelihood > 0:
                v_prob = likelihood_visible / total_likelihood
            
            visibility_samples.append(v_prob)
        
        # Update visibility probability with the mean of samples
        self.visibility_prob = np.mean(visibility_samples)
        
        # Decay the probability towards 0.5 for long periods without reads
        decay_factor = np.exp(-elapsed_time / 10)  # Adjust the 10 to control decay rate
        self.visibility_prob = 0.5 + (self.visibility_prob - 0.5) * decay_factor

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
            elapsed_time = timestamp - tag.last_read_time
            tag.total_read_time += elapsed_time
            tag.read_count += 1
            tag.read_times.append(elapsed_time)
            tag.avg_read_time = tag.total_read_time / tag.read_count
            if len(tag.read_times) > 1:
                tag.var_read_time = np.var(list(tag.read_times))
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

    def update_all_tags(self, current_time):
        """Update visibility probabilities for all tags."""
        for tag in self.tags.values():
            tag.update_visibility(current_time)

    def read_and_update(self) -> None:
        """Read from serial and update tag data."""
        current_time = time.time()
        tag_data = self.read_serial()
        if tag_data:
            self.update_tag(*tag_data)
        self.update_all_tags(current_time)

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
                "visibility_prob": tag.visibility_prob
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
    table.field_names = ["ID", "EPC", "Last Read Time", "RSSI", "Frequency", "Read Count", "Avg Read Time", "Var Read Time", "Visibility Prob"]
    for tag in tags.values():
        table.add_row([
            tag['id'],
            tag['epc'],
            f"{time.time() - tag['last_read_time']:.2f}s ago",
            tag['rssi'],
            tag['frequency'],
            tag['read_count'],
            f"{tag['avg_read_time']:.4f}s",
            f"{tag['var_read_time']:.6f}s²",
            f"{tag['visibility_prob']:.4f}"
        ])
    clear_screen()
    print(table)

# Example usage
if __name__ == "__main__":
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)  # Set to 3 tags
    try:
        while True:
            tracker.read_and_update()
            print_table(tracker.get_all_tags())
            # time.sleep(0.1)  # Short delay between reads
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        tracker.close()
import tkinter as tk
from tkinter import ttk
import time
import threading
from typing import List, Dict
from rfid_tracker import RFIDTracker
import random

class RFIDBarChartGUI:
    def __init__(self, master, tracker: RFIDTracker, tag_order: List[str]):
        self.master = master
        self.tracker = tracker
        self.tag_order = tag_order
        
        master.title("RFID Tag Bar Chart")
        master.geometry("600x400")
        
        self.canvas = tk.Canvas(master, width=600, height=400, bg='white')
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        self.chart_width = 500
        self.chart_height = 300
        self.chart_margin = 50
        
        # Draw axes
        self.canvas.create_line(self.chart_margin, 350, self.chart_margin, 50, width=2)  # Y-axis
        self.canvas.create_line(self.chart_margin, 350, 550, 350, width=2)  # X-axis
        
        # Y-axis labels
        for i in range(5):
            y = 350 - i * 75
            self.canvas.create_line(self.chart_margin - 5, y, self.chart_margin, y)
            self.canvas.create_text(self.chart_margin - 25, y, text=str(i * 25), anchor='e')
        
        self.bars = []
        self.number_labels = []
        self.bar_values = [random.randint(50, 100) for _ in range(3)]  # Random bar heights
        
        bar_width = 100
        for i in range(3):
            x = self.chart_margin + (i + 1) * (self.chart_width // 4) - bar_width // 2
            bar_height = self.bar_values[i] * 3
            bar = self.canvas.create_rectangle(x, 350 - bar_height, x + bar_width, 350, fill='lightblue')
            number_label = self.canvas.create_text(x + bar_width // 2, 350 - bar_height // 2, text=str(i+1), font=('Arial', 20, 'bold'), fill='white', state='hidden')
            self.bars.append(bar)
            self.number_labels.append(number_label)
            
            # X-axis labels
            self.canvas.create_text(x + bar_width // 2, 370, text=f"Tag {i+1}", anchor='n')
        
        self.low_prob_start_times: Dict[str, float] = {epc: 0 for epc in tag_order}
        
        self.update_gui()
        
        # Start the update thread
        self.running = True
        self.update_thread = threading.Thread(target=self.update_loop)
        self.update_thread.start()
    
    def update_gui(self):
        tag_data = self.tracker.get_all_tags()
        current_time = time.time()
        covered_index = -1
        min_prob = float('inf')
        
        # First pass: find the tag with the lowest stable probability
        for i, epc in enumerate(self.tag_order):
            if epc in tag_data:
                visibility_prob = tag_data[epc]['visibility_prob']
                
                if visibility_prob < 0.5:
                    if self.low_prob_start_times[epc] == 0:
                        self.low_prob_start_times[epc] = current_time
                    elif current_time - self.low_prob_start_times[epc] >= 0.5:
                        if visibility_prob < min_prob:
                            min_prob = visibility_prob
                            covered_index = i
                else:
                    self.low_prob_start_times[epc] = 0
        
        # Second pass: update GUI elements
        for i, epc in enumerate(self.tag_order):
            if epc in tag_data:
                is_covered = (i == covered_index)
                color = 'red' if is_covered else 'lightblue'
                self.canvas.itemconfig(self.bars[i], fill=color)
                if is_covered:
                    self.canvas.itemconfig(self.number_labels[i], state='normal')
                else:
                    self.canvas.itemconfig(self.number_labels[i], state='hidden')
            else:
                self.canvas.itemconfig(self.bars[i], fill='gray')
                self.canvas.itemconfig(self.number_labels[i], state='hidden')
    
    def update_loop(self):
        while self.running:
            self.tracker.read_and_update()
            self.master.after(0, self.update_gui)
    
    def stop(self):
        self.running = False
        self.update_thread.join()
        self.tracker.close()

def main():
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)
    
    tag_order = [
        "E2003A8B5B168149C2DEC5BD",
        "E2003A8B5B17BB09C2DECAA4",
        "E2003A8B5B1777C9C2DEC997"
    ]
    
    root = tk.Tk()
    gui = RFIDBarChartGUI(root, tracker, tag_order)
    
    def on_closing():
        gui.stop()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()
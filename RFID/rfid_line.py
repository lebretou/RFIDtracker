import tkinter as tk
from tkinter import ttk
import time
import threading
from typing import List, Dict
from rfid_tracker import RFIDTracker
import random
import numpy as np
from PIL import Image, ImageTk, ImageDraw

class RFIDLineChartGUI:
    def __init__(self, master, tracker: RFIDTracker, tag_order: List[str]):
        self.master = master
        self.tracker = tracker
        self.tag_order = tag_order
        
        master.title("RFID Tag Line Chart")
        master.geometry("800x500")
        
        self.canvas = tk.Canvas(master, width=800, height=500, bg='white')
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        self.chart_width = 700
        self.chart_height = 400
        self.chart_margin = 50
        
        # Generate smoother, upward-trending line chart data
        self.x_data = list(range(300))
        base = np.linspace(20, 60, 300)  # Base upward trend
        noise = np.random.normal(0, 2, 300)  # Small random fluctuations
        self.y_data = [max(20, min(80, y)) for y in (base + noise)]  # Clip values between 20 and 80
        
        # Draw axes
        self.canvas.create_line(self.chart_margin, 450, self.chart_margin, 50, width=2)  # Y-axis
        self.canvas.create_line(self.chart_margin, 450, 750, 450, width=2)  # X-axis
        
        # Y-axis labels
        for i in range(5):
            y = 450 - i * 100
            self.canvas.create_line(self.chart_margin - 5, y, self.chart_margin, y)
            self.canvas.create_text(self.chart_margin - 25, y, text=str(i * 25), anchor='e')
        
        # Draw line chart
        for i in range(1, len(self.x_data)):
            x1 = self.chart_margin + (i-1) * (self.chart_width / 299)
            y1 = 450 - self.y_data[i-1] * 4
            x2 = self.chart_margin + i * (self.chart_width / 299)
            y2 = 450 - self.y_data[i] * 4
            self.canvas.create_line(x1, y1, x2, y2, fill='blue', width=2)
        
        # Create shaded regions and statistic labels
        self.regions = []
        self.stat_labels = []
        self.region_images = []
        for i in range(3):
            x1 = self.chart_margin + i * (self.chart_width / 3)
            x2 = self.chart_margin + (i + 1) * (self.chart_width / 3)
            
            # Create a transparent image for shading
            image = Image.new('RGBA', (int(self.chart_width/3), 400), (0, 0, 0, 0))
            self.region_images.append(ImageTk.PhotoImage(image))
            
            region = self.canvas.create_image(x1, 50, anchor='nw', image=self.region_images[i])
            stat_label = self.canvas.create_text(x1 + (self.chart_width / 6), 30, text='', font=('Arial', 10))
            self.regions.append(region)
            self.stat_labels.append(stat_label)
        
        self.low_prob_start_times: Dict[str, float] = {epc: 0 for epc in tag_order}
        self.current_covered_tag = None
        
        self.update_gui()
        
        # Start the update thread
        self.running = True
        self.update_thread = threading.Thread(target=self.update_loop)
        self.update_thread.start()
    
    def update_gui(self):
        tag_data = self.tracker.get_all_tags()
        current_time = time.time()
        
        covered_tag = None
        lowest_prob = float('inf')
        
        # First pass: find the tag with the lowest stable probability
        for i, epc in enumerate(self.tag_order):
            if epc in tag_data:
                visibility_prob = tag_data[epc]['visibility_prob']
                
                if visibility_prob < 0.5:
                    if self.low_prob_start_times[epc] == 0:
                        self.low_prob_start_times[epc] = current_time
                    elif current_time - self.low_prob_start_times[epc] >= 0.55:
                        if visibility_prob < lowest_prob:
                            lowest_prob = visibility_prob
                            covered_tag = i
                else:
                    self.low_prob_start_times[epc] = 0
        
        # Second pass: update GUI elements
        for i in range(3):
            if i == covered_tag:
                # Shade the region and display statistics
                image = Image.new('RGBA', (int(self.chart_width/3), 400), (173, 216, 230, 128))  # Light blue with 50% opacity
                self.region_images[i] = ImageTk.PhotoImage(image)
                self.canvas.itemconfig(self.regions[i], image=self.region_images[i])
                
                # Calculate statistics for the region
                region_start = i * 100
                region_end = (i + 1) * 100
                region_data = self.y_data[region_start:region_end]
                avg = np.mean(region_data)
                min_val = np.min(region_data)
                max_val = np.max(region_data)
                
                stats_text = f"Avg: {avg:.2f}\nRange: {min_val:.2f}-{max_val:.2f}"
                self.canvas.itemconfig(self.stat_labels[i], text=stats_text)
            else:
                # Clear shading and statistics for non-covered tags
                image = Image.new('RGBA', (int(self.chart_width/3), 400), (0, 0, 0, 0))
                self.region_images[i] = ImageTk.PhotoImage(image)
                self.canvas.itemconfig(self.regions[i], image=self.region_images[i])
                self.canvas.itemconfig(self.stat_labels[i], text='')
    
    def update_loop(self):
        while self.running:
            self.tracker.read_and_update()
            self.master.after(0, self.update_gui)
    
    def stop(self):
        self.running = False
        self.update_thread.join()
        self.tracker.close()

def main():
    # Initialize your RFIDTracker here
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)
    
    # Specify the order of tags (replace with your actual EPCs)
    tag_order = [
        "E2003A8B5B168149C2DEC5BD",
        "E2003A8B5B17BB09C2DECAA4",
        "E2003A8B5B1777C9C2DEC997"
    ]
    
    root = tk.Tk()
    gui = RFIDLineChartGUI(root, tracker, tag_order)
    
    def on_closing():
        gui.stop()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()
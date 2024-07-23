import sys
import time
from collections import deque
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel
from PyQt5.QtGui import QPainter, QColor, QFont
from PyQt5.QtCore import Qt, QTimer
import pyqtgraph as pg
from rfid_tracker import RFIDTracker  # Import your existing RFIDTracker class

class TagWidget(QWidget):
    def __init__(self, tag_data):
        super().__init__()
        self.tag_data = tag_data
        self.color = Qt.yellow  # Default color
        self.visibility_history = deque(maxlen=5)  # Store 5 samples for color averaging
        self.graph_data = deque(maxlen=100)  # Store 100 samples for graphing
        self.time_data = deque(maxlen=100)  # Corresponding time data
        self.start_time = time.time()
        self.initUI()

    def initUI(self):
        layout = QHBoxLayout()  # Changed to horizontal layout
        
        # Left side: info labels
        info_layout = QVBoxLayout()
        fields = [
            ('ID', 'id'),
            ('EPC', 'epc'),
            ('Last Read Time', 'last_read_time'),
            ('RSSI', 'rssi'),
            ('Frequency', 'frequency'),
            ('Read Count', 'read_count'),
            ('Avg Read Time', 'avg_read_time'),
            ('Var Read Time', 'var_read_time'),
            ('Visibility Prob', 'visibility_prob')
        ]
        
        self.labels = {}
        for label, key in fields:
            self.labels[key] = QLabel(f"{label}: {self.tag_data.get(key, 'N/A')}")
            info_layout.addWidget(self.labels[key])
        
        layout.addLayout(info_layout)
        
        # Right side: graph
        self.graph_widget = pg.PlotWidget()
        self.graph_widget.setBackground('w')
        self.graph_widget.setYRange(0, 1)
        self.graph_widget.setTitle("Visibility Probability Over Time")
        self.graph_widget.setLabel('left', 'Probability')
        self.graph_widget.setLabel('bottom', 'Time (s)')
        self.graph_curve = self.graph_widget.plot(pen=pg.mkPen(color='b', width=2))
        layout.addWidget(self.graph_widget)
        
        self.setLayout(layout)

    def update_data(self, tag_data):
        self.tag_data = tag_data
        for key, label in self.labels.items():
            label.setText(f"{key.replace('_', ' ').title()}: {self.tag_data.get(key, 'N/A')}")
        
        # Update visibility history and graph data
        prob = float(self.tag_data['visibility_prob'])
        self.visibility_history.append(prob)
        current_time = time.time() - self.start_time
        self.graph_data.append(prob)
        self.time_data.append(current_time)
        
        # Update graph
        self.graph_curve.setData(x=list(self.time_data), y=list(self.graph_data))

    def update_color(self):
        if len(self.visibility_history) > 0:
            avg_visibility = sum(self.visibility_history) / len(self.visibility_history)
            self.color = QColor(Qt.green) if avg_visibility > 0.5 else QColor(Qt.red)
            self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.fillRect(self.rect(), self.color)
        painter.end()

class RFIDGui(QMainWindow):
    def __init__(self, tracker):
        super().__init__()
        self.tracker = tracker
        self.tag_widgets = {}
        self.initUI()

    def initUI(self):
        self.setWindowTitle('RFID Tag Tracker')
        self.setGeometry(100, 100, 1200, 800)  # Increased window size

        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        self.main_layout = QVBoxLayout(central_widget)

        # Set up a timer to update the GUI data frequently
        self.data_timer = QTimer(self)
        self.data_timer.timeout.connect(self.updateData)
        self.data_timer.start(10)  # Update every 10 ms for data

        # Set up a timer to update the visibility color less frequently
        self.color_timer = QTimer(self)
        self.color_timer.timeout.connect(self.updateColors)
        self.color_timer.start(300)  # Update every 300 ms for visibility color

    def updateData(self):
        self.tracker.read_and_update()
        all_tags = self.tracker.get_all_tags()

        for epc, tag_data in all_tags.items():
            formatted_data = {
                "id": tag_data['id'],
                "epc": tag_data['epc'],
                "last_read_time": f"{time.time() - tag_data['last_read_time']:.2f}s ago",
                "rssi": tag_data['rssi'],
                "frequency": tag_data['frequency'],
                "read_count": tag_data['read_count'],
                "avg_read_time": f"{tag_data['avg_read_time']:.4f}s",
                "var_read_time": f"{tag_data['var_read_time']:.6f}s²",
                "visibility_prob": f"{tag_data['visibility_prob']:.4f}"
            }
            
            if epc not in self.tag_widgets:
                tag_widget = TagWidget(formatted_data)
                self.tag_widgets[epc] = tag_widget
                self.main_layout.addWidget(tag_widget)
            else:
                self.tag_widgets[epc].update_data(formatted_data)

        # Remove widgets for tags that are no longer present
        for epc in list(self.tag_widgets.keys()):
            if epc not in all_tags:
                self.main_layout.removeWidget(self.tag_widgets[epc])
                self.tag_widgets[epc].deleteLater()
                del self.tag_widgets[epc]

    def updateColors(self):
        for tag_widget in self.tag_widgets.values():
            tag_widget.update_color()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)  # Adjust port as needed
    gui = RFIDGui(tracker)
    gui.show()
    sys.exit(app.exec_())
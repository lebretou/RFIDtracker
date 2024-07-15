import sys
import time
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel
from PyQt5.QtGui import QPainter, QColor, QFont
from PyQt5.QtCore import Qt, QTimer
from rfid_tracker import RFIDTracker  # Import your existing RFIDTracker class

class TagWidget(QWidget):
    def __init__(self, tag_data):
        super().__init__()
        self.tag_data = tag_data
        self.initUI()

    def initUI(self):
        layout = QVBoxLayout()
        
        fields = [
            ('ID', 'id'),
            ('EPC', 'epc'),
            ('Last Read Time', lambda d: f"{time.time() - d['last_read_time']:.2f}s ago"),
            ('RSSI', 'rssi'),
            ('Frequency', 'frequency'),
            ('Read Count', 'read_count'),
            ('Avg Read Time', lambda d: f"{d['avg_read_time']:.4f}s"),
            ('Var Read Time', lambda d: f"{d['var_read_time']:.6f}s²"),
            ('Visibility Prob', lambda d: f"{d['visibility_prob']:.4f}")
        ]
        
        for label, key in fields:
            value = key(self.tag_data) if callable(key) else str(self.tag_data.get(key, 'N/A'))
            layout.addWidget(QLabel(f"{label}: {value}"))
        
        self.setLayout(layout)

    def paintEvent(self, event):
        painter = QPainter(self)
        color = QColor(Qt.green) if self.tag_data['visibility_prob'] > 0.6 else QColor(Qt.red)
        painter.fillRect(self.rect(), color)
        painter.end()

class RFIDGui(QMainWindow):
    def __init__(self, tracker):
        super().__init__()
        self.tracker = tracker
        self.initUI()

    def initUI(self):
        self.setWindowTitle('RFID Tag Tracker')
        self.setGeometry(100, 100, 800, 600)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        self.main_layout = QVBoxLayout(central_widget)

        self.updateGUI()

        # Set up a timer to update the GUI periodically
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.updateGUI)
        self.timer.start(100)  # Update every 100 ms

    def updateGUI(self):
        # Clear the existing layout
        for i in reversed(range(self.main_layout.count())): 
            self.main_layout.itemAt(i).widget().setParent(None)

        # Update tag data and recreate widgets
        self.tracker.read_and_update()
        all_tags = self.tracker.get_all_tags()

        for tag_data in all_tags.values():
            tag_widget = TagWidget(tag_data)
            self.main_layout.addWidget(tag_widget)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    tracker = RFIDTracker("/dev/tty.usbmodem21301", 115200, max_tags=3)  # Adjust port as needed
    gui = RFIDGui(tracker)
    gui.show()
    sys.exit(app.exec_())
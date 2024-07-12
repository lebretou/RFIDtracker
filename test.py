import serial
import time

def parse_rfid_data(data):
    # Split the data by commas
    parts = data.split(',')
    
    if len(parts) < 5 or parts[0] != "TAG":
        return None

    try:
        rssi = int(parts[1])
        freq = int(parts[2])
        timestamp = int(parts[3])
        epc = parts[4]
        
        # The EPC might contain additional commas, so we join the rest of the parts
        epc = ''.join(parts[4:])
        
        return {
            "RSSI": rssi,
            "Frequency": freq,
            "Timestamp": timestamp,
            "EPC": epc
        }
    except ValueError:
        return None

def main():
    # Replace 'COM3' with your serial port
    ser = serial.Serial('/dev/tty.usbmodem21301', 115200, timeout=1)
    time.sleep(2)  # Wait for the serial connection to initialize
    
    while True:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').strip()
            rfid_data = parse_rfid_data(line)
            
            if rfid_data:
                print(f"RSSI: {rfid_data['RSSI']}")
                print(f"Frequency: {rfid_data['Frequency']}")
                print(f"Timestamp: {rfid_data['Timestamp']}")
                print(f"EPC: {rfid_data['EPC']}")
                print("-----------")
                
        time.sleep(0.1)

if __name__ == "__main__":
    main()

#include "SparkFun_UHF_RFID_Reader.h"
#include <SoftwareSerial.h>

RFID rfidModule;
SoftwareSerial softSerial(2, 3); //RX, TX

#define rfidSerial softSerial
#define rfidBaud 38400
#define moduleType ThingMagic_M6E_NANO

void setup()
{
  Serial.begin(115200);

  if (setupRfidModule(rfidBaud) == false)
  {
    Serial.println(F("Module failed to respond. Please check wiring."));
    while (1); //Freeze!
  }

  rfidModule.setRegion(REGION_NORTHAMERICA);
  rfidModule.setReadPower(2700); //27.00 dBm

  rfidModule.startReading(); //Begin scanning for tags
}

void loop()
{
  if (rfidModule.check() == true)
  {
    byte responseType = rfidModule.parseResponse();

    if (responseType == RESPONSE_IS_TAGFOUND)
    {
      int rssi = rfidModule.getTagRSSI();
      long freq = rfidModule.getTagFreq();
      long timeStamp = rfidModule.getTagTimestamp();
      byte tagEPCBytes = rfidModule.getTagEPCBytes();

      // Print data in an easy-to-parse format
      Serial.print("TAG,");
      Serial.print(rssi);
      Serial.print(",");
      Serial.print(freq);
      Serial.print(",");
      Serial.print(timeStamp);
      Serial.print(",");

      // Print EPC bytes
      for (byte x = 0 ; x < tagEPCBytes ; x++)
      {
        if (rfidModule.msg[31 + x] < 0x10) Serial.print("0");
        Serial.print(rfidModule.msg[31 + x], HEX);
      }
      Serial.println();
    }
  }
}

boolean setupRfidModule(long baudRate)
{
  rfidModule.begin(rfidSerial, moduleType);

  rfidSerial.begin(baudRate);
  delay(100);

  while (rfidSerial.available()) rfidSerial.read();

  rfidModule.getVersion();

  if (rfidModule.msg[0] == ERROR_WRONG_OPCODE_RESPONSE)
  {
    rfidModule.stopReading();
    delay(1500);
  }
  else
  {
    rfidSerial.begin(115200);
    rfidModule.setBaud(baudRate);
    rfidSerial.begin(baudRate);
    delay(250);
  }

  rfidModule.getVersion();
  if (rfidModule.msg[0] != ALL_GOOD) return false;

  rfidModule.setTagProtocol();
  rfidModule.setAntennaPort();

  return true;
}
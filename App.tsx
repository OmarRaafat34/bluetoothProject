import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Button,
  Text,
  PermissionsAndroid,
} from 'react-native';

import { BleManager, Device } from 'react-native-ble-plx'
import base64 from 'react-native-base64';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message


const App = () => {
  const BLTManager = new BleManager()
  const [isConnected, setIsConnected] = useState(false);

  //What device is connected?
  const [connectedDevice, setConnectedDevice] = useState<Device>();
  const [message, setMessage] = useState('Nothing Yet');
  // const [boxvalue, setBoxValue] = useState(false);

  useEffect(() => {
    const subscription = BLTManager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        scanDevices()
        subscription.remove()
      }
    })
  }, [])

  async function scanDevices() {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      // PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
      {
        title: 'Permission Localisation Bluetooth',
        message: 'Requirement for Bluetooth',
        buttonNeutral: 'Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    ).then(answer => {
      console.log('scanning');
      // display the Activityindicator

      BLTManager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.warn(error);
        }
        console.log(scannedDevice, "scanned device")
        if (scannedDevice.name === "SAMSUNG") {
          BLTManager.stopDeviceScan();
          console.log('connected to samsung a5')
          connectDevice(scannedDevice);
        }
      });

      // stop scanning devices after 10 seconds
      setTimeout(() => {
        BLTManager.stopDeviceScan();
        console.log('scanning stopped')
      }, 10000);
    });
  }

  async function disconnectDevice() {
    console.log('Disconnecting start');

    if (connectedDevice != null) {
      const isDeviceConnected = await connectedDevice.isConnected();
      if (isDeviceConnected) {
        BLTManager.cancelTransaction('messagetransaction');
        BLTManager.cancelTransaction('nightmodetransaction');

        BLTManager.cancelDeviceConnection(connectedDevice.id).then(() =>
          console.log('DC completed'),
        );
      }

      const connectionStatus = await connectedDevice.isConnected();
      if (!connectionStatus) {
        setIsConnected(false);
      }
    }
  }

  async function connectDevice(device: Device) {
    console.log('connecting to Device:', device);
    // try {
    console.log('here')
    BLTManager.connectToDevice(device.id)
      .then(device => {
        setConnectedDevice(device);
        console.log(connectedDevice, 'connectedDevice')
        setIsConnected(true);
        console.log('here3')
        return device.discoverAllServicesAndCharacteristics();
      })
      .then(device => {
        BLTManager.onDeviceDisconnected(device.id, (error, device) => {
          console.log('Device DC');
          setIsConnected(false);
        });

        //Read inital values

        // device.readCharacteristicForService(SERVICE_UUID, MESSAGE_UUID)
        //   .then(val => {
        //     setMessage(val?.value);
        //   });

        console.log('Connection established');
      })
      .catch((err) => {
        console.log(err, 'error')
      });
    // } catch(error) {
    //   console.log(error, "error")
    // }
  }
  return (
    <View>
      <View style={{ paddingBottom: 200 }}></View>

      {/* Title */}
      <View style={styles.rowView}>
        <Text style={styles.titleText}>BLE Test</Text>
      </View>

      <View style={{ paddingBottom: 20 }}></View>

      {/* Connect Button */}
      <View style={styles.rowView}>
        <TouchableOpacity style={{ width: 120 }}>
          {!isConnected ? (
            <Button
              title="Connect"
              onPress={() => {
                scanDevices();
              }}
              disabled={false}
            />
          ) : (
            <Button
              title="Disonnect"
              onPress={() => {
                disconnectDevice();
              }}
              disabled={false}
            />
          )}
        </TouchableOpacity>
        <View style={styles.rowView}>
          <Text style={styles.baseText}>{message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontSize: 15,
    fontFamily: 'Cochin',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rowView: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
});

export default App;

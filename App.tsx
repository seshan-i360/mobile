/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';

import mqtt from 'mqtt';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const qos0Topic = '/test/qos0';

  const log = (msg: string) => {
    const now = new Date();
    setLogs(prevLogs => [...prevLogs, `${now.toString()}: ${msg}`]);
  };

  function createClient() {
    const mqttClient: mqtt.MqttClient = mqtt.connect(
      'wss://a1bx4k0gg8p8ir-ats.iot.ap-south-1.amazonaws.com:443/mqtt',
      {
        protocolVersion: 5,
        clientId: 'mqtt-client',
        username:
          'mqtt-client?x-amz-customauthorizer-name=my-new-authorizer-noSigned',
        password: 'test',
        keepalive: 60,
        reconnectPeriod: 5000,
        clean: true,
      },
    );

    mqttClient.on('connect', () => {
      log('Connected');

      mqttClient.subscribe(qos0Topic, {qos: 1}, err => {
        if (err) {
          log('Subscription error: ' + err.message);
        } else {
          log(`Subscribed to topic: ${qos0Topic}`);
        }
      });
    });

    mqttClient.on('error', error => {
      log('Error: ' + error.message);
    });

    mqttClient.on('disconnect', packet => {
      log('Disconnected. Reason: ' + packet.reasonCode);
    });

    mqttClient.on('offline', () => {
      log('Client went offline');
    });

    mqttClient.on('reconnect', () => {
      log('Attempting to reconnect');
    });

    mqttClient.on('close', () => {
      log('Connection closed');
    });

    mqttClient.on('message', (topic, message) => {
      log(`Received message from ${topic}: ${message.toString()}`);
    });

    setClient(mqttClient);
  }

  useEffect(() => {
    createClient();

    return () => {
      if (client) {
        client.end(true);
        log('Client ended');
      }
    };
  }, []);

  const connect = () => {
    if (client && client.end(true)) {
      createClient();
    }
  };

  const publishMessage = () => {
    if (client) {
      const msg = {
        message: 'Hello from AWS IoT console',
      };

      client.publish(
        qos0Topic,
        JSON.stringify(msg),
        {qos: 1, retain: true},
        err => {
          if (err) {
            log('Publish error: ' + err.message);
          } else {
            log(`Message published to ${qos0Topic}`);
          }
        },
      );
    }
  };

  const closeConnection = () => {
    if (client) {
      client.end();
      log('Connection closed manually');
      setClient(null); // Reset client state
    }
  };

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <View style={styles.buttonContainer}>
            <Button title="Publish Message" onPress={publishMessage} />
            <Button title="Connect" onPress={connect} />
            <Button title="Close Connection" onPress={closeConnection} />
          </View>
          <Section title="Step One">
            <ScrollView>
              {logs.map((logMessage, index) => (
                <Text key={index} style={styles.logs}>
                  {logMessage}
                </Text>
              ))}
            </ScrollView>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logs: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;

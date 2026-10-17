# Roomly

Arduino Uno and HC-06 room environment dashboard.

- Version: 1.0.0
- Creator: 오로하 (Oh Roha)
- Runtime: Electron

## Start

In PowerShell, open this folder and run:

```powershell
npm.cmd start
```

Open **Settings → Arduino connection**, choose the COM port Windows created for the paired HC-06, select the Arduino baud rate, and connect. The initial baud rate is 9600.

## Sensor data format

Send one reading per line over the serial connection. The app accepts JSON:

```text
{"temperature":24.5,"humidity":48}
```

It also accepts `24.5,48` or `T:24.5,H:48`. The first value is Celsius and the second is relative humidity percent. The sensor model is not fixed; the Arduino sketch should format its sensor readings in one of these formats.

## Included features

- Live temperature and humidity cards with a recent 24-hour graph
- User-configurable low and high thresholds (defaults: 18–28°C and 30–65%) with desktop notifications and a reset-to-default button
- Local sensor history and CSV export
- Manual Gemini analysis for the last 24 hours, 7 days, 30 days, or a custom date range; plus a daily review after 8 AM when a key and sensor history are available
- Gemini API key encrypted with Electron `safeStorage` on this Windows account

Detailed sensor readings stay in this PC's Electron data folder. AI requests send an aggregate of the last 24 hours and configured thresholds to Gemini. AI summaries are environmental reference information, not health or safety diagnoses.

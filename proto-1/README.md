# Roomly

Arduino Uno + HC-06 room environment dashboard with Gemini AI summaries.

- Version: 1.0.0
- Creator: Oh Roha
- Runtime: Electron + Node.js

## Run

1. In PowerShell, open this folder and run:

```powershell
npm.cmd start
```

The app sends aggregate sensor summaries directly to Gemini. No API server or invite codes are required.

## Build Windows installer

Run `npm.cmd run dist` from PowerShell. The Windows x64 installer and unpacked app are written to `dist/`.

## API key warning

The Gemini API key is currently embedded in the Electron app source and can be extracted from a distributed build. Anyone who gets the app can use that key and consume the project's Gemini quota. Keep this build limited to trusted testers and rotate the key if it is exposed. Gemini free-tier models still have project-specific rate limits and daily quotas.

## Arduino input

Pair the HC-06 in Windows and choose its virtual COM port in **Settings → Arduino connection**. The default serial rate is 9600 baud. Send one reading per line, for example:

```text
{"temperature":24.5,"humidity":48}
```

The app also accepts `24.5,48` or `T:24.5,H:48`. The first value is Celsius and the second is relative humidity percent.

## Features

- Live temperature and humidity cards, recent 24-hour graph and local history
- CSV export of local measurements
- Editable threshold alerts with defaults of 18–28 °C and 30–65%, plus reset to defaults
- Manual AI summaries for 24 hours, 7 days, 30 days, or a custom date range
- One daily AI summary after 8 AM while the app is open and sensor data is available

Detailed sensor readings remain on the user's PC. Analysis sends the selected period's aggregate summary and thresholds directly to Gemini. AI reports are environmental reference information, not health diagnoses.

# VoiceToVoiceTranslator

**Live voice-to-voice translation** — a small Python project that listens to your microphone, recognizes speech, translates it, and plays the translated audio back in realtime (or near‑realtime).

---

## Table of Contents

* [Project overview](#project-overview)
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Quick start / Usage](#quick-start--usage)
* [Configuration](#configuration)
* [How it works (high level)](#how-it-works-high-level)
* [Tips & Troubleshooting](#tips--troubleshooting)
* [Development notes](#development-notes)
* [Contributing](#contributing)
* [License](#license)
* [Contact / Acknowledgements](#contact--acknowledgements)

---

## Project overview

`VoiceToVoiceTranslator` captures audio from your microphone, performs speech-to-text (STT), translates the recognized text to a target language, converts the translated text to speech (TTS), and plays that audio back. It is useful for quick spoken translations and demos.

This README assumes the main script is `VoiceToVoiceTranslator.py` (adjust if your main file has a different name).

## Features

* Live microphone capture
* Speech recognition (STT)
* Text translation (configurable target language)
* Text-to-speech (TTS) playback of the translated text
* Basic noise handling (ambient noise adjustment)

## Prerequisites

* Python 3.8 or newer
* Microphone and working audio input/output on your machine
* Internet connection (required for many STT/translation/TTS backends like Google services)

Common Python packages used by this project (example list — see `requirements.txt` if present):

```
speechrecognition
pyaudio
gTTS
playsound
googletrans==4.0.0-rc1   # optional, or other translator client
requests                  # optional (if using HTTP APIs)
```

> **Windows users:** If you get garbled console output, run `chcp 65001` in cmd to switch to UTF-8 encoding before running the script (this was used during development).

### Installing PyAudio on Windows

PyAudio can be troublesome on Windows. Two common approaches:

1. Install using `pipwin` (recommended):

```bash
pip install pipwin
pipwin install pyaudio
```

2. Download a prebuilt wheel matching your Python version & architecture from a trusted wheel repository (e.g. `www.lfd.uci.edu/~gohlke/pythonlibs`) and install with `pip install <wheel-file>`.

## Installation

1. Clone the repository (or download the files):

```bash
git clone https://github.com/<your-username>/VoiceToVoiceTranslator.git
cd VoiceToVoiceTranslator
```

2. (Optional but recommended) Create and activate a virtual environment:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
# or install packages individually:
# pip install SpeechRecognition gTTS playsound pyaudio googletrans==4.0.0-rc1
```

## Quick start / Usage

1. Make sure your microphone is connected and not used by another app.
2. (Windows) If you see garbled text in the terminal, run `chcp 65001`.
3. Run the main script:

```bash
python VoiceToVoiceTranslator.py
```

4. Speak clearly into the microphone. The program will:

   * Listen and perform STT
   * Translate the recognized text
   * Convert the translated text to audio (TTS)
   * Play the audio back

5. To stop the program: press `Ctrl+C` in the terminal, or say a configured stop‑word (if the project includes that feature).

### Example: Stop by spoken keyword

If you want the program to stop when you say a specific word (for example **"zero"**), the logic is typically:

```python
# after recognition step (pseudocode)
recognized_text = recognizer.recognize_google(audio)
if 'zero' in recognized_text.lower():
    break
```

Add this check after you get the recognized text but before translation.

## Configuration

Open the main script and look for clearly named variables near the top — example settings you might find or add:

```python
SOURCE_LANG = 'en'      # language code to recognize from (if using explicit STT language)
TARGET_LANG = 'hi'      # language code to translate to
TTS_LANG = 'hi'         # language code for TTS (gTTS/other TTS providers use their own codes)
STOP_WORD = 'zero'      # spoken word to stop the loop
```

Language codes follow the chosen libraries' conventions (for gTTS and googletrans use ISO short codes like `en`, `hi`, `es`, `fr`, ...).

If your project uses an external API (e.g., Google Cloud, Azure) for STT, translation, or TTS, the README should include instructions to set API keys. Example pattern:

```bash
# set environment variables (example)
set GOOGLE_API_KEY=your_key_here   # Windows
export GOOGLE_API_KEY=your_key_here # macOS / Linux
```

## How it works (high level)

1. The script uses a microphone input via the `speech_recognition` library (or equivalent) to capture audio.
2. The audio is converted to text (STT), often using Google Web Speech API through `recognize_google()` or a configured cloud STT.
3. The recognized text is translated using a translator library or API.
4. The translated text is fed to a TTS engine (e.g. `gTTS`) to produce an audio file.
5. The audio file is played using a simple player like `playsound`, or another audio playback library.
6. Loop back to listen again, unless a stop condition is met.

## Tips & Troubleshooting

**1. Microphone problems**

* Check OS sound settings to ensure the correct input device is selected and not muted.
* On Windows, try the built-in Voice Recorder app to confirm the mic works.

**2. `PyAudio` installation failure**

* Use `pipwin` on Windows: `pip install pipwin && pipwin install pyaudio`.
* Use a prebuilt wheel matching your Python version if `pip` fails.

**3. `playsound` not producing audio**

* On Windows, `playsound` sometimes conflicts with sound drivers. Try other players (e.g., `pydub` with simpleaudio/ffplay) or use OS commands to play audio.

**4. STT returns `UnknownValueError` or `RequestError`**

* `UnknownValueError` means audio wasn't clear enough. Increase ambient noise adjustment time and speak more clearly.
* `RequestError` usually means network/API issues. Check your internet connection and API keys.

**5. Garbled characters in terminal**

* Run `chcp 65001` in Windows cmd before running the script.

**6. Latency / speed**

* Real-time translation has latency due to network calls (STT/translation/TTS). For faster local TTS, consider offline TTS engines, but they may require additional installation.

## Development notes

* Keep audio files in a temporary folder or use Python's `tempfile` to avoid clutter.
* Use `r.adjust_for_ambient_noise(source)` before listening to improve recognition in noisy environments.
* Consider threading: run playback and listening in separate threads if you want overlap or smoother UX — but beware of race conditions.

### Example: ambient noise adjustment snippet

```python
with microphone as source:
    r.adjust_for_ambient_noise(source, duration=1)
    audio = r.listen(source)
```

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes and push
4. Open a Pull Request with a clear description

Please add tests for new features where appropriate.

## License

This project is provided as-is. Add a proper license file if you'd like to open-source it. A common choice is the MIT License. Example `LICENSE` file content can be generated or added separately.

## Contact / Acknowledgements

* Author: Your Name (replace in repo)
* This README was generated with help from ChatGPT. Use it as a starting point — tweak commands and dependencies to match your actual project files.

---

*If you'd like, I can:*

* generate a `requirements.txt` from the packages in your project,
* create a short demo GIF example command,
* or add a proper `LICENSE` file (MIT/Apache/etc.).

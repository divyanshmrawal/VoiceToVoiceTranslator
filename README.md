# VoiceToVoiceTranslator

**Live Voice-to-Voice Translation** — Speak into your microphone, and the program will translate your words into another language and play it back.

---

## Features

* Listen to your voice
* Translate spoken words
* Speak out the translation

## Prerequisites

* Python 3.8+
* Microphone
* Internet connection
* Install required packages:

```bash
pip install SpeechRecognition gTTS playsound pyaudio googletrans==4.0.0-rc1
```

## How to Use

1. Connect your microphone.
2. Run the script:

```bash
python VoiceToVoiceTranslator.py
```

3. Speak clearly.
4. Translation will play back automatically.
5. To stop, press `Ctrl+C` or say your stop word (if configured).

## Settings

Open the script and adjust:

```python
SOURCE_LANG = 'en'      # language you speak
TARGET_LANG = 'hi'      # language to translate
TTS_LANG = 'hi'         # language for audio playback
STOP_WORD = 'zero'      # word to stop the program
```

## Tips

* Make sure the microphone is working.
* If audio isn't clear, speak slowly and adjust noise settings.
* On Windows, run `chcp 65001` if you see weird characters.

---
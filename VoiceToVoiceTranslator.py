# Steps to run this file in Windows cmd :-
# 1. type chcp 65001 in cmd to change the encoding to utf-8 if you see garbled text
# 2. type: [python d:\VoiceToVoiceTranslator\VoiceToVoiceTranslator.py]
# 3. After writing the code, run the above command in cmd to execute this file

#------------------------------------------------------------------------------------------------------------------
# Live microphone audio to text + Translator + Text-to-Speech (Infinite Loop Version)

import speech_recognition as sr
from deep_translator import GoogleTranslator
from gtts import gTTS
import tempfile
import pyglet
import time

r = sr.Recognizer()
m = sr.Microphone()
translated_language='hi'  # Hindi
try:
    print("A moment of silence, please...")
    with m as source:
        r.adjust_for_ambient_noise(source)
    print("Set minimum energy threshold to {}".format(r.energy_threshold))

    while True:
        print("\nSay something! (Press Ctrl + C to stop)")
        with m as source:
            audio = r.listen(source)
        print("Got it! Recognizing...")

        try:
            # Speech to Text
            value = r.recognize_google(audio)
            print("You said:", value)

            # Translate
            translated = GoogleTranslator(source='auto', target=translated_language).translate(value)
            print("Translated:", translated)

            # Text to Speech
            with tempfile.NamedTemporaryFile(delete=True, suffix=".mp3") as fp:
                tts = gTTS(text=translated, lang='hi')
                tts.write_to_fp(fp)
                fp.flush()
                music = pyglet.media.load(fp.name, streaming=False)
                music.play()
                time.sleep(music.duration)  # wait until speech finishes
                pyglet.app.platform_event_loop.dispatch_posted_events()

        except sr.UnknownValueError:
            print("Oops! Didn't catch that.")
        except sr.RequestError as e:
            print("Couldn't request results; {0}".format(e))

except KeyboardInterrupt:
    print("\nProgram stopped by user.")

#------------------------------------------------------------------------------------------------------------------

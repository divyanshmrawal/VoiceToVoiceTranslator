import speech_recognition as sr
from deep_translator import GoogleTranslator
from gtts import gTTS
import tempfile
import os

r = sr.Recognizer()

LANGUAGES = {
    "English":            "en",
    "Hindi":              "hi",
    "Gujarati":           "gu",
    "Spanish":            "es",
    "French":             "fr",
    "German":             "de",
    "Japanese":           "ja",
    "Chinese (Simplified)": "zh-CN",
    "Arabic":             "ar",
    "Portuguese":         "pt",
    "Russian":            "ru",
    "Korean":             "ko",
    "Italian":            "it",
}

def calibrate_microphone():
    try:
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source, duration=1)
        return {"success": True, "threshold": r.energy_threshold}
    except Exception as e:
        return {"success": False, "error": str(e)}

def listen_and_recognize():
    try:
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source, duration=0.5)
            audio = r.listen(source, timeout=10, phrase_time_limit=15)
        text = r.recognize_google(audio)
        return {"success": True, "text": text}
    except sr.WaitTimeoutError:
        return {"success": False, "error": "Listening timed out. No speech detected."}
    except sr.UnknownValueError:
        return {"success": False, "error": "Could not understand audio. Please try again."}
    except sr.RequestError as e:
        return {"success": False, "error": f"Speech recognition error: {e}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def translate_text(text, target_lang="hi"):
    try:
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        return {"success": True, "translated": translated}
    except Exception as e:
        return {"success": False, "error": str(e)}

def speak_translation(text, lang="hi"):
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        tts = gTTS(text=text, lang=lang)
        tts.save(tmp.name)
        tmp.close()
        return {"success": True, "filepath": tmp.name}
    except Exception as e:
        return {"success": False, "error": str(e)}
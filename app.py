from flask import Flask, render_template, request, jsonify, send_file
from translator_core import (
    calibrate_microphone,
    listen_and_recognize,
    translate_text,
    speak_translation,
    LANGUAGES
)
import os

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html", languages=LANGUAGES)

@app.route("/calibrate", methods=["POST"])
def calibrate():
    return jsonify(calibrate_microphone())

@app.route("/start", methods=["POST"])
def start():
    return jsonify(listen_and_recognize())

@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()
    text = data.get("text", "").strip()
    target_lang = data.get("target_lang", "hi")
    if not text:
        return jsonify({"success": False, "error": "No text provided."})
    return jsonify(translate_text(text, target_lang))

@app.route("/speak", methods=["POST"])
def speak():
    data = request.get_json()
    text = data.get("text", "").strip()
    lang = data.get("lang", "hi")
    if not text:
        return jsonify({"success": False, "error": "No text provided."})
    result = speak_translation(text, lang)
    if not result["success"]:
        return jsonify(result)
    filepath = result["filepath"]
    response = send_file(filepath, mimetype="audio/mpeg", as_attachment=False, download_name="translation.mp3")
    @response.call_on_close
    def cleanup():
        try:
            os.remove(filepath)
        except Exception:
            pass
    return response

if __name__ == "__main__":
    app.run(debug=True, port=5000)
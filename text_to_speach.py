from gtts import gTTS
import tempfile
import pyglet

text = "नमस्ते, आप कैसे हैं?"

with tempfile.NamedTemporaryFile(delete=True, suffix=".mp3") as fp:
    tts = gTTS(text=text, lang='hi')
    tts.write_to_fp(fp)
    fp.flush()
    music = pyglet.media.load(fp.name, streaming=False)
    music.play()
    pyglet.app.run()

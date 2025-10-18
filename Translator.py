#1. type chcp 65001 in cmd to change the encoding to utf-8 if you see garbled text

#2. type python d:\VoiceToVoiceTranslator\Translator.py in cmd to change the encoding to utf-8 if you see garbled text

#3. after wriring the code run below command in cmd  to run this file

from deep_translator import GoogleTranslator

translated = GoogleTranslator(source='auto', target='korean').translate("keep it up, you are awesome")
print(translated)

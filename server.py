from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import numpy as np
from scipy.signal import resample
import base64
from model_manager import ModelManager




model_manager = None



app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*":{"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')



@app.route("/http-call")
def http_call():
    """return JSON with string data as the value"""
    data = {'data': 'This text was fetched using an HTTP call to server on render'}
    return jsonify(data)


@socketio.on("connect")
def connected():
    """event listener when client connects to the server"""
    print(request.sid)
    print("client has connected")
    emit("connect", {"data": f"id: {request.sid} is connected"})
    
    

@socketio.on("loadModels")
def load_models():
    global model_manager
    model_manager = ModelManager()
    emit("modelsLoaded")


@socketio.on('audioData')
def handle_audio_data(audio_data):
    try:
        decoded_data = base64.b64decode(audio_data)
        numpy_array = np.frombuffer(decoded_data, dtype=np.int16)

        target_sample_rate = 16000
        initial_sample_rate = 44100

        numpy_array_resampled = resample(numpy_array, int(len(numpy_array) * target_sample_rate / initial_sample_rate))

        transcription = model_manager.transcribe(numpy_array_resampled)

        print(transcription)
        emit("transcription", {'data': transcription}, broadcast=True)

    except Exception as e:
        error_message = f"Error processing audio data: {str(e)}"
        print(error_message)
        emit("audioProcessingError", {'error': error_message}, broadcast=True)


@socketio.on("getAudio")
def send_audio_data(audio_data):
    try:
        decoded_data = base64.b64decode(audio_data)
        numpy_array = np.frombuffer(decoded_data, dtype=np.int16)

        target_sample_rate = 16000
        initial_sample_rate = 44100

        numpy_array_resampled = resample(numpy_array, int(len(numpy_array) * target_sample_rate / initial_sample_rate))

        transcription = model_manager.transcribe(numpy_array_resampled)
        
        print(transcription)
        emit("transcription2", {'data': transcription}, broadcast=True)
        
        base64_string = model_manager.tts(transcription)
        emit("audio", {'data': base64_string}, broadcast=True)

    except Exception as e:
        print(f"Error processing audio data: {str(e)}")


@socketio.on("disconnect")
def disconnected():
    """event listener when client disconnects to the server"""
    print("user disconnected")
    emit("disconnect", f"user {request.sid} disconnected", broadcast=True)



if __name__ == '__main__':
    socketio.run(app, debug=False, port=5001, host='0.0.0.0', log_output=True)

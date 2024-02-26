import base64
import io
import numpy as np
import soundfile as sf
from TTS.utils.synthesizer import Synthesizer
import torch
from transformers import Wav2Vec2CTCTokenizer, Wav2Vec2ForCTC, Wav2Vec2Processor



TOKENIZER_PATH = "wav2vec2-large-xlsr-moroccan-darija/vocab.json"
PRETRAINED_PATH = "wav2vec2-large-xlsr-moroccan-darija"
TTS_CHECKPOINT_PATH = "TTSModel/checkpoint.pth"
TTS_CONFIG_PATH = "TTSModel/config.json"


class ModelManager:
    """Singleton class for managing models."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialize_models()
        return cls._instance


    def _initialize_models(self):
        """Initialize models."""
        self.tokenizer = Wav2Vec2CTCTokenizer(TOKENIZER_PATH, unk_token="[UNK]", pad_token="[PAD]", word_delimiter_token="|")
        self.processor = Wav2Vec2Processor.from_pretrained(PRETRAINED_PATH, tokenizer=self.tokenizer)
        self.model = Wav2Vec2ForCTC.from_pretrained(PRETRAINED_PATH)
        self.synthesizer = Synthesizer(tts_checkpoint=TTS_CHECKPOINT_PATH, tts_config_path=TTS_CONFIG_PATH)
        self._run_on_gpu_if_possible()
        self.warm_up_models()
        


    def _run_on_gpu_if_possible(self):
        """Move models to GPU if available."""
        if torch.cuda.is_available():
            self.model.to("cuda")
            self.synthesizer.to("cuda")


    def tts(self, input_text):
        """Text-to-speech."""
        wav = self.synthesizer.tts(input_text)
        
        buffer = io.BytesIO()
        sf.write(buffer, wav, 22050, format='wav')
        
        buffer.seek(0)
        wav_content = buffer.read()
        
        base64_encoded = base64.b64encode(wav_content)
        base64_string = base64_encoded.decode("utf-8")
       
        return base64_string


    def transcribe(self, input_audio):
        """Speech-to-text."""
        input_values = self.processor(input_audio, return_tensors="pt", padding=True, sampling_rate=16000).input_values
        input_values = input_values.to("cuda") if torch.cuda.is_available() else input_values
        logits = self.model(input_values).logits
        tokens = torch.argmax(logits, axis=-1)
        transcription = self.tokenizer.batch_decode(tokens)
        
        return transcription[0]


    def warm_up_models(self):
        """Warm up models with sample data."""
        try:
            self.transcribe(np.load("warmup_audio.npy"))
            self.tts("السلام")
        except Exception as e:
            print(f"Error during warm-up: {str(e)}")

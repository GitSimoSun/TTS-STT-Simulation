import { useEffect, useState } from 'react';
import './App.css';
import AudioRecorder from './AudioRecorder';
import Transcription from './Transcription';
import { io, Socket } from 'socket.io-client';

interface AudioDataEvent {
    data: string;
}

interface AppProps { }

const App: React.FC<AppProps> = () => {
    const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [audioTranscription, setAudioTranscription] = useState(false)
    const [loadingTime, setLoadingTime] = useState(0)
    const [message, setMessage] = useState<string>("");
    const [correctMessages, setCorrectMessages] = useState<string[]>([]);


    useEffect(() => {
        const socket = io('http://localhost:5001/', {
            transports: ['websocket', 'polling', 'flashsocket'],
            cors: {
                origin: 'http://localhost:5173/',
            },
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocketInstance(socket);

        socket.on('connect', (data) => {
            console.log(data);
            socket.emit("loadModels")
        });

        socket.on("modelsLoaded", () => {
            setModelsLoaded(true)
        })

        socket.on('audio', (data: AudioDataEvent) => {
            try {
                if (audioTranscription) {
                    const base64String = data.data;
                    const binaryData = atob(base64String);
                    const uint8Array = new Uint8Array(binaryData.length);

                    for (let i = 0; i < binaryData.length; i++) {
                        uint8Array[i] = binaryData.charCodeAt(i);
                    }

                    const blob = new Blob([uint8Array], { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(blob);
                    const audio = new Audio(audioUrl);

                    audio.play();
                }
            } catch (error) {
                console.error('Error playing audio:', error);
            }
        });

        socket.on("transcription", (data: { data: string }) => {
            const content = data.data.trim()
            content !== "" && setMessage(content);
        });
        
        socket.on("transcription2", (data: { data: string }) => {
            const content = data.data.trim()
            content !== "" && setCorrectMessages((prevMessages) => [...prevMessages, content]);
            setMessage("")
        });

        socket.on('disconnect', (data) => {
            console.log(data);
        });



        return function cleanup() {
            socket.disconnect();
        };
    }, [audioTranscription]);


    useEffect(
        () => {
            if (!modelsLoaded) {
                const interval = setInterval(
                    () => setLoadingTime(prev => prev + 1), 1000
                )
                return () => clearInterval(interval);
            }
        }, [modelsLoaded, loadingTime])


    return (
        <div className="container">
            {
                socketInstance && (
                    modelsLoaded ?
                        <>
                            <AudioRecorder socket={socketInstance} />
                            <div className='audio-controls'>
                                <button type='button'
                                    onClick={() => setAudioTranscription(v => !v)}
                                >
                                    Turn {audioTranscription ? "off" : "on"} Audio Transcription
                                </button>
                            </div>
                            <Transcription message={message} correctMessages={correctMessages} />
                        </>
                        :
                        <div><p>{"Loading models... " + loadingTime + "s"}</p></div>
                )
            }
        </div>
    );
};

export default App;

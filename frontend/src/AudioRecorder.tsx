import { useRef, useState } from "react";
import RecordRTC from 'recordrtc';



const AudioRecorder = ({ socket }: { socket: any }) => {
	const [permission, setPermission] = useState(false);
	const mediaRecorder = useRef<RecordRTC>();
	const [recordingStatus, setRecordingStatus] = useState("inactive");
	const [stream, setStream] = useState<MediaStream>();
	// const [audio, setAudio] = useState("");

	const getMicrophonePermission = async () => {
		if ("MediaRecorder" in window) {
			try {
				const streamData = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: false,
				});
				setPermission(true);
				setStream(streamData);
			} catch (err) {
				if (typeof err === "string") {
					alert(err.toUpperCase())
				} else if (err instanceof Error) {
					alert(err.message)
				}
			}
		} else {
			alert("The MediaRecorder API is not supported in your browser.");
		}
	};


	const startRecording = async () => {
		if (stream) {
			setRecordingStatus("recording");
			let newChunks: Blob[] = [];
			const media = new RecordRTC(stream, {
				type: "audio",
				recorderType: RecordRTC.StereoAudioRecorder,
				timeSlice: 1000,
				desiredSampRate: 44100,
				numberOfAudioChannels: 1,
				bufferSize: 4096,
				ondataavailable: (blob) => {
					if (typeof blob === "undefined") return;
					if (blob.size === 0) return;
					if (socket) {
						newChunks.push(blob)
						const fileReader = new FileReader();
						const currentBlob = new Blob(newChunks)
						fileReader.readAsDataURL(currentBlob);
						fileReader.onloadend = function () {
							const base64String = fileReader.result;
							if (base64String && typeof (base64String) === "string") {
								// Emit "getAudio" event every two seconds
								if (newChunks.length === 2) {
									socket.emit("getAudio", base64String.split(",")[1]);
									newChunks = [];
								}
								// Emit "audioData" event every second
								else {
									socket.emit("audioData", base64String.split(",")[1]);
								}
							}
						};
					}
				},
			});
	
			mediaRecorder.current = media;
			mediaRecorder.current.startRecording();
		}
	};


	const stopRecording = () => {
		if (mediaRecorder?.current) {
			setRecordingStatus("inactive");

			mediaRecorder.current.stopRecording(
				// () => {
				// 	if (mediaRecorder?.current) {
				// 		let blob = mediaRecorder.current.getBlob();
				// 		const audioUrl = URL.createObjectURL(blob);
				// 		setAudio(audioUrl);
				// 	}
				// }
			);
		}
	};

	return (
		<div className="audio-player">
			<h2>Real Time Speech to Text / Speech</h2>
			<main>
				<div className="audio-controls">
					{!permission ? (
						<button onClick={getMicrophonePermission} type="button">
							Get Microphone
						</button>
					) : null}
					{permission && recordingStatus === "inactive" ? (
						<button onClick={startRecording} type="button">
							Start Recording
						</button>
					) : null}
					{recordingStatus === "recording" ? (
						<button onClick={stopRecording} type="button">
							Stop Recording
						</button>
					) : null}
				</div>
			</main>
		</div>
	);
};
export default AudioRecorder;
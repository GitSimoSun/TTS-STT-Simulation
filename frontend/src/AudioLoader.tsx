import { useEffect, useState } from 'react'







const AudioLoader = ({socket} : {socket: any}) => {

    const [audio, setAudio] = useState("");

    const handleClick = () => {
        if (socket) {
            socket.emit("audioDataS")
        }
    }

    useEffect(
        () => {
            socket && socket.on("audio", (data) => {
                console.log("hi")
                const base64String = data.data
                // Decode the base64 string to binary data
                const binaryData = atob(base64String);

                // Create a Uint8Array from the binary data
                const uint8Array = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    uint8Array[i] = binaryData.charCodeAt(i);
                }

                // Create a Blob from the Uint8Array
                
               const blob = new Blob([uint8Array], { type: 'audio/wav' })
               const audioUrl = URL.createObjectURL(blob);
               const audio2 = new Audio(audioUrl)
               audio2.play();
               setAudio(audioUrl);
        })} , [socket])

    return (
        <div>
            <div>TEST</div>
            {
                socket && <p onClick={handleClick}>HI</p>
            }
            {audio && (
                <div>
                    <audio src={audio} controls></audio>
                    <a download href={audio}>
                        Download Recording
                    </a>
                </div>
            )}
        </div>
    )
}

export default AudioLoader
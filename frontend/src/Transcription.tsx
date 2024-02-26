import React from 'react';

interface TranscriptionProps {
    message: string;
    correctMessages: string[];
}

const Transcription: React.FC<TranscriptionProps> = ({ message, correctMessages }) => {


    const transcriptionStyle: React.CSSProperties = {
        border: "1px solid white",
        padding: "10px",
        textAlign: "right",
        fontFamily: "Arial, sans-serif",
        maxWidth: 400,
    };

    return (
        <div style={transcriptionStyle}>
            <p>{correctMessages.join(" ")}<span style={{color: '#CCC'}}>{message}</span></p>
        </div>
    );
};

export default Transcription;

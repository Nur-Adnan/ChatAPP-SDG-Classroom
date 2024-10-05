import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Connect to the server
const socket = io('http://localhost:3000');

function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(socket.connected);
    const bottomRef = useRef(null);

    useEffect(() => {
        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('prompt_response', (message) => {
            setMessages(msgs => [...msgs, { text: message, sender: 'bot' }]);
        });

        socket.on('error', (errorMessage) => {
            console.error("Socket error:", errorMessage);
            setMessages(msgs => [...msgs, { text: errorMessage, sender: 'bot' }]);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('prompt_response');
            socket.off('error');
        };
    }, []);

    const sendMessage = () => {
        if (!input.trim()) return;
        setMessages(msgs => [...msgs, { text: input, sender: 'user' }]);
        socket.emit('send_prompt', input);
        setInput('');
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white shadow rounded-lg max-w-md w-full">
                <div className="border-b p-3">
                    <h3 className="font-semibold text-lg">Chat with SDG Classroom</h3>
                </div>
                <div className="p-3 h-96 overflow-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`my-2 p-2 rounded-lg text-white text-sm ${msg.sender === 'user' ? 'bg-blue-500 ml-auto' : 'bg-green-500 mr-auto'}`}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={bottomRef}></div>
                </div>
                <div className="border-t p-3 flex">
                    <input
                        type="text"
                        className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        disabled={!isConnected}
                    />
                    <button
                        className={`ml-2 bg-blue-500 hover:bg-blue-700 text-white p-2 rounded-r-lg transition duration-300 ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={sendMessage}
                        disabled={!isConnected}
                    >
                        Send
                    </button>
                </div>
            </div>
            {!isConnected && (
                <div className="text-red-500 mt-4">Disconnected from server, trying to reconnect...</div>
            )}
        </div>
    );
}

export default Chat;

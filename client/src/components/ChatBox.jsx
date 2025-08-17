import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FiSend, FiMoon, FiSun, FiUser, FiCpu,
  FiTrash2, FiChevronDown, FiCopy,
  FiMessageCircle 
} from "react-icons/fi";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize user and load conversation history
  useEffect(() => {
    const storedUserId = localStorage.getItem('chatUserId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchConversationHistory(storedUserId);
    } else {
      const newUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatUserId', newUserId);
      setUserId(newUserId);
      setMessages([
        {
          text: "Hello! I'm your AI assistant. How can I help you today?",
          isUser: false,
          timestamp: new Date().toISOString(),
          id: Date.now().toString()
        }
      ]);
      setIsLoadingHistory(false);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user has scrolled up
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setHasNewMessages(scrollTop + clientHeight < scrollHeight - 200);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const fetchConversationHistory = async (userId) => {
    try {
      setIsLoadingHistory(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/history`,
        { params: { userId } }
      );
      
      if (response.data.length > 0) {
        setMessages(response.data);
      } else {
        setMessages([
          {
            text: "Hello! I'm your AI assistant. How can I help you today?",
            isUser: false,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setMessages([
        {
          text: "Hello! I'm your AI assistant. How can I help you today?",
          isUser: false,
          timestamp: new Date().toISOString(),
          id: Date.now().toString()
        }
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { 
      text: inputMessage, 
      isUser: true,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat`,
        { message: inputMessage, userId }
      );

      const botMessage = { 
        text: response.data.reply, 
        isUser: false,
        timestamp: new Date().toISOString(),
        id: response.data.id + '_bot'
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        text: "Sorry, I couldn't process your request. Please try again later.",
        isUser: false,
        timestamp: new Date().toISOString(),
        id: Date.now().toString() + '-error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/chat/history`, {
        data: { userId }
      });
      setMessages([
        {
          text: "Hello! I'm your AI assistant. How can I help you today?",
          isUser: false,
          timestamp: new Date().toISOString(),
          id: Date.now().toString()
        }
      ]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex flex-col ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] min-h-[600px] max-h-[800px] overflow-hidden transition-colors duration-300`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-indigo-600 text-white'} rounded-t-xl sticky top-0 z-10`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500">
            <FiMessageCircle className="text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Assistant</h1>
            <p className="text-xs opacity-80 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Online now
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={clearConversation}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-500'} transition-colors`}
            title="Clear conversation"
          >
            <FiTrash2 />
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-500'} transition-colors`}
            title="Toggle theme"
          >
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative"
      >
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${msg.isUser ? 'ml-3 bg-indigo-500' : 'mr-3 bg-emerald-500'} text-white`}>
                    {msg.isUser ? <FiUser className="text-lg" /> : <FiCpu className="text-lg" />}
                  </div>
                  <div className="group relative">
                    <div className={`p-4 rounded-xl ${msg.isUser 
                      ? (isDarkMode ? 'bg-indigo-700' : 'bg-indigo-100') 
                      : (isDarkMode ? 'bg-gray-800' : 'bg-gray-200')}`}>
                      <p className="whitespace-pre-wrap text-base">{msg.text}</p>
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-right`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                    {!msg.isUser && (
                      <div className="absolute top-0 right-0 mt-1 mr-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(msg.text)}
                          className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                          title="Copy"
                        >
                          <FiCopy size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[90%] md:max-w-[85%]">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-emerald-500 text-white">
                    <FiCpu className="text-lg" />
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {hasNewMessages && (
          <button 
            onClick={scrollToBottom}
            className="sticky bottom-4 left-1/2 transform -translate-x-1/2 p-2 bg-indigo-500 text-white rounded-full shadow-lg animate-bounce hover:bg-indigo-600 transition-colors"
          >
            <FiChevronDown size={24} />
          </button>
        )}
      </div>

      {/* Input */}
      <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            rows={Math.min(4, Math.max(1, inputMessage.split('\n').length))}
            className={`flex-1 p-3 text-base rounded-xl resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-indigo-500' : 'focus:ring-indigo-300'}`}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3 rounded-xl self-end ${(!inputMessage.trim() || isLoading) 
              ? (isDarkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500') 
              : (isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white')} transition-colors flex items-center justify-center`}
          >
            <FiSend className="text-xl" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI assistant may produce inaccurate information
        </p>
      </div>
    </div>
  );
};

export default ChatBox;
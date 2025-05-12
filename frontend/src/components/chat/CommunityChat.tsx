import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/config';
import { Send, ThumbsUp, MessageCircle, Share2, Flag } from 'lucide-react';
import * as dateFns from 'date-fns';

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: Date;
  likes?: number;
  userAvatar?: string;
}

interface CommunityChatProps {
  chatId: string;
  title: string;
  description?: string;
}

const CommunityChat: React.FC<CommunityChatProps> = ({ chatId, title, description }) => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const chatRef = collection(db, chatId);
    const q = query(chatRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as ChatMessage[];
      setMessages(newMessages.reverse());
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const chatRef = collection(db, chatId);
      await addDoc(chatRef, {
        userId: user.uid,
        displayName: user.displayName || 'Anonymous',
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        userAvatar: user.photoURL || null,
        likes: 0
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleLike = async (messageId: string) => {
    if (!user) return;
    // Implement like functionality
  };

  const handleShare = async (messageId: string) => {
    // Implement share functionality
  };

  const handleReport = async (messageId: string) => {
    if (!user) return;
    // Implement report functionality
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-green-100">{description}</p>}
      </div>

      {/* Messages Container */}
      <div className="h-[500px] overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.userId === user?.uid
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center mb-2">
                  {message.userAvatar && (
                    <img
                      src={message.userAvatar}
                      alt={message.displayName}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  )}
                  <span className="font-semibold text-sm">{message.displayName}</span>
                  <span className="text-xs opacity-75 ml-2">
                    {dateFns.formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <button
                    onClick={() => handleLike(message.id)}
                    className="text-xs flex items-center hover:opacity-75"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {message.likes || 0}
                  </button>
                  <button
                    onClick={() => handleShare(message.id)}
                    className="text-xs flex items-center hover:opacity-75"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </button>
                  <button
                    onClick={() => handleReport(message.id)}
                    className="text-xs flex items-center hover:opacity-75"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    Report
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityChat; 
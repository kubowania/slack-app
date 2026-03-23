"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface User {
  id: number;
  username: string;
  avatar_color: string;
}

interface Channel {
  id: number;
  name: string;
  description: string;
}

interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_color: string;
  created_at: string;
}

export default function SlackClone() {
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users and channels on mount
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        if (data.length > 0) setCurrentUser(data[0]);
      });
    fetch("/api/channels")
      .then((r) => r.json())
      .then((data) => {
        setChannels(data);
        if (data.length > 0) setActiveChannel(data[0]);
      });
  }, []);

  // Fetch messages when active channel changes
  const fetchMessages = useCallback(() => {
    if (!activeChannel) return;
    fetch(`/api/channels/${activeChannel.id}/messages`)
      .then((r) => r.json())
      .then(setMessages);
  }, [activeChannel]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!activeChannel) return;
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChannel, fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !currentUser) return;

    await fetch(`/api/channels/${activeChannel.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, content: newMessage }),
    });
    setNewMessage("");
    fetchMessages();
  };

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !currentUser) return;

    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newChannelName,
        created_by: currentUser.id,
      }),
    });
    const channel = await res.json();
    setChannels((prev) => [...prev, channel]);
    setActiveChannel(channel);
    setNewChannelName("");
    setShowNewChannel(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#3F0E40] text-white flex flex-col">
        <div className="p-4 border-b border-[#522653]">
          <h1 className="text-lg font-bold">Slack Clone</h1>
          {/* User switcher */}
          <select
            className="mt-2 w-full bg-[#522653] text-white text-sm rounded px-2 py-1 border-none outline-none"
            value={currentUser?.id || ""}
            onChange={(e) => {
              const user = users.find((u) => u.id === Number(e.target.value));
              if (user) setCurrentUser(user);
            }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-gray-300">
              Channels
            </span>
            <button
              onClick={() => setShowNewChannel(!showNewChannel)}
              className="text-gray-300 hover:text-white text-lg leading-none"
            >
              +
            </button>
          </div>

          {showNewChannel && (
            <form onSubmit={createChannel} className="mb-2">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="w-full bg-[#522653] text-white text-sm rounded px-2 py-1 placeholder-gray-400 outline-none"
                autoFocus
              />
            </form>
          )}

          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              className={`w-full text-left px-2 py-1 rounded text-sm mb-0.5 ${
                activeChannel?.id === ch.id
                  ? "bg-[#1164A3] text-white"
                  : "text-gray-300 hover:bg-[#522653]"
              }`}
            >
              # {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Channel header */}
        {activeChannel && (
          <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              # {activeChannel.name}
            </h2>
            {activeChannel.description && (
              <span className="text-sm text-gray-500">
                | {activeChannel.description}
              </span>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: msg.avatar_color }}
              >
                {msg.username[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-gray-900 text-sm">
                    {msg.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        {activeChannel && (
          <div className="px-6 py-4 border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${activeChannel.name}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-[#1164A3] focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-[#007A5A] text-white rounded-lg text-sm font-medium hover:bg-[#006849] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

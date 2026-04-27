'use client';

import ChatRoom from '@/components/ChatRoom';

export default function ChatPage() {
  return (
    <main
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#000',
      }}
    >
      <ChatRoom />
    </main>
  );
}
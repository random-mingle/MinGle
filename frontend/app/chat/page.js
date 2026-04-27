'use client';

import { Suspense } from 'react';
import ChatRoom from '../../components/ChatRoom';

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#f5f0ff',
        fontFamily: 'Nunito, sans-serif', color: '#7c3aed', fontSize: 18, fontWeight: 700
      }}>
        Loading Mingle...
      </div>
    }>
      <ChatRoom />
    </Suspense>
  );
}

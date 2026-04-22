import dynamic from 'next/dynamic';

const ChatRoom = dynamic(() => import('../../components/ChatRoom'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 48,
          filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.6))',
        }}
      >
        ♛
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(212,175,55,0.2)',
          borderTopColor: '#D4AF37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  ),
});

export const metadata = {
  title: 'Chat — Mingle',
};

export default function ChatPage() {
  return <ChatRoom />;
}

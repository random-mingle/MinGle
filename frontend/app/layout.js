import './globals.css';

export const metadata = {
  title: 'Mingle – Chat with Strangers',
  description:
    'Meet new people instantly. Free random video & text chat with strangers worldwide.',
  keywords: 'random chat, video chat, strangers, mingle, omegle alternative',
  openGraph: {
    title: 'Mingle – Chat with Strangers',
    description: 'Meet new people instantly.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

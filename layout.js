import './globals.css';

export const metadata = {
  title: 'Mingle – Chat with Strangers',
  description: 'Meet new people instantly.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


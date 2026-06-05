import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Credit Card Tracker',
  description: 'Track your credit cards, SUBs, and rewards',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="animate-fade-in">
        <Navbar />
        <div className="layout-container">
          {children}
        </div>
      </body>
    </html>
  );
}

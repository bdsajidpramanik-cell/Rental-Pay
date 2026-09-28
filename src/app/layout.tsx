import './globals.css';
import { ReactNode } from 'react';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Rental Pay - Property Management System',
  description: 'Multi-tenant property and shop management platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

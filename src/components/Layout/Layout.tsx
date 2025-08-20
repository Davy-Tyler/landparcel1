import React, { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
};
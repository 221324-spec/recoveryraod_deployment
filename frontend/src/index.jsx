import React from 'react';
import { createRoot } from 'react-dom/client';
import process from 'process';
import { Buffer } from 'buffer';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

if (!globalThis.process) globalThis.process = process;
if (!globalThis.Buffer) globalThis.Buffer = Buffer;

const container = document.getElementById('root');
if (!container) {
  document.body.innerHTML = '<h1 style="color: red;">Root element not found.</h1>';
} else {
  createRoot(container).render(
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

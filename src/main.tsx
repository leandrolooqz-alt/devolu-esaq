import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Coluna: root
// Título: Inicialização da aplicação
// Fazer: Montar o React no elemento principal da página.
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

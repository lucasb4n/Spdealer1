
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
// Ordem correta dos estilos do AG Grid: base antes do tema (ver ag-grid-order.css)
import './ag-grid-order.css';
// Registramos os módulos necessários do AG Grid (apenas AllCommunity)
import './index.css';
import './assets/form.css';
import './assets/custom.css';
import './assets/Saturno.css';
import Router from './Router';
import reportWebVitals from './reportWebVitals';
import devLogger from 'utils/devLogger';

// Registro dos módulos do AG Grid (v34+)
ModuleRegistry.registerModules([AllCommunityModule]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Em DEV, StrictMode pode causar double-invoke que afeta DnD; desabilitar temporariamente para teste
root.render(
  <Router />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Inicializa dev logger em modo de desenvolvimento apenas
try {
  devLogger.init();
} catch (e) {
  // ignore
}














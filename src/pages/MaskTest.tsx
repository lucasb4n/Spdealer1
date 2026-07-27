/**
 * MaskTest.tsx
 * 
 * Componente de teste para validar máscaras
 * DELETAR após testes
 */

import React, { useState } from 'react';
import {
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskPhone,
  applyMask,
  isValidCEP,
  isValidCNPJ,
  isValidCPF,
  isValidPhone,
} from 'utils/maskUtils';

const MaskTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTests = () => {
    const results: string[] = [];

    // Teste CEP
    results.push('=== CEP ===');
    results.push(`Input: "01310100" → Output: "${maskCEP('01310100')}"`);
    results.push(`Valid: ${isValidCEP('01310-100')}`);
    results.push('');

    // Teste CNPJ
    results.push('=== CNPJ ===');
    results.push(`Input: "12345678000195" → Output: "${maskCNPJ('12345678000195')}"`);
    results.push(`Valid: ${isValidCNPJ('12.345.678/0001-95')}`);
    results.push('');

    // Teste CPF
    results.push('=== CPF ===');
    results.push(`Input: "12345678909" → Output: "${maskCPF('12345678909')}"`);
    results.push(`Valid: ${isValidCPF('123.456.789-09')}`);
    results.push('');

    // Teste Telefone
    results.push('=== TELEFONE ===');
    results.push(`Input: "11987654321" (celular) → Output: "${maskPhone('11987654321')}"`);
    results.push(`Input: "1134567890" (fixo) → Output: "${maskPhone('1134567890')}"`);
    results.push(`Valid celular: ${isValidPhone('11987654321')}`);
    results.push(`Valid fixo: ${isValidPhone('1134567890')}`);
    results.push('');

    // Teste Auto-detecção
    results.push('=== AUTO-DETECÇÃO ===');
    results.push(`Field: "CEP_GER" → "${applyMask('CEP_GER', '01310100')}"`);
    results.push(`Field: "CGC_GER" → "${applyMask('CGC_GER', '12345678000195')}"`);
    results.push(`Field: "FONE_GER" → "${applyMask('FONE_GER', '11987654321')}"`);
    results.push(`Field: "FAX_GER" → "${applyMask('FAX_GER', '1134567890')}"`);

    setTestResults(results);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      <h2>Teste de Máscaras</h2>
      <button onClick={runTests}>Executar Testes</button>
      <div style={{ marginTop: '20px', background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        {testResults.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    </div>
  );
};

export default MaskTest;














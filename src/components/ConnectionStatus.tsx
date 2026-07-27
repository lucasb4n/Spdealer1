import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Status {
  db: boolean;
  dbUrl?: string;
  backend: boolean;
  backendVersion?: string;
}

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await axios.get('/api/status');
        setStatus(resp.data);
      } catch (err) {
        setError('Não foi possível obter status do backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) return <span className="text-secondary">Verificando conexão...</span>;
  if (error) return <span className="text-danger">{error}</span>;
  if (!status) return null;

  return (
    <div className="mb-2 small">
      <span className={status.backend ? 'text-success' : 'text-danger'}>
        Backend: {status.backend ? 'Online' : 'Offline'}
        {status.backendVersion && ` (v${status.backendVersion})`}
      </span>
      <br />
      <span className={status.db ? 'text-success' : 'text-danger'}>
        Banco de Dados: {status.db ? 'Conectado' : 'Desconectado'}
        {status.dbUrl && ` (${status.dbUrl})`}
      </span>
    </div>
  );
};

export default ConnectionStatus;














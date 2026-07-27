import axios from 'axios';

export interface CpfConsultaResult {
  [key: string]: any;
}

const BASE = process.env.REACT_APP_API_URL || '/api';

const CpfService = {
  async consultarCpf(cpf: string): Promise<CpfConsultaResult | null> {
    try {
      const resp = await axios.post(`${BASE}/internal/consulta-cpf`, { cpf });
      return resp.data;
    } catch (err) {
      console.error('Erro ao consultar CPF (proxy):', err);
      throw err;
    }
  }
};

export default CpfService;














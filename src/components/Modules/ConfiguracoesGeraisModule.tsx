// src/components/Modules/ConfiguracoesGeraisModule.tsx
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding, 
  faCogs, 
  faPlug, 
  faSave, 
  faSpinner, 
  faCheckCircle,
  faExclamationTriangle,
  faUpload
} from '@fortawesome/free-solid-svg-icons';
import { ParametrosService, ParametroGeral } from 'services/ParametrosService';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, parsePermissions } from 'utils/permissionUtils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
`;

const Header = styled.div`
  padding: 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 16px 20px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$active ? '#3b82f6' : '#64748b'};
  border-bottom: 2px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: #3b82f6;
    background: #f1f5f9;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  ${props => props.$fullWidth && 'grid-column: 1 / -1;'}
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const SaveButton = styled.button`
  background: #3b82f6;
  color: white;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusMsg = styled.div<{ $type: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  background: ${props => props.$type === 'success' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.$type === 'success' ? '#166534' : '#991b1b'};
  border: 1px solid ${props => props.$type === 'success' ? '#bbf7d0' : '#fecaca'};
`;

const ConfiguracoesGeraisModule: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const userPerms = useMemo(() => parsePermissions(user?.permissions), [user?.permissions]);
  
  // Assumindo ID de rotina para Parâmetros Gerais (Pick 3451 for now)
  const podeEditar = isAdmin || hasPermission(userPerms, 3451, 'editar');

  const [activeTab, setActiveTab] = useState<'EMPRESA' | 'SISTEMA' | 'INTEGRACOES'>('EMPRESA');
  const [parametros, setParametros] = useState<ParametroGeral[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    loadParametros();
  }, []);

  const loadParametros = async () => {
    setLoading(true);
    try {
      const data = await ParametrosService.listar();
      setParametros(data);
      const values: Record<string, string> = {};
      data.forEach(p => values[p.chave] = p.valor);
      setFormValues(values);
    } catch (err) {
      console.error('Erro ao carregar parâmetros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (chave: string, value: string) => {
    setFormValues(prev => ({ ...prev, [chave]: value }));
  };

  const handleSave = async () => {
    if (!podeEditar) return;
    setSaving(true);
    setStatus(null);
    try {
      // Diferenciar quais foram alterados ou enviar todos do grupo atual
      const batch = Object.entries(formValues).map(([chave, valor]) => {
        const original = parametros.find(p => p.chave === chave);
        return {
          chave,
          valor,
          grupo: original?.grupo || activeTab,
          descricao: original?.descricao || ''
        };
      }).filter(p => p.grupo === activeTab);

      await ParametrosService.salvarLote(batch);
      setStatus({ type: 'success', msg: 'Configurações salvas com sucesso!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (chave: string, label: string, type: 'text' | 'textarea' | 'password' = 'text', fullWidth = false) => (
    <FormGroup $fullWidth={fullWidth}>
      <Label>{label}</Label>
      {type === 'textarea' ? (
        <Textarea 
          value={formValues[chave] || ''} 
          onChange={e => handleInputChange(chave, e.target.value)}
          disabled={!podeEditar}
        />
      ) : (
        <Input 
          type={type}
          value={formValues[chave] || ''} 
          onChange={e => handleInputChange(chave, e.target.value)}
          disabled={!podeEditar}
        />
      )}
    </FormGroup>
  );

  if (loading) return <Container><div style={{padding: 40, textAlign: 'center'}}><FontAwesomeIcon icon={faSpinner} spin /> Carregando configurações...</div></Container>;

  return (
    <Container>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faBuilding} style={{color: '#3b82f6'}} />
          Configurações Gerais do Sistema
        </Title>
        {podeEditar && (
          <SaveButton onClick={handleSave} disabled={saving}>
            <FontAwesomeIcon icon={saving ? faSpinner : faSave} spin={saving} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </SaveButton>
        )}
      </Header>

      <TabsContainer>
        <Tab $active={activeTab === 'EMPRESA'} onClick={() => setActiveTab('EMPRESA')}>
          <FontAwesomeIcon icon={faBuilding} /> Empresa
        </Tab>
        <Tab $active={activeTab === 'SISTEMA'} onClick={() => setActiveTab('SISTEMA')}>
          <FontAwesomeIcon icon={faCogs} /> Sistema
        </Tab>
        <Tab $active={activeTab === 'INTEGRACOES'} onClick={() => setActiveTab('INTEGRACOES')}>
          <FontAwesomeIcon icon={faPlug} /> Integrações
        </Tab>
      </TabsContainer>

      <Content>
        {status && <StatusMsg $type={status.type}><FontAwesomeIcon icon={status.type === 'success' ? faCheckCircle : faExclamationTriangle} /> {status.msg}</StatusMsg>}
        
        <Card>
          {activeTab === 'EMPRESA' && (
            <>
              <h3 style={{marginTop: 0, marginBottom: 20}}>Dados da Empresa</h3>
              <FieldGrid>
                {renderField('empresa.nome', 'Razão Social', 'text', true)}
                {renderField('empresa.nome_fantasia', 'Nome Fantasia')}
                {renderField('empresa.cnpj', 'CNPJ')}
                {renderField('empresa.endereco', 'Endereço Completo', 'text', true)}
                {renderField('empresa.contato', 'E-mail de Contato')}
                {renderField('empresa.telefone', 'Telefone Comercial')}
              </FieldGrid>
            </>
          )}

          {activeTab === 'SISTEMA' && (
            <>
              <h3 style={{marginTop: 0, marginBottom: 20}}>Preferências do Sistema</h3>
              <FieldGrid>
                {renderField('sistema.timeout', 'Sessão Timeout (minutos)')}
                {renderField('sistema.tema', 'Cor Primária (Hex)')}
                {renderField('sistema.versao', 'Versão do Sistema (Read Only)')}
                {renderField('sistema.footer_text', 'Texto Rodapé', 'textarea', true)}
              </FieldGrid>
            </>
          )}

          {activeTab === 'INTEGRACOES' && (
            <>
              <h3 style={{marginTop: 0, marginBottom: 20}}>Chaves e APIs</h3>
              <FieldGrid>
                {renderField('integra.whatsapp_key', 'WhatsApp API Key', 'password')}
                {renderField('integra.nfe_url', 'URL Emissor NFe')}
                {renderField('integra.pagamento_token', 'Token Gateway Pagamentos', 'password', true)}
                {renderField('integra.email_servidor', 'Servidor SMTP')}
                {renderField('integra.email_porta', 'Porta SMTP')}
              </FieldGrid>
            </>
          )}
          
          {!podeEditar && (
            <div style={{marginTop: 20, fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6}}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Você não tem permissão para alterar as configurações globais.
            </div>
          )}
        </Card>
      </Content>
    </Container>
  );
};

export default ConfiguracoesGeraisModule;














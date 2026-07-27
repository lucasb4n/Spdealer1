import React, { useState } from 'react';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { PrimaryButton, SecondaryButton } from '../Button/Button';
import { LookupInput } from '../LookupInput/LookupInput';


// Dados simulados para Lookup
const mockLookupData = [
  { id: 1, nome: 'Cliente A', documento: '123.456.789-00' },
  { id: 2, nome: 'Cliente B', documento: '987.654.321-00' },
  { id: 3, nome: 'Cliente C', documento: '111.222.333-44' },
  { id: 4, nome: 'Cliente D', documento: '555.666.777-88' },
  { id: 5, nome: 'Cliente E', documento: '999.888.777-66' },
];
const lookupColumns: { key: 'id' | 'nome' | 'documento'; header: string }[] = [
  { key: 'id', header: 'ID' },
  { key: 'nome', header: 'Nome' },
  { key: 'documento', header: 'Documento' },
];

export const ItemForm: React.FC = () => {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [cliente, setCliente] = useState('');

  // Simula seleção do cliente
  const handleSelectCliente = (item: typeof mockLookupData[0]) => {
    setCliente(item.nome);
  };

  const handleClearCliente = () => {
    setCliente('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simula envio dos dados
    alert(`Dados enviados:\nNome: ${nome}\nTipo: ${tipo}\nAtivo: ${ativo}\nCliente: ${cliente}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto', background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: 32 }}>
      <h2 style={{ color: '#3f51b5', marginBottom: 24 }}>Cadastro de Item</h2>
      <Input
        label="Nome do Item"
        value={nome}
        onChange={e => setNome(e.target.value)}
        placeholder="Digite o nome"
        required
      />
      <Select
        label="Tipo"
        options={[{ value: '', label: 'Selecione' }, { value: 'produto', label: 'Produto' }, { value: 'servico', label: 'Serviço' }]}
        value={tipo}
        onChange={e => setTipo(e.target.value)}
        required
      />
      <Switch
        label="Ativo?"
        checked={ativo}
        onChange={e => setAtivo(e.target.checked)}
      />
      <LookupInput
        label="Cliente"
        value={cliente}
        onValueChange={setCliente}
        onSelect={handleSelectCliente}
        onClear={handleClearCliente}
        modalTitle="Buscar Cliente"
        searchPlaceholder="Digite o nome ou documento..."
        lookupData={mockLookupData}
        lookupColumns={lookupColumns}
      />
      <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
        <PrimaryButton type="submit">Salvar</PrimaryButton>
        <SecondaryButton type="button" onClick={() => alert('Cancelado')}>Cancelar</SecondaryButton>
      </div>
    </form>
  );
};














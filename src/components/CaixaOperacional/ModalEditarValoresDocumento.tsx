/**
 * ModalEditarValoresDocumento.tsx
 * 
 * Modal para editar valores adicionais (multa, juros, desconto, acréscimo)
 * de um documento RECEBER ou PAGAR antes de baixá-lo.
 * 
 * Uso:
 * <ModalEditarValoresDocumento
 *   isOpen={true}
 *   tipo="RECEBER"
 *   documento={documentoReceber}
 *   onConfirm={(valores) => {...}}
 *   onCancel={() => {...}}
 * />
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Row, Col } from 'react-bootstrap';
import './ModalEditarValoresDocumento.css';

interface DocumentoEditavel {
  codigo_rec?: number;
  codigo_pag?: number;
  numdup_rec?: string;
  numdup_pag?: string;
  vlrdup_rec?: number;
  vlrdup_pag?: number;
  vlrmult_rec?: number;
  vlrmult_pag?: number;
  vlracre_rec?: number;
  vlracre_pag?: number;
  vlrdesc_rec?: number;
  vlrdesc_pag?: number;
  parcela_rec?: string;
  parcela_pag?: string;
  dtvenci_rec?: string;
  dtvenci_pag?: string;
}

interface ValoresEditados {
  vlrmult: number;
  vlracre: number;
  vlrdesc: number;
  vlrtot: number;
}

interface ModalEditarValoresDocumentoProps {
  isOpen: boolean;
  tipo: 'RECEBER' | 'PAGAR';
  documento: DocumentoEditavel;
  onConfirm: (valores: ValoresEditados) => void;
  onCancel: () => void;
}

const ModalEditarValoresDocumento: React.FC<ModalEditarValoresDocumentoProps> = ({
  isOpen,
  tipo,
  documento,
  onConfirm,
  onCancel
}) => {
  // Estado
  const [vlrMult, setVlrMult] = useState<number>(0);
  const [vlrAcre, setVlrAcre] = useState<number>(0);
  const [vlrDesc, setVlrDesc] = useState<number>(0);
  const [vlrTot, setVlrTot] = useState<number>(0);
  const [erro, setErro] = useState<string>('');

  // Extrair valores base do documento
  const vlrBase = tipo === 'RECEBER' 
    ? (documento.vlrdup_rec || 0)
    : (documento.vlrdup_pag || 0);

  const numDoc = tipo === 'RECEBER'
    ? documento.numdup_rec
    : documento.numdup_pag;

  const parcela = tipo === 'RECEBER'
    ? documento.parcela_rec
    : documento.parcela_pag;

  const vencimento = tipo === 'RECEBER'
    ? documento.dtvenci_rec
    : documento.dtvenci_pag;

  // Inicializar com valores atuais do documento
  useEffect(() => {
    if (isOpen) {
      const mult = tipo === 'RECEBER'
        ? (documento.vlrmult_rec || 0)
        : (documento.vlrmult_pag || 0);
      
      const acre = tipo === 'RECEBER'
        ? (documento.vlracre_rec || 0)
        : (documento.vlracre_pag || 0);
      
      const desc = tipo === 'RECEBER'
        ? (documento.vlrdesc_rec || 0)
        : (documento.vlrdesc_pag || 0);

      setVlrMult(mult);
      setVlrAcre(acre);
      setVlrDesc(desc);
      setErro('');
      
      // Calcular total
      const total = vlrBase + mult + acre - desc;
      setVlrTot(total);
    }
  }, [isOpen, documento, tipo, vlrBase]);

  // Recalcular total quando valores mudam
  useEffect(() => {
    const total = vlrBase + vlrMult + vlrAcre - vlrDesc;
    setVlrTot(total);
  }, [vlrMult, vlrAcre, vlrDesc, vlrBase]);

  // Validar e confirmar
  const handleConfirmar = () => {
    // Validações
    if (vlrMult < 0 || vlrAcre < 0 || vlrDesc < 0) {
      setErro('❌ Valores não podem ser negativos');
      return;
    }

    if (vlrTot < 0) {
      setErro('❌ Desconto não pode ser maior que o valor + acréscimos');
      return;
    }

    // Aceitar apenas 2 casas decimais
    if (!Number.isFinite(vlrMult) || !Number.isFinite(vlrAcre) || !Number.isFinite(vlrDesc)) {
      setErro('❌ Valores inválidos');
      return;
    }

    onConfirm({
      vlrmult: parseFloat(vlrMult.toFixed(2)),
      vlracre: parseFloat(vlrAcre.toFixed(2)),
      vlrdesc: parseFloat(vlrDesc.toFixed(2)),
      vlrtot: parseFloat(vlrTot.toFixed(2))
    });
  };

  // Formatar moeda para exibição
  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatar data para exibição
  const formatarData = (data?: string): string => {
    if (!data) return '';
    if (data.includes('/')) return data; // Já formatada
    if (data.includes('-')) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return data;
  };

  // Parse de entrada de moeda
  const handleInputMoeda = (valor: string): number => {
    const limpo = valor.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
    return parseFloat(limpo) || 0;
  };

  return (
    <Modal show={isOpen} onHide={onCancel} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          💵 Ajustar Valores - {tipo === 'RECEBER' ? 'RECEBER' : 'PAGAR'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Info do Documento */}
        <Card className="mb-4 bg-light border-0">
          <Card.Body className="py-3">
            <Row className="g-3">
              <Col xs={12} md={6}>
                <small className="text-muted d-block">Número do Documento</small>
                <strong>{numDoc}</strong>
              </Col>
              <Col xs={12} md={3}>
                <small className="text-muted d-block">Parcela</small>
                <strong>{parcela || '-'}</strong>
              </Col>
              <Col xs={12} md={3}>
                <small className="text-muted d-block">Vencimento</small>
                <strong>{formatarData(vencimento)}</strong>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Erro */}
        {erro && (
          <div className="alert alert-danger mb-4 small">
            {erro}
          </div>
        )}

        {/* Formulário */}
        <Form>
          {/* Valor Base */}
          <Form.Group className="mb-4 p-3 bg-secondary bg-opacity-10 rounded">
            <Form.Label className="fw-bold mb-2">📌 Valor Base do Documento</Form.Label>
            <div className="display-6 text-primary">{formatarMoeda(vlrBase)}</div>
            <small className="text-muted">Este valor não pode ser alterado. Use os campos abaixo para ajustes.</small>
          </Form.Group>

          {/* Multa */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              🚨 Multa (Atraso/Penalidade)
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text">R$</span>
              <Form.Control
                type="text"
                placeholder="0,00"
                value={vlrMult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                onChange={(e) => setVlrMult(handleInputMoeda(e.target.value))}
                className="text-end"
              />
            </div>
            <Form.Text className="d-block mt-2">
              Exemplo: 10,00 (dez reais de multa por atraso)
            </Form.Text>
          </Form.Group>

          {/* Acréscimo/Juros */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              💰 Acréscimo / Juros (Mora)
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text">R$</span>
              <Form.Control
                type="text"
                placeholder="0,00"
                value={vlrAcre.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                onChange={(e) => setVlrAcre(handleInputMoeda(e.target.value))}
                className="text-end"
              />
            </div>
            <Form.Text className="d-block mt-2">
              Exemplo: 5,50 (juros de mora por dias de atraso)
            </Form.Text>
          </Form.Group>

          {/* Desconto */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              ✂️ Desconto (Antecipação/Bônus)
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text">R$</span>
              <Form.Control
                type="text"
                placeholder="0,00"
                value={vlrDesc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                onChange={(e) => setVlrDesc(handleInputMoeda(e.target.value))}
                className="text-end"
              />
            </div>
            <Form.Text className="d-block mt-2">
              Exemplo: 20,00 (desconto por pagamento antecipado)
            </Form.Text>
          </Form.Group>

          {/* Total Calculado */}
          <Form.Group className="p-3 bg-success bg-opacity-10 rounded border border-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Form.Label className="fw-bold mb-0">📊 TOTAL A PAGAR</Form.Label>
                <small className="text-muted d-block">
                  {vlrBase.toFixed(2)} + {vlrMult.toFixed(2)} + {vlrAcre.toFixed(2)} - {vlrDesc.toFixed(2)}
                </small>
              </div>
              <div className="text-end">
                <div className="display-5 text-success fw-bold">{formatarMoeda(vlrTot)}</div>
              </div>
            </div>
          </Form.Group>
        </Form>

        {/* Dica */}
        <div className="alert alert-info small mt-4 mb-0">
          <strong>💡 Dica:</strong> Os valores aqui ajudam a calcular o total correto para o documento.
          Se o total não bater com o valor do movimento de caixa, ajuste os valores acima.
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onCancel}>
          ❌ Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={handleConfirmar}
          disabled={vlrTot < 0}
        >
          ✅ Confirmar Ajustes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEditarValoresDocumento;














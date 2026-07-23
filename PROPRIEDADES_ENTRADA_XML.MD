# Especificação de Fluxo de Tela e Negócio: Entrada de Estoque via XML

## 1. Fluxo de Negócio no ERP (Backend Java)

Ao processar o XML completo (`nfeProc`) baixado da SEFAZ, o sistema deve executar quatro rotinas automáticas antes de incrementar o saldo físico do estoque:

1. **Vínculo Automático de Fornecedor:** O sistema deve buscar no banco o CNPJ do emitente (`<emit><CNPJ>`). Se não existir, deve cadastrá-lo automaticamente usando a Razão Social (`<xNome>`) e endereço presentes no XML.
2. **De-Para de Produtos (Fator de Conversão):** O fornecedor pode vender em "CAIXA" (CX), mas seu ERP controla em "UNIDADE" (UN). O sistema deve manter uma tabela de relacionamento (`De-Para`) para associar o código do produto do fornecedor ao ID do produto interno do ERP e aplicar o fator multiplicador (Ex: 1 CX = 12 UN).
3. **Cálculo de Custo Médio Ponderado:** O custo unitário não deve apenas sobrescrever o antigo. O ERP deve recalcular o custo do produto usando a fórmula do Custo Médio Ponderado para não distorcer a margem de lucro:
   $$\text{Novo Custo Médio} = \frac{(\text{Qtd Antiga} \times \text{Custo Antigo}) + (\text{Qtd Nova} \times \text{Custo Novo})}{\text{Qtd Antiga} + \text{Qtd Nova}}$$
4. **Composição do Valor Líquido:** O custo de entrada do item deve considerar os impostos e despesas que agregam ou deduzem o valor, seguindo a regra fiscal:
   $$\text{Valor Líquido} = \text{Valor dos Produtos} + \text{Frete} + \text{Seguro} + \text{IPI} + \text{ICMS ST} - \text{Descontos}$$

---

## 2. Estrutura do Banco de Dados (MariaDB 10.11)

Adicione as tabelas de vínculo e relacionamento que o Agent precisará gerenciar:

```sql
-- Tabela de relacionamento de produtos (Fornecedor x ERP Interno)
CREATE TABLE erp_produto_depara (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_cnpj VARCHAR(14) NOT NULL,
    codigo_produto_fornecedor VARCHAR(50) NOT NULL,
    produto_id_interno BIGINT NOT NULL, -- Chave estrangeira da sua tabela de produtos
    fator_conversao DECIMAL(10,4) NOT NULL DEFAULT 1.0000, -- Ex: Se recebe CX com 12, fator é 12
    unidade_medida_fornecedor VARCHAR(10),
    unidade_medida_interna VARCHAR(10),
    UNIQUE KEY uq_fornecedor_produto (fornecedor_cnpj, codigo_produto_fornecedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Código Java: Parser do XML com Java-NFe

Implemente a extração dos dados usando os objetos nativos da biblioteca `wmixvideo/java-nfe`.

```java
import com.fincatto.documentofiscal.nfe400.classes.nota.NFNota;
import com.fincatto.documentofiscal.nfe400.classes.nota.NFNotaProcessada;
import com.fincatto.documentofiscal.nfe400.classes.nota.NFNotaInfoItem;
import com.fincatto.documentofiscal.utils.DFPersister;

import java.math.BigDecimal;

public class ErpParserXmlService {

    /**
     * Realiza o parse da String XML recebida da SEFAZ e extrai os dados para o ERP
     */
    public void processarEntradaXml(String xmlConteudo) throws Exception {
        // A biblioteca reconstrói o objeto completo a partir da String XML
        NFNotaProcessada notaProcessada = new DFPersister().read(NFNotaProcessada.class, xmlConteudo);
        NFNota nota = notaProcessada.getNota();

        // 1. Dados do Emitente (Fornecedor)
        String cnpjFornecedor = nota.getInfo().getEmitente().getCnpj();
        String nomeFornecedor = nota.getInfo().getEmitente().getxNome();
        
        // Executar método do Agent: garantirCadastroFornecedor(cnpjFornecedor, nomeFornecedor);

        // 2. Varredura dos Itens da Nota Fiscal
        for (NFNotaInfoItem item : nota.getInfo().getItens()) {
            String codigoProdFornecedor = item.getProduto().getFormatadoCodigoProduto();
            String nomeProdFornecedor = item.getProduto().getxProd();
            String ncm = item.getProduto().getNcm();
            BigDecimal qtdRecebida = new BigDecimal(item.getProduto().getQuantidadeComercial());
            BigDecimal valorUnitarioFornecedor = new BigDecimal(item.getProduto().getValorUnitarioComercial());

            // 3. Aplicação das regras de cálculo de custo por item
            BigDecimal freteItem = item.getProduto().getValorFrete() != null ? new BigDecimal(item.getProduto().getValorFrete()) : BigDecimal.ZERO;
            BigDecimal descontoItem = item.getProduto().getValorDesconto() != null ? new BigDecimal(item.getProduto().getValorDesconto()) : BigDecimal.ZERO;
            
            // Valor Líquido do Item = (Qtd * ValorUnitario) + Frete - Desconto
            BigDecimal valorTotalLiquidoItem = qtdRecebida.multiply(valorUnitarioFornecedor).add(freteItem).subtract(descontoItem);
            BigDecimal custoUnitarioLiquido = valorTotalLiquidoItem.divide(qtdRecebida, 4, BigDecimal.ROUND_HALF_UP);

            // Executar lógica no Agent:
            // Long produtoIdInterno = buscarDePara(cnpjFornecedor, codigoProdFornecedor);
            // Se não existir o De-Para, o sistema deve salvar o item temporariamente e exigir o vínculo na tela do React.
        }
    }
}
```

---

## 4. Protótipo de Tela (React Frontend)

Abaixo está o esqueleto em React para a tela de conciliação. Se o XML contiver um produto que o ERP nunca viu antes, a tela exibe um alerta amarelo e obriga o usuário a associar com um produto interno do inventário antes de liberar o botão de **"Confirmar Entrada"**.

```jsx
import React, { useState } from 'react';

export default function ConciliacaoXml() {
  // Simulação de dados que vieram do backend após o parse do XML
  const [itensNota, setItensNota] = useState([
    { id: 1, codigoFornecedor: 'PROD-99', descricao: 'Coca Cola Lata 350ml', qtd: 24, un: 'CX', cadastrado: true, produtoInternoId: 102, fator: 24 },
    { id: 2, codigoFornecedor: 'PROD-102', descricao: 'Agua Mineral Sem Gas 500ml', qtd: 12, un: 'PCT', cadastrado: false, produtoInternoId: null, fator: 1 }
  ]);

  const [produtosDoErp] = useState([
    { id: 102, nome: 'Coca-Cola Lata' },
    { id: 105, nome: 'Água Mineral 500ml' },
    { id: 106, nome: 'Suco Del Valle Uva' }
  ]);

  const handleVincularProduto = (idItemNota, idProdutoErp) => {
    setItensNota(prev => prev.map(item => 
      item.id === idItemNota 
        ? { ...item, produtoInternoId: Number(idProdutoErp), cadastrado: idProdutoErp ? true : false } 
        : item
    ));
  };

  const handleAlterarFator = (idItemNota, valorFator) => {
    setItensNota(prev => prev.map(item => 
      item.id === idItemNota ? { ...item, fator: Number(valorFator) } : item
    ));
  };

  const tudoVinculado = itensNota.every(item => item.cadastrado && item.fator > 0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Conciliação de Itens do XML</h2>
      <p style={{ color: '#666' }}>Associe os produtos do seu fornecedor aos itens do seu estoque interno e defina o fator de conversão.</p>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>Item no XML (Fornecedor)</th>
            <th>Qtd (XML)</th>
            <th>Unidade</th>
            <th>Produto Correspondente no ERP</th>
            <th>Fator de Conversão (Multiplicador)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {itensNota.map(item => (
            <tr key={item.id} style={{ backgroundColor: item.cadastrado ? '#fff' : '#fff3cd' }}>
              <td>
                <strong>{item.codigoFornecedor}</strong> - {item.descricao}
              </td>
              <td>{item.qtd}</td>
              <td>{item.un}</td>
              <td>
                <select 
                  value={item.produtoInternoId || ''} 
                  onChange={(e) => handleVincularProduto(item.id, e.target.value)}
                  style={{ padding: '5px', width: '250px' }}
                >
                  <option value="">-- Selecione o Produto Interno --</option>
                  {produtosDoErp.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </td>
              <td>
                <input 
                  type="number" 
                  value={item.fator} 
                  onChange={(e) => handleAlterarFator(item.id, e.target.value)}
                  style={{ width: '60px', padding: '5px' }} 
                  min="1"
                />
              </td>
              <td style={{ color: item.cadastrado ? 'green' : 'orange', fontWeight: 'bold' }}>
                {item.cadastrado ? '✓ Vinculado' : '⚠ Requer Vínculo'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button 
          disabled={!tudoVinculado}
          style={{
            padding: '12px 24px',
            backgroundColor: tudoVinculado ? '#28a745' : '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: tudoVinculado ? 'pointer' : 'not-allowed'
          }}
          onClick={() => alert('Entrada de estoque processada, De-Para salvo e Custo Médio atualizado!')}
        >
          Confirmar Entrada de Mercadoria & Atualizar Estoque
        </button>
      </div>
    </div>
  );
}
```

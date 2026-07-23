# Especificação Técnica Unificada: Adequação do ERP à Reforma Tributária
## Tabelas afetadas: xmlnotacab, xmlnotadet e xmlpagar

---

## 1. Visão Geral da Reforma Tributária no ERP
A Reforma Tributária (Emenda Constitucional 132/2023) introduz o modelo de IVA Dual, extinguindo gradualmente o ICMS, ISS, IPI, PIS e COFINS. Eles são substituídos pelo **IBS** (Estadual/Municipal), pela **CBS** (Federal) e pelo **IS** (Imposto Seletivo). 

Adicionalmente, entra em vigor o mecanismo de **Split Payment**, onde os tributos de consumo são retidos na fonte no ato da liquidação financeira da fatura.

---

## 2. Estrutura de Banco de Dados (Scripts de Migração MariaDB 10.11)

Execute os comandos `ALTER TABLE` abaixo para atualizar suas tabelas atuais sem afetar o histórico de notas fiscais antigas (todos os novos campos aceitam `NULL` e possuem valores padrão zerados).

### 2.1. Alteração na Capa/Cabeçalho (`xmlnotacab`)
```sql
ALTER TABLE `xmlnotacab`
    -- Totais Consolidados da Nota Fiscal (Reforma Tributária)
    ADD COLUMN `vBCIBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vCOFINS` COMMENT 'Base de Cálculo Total do IBS na Nota',
    ADD COLUMN `vIBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vBCIBS` COMMENT 'Valor Total do IBS na Nota',
    ADD COLUMN `vBCCBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vIBS` COMMENT 'Base de Cálculo Total da CBS na Nota',
    ADD COLUMN `vCBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vBCCBS` COMMENT 'Valor Total da CBS na Nota',
    ADD COLUMN `vIS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vCBS` COMMENT 'Valor Total do Imposto Seletivo na Nota',
    
    -- Mecanismo de Split Payment (Retenções Nacionais)
    ADD COLUMN `vSplitIBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vIS` COMMENT 'Valor total do IBS retido via Split Payment',
    ADD COLUMN `vSplitCBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vSplitIBS` COMMENT 'Valor total da CBS retido via Split Payment',
    ADD COLUMN `indSplit` CHAR(1) NULL DEFAULT '0' AFTER `vSplitCBS` COMMENT 'Indicador de Split Payment: 0=Não; 1=Sim';
```

### 2.2. Alteração nos Itens/Detalhes (`xmlnotadet`)
```sql
ALTER TABLE `xmlnotadet`
    -- Detalhes do IBS (Imposto sobre Bens e Serviços) por Item
    ADD COLUMN `CSTIBS` CHAR(2) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci' AFTER `vCOFINS` COMMENT 'CST do IBS',
    ADD COLUMN `vBCIBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `CSTIBS` COMMENT 'Base de Cálculo do IBS no item',
    ADD COLUMN `pIBS` DECIMAL(5,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vBCIBS` COMMENT 'Alíquota do IBS no item',
    ADD COLUMN `vIBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `pIBS` COMMENT 'Valor do IBS no item',
    
    -- Detalhes da CBS (Contribuição sobre Bens e Serviços) por Item
    ADD COLUMN `CSTCBS` CHAR(2) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci' AFTER `vIBS` COMMENT 'CST da CBS',
    ADD COLUMN `vBCCBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `CSTCBS` COMMENT 'Base de Cálculo da CBS no item',
    ADD COLUMN `pCBS` DECIMAL(5,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vBCCBS` COMMENT 'Alíquota da CBS no item',
    ADD COLUMN `vCBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `pCBS` COMMENT 'Valor da CBS no item',

    -- Detalhes do IS (Imposto Seletivo) por Item
    ADD COLUMN `CSTIS` CHAR(2) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci' AFTER `vCBS` COMMENT 'CST do Imposto Seletivo',
    ADD COLUMN `vBCIS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `CSTIS` COMMENT 'Base de Cálculo do IS no item',
    ADD COLUMN `pIS` DECIMAL(5,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vBCIS` COMMENT 'Alíquota do IS no item',
    ADD COLUMN `vIS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `pIS` COMMENT 'Valor do IS no item';
```

### 2.3. Alteração no Financeiro/Duplicatas (`xmlpagar`)
```sql
ALTER TABLE `xmlpagar`
    ADD COLUMN `vRetencaoIBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vDup` COMMENT 'Proporção do IBS retido nesta parcela',
    ADD COLUMN `vRetencaoCBS` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vRetencaoIBS` COMMENT 'Proporção da CBS retida nesta parcela',
    ADD COLUMN `vLiquidoFornecedor` DECIMAL(12,2) UNSIGNED NULL DEFAULT 0.00 AFTER `vRetencaoCBS` COMMENT 'Valor efetivo líquido enviado ao fornecedor';
```

---

## 3. Mapeamento de Tags XML (Java Backend)

O Agent deve extrair os dados lidos pela biblioteca `Java-NFe` e mapear para os novos campos criados no banco seguindo as tabelas abaixo:

### Mapeamento `xmlnotacab`
* `vBCIBS` $\rightarrow$ `<total><ICMSTot><vBCIBS>`
* `vIBS` $\rightarrow$ `<total><ICMSTot><vIBS>`
* `vBCCBS` $\rightarrow$ `<total><ICMSTot><vBCCBS>`
* `vCBS` $\rightarrow$ `<total><ICMSTot><vCBS>`
* `vIS` $\rightarrow$ `<total><ICMSTot><vIS>`
* `vSplitIBS` $\rightarrow$ `<total><ICMSTot><vSplitIBS>`
* `vSplitCBS` $\rightarrow$ `<total><ICMSTot><vSplitCBS>`
* `indSplit` $\rightarrow$ `<total><ICMSTot><indSplit>`

### Mapeamento `xmlnotadet`
* `CSTIBS` $\rightarrow$ `<det><imposto><IBS><CST>`
* `vBCIBS` $\rightarrow$ `<det><imposto><IBS><vBC>`
* `pIBS` $\rightarrow$ `<det><imposto><IBS><pIBS>`
* `vIBS` $\rightarrow$ `<det><imposto><IBS><vIBS>`
* `CSTCBS` $\rightarrow$ `<det><imposto><CBS><CST>`
* `vBCCBS` $\rightarrow$ `<det><imposto><CBS><vBC>`
* `pCBS` $\rightarrow$ `<det><imposto><CBS><pCBS>`
* `vCBS` $\rightarrow$ `<det><imposto><CBS><vCBS>`
* `CSTIS` $\rightarrow$ `<det><imposto><IS><CST>`
* `vBCIS` ... `<det><imposto><IS><vBC>`
* `pIS` $\rightarrow$ `<det><imposto><IS><pIS>`
* `vIS` $\rightarrow$ `<det><imposto><IS><vIS>`

---

## 4. Regras de Negócio e Cálculos no Java

### 4.1. Cálculo do Custo Líquido de Entrada do Estoque (`xmlnotadet`)
O IBS e a CBS operam sob o princípio da não-cumulatividade plena, gerando créditos tributários que reduzem o custo do produto. O Imposto Seletivo (IS) é cumulativo e integra o custo.

```java
if (item.getvIBS() > 0 || item.getvCBS() > 0) {
    // Fórmula do Valor Líquido do Item com IBS/CBS/IS
    BigDecimal valorCustoTotalItem = vProd
        .add(vFRETEI)
        .add(VOUTROSI)
        .add(vIS)          // Soma ao custo (Monofásico)
        .subtract(vDESCI)
        .subtract(vIBS)    // Subtrai do custo (Gera Crédito)
        .subtract(vCBS);   // Subtrai do custo (Gera Crédito)

    BigDecimal custoUnitarioReal = valorCustoTotalItem.divide(qCom, 4, RoundingMode.HALF_UP);
    // Aplicar no processamento de estoque e cálculo de custo médio ponderado
}
```

### 4.2. Desdobramento Proporcional do Split Payment (`xmlpagar`)
Se `xmlnotacab.indSplit = '1'`, o Agent deve fracionar as retenções do cabeçalho proporcionalmente ao valor de cada duplicata comercial gerada.

```java
// Fator de peso da parcela sobre o total da nota
BigDecimal fatorParcela = vDup.divide(vNF, 6, RoundingMode.HALF_UP);

// Retenções proporcionais da parcela
BigDecimal vRetencaoIBS = vSplitIBS.multiply(fatorParcela).setScale(2, RoundingMode.HALF_UP);
BigDecimal vRetencaoCBS = vSplitCBS.multiply(fatorParcela).setScale(2, RoundingMode.HALF_UP);

// Valor líquido a pagar na conta do fornecedor
BigDecimal vLiquidoFornecedor = vDup.subtract(vRetencaoIBS.add(vRetencaoCBS));
```

---

## 5. Diretrizes para o Frontend (React)
1. **Destaque na Tela de Contas a Pagar:** Quando o campo `vLiquidoFornecedor` for preenchido, a tela deve exibir o valor do boleto total (`vDup`), mas detalhar amigavelmente a divisão para o operador: *"Valor ao Fornecedor: R$ X | Retenção Governamental: R$ Y"*.
2. **Conciliação Automatizada:** Utilizar os campos `vRetencaoIBS` e `vRetencaoCBS` para cruzar as informações no momento do retorno do arquivo CNAB ou extrato Pix da API bancária do Split Payment.

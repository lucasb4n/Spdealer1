# Especificação Técnica: Sincronização e Download de XML de Fornecedores via SEFAZ

## 1. Objetivo
Implementar rotina automatizada no ERP para consultar, manifestar e baixar os XMLs completos de Notas Fiscais Eletrônicas (NF-e) emitidas por fornecedores contra o CNPJ da empresa, utilizando comunicação direta com o Web Service `NFeDistribuicaoDFe` da SEFAZ Nacional.

---

## 2. Infraestrutura e Banco de Dados (MariaDB 10.11)

Para o controle de paginação (NSU) e armazenamento dos documentos fiscais, crie a estrutura de tabelas abaixo no MariaDB.

```sql
-- Tabela para controle do último NSU consultado por empresa
CREATE TABLE sefaz_controle_nsu (
    cnpj VARCHAR(14) NOT NULL,
    ultimo_nsu VARCHAR(15) NOT NULL DEFAULT '0',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para armazenamento dos XMLs e status da manifestação
CREATE TABLE sefaz_documentos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cnpj_destinatario VARCHAR(14) NOT NULL,
    chave_acesso VARCHAR(44) NOT NULL,
    nsu VARCHAR(15) NOT NULL,
    emitente_cnpj VARCHAR(14),
    emitente_nome VARCHAR(255),
    valor_total DECIMAL(15,2),
    status_manifestacao VARCHAR(50) DEFAULT 'PENDENTE', -- PENDENTE, CIENTE, CONFIRMADO
    tipo_documento VARCHAR(20), -- RESUMO, COMPLETO
    xml_conteudo LONGTEXT, -- LONGTEXT para garantir suporte ao tamanho do XML
    recebido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_chave (chave_acesso),
    INDEX idx_cnpj_nsu (cnpj_destinatario, nsu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Lógica do Loop de Paginação (Java Backend)

A SEFAZ limita o retorno a **50 documentos por requisição**. Se o indicador `cStat` for `138` (Documento localizado), o sistema deve processar o lote, atualizar o NSU no banco de dados e continuar consultando em loop até que o `cStat` retorne `137` (Nenhum documento encontrado).

### Código Java Base Atualizado: `SefazDfeService.java`

```java
import com.fincatto.documentofiscal.DFConfig;
import com.fincatto.documentofiscal.DFAmbiente;
import com.fincatto.documentofiscal.DFUnidadeFederativa;
import com.fincatto.documentofiscal.nfe400.classes.distribuicaocomplemento.NFDistribuicaoDocumentoZip;
import com.fincatto.documentofiscal.nfe400.classes.distribuicaocomplemento.NFDistribuicaoRetorno;
import com.fincatto.documentofiscal.nfe400.webservices.WSFacade;

import java.io.FileInputStream;
import java.security.KeyStore;

public class SefazDfeService {

    private final DFConfig config;

    public SefazDfeService() throws Exception {
        this.config = new DFConfig() {
            @Override
            public KeyStore getCertificadoKeyStore() throws Exception {
                KeyStore keyStore = KeyStore.getInstance("PKCS12");
                try (FileInputStream stream = new FileInputStream("/caminho/seu/certificado.pfx")) {
                    keyStore.load(stream, "SENHA_DO_CERTIFICADO".toCharArray());
                }
                return keyStore;
            }

            @Override
            public String getCertificadoSenha() { return "SENHA_DO_CERTIFICADO"; }

            @Override
            public DFAmbiente getAmbiente() { return DFAmbiente.PRODUCAO; }

            @Override
            public DFUnidadeFederativa getCUF() { return DFUnidadeFederativa.PR; } // Altere para seu UF
        };
    }

    /**
     * Executa a sincronização em lote contornando o limite de 50 registros por chamada.
     */
    public void executarSincronizacaoLote(String cnpj) {
        WSFacade facade = new WSFacade(this.config);
        boolean possuiNovosRegistros = true;

        while (possuiNovosRegistros) {
            // 1. Busca o último NSU gravado no MariaDB para este CNPJ
            String ultimoNsu = buscarUltimoNsuBanco(cnpj); 

            try {
                // 2. Consulta a SEFAZ
                NFDistribuicaoRetorno retorno = facade.consultarDistribuicaoNotafiscal(cnpj, this.config.getCUF(), ultimoNsu);
                String cStat = retorno.getCStat();

                // cStat 138: Documentos encontrados
                if ("138".equals(cStat) && retorno.getLote() != null) {
                    String maiorNsuDoLote = ultimoNsu;

                    for (NFDistribuicaoDocumentoZip doc : retorno.getLote().getDocs()) {
                        String nsuAtual = doc.getNsu();
                        String xmlDescompactado = doc.getXmlDescompactado();

                        if (xmlDescompactado.contains("resNFe")) {
                            // Trata Resumo (Estrutura básica)
                            salvarResumoNoBanco(cnpj, nsuAtual, xmlDescompactado);
                            // REQUISITO: Chamar o método de manifestação automaticamente ou via fila se necessário
                            String chaveAcesso = extrairChaveAcesso(xmlDescompactado);
                            manifestarCiencia(cnpj, chaveAcesso);
                        } else if (xmlDescompactado.contains("nfeProc")) {
                            // Trata XML Completo (Pronto para entrada no ERP)
                            salvarXmlCompletoNoBanco(cnpj, nsuAtual, xmlDescompactado);
                        }

                        // Acompanha o maior NSU processado no lote atual
                        if (Long.parseLong(nsuAtual) > Long.parseLong(maiorNsuDoLote)) {
                            maiorNsuDoLote = nsuAtual;
                        }
                    }

                    // 3. Atualiza o ponteiro do NSU no banco de dados para a próxima iteração do loop
                    atualizarNsuNoBanco(cnpj, maiorNsuDoLote);

                } else if ("137".equals(cStat)) {
                    // cStat 137: Nenhum documento novo encontrado (Fim da fila na SEFAZ)
                    possuiNovosRegistros = false;
                } else {
                    // Outros códigos de erro/rejeição (Ex: Consumo indevido cStat 656)
                    possuiNovosRegistros = false;
                    registrarErroSefaz(cStat, retorno.getXMotivo());
                }

            } catch (Exception e) {
                possuiNovosRegistros = false;
                logger.error("Erro na comunicação com a SEFAZ: " + e.getMessage(), e);
            }
        }
    }

    public void manifestarCiencia(String cnpj, String chaveAcesso) throws Exception {
        WSFacade facade = new WSFacade(this.config);
        // Dispara o evento obrigatório de "Ciência da Operação"
        facade.manifestarObterObjeto(cnpj, chaveAcesso, "Ciência da Operação", "1");
        atualizarStatusManifestacaoBanco(chaveAcesso, "CIENTE");
    }

    // --- Métodos de Stub para o Agent Implementar a Camada de Dados (Repository/JDBC) ---
    private String buscarUltimoNsuBanco(String cnpj) { /* SELECT ultimo_nsu FROM sefaz_controle_nsu ... */ return "0"; }
    private void atualizarNsuNoBanco(String cnpj, String novoNsu) { /* INSERT INTO sefaz_controle_nsu ... ON DUPLICATE KEY UPDATE ... */ }
    private void salvarResumoNoBanco(String cnpj, String nsu, String xml) { /* INSERT INTO sefaz_documentos (tipo_documento='RESUMO') ... */ }
    private void salvarXmlCompletoNoBanco(String cnpj, String nsu, String xml) { /* INSERT INTO sefaz_documentos (tipo_documento='COMPLETO') ... */ }
    private void atualizarStatusManifestacaoBanco(String chave, String status) { /* UPDATE sefaz_documentos SET status_manifestacao = ... */ }
    private void registrarErroSefaz(String cStat, String motivo) { /* Log de erros */ }
    private String extrairChaveAcesso(String xml) { /* Parse regex ou XML para obter a chave de acesso da nota */ return ""; }
}
```

---

## 4. Regras de Negócio Importantes para o Agent

1. **Evitar Consumo Indevido (Rejeição 656):** O loop acima para imediatamente caso a SEFAZ não retorne o código `138`. O Agent não deve forçar requisições contínuas em caso de erro, sob risco de bloqueio do CNPJ por algumas horas.
2. **Armazenamento Seguro:** O campo `xml_conteudo` deve armazenar a string XML limpa e descriptografada enviada pela biblioteca para que o ERP possa realizar o parser das tags `<det>` (itens), `<emit>` (fornecedor) e `<total>` posteriormente.
3. **Casos de Uso da Manifestação:** 
   * **Ciência da Operação:** Executada de forma automática pelo backend logo após receber o resumo para liberar o download do XML completo.
   * **Confirmação da Operação:** Deve ser disparada no banco e na SEFAZ somente quando o usuário do ERP finalizar o processo físico de recebimento e validação da mercadoria no estoque.

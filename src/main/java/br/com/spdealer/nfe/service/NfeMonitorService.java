package br.com.spdealer.nfe.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import br.com.spdealer.nfse.service.NfseWebService;

import jakarta.annotation.PostConstruct;

/**
 * Serviço para monitorar a pasta de envio de NF-e
 * 
 * Este serviço:
 * 1. Cria a estrutura de pastas na inicialização
 * 2. Monitora a pasta /Envio para processar XMLs automaticamente
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NfeMonitorService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SefazWebService sefazWebService;

    @Autowired
    private NfeXmlService nfeXmlService;

    @Autowired
    private NfseWebService nfseWebService;

    /**
     * Inicializa a estrutura de pastas na primeira execução
     * Usa caminho fixo: H:/DISCO_D/usr/revenda
     */
    @PostConstruct
    public void inicializarPastas() {
        log.info("Inicializando estrutura de pastas para NF-e...");

        try {
            // Usa caminho compatível com Linux
            String pastaBase = "/usr/local/spdealer/revenda";
            criarEstruturaPastas(pastaBase, 1);

            log.info("Estrutura de pastas inicializada com sucesso");

        } catch (Exception e) {
            log.error("Erro ao inicializar pastas: {}", e.getMessage(), e);
        }
    }

    /**
     * Cria a estrutura de pastas para uma filial
     */
    private void criarEstruturaPastas(String pastaBase, Integer filial) {
        String[] pastas = {
                pastaBase + "/envio/Temp",
                pastaBase + "/envio/Assinado",
                pastaBase + "/envio/Contingencia",
                pastaBase + "/Enviado/Autorizados",
                pastaBase + "/Enviado/Denegados",
                pastaBase + "/Enviado/EmProcessamento",
                pastaBase + "/Retorno"
        };

        for (String pasta : pastas) {
            try {
                Path path = Paths.get(pasta);
                if (!Files.exists(path)) {
                    Files.createDirectories(path);
                    log.info("Pasta criada: {}", pasta);
                }
            } catch (IOException e) {
                log.error("Erro ao criar pasta {}: {}", pasta, e.getMessage());
            }
        }
    }

    /**
     * Monitora a pasta de envio a cada 10 segundos
     * Processa arquivos XML que forem adicionados à pasta /Envio
     * Usa caminho fixo: H:/DISCO_D/usr/revenda
     */
    @Scheduled(fixedDelay = 10000) // Executa a cada 10 segundos
    public void monitorarPastaEnvio() {
        try {
            // Usa caminho compatível com Linux
            String pastaBase = "/usr/local/spdealer/revenda";
            processarPastaEnvio(pastaBase, 1);

        } catch (Exception e) {
            log.error("Erro ao monitorar pasta de envio: {}", e.getMessage());
        }
    }

    /**
     * Processa os arquivos XML na pasta de envio
     */
    private void processarPastaEnvio(String pastaBase, Integer filial) {
        Path pastaEnvio = Paths.get(pastaBase + "/envio/Temp");

        if (!Files.exists(pastaEnvio)) {
            return;
        }

        try {
            // Lista arquivos .xml na pasta
            List<Path> arquivos = Files.walk(pastaEnvio, 1)
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().toLowerCase().endsWith(".xml"))
                    .filter(p -> !p.toString().contains(".processed"))
                    .collect(Collectors.toList());

            for (Path arquivo : arquivos) {
                processarXml(arquivo, pastaBase, filial);
            }

        } catch (IOException e) {
            log.error("Erro ao listar arquivos na pasta {}: {}", pastaEnvio, e.getMessage());
        }
    }

    /**
     * Processa um arquivo XML individual
     */
    private void processarXml(Path arquivo, String pastaBase, Integer filial) {
        try {
            String nomeArquivo = arquivo.getFileName().toString();
            log.info("Processando XML: {} na filial {}", nomeArquivo, filial);

            // Lê o conteúdo do XML
            String xml = new String(Files.readAllBytes(arquivo), "UTF-8");

            // Extrai a chave do nome do arquivo ou do XML
            String chave = extrairChave(nomeArquivo, xml);

            // Move para pasta de processamento
            Path pastaProcessamento = Paths.get(pastaBase + "/Enviado/EmProcessamento");
            Path arquivoProcessado = pastaProcessamento.resolve(nomeArquivo);
            Files.move(arquivo, arquivoProcessado, StandardCopyOption.REPLACE_EXISTING);

            // Detecta se é NFSe (Série U municipal)
            boolean isNfse = xml.contains("<LoteRps>") 
                    || xml.contains("<EnviarLoteRpsSincronoEnvio>") 
                    || xml.contains("<Serie>U</Serie>")
                    || xml.contains("<serie>U</serie>");

            if (isNfse) {
                log.info("XML detectado como NFS-e (Serie U). Enviando para Prefeitura...");
                Map<String, Object> resultado = nfseWebService.enviarLoteRpsXml(xml, filial);
                boolean sucesso = Boolean.TRUE.equals(resultado.get("sucesso"));

                // Salva o retorno
                String respostaXml = (String) resultado.get("respostaXml");
                if (respostaXml == null) {
                    respostaXml = "<erro>" + resultado.get("erro") + "</erro>";
                }
                String arquivoRetorno = pastaBase + "/Retorno/" + chave + "-ret.xml";
                Files.write(Paths.get(arquivoRetorno), respostaXml.getBytes("UTF-8"));

                if (sucesso) {
                    // Move para autorizados
                    Path pastaAutorizados = Paths.get(pastaBase + "/Enviado/Autorizados");
                    Files.move(arquivoProcessado, pastaAutorizados.resolve(nomeArquivo),
                            StandardCopyOption.REPLACE_EXISTING);
                    log.info("NFS-e {} autorizada com sucesso. Protocolo: {}", chave, resultado.get("protocolo"));
                } else {
                    // Move para denegados
                    Path pastaDenegados = Paths.get(pastaBase + "/Enviado/Denegados");
                    Files.move(arquivoProcessado, pastaDenegados.resolve(nomeArquivo),
                            StandardCopyOption.REPLACE_EXISTING);
                    log.warn("NFS-e {} rejeitada: {}", chave, resultado.get("erro"));
                }
            } else {
                log.info("XML detectado como NF-e. Enviando para SEFAZ...");
                // Envia para SEFAZ (ambiente de homologação por padrão)
                String resposta = sefazWebService.enviarNfe(xml, "2");

                // Salva o retorno
                String arquivoRetorno = pastaBase + "/Retorno/" + chave + "-ret.xml";
                Files.write(Paths.get(arquivoRetorno), resposta.getBytes("UTF-8"));

                // Verifica se foi autorizado
                if (resposta.contains("<cStat>100</cStat>") || resposta.contains("<cStat>103</cStat>")) {
                    // Move para autorizados
                    Path pastaAutorizados = Paths.get(pastaBase + "/Enviado/Autorizados");
                    Files.move(arquivoProcessado, pastaAutorizados.resolve(nomeArquivo),
                            StandardCopyOption.REPLACE_EXISTING);
                    log.info("NF-e {} autorizada com sucesso", chave);
                } else {
                    // Move para denegados
                    Path pastaDenegados = Paths.get(pastaBase + "/Enviado/Denegados");
                    Files.move(arquivoProcessado, pastaDenegados.resolve(nomeArquivo),
                            StandardCopyOption.REPLACE_EXISTING);
                    log.warn("NF-e {} denegada ou com erro", chave);
                }
            }

        } catch (Exception e) {
            log.error("Erro ao processar XML {}: {}", arquivo.getFileName(), e.getMessage());
        }
    }

    /**
     * Extrai a chave da NFe do nome do arquivo ou do conteúdo XML
     */
    private String extrairChave(String nomeArquivo, String xml) {
        // Tenta extrair do nome do arquivo (formato: CHAVE-nfe.xml)
        if (nomeArquivo.contains("-nfe")) {
            String parte = nomeArquivo.split("-nfe")[0];
            if (parte.length() >= 44) {
                return parte.substring(parte.length() - 44);
            }
            return parte;
        }

        // Tenta extrair do XML
        if (xml.contains("Id=\"NFe")) {
            int idx = xml.indexOf("Id=\"NFe") + 7;
            int end = xml.indexOf("\"", idx);
            if (end > idx) {
                return xml.substring(idx, end);
            }
        }

        // Retorna timestamp como fallback
        return String.valueOf(System.currentTimeMillis());
    }
}

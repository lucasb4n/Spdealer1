package br.com.sprsoftware.api.boleto.service;

import br.com.sprsoftware.api.boleto.model.Boleto;
import java.util.Map;

public interface BancoIntegrationService {

    /**
     * Emite um novo boleto no banco e retorna os dados gerados.
     * O resultado deve conter: nossoNumero, linhaDigitavel, codigoBarras, servidorResposta.
     */
    Map<String, Object> emitir(Boleto boleto) throws Exception;

    /**
     * Consulta um boleto existente no banco pelo nossoNumero.
     * Retorna situacao, dados de pagamento, etc.
     */
    Map<String, Object> consultar(Boleto boleto) throws Exception;

    /**
     * Baixa (cancela) um boleto no banco.
     */
    Map<String, Object> baixar(Boleto boleto) throws Exception;

    /**
     * Altera a data de vencimento de um boleto.
     */
    Map<String, Object> alterarVencimento(Boleto boleto, String novaData) throws Exception;
}

package br.com.spdealer.dto;

import java.util.List;

public class LancamentoRequest {

    public String tipo; // "RECEBER" ou "PAGAR"
    public Integer operacao; // 500 = receber(credito), 600 = pagar(debito)
    public String banco; // codigo do banco (ex: '001')
    public String cliente; // cliente/fornecedor codigo
    public String data; // YYYY-MM-DD
    public String historico;
    public List<Long> documentoIds;
    public Integer filial;

}

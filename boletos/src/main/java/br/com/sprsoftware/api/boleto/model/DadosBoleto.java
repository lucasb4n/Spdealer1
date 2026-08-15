package br.com.sprsoftware.api.boleto.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DadosBoleto {

    public static final BigDecimal LIMITE_MAXIMO = new BigDecimal("999999999999.99");

    private Long id;
    private String nossoNumero;
    private String numeroDocumento;
    private BigDecimal valor;
    private LocalDate dataVencimento;
    private LocalDateTime dataEmissao;
    private String especieDocumento = "DM";
    private String aceite = "N";
    private String codigoBanco;
    private String nomeBanco;
    private String carteira;
    private String sacadoNome;
    private String sacadoCpfCnpj;
    private String sacadoEndereco;
    private String sacadoBairro;
    private String sacadoCep;
    private String sacadoCidade;
    private String sacadoUf;
    private String cedenteNome;
    private String cedenteCpfCnpj;
    private String cedenteAgencia;
    private String cedenteConta;
    private String cedenteContaDigito;
    private String bancoCodigo;
    private String bancoNome;
    private String bancoAgencia;
    private String bancoConta;
    private String linhaDigitavel;
    private String codigoBarras;
    private String status = "PENDENTE";
    private String mensagemErro;

    public DadosBoleto() {
        this.dataEmissao = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNossoNumero() { return nossoNumero; }
    public void setNossoNumero(String nossoNumero) { this.nossoNumero = nossoNumero; }

    public String getNumeroDocumento() { return numeroDocumento; }
    public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) {
        if (valor != null && valor.compareTo(LIMITE_MAXIMO) > 0) {
            throw new IllegalArgumentException("Valor excede o limite maximo de " + getLimiteMaximoFormatado());
        }
        this.valor = valor;
    }

    public LocalDate getDataVencimento() { return dataVencimento; }
    public void setDataVencimento(LocalDate dataVencimento) { this.dataVencimento = dataVencimento; }

    public LocalDateTime getDataEmissao() { return dataEmissao; }
    public void setDataEmissao(LocalDateTime dataEmissao) { this.dataEmissao = dataEmissao; }

    public String getEspecieDocumento() { return especieDocumento; }
    public void setEspecieDocumento(String especieDocumento) { this.especieDocumento = especieDocumento; }

    public String getAceite() { return aceite; }
    public void setAceite(String aceite) { this.aceite = aceite; }

    public String getCodigoBanco() { return codigoBanco; }
    public void setCodigoBanco(String codigoBanco) { this.codigoBanco = codigoBanco; }

    public String getNomeBanco() { return nomeBanco; }
    public void setNomeBanco(String nomeBanco) { this.nomeBanco = nomeBanco; }

    public String getCarteira() { return carteira; }
    public void setCarteira(String carteira) { this.carteira = carteira; }

    public String getSacadoNome() { return sacadoNome; }
    public void setSacadoNome(String sacadoNome) { this.sacadoNome = sacadoNome; }

    public String getSacadoCpfCnpj() { return sacadoCpfCnpj; }
    public void setSacadoCpfCnpj(String sacadoCpfCnpj) { this.sacadoCpfCnpj = sacadoCpfCnpj; }

    public String getSacadoEndereco() { return sacadoEndereco; }
    public void setSacadoEndereco(String sacadoEndereco) { this.sacadoEndereco = sacadoEndereco; }

    public String getSacadoBairro() { return sacadoBairro; }
    public void setSacadoBairro(String sacadoBairro) { this.sacadoBairro = sacadoBairro; }

    public String getSacadoCep() { return sacadoCep; }
    public void setSacadoCep(String sacadoCep) { this.sacadoCep = sacadoCep; }

    public String getSacadoCidade() { return sacadoCidade; }
    public void setSacadoCidade(String sacadoCidade) { this.sacadoCidade = sacadoCidade; }

    public String getSacadoUf() { return sacadoUf; }
    public void setSacadoUf(String sacadoUf) { this.sacadoUf = sacadoUf; }

    public String getCedenteNome() { return cedenteNome; }
    public void setCedenteNome(String cedenteNome) { this.cedenteNome = cedenteNome; }

    public String getCedenteCpfCnpj() { return cedenteCpfCnpj; }
    public void setCedenteCpfCnpj(String cedenteCpfCnpj) { this.cedenteCpfCnpj = cedenteCpfCnpj; }

    public String getCedenteAgencia() { return cedenteAgencia; }
    public void setCedenteAgencia(String cedenteAgencia) { this.cedenteAgencia = cedenteAgencia; }

    public String getCedenteConta() { return cedenteConta; }
    public void setCedenteConta(String cedenteConta) { this.cedenteConta = cedenteConta; }

    public String getCedenteContaDigito() { return cedenteContaDigito; }
    public void setCedenteContaDigito(String cedenteContaDigito) { this.cedenteContaDigito = cedenteContaDigito; }

    public String getBancoCodigo() { return bancoCodigo; }
    public void setBancoCodigo(String bancoCodigo) { this.bancoCodigo = bancoCodigo; }

    public String getBancoNome() { return bancoNome; }
    public void setBancoNome(String bancoNome) { this.bancoNome = bancoNome; }

    public String getBancoAgencia() { return bancoAgencia; }
    public void setBancoAgencia(String bancoAgencia) { this.bancoAgencia = bancoAgencia; }

    public String getBancoConta() { return bancoConta; }
    public void setBancoConta(String bancoConta) { this.bancoConta = bancoConta; }

    public String getLinhaDigitavel() { return linhaDigitavel; }
    public void setLinhaDigitavel(String linhaDigitavel) { this.linhaDigitavel = linhaDigitavel; }

    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMensagemErro() { return mensagemErro; }
    public void setMensagemErro(String mensagemErro) { this.mensagemErro = mensagemErro; }

    public boolean isValorValido() {
        return valor != null && valor.compareTo(BigDecimal.ZERO) > 0
                && valor.compareTo(LIMITE_MAXIMO) <= 0;
    }

    public String getLimiteMaximoFormatado() {
        return String.format("R$ %s", LIMITE_MAXIMO.setScale(2).toString().replace(".", ","));
    }

    @Override
    public String toString() {
        return "DadosBoleto{" +
                "id=" + id +
                ", nossoNumero='" + nossoNumero + '\'' +
                ", numeroDocumento='" + numeroDocumento + '\'' +
                ", valor=" + valor +
                ", dataVencimento=" + dataVencimento +
                ", codigoBanco='" + codigoBanco + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}

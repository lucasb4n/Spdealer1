package br.com.spdealer.nfe.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entidade para dados da Filial/Empresa
 * Tabela: filial (já existe no banco)
 * 
 * Campos existentes:
 * - id_fil (código da filial)
 * - nome_fil (nome da empresa)
 * - cnpj_fil (CNPJ)
 * - logo_fil (logo)
 * - logop_fil (logo kecil)
 * 
 * Campos adicionais para NF-e (precisam ser adicionados à tabela):
 * - inscr_estadual_fil (Inscrição Estadual)
 * - inscr_municipal_fil (Inscrição Municipal) 
 * - endereco_fil (Endereço)
 * - bairro_fil (Bairro)
 * - cidade_fil (Cidade)
 * - estado_fil (UF)
 * - cep_fil (CEP)
 * - fone_fil (Telefone)
 * - cnae_fil (CNAE Fiscal)
 * - crt_fil (Código Regime Tributário: 1=Simples Nacional)
 * - codigo_municipio_fil (Código IBGE)
 */
@Entity
@Table(name = "filial")
@Data
public class FilialNfe {

    @Id
    @Column(name = "id_fil", precision = 10, scale = 0)
    private Integer idFil;

    @Column(name = "nome_fil", length = 50)
    private String nomeFil;

    @Column(name = "cnpj_fil", length = 50)
    private String cnpjFil;

    @Column(name = "logo_fil")
    private byte[] logoFil;

    @Column(name = "logop_fil")
    private byte[] logopFil;

    // Novos campos para NF-e (adicionar na tabela)
    @Column(name = "inscr_estadual_fil", length = 30)
    private String inscrEstadualFil;

    @Column(name = "inscr_municipal_fil", length = 30)
    private String inscrMunicipalFil;

    @Column(name = "endereco_fil", length = 100)
    private String enderecoFil;

    @Column(name = "bairro_fil", length = 50)
    private String bairroFil;

    @Column(name = "cidade_fil", length = 50)
    private String cidadeFil;

    @Column(name = "estado_fil", length = 2)
    private String estadoFil;

    @Column(name = "cep_fil", length = 10)
    private String cepFil;

    @Column(name = "fone_fil", length = 20)
    private String foneFil;

    @Column(name = "cnae_fil", length = 20)
    private String cnaeFil;

    @Column(name = "crt_fil", length = 1)
    private String crtFil;

    @Column(name = "codigo_municipio_fil", length = 10)
    private String codigoMunicipioFil;

    /**
     * Retorna o CNPJ formatado para a tag CNPJ do XML
     */
    public String getCnpjXml() {
        if (cnpjFil != null && cnpjFil.length() >= 14) {
            return cnpjFil.replaceAll("[^0-9]", "");
        }
        return cnpjFil;
    }

    /**
     * Retorna o CRT para o XML
     * Padrão: 1 = Simples Nacional
     */
    public String getCrtXml() {
        return crtFil != null ? crtFil : "1";
    }

    /**
     * Retorna o código do município IBGE
     */
    public String getCodigoMunicipioXml() {
        return codigoMunicipioFil != null ? codigoMunicipioFil : "3550308"; // São Paulo padrão
    }
}

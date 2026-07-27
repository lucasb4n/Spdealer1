       IDENTIFICATION DIVISION.
       PROGRAM-ID.    EST032.
       AUTHOR.        MARCOS WILCEKI.
       INSTALLATION.  SEPROCOM SOFTWARE & SERVIÇOS.
       DATE-WRITTEN.  18/10/2000.
       DATE-COMPILED.
      *----------------------------------------------------------------*
      *            CADASTRO DE FROTA                                   *
      *----------------------------------------------------------------*
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SPECIAL-NAMES.
           DECIMAL-POINT IS COMMA
           call-convention 74 is WINAPI.
      *----------------------------------------------------------------*
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
        COPY "MASUSU.SLC".
      **********************************************************
      *     ARQUIVO C/DADOS DO CADASTRO DE USUARIOS            *
      **********************************************************
           SELECT MASUSU ASSIGN        TO  PATH-MASUSU
                         ORGANIZATION  IS  INDEXED
                         ACCESS MODE   IS  DYNAMIC
                         LOCK   MODE   IS  AUTOMATIC                     
                         RECORD   KEY  IS  CHAVE-USU
               ALTERNATE RECORD KEY    IS  CHAVE-USUAR-A01 =
                         N0ME-USU OF REG-USU
                         WITH              DUPLICATES        
               ALTERNATE RECORD KEY    IS  CHAVE-USUAR-A02 =
                         LOGIN-USU OF REG-USU
                         WITH              DUPLICATES
                         FILE STATUS   IS  VERFS.
        COPY "MASGER.SLC".
      **********************************************************
      *     ARQUIVO C/DADOS GERAIS                             *
      **********************************************************
           SELECT MASGER ASSIGN        TO  PATH-MASGER
                         ORGANIZATION  IS  INDEXED
                         ACCESS MODE   IS  DYNAMIC
                         LOCK   MODE   IS  AUTOMATIC                     
                         RECORD   KEY  IS  CHAVE-GER =
                                           NUMEMPR-GER OF REG-GER
                         FILE STATUS   IS  VERFS.

           COPY "MASFIL.SLC".
      **********************************************************
      *     ARQUIVO C/DADOS GERAIS - FILIAL                       *
      **********************************************************
           SELECT MASFIL ASSIGN        TO  PATH-MASFIL
                         ORGANIZATION  IS  INDEXED
                         ACCESS MODE   IS  DYNAMIC
                         LOCK   MODE   IS  AUTOMATIC                     
                         RECORD   KEY  IS  CHAVE-FIL =
                                           EMPRESA-FIL OF REG-FIL
                                           CODIGO-FIL  OF REG-FIL
                         FILE STATUS   IS  VERFS.

        COPY "MASVEN.SLC".
      **********************************************************
      *     ARQUIVO C/DADOS CADASTRO DE VENDEDORES             *
      **********************************************************
           SELECT MASVEN  ASSIGN        TO  PATH-MASVEN
                          ORGANIZATION  IS  INDEXED
                          ACCESS MODE   IS  DYNAMIC
                          LOCK   MODE   IS  AUTOMATIC                    
                          RECORD   KEY  IS  CHAVE-VEN = 
                                            LOJA-VEN   OF REG-VEN 
                                            COD-VEN    OF REG-VEN

                ALTERNATE RECORD   KEY  IS  CHAVE-VEN-A01 = 
                                            LOJA-VEN   OF REG-VEN
                                            NOME-VEN   OF REG-VEN
                          WITH DUPLICATES
                ALTERNATE RECORD   KEY  IS  CHAVE-VEN-A02 = 
                                            LOJA-VEN   OF REG-VEN 
                                            CCUSTO-VEN OF REG-VEN
                                            COD-VEN    OF REG-VEN
                          WITH DUPLICATES
                          FILE STATUS   IS  VERFS.
        COPY "MASPUB.SLC".
      **********************************************************
      *     ARQUIVO C/DADOS DE PUBLICO                         *
      **********************************************************
           SELECT MASPUB ASSIGN         TO  PATH-MASPUB
                          ORGANIZATION  IS  INDEXED
                          ACCESS MODE   IS  DYNAMIC
                          LOCK   MODE   IS  AUTOMATIC                    
                          RECORD   KEY  IS  CHAVE-PUB = 
                                            CODIGO-PUB OF REG-PUB
                ALTERNATE RECORD   KEY  IS CHAVE-PUB-A01 =
                                            DESCR-PUB  OF REG-PUB
                          FILE STATUS   IS  VERFS.
        COPY "FROTA.SLC".
      *--------------------------------------------------------*
      *     ARQUIVO C/DADOS FROTA                              *
      *--------------------------------------------------------*
           SELECT FROTA  ASSIGN        TO  PATH-FROTA
                         ORGANIZATION  IS  INDEXED
                         ACCESS MODE   IS  DYNAMIC
                         LOCK   MODE   IS  AUTOMATIC
                         RECORD   KEY  IS  CHAVE-FRO =
                                   FRO-CLIENTE      OF REG-FRO
                                   FRO-CHASSI       OF REG-FRO
                         ALTERNATE RECORD KEY IS CHAVE-FRO-A01 =
                                   FRO-FABRICANTE   OF REG-FRO
                                   FRO-MODELO       OF REG-FRO
                                   FRO-CLIENTE      OF REG-FRO
                                   FRO-ANO          OF REG-FRO
                                   FRO-CHASSI       OF REG-FRO
                         WITH DUPLICATES
                         ALTERNATE RECORD KEY IS CHAVE-FRO-A02 =
                                   FRO-ANO          OF REG-FRO
                                   FRO-CLIENTE      OF REG-FRO
                                   FRO-MODELO       OF REG-FRO
                                   FRO-FABRICANTE   OF REG-FRO
                                   FRO-CHASSI       OF REG-FRO
                         WITH DUPLICATES                
                         ALTERNATE RECORD KEY IS CHAVE-FRO-A03 =
                                   FRO-DTPREV-TROCA OF REG-FRO
                                   FRO-CLIENTE      OF REG-FRO
                                   FRO-MODELO       OF REG-FRO
                                   FRO-FABRICANTE   OF REG-FRO
                                   FRO-ANO          OF REG-FRO
                                   FRO-CHASSI       OF REG-FRO
                         WITH DUPLICATES           
                         ALTERNATE RECORD KEY IS CHAVE-FRO-A04 =
                                   FRO-CHASSI       OF REG-FRO
                                   FRO-CLIENTE      OF REG-FRO
                         WITH DUPLICATES
                         FILE STATUS   IS  VERFS.
        COPY "CLIENTES.SLC".
      **********************************************************
      *     ARQUIVO C/DADOS DO CADASTRO DE CLIENTES            *
      *                     SEPROCOM                           *
      **********************************************************
         SELECT CLIENTES ASSIGN      TO  PATH-CLIENTES
                         ORGANIZATION  IS  INDEXED
                         ACCESS MODE   IS  DYNAMIC
                         LOCK   MODE   IS  AUTOMATIC WITH ROLLBACK
                         RECORD   KEY  IS  CHAVE-CLI =
                                           CLIFORN-CLI OF REG-CLI
                                           CODIGO-CLI  OF REG-CLI
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A05 =
                                          CLIFORN-CLI OF REG-CLI
                                          CGCCPF-CLI  OF REG-CLI
      *                  WITH DUPLICATES
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A01 =
                                           CLIFORN-CLI OF REG-CLI
                                           NOME-CLI    OF REG-CLI
                         WITH DUPLICATES
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A02 =
                                           CLIFORN-CLI OF REG-CLI
                                           NOMEFAN-CLI OF REG-CLI
                                           CODIGO-CLI  OF REG-CLI
                         WITH DUPLICATES                         
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A03 =
                                           CLIFORN-CLI OF REG-CLI
                                           TIPOPESSOA-CLI OF REG-CLI
                                           CGCCPF-CLI OF REG-CLI
                         WITH DUPLICATES
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A04 =
                                          CLIFORN-CLI OF REG-CLI
                                          DATCADI-CLI OF REG-CLI
                                          CODIGO-CLI  OF REG-CLI
                         WITH DUPLICATES
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A06 =
                                           CLIFORN-CLI OF REG-CLI
                                           UF-CLI     OF REG-CLI
                                           CIDADE-CLI OF REG-CLI
                         WITH DUPLICATES
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A07 =
                                          DATALT-CLI  OF REG-CLI
                                          CLIFORN-CLI OF REG-CLI
                                          CODIGO-CLI  OF REG-CLI
                         WITH DUPLICATES
                         ALTERNATE RECORD KEY IS CHAVE-CLI-A08 =
                                          CLIFORN-CLI OF REG-CLI
                                          RUC-CLI     OF REG-CLI
                                          RUCDIG-CLI  OF REG-CLI
                         WITH DUPLICATES
                         FILE STATUS   IS  VERFS.


      **********************************************************
      *     ARQUIVO C/DADOS DO CADASTRO DE CLIENTES            *
      *                     SEPROCOM                           *
      **********************************************************
         SELECT CLIFIS   ASSIGN      TO  PATH-CLIFIS
                         ORGANIZATION  IS  INDEXED
                         ACCESS MODE   IS  DYNAMIC
                         LOCK   MODE   IS  AUTOMATIC
                         RECORD   KEY  IS  CHAVE-CLIF =
                                           FILIAL-CLIF  OF REG-CLIF
                                           CLIFORN-CLIF OF REG-CLIF
                                           CGCCPF-CLIF  OF REG-CLIF
                         FILE STATUS   IS  VERFS.


        COPY "MODELOS.SLC".
           SELECT MODELOS   ASSIGN PATH-MODELOS
           ORGANIZATION     INDEXED
           ACCESS           DYNAMIC
           LOCK   MODE   IS  AUTOMATIC
           RECORD           KEY IS CHAVE-MOD =
                            CODIGO-MOD OF REG-MOD
           ALTERNATE RECORD KEY IS CHAVE-MOD-A01 =
                            MODELO-MOD OF REG-MOD
           WITH DUPLICATES
           ALTERNATE RECORD KEY IS CHAVE-MOD-A02 =
                            GRUPO-MOD OF REG-MOD
           WITH DUPLICATES
           FILE STATUS      IS VERFS.
        COPY "SEGMENTO.SLC".
           SELECT SEGMENTO  ASSIGN PATH-SEGMENTO
           ORGANIZATION     INDEXED
           ACCESS           DYNAMIC
           LOCK   MODE      IS AUTOMATIC WITH ROLLBACK
           RECORD           KEY IS CHAVE-SEG     =
                            CHASSI-SEG  OF REG-SEG
           ALTERNATE RECORD KEY IS CHAVE-SEG-A01 =
                            CLIENTE-SEG OF REG-SEG
           WITH DUPLICATES
           ALTERNATE RECORD KEY IS CHAVE-SEG-A02 =
                            PLACA-SEG   OF REG-SEG
           WITH DUPLICATES
           ALTERNATE RECORD KEY IS CHAVE-SEG-A03 =
                            2CHASSI-SEG   OF REG-SEG
           WITH DUPLICATES
           ALTERNATE RECORD KEY IS CHAVE-SEG-A04 =
                            DTFATREV-SEG  OF REG-SEG
           WITH DUPLICATES
           ALTERNATE RECORD KEY IS CHAVE-SEG-A05 =
                            KM-SEG   OF REG-SEG
           WITH DUPLICATES
           ALTERNATE RECORD KEY IS CHAVE-SEG-A06 =
                            CODMOD-SEG  OF REG-SEG
           WITH DUPLICATES
           FILE STATUS      IS VERFS.
        COPY "FABRIC.SLC".
      *--------------------------------------------------------*
      *     ARQUIVO C/DADOS FABRICANTES DE VEICULOS            *
      *--------------------------------------------------------*
          SELECT FABRIC  ASSIGN        TO  PATH-FABRIC
                         ORGANIZATION  IS  INDEXED
                         ACCESS MODE   IS  DYNAMIC
                         LOCK   MODE   IS  AUTOMATIC
                         RECORD   KEY  IS  CHAVE-FABR =
                                   FAB-CODIGO      OF REG-FABR
                         ALTERNATE RECORD KEY IS CHAVE-FABR-A01 =
                                   FAB-DESCRICAO   OF REG-FABR
                         WITH DUPLICATES
                         FILE STATUS   IS  VERFS.
        COPY "CORDENADAS.SLC".
      **********************************************************
      *     ARQUIVO C/DADOS CORDENADAS                         *
      **********************************************************
           SELECT CORDENADAS ASSIGN         TO  PATH-CORDENADAS
                          ORGANIZATION  IS  INDEXED
                          ACCESS MODE   IS  DYNAMIC
                          LOCK   MODE   IS  AUTOMATIC                    
                          RECORD   KEY  IS  CHAVE-COR = 
                                            CIDADE-COR OF REG-COR
                                            ESTADO-COR OF REG-COR
                                            BAIRRO-COR OF REG-COR
                          FILE STATUS   IS  VERFS.
        COPY "LOG.SLC".
      **********************************************************
      *     LOG DO SISTEMA SEPRODEALER                         *
      **********************************************************
           SELECT LOG     ASSIGN        TO  PATH-LOG
                          ORGANIZATION  IS  INDEXED
                          ACCESS MODE   IS  DYNAMIC
                          LOCK   MODE   IS  AUTOMATIC                    
                          RECORD   KEY  IS  ID-LOG =
                                   FILIAL-LOG   OF REG-LOG
                                   CHAVE-LOG    OF REG-LOG
                 ALTERNATE RECORD KEY IS     CHAVE-LOG-A01 =
                                   FILIAL-LOG   OF REG-LOG
                                   USUARIO-LOG  OF REG-LOG
                                   CHAVE-LOG    OF REG-LOG
                          WITH DUPLICATES 
                 ALTERNATE RECORD KEY IS     CHAVE-LOG-A02 =
                                   FILIAL-LOG   OF REG-LOG
                                   PROGRAMA-LOG OF REG-LOG
                                   CHAVE-LOG    OF REG-LOG
                          WITH DUPLICATES 
                          FILE STATUS   IS  VERFS.
      *----------------------------------------------------------------*
       DATA DIVISION.
       FILE SECTION.
        COPY "MASUSU.FD".
       FD  MASUSU.
       01  REG-USU.
           05 CHAVE-USU       PIC 9(010).
           05 LOGIN-USU       PIC X(020).
           05 N0ME-USU        PIC X(050).
           05 DOCUMENTO-USU   PIC X(030).
           05 ACESSO-USU      PIC 9(001).
           05 SENHA-USU       PIC X(064).
           05 CARGO-USU       PIC X(030).
           05 APELIDO-USU     PIC X(020).
           05 LIBPREC-USU     PIC 9(001).
           05 PROG-USU        PIC X(008).
           05 DEPTO-USU       PIC 9(003).
           05 PARAMETROS-USU  PIC 9(001).
           05 PECAS-USU       PIC 9(001).
           05 VEICULOS-USU    PIC 9(001).
           05 SERVICOS-USU    PIC 9(001).
           05 CONTABIL-USU    PIC 9(001).
           05 FINANCEIRO-USU  PIC 9(001).
           05 COMPRAS-USU     PIC 9(001).
           05 FATURAMENTO-USU PIC 9(001).
           05 GERENCIAL-USU   PIC 9(001).
           05 VENDAS-USU      PIC 9(001).
           05 CONTROLE-USU    PIC 9(001).
           05 SISTEMATICA-USU PIC 9(001).
           05 INVENTA-USU     PIC 9(001).
           05 CPD-USU         PIC 9(001).
           05 IMPPEC-USU      PIC X(029).
           05 IMPSER-USU      PIC X(029).
           05 IMPREQ-USU      PIC X(029).
           05 IMPOS-USU       PIC X(029).
           05 BOLETO-USU      PIC X(029).
           05 IMPORCS-USU     PIC X(029).
           05 IMPVEI-USU      PIC X(029).
           05 EMP-USU         PIC 9(003).
           05 EMP-USU1        PIC 9(003).
           05 EMP-USU2        PIC 9(003).
           05 EMP-USU3        PIC 9(003).
           05 EMP-USU4        PIC 9(003).
           05 EMP-USU5        PIC 9(003).
           05 ALTERCLI-USU    PIC 9(001).
           05 IMPETI-USU      PIC X(029).
           05 LIBNIVEL-USU    PIC 9(001).
           05 LIBDEVPECAS-USU PIC 9(001).
           05 IMPCHQ-USU      PIC X(029).
           05 RENTAL-USU      PIC 9(001).
           05 ALTCX-USU       PIC 9(001).
           05 IMPNFS-USU      PIC X(029).
           05 LOCALAUT-USU    PIC 9(003).
           05 GRAVACLI-USU    PIC 9(001).
           05 PEGASEN-USU     PIC 9(001).
           05 CONTRATO-USU    PIC 9(001).
           05 DELOS-USU       PIC 9(001).
           05 MARGEN-USU      PIC 9(001).
           05 EMAIL-USU       PIC X(050).
           05 STATUSVEI-USU   PIC 9(001).
           05 COD-GERENTE-USU PIC 9(010) COMP-3.
           05 RECEBE-SMS-USU  PIC X(001).
           05 GERENTE-USU     PIC X(001).
           05 TELEFONE-USU    PIC 9(013).
           05 FRM-CODIGO      PIC 9(011) COMP-5.
           05 FILLER          PIC X(023).
        COPY "MASGER.FD".
       FD  MASGER.
       01  REG-GER.
           05 NUMEMPR-GER         PIC 9(003).
           05 CGC-GER             PIC 9(014).
           05 INSCRIC-GER         PIC X(020).
           05 VALIDA-GER          PIC X(001) OCCURS 100.
           05 FILLER REDEFINES VALIDA-GER.
              10 NOME-GER         PIC X(060).
              10 RESPONSAVEL-GER  PIC X(040).
           05 ENDERECO-GER        PIC X(050).
           05 CIDADE-GER          PIC X(050).
           05 ESTADO-GER          PIC X(002).
           05 CEP-GER             PIC 9(008) COMP-3.
           05 PREF-GER            PIC 9(003) COMP-3.
           05 FONE-GER            PIC 9(008) COMP-3.
           05 FAX-GER             PIC 9(007) COMP-3.
           05 ULTCLI-GER          PIC 9(006) COMP-3.
           05 ULTEST-GER          PIC 9(006) COMP-3.
           05 LUCRODES-GER        PIC 9(001).
           05 VALDAT-GER          PIC 9(008)  COMP-3.
           05 VALNUM-GER          PIC 9(006)  COMP-3.
           05 VALSYS-GER          PIC X(001).
           05 VALSEG-GER          PIC 9(006) COMP-3.
           05 ULTPED-GER          PIC 9(006) COMP-3.
           05 ULTFOR-GER          PIC 9(006) COMP-3.
           05 ULTCUP-GER          PIC 9(008) COMP-3.
           05 SERIESAI-GER        PIC X(002).
           05 ULTNOTSAI-GER       PIC 9(008) COMP-3.
           05 SERIEENT-GER        PIC X(002).
           05 ULTNOTENT-GER       PIC 9(008) COMP-3.
           05 CONTASREC-GER       PIC X(001).
           05 CONTASPAG-GER       PIC X(001).
           05 ULTFAT-GER          PIC 9(006) COMP-3.
           05 ULTDUP-GER          PIC 9(006) COMP-3.
           05 ULTLIVDUP-GER       PIC 9(003) COMP-3.
           05 ULTFLHDUP-GER       PIC 9(003) COMP-3.
           05 ARREDONDA-GER       PIC X(001).
           05 ULTORC-GER          PIC 9(006) COMP-3.
           05 MENEMPRE-GER        PIC X(008).
           05 PIS-GER             PIC 9(003)V9(004) COMP-3.
           05 PERADM-GER          PIC 9(003)V9(004) COMP-3.
           05 ALIQISS-GER         PIC 9(003)V999999 COMP-3.
           05 COFINS-GER          PIC 9(003)V9(004) COMP-3.
           05 ULTPROP-GER         PIC 9(010) COMP-3.
           05 ULTOS-GER           PIC 9(008) COMP-3.
           05 ULTREQ-GER          PIC 9(008) COMP-3.
           05 ULTORCS-GER         PIC 9(008) COMP-3.
           05 VERSAO-GER          PIC 9(008) COMP-3.
           05 MONTADORA-GER       PIC X(015).
           05 CODFAB-GER          PIC X(015).
           05 USANOTA-GER         PIC 9(001).
           05 TRIBFRET-GER        PIC 9(001).
           05 PEDRES-GER          PIC X(001).
           05 NROSERV-GER         PIC 9(002).
           05 INSCRMUN-GER        PIC X(020).
           05 FABSER-GER          PIC X(001).
           05 DESCSER-GER         PIC X(040).
           05 SITRIB-GER          PIC X(002).
           05 TIPOGAR-GER         PIC X(002).
           05 GRALTO-GER          PIC 9(002).
           05 GRBAIXO-GER         PIC 9(002).
           05 CURVAA-GER          PIC 9(002).
           05 CURVAB-GER          PIC 9(002).
           05 CURVAC-GER          PIC 9(002).
           05 CURVAX-GER          PIC 9(002).
           05 CURVAY-GER          PIC 9(002).
           05 CURVAZ-GER          PIC 9(002).
           05 BARATO-GER          PIC 9(006)V99 COMP-3.
           05 MEDIO-GER           PIC 9(006)V99 COMP-3.
           05 SALDONEG-GER        PIC 9(001).
           05 SEMMOV-GER          PIC 9(003).
           05 DPPECAS-GER         PIC 9(003).
           05 DPSERV-GER          PIC 9(003).
           05 VEICNOV-GER         PIC 9(003).
           05 VEICUSA-GER         PIC 9(003).
           05 CAMIFIS-GER         PIC X(030).
           05 ULTINSTFAT-GER      PIC 9(008)    COMP-3.
           05 TIMER-GER           PIC 9(008)    COMP-3.
           05 TURNO2-GER          PIC 9(002)V99 COMP-3.
           05 TURNO3-GER          PIC 9(002)V99 COMP-3.
           05 TURNO4-GER          PIC 9(002)V99 COMP-3.
           05 TURNO5-GER          PIC 9(002)V99 COMP-3.
           05 TURNO6-GER          PIC 9(002)V99 COMP-3.
           05 EMINFOSIN-GER       PIC X(001).
           05 LOCACAO-GER         PIC 9(001).
           05 NRECF-GER           PIC 9(003).
           05 IMPSERV-GER         PIC X(001).
           05 ISSCOL-GER          PIC X(001).
           05 DEVSER-GER          PIC 9(001).
           05 QTDIABLOQ-GER       PIC 9(003).
           05 MOTBLOQ-GER         PIC X(025).
           05 NAOBLOQVEI-GER      PIC 9(001).
           05 MASCARA-GER         PIC 9(001).
           05 BAIRRO-GER          PIC X(030).
           05 SAIREMNOESTADO-GER  PIC 9(003).
           05 ENTREMNOESTADO-GER  PIC 9(003).
           05 SAIREMOUTROSEST-GER PIC 9(003).
           05 ENTREMOUTROSEST-GER PIC 9(003).
           05 FINANCONSOL-GER     PIC 9(003).
           05 ADTORECPAG-GER      PIC X(001).
           05 CODADTO-GER         PIC 9(002).
           05 LIBAUTOMATICA-GER   PIC 9(001).
           05 NUMITENSREQ-GER     PIC 9(003) COMP-3.
           05 FICHAVEICULO-GER    PIC X(001).
           05 ESTCRIMIN-GER       PIC 9(002).
           05 ESTCRIMAX-GER       PIC 9(002).
           05 NIVEL-GER           PIC 9(003) COMP-3.
           05 DATENCERCR-GER      PIC 9(008) COMP-3.
           05 DATENCERCP-GER      PIC 9(008) COMP-3.
           05 DATENCERCX-GER      PIC 9(008) COMP-3.
           05 IMPACE-GER          PIC X(001).
           05 NOTAUNIC-GER        PIC X(001).
           05 QTDIAORC-GER        PIC 9(003).
           05 CURVAD-GER          PIC 9(002).
           05 CODDEVCPR-GER       PIC 9(002).
           05 PECFAL-GER          PIC X(001).
           05 DOCENTVU-GER        PIC 9(003).
           05 COBENTVU-GER        PIC 9(003).
           05 PRZVENCENTVU-GER    PIC 9(002).
           05 GRAVARENTVU-GER     PIC X(001).
           05 IDIOMA-GER          PIC X(001).
           05 UNICOCLI-GER        PIC X(001).
           05 MAQ-GER             PIC X(001).
           05 PAIS-GER            PIC X(003).
           05 EMINFSERVCONT-GER   PIC X(001).
           05 MOEDA-GER           PIC X(003).
           05 RESERVA-MOEDA-GER   PIC X(002).
           05 TIPOSER-GER         PIC X(002).
           05 ALIQITBIS-GER       PIC 9(002)V99 COMP-3.
           05 ANOMES-GER          PIC 9(006).
           05 INATIVA-GER         PIC 9(004).
           05 ULTPEDE-GER         PIC 9(006) COMP-3.
           05 RECMERC-GER         PIC 9(006) COMP-3.
           05 EXTCHQ-GER          PIC X(001).
           05 CMSAINOESTADO-GER   PIC 9(003).
           05 CMSAIOUTROSEST-GER  PIC 9(003).
           05 CMTIPOSER-GER       PIC X(002).
           05 RUC-GER             PIC X(001).
           05 CREDIPI-GER         PIC X(001).
           05 DESCIPI-GER         PIC X(001).
           05 DEVCOMPRA-GER       PIC X(001).
           05 SAIDEMNOESTADO-GER  PIC 9(003).
           05 ENTDEMNOESTADO-GER  PIC 9(003).
           05 SAIDEMOUTROSEST-GER PIC 9(003).
           05 ENTDEMOUTROSEST-GER PIC 9(003).
           05 ULTTRANS-GER        PIC 9(006).
           05 IMPOSTO-GER         PIC X(010).
           05 OSUNICA-GER         PIC X(001).
           05 SUBNBM-GER          PIC X(001).
           05 MSGSUB-GER          PIC X(100).
           05 SERIESER-GER        PIC X(002).
           05 ULTNOTSER-GER       PIC 9(008).
           05 FILNOT-GER          PIC 9(003).
           05 NAOMODELO-GER       PIC X(001).
           05 FILNOTE-GER         PIC 9(003).
           05 MOSTRAVEN-GER       PIC X(001).
           05 REGIAO-GER          PIC X(001).
           05 VEIFILIAL-GER       PIC 999.
           05 CODNATGARE1-GER     PIC 9(003).
           05 CODNATGARE2-GER     PIC 9(003).
           05 FAB-GER             PIC X.
           05 CODNATGARR1-GER     PIC 9(003).
           05 CODNATGARR2-GER     PIC 9(003).
           05 ALIQICM-GER         PIC 9(003)V99 COMP-3.
           05 EST157-GER          PIC X(001).
           05 USALIB-GER          PIC X(001).
           05 FINSEMIF-GER        PIC X(001).
           05 DPLOC-GER           PIC 9(003).
           05 OUTRANFSER-GER      PIC X(001).
           05 ORCSOVEND-GER       PIC X(001).
           05 DIASAGE-GER         PIC 9(003).
           05 IANOMES-GER         PIC 9(006).
           05 TITOBS-GER          PIC X(001).
           05 FRETSB-GER          PIC X(001).
           05 SDONEGEXCENT-GER    PIC X(001).
           05 EMITIRSODUP-GER     PIC X(001).
           05 RUCDIG-GER          PIC X(002).
           05 DTREMESSA-GER       PIC 9(008) COMP-3.
           05 ANOMESINV-GER       PIC 9(006).
           05 EQUIPARADA-GER      PIC X(001).
           05 AGENDAREVISAO-GER   PIC X(001).
           05 REVISAO1-GER        PIC 9(006).
           05 REVISAO2-GER        PIC 9(006).
           05 REVISAO3-GER        PIC 9(006).
           05 REVISAO4-GER        PIC 9(006).
           05 REVISAO5-GER        PIC 9(006).
           05 REVISAO6-GER        PIC 9(006).
           05 REVISAO7-GER        PIC 9(006).
           05 REVISAO8-GER        PIC 9(006).
           05 REVISAO9-GER        PIC 9(006).
           05 DIASTRAZ-GER        PIC 9(003).
           05 DIASAVISO-GER       PIC 9(003).
           05 PISSER-GER          PIC 9(003)V9(004) COMP-3.
           05 CSLL-GER            PIC 9(003)V9(004) COMP-3.
           05 COFSER-GER          PIC 9(003)V9(002) COMP-3.
           05 OPEJUR-GER          PIC 9(003).
           05 OPEDESC-GER         PIC 9(003).
           05 OPEABAT-GER         PIC 9(003).
           05 OPEOCRED-GER        PIC 9(003).
           05 OPEIOF-GER          PIC 9(003).
           05 OPEDESP-GER         PIC 9(003).
           05 OPEODESP-GER        PIC 9(003).
           05 PRECOMATRIZ-GER     PIC X(001).
           05 REMCXBCO-GER        PIC 9(001).
           05 ULTNOTCOM-GER       PIC 9(006)  COMP-3.
           05 SERIECOM-GER        PIC X(002).
           05 LOTE-GER            PIC 9(008).
           05 QTDIAOCPEND-GER     PIC 9(003).
           05 CONSISNBM-GER       PIC X(001).
           05 MAISIPI-GER         PIC 9(001).
           05 SUPERMP35-GER       PIC 9(007)V99 COMP-3.
           05 CRMCAMINHO1-GER     PIC X(100).
           05 CRMCAMINHO2-GER     PIC X(100).
           05 QTDIABLOQI-GER      PIC 9(003).
           05 BRUTO-GER           PIC X(001).
           05 ORDSEP-GER          PIC 9(006).
           05 EMIDOLAR-GER        PIC X(001).
           05 GRAVACH-GER         PIC 9(001).
           05 NFS-E-GER           PIC 9(001).
           05 NSU-GER             PIC 9(010).
           05 NUMCONT-GER         PIC 9(005).
           05 ICMSFRETSB-GER      PIC X(001).
           05 TRANSFEST-GER       PIC 9(010).
           05 ULTPA-GER           PIC 9(006) COMP-3.
           05 LOCALXML-GER        PIC X(100).
           05 LOCALXML1-GER       PIC X(100).
           05 LOCALXML2-GER       PIC X(100).
           05 NFES-GER            PIC 9(001).
           05 ESPFIN-GER          PIC X(001).
           05 NROITENS-GER        PIC 9(003).
           05 SELREQ-GER          PIC 9(001).
           05 ULTFATLOC-GER       PIC 9(010).
           05 ALIQNV-GER          PIC 9(003)V99 COMP-3.
           05 ALIQUS-GER          PIC 9(003)V99 COMP-3.
           05 ALIQICMS-GER        PIC 9(003)V99 COMP-3.
           05 STFIN-GER           PIC 9(001).
           05 STTOT-GER           PIC 9(001).
           05 STSEMICMS-GER       PIC 9(001).
           05 IP-GER              PIC X(050).
           05 DB-GER              PIC X(050).
           05 OUTROSBCPISCOFINS-GER PIC X(001).
           05 ALIQICMI-GER        PIC 9(003)V99   COMP-3.
           05 PISIM-GER           PIC 9(003)V9(4) COMP-3.
           05 COFINSIM-GER        PIC 9(003)V9(4) COMP-3.
           05 PISIP-GER           PIC 9(003)V9(4) COMP-3.
           05 COFINSIP-GER        PIC 9(003)V9(4) COMP-3.
           05 PISVN-GER           PIC 9(003)V9(4) COMP-3.
           05 COFINSVN-GER        PIC 9(003)V9(4) COMP-3.
           05 PISVNI-GER          PIC 9(003)V9(4) COMP-3.
           05 COFINSVNI-GER       PIC 9(003)V9(4) COMP-3.
           05 PISVU-GER           PIC 9(003)V9(4) COMP-3.
           05 COFINSVU-GER        PIC 9(003)V9(4) COMP-3.
           05 LOCALXMLRPS-GER     PIC X(100).
           05 HRVERAO-GER         PIC X.
           05 DESTIMP-GER         PIC X.
           05 FREDIVST-GER        PIC X.
           05 TPAMB-GER           PIC X.
           05 NFVERSAO-GER        PIC X(004).
           05 DESCPROMOC-GER      PIC X(001).
           05 DESCONTR-GER        PIC X(001).
           05 OSSOVEND-GER        PIC X(001).
           05 SOMAPC-GER          PIC 9(001).
           05 CONTINGENCIA-GER    PIC 9.
           05 DHCONT-GER          PIC X(025).
           05 XJUST-GER           PIC X(050).
           05 CELULAR-GER         PIC X(009).
           05 WHATZ-GER           PIC X(009).
           05 FILLER              PIC X(014).



      ******************************************************************
      *Siglas Usadas nesta FD                                          *
      *----------------------------------------------------------------*
      *ULTOS-GER     - Ultimo Numero de Ordem de Serviço               *
      *ULTREQ-GER    - Ultimo Numero de Requisição de Material (peças) *
      *ULTORCS-GER   - Ultimo Numero de Orçamento de Serviços          *
      *EMINFOSIN-GER - EMITE NF P/ O.S. INTERNA                        *
      *DEVSER-GER    - Se devolve Serviço no EST019                    *
      *FINANCONSOL-GER - Informae se financ. é consolidado             *
      *ADTORECPAG-GER - [R]ADTO DO EST019 VAI PARA O RECEBER           *
      *                 [P]ADTO DO EST019 VAI PARA O PAGAR             *
      *CODADTO-GER    - CODIGO DO DOCUMENTO PARA ADTO DE CLIENTE       *
      *CACASTRACLI-GER- LIBERA USUARIO DE NF PARA CADASTRAR CLIENTE PRAZ
      *FICHAVEICULO-GER SE USA OS VALORES DO CADASTRO DE MODELO OU NAO
      *ESTCRIMIN-GER - ESTOQUE CRITICA MINIMO
      *ESTCRIMAX-GER - ESTOQUE CRITICA MAXIMO
      *DOCENTVU-GER - DOCTO.PAGAR P/ NOTA FISCAL ENTRADA VEIC.USADO    *
      *COBENTVU-GER - COB.PAGAR P/NOTA FISCAL ENTRADA VEIC.USADO       *
      *PRZVENCENTVU-GER - PRAZO PARA VENCTO TIM.ENTRADA VEIC.USADO.    *
      *GRAVARENTVU-GER - [P]AGAR [C]OMPROMISSO AONDE GRAVAR A ENTRADA  *
      *                  DE VEICULOS USADOS                            *
      *INATIVA-GER -   Quantidade de dias para jogar FLAG de inativa p/*
      *                a peça e mostrar no est002 e est006.            *
      *EXTCHQ-GER - [S/N] Se imprime o extenso no cheque               *
      *EST157-GER - CONTENDO A LETRA [R] (gabivel)
      *                       o calculo da margem é pela receita liquida
      *                       VALOR LIQUIDO - IMPOSTOS
      *             CONTENDO A LETRA [V] ou [ ] como é hoje
      *                       o calculo é pelo VALOR LIQUIDO DA VENDA
      *                       VALOR VENDA - DESCONTOS
      *FINSEMIF-GER - Grava financeiro sem Instr. Faturamento(VEI006)
      *TITOBS-GER - se igual "S" grava na remessa/retorno as ocorrencias
      *             dos Titulos enviados retornado dos bancos
      *EQUIPARADA-GER - SE = "S" A EMPRESA É EQUIPARADA A INDUSTRIA E
      *                 TEM CREDITO DE PIS(EST157)
      *PISSER-GER = Criada em fevereiro/04 para separar PIS de Serviços.
      *CSLL-GER = Criada fevereiro/04 lei de retenção para Serviços.
      ******************************************************************


       COPY "MASFIL.FD".
       FD  MASFIL.
       01  REG-FIL.
           05 EMPRESA-FIL         PIC 9(003).
           05 CODIGO-FIL          PIC X(003).
           05 NOME-FIL            PIC X(050).
           05 NOMEABR-FIL         PIC X(020).
           05 ENDERECO-FIL        PIC X(050).
           05 NUMERO-FIL          PIC X(010).
           05 BAIRRO-FIL          PIC X(040).
           05 CIDADE-FIL          PIC X(040).
           05 UF-FIL              PIC X(002).
           05 PREF-FIL            PIC X(003).
           05 FONE-FIL            PIC X(009).
           05 PREF1-FIL           PIC X(003).
           05 FONE1-FIL           PIC X(009).
           05 CEP-FIL             PIC X(008).
           05 PAIS-FIL            PIC X(040).
           05 DTCADASTRO-FIL      PIC 9(008) COMP-3.
           05 CODCID-FIL          PIC 9(006) COMP-3.
           05 CNPJ-FIL            PIC X(014).
           05 ULTPROP-FIL         PIC 9(010) COMP-3.
           05 ULTPED-FIL          PIC 9(008) COMP-3.
           05 ULTDUP-FIL          PIC 9(008) COMP-3.
           05 ULTEST-FIL          PIC 9(008) COMP-3.
           05 ULTCLIENTE-FIL      PIC 9(008) COMP-3.
           05 ULTFORNEC-FIL       PIC 9(008) COMP-3.
           05 ULTORCS-FIL         PIC 9(008) COMP-3.
           05 ULTORC-FIL          PIC 9(008) COMP-3.
           05 ULTOS-FIL           PIC 9(008) COMP-3.
           05 ULTREQ-FIL          PIC 9(008) COMP-3.
           05 SERIEENT-FIL        PIC X(002).
           05 ULTNOTENT-FIL       PIC 9(008) COMP-3.
           05 SERIESAI-FIL        PIC X(002).
           05 ULTNOTSAI-FIL       PIC 9(008) COMP-3.
           05 SERIESER-FIL        PIC X(002).
           05 ULTNOTSER-FIL       PIC 9(008) COMP-3.
           05 SERIECOM-FIL        PIC X(002).
           05 ULTNOTCOM-FIL       PIC 9(006)  COMP-3.
           05 NIVELPRE-SERV-FIL   PIC X(001).
           05 EXIBE-FIL           PIC X(050).
           05 EMAIL-FIL           PIC X(200).
           05 RESPOSTA-FIL        PIC X(200).
           05 SMTP-FIL            PIC X(200).
           05 PORTA-FIL           PIC 9(003).
           05 CONTA-FIL           PIC X(050).
           05 SENHA-FIL           PIC X(020).
           05 GRVA-TEMP-FIL       PIC X(001).
           05 DELETA-ITEM-FIL     PIC X(001).

      ******************************************************************

        COPY "MASVEN.FD".
       FD  MASVEN.
       01  REG-VEN.
           05 LOJA-VEN       PIC 9(003).
           05 FILIAL-VEN     PIC 9(003).
           05 COD-VEN        PIC 9(010).
           05 CCUSTO-VEN     PIC 9(003).          
           05 NOME-VEN       PIC X(050).
           05 APEL-VEN       PIC X(015).
           05 OBJETIVO-VEN   PIC 9(010)V99  COMP-3.
           05 QTDE-VEN       PIC 9(006)     COMP-3.
           05 COMISSAO-VEN   PIC 9(003)V999 COMP-3.
           05 COMILIQ-VEN    PIC 9(001).
           05 TIPO-VEN       PIC X(001).
           05 CODGER-VEN     PIC 9(003).
           05 COMGER-VEN     PIC 9(003)V999 COMP-3.
           05 CODSUP-VEN     PIC 9(003).
           05 COMSUP-VEN     PIC 9(003)V999 COMP-3.
           05 DESC-VEN       PIC 9(003)V99  COMP-3.
           05 DESCS-VEN      PIC 9(003)V99  COMP-3.
           05 CARGO-VEN      PIC X(050).
           05 LIMITE-VEN     PIC 9(010)V99  COMP-3.
           05 FILLER         PIC X(010).
      *--------------------------------------------------------------*
      *    Arquivo Contendo o Cadastro de Vendedores                 *
      *    AGENDA Ferreira Laurino                          07/04/1997*
      *--------------------------------------------------------------*
        COPY "MASPUB.FD".
       FD  MASPUB.
       01  REG-PUB.
           05 CODIGO-PUB     PIC 9(003).  
           05 DESCR-PUB      PIC X(020).
           05 DESCPEC-PUB    PIC 9(003)V99.
           05 DESCSER-PUB    PIC 9(003)V99.
           05 ACREPEC-PUB    PIC 9(003)V99.
           05 ACRESER-PUB    PIC 9(003)V99.
           05 FILLER         PIC X(050).
      *--------------------------------------------------------------*
      *    Arquivo Contendo os Cadastro de Publico                   *
      *    Paulo Ferreira Laurino                          07/04/1997*
      *--------------------------------------------------------------*
        COPY "FROTA.FD".
       FD  FROTA.
       01  REG-FRO.
           05 FRO-CLIENTE          PIC 9(014).
           05 FRO-MODELO           PIC X(010).
           05 FRO-FABRICANTE       PIC 9(004).
           05 FRO-ANO              PIC 9(004) COMP-3.
           05 FRO-CHASSI           PIC X(020).
           05 FRO-MOTOR            PIC X(030).
           05 FRO-SERIE            PIC X(020).
           05 FRO-KM               PIC 9(008) COMP-3.
           05 FRO-QTVEIC           PIC 9(005) COMP-3.
           05 FRO-QTPNEU           PIC 9(005) COMP-3.
           05 FRO-CARROCERIA       PIC X(050).
           05 FRO-QTPREV-TROCA     PIC 9(005).
           05 FRO-DTPREV-TROCA     PIC 9(008) COMP-3.
           05 FRO-DTCOMPRA         PIC 9(008) COMP-3.
           05 FRO-DTENTRTEC        PIC 9(008) COMP-3.
           05 FRO-VENDEDOR         PIC 9(010).
           05 FRO-FATUR            PIC X(001).
           05 FRO-NOVUSA           PIC X(001).
           05 FRO-PROGRAMA         PIC X(008).
           05 FRO-DESCMOD          PIC X(050).
           05 FRO-DTGARANTIA       PIC 9(008) COMP-3.
           05 FRO-POTCALC          PIC X(001).
           05 FRO-CIDADE           PIC X(050).
           05 FRO-UF               PIC X(002).

           05 FRO-LATITUDE         PIC S9(004)V999999 COMP-3.
           05 FRO-LONGITUDE        PIC S9(004)V999999 COMP-3.

           05 FRO-PLACA            PIC X(008).
           05 FRO-ANOMOD           PIC 9(004) COMP-3.

           05 FILLER               PIC X(164).

        COPY "CLIENTES.FD".
       FD  CLIENTES.
       01   REG-CLI.
           05 NOME-CLI             PIC X(100).
           05 DATCAD-CLI           PIC 9(008).
           05 DATCADI-CLI          PIC 9(008) COMP-3.
           05 CLIFORN-CLI          PIC X(001).          
           05 TIPOPESSOA-CLI       PIC X(001).
           05 CODIGO-CLI           PIC 9(007) COMP-3.
           05 CONJUGE-CLI          PIC X(050).
           05 CODFIA-CLI           PIC 9(005).
           05 CODFIA1-CLI          PIC 9(005).
           05 CODFIA2-CLI          PIC 9(005).
           05 CGCCPF-CLI           PIC 9(014).
           05 INSCEST-CLI          PIC X(020).
           05 INSCMUN-CLI          PIC X(030).
           05 IDENT-CLI            PIC X(020).
           05 ORGEMIS-CLI          PIC X(006).
           05 SEXO-CLI             PIC X(001).
           05 CIVIL-CLI            PIC X(015).
           05 NOMEFAN-CLI          PIC X(050).
           05 LOGRA-CLI            PIC X(100).
           05 BAIRRO-CLI           PIC X(050).
           05 CIDADE-CLI           PIC X(050).
           05 CEP-CLI              PIC 9(008).
           05 FONE-CLI             PIC 9(009).
           05 PREF-CLI             PIC 9(003).
           05 TMPRES-CLI           PIC X(010).
           05 LOGRA1-CLI           PIC X(100).
           05 BAIRRO1-CLI          PIC X(050).
           05 CIDADE1-CLI          PIC X(050).
           05 UF1-CLI              PIC X(002).
           05 CEP1-CLI             PIC 9(008).
           05 FONE1-CLI            PIC 9(009).
           05 PREF1-CLI            PIC 9(003).
           05 FAX-CLI              PIC 9(009).
           05 UF-CLI               PIC X(002).
           05 PAI-CLI              PIC X(050).
           05 MAE-CLI              PIC X(050).
           05 DATANASC-CLI         PIC 9(008) COMP-3.
           05 NATURAL-CLI          PIC X(020).
           05 CPFCONJ-CLI          PIC 9(011).
           05 IDECONJ-CLI          PIC 9(011).
           05 RENDA-CLI            PIC 9(010)V99 COMP-3.
           05 RENDOT-CLI           PIC 9(010)V99 COMP-3.
           05 RENDCONJ-CLI         PIC 9(010)V99 COMP-3.
           05 RENDTOT-CLI          PIC 9(010)V99 COMP-3.
           05 FONTREND-CLI         PIC X(013).
           05 CLIOFIC-CLI          PIC X(001).
           05 CLIVENDA-CLI         PIC X(001).
           05 DATATUAL-CLI         PIC 9(008) COMP-3.
           05 DATCOMP-CLI          PIC 9(008) COMP-3.
           05 DATBLOQ-CLI          PIC 9(008) COMP-3.
           05 DATLIB-CLI           PIC 9(008) COMP-3.
           05 MOTBLOQ-CLI          PIC X(040).
           05 MOTLIB-CLI           PIC X(040).
           05 LIMCRE-CLI           PIC 9(010)V99 COMP-3.
           05 PROF-CLI             PIC X(020).
           05 DATALT-CLI           PIC 9(008) COMP-3.
           05 CONTATOS-CLI         PIC X(020).
           05 CONTABIL-CLI         PIC X(013).
           05 INSTPROT-CLI         PIC 9(002).
           05 VENDEDOR-CLI         PIC 9(010).
           05 TIPOFOR-CLI          PIC 9(003).
           05 PREFCEL-CLI          PIC 9(003).
           05 CELULAR-CLI          PIC 9(009).
           05 EMAIL1-CLI           PIC X(500).
           05 COMISSAO-CLI         PIC 9(003)V99 COMP-3.
           05 DESPESA-CLI          PIC 9(010)V99 COMP-3.
           05 RAMAL1-CLI           PIC 9(004).
           05 OBSERV-CLI           PIC X(300).
           05 DTNASCONJ-CLI        PIC 9(008)   COMP-3.
           05 VLRALUGUEL-CLI       PIC 9(010)V99 COMP-3.
           05 COMISSAOAVI-CLI      PIC 9(003)V99 COMP-3.
           05 PERCDESC-CLI         PIC 9(002)V99 COMP-3.
           05 CODATIV1-CLI         PIC 9(003).
           05 CODATIV2-CLI         PIC 9(003).
           05 CODATIV3-CLI         PIC 9(003).
           05 CODATIV4-CLI         PIC 9(003).
           05 VENDEDOR1-CLI        PIC 9(010).
           05 VENDEDOR2-CLI        PIC 9(010).
           05 VENDEDOR3-CLI        PIC 9(010).
           05 CODCOLIG1-CLI        PIC 9(005).
           05 CODCOLIG2-CLI        PIC 9(005).
           05 CODCOLIG3-CLI        PIC 9(005).
           05 CODCOLIG4-CLI        PIC 9(005).
           05 CODCOLIG5-CLI        PIC 9(005).
           05 LOCALCAD-CLI         PIC 9(003).
           05 BACEN-CLI            PIC 9(003).
           05 ATUALIZADO-CLI       PIC X(001).
           05 ATIVOINATIVO-CLI     PIC X(001). *> E = Excluido
           05 QTDIABLOQ-CLI        PIC 9(005).
           05 CODBCO-CLI           PIC 9(003).
           05 PREFCOB-CLI          PIC 9(003).
           05 FONECOB-CLI          PIC 9(009).
           05 RAMALCOB-CLI         PIC 9(004).
           05 AVALIA-CLI           PIC X(020).
           05 NAOLIB-CLI           PIC 9(001).
           05 ITBIS-ISENTO-CLI     PIC X(001).
           05 TIPCOB-CLI           PIC 9(002).
           05 CLIPNEU-CLI          PIC X(001).
           05 CLIVIP-CLI           PIC X(001).
           05 PROVINCIA-CLI        PIC X(030).
           05 PROVINCIA1-CLI       PIC X(030).
           05 TRANSPOR-CLI         PIC X.
           05 CLICONT-CLI          PIC X.
           05 RUC-CLI              PIC X(020).
           05 RUCDIG-CLI           PIC X(002).
           05 POSTAL-CLI           PIC X(030).
           05 ZONA-CLI             PIC X(003).
           05 TRIB-CLI             PIC 9(002).
           05 AGEPEC-CLI           PIC 9(003).
           05 AGESER-CLI           PIC 9(003).
           05 AGEMAQ-CLI           PIC 9(003).
           05 AGELOC-CLI           PIC 9(003).
           05 NAOMMI-CLI           PIC X(001).
           05 EXTERIOR-CLI         PIC 9(001).
           05 CODFOR-CLI           PIC 9(005).
           05 OPERCAI-CLI          PIC 9(005).
           05 REVENDA-CLI          PIC X(001).
           05 ETIQUETAS-CLI        PIC X(001).
           05 CLIUSADO-CLI         PIC X(001).
           05 CODAGEDA-CLI         PIC 9(003).
           05 NUMCTADA-CLI         PIC 9(014).
           05 ISSRET-CLI           PIC X(001).
           05 EMAIL-CLI            PIC X(350).
           05 RESTRICAO-CLI        PIC X(150).
           05 CONDPAG-CLI          PIC 9(003).
           05 NUMERO-CLI           PIC X(010).
           05 CLIPECAS-CLI         PIC X(001).
           05 NAOCONTR-CLI         PIC 9(001).
           05 FATLIQ-CLI           PIC 9(001).
           05 REGIAO-CLI           PIC 9(003).
           05 CONTR-CLI            PIC 9(001).
           05 TARE-CLI             PIC X(001).
           05 PROGRAMA-CLI         PIC X(008).
           05 USUARIO-CLI          PIC X(050).
           05 DTEXCL-CLI           PIC 9(008) COMP-3.
           05 LATITUDE-CLI         PIC S9(004)V999999 COMP-3.
           05 LONGITUDE-CLI        PIC S9(004)V999999 COMP-3.
           05 DESLMARG-CLI         PIC 9.
           05 CARGAMEDIA-CLI       PIC S9(003)V99 COMP-3.
           05 KMPERC-CLI           PIC 9(006).
           05 NFEAVISTA-CLI        PIC 9(001).
           05 VCTO-CLI             PIC 9(002).
           05 VLROBJPEC-CLI        PIC 9(010)V99 COMP-3.
           05 VLROBJSER-CLI        PIC 9(010)V99 COMP-3.
           05 FONE2-CLI            PIC 9(009).
           05 CODAPI-CLI           PIC X(050).
           05 FILLER               PIC X(012).

       FD  CLIFIS.
       01  REG-CLIF.
           05 FILIAL-CLIF          PIC 9(003).
           05 CLIFORN-CLIF         PIC X(001).
           05 CGCCPF-CLIF          PIC 9(014).
           05 ISSRET-CLI           PIC X(001).
           05 PISCOFCSL-CLI        PIC X(001).
           05 PERCISS-CLI          PIC S9(002)V99 COMP-3.
           05 PERCSUB-CLI          PIC S9(003)V99 COMP-3.
           05 IRRRET-CLI           PIC X(001).
           05 PERCIRR-CLI          PIC S9(002)V99 COMP-3.
           05 INSSRET-CLI          PIC X(001).
           05 PERCINSS-CLI         PIC S9(002)V99 COMP-3.
           05 DEDUZIRET-CLI        PIC X(001).
           05 BRISS-CLI            PIC S9(002)V99 COMP-3.
           05 BRINSS-CLI           PIC S9(002)V99 COMP-3.
           05 DEDUZI1RET-CLI       PIC X(001).
           05 OPTSIMPLES-CLI       PIC 9(001).
           05 FILLER               PIC X(190).

        COPY "MODELOS.FD".
       FD  MODELOS.
       01  REG-MOD.
           02 CODIGO-MOD        PIC X(010).
           02 MODELO-MOD        PIC X(050).
           02 DESCNOT-MOD       PIC X(050).
           02 GRUPO-MOD         PIC X(030).
           02 CATVEI-MOD        PIC 9(003).
           02 TABOPC-MOD        PIC 9(003).
           02 TRBFRE-MOD        PIC 9(003).
           02 TRBVEI-MOD        PIC 9(002).
           02 TRBSEG-MOD        PIC 9(002).
           02 TRBOPC-MOD        PIC 9(002).
           02 TABCOR-MOD        PIC 9(002).
           02 RENAVAM-MOD       PIC X(010).
           02 CODDESC-MOD       PIC X(010).
           02 FORMCUST-MOD      PIC X(010).
           02 DESCMOTOR-MOD     PIC X(030).           
           02 LUGARES-MOD       PIC 9(002).           
           02 CILINDROS-MOD     PIC 9(002).           
           02 POTENCIA-MOD      PIC 9(003).
           02 VALOR-MOD         PIC 9(012)V9(04) COMP-3.
           02 REPOSICAO-MOD     PIC 9(012)V9(04) COMP-3.
           02 FRETE-MOD         PIC 9(012)V9(04) COMP-3.
           02 REVISAO-MOD       PIC 9(012)V9(04) COMP-3.
           02 OPC-MOD           PIC X(010) OCCURS  20.
           02 COMBUST-MOD       PIC X(001).
           02 PORTAS-MOD        PIC 9(001).
           02 CAPAC-MOD         PIC 9(004).
           02 PBT-MOD           PIC 9(005).
           02 POM-MOD           PIC 9(004).
           02 TPGARANJ-MOD      PIC 9(002).
           02 KMGARANJ-MOD      PIC 9(006).
           02 TPGARANF-MOD      PIC 9(002).
           02 KMGARANF-MOD      PIC 9(006).
           02 TRAS-MOD          PIC X(004).
           02 MODCONT-MOD       PIC X(010).
           02 FABRICANTE-MOD    PIC X(016).
           02 CODFAB-MOD        PIC 9(004).
           02 DTALTER-MOD       PIC 9(008).
           02 DESCMOTORT-MOD    PIC X(300).
           02 MONOFASICO-MOD    PIC X.
           02 CCUSTO-MOD        PIC 9(003).
           02 NBM-MOD           PIC 9(008).
           02 PROCEDENCIA-MOD   PIC 9.
           02 FILLER            PIC X(049).
        COPY "SEGMENTO.FD".
      *FILE SECTION.
       FD  SEGMENTO.
       01  REG-SEG.
           05 CHASSI-SEG           PIC X(020).
           05 FILLER1 REDEFINES CHASSI-SEG.
              10 1CHASSI-SEG       PIC X(012).
              10 2CHASSI-SEG       PIC X(008).
           05 PLACA-SEG            PIC X(008).        
           05 TIPOCLI-SEG          PIC X(001).
           05 CLIENTE-SEG          PIC 9(014) COMP-3.
           05 COR-SEG              PIC X(020).
           05 CODMOD-SEG           PIC X(015).
           05 MODELO-SEG           PIC X(050).
           05 MARCA-SEG            PIC X(015).
           05 ANO-SEG              PIC 9(004) COMP-3.
           05 MOTOR-SEG            PIC X(030).
           05 KM-SEG               PIC 9(009) COMP-3.
           05 CODFAB-SEG           PIC 9(014) COMP-3.
           05 MUNPLACA-SEG         PIC X(030).
           05 UFPLACA-SEG          PIC X(002).
           05 REVEND-SEG           PIC X(050).
           05 MUNREVE-SEG          PIC X(030).
           05 UFREVE-SEG           PIC X(002).
           05 VEND-SEG             PIC X(030).
           05 IDENTIF-SEG          PIC X(030).
           05 CERTIF-SEG           PIC X(030).
           05 DTFATFAB-SEG         PIC 9(008)  COMP-3.
           05 DTFATREV-SEG         PIC 9(008)  COMP-3.
           05 COMB-SEG             PIC X(001).
           05 DTABER-SEG           PIC 9(008)  COMP-3.
           05 DTFECH-SEG           PIC 9(008)  COMP-3.
           05 DEPTO-SEG            PIC 9(003).
           05 NOTA-SEG             PIC 9(008)  COMP-3.
           05 TOTGER-SEG           PIC 9(012)V99 COMP-3.
           05 SERIE-SEG            PIC X(010).
           05 ANOMOD-SEG           PIC 9(004).
           05 PLACAANT-SEG         PIC X(008).
           05 TIPOCLIANT-SEG       PIC X(001).
           05 CLIENTEANT-SEG       PIC 9(014)  COMP-3.
           05 TIPOPRIMDONO-SEG     PIC X(001).
           05 PRIMDONO-SEG         PIC 9(014)  COMP-3.
           05 DTENTRTEC-SEG        PIC 9(008)  COMP-3.
           05 CODRADIO-SEG         PIC X(010).
           05 REGIAO-SEG           PIC 9(003).
           05 OBS-SEG              PIC X(050).
           05 ATIVO-SEG            PIC X(001).
           05 RENTAL-SEG           PIC X(001).
           05 DTCHEGADA-SEG        PIC 9(008)    COMP-3.
           05 VLRCOMPRA-SEG        PIC 9(012)V99 COMP-3.
           05 VLRVENDA-SEG         PIC 9(012)V99 COMP-3.
           05 VLRALUGUEL-SEG       PIC 9(012)V99 COMP-3.
           05 OBS1-SEG             PIC X(050).
           05 QUEMRECEBEU-SEG      PIC X(050).
           05 FILLER               PIC X(286).
        COPY "FABRIC.FD".
       FD  FABRIC.
       01  REG-FABR.
           05 FAB-CODIGO           PIC 9(004).
           05 FAB-DESCRICAO        PIC X(050).
           05 FAB-DTALTER          PIC 9(008).
           05 FILLER               PIC X(292).

        COPY "CORDENADAS.FD".
       FD  CORDENADAS.
       01  REG-COR.
           05 CIDADE-COR     PIC X(050).
           05 ESTADO-COR     PIC X(050).
           05 BAIRRO-COR     PIC X(050).
           05 LATITUDE-COR   PIC S9(004)V999999 COMP-3.
           05 LONGITUDE-COR  PIC S9(004)V999999 COMP-3.
           05 ALTITUDE-COR   PIC S9(004)V999999 COMP-3.
      *--------------------------------------------------------------*
      *    Arquivo Contendo Cordenadas                               *
      *    Paulo Ferreira Laurino                          17/02/2016*
      *--------------------------------------------------------------*
        COPY "LOG.FD".
       FD LOG.
       01  REG-LOG.
           05 FILIAL-LOG     PIC 9(003).
           05 CHAVE-LOG      PIC 9(016).
           05 USUARIO-LOG    PIC X(050).
           05 PROGRAMA-LOG   PIC X(010).
           05 OPER-LOG       PIC 9(002).
           05 HISTOR-LOG     PIC X(200).
           05 FILLER         PIC X(100).
      *----------------------------------------------------------------*
       WORKING-STORAGE SECTION.
       COPY "WSQL_MASUSU.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_MASGER.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_MASVEN.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_MASPUB.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_FROTA.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_LOG.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_CLIENTES.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_MODELOS.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_SEGMENTO.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_FABRIC.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WSQL_REGISTRO.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************
       COPY "WORKSTS.CPY".
      * verificação de arquivos no rotfim
      * CALL "RetornaCmd"  USING W-CMD
      * CALL "SalvaCmd"    USING W-CMD

      *> COMP-3 (Signed e Unsigned respectivamente)
      *>  Decimal - Unsigned
      *>  Decimal - Signed
      *> COMP-0, COMP-X até 9(09)
      *>  INT     - Unsigned
      *> COMP-0, COMP-X acima de 9(09)
      *>  BIGINT  - Unsigned
      *> COMP-5 até 9(09)
      *>  INT     - Signed
      *> COMP-5 acima de 9(09)
      *>  BIGINT  - Signed

       01 WANOMES                   PIC 9(6).
       01 FILLER REDEFINES WANOMES.
          05 ANOMES-ANO            PIC 9(4).
          05 ANOMES-MES            PIC 9(2).
       01 FILE-DETAILS.
          05 FILE-SIZE             PIC X(8) COMP-X.
          05 FILE-DATE.
             10 DIA                PIC X COMP-X.
             10 MES                PIC X COMP-X.
             10 ANO                PIC X(2) COMP-X.
          05 FILE-TIME.
             10 HOURS              PIC X COMP-X.
             10 MINUTES            PIC X COMP-X.
             10 SECONDS            PIC X COMP-X.
             10 HUNDREDTHS         PIC X COMP-X.

      * Controle de Status de Arquivo e Registro
       01  WK-VERFS.
           05  WK-VERFS1           PIC X.
           05  WK-VERFS2           PIC X.
           05  WK-VERFS-FS  REDEFINES WK-VERFS2
                                   PIC 9(2) COMP-X.
       01  WK-VERFS-N REDEFINES WK-VERFS PIC 9(2).
       01  WK-VERFS-T              PIC 9(03) VALUE ZEROS.
       01  VERFS.
           05  VERFS1              PIC X.
           05  VERFS2              PIC X.
           05  VERFS-FS  REDEFINES VERFS2
                                   PIC 9(2) COMP-X.
       01  VERFS-N REDEFINES VERFS PIC 9(2).
       01  VERFS-T                 PIC 9(03) VALUE ZEROS.
       01  WK-MSG.
           05  TEX-MSG             PIC X(035).
           05  WK-ARQ              PIC X(050).
           05  FS-ERRO             PIC 9.
           05  FILLER              PIC X.
           05  VERFS-FS2           PIC 999.
       01  WK-MSG1 REDEFINES WK-MSG PIC X(090).

      *77  SQLCODE                 PIC S9(9) COMP-5 VALUE 0.
       01 WS-DTTESTE              PIC 9(008).
       01 FILLER        REDEFINES WS-DTTESTE.
          05 WS-DTDIA             PIC 99.
          05 WS-DTMES             PIC 99.
          05 WS-DTANO             PIC 9999.
       01 WS-DATAINV              PIC 9(008).
       01 FILLER     REDEFINES    WS-DATAINV.
          05 WS-ANOINV            PIC 9999.
          05 WS-MESINV            PIC 99.
          05 WS-DIAINV            PIC 99.
       01 WK-DATAFNF           PIC 9(008).
       01 FILLER               REDEFINES WK-DATAFNF.
          05 WK-ANOFNF         PIC 9999.
          05 WK-MESFNF          PIC 99.
          05 WK-DIAFNF          PIC 99.
       
      * Fim do controle de Status de Arquivo e Registro
      * Controle de impressora ni windows
       01  WK-TEMPO-ANTERIOR           PIC 9(006) VALUE ZEROS.
       01  WK-TEMPO-ATUAL              PIC 9(006) VALUE ZEROS.
       01  TITULO.
           05 TIT-LEN                  PIC X(002) COMP-5.
           05 TIT-TEXT                 PIC X(050).
       01  FONTE.
           05 NAME-LEN                 PIC X(002) COMP-5.
           05 NAME-TEXT                PIC X(015).
       01  ARQUIVO.
           05 ARQ-LEN                  PIC X(002) COMP-5.
           05 ARQ-TEXT                 PIC X(029).
       01  WK-TR                       PIC X VALUE SPACE.
       01  T-STATUS                    PIC X(2) COMP-X.

       01 CMD-EXEC-PRG.
          02  COMANDO-LINE         PIC x(700) VALUE SPACES.
          02  COMANDO-LINE-LEN     PIC x(4)   COMP-5  VALUE 700.
          02  RUN-UNIT-ID          PIC x(8)   COMP-5  VALUE 01.
          02  STACK-SIZE           PIC x(4)   COMP-5.
          02  FLAGSV               PIC x(4)   COMP-5  VALUE 0.
          02  TTY-CMD              PIC x(1)           VALUE SPACES.
          02  TTY-CMD-LEN          PIC x(4)   COMP-5  VALUE 1.
          02  STATUS-COD           PIC x(2)   COMP-5  VALUE 0.

       77  PRINTER-HANDLE          PIC X(002) COMP-5 value zeros.
       77  BMP-ID-LOGO             PIC X(004) COMP-5.
       77  RESERVADO               PIC X(004) COMP-5 VALUE 0.
       77  BMP-LINHA               PIC X(004) COMP-5 VALUE 1.
       77  BMP-COLUNA              PIC X(004) COMP-5 VALUE 0.
       77  BMP-ALTURA              PIC X(004) COMP-5 VALUE 25.
       77  BMP-COMPRIMENTO         PIC X(004) COMP-5 VALUE 15.
       77  FLAG                    PIC X(004) COMP-5.
       77  WINDOW-HANDLE           PIC X(004) COMP-5.
       77  FONT-SIZE               PIC X(002) COMP-5.
       77  FONT-STYLE              PIC X(002) COMP-5.
       77  STATUS-CODE             PIC X(002) COMP-5.
       77  DTTEMP                  PIC X(020) VALUE SPACES.
       77  DTNULL                  PIC S9(004) COMP-5.
       77  NOMECURSOR              PIC X(050) VALUE SPACES.
       77  CMDSQL                  PIC X(2000) VALUE SPACES.
       77  W-QRTM                  PIC 9(09) COMP-5.
       77  W-ARQUIVOS              PIC X(256)   VALUE SPACES.
       77  W-ESTADO                PIC X(02).
       77  W-CMDM                  PIC X(64000) VALUE SPACES.
       01  W-CURSOR                USAGE POINTER.
       01  W-CURSOR1               USAGE POINTER.
       01  W-CONEXAO               USAGE POINTER.
       01  W-CONEXAO1              USAGE POINTER.
       01  w-retorno               pic 9(8) comp-5 value zeros.
       01  W-RET                   PIC X(100) VALUE SPACES.


       01 wr-status.
          02 w-seq-id              pic x(255) value spaces.
          02 w-seq-st              pic xx     value zeros.
          02 w-seq-size            pic 9(06)  value zeros.

      *Status de retorno da operacao
      ******************************************************************
      *VARIAVEIS A SEREM USADA SOMENTE PELOS PROGRAMAS (INT)
      *O WK-PROCSTS DEVE IR NA USING
      ******************************************************************
       01 WK-PROCSTS.
          05 STS-USU                 PIC 9(002) VALUE ZEROS.
          05 STS-PROCEDURE           PIC X(050) VALUE SPACES.
          05 STS-HRINI               PIC 9(016) VALUE ZEROS.
          05 STS-HRFIM               PIC 9(016) VALUE ZEROS.
          05 STS-MSG                 PIC X(500) VALUE SPACES.
          05 STS-PRG                 PIC X(010) VALUE SPACES.
      ******************************************************************
      *FIM
      ******************************************************************
       01 CODIGO-STATUS.
          03 TIPO-TECLA            PIC X.
          03 CODIGO-TECLA-1        PIC 9(2) COMP-X.
          03 CODIGO-TECLA-2        PIC 9(2) COMP-X.
       01 WK-TAMANHO               PIC 9(8) COMP-5.

       01  RESULT                   PIC X(01) COMP-X.
       01  FUNCAO                   PIC X(01) COMP-X VALUE 35.
       01  COMMAND-LIN.
           03  TAM-LC               PIC X(01) COMP-X VALUE ZEROS.
       01  PrgName                  PIC X(20).
       01  WIN32API-RETURN-VALUE    PIC S9(9) COMP-5.
       78  ERROR-ALREADY-EXISTS     VALUE 183.
       
      *Fim do Status de retorno da operacao
       01  WK-TIPO                 PIC X(002)     VALUE SPACES.
       01  WK-NUMERO               PIC 9(008)     VALUE ZEROS.
       01  WK-CFOP                 PIC 9(005)     VALUE ZEROS.
       01  WK-CFOPT                PIC 9(005)     VALUE ZEROS.
       01  WK-UF                   PIC XX         VALUE SPACES.
       01  WK-VLRISSRET            PIC 9(010)V99  VALUE ZEROS.
       01  WK-NUMEROA              PIC X(010)     VALUE SPACES.
       01  WK-NOMECLI              PIC X(050)     VALUE SPACES.
       01  WK-EQUIPAMENTO          PIC X(050)     VALUE SPACES.
       01  WK-NFISCAL              PIC X(008)     VALUE SPACES.
       01  WK-DTNF                 PIC X(010)     VALUE SPACES.
       01  WK-CGC-GER              PIC 9(014)     VALUE ZEROS.
       01  WK-NOTAP                PIC XX         VALUE SPACES.
       01  WK-NOTAPN REDEFINES WK-NOTAP PIC 99.
       01  WK-NOTAPX               PIC 99         VALUE ZEROS.
       01  WK-NOTAPSS              PIC 99         VALUE ZEROS.
       77  WK-NOTA                 PIC 99         VALUE ZEROS.
       01  WK-NOTAPS               PIC XX         VALUE SPACES.
       01  WK-NOTAPNS REDEFINES WK-NOTAPS PIC 99.
       01  WK-NOTAPXS              PIC 99         VALUE ZEROS.
       77  WQ-CXBCO                PIC 9(005)     VALUE ZEROS.
       77  WQ-SEQCAI               PIC 9(004)     VALUE ZEROS.
       77  WQ-DEQ                  PIC 9(006)     VALUE ZEROS.
       77  WK-CBXNOTAPEC           PIC 9(008)     VALUE ZEROS.
       77  WK-CBXNOTASER           PIC 9(008)     VALUE ZEROS.
       77  WK-MONO                 PIC X          VALUE SPACES.
       77  WK-SUBS                 PIC X          VALUE SPACES.
       77  WK-NOTAS                PIC 99         VALUE ZEROS.
       77  WK-CONTINUA             PIC X(050)     VALUE SPACES.
       77  WK-MSGSUB               PIC X(100)     VALUE SPACES.
       77  WK-TOTTRANS             PIC 9(010)V99  VALUE ZEROS.
       77  WK-IPITRANS             PIC 9(010)V99  VALUE ZEROS.
       77  WK-TOTTRANS1            PIC 9(010)V99  VALUE ZEROS.
       77  WK-IPITRANS1            PIC 9(010)V99  VALUE ZEROS.
       77  WK-TOTTRANSP            PIC 9(010)V99  VALUE ZEROS.
       77  WK-IPITRANSP            PIC 9(010)V99  VALUE ZEROS.
       77  WK-MASCFO               PIC ZZZZ OCCURS 6.
       77  WK-ALIQM                PIC 9999.
       01  WK-MASCNUM              PIC 9(010).
       01  WK-MASCGM               PIC ZZZZ.ZZZ.ZZZ.
       77  WK-CGCCPF-M             PIC X(018).
       77  WK-DTMASC               PIC ZZ/ZZ/ZZZZ.
       77  WK-NUMERO-M             PIC 9(006).
       77  WK-NUMERO-A             PIC X(009).
       77  WK-VALOR-M              PIC ZZZ.ZZZ.ZZZ,ZZ.
       77  WK-VALOR1-M             PIC ZZZ.ZZZ.ZZZ,ZZ.
       77  WK-ALIQ-M               PIC ZZ9,99.
       77  WK-ALIQ1-M              PIC ZZ9,9999.
       77  WK-QTDE-M               PIC ZZZZZZ,ZZ.
       77  WK-QTALOC-M             PIC ZZZZZZ,ZZ.
       77  WK-SALDOE-M             PIC -ZZZZZZ,ZZ.
       77  WK-QTDE1-M              PIC ZZZZZ9,9999.
       77  WK-REJEICAO             PIC 999 VALUE ZEROS.
       77  WK-OPER-LOG             PIC 99 VALUE ZEROS.
       01  WK-MASCIVE              PIC Z(010).

       78 W-CP1  VALUE 1.
       78 W-CP2  VALUE 2.   *> 03
       78 W-CP3  VALUE 4.   *> 07
       78 W-CP4  VALUE 8.   *> 15
       78 W-CP5  VALUE 16.  *> 31
       78 W-CP6  VALUE 32.  *> 63
       78 W-CP7  VALUE 64.  *> 127
       78 W-CP8  VALUE 128.
       77 W-VAR PIC X(1) COMP-X.
       77 W-CMD PIC X(64000) VALUE SPACES.
       77 W-CONT1 PIC 999 VALUE ZEROS.
       77 W-CT1 PIC 999 VALUE ZEROS.
       77 W-TIME PIC 9(009) COMP-5.

       01  WK-PISCOFINS.
           05 WG-PIS-GER          PIC 9(003)V9(4).
           05 WG-COFINS-GER       PIC 9(003)V9(4).
           05 WG-PISIM-GER        PIC 9(003)V9(4).
           05 WG-COFINSIM-GER     PIC 9(003)V9(4).
           05 WG-PISIP-GER        PIC 9(003)V9(4).
           05 WG-COFINSIP-GER     PIC 9(003)V9(4).
           05 WG-PISVN-GER        PIC 9(003)V9(4).
           05 WG-COFINSVN-GER     PIC 9(003)V9(4).
           05 WG-PISVNI-GER       PIC 9(003)V9(4).
           05 WG-COFINSVNI-GER    PIC 9(003)V9(4).
           05 WG-PISVU-GER        PIC 9(003)V9(4).
           05 WG-COFINSVU-GER     PIC 9(003)V9(4).
       77  WK-QRTM                PIC 9(09) COMP-5.
       77  WK-ORDER                PIC X(1500).
       77  WK-WHERE                PIC X(1500).
       77  WK-CMD                  PIC X(1500).
       77  WK-CODPRODM             PIC X(030).
       77  CONTADOR-R              PIC ZZZZZ9.
       77  WK-NUMLOTE              PIC 9(006).
       77  WK-SEQANT               PIC 9999.
       77  WK-IND                  PIC 999.
       77  WK-TAM                  PIC 999999   VALUE ZEROS.
       77  WK-STAFILE-NBM          PIC 99.
       77  WK-GUARDANBM            PIC 9(010)   VALUE ZEROS.
       77  WK-TAXA                 PIC 9(006)V9999999 VALUE ZEROS.
       77  WK-STAFILE              PIC 99.
       77  WK-STAFILE1             PIC 99.
       77  WK-PUBUNI               PIC 9(010)V99 VALUE ZEROS.
       77  WK-CUSUNI               PIC 9(010)V99 VALUE ZEROS.
       77  WK-DOLUNI               PIC 9(010)V99 VALUE ZEROS.
       77  WK-PREPRO               PIC 9(010)V99 VALUE ZEROS.
       77  WK-LIMIRF               PIC 9(010)V99 VALUE 631,50.
       77  WK-LIMIRFT              PIC 9(010)V99 VALUE ZEROS.
       77  WK-OPCAO                PIC XX       VALUE SPACES.
       77  WK-CTDN1                PIC 99       VALUE ZEROS.
       77  WK-CTDN                 PIC 99       VALUE ZEROS.
       77  WK-CTD                  PIC 999999   VALUE ZEROS.
       77  WK-CTD1                 PIC 999999   VALUE ZEROS.
       77  WK-CTD2                 PIC 999999   VALUE ZEROS.
       77  WK-CTD3                 PIC 999999   VALUE ZEROS.
       77  WK-CTD4                 PIC 999999   VALUE ZEROS.
       77  WK-CTD5                 PIC 999999   VALUE ZEROS.
       77  WK-CTD6                 PIC 999999   VALUE ZEROS.
       77  WK-CTD7                 PIC 999999   VALUE ZEROS.
       77  WK-NUMTIP               PIC X(002)   VALUE SPACES.
       77  WK-NUMPED               PIC 9(008)   VALUE ZEROS.
       77  WK-ERRO                 PIC 999      VALUE ZEROS.
       77  WK-ERRO1                PIC 999      VALUE ZEROS.
       77  WK-ERRO2                PIC 999      VALUE ZEROS.
       77  WK-POS                  PIC 999.
       77  CRITICO                 PIC X.
       77  NAO-CRITICO             PIC X.
       77  NAO-SAI                 PIC X.
       77  WK-VALORLOG             PIC ZZZ.ZZ9,99.
       77  WK-DTLOG                PIC ZZ/ZZ/ZZZZ.
       77  WK-NUMLOG               PIC ZZZZZZZ9.
       77  WK-CNPJLOG              PIC 9(014).
       77  WK-BCOLOG               PIC 999999.
       77  WK-SEQCAI               PIC 99999.
       77  WK-VERSAO               PIC 9(008)   VALUE ZEROS.
       77  WK-VERSAO-GER           PIC 9(008)   VALUE ZEROS.
       77  WK-CALLDS               PIC X        VALUE SPACES.
       77  ARQ-ESTOQUE             PIC X        VALUE SPACES.
       77  ARQ-APLIC               PIC X        VALUE SPACES.
       77  ARQ-KARDEX              PIC X        VALUE SPACES.
       77  ARQ-RESUMO              PIC X        VALUE SPACES.       
       77  ARQ-MASGER              PIC X        VALUE SPACES.
       77  ARQ-IBMMQ               PIC X        VALUE SPACES.
       77  ARQ-MASFIL              PIC X        VALUE SPACES.
       77  ARQ-MASTOC              PIC X        VALUE SPACES.
       77  ARQ-MASGRU              PIC X        VALUE SPACES.       
       77  ARQ-MASPAG              PIC X        VALUE SPACES.
       77  ARQ-LOG                 PIC X        VALUE SPACES.
       77  ARQ-UTEIS               PIC X        VALUE SPACES.
       77  ARQ-MASTRIB             PIC X        VALUE SPACES.
       77  ARQ-MASOPE              PIC X        VALUE SPACES.
       77  ARQ-MASOS               PIC X        VALUE SPACES.
       77  ARQ-MASUSU              PIC X        VALUE SPACES.
       77  ARQ-MASNIV              PIC X        VALUE SPACES.
       77  ARQ-MASSIT              PIC X        VALUE SPACES.
       77  ARQ-MASCOB              PIC X        VALUE SPACES.
       77  ARQ-MASCOBP             PIC X        VALUE SPACES.
       77  ARQ-RATEIO              PIC X        VALUE SPACES.
       77  ARQ-MASFAB              PIC X        VALUE SPACES.
       77  ARQ-FINTEMP             PIC X        VALUE SPACES.
       77  ARQ-LIBERA              PIC X        VALUE SPACES.
       77  ARQ-MASDEP              PIC X        VALUE SPACES.
       77  ARQ-MASNAT              PIC X        VALUE SPACES.       
       77  ARQ-MASVEN              PIC X        VALUE SPACES.
       77  ARQ-MASPER              PIC X        VALUE SPACES.
       77  ARQ-BVU                 PIC X        VALUE SPACES.       
       77  ARQ-MASPUB              PIC X        VALUE SPACES.
       77  ARQ-MASMON              PIC X        VALUE SPACES.
       77  ARQ-ITENSSUB            PIC X        VALUE SPACES.
       77  ARQ-MASCAI              PIC X        VALUE SPACES.
       77  ARQ-NOTAS               PIC X        VALUE SPACES.
       77  ARQ-CAIXA               PIC X        VALUE SPACES.       
       77  ARQ-VENDPER             PIC X        VALUE SPACES.
       77  ARQ-VENDPEROBS          PIC X        VALUE SPACES.
       77  ARQ-NOTASENT            PIC X        VALUE SPACES.
       77  ARQ-INSTRUC             PIC X        VALUE SPACES.
       77  ARQ-CONTRATO            PIC X        VALUE SPACES.
       77  ARQ-CLIENTES            PIC X        VALUE SPACES.       
       77  ARQ-CLIENTES1           PIC X        VALUE SPACES.
       77  ARQ-CLIFIS              PIC X        VALUE SPACES.
       77  ARQ-FUNCIO              PIC X        VALUE SPACES.
       77  ARQ-RCAIXA              PIC X        VALUE SPACES.
       77  ARQ-COMPRAS             PIC X        VALUE SPACES.              
       77  ARQ-COMPRASM            PIC X        VALUE SPACES.
       77  ARQ-RECEBER             PIC X        VALUE SPACES.
       77  ARQ-RECEBIDO            PIC X        VALUE SPACES.
       77  ARQ-PAGAR               PIC X        VALUE SPACES.
       77  ARQ-PAGOS               PIC X        VALUE SPACES.
       77  ARQ-COMPROM             PIC X        VALUE SPACES.
       77  ARQ-PEDAQU              PIC X        VALUE SPACES.
       77  ARQ-PEDAQUI             PIC X        VALUE SPACES.
       77  ARQ-BANCO               PIC X        VALUE SPACES.
       77  ARQ-IMOBIL              PIC X        VALUE SPACES.
       77  ARQ-PATRIM              PIC X        VALUE SPACES.
       77  ARQ-REG060              PIC X        VALUE SPACES.
       77  ARQ-MOEDA               PIC X        VALUE SPACES.
       77  ARQ-COTACAO             PIC X        VALUE SPACES.       
       77  ARQ-SCOPLA              PIC X        VALUE SPACES.
       77  ARQ-SCOEMP              PIC X        VALUE SPACES.
       77  ARQ-SCOHIS              PIC X        VALUE SPACES.
       77  ARQ-SCOEXE              PIC X        VALUE SPACES.
       77  ARQ-SCOLOT              PIC X        VALUE SPACES.
       77  ARQ-RATNFE              PIC X        VALUE SPACES.
       77  ARQ-INVENT              PIC X        VALUE SPACES.
       77  ARQ-INVENTG             PIC X        VALUE SPACES.
       77  ARQ-INVENTS             PIC X        VALUE SPACES.
       77  ARQ-MODELOS             PIC X        VALUE SPACES.
       77  ARQ-ORCAMP              PIC X        VALUE SPACES.
       77  ARQ-ORCAMPP             PIC X        VALUE SPACES.
       77  ARQ-DESMOD              PIC X        VALUE SPACES.
       77  ARQ-FICHA               PIC X        VALUE SPACES.
       77  ARQ-OPCION              PIC X        VALUE SPACES.
       77  ARQ-VEICULOS            PIC X        VALUE SPACES.
       77  ARQ-INVEIC              PIC X        VALUE SPACES.
       77  ARQ-REMESSA             PIC X        VALUE SPACES.       
       77  ARQ-HISTOR              PIC X        VALUE SPACES.              
       77  ARQ-NEGOCIO             PIC X        VALUE SPACES.
       77  ARQ-PROPOSTA            PIC X        VALUE SPACES.
       77  ARQ-AGENDA              PIC X        VALUE SPACES.
       77  ARQ-AGEPROP             PIC X        VALUE SPACES.
       77  ARQ-AGECONC             PIC X        VALUE SPACES.
       77  ARQ-AGEASSU             PIC X        VALUE SPACES.
       77  ARQ-TMO                 PIC X        VALUE SPACES.
       77  ARQ-MECANICO            PIC X        VALUE SPACES.
       77  ARQ-CDT                 PIC X        VALUE SPACES.
       77  ARQ-ORDEMSER            PIC X        VALUE SPACES.
       77  ARQ-SEGMENTO            PIC X        VALUE SPACES.
       77  ARQ-COMISSAO            PIC X        VALUE SPACES.
       77  ARQ-REQUIS              PIC X        VALUE SPACES.
       77  ARQ-ORCSER              PIC X        VALUE SPACES.
       77  ARQ-CORES               PIC X        VALUE SPACES.
       77  ARQ-FINANC              PIC X        VALUE SPACES.
       77  ARQ-MDS                 PIC X        VALUE SPACES.       
       77  ARQ-SEGURO              PIC X        VALUE SPACES.
       77  ARQ-OBJETIVO            PIC X        VALUE SPACES.
       77  ARQ-OBJETIVOD           PIC X        VALUE SPACES.
       77  ARQ-TETRASYS            PIC X        VALUE SPACES.
       77  ARQ-PUBLICO             PIC X        VALUE SPACES.
       77  ARQ-CATGMB              PIC X        VALUE SPACES.
       77  ARQ-INVENTA             PIC X        VALUE SPACES.
       77  ARQ-MASDES              PIC X        VALUE SPACES.
       77  ARQ-MASSCOL             PIC X        VALUE SPACES.
       77  ARQ-MASSCOC             PIC X        VALUE SPACES.
       77  ARQ-MASFOR              PIC X        VALUE SPACES.
       77  ARQ-MASNBM              PIC X        VALUE SPACES.
       77  ARQ-MASENT              PIC X        VALUE SPACES.
       77  ARQ-MASSER              PIC X        VALUE SPACES.
       77  ARQ-MASDOC              PIC X        VALUE SPACES.
       77  ARQ-MASDOCP             PIC X        VALUE SPACES.
       77  ARQ-MASRMPL             PIC X        VALUE SPACES.
       77  ARQ-MASRMPC             PIC X        VALUE SPACES.       
       77  ARQ-SCOLAN              PIC X        VALUE SPACES.
       77  ARQ-SCODEP              PIC X        VALUE SPACES.
       77  ARQ-SCOGER              PIC X        VALUE SPACES.
       77  ARQ-SCOCUS              PIC X        VALUE SPACES.
       77  ARQ-MASPRG              PIC X        VALUE SPACES.
       77  ARQ-GIAICMS             PIC X        VALUE SPACES.
       77  ARQ-ICMS                PIC X        VALUE SPACES.
       77  ARQ-FUNCOES             PIC X        VALUE SPACES.
       77  ARQ-COBBAN              PIC X        VALUE SPACES.
       77  ARQ-LUGAR               PIC X        VALUE SPACES.
       77  ARQ-PEDIDO              PIC X        VALUE SPACES.
       77  ARQ-PEDPAR              PIC X        VALUE SPACES.
       77  ARQ-CHAMADOS            PIC X        VALUE SPACES.
       77  ARQ-FROTA               PIC X        VALUE SPACES.
       77  ARQ-FABRIC              PIC X        VALUE SPACES.
       77  ARQ-CHAPECAS            PIC X        VALUE SPACES.
       77  ARQ-COBESC              PIC X        VALUE SPACES.
       77  ARQ-FLUXO               PIC X        VALUE SPACES.
       77  ARQ-MASTIP              PIC X        VALUE SPACES.
       77  ARQ-GIRO                PIC X        VALUE SPACES.
       77  ARQ-PECFAL              PIC X        VALUE SPACES.
       77  ARQ-PECOBS              PIC X        VALUE SPACES.
       77  ARQ-TMP                 PIC X        VALUE SPACES.
       77  ARQ-TMP2                PIC X        VALUE SPACES.
       77  ARQ-TMP3                PIC X        VALUE SPACES.
       77  ARQ-TMP4                PIC X        VALUE SPACES.
       77  ARQ-TMP5                PIC X        VALUE SPACES.
       77  ARQ-INTNFE-I            PIC X        VALUE SPACES.
       77  ARQ-INTNFE              PIC X        VALUE SPACES.
       77  ARQ-SUGESTAO            PIC X        VALUE SPACES.
       77  ARQ-FLUDOC              PIC X        VALUE SPACES.
       77  ARQ-FLUDOCA             PIC X        VALUE SPACES.
       77  ARQ-RENCAD              PIC X        VALUE SPACES.
       77  ARQ-RENCON              PIC X        VALUE SPACES.
       77  ARQ-MANCONT             PIC X        VALUE SPACES.
       77  ARQ-PECMCONT            PIC X        VALUE SPACES.
       77  ARQ-PECCONT             PIC X        VALUE SPACES.
       77  ARQ-GRUPOMAQ            PIC X        VALUE SPACES.
       77  ARQ-PRECONT             PIC X        VALUE SPACES.
       77  ARQ-AGEMEC              PIC X        VALUE SPACES.
       77  ARQ-REGIAO              PIC X        VALUE SPACES.
       77  ARQ-CORDENADAS          PIC X        VALUE SPACES.
       77  ARQ-TRANSF              PIC X        VALUE SPACES.
       77  ARQ-TRANSFM             PIC X        VALUE SPACES.
       77  ARQ-TEXTO               PIC X        VALUE SPACES.
       77  ARQ-MASCFO              PIC X        VALUE SPACES.
       77  ARQ-MODCOMP             PIC X        VALUE SPACES.
       77  ARQ-TITOBS              PIC X        VALUE SPACES.
       77  ARQ-POTENCIAL           PIC X        VALUE SPACES.
       77  ARQ-RRB                 PIC X        VALUE SPACES.
       77  ARQ-PROCSTS             PIC X        VALUE SPACES.
       77  ARQ-FECHANF             PIC X        VALUE SPACES.
       77  ARQ-DADOSNF             PIC X        VALUE SPACES.
       77  ARQ-TITMOV              PIC X        VALUE SPACES.
       77  ARQ-SCOSAL              PIC X        VALUE SPACES.
       77  ARQ-OFCONT              PIC X        VALUE SPACES.
       77  ARQ-REVISAO             PIC X        VALUE SPACES.
       78  DIALOG-SYSTEM                        VALUE "DSGRUN".
       78  WK-BD                                VALUE 0.
      *78--------------------------------------------------------------*
       01  PATH-PATRIM.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-PATMOV.
           05 FILLER               PIC X(007) VALUE "../arq/".
           05 FILLER               PIC X(006) VALUE "patmov".
           05 MOV-ANOMES           PIC 9(006) VALUE ZEROS.
           05 FILLER REDEFINES MOV-ANOMES.
              10 MOV-ANO           PIC 9(004).
              10 MOV-MES           PIC 9(002).
           05 FILLER               PIC X(004) VALUE ".dat".
       01  PATH-CLIFIS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PFIS-FILIAL             PIC 9(003).
       01  PATH-AUTO.
           05 AUTC                 PIC X(007) VALUE "../arq/".
           05 AUTC-NOME            PIC X(020) VALUE "auto.csv".
       01  PATH-MOVTIT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MOV-FILIAL              PIC 9(003).
       01  PATH-CLIENTES1.
           05 FILLER               PIC X(060) VALUE SPACES.
       01 CLI-FILIAL1              PIC 9(003).
       01  PATH-MASCAI.   
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MCAI-FILIAL             PIC 9(003).
       01  PATH-CONTRATO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASNAT.  
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MNAT-FILIAL             PIC 9(003).
       01  PATH-MASSCOC.  
           05 MSCOC                PIC X(007) VALUE "../arq/".
           05 MSCOC-FILIAL         PIC 9(003).
           05 MSCOC-NOME           PIC X(020) VALUE "masscoc.dat".
       01  PATH-MASDEP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-FINTEMP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MDEP-FILIAL             PIC 9(003).

       01  PATH-TABERROS.
           05 FILLER               PIC X(060) VALUE SPACES.

       01  PATH-MUNIC.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASFOR.   
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MFOR-FILIAL             PIC 9(003).
       01  PATH-MASUSU.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-GRFUNCAO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-DEFEITO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MEDIDA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASENT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-APLIC.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MENT-FILIAL             PIC 9(003).
       01  PATH-MASSCOL.  
           05 MSCOL                PIC X(007) VALUE "../arq/".
           05 MSCOL-FILIAL         PIC 9(003).
           05 MSCOL-NOME           PIC X(020) VALUE "masscol.dat".
       01  PATH-IBMMQ.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASPAG.   
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MPAG-FILIAL             PIC 9(003).
       01  PATH-MASMON.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASOPE.  
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MOPE-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASFIL.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASTRIB. 
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MTRI-FILIAL             PIC 9(003).
       01  PATH-BANCO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  BCO-FILIAL              PIC 9(003).
       01  PATH-CAIXA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-CAIXACAB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  CAI-FILIAL              PIC 9(003).
       01  REC-FILIAL              PIC 9(003).
       01  PAG-FILIAL              PIC 9(003).
       01  PATH-MASNBM.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  NBM-FILIAL              PIC 9(003).
       01  PATH-MASCFO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  CFO-FILIAL              PIC 9(003).
       01  PATH-MASSER.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MSER-FILIAL             PIC 9(003).
       01  PATH-PECFAL.
           05 FILLER               PIC X(060) VALUE SPACES.
       01 PCF-FILIAL               PIC 9(003).
       01  PATH-VEICULOS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  VEI-FILIAL              PIC 9(003).
       01  PATH-ORDEMSER.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-ORDEMSERS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  SER-FILIAL              PIC 999 VALUE ZEROS.
       01  PATH-CHAPECAS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  CHP-FILIAL              PIC 9(003).
       01  PATH-CHAMADOS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  CHM-FILIAL              PIC 9(003).
       01  PATH-TMO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-CDT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  CDT-FILIAL              PIC 999 VALUE ZEROS.
       01  PATH-BVU.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  BVU-FILIAL              PIC 9(003).
       01  PATH-COMPROM.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  CPM-FILIAL              PIC 9(003).
       01  PATH-INSTRUC.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  INS-FILIAL              PIC 9(003).
       01  PATH-INSTRUCTXT.
           05 INSTXT               PIC X(007) VALUE "../tmp/".
           05 INSTXT-NOME.
              10 INSTXT-PREF       PIC X(003) VALUE "ins".
              10 INSTXT-FILIAL     PIC 9(003).
              10 INSTXT-VENDEDOR   PIC 9(003).
              10 INSTXT-INSTRUCAO  PIC 9(006).
              10 INSTXT-TIPO       PIC X(004) VALUE ".txt".
       01  PATH-INVENT.
           05 INV                  PIC X(009) VALUE "../arq/in".
           05 INV-FILIAL           PIC 9(003).
           05 INV-ANOMES.
              10 INV-MES           PIC 9(002).
              10 INV-ANO           PIC 9(004).
           05 FILLER               PIC X(004) VALUE ".dat".
       01  PATH-INVENTG.
           05 INVG                 PIC X(010) VALUE "../arq/ing".
           05 INVG-FILIAL          PIC 9(003).
           05 INVG-ANOMES          PIC 9(006).
           05 FILLER               PIC X(004) VALUE ".dat".
       01  PATH-INVENTS.
           05 INVS                 PIC X(010) VALUE "../arq/ins".
           05 INVS-FILIAL          PIC 9(003).
           05 INVS-MES             PIC 9(002).
           05 INVS-ANO             PIC 9(004).
           05 FILLER               PIC X(004) VALUE ".dat".
       01  PATH-INVENTA.
           05 INVE                 PIC X(007) VALUE "../arq/".
           05 INVE-FILIAL          PIC 9(003).
           05 INVE-NOME            PIC X(012) VALUE "invent.dat".
       01  PATH-LOG.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  LOG-FILIAL              PIC 9(003).
       01  PATH-MASCOB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MCOB-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASDES.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MDES-FILIAL             PIC 9(003).
       01  PATH-MASDOC.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MDOC-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASDOCP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MDOCP-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASCOBP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MCOBP-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASFAB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MFAB-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASGRU.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MGRU-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASNIV.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MNIV-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASPRG.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MPRG-FILIAL             PIC 9(003).
       01  PATH-MASPUB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASOS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MPUB-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MASPER.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MPER-FILIAL             PIC 9(003).
       01  PATH-MASSIT.
           05 FILLER               PIC X(050) VALUE SPACES.
       01  MSIT-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-ITENSSUB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MASVEN.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-AREA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-DADCONT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-PRECONT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MVEN-FILIAL             PIC 999 VALUE ZEROS.
       01  PATH-MDS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MDS-FILIAL              PIC 999 VALUE ZEROS.
       01  PATH-MECANICO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  MEC-FILIAL              PIC 999 VALUE ZEROS.
       01  PATH-FICHA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-NEGOCIO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  NEG-FILIAL              PIC 9(003).
       01  PATH-NOTAS.
           05 NOTA1                PIC X(007) VALUE "../arq/".
           05 WK-FILIAL            PIC 9(002).
           05 WK-MESNOT            PIC 9(002).
           05 WK-ANONOT            PIC 9(004).
           05 NOTA2                PIC X(004) VALUE ".dat".
       01  PATH-NOTASENT.
           05 NOTA3                PIC X(008) VALUE "../arq/e".
           05 WK-FILIALE           PIC 9(002).
           05 WK-MESNOTE           PIC 9(002).
           05 WK-ANONOTE           PIC 9(004).
           05 NOTA4                PIC X(004) VALUE ".dat".
       01  PATH-OBJETIVO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  OBO-FILIAL              PIC 9(003).
       01  PATH-ORCAMP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  ORCP-FILIAL             PIC 9(003).
       01  PATH-ORCAMPP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  ORCPP-FILIAL            PIC 9(003).
       01  PATH-ORCSER.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  ORCS-FILIAL             PIC 9(003).
       01  PATH-ORCSERP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-ORCSERS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-PROPOSTA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PROP-FILIAL             PIC 9(003).
       01  PATH-RATEIO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  RAT-FILIAL              PIC 9(003).
       01  PATH-REQUIS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  REQ-FILIAL              PIC 999 VALUE ZEROS.
       01  PATH-SCOEXE.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  WK-EMPEXE               PIC 9(003) VALUE ZEROS.
       01  PATH-SCOLOT.
           05 FILLER               PIC X(008) VALUE "../arq/l".
           05 WK-EMPLOTE           PIC 9(003).
           05 WK-MESLOTE           PIC 9(002).
           05 WK-ANOLOTE           PIC 9(004).
           05 FILLER               PIC X(004) VALUE ".dat".
       01  PATH-SEGMENTO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  SEG-FILIAL              PIC 9(003).
       01  PATH-SEGURO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  SEGU-FILIAL             PIC 9(003).
       01  PATH-SUGESTAO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  SUG-FILIAL              PIC 9(003).
       01  PATH-VENDPER.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-VENDPEROBS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  VPER-FILIAL             PIC 9(003).
       01  PATH-FABRIC.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-GIRO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01 GIR-FILIAL               PIC 9(003).
       01 EST-FILIAL               PIC 9(003).
       01  PATH-MASGER.
      $    if wk-bd = 1
           05 FILLER               PIC X(001) VALUE "@".
           05 MGER-IP              PIC X(015).
           05 FILLER
              PIC X(040) VALUE "@3306@root@k15720@erp@masger".
      $    else
           05 MAS                  PIC X(007) VALUE "../arq/".
           05 MAS-NOME             PIC X(012) VALUE "masger.dat".
      $    end
       01  PATH-MASGER1.
           05 MAS1                 PIC X(007) VALUE "../old/".
           05 MAS1-NOME            PIC X(012) VALUE "masger.dat".
       01  PATH-TMPOBJD            PIC X(030).
       01  PATH-TMPOBJD1           PIC X(030).
       01  PATH-TMPENTR            PIC X(030).
       01  PATH-TMPENTR1           PIC X(030).
       01  PATH-TMPKAR             PIC X(030).
       01  PATH-REMESSA.
           05 REM-NOME             PIC X(050) VALUE SPACES.
       01  PATH-RATNFE.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  RTNF-FILIAL             PIC 9(003).
       01  PATH-AGEMEC.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  AGC-FILIAL              PIC 9(003).
       01  PATH-REGIAO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01 REG-FILIAL               PIC 9(003).
       01  PATH-CORDENADAS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-TEXTO.
           05 TEX                  PIC X(007) VALUE "../tmp/".
           05 TEX-NOME             PIC X(012) VALUE SPACES.
       01  PATH-CONSOL.
           05 CONS                 PIC X(007) VALUE "../tmp/".
           05 CONS-USUARIO         PIC 9(003).
           05 CONS-NOME            PIC X(012) VALUE "consol.dat".
       01  PATH-FECHANF.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PFNF-FILIAL             PIC 9(003).
       01  PATH-DADOSNF.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PDNF-FILIAL             PIC 9(003).
       01  PATH-HISTOR.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-TITMOV.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-TITOBS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PTIM-FILIAL             PIC 9(003).
       01  PATH-CLIENTES.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  CLI-FILIAL              PIC 9(003).
       01  PATH-COMPRAS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  COM-FILIAL              PIC 9(003).
       01  PATH-COMPRASM.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  COMM-FILIAL             PIC 9(003).
       01  PATH-OPCION.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-CONVFILTROS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MODELOS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-COBBAN.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-AGENDA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-TIPOTMO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-AGEPROP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-AGECONC.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-AGEASSU.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-ESTOQUE.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-CATALOGO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-KARDEX.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-KARDEXM.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-REPARO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-PECOBS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-PECCONT.
           05 FILLER               PIC X(060) VALUE SPACES.

       01  PATH-XMLNOTASCAB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-XMLNOTASDET.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-XMLPAGAR.
           05 FILLER               PIC X(060) VALUE SPACES.

       01  PATH-NOTASCAB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-NOTASDET.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-NOTASENTCAB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-NOTASENTDET.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-RECEBER.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-RECEBIDOS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-PAGAR.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-PAGOS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-RESUMO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOEMP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOGER.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOGERCAB.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOGERDET.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOGERPRV.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOGERTOT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCODEP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOPLA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-SCOSAL.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-COTEP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-DESMOD.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-CORES.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-FROTA.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-COTACAO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-ICMS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-FUNCOES.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-GIAICMS.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-POTENCIAL.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-VENDPAG.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MANCONT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  PATH-MODCOMP.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  SAL-FILIAL              PIC 9(003) VALUE ZEROS.
       01  PATH-OFCONT.
           05 FILLER               PIC X(060) VALUE SPACES.
       01  OFC-FILIAL             PIC 9(003).
       01  PATH-REVISAO.
           05 FILLER               PIC X(060) VALUE SPACES.
       01 REV-FILIAL               PIC 9(003).
      *----------------------------------------------------------------*
       COPY "WORKDATA.CPY".
       01  WK-DATANOR              PIC 9(008).
       01  FILLER                  REDEFINES WK-DATANOR.
           05 WK-DIANOR            PIC 99.
           05 WK-MESNOR            PIC 99.
           05 WK-ANONOR            PIC 9999.
       01  WK-DATAINV              PIC 9(008).
       01  FILLER                  REDEFINES WK-DATAINV.
           05 WK-ANOINV            PIC 9999.
           05 WK-MESINV            PIC 99.
           05 WK-DIAINV            PIC 99.
       77 WK-MASC-VALOR            PIC --------9,99.
       77 WK-MASC-DATA             PIC 99/99/9999 BLANK WHEN ZEROS.
       77 WK-MASC-CODIGO           PIC ZZZZZZZZZZ.
guto   78  DIALOG-SYSTEM           VALUE "DSGRUN".

       01 WK-DATACOR              PIC 9(008).
       01 FILLER        REDEFINES WK-DATACOR.
          05 WK-DIACOR            PIC 99.
          05 WK-MESCOR            PIC 99.
          05 WK-ANOCOR            PIC 9999.
       01 WK-DATA.
          05 WK-ANO               PIC 9999 VALUE ZEROS.
          05 WK-MES               PIC 99   VALUE ZEROS.
          05 WK-DIA               PIC 99   VALUE ZEROS.
          05 WK-HRH               PIC 99   VALUE ZEROS.
          05 WK-MIN               PIC 99   VALUE ZEROS.
          05 WK-SEC               PIC 99   VALUE ZEROS.
          05 WK-CEN               PIC 99   VALUE ZEROS.

       01 WS-VALOR-MOD            PIC 9(012)V9(04) COMP-3.
       01 WS-REPOSICAO-MOD        PIC 9(012)V9(04) COMP-3.
       01 WS-FRETE-MOD            PIC 9(012)V9(04) COMP-3.
       77 WK-LATITUDE             PIC -ZZZZ,999999.
       77 WK-LONGITUDE            PIC -ZZZZ,999999.
       77 WK-WWW                  PIC X(500) VALUE SPACES.
       77 WK-WWWV                 PIC X(500) VALUE SPACES.

      *----------------------------------------------------------------*
       COPY "ds-cntrl.mf".

      *****************************************************************
      *
      *  Dialog System Control Block (Using Micro Focus Constants).
      *
      *  For use with Dialog System Version 2.
      *
      *****************************************************************

       01  DS-CONTROL-BLOCK.
           03  DS-VERSION-NUMBERS.
               05  DS-DATA-BLOCK-VERSION-NO    PIC 9(8) COMP-5.
               05  DS-VERSION-NO               PIC 9(2) COMP-X.
               05  FILLER                      PIC X.
           03  DS-OUTPUT-FIELDS.
               05  DS-SYSTEM-ERROR.
                 07  DS-ERROR-CODE             PIC 9(4) COMP-5.
                   88  DS-NO-ERROR               VALUE 0.
                   88  DS-NOT-INITIALISED        VALUE 1.
                   88  DS-CANNOT-OPEN-SET        VALUE 2.
                   88  DS-ERROR-READING-FILE     VALUE 3.
                   88  DS-INVALID-SET            VALUE 4.
                   88  DS-CANNOT-CREATE-PANEL    VALUE 5.
                   88  DS-DYNAMIC-ERROR          VALUE 6.
                   88  DS-INVALID-FUNCTION       VALUE 7.
                   88  DS-INVALID-PROC           VALUE 8.
                   88  DS-VALIDATION-PROG-ERROR  VALUE 9.
                   88  DS-DATA-BLOCK-VERNO-ERROR VALUE 10.
                   88  DS-PUSH-LIMIT-REACHED     VALUE 11.
                   88  DS-ERROR-FILE-MISSING     VALUE 12.
                   88  DS-SUBSCRIPT-ERROR        VALUE 13.
                   88  DS-PROC-LIMIT-REACHED     VALUE 14.
                   88  DS-CTRL-BREAK-PRESSED     VALUE 15.
                   88  DS-ERROR-ON-TRACE-FILE    VALUE 16.
                   88  DS-SCREEN-MANAGER-ERROR   VALUE 17.
                   88  DS-CANNOT-FIND-SCREENSET  VALUE 18.
                   88  DS-INVALID-IDENTIFIER     VALUE 19.
                   88  DS-BAD-PARAMETER          VALUE 20.
                   88  DS-POSS-DSRUN-MISMATCH    VALUE 21.
                   88  DS-CALLOUT-FAILED         VALUE 22.
                   88  DS-NO-CONCURRENCY         VALUE 23.
                   88  DS-INVALID-INSTANCE       VALUE 24.
                   88  DS-ALREADY-INITIALISED    VALUE 25.
                   88  DS-SYSTEM-MODULE-MISSING  VALUE 26.
                   88  DS-OLE-ERROR              VALUE 27.
                 07  DS-ERROR-DETAILS-1        PIC 9(4) COMP-5.
                 07  DS-ERROR-DETAILS-2        PIC 9(4) COMP-5.
               05  DS-VALIDATION-ERROR-NO      PIC 9(4) COMP-5.
               05  DS-FIELD-COUNT              PIC 9(4) COMP-5.
               05  DS-FIELD-OCCURRENCE         PIC 9(4) COMP-5.
               05  DS-FIELD-NO                 PIC 9(4) COMP-5.
               05  DS-WINDOW-NAME              PIC X(32).
               05  DS-OBJECT-NAME              PIC X(32).
               05  DS-FIELD-CHANGE             PIC 9(2) COMP-X.
                 88 DS-FIELD-CHANGE-TRUE       VALUE 1.
               05  DS-EXIT-FIELD               PIC 9(2) COMP-X.
                 88 DS-EXIT-FIELD-TRUE         VALUE 1.
               05  DS-SESSION-ID               PIC 9(9) COMP-5.
               05  DS-OUTPUT-RESERVED          PIC X(6).
           03  DS-INPUT-FIELDS.
               05  DS-CONTROL                  PIC X.
                 78  DS-CONTINUE               VALUE "C".
                 78  DS-NEW-SET                VALUE "N".
                 78  DS-LOAD-SYSTEM            VALUE "L".
                 78  DS-QUIT-SET               VALUE "Q".
                 78  DS-PUSH-SET               VALUE "S".
                 78  DS-USE-SET                VALUE "U".
                 78  DS-USE-INSTANCE-SET       VALUE "I".
                 78  DS-PATHNAME               VALUE "P".
                 78  DS-ERR-FILE-OPEN          VALUE "E".
                 78  DS-USE-KWIT               VALUE "K".
                 78  DS-USE-3D-CONTROLS        VALUE "3".
               05  DS-CLEAR-DIALOG             PIC 9(2) COMP-X.
               05  DS-CONTROL-PARAM            PIC 9(4) COMP-5.
                 78  DS-CONTROL-PARAM-DEFAULT  VALUE 0.
                 78  DS-SCREEN-NOCLEAR         VALUE 1.
                 78  DS-IGNORE-DB-VER-NO       VALUE 2.
                 78  DS-CHECK-CTRL-BREAK       VALUE 4.
                 78  DS-NO-NAME-INFO           VALUE 8.
                 78  DS-SMALL-TIMEOUT          VALUE 16.
               05  DS-PROCEDURE                PIC X(32).
               05  DS-PARAMETER-COUNT          PIC 9(2) COMP-X.
               05  DS-SCREENSET-INSTANCE       PIC 9(2) COMP-X.
               05  DS-INPUT-RESERVED           PIC X(8).
               05  DS-SCREENSET-NAME.
                 07  DS-SET-NAME-LENGTH        PIC 9(4) COMP-5.
                 07  DS-SET-NAME               PIC X(256).

      *****************************************************************
      *   End of Control Block
      *****************************************************************
       COPY "EST032.cpb".

      *****************************************************************
      *   Data Block
      *****************************************************************

       01 DATA-BLOCK-VERSION-NO              PIC 9(8) COMP-5
                                             VALUE 113.

       01 VERSION-NO                         PIC 9(2) COMP-5 VALUE
                                               2.

       01 SET-BUILD-NO                       PIC 9(4) COMP-5
                                             VALUE 198.

       01 DATA-BLOCK.
          03 CONFIG-FLAG                     PIC x(4) COMP-5.
          03 CONFIG-VALUE                    PIC x(4) COMP-5.
          03 FUNCTION-DATA.
             05 WINDOW-HANDLE                PIC x(4) COMP-5.
             05 OBJECT-REFERENCE OBJECT REFERENCE.
             05 CALL-FUNCTION                PIC X(30).
             05 NUMERIC-VALUE                PIC x(4) COMP-5.
             05 NUMERIC-VALUE2               PIC x(4) COMP-5.
             05 SIZE-WIDTH                   PIC x(4) COMP-5.
             05 SIZE-HEIGHT                  PIC x(4) COMP-5.
             05 POSITION-X                   PIC x(4) COMP-5.
             05 POSITION-Y                   PIC x(4) COMP-5.
             05 IO-TEXT-BUFFER               PIC X(256).
             05 IO-TEXT-BUFFER2              PIC X(256).
          03 LVIEW-ITEM.
             04 LVIEW-ITEM-ITEM              OCCURS 20.
                05 LVITEM-TEXT               PIC X(31).
                05 LVITEM-LENGTH             PIC x(4) COMP-5.
                05 LVITEM-POSICAO            PIC X.
                05 LVITEM-OBJECT OBJECT REFERENCE.
          03 LVIEW-DATA.
             04 LVIEW-DATA-ITEM              OCCURS 999.
                05 LVDATA-ICON               PIC X.
                05 LVDATA-OBJECT OBJECT REFERENCE.
                05 LVDATA-COLUMN1            PIC X(31).
                05 LVDATA-COLUMN2            PIC X(31).
                05 LVDATA-COLUMN3            PIC X(31).
                05 LVDATA-COLUMN4            PIC X(31).
                05 LVDATA-COLUMN5            PIC X(31).
                05 LVDATA-COLUMN6            PIC X(31).
                05 LVDATA-COLUMN7            PIC X(31).
                05 LVDATA-COLUMN8            PIC X(31).
                05 LVDATA-COLUMN9            PIC X(31).
                05 LVDATA-COLUMN10           PIC X(31).
                05 LVDATA-COLUMN11           PIC X(31).
                05 LVDATA-COLUMN12           PIC X(31).
                05 LVDATA-COLUMN13           PIC X(31).
                05 LVDATA-COLUMN14           PIC X(31).
                05 LVDATA-COLUMN15           PIC X(31).
                05 LVDATA-COLUMN16           PIC X(31).
                05 LVDATA-COLUMN17           PIC X(31).
                05 LVDATA-COLUMN18           PIC X(31).
                05 LVDATA-COLUMN19           PIC X(31).
                05 LVDATA-COLUMN20           PIC X(31).
          03 LVDATA-MAX                      PIC x(2) COMP-X.
          03 LVDRAG-IN-PROGRESS              PIC x COMP-X.
          03 LISTV-01-OBJREF OBJECT REFERENCE.
          03 LVIEW-01-OBJREF OBJECT REFERENCE.
          03 LVIEW-02-OBJREF OBJECT REFERENCE.
          03 CURRENT-WINDOW-SBAR OBJECT REFERENCE.
          03 WIN-01-SBAR-OBJREF OBJECT REFERENCE.
          03 NOME-GER                        PIC X(60).
          03 NOME-VEN                        PIC X(50).
          03 NOME-CLI                        PIC X(50).
          03 PAT-SUBGRUPO                    PIC 9(4).
          03 REG-LIB                         PIC X.
          03 W-STATUS                        PIC 9(3).
          03 W-CTL                           PIC 9.
             88 W-CTL-TRUE                   VALUE 1.
          03 CONTADOR                        PIC 9(6).
          03 MSG                             PIC X(100).
          03 NUM-REG                         PIC 9(3).
          03 XNOME                           PIC X(50).
          03 W-REGBLOQ                       PIC 9.
             88 W-REGBLOQ-TRUE               VALUE 1.
          03 USU                             PIC X(20).
          03 SENHA                           PIC X(64).
          03 CLIFORN-CLI                     PIC X.
          03 LOJA-VEN                        PIC 9(3).
          03 FRO-CLIENTE                     PIC 9(14).
          03 FRO-MODELO                      PIC X(10).
          03 FRO-FABRICANTE                  PIC 9(4).
          03 FRO-ANO                         PIC 9(4).
          03 FRO-CHASSI                      PIC X(20).
          03 FRO-QTVEIC                      PIC 9(5).
          03 FRO-QTPNEU                      PIC 9(5).
          03 FRO-CARROCERIA                  PIC X(50).
          03 FRO-QTPREV-TROCA                PIC 9(5).
          03 FRO-DTPREV-TROCA                PIC 9(8).
          03 FRO-DESCMOD                     PIC X(50).
          03 DTENTRTEC-SEG                   PIC 9(8).
          03 MODELO-MOD                      PIC X(50).
          03 FAB-DESCRICAO                   PIC X(50).
          03 FRO-DTCOMPRA                    PIC 9(8).
          03 CODATIV1-CLI                    PIC 9(3).
          03 CODATIV2-CLI                    PIC 9(3).
          03 CODATIV3-CLI                    PIC 9(3).
          03 CODATIV4-CLI                    PIC 9(3).
          03 W-ATIVIDADE1                    PIC X(20).
          03 W-ATIVIDADE2                    PIC X(20).
          03 W-ATIVIDADE3                    PIC X(20).
          03 W-ATIVIDADE4                    PIC X(20).
          03 VENDEDOR-CLI                    PIC 9(3).
          03 FRO-VENDEDOR                    PIC 9(3).
          03 CHA-SERIE                       PIC X(20).
          03 FRO-FATUR                       PIC X.
          03 FRO-NOVUSA                      PIC X.
          03 FRO-PROGRAMA                    PIC X(8).
          03 W-TUDO                          PIC 9.
             88 W-TUDO-TRUE                  VALUE 1.
          03 FRO-LONGITUDE                   PIC S9(4)V9(6).
          03 FRO-LATITUDE                    PIC S9(4)V9(6).

      *****************************************************************
      *   End of Data Block
      *****************************************************************

      *****************************************************************
      *   Field Numbers
      *****************************************************************

       01 FIELD-NUMBERS.
          03 FLD-NO-CONFIG-FLAG              PIC 9(4) COMP-5 VALUE
                                               1.
          03 FLD-NO-CONFIG-VALUE             PIC 9(4) COMP-5 VALUE
                                               2.
          03 FLD-NO-WINDOW-HANDLE            PIC 9(4) COMP-5 VALUE
                                               4.
          03 FLD-NO-OBJECT-REFERENCE         PIC 9(4) COMP-5 VALUE
                                               5.
          03 FLD-NO-CALL-FUNCTION            PIC 9(4) COMP-5 VALUE
                                               6.
          03 FLD-NO-NUMERIC-VALUE            PIC 9(4) COMP-5 VALUE
                                               7.
          03 FLD-NO-NUMERIC-VALUE2           PIC 9(4) COMP-5 VALUE
                                               8.
          03 FLD-NO-SIZE-WIDTH               PIC 9(4) COMP-5 VALUE
                                               9.
          03 FLD-NO-SIZE-HEIGHT              PIC 9(4) COMP-5 VALUE
                                               10.
          03 FLD-NO-POSITION-X               PIC 9(4) COMP-5 VALUE
                                               11.
          03 FLD-NO-POSITION-Y               PIC 9(4) COMP-5 VALUE
                                               12.
          03 FLD-NO-IO-TEXT-BUFFER           PIC 9(4) COMP-5 VALUE
                                               13.
          03 FLD-NO-IO-TEXT-BUFFER2          PIC 9(4) COMP-5 VALUE
                                               14.
          03 FLD-NO-LVITEM-TEXT              PIC 9(4) COMP-5 VALUE
                                               16.
          03 FLD-NO-LVITEM-LENGTH            PIC 9(4) COMP-5 VALUE
                                               17.
          03 FLD-NO-LVITEM-POSICAO           PIC 9(4) COMP-5 VALUE
                                               18.
          03 FLD-NO-LVITEM-OBJECT            PIC 9(4) COMP-5 VALUE
                                               19.
          03 FLD-NO-LVDATA-ICON              PIC 9(4) COMP-5 VALUE
                                               21.
          03 FLD-NO-LVDATA-OBJECT            PIC 9(4) COMP-5 VALUE
                                               22.
          03 FLD-NO-LVDATA-COLUMN1           PIC 9(4) COMP-5 VALUE
                                               23.
          03 FLD-NO-LVDATA-COLUMN2           PIC 9(4) COMP-5 VALUE
                                               24.
          03 FLD-NO-LVDATA-COLUMN3           PIC 9(4) COMP-5 VALUE
                                               25.
          03 FLD-NO-LVDATA-COLUMN4           PIC 9(4) COMP-5 VALUE
                                               26.
          03 FLD-NO-LVDATA-COLUMN5           PIC 9(4) COMP-5 VALUE
                                               27.
          03 FLD-NO-LVDATA-COLUMN6           PIC 9(4) COMP-5 VALUE
                                               28.
          03 FLD-NO-LVDATA-COLUMN7           PIC 9(4) COMP-5 VALUE
                                               29.
          03 FLD-NO-LVDATA-COLUMN8           PIC 9(4) COMP-5 VALUE
                                               30.
          03 FLD-NO-LVDATA-COLUMN9           PIC 9(4) COMP-5 VALUE
                                               31.
          03 FLD-NO-LVDATA-COLUMN10          PIC 9(4) COMP-5 VALUE
                                               32.
          03 FLD-NO-LVDATA-COLUMN11          PIC 9(4) COMP-5 VALUE
                                               33.
          03 FLD-NO-LVDATA-COLUMN12          PIC 9(4) COMP-5 VALUE
                                               34.
          03 FLD-NO-LVDATA-COLUMN13          PIC 9(4) COMP-5 VALUE
                                               35.
          03 FLD-NO-LVDATA-COLUMN14          PIC 9(4) COMP-5 VALUE
                                               36.
          03 FLD-NO-LVDATA-COLUMN15          PIC 9(4) COMP-5 VALUE
                                               37.
          03 FLD-NO-LVDATA-COLUMN16          PIC 9(4) COMP-5 VALUE
                                               38.
          03 FLD-NO-LVDATA-COLUMN17          PIC 9(4) COMP-5 VALUE
                                               39.
          03 FLD-NO-LVDATA-COLUMN18          PIC 9(4) COMP-5 VALUE
                                               40.
          03 FLD-NO-LVDATA-COLUMN19          PIC 9(4) COMP-5 VALUE
                                               41.
          03 FLD-NO-LVDATA-COLUMN20          PIC 9(4) COMP-5 VALUE
                                               42.
          03 FLD-NO-LVDATA-MAX               PIC 9(4) COMP-5 VALUE
                                               43.
          03 FLD-NO-LVDRAG-IN-PROGRESS       PIC 9(4) COMP-5 VALUE
                                               44.
          03 FLD-NO-LISTV-01-OBJREF          PIC 9(4) COMP-5 VALUE
                                               45.
          03 FLD-NO-LVIEW-01-OBJREF          PIC 9(4) COMP-5 VALUE
                                               46.
          03 FLD-NO-LVIEW-02-OBJREF          PIC 9(4) COMP-5 VALUE
                                               47.
          03 FLD-NO-CURRENT-WINDOW-SBAR      PIC 9(4) COMP-5 VALUE
                                               48.
          03 FLD-NO-WIN-01-SBAR-OBJREF       PIC 9(4) COMP-5 VALUE
                                               49.
          03 FLD-NO-NOME-GER                 PIC 9(4) COMP-5 VALUE
                                               50.
          03 FLD-NO-NOME-VEN                 PIC 9(4) COMP-5 VALUE
                                               51.
          03 FLD-NO-NOME-CLI                 PIC 9(4) COMP-5 VALUE
                                               52.
          03 FLD-NO-PAT-SUBGRUPO             PIC 9(4) COMP-5 VALUE
                                               53.
          03 FLD-NO-REG-LIB                  PIC 9(4) COMP-5 VALUE
                                               54.
          03 FLD-NO-W-STATUS                 PIC 9(4) COMP-5 VALUE
                                               55.
          03 FLD-NO-W-CTL                    PIC 9(4) COMP-5 VALUE
                                               56.
          03 FLD-NO-CONTADOR                 PIC 9(4) COMP-5 VALUE
                                               57.
          03 FLD-NO-MSG                      PIC 9(4) COMP-5 VALUE
                                               58.
          03 FLD-NO-NUM-REG                  PIC 9(4) COMP-5 VALUE
                                               59.
          03 FLD-NO-XNOME                    PIC 9(4) COMP-5 VALUE
                                               60.
          03 FLD-NO-W-REGBLOQ                PIC 9(4) COMP-5 VALUE
                                               61.
          03 FLD-NO-USU                      PIC 9(4) COMP-5 VALUE
                                               62.
          03 FLD-NO-SENHA                    PIC 9(4) COMP-5 VALUE
                                               63.
          03 FLD-NO-CLIFORN-CLI              PIC 9(4) COMP-5 VALUE
                                               64.
          03 FLD-NO-LOJA-VEN                 PIC 9(4) COMP-5 VALUE
                                               65.
          03 FLD-NO-FRO-CLIENTE              PIC 9(4) COMP-5 VALUE
                                               66.
          03 FLD-NO-FRO-MODELO               PIC 9(4) COMP-5 VALUE
                                               67.
          03 FLD-NO-FRO-FABRICANTE           PIC 9(4) COMP-5 VALUE
                                               68.
          03 FLD-NO-FRO-ANO                  PIC 9(4) COMP-5 VALUE
                                               69.
          03 FLD-NO-FRO-CHASSI               PIC 9(4) COMP-5 VALUE
                                               70.
          03 FLD-NO-FRO-QTVEIC               PIC 9(4) COMP-5 VALUE
                                               71.
          03 FLD-NO-FRO-QTPNEU               PIC 9(4) COMP-5 VALUE
                                               72.
          03 FLD-NO-FRO-CARROCERIA           PIC 9(4) COMP-5 VALUE
                                               73.
          03 FLD-NO-FRO-QTPREV-TROCA         PIC 9(4) COMP-5 VALUE
                                               74.
          03 FLD-NO-FRO-DTPREV-TROCA         PIC 9(4) COMP-5 VALUE
                                               75.
          03 FLD-NO-FRO-DESCMOD              PIC 9(4) COMP-5 VALUE
                                               76.
          03 FLD-NO-DTENTRTEC-SEG            PIC 9(4) COMP-5 VALUE
                                               77.
          03 FLD-NO-MODELO-MOD               PIC 9(4) COMP-5 VALUE
                                               78.
          03 FLD-NO-FAB-DESCRICAO            PIC 9(4) COMP-5 VALUE
                                               79.
          03 FLD-NO-FRO-DTCOMPRA             PIC 9(4) COMP-5 VALUE
                                               80.
          03 FLD-NO-CODATIV1-CLI             PIC 9(4) COMP-5 VALUE
                                               81.
          03 FLD-NO-CODATIV2-CLI             PIC 9(4) COMP-5 VALUE
                                               82.
          03 FLD-NO-CODATIV3-CLI             PIC 9(4) COMP-5 VALUE
                                               83.
          03 FLD-NO-CODATIV4-CLI             PIC 9(4) COMP-5 VALUE
                                               84.
          03 FLD-NO-W-ATIVIDADE1             PIC 9(4) COMP-5 VALUE
                                               85.
          03 FLD-NO-W-ATIVIDADE2             PIC 9(4) COMP-5 VALUE
                                               86.
          03 FLD-NO-W-ATIVIDADE3             PIC 9(4) COMP-5 VALUE
                                               87.
          03 FLD-NO-W-ATIVIDADE4             PIC 9(4) COMP-5 VALUE
                                               88.
          03 FLD-NO-VENDEDOR-CLI             PIC 9(4) COMP-5 VALUE
                                               89.
          03 FLD-NO-FRO-VENDEDOR             PIC 9(4) COMP-5 VALUE
                                               90.
          03 FLD-NO-CHA-SERIE                PIC 9(4) COMP-5 VALUE
                                               91.
          03 FLD-NO-FRO-FATUR                PIC 9(4) COMP-5 VALUE
                                               92.
          03 FLD-NO-FRO-NOVUSA               PIC 9(4) COMP-5 VALUE
                                               93.
          03 FLD-NO-FRO-PROGRAMA             PIC 9(4) COMP-5 VALUE
                                               94.
          03 FLD-NO-W-TUDO                   PIC 9(4) COMP-5 VALUE
                                               95.
          03 FLD-NO-FRO-LONGITUDE            PIC 9(4) COMP-5 VALUE
                                               96.
          03 FLD-NO-FRO-LATITUDE             PIC 9(4) COMP-5 VALUE
                                               97.

      *****************************************************************
      *   End of Field Numbers
      *****************************************************************
      *----------------------------------------------------------------*
       01 WK-USUARIO.
          05 WK-USU                PIC 9(010).
          05 WK-DEP                PIC 9(003).
      *----------------------------------------------------------------*
       PROCEDURE DIVISION USING WK-USUARIO DS-CONTROL-BLOCK.
       INICIO-PROGRAMA.
           PERFORM INIC-DIALOG
           INITIALIZE DATA-BLOCK
           MOVE FUNCTION CURRENT-DATE TO WK-DATA
           STRING WK-DIA WK-MES WK-ANO DELIMITED BY SIZE INTO WK-DATACOR
           STRING WK-ANO WK-MES WK-DIA DELIMITED BY SIZE INTO WK-DATAINV
           MOVE VERSION-NO TO DS-VERSION-NO
           MOVE DATA-BLOCK-VERSION-NO TO DS-DATA-BLOCK-VERSION-NO
           MOVE "EST032" TO DS-SET-NAME
           MOVE 3        TO DS-PARAMETER-COUNT
      *----------------------------------------------------------------*
           PERFORM ABRE-MASGER-I
           PERFORM ABRE-MASVEN-I
           PERFORM ABRE-MASPUB-I
           PERFORM ABRE-FROTA
           PERFORM ABRE-LOG
           PERFORM ABRE-CLIENTES-I
           PERFORM ABRE-SEGMENTO
           PERFORM ABRE-CORDENADAS-I
           PERFORM ABRE-MODELOS-I
           PERFORM ABRE-FABRIC-I
           IF WK-USUARIO = ZEROS
              GO TO FIM-PROGRAMA
           ELSE
              PERFORM ABRE-USUARIO
              MOVE WK-USU TO CHAVE-USU OF REG-USU
              PERFORM LE-USUARIO
              PERFORM FECHA-USUARIO
           END-IF.
      *----------------------------------------------------------------*
       OPCOES.
           perform UNTIL W-STATUS = 999
              CALL DIALOG-SYSTEM USING DS-CONTROL-BLOCK
                                       DATA-BLOCK
              EVALUATE W-STATUS
                 WHEN 1
                    INITIALIZE REG-FRO
                    MOVE CORR DATA-BLOCK TO REG-FRO
                    PERFORM LE-FROTA
                    IF VERFS = "9D"
                       MOVE 1 TO W-REGBLOQ

                       MOVE "C"  TO CLIFORN-CLI OF REG-CLI
                       MOVE FRO-CLIENTE    OF DATA-BLOCK
                         TO CGCCPF-CLI     OF REG-CLI
                       PERFORM LE-CLIENTES-A05

                       IF LONGITUDE-CLI OF REG-CLI NOT NUMERIC OR
                          LONGITUDE-CLI OF REG-CLI = ZEROS     OR
                          LONGITUDE-CLI OF REG-CLI = +0202,020202
                          INITIALIZE REG-COR
                          MOVE CIDADE-CLI OF REG-CLI
                            TO CIDADE-COR OF REG-COR
                          MOVE UF-CLI     OF REG-CLI
                            TO ESTADO-COR OF REG-COR
                          MOVE BAIRRO-CLI OF REG-CLI
                            TO BAIRRO-COR OF REG-COR
                          PERFORM LE-CORDENADAS
                          MOVE LONGITUDE-COR OF REG-COR
                            TO FRO-LONGITUDE OF DATA-BLOCK
                          MOVE LATITUDE-COR  OF REG-COR
                            TO FRO-LATITUDE  OF DATA-BLOCK
                       ELSE
                          MOVE LONGITUDE-CLI OF REG-CLI
                            TO FRO-LONGITUDE OF DATA-BLOCK
                          MOVE LATITUDE-CLI  OF REG-CLI
                            TO FRO-LATITUDE  OF DATA-BLOCK
                       END-IF

                       PERFORM REGBLOQ1
                    ELSE
                       MOVE 0 TO W-REGBLOQ
                    END-IF
                    IF VERFS1 = "0" OR "2"
                       IF WK-STAFILE = ZEROS
                          MOVE "S" TO REG-LIB  OF DATA-BLOCK
                          PERFORM INVERTE-DATA-FROTA-REG
                          MOVE CORR REG-FRO TO DATA-BLOCK

                          IF FRO-LONGITUDE OF REG-FRO NOT NUMERIC OR
                             FRO-LONGITUDE OF REG-FRO = ZEROS     OR
                             FRO-LONGITUDE OF REG-FRO = +0202,020202
                             MOVE "C"  TO CLIFORN-CLI OF REG-CLI
                             MOVE FRO-CLIENTE    OF DATA-BLOCK
                               TO CGCCPF-CLI     OF REG-CLI
                             PERFORM LE-CLIENTES-A05
                             IF LONGITUDE-CLI OF REG-CLI NOT NUMERIC OR
                                LONGITUDE-CLI OF REG-CLI = ZEROS     OR
                                LONGITUDE-CLI OF REG-CLI = +0202,020202
                                INITIALIZE REG-COR
                                MOVE CIDADE-CLI OF REG-CLI
                                  TO CIDADE-COR OF REG-COR
                                MOVE UF-CLI     OF REG-CLI
                                  TO ESTADO-COR OF REG-COR
                                MOVE BAIRRO-CLI OF REG-CLI
                                  TO BAIRRO-COR OF REG-COR
                                PERFORM LE-CORDENADAS
                                MOVE LONGITUDE-COR OF REG-COR
                                  TO FRO-LONGITUDE OF DATA-BLOCK
                                MOVE LATITUDE-COR  OF REG-COR
                                  TO FRO-LATITUDE  OF DATA-BLOCK
                             ELSE
                                MOVE LONGITUDE-CLI OF REG-CLI
                                  TO FRO-LONGITUDE OF DATA-BLOCK
                                MOVE LATITUDE-CLI  OF REG-CLI
                                  TO FRO-LATITUDE  OF DATA-BLOCK
                             END-IF
                          END-IF

                          MOVE FRO-CHASSI OF REG-FRO
                            TO CHASSI-SEG OF REG-SEG
                          PERFORM LE-SEGMENTO
                          IF WK-STAFILE = 00
                             MOVE DTENTRTEC-SEG OF REG-SEG
                               TO WK-DATAINV
                             MOVE WK-DIAINV  TO WK-DIACOR
                             MOVE WK-MESINV  TO WK-MESCOR
                             MOVE WK-ANOINV  TO WK-ANOCOR
                             MOVE WK-DATACOR
                               TO DTENTRTEC-SEG OF DATA-BLOCK
                          ELSE
                             MOVE ZEROS
                               TO DTENTRTEC-SEG OF DATA-BLOCK
                          END-IF
                       ELSE
                          MOVE "N" TO REG-LIB  OF DATA-BLOCK
                          MOVE WK-DEP
                            TO LOJA-VEN     OF REG-VEN
                          MOVE VENDEDOR-CLI OF REG-CLI
                            TO COD-VEN      OF REG-VEN
                               FRO-VENDEDOR OF DATA-BLOCK
                          PERFORM LE-MASVEN
                          IF WK-STAFILE = 1
                             MOVE SPACES TO NOME-VEN OF DATA-BLOCK
                          END-IF
                          MOVE ZEROS
                            TO DTENTRTEC-SEG OF DATA-BLOCK
                       END-IF
                    ELSE
                       MOVE "N" TO REG-LIB     OF DATA-BLOCK
                    END-IF
                 WHEN 3
                    INITIALIZE REG-FRO
                    MOVE CORR DATA-BLOCK TO REG-FRO
                    PERFORM START-FROTA-LESS
                    IF WK-ERRO = 93
                       MOVE HIGH-VALUE TO REG-FRO
                       PERFORM START-FROTA-LESS
                       MOVE SPACES TO MSG
                       STRING "Não Existe Registro Anterior, "
                              "Vai para o Fim do Arquivo" INTO MSG
                       MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                    END-IF
                    IF VERFS NOT = ZEROS
                       MOVE SPACES TO MSG
                       STRING "Não Existe Registro no Arquivo-" VERFS
                       INTO MSG
                       MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                    ELSE
                       PERFORM LE-FROTA-PREVIOUS
                       PERFORM INVERTE-DATA-FROTA-REG
                       MOVE CORR REG-FRO TO DATA-BLOCK
                    END-IF
                   when 4
                    INITIALIZE REG-FRO
                    MOVE CORR DATA-BLOCK TO REG-FRO
                    PERFORM START-FROTA-GREATER
                    IF WK-ERRO = 93
                       MOVE LOW-VALUE TO REG-FRO
                       PERFORM START-FROTA
                       MOVE SPACES TO MSG
                       STRING "Não Existe Próximo Registro, "
                              "Vai para o Início do Arquivo" INTO MSG
                       MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                    END-IF
                    IF VERFS NOT = ZEROS
                       MOVE SPACES TO MSG
                       STRING "Não Existe Registro no Arquivo-" VERFS
                       INTO MSG
                       MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                    ELSE
                       PERFORM LE-FROTA-NEXT
                       PERFORM INVERTE-DATA-FROTA-REG
                       MOVE CORR REG-FRO TO DATA-BLOCK
                    END-IF
                   WHEN 5
                      PERFORM INVERTE-DATA-FROTA-DB
                      MOVE CORR DATA-BLOCK TO REG-FRO
                      PERFORM GRAVA-FROTA
                      INITIALIZE REG-SEG
                      MOVE FRO-CHASSI OF REG-FRO
                        TO CHASSI-SEG OF REG-SEG
                      PERFORM LE-SEGMENTO
                      MOVE FRO-CLIENTE OF REG-FRO
                        TO CLIENTEANT-SEG OF REG-SEG,
                           CLIENTE-SEG    OF REG-SEG,
                           PRIMDONO-SEG   OF REG-SEG,
                           CGCCPF-CLI     OF REG-CLI
                      MOVE "C"   TO CLIFORN-CLI OF REG-CLI
                      PERFORM LE-CLIENTES-A05
                      MOVE TIPOPESSOA-CLI    OF REG-CLI
                        TO TIPOCLIANT-SEG    OF REG-SEG,
                           TIPOCLI-SEG       OF REG-SEG,
                           TIPOPRIMDONO-SEG  OF REG-SEG
                      MOVE FRO-MODELO    OF REG-FRO
                        TO CODMOD-SEG    OF REG-SEG
                      MOVE FRO-DESCMOD   OF REG-FRO
                        TO MODELO-SEG    OF REG-SEG
                      MOVE FAB-DESCRICAO OF DATA-BLOCK
                        TO MARCA-SEG     OF REG-SEG
                      MOVE FRO-ANO       OF REG-FRO
                        TO ANO-SEG       OF REG-SEG
                      MOVE FRO-ANO       OF REG-FRO
                        TO ANOMOD-SEG    OF REG-SEG
                      MOVE NOME-VEN      OF DATA-BLOCK
                        TO VEND-SEG      OF REG-SEG
                      MOVE FRO-DTCOMPRA  OF REG-FRO
                        TO DTFATREV-SEG  OF REG-SEG
                      MOVE DTENTRTEC-SEG OF DATA-BLOCK
                        TO WK-DATACOR
                      MOVE WK-DIACOR  TO WK-DIAINV
                      MOVE WK-MESCOR  TO WK-MESINV
                      MOVE WK-ANOCOR  TO WK-ANOINV
                      MOVE WK-DATAINV
                        TO DTENTRTEC-SEG OF REG-SEG
                      PERFORM GRAVA-SEGMENTO
                      PERFORM EXEC-COMMIT
                   WHEN 6
                      IF W-TUDO = 1
                         PERFORM ABRE-USUARIO
                         PERFORM LE-USUARIO
                         PERFORM FECHA-USUARIO
                         IF SENHA OF DATA-BLOCK =
                            SENHA-USU OF REG-USU AND
                            ACESSO-USU OF REG-USU > 0
                            INITIALIZE REG-FRO
                            MOVE FRO-CLIENTE OF DATA-BLOCK
                              TO FRO-CLIENTE OF REG-FRO
                            PERFORM START-FROTA
                            PERFORM UNTIL WK-ERRO NOT = ZEROS
                               PERFORM LE-FROTA-NEXT
                               IF FRO-CLIENTE OF REG-FRO NOT =
                                  FRO-CLIENTE OF DATA-BLOCK
                                  MOVE 93 TO WK-ERRO
                               END-IF
                               IF WK-ERRO = ZEROS
                                  PERFORM DELETE-FROTA
                                  MOVE "Registro Deletado!" TO MSG
                                  MOVE ZEROS TO SENHA
                                  MOVE FUNCTION CURRENT-DATE
                                    TO WK-DATA
                                  ADD  1 TO WK-MIN
                                  INITIALIZE REG-LOG
                                  MOVE WK-DATA   TO CHAVE-LOG
                                  MOVE N0ME-USU  TO USUARIO-LOG
                                  MOVE "EST032 " TO PROGRAMA-LOG
                                  MOVE 01        TO OPER-LOG
                                  STRING
                                    "Registro Deletado!  --> "
                                    "CNPJ: "    FRO-CLIENTE OF REG-FRO
                                    " CHASSI: " FRO-CHASSI  OF REG-FRO
                                    DELIMITED BY SIZE INTO HISTOR-LOG
                                  END-STRING
                                  PERFORM GRAVA-LOG
                               END-IF
                            END-PERFORM
                         ELSE
                            MOVE "Usuário sem permissão!" TO MSG
                            MOVE 93 TO WK-ERRO
                         END-IF
                      ELSE
                         PERFORM ABRE-USUARIO
                         PERFORM LE-USUARIO
                         PERFORM FECHA-USUARIO
                         IF SENHA OF DATA-BLOCK =
                            SENHA-USU OF REG-USU AND
                            ACESSO-USU OF REG-USU > 0
                            PERFORM DELETE-FROTA
                            MOVE FUNCTION CURRENT-DATE TO WK-DATA
                            ADD  1 TO WK-MIN
                            INITIALIZE REG-LOG
                            MOVE WK-DATA   TO CHAVE-LOG
                            MOVE N0ME-USU  TO USUARIO-LOG
                            MOVE "EST032 " TO PROGRAMA-LOG
                            MOVE 01        TO OPER-LOG
                            STRING "Registro Deletado!  --> "
                                   "CNPJ: " FRO-CLIENTE OF REG-FRO
                                   " CHASSI: " FRO-CHASSI OF REG-FRO
                                   DELIMITED BY SIZE INTO HISTOR-LOG
                            END-STRING
                            PERFORM GRAVA-LOG
                         END-IF
                      END-IF
                      MOVE ZEROS TO W-TUDO
                   WHEN 12
                      IF FRO-VENDEDOR OF DATA-BLOCK > ZEROS
                         INITIALIZE REG-VEN
                         MOVE WK-DEP
                           TO LOJA-VEN     OF REG-VEN
                         MOVE FRO-VENDEDOR OF DATA-BLOCK
                           TO COD-VEN      OF REG-VEN
                         PERFORM LE-MASVEN
                         IF WK-STAFILE = 1
                            MOVE ZEROS TO W-STATUS
                            MOVE SPACES TO MSG
                            STRING "Não existe o consultor cadastrado !"
                            INTO MSG
                            MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                            MOVE SPACES TO NOME-VEN OF REG-VEN
                         ELSE
                            MOVE CORR REG-VEN  TO DATA-BLOCK
                         END-IF
                      END-IF
                   WHEN 13
                      INITIALIZE REG-CLI
                      MOVE "C" TO CLIFORN-CLI OF REG-CLI
                      MOVE "J" TO TIPOPESSOA-CLI OF REG-CLI
                      MOVE FRO-CLIENTE OF DATA-BLOCK
                        TO CGCCPF-CLI OF REG-CLI
                      PERFORM LE-CLIENTES-A05
                      IF WK-STAFILE = 1
                         MOVE "F" TO TIPOPESSOA-CLI OF REG-CLI
                         PERFORM LE-CLIENTES-A05
                      END-IF
                      IF VERFS NOT = ZEROS AND "02"
                        MOVE ZEROS TO W-STATUS
                        MOVE SPACES TO MSG
                        STRING "Não existe o cliente cadastrado"
                        INTO MSG
                        MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                        MOVE SPACES TO NOME-CLI OF DATA-BLOCK
                      ELSE
                        MOVE CORR REG-CLI TO DATA-BLOCK
                      END-IF
                   WHEN 15
                      EVALUATE W-CTL
                         WHEN 1
                            IF CODATIV1-CLI OF DATA-BLOCK > ZEROS
                               MOVE CODATIV1-CLI OF DATA-BLOCK
                                 TO CODIGO-PUB   OF REG-PUB
                               PERFORM LE-MASPUB
                               IF WK-STAFILE = 1
                                  MOVE 0 TO W-STATUS
                                  MOVE
                                  "Código da atividade não cadastrado !"
                                  TO MSG
                                  MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                                  MOVE SPACES
                                    TO W-ATIVIDADE1 OF DATA-BLOCK
                               ELSE
                                  MOVE DESCR-PUB OF REG-PUB
                                    TO   W-ATIVIDADE1 OF DATA-BLOCK
                               END-IF
                            END-IF
                         WHEN 2
                            IF CODATIV2-CLI OF DATA-BLOCK > ZEROS
                               MOVE CODATIV2-CLI OF DATA-BLOCK
                                 TO CODIGO-PUB   OF REG-PUB
                               PERFORM LE-MASPUB
                               IF WK-STAFILE = 1
                                  MOVE 0 TO W-STATUS
                                  MOVE
                                  "Código da atividade não cadastrado !"
                                  TO MSG
                                  MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                                  MOVE SPACES
                                    TO W-ATIVIDADE2 OF DATA-BLOCK
                               ELSE
                                  MOVE DESCR-PUB OF REG-PUB
                                    TO   W-ATIVIDADE2 OF DATA-BLOCK
                               END-IF
                            END-IF
                         WHEN 3
                            IF CODATIV3-CLI OF DATA-BLOCK > ZEROS
                               MOVE CODATIV3-CLI OF DATA-BLOCK
                                 TO CODIGO-PUB   OF REG-PUB
                               PERFORM LE-MASPUB
                               IF WK-STAFILE = 1
                                  MOVE 0 TO W-STATUS
                                  MOVE
                                  "Código da atividade não cadastrado !"
                                  TO MSG
                                  MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                                  MOVE SPACES
                                    TO W-ATIVIDADE3 OF DATA-BLOCK
                               ELSE
                                  MOVE DESCR-PUB OF REG-PUB
                                    TO   W-ATIVIDADE3 OF DATA-BLOCK
                               END-IF
                            END-IF
                         WHEN 4
                            IF CODATIV4-CLI OF DATA-BLOCK > ZEROS
                               MOVE CODATIV4-CLI OF DATA-BLOCK
                                 TO CODIGO-PUB   OF REG-PUB
                               PERFORM LE-MASPUB
                               IF WK-STAFILE = 1
                                  MOVE 0 TO W-STATUS
                                  MOVE
                                  "Código da atividade não cadastrado !"
                                  TO MSG
                                  MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                                  MOVE SPACES
                                    TO W-ATIVIDADE4 OF DATA-BLOCK
                               ELSE
                                  MOVE DESCR-PUB OF REG-PUB
                                    TO   W-ATIVIDADE4 OF DATA-BLOCK
                               END-IF
                            END-IF
                      END-EVALUATE
                   WHEN 19
                      MOVE SPACES TO WK-WWW
                      MOVE FRO-LATITUDE  OF DATA-BLOCK TO WK-LATITUDE
                      MOVE FRO-LONGITUDE OF DATA-BLOCK TO WK-LONGITUDE
                      STRING "VISREL /EX https://www;google;com;br/maps"
                             "/place/@" WK-LATITUDE "_" WK-LONGITUDE
                             X"00"
                        INTO WK-WWW
                      END-STRING
                      INSPECT WK-WWW CONVERTING ',;_' TO '..,'

                      MOVE 12 TO WK-CTD
                      MOVE 12 TO WK-CTD1
                      MOVE WK-WWW(1:11) TO WK-WWWV
                      PERFORM UNTIL WK-WWW(WK-CTD:1) = X"00"
                         IF WK-WWW(WK-CTD:1) NOT = SPACE
                            MOVE WK-WWW(WK-CTD:1) TO WK-WWWV(WK-CTD1:1)
                            ADD 1 TO WK-CTD1, WK-CTD
                         ELSE
                            ADD 1 TO WK-CTD
                         END-IF
                      END-PERFORM
                      ADD 1      TO WK-CTD1
                      MOVE X"00" TO WK-WWWV(WK-CTD1:1)
                      STRING WK-WWWV DELIMITED BY X"00"
                             "/ID 0964A8" X"00"
                        INTO WK-WWWV
                      END-STRING

                      call winapi "WinExec" using
                         by reference WK-WWWV,
                         by value 1 size 4
                         returning w-retorno
                      end-call
                   WHEN 20
                      INITIALIZE REG-FABR
                      MOVE FRO-FABRICANTE OF DATA-BLOCK
                        TO FAB-CODIGO OF REG-FABR
                      PERFORM LE-FABRIC
                      IF WK-STAFILE = 1
                        MOVE ZEROS TO W-STATUS
                        MOVE SPACES TO MSG
                        STRING "Não existe fabricante cadastrado"
                        INTO MSG
                        MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                        MOVE SPACES TO FAB-DESCRICAO OF DATA-BLOCK
                      ELSE
                        MOVE CORR REG-FABR TO DATA-BLOCK
                      END-IF
                   WHEN 21
                      IF FRO-MODELO OF DATA-BLOCK = "USADO"
                         IF FRO-DESCMOD OF REG-FRO NOT = SPACES
                            MOVE FRO-DESCMOD OF REG-FRO
                              TO FRO-DESCMOD OF DATA-BLOCK
                         END-IF
                      ELSE
                         INITIALIZE REG-MOD
                         MOVE FRO-MODELO OF DATA-BLOCK
                           TO CODIGO-MOD OF REG-MOD
                         PERFORM LE-MODELOS
                         IF WK-STAFILE = 1
                           MOVE ZEROS TO W-STATUS
                           MOVE SPACES TO MSG
                           STRING "Não existe modelo cadastrado"
                           INTO MSG
                           MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                           MOVE SPACES TO MODELO-MOD OF DATA-BLOCK
                         ELSE
                           MOVE CORR REG-MOD TO DATA-BLOCK
                           MOVE MODELO-MOD  OF REG-MOD
                             TO FRO-DESCMOD OF DATA-BLOCK
                         END-IF
                      END-IF
                   WHEN 23
                       PERFORM TABELA-FROTA-PROG
                   when 24
                    CALL "vei001" USING WK-USUARIO DS-CONTROL-BLOCK
                    CANCEL "vei001"
                   when 25
                    CALL "est031" USING WK-USUARIO DS-CONTROL-BLOCK
                    CANCEL "est031"
                   WHEN 32
                      MOVE LVITEM-TEXT(1) (1:3)
                        TO FRO-VENDEDOR OF DATA-BLOCK
                      MOVE LVITEM-TEXT(2) TO NOME-VEN OF DATA-BLOCK
                   WHEN 33
                      MOVE LVITEM-TEXT(1) (1:14) TO FRO-CLIENTE      OF
                           DATA-BLOCK
                      MOVE LVITEM-TEXT(2)        TO NOME-CLI         OF
                           DATA-BLOCK
                   WHEN 34
                      MOVE LVITEM-TEXT(1) (1:4) TO FRO-ANO           OF
                           DATA-BLOCK
                      MOVE LVITEM-TEXT(2) (1:20) TO FRO-CHASSI       OF
                           DATA-BLOCK
                   WHEN 40
                      MOVE LVITEM-TEXT(1) (1:4) TO FRO-FABRICANTE    OF
                           DATA-BLOCK
                   WHEN 41
                      MOVE LVITEM-TEXT(1)       TO FRO-MODELO        OF
                           DATA-BLOCK
                   WHEN 62
                      PERFORM TABELA-MASVEN-PROG
                   WHEN 63
                      MOVE "C" TO CLIFORN-CLI OF DATA-BLOCK
                      PERFORM TABELA-CLIENTES-PROG
                   WHEN 64
                      PERFORM TABELA-FROTA-PROG
                   WHEN 70
                      PERFORM TABELA-FABRIC
                   WHEN 71
                      PERFORM TABELA-MODELOS-PROG
                   WHEN 72
                      PERFORM MONTA-SEGMENTO
                      MOVE ZEROS TO WK-ERRO
                      MOVE ZEROS TO W-STATUS
                   WHEN 999
                      GO TO FIM-PROGRAMA
               END-EVALUATE
           end-perform.
           EXIT.

      *----------------------------------------------------------------*
       INVERTE-DATA-FROTA-DB SECTION.
           MOVE FRO-DTPREV-TROCA  OF DATA-BLOCK TO WK-DATANOR
           MOVE WK-DIANOR  TO WK-DIAINV
           MOVE WK-MESNOR  TO WK-MESINV
           MOVE WK-ANONOR  TO WK-ANOINV
           MOVE WK-DATAINV TO FRO-DTPREV-TROCA OF DATA-BLOCK
           MOVE FRO-DTCOMPRA      OF DATA-BLOCK TO WK-DATANOR
           MOVE WK-DIANOR  TO WK-DIAINV
           MOVE WK-MESNOR  TO WK-MESINV
           MOVE WK-ANONOR  TO WK-ANOINV
           MOVE WK-DATAINV TO FRO-DTCOMPRA     OF DATA-BLOCK
           EXIT SECTION.
      *----------------------------------------------------------------*
       INVERTE-DATA-FROTA-REG SECTION.
           MOVE FRO-DTPREV-TROCA  OF REG-FRO TO WK-DATAINV
           MOVE WK-DIAINV  TO WK-DIANOR
           MOVE WK-MESINV  TO WK-MESNOR
           MOVE WK-ANOINV  TO WK-ANONOR
           MOVE WK-DATANOR TO FRO-DTPREV-TROCA OF REG-FRO
           MOVE FRO-DTCOMPRA      OF REG-FRO TO WK-DATAINV
           MOVE WK-DIAINV  TO WK-DIANOR
           MOVE WK-MESINV  TO WK-MESNOR
           MOVE WK-ANOINV  TO WK-ANONOR
           MOVE WK-DATANOR TO FRO-DTCOMPRA     OF REG-FRO
           EXIT SECTION.
      *----------------------------------------------------------------*
       TABELA-FROTA-PROG SECTION.
           PERFORM 010-DISPLAY-INICIAL
           INITIALIZE REG-FRO, LVIEW-DATA
           MOVE ZEROS    TO NUM-REG, WK-ERRO
           MOVE FRO-CLIENTE OF DATA-BLOCK TO FRO-CLIENTE OF REG-FRO
           PERFORM START-FROTA
           PERFORM WITH TEST BEFORE VARYING WK-CTD  FROM 1 BY 1
              UNTIL NUM-REG > 998 OR WK-ERRO = 093 OR
              FRO-CLIENTE OF DATA-BLOCK NOT = FRO-CLIENTE OF REG-FRO
              PERFORM LE-FROTA-NEXT
              IF WK-ERRO = ZEROS AND NUM-REG <= 998 AND
                 FRO-CLIENTE OF DATA-BLOCK = FRO-CLIENTE OF REG-FRO
                 PERFORM 010-DISPLAY-PROCESSO
                 ADD  1          TO NUM-REG
                 IF FRO-CHASSI OF REG-FRO = SPACES
                    MOVE "." TO FRO-CHASSI OF REG-FRO
                 END-IF
                 MOVE FRO-CHASSI        OF REG-FRO
                   TO LVDATA-COLUMN1(NUM-REG)
                 MOVE FRO-ANO           OF REG-FRO
                   TO LVDATA-COLUMN2(NUM-REG)
                 MOVE FRO-MODELO        OF REG-FRO
                   TO LVDATA-COLUMN3(NUM-REG)
                      CODIGO-MOD OF REG-MOD
                 IF FRO-DESCMOD OF REG-FRO = SPACES
                    PERFORM LE-MODELOS
                    IF WK-STAFILE = 1
                       MOVE "Modelo não cadastrado"
                         TO  MODELO-MOD OF REG-MOD
                    END-IF
                    MOVE MODELO-MOD OF REG-MOD
                      TO LVDATA-COLUMN4(NUM-REG)
                 ELSE
                    MOVE FRO-DESCMOD OF REG-FRO
                      TO LVDATA-COLUMN4(NUM-REG)
                 END-IF
                 MOVE FRO-FABRICANTE OF REG-FRO
                   TO LVDATA-COLUMN5(NUM-REG)
                      FAB-CODIGO OF REG-FABR
                 PERFORM LE-FABRIC
                 IF WK-STAFILE = 1
                    MOVE "Fabricante não cadastrado"
                      TO FAB-DESCRICAO OF REG-FABR
                 END-IF
                 MOVE FAB-DESCRICAO OF REG-FABR
                   TO LVDATA-COLUMN6(NUM-REG)
                 MOVE FRO-VENDEDOR      OF REG-FRO
                   TO LVDATA-COLUMN7(NUM-REG)
                      COD-VEN      OF REG-VEN
                 MOVE WK-DEP
                   TO LOJA-VEN     OF REG-VEN
                 PERFORM LE-MASVEN
                 IF WK-STAFILE = 1
                    MOVE "Vendedor não cadastrado"
                      TO NOME-VEN OF REG-VEN
                 END-IF
                 MOVE NOME-VEN OF REG-VEN
                   TO LVDATA-COLUMN8(NUM-REG)
                 MOVE FRO-PROGRAMA OF REG-FRO
                   TO LVDATA-COLUMN9(NUM-REG)
              ELSE
                 MOVE 93 TO WK-ERRO
              END-IF
           END-PERFORM
           PERFORM 010-DISPLAY-TOTAL
           EXIT SECTION.

       MONTA-SEGMENTO SECTION.
           INITIALIZE REG-FRO
           MOVE ZEROS    TO  WK-ERRO
           PERFORM START-FROTA
           PERFORM WITH TEST BEFORE VARYING WK-CTD  FROM 1 BY 1
              UNTIL WK-ERRO = 093
              PERFORM LE-FROTA-NEXT
              IF WK-ERRO = ZEROS
                 MOVE FRO-MODELO     OF REG-FRO
                   TO CODIGO-MOD     OF REG-MOD
                 PERFORM LE-MODELOS
                 IF WK-STAFILE = 1
                    MOVE "Modelo não cadastrado"
                      TO  MODELO-MOD OF REG-MOD
                 END-IF
                 MOVE FRO-FABRICANTE OF REG-FRO
                   TO FAB-CODIGO     OF REG-FABR
                 PERFORM LE-FABRIC
                 IF WK-STAFILE = 1
                    MOVE "Fabricante não cadastrado"
                      TO FAB-DESCRICAO OF REG-FABR
                 END-IF
                 MOVE FRO-VENDEDOR OF REG-FRO
                   TO COD-VEN      OF REG-VEN
                 MOVE WK-DEP
                   TO LOJA-VEN     OF REG-VEN
                 PERFORM LE-MASVEN
                 IF WK-STAFILE = 1
                    MOVE "Vendedor não cadastrado"
                      TO NOME-VEN OF REG-VEN
                 END-IF
                 PERFORM 010-DISPLAY-PROCESSO

                 INITIALIZE REG-SEG
                 MOVE FRO-CHASSI OF REG-FRO
                   TO CHASSI-SEG OF REG-SEG
                 PERFORM LE-SEGMENTO
                 IF WK-STAFILE = 01
                    MOVE FRO-CLIENTE OF REG-FRO
                      TO CLIENTEANT-SEG OF REG-SEG,
                         CLIENTE-SEG    OF REG-SEG,
                         PRIMDONO-SEG   OF REG-SEG,
                         CGCCPF-CLI     OF REG-CLI
                    MOVE "C"   TO CLIFORN-CLI OF REG-CLI
                    PERFORM LE-CLIENTES-A05
                    MOVE TIPOPESSOA-CLI    OF REG-CLI
                      TO TIPOCLIANT-SEG    OF REG-SEG,
                         TIPOCLI-SEG       OF REG-SEG,
                         TIPOPRIMDONO-SEG  OF REG-SEG
                    MOVE FRO-MODELO    OF REG-FRO
                      TO CODMOD-SEG    OF REG-SEG
                    MOVE MODELO-MOD    OF REG-MOD
                      TO MODELO-SEG    OF REG-SEG
                    MOVE FAB-DESCRICAO OF REG-FABR
                      TO MARCA-SEG     OF REG-SEG
                    MOVE FRO-ANO       OF REG-FRO
                      TO ANO-SEG       OF REG-SEG
                    MOVE FRO-ANO       OF REG-FRO
                      TO ANOMOD-SEG    OF REG-SEG
                    MOVE NOME-VEN      OF REG-VEN
                      TO VEND-SEG      OF REG-SEG
                    MOVE FRO-DTCOMPRA  OF REG-FRO
                      TO DTFATREV-SEG  OF REG-SEG
                    PERFORM GRAVA-SEGMENTO
                    PERFORM EXEC-COMMIT
                 ELSE
                    IF FRO-CLIENTE OF REG-FRO NOT =
                       CLIENTE-SEG OF REG-SEG
                       MOVE CLIENTE-SEG    OF REG-SEG
                         TO CLIENTEANT-SEG OF REG-SEG
                       MOVE FRO-CLIENTE    OF REG-FRO
                         TO CLIENTE-SEG    OF REG-SEG
                       PERFORM GRAVA-SEGMENTO
                       PERFORM EXEC-COMMIT
                    END-IF
                 END-IF
              END-IF
           END-PERFORM
           EXIT SECTION.


      *----------------------------------------------------------------*
       TABELA-CLIENTES-PROG SECTION.
           INITIALIZE REG-CLI, LVIEW-DATA
           MOVE ZEROS    TO NUM-REG, WK-ERRO
      * Usar a rotina do Lview para mostrar os CLIENTES
      *    Tabela direta nao usa XNOMES  TO ??????????
           MOVE CLIFORN-CLI OF DATA-BLOCK TO CLIFORN-CLI OF REG-CLI
           MOVE XNOME TO NOME-CLI OF REG-CLI
           PERFORM START-CLIENTES-A01
           PERFORM 010-DISPLAY-INICIAL
           PERFORM WITH TEST BEFORE VARYING WK-CTD  FROM 1 BY 1
              UNTIL NUM-REG > 99 OR WK-ERRO = 093
              PERFORM LE-CLIENTES-NEXT
              PERFORM 010-DISPLAY-PROCESSO
              IF CLIFORN-CLI OF REG-CLI NOT =
                 CLIFORN-CLI OF DATA-BLOCK
                 MOVE 93 TO WK-ERRO
              END-IF
              IF WK-ERRO   = ZEROS AND NUM-REG <= 100
                 ADD  1          TO NUM-REG
      *          Mudar estes moves de acordo com o modelo que é usado
      *          no Lview

              MOVE CGCCPF-CLI  OF REG-CLI
                TO LVDATA-COLUMN1(NUM-REG)
              MOVE NOME-CLI    OF REG-CLI
                TO LVDATA-COLUMN2(NUM-REG)
              MOVE CODIGO-CLI  OF REG-CLI
                TO LVDATA-COLUMN3(NUM-REG)
              MOVE CIDADE-CLI  OF REG-CLI
                TO LVDATA-COLUMN4(NUM-REG)
              MOVE UF-CLI  OF REG-CLI
                TO LVDATA-COLUMN5(NUM-REG)

              END-IF
           END-PERFORM
           PERFORM 010-DISPLAY-FIM
           EXIT SECTION.
      *----------------------------------------------------------------*
       TABELA-MASVEN-PROG SECTION.
           INITIALIZE REG-VEN, LVIEW-DATA
           MOVE ZEROS TO NUM-REG, WK-ERRO
           PERFORM START-MASVEN-A01
           PERFORM 010-DISPLAY-INICIAL
           PERFORM WITH TEST BEFORE VARYING WK-CTD  FROM 1 BY 1
              UNTIL NUM-REG > 998 OR WK-ERRO = 093
              PERFORM LE-MASVEN-NEXT
              IF WK-ERRO   = ZEROS AND NUM-REG <= 999 AND
                 LOJA-VEN OF REG-VEN = WK-DEP
                 ADD  1          TO NUM-REG
                 MOVE COD-VEN    OF REG-VEN TO LVDATA-COLUMN1(NUM-REG)
                 MOVE NOME-VEN   OF REG-VEN TO LVDATA-COLUMN2(NUM-REG)
                 PERFORM 010-DISPLAY-PROCESSO
              END-IF
           END-PERFORM
           PERFORM 010-DISPLAY-FIM
           EXIT SECTION.
      *----------------------------------------------------------------*
       TABELA-MODELOS-PROG SECTION.
           INITIALIZE REG-MOD, LVIEW-DATA
           MOVE ZEROS    TO NUM-REG, WK-ERRO
           PERFORM START-MODELOS
           PERFORM 010-DISPLAY-INICIAL
           PERFORM WITH TEST BEFORE VARYING WK-CTD  FROM 1 BY 1
              UNTIL NUM-REG > 998 OR WK-ERRO = 093
              PERFORM LE-MODELOS-NEXT
              IF WK-ERRO   = ZEROS AND NUM-REG <= 999
                 ADD  1          TO NUM-REG
                 PERFORM 010-DISPLAY-PROCESSO

                 MOVE CODIGO-MOD   OF REG-MOD
                   TO LVDATA-COLUMN1(NUM-REG)
                 MOVE MODELO-MOD   OF REG-MOD
                   TO LVDATA-COLUMN2(NUM-REG)
              END-IF
           END-PERFORM
           PERFORM 010-DISPLAY-FIM
           EXIT SECTION.
      *----------------------------------------------------------------*
       TABELA-FABRIC SECTION.
           INITIALIZE REG-FABR LVIEW-DATA
           MOVE ZEROS    TO NUM-REG, WK-ERRO
      * Usar a rotina do Lview para mostrar os FABRIC
      *    Tabela direta nao usa XNOMES  TO ??????????

           perform start-fabric-a01
           PERFORM 010-DISPLAY-INICIAL
           PERFORM WITH TEST BEFORE VARYING WK-CTD  FROM 1 BY 1
              UNTIL NUM-REG > 998 OR WK-ERRO = 093
              perform le-bloq-fabric-next
              IF WK-ERRO   = ZEROS AND NUM-REG <= 999
                 ADD  1          TO NUM-REG
      *          Mudar estes moves de acordo com o modelo que é usado
      *          no Lview
                 PERFORM 010-DISPLAY-PROCESSO

                 MOVE FAB-CODIGO OF REG-FABR
                   TO LVDATA-COLUMN1(NUM-REG)
                 MOVE FAB-DESCRICAO  OF REG-FABR
                   TO LVDATA-COLUMN2(NUM-REG)
              END-IF
           END-PERFORM
           PERFORM 010-DISPLAY-FIM
           EXIT SECTION.
      *----------------------------------------------------------------*
           COPY "ERROS.CPY".
       REGBLOQ SECTION.
           MOVE "Registro Acessado por Outro Usuário" TO MSG
           MOVE "DISPLAY-MSG2" TO DS-PROCEDURE
           EXIT SECTION.
       REGBLOQ1 SECTION.
           MOVE "Registro Acessado por Outro Usuário" TO MSG
           MOVE "DISPLAY-MSG2" TO DS-PROCEDURE
           IF DS-WINDOW-NAME NOT = SPACES
              CALL DIALOG-SYSTEM USING DS-CONTROL-BLOCK DATA-BLOCK
           END-IF
           EXIT SECTION.
       VERIFICA-STATUS SECTION.
           IF DB-GER OF REG-GER = SPACES
           MOVE SPACES       TO TEX-MSG
           MOVE ZERO         TO VERFS-FS2
           IF VERFS = "05" MOVE "00" TO VERFS END-IF
           EVALUATE VERFS1
           WHEN "0"
                PERFORM      VERIFICA-FS0
           WHEN "1"
                PERFORM      VERIFICA-FS1
           WHEN "2" 
                PERFORM      VERIFICA-FS2
           WHEN "3" 
                PERFORM      VERIFICA-FS3
           WHEN "4" 
                PERFORM      VERIFICA-FS4
           WHEN "9"
                PERFORM      VERIFICA-FS
           END-EVALUATE
           ELSE
           MOVE SPACES       TO TEX-MSG
           MOVE ZERO         TO VERFS-FS2
           IF VERFS = "05" MOVE "00" TO VERFS END-IF
           EVALUATE VERFS1
           WHEN "0"
                PERFORM      VERIFICA-FS0
           WHEN "1"
                PERFORM      VERIFICA-FS1
           WHEN "2"
                PERFORM      VERIFICA-FS2
           WHEN "3"
                PERFORM      VERIFICA-FS3
           WHEN "4"
                PERFORM      VERIFICA-FS4
           WHEN "9"
                PERFORM      VERIFICA-FS
           END-EVALUATE

      *    CALL "GetLstMsgErr" USING W-CMD
      *    *> monitorar o erro no BD
      *
      *    MOVE  ZEROS        TO W-CONT1
      *    INSPECT W-CMD TALLYING W-CONT1 FOR CHARACTERS BEFORE X"00"
      *    IF W-CONT1 > ZEROS
      *       IF W-CMD (1:W-CONT1) NOT = SPACES
      *          PERFORM VARYING W-CT1 FROM 1 BY 80
      *                    UNTIL W-CT1 > W-CONT1
      *             MOVE  W-CMD (W-CT1:W-CONT1) TO WK-MSG
      *             IF WK-MSG NOT = SPACES
      *                MOVE WK-MSG TO WK-MSG1
      *             ELSE
      *                MOVE  W-CONT1 TO W-CT1
      *                ADD   1       TO W-CT1
      *             END-IF
      *          END-PERFORM
      *       END-IF
      *    END-IF
      *
      *    IF VERFS1 = "9"
      *       EVALUATE VERFS-FS2
      *         WHEN 27
      *            MOVE    "Access denied for DB/user"
      *              TO    WK-MSG1
      *         WHEN 48
      *            MOVE    "Heap access failure - out of buffer"
      *              TO    WK-MSG1
      *         WHEN 49
      *            MOVE    "Heap deallocated while program inactive"
      *              TO    WK-MSG1
      *         WHEN 50
      *            MOVE    "Backing-file failure: too many files"
      *              TO    WK-MSG1
      *         WHEN 51
      *            MOVE    "Backing-file failure: file access denied"
      *              TO    WK-MSG1
      *         WHEN 52
      *            MOVE    "Backing-file failure: I/O failure"
      *              TO    WK-MSG1
      *         WHEN 04
      *            MOVE    "Nao encontrou no DB tabela procurada - Illeg
      *                    "al file name."
      *              TO    WK-MSG1
      *         WHEN 200
      *            MOVE    "Erro com a execucao de comando da LIBMYSQL c
      *                    "onfira sgamysql.log"
      *              TO    WK-MSG1
      *         WHEN 201
      *            MOVE    "Conexao com servidor perdida."
      *              TO    WK-MSG1
      *       END-EVALUATE
      *    ELSE
      *       EVALUATE VERFS-FS
      *         WHEN "51"
      *            MOVE    "Erro na conexao com o banco de dados atravez
      *                    " da LIBMYSQL"
      *              TO    WK-MSG1
      *         WHEN "53"
      *            MOVE    "Nao foi possivel interpretar campos na tabel
      *                    "a e montar correspondencia."
      *              TO    WK-MSG1
      *         WHEN "91"
      *            MOVE    "Erro na montagem da estrutura da FD,falha mo
      *                    "ntando campos."
      *              TO    WK-MSG1
      *       END-EVALUATE
      *    END-IF



           END-IF
           MOVE WK-MSG       TO MSG
           IF   TEX-MSG = SPACES
                MOVE SPACES TO MSG
           END-IF
           EXIT SECTION.
       VERIFICA-FS SECTION.
           MOVE "9"          TO FS-ERRO
           MOVE LOW-VALUE    TO VERFS1
           MOVE VERFS-FS     TO VERFS-FS2
           MOVE FS-ERRO      TO VERFS1
           EVALUATE VERFS-FS2
           WHEN 002
                MOVE "Arquivo fechado "         TO TEX-MSG
           WHEN 007
                MOVE "Disco cheio "             TO TEX-MSG
           WHEN 013
                MOVE "Arquivo inexistente "     TO TEX-MSG
           WHEN 024
                MOVE "Erro no disco "           TO TEX-MSG
           WHEN 035
                MOVE "Arquivo sem permissão de acesso"
                                                TO TEX-MSG
           WHEN 041
                MOVE "Tabela danificada   "     TO TEX-MSG
           WHEN 065
                MOVE "Arquivo Bloqueado  "      TO TEX-MSG
           WHEN 068
                MOVE "Registro em uso "         TO TEX-MSG
           WHEN 124
                MOVE "Desconectado da rede"     TO TEX-MSG
           WHEN 125
                MOVE "Desconectado da rede"     TO TEX-MSG
           WHEN 139
                MOVE "Registro inconsistente  " TO TEX-MSG
           WHEN 146
                MOVE "Registro inexistente  "   TO TEX-MSG
           WHEN 180
                MOVE "Arquivo Destruido  "
                TO TEX-MSG
           WHEN 208
                MOVE "Erro na rede  "           TO TEX-MSG
           WHEN 213
                MOVE "Muitos bloqueios "        TO TEX-MSG
           WHEN 1423
                MOVE "Registro inexistente  "   TO TEX-MSG
           END-EVALUATE.
           EXIT SECTION.
       VERIFICA-FS0 SECTION.
           MOVE "0"          TO FS-ERRO
           MOVE VERFS-N      TO VERFS-FS2
           EVALUATE VERFS-FS2
           WHEN 005
                MOVE "Tabela  não existe      " TO TEX-MSG
                MOVE  "3"                       TO VERFS1
           END-EVALUATE.
           EXIT SECTION.
       VERIFICA-FS1 SECTION.
           MOVE "1"          TO FS-ERRO
           MOVE VERFS-N      TO VERFS-FS2
           EVALUATE VERFS-FS2
           WHEN 010
                MOVE "Não existe proximo reg. " TO TEX-MSG
           WHEN 014
                MOVE "Registro nao existente " TO TEX-MSG        
           END-EVALUATE.
           EXIT SECTION.
       VERIFICA-FS2 SECTION.
           MOVE "2"          TO FS-ERRO
           MOVE VERFS-N      TO VERFS-FS2
           EVALUATE VERFS-FS2
           WHEN 021
                MOVE "Erro de sequencia " TO TEX-MSG
           WHEN 022
                MOVE "Registro ja existente " TO TEX-MSG
           WHEN 023
                MOVE "Registro não existente " TO TEX-MSG
           END-EVALUATE.
           EXIT SECTION.
       VERIFICA-FS3 SECTION.
           MOVE "3"          TO FS-ERRO
           MOVE VERFS-N      TO VERFS-FS2
           EVALUATE VERFS-FS2
           WHEN 030
                MOVE "Erro permanente " TO TEX-MSG
           WHEN 035
                MOVE "Arquivo não existente " TO TEX-MSG
           WHEN 037
                MOVE "Arquivo aberto indev. " TO TEX-MSG
           WHEN 038
                MOVE "Arquivo bloqueado " TO TEX-MSG     
           WHEN 039
                MOVE "Definicao do arquivo difere " TO TEX-MSG
           END-EVALUATE.
           EXIT SECTION.
       VERIFICA-FS4 SECTION.
           MOVE "4"          TO FS-ERRO
           MOVE VERFS-N      TO VERFS-FS2
           EVALUATE VERFS-FS2
           WHEN 041
                MOVE "Arquivo ja aberto " TO TEX-MSG
           WHEN 042
                MOVE "Arquivo ja fechado " TO TEX-MSG    
           WHEN 043
                MOVE "Operacao em reg. nao lido " TO TEX-MSG
           WHEN 044
                MOVE "Diferenca de tamanho " TO TEX-MSG          
           WHEN 046
                MOVE "Leitura seguencial mal suced. " TO TEX-MSG
           WHEN 047
                MOVE "Leitura incorreta " TO TEX-MSG
           WHEN 048
                MOVE "Inclusao incorreta " TO TEX-MSG    
           WHEN 049
                MOVE "Exclusao ou atual. incorreta " TO TEX-MSG
           END-EVALUATE.
           EXIT SECTION.
       AA000-VERIFICA SECTION.
           IF VERFS1  NOT = "0"
              MOVE SPACES TO MSG
              STRING WK-MSG DELIMITED BY SIZE
                     " programa: " DS-SET-NAME
                     DELIMITED BY SIZE SPACES INTO MSG
              END-STRING
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              IF DS-WINDOW-NAME NOT = SPACES
                 CALL dialog-system USING DS-CONTROL-BLOCK
                                          DATA-BLOCK
                 END-CALL
              END-IF
           END-IF
           IF CRITICO = "S"
              MOVE SPACES TO CRITICO
              MOVE WK-MSG TO MSG              
              IF NAO-SAI NOT = "N"
      *          display "Sair-Programa" at 1801 with blink
                 GO FIM-PROGRAMA
              END-IF
           END-IF
           IF NAO-CRITICO = "S"
              MOVE WK-MSG TO MSG
              MOVE SPACES TO NAO-CRITICO
           END-IF.
           EXIT SECTION.
      *AA001-VERIFICA SECTION.
      *    IF DS-NO-ERROR
      *       MOVE DS-QUIT-SET TO DS-CONTROL
      *       CALL "dsgrun" USING DS-CONTROL-BLOCK
      *                            DATA-BLOCK
      *       END-CALL
      *       MOVE DS-CONTINUE TO DS-CONTROL
      *    END-IF.
      *    EXIT SECTION.

       FIM-PROGRAMA.
           PERFORM FECHA-CLIENTES
           PERFORM FECHA-FABRIC
           PERFORM FECHA-FROTA
           PERFORM FECHA-MASGER
           PERFORM FECHA-MASPUB
           PERFORM FECHA-MASVEN
           PERFORM FECHA-MODELOS
           PERFORM FECHA-SEGMENTO
           PERFORM FECHA-LOG
           PERFORM FECHA-USUARIO
           PERFORM FECHA-CORDENADAS
           COPY "ROTFIM.CPY".
          IF DS-NO-ERROR
             MOVE DS-QUIT-SET TO DS-CONTROL
             CALL "dsgrun" USING DS-CONTROL-BLOCK
                                  DATA-BLOCK
             END-CALL
             MOVE DS-CONTINUE TO DS-CONTROL
          END-IF.
       EXIT-PROG.
          EXIT PROGRAM.
          STOP RUN.
       ZZ999-SAIDA.
          EXIT.

       EXEC-COMMIT SECTION.
          COMMIT
          CALL "FS_STATUS" RETURNING T-STATUS END-CALL
          IF T-STATUS NOT = 0
             ROLLBACK
          END-IF.
          EXIT SECTION.

       CALL-DIALOG SECTION.
          CALL "dsgrun" USING DS-CONTROL-BLOCK DATA-BLOCK END-CALL
          EXIT SECTION.

       INIC-DIALOG SECTION.
          IF DS-CONTROL <= SPACES
             IF DS-WINDOW-NAME NOT = SPACES
                INITIALIZE DS-CONTROL-BLOCK
                MOVE DS-USE-3D-CONTROLS TO DS-CONTROL
                IF WK-CALLDS NOT = "N"
                   CALL DIALOG-SYSTEM USING DS-CONTROL-BLOCK
                END-IF
                MOVE DS-NEW-SET          TO DS-CONTROL
             END-IF
          ELSE
             MOVE DS-PUSH-SET  TO DS-CONTROL
          END-IF.
          MOVE WK-DEP TO CLI-FILIAL    CLI-FILIAL1    MCAI-FILIAL
                         MNAT-FILIAL   MSCOC-FILIAL   MDEP-FILIAL
                         MFOR-FILIAL   MSCOL-FILIAL   MPAG-FILIAL
                         MOPE-FILIAL   MTRI-FILIAL    BCO-FILIAL
                         CAI-FILIAL    REC-FILIAL     PAG-FILIAL
                         VEI-FILIAL    SER-FILIAL     OBO-FILIAL
                         BVU-FILIAL    CPM-FILIAL     EST-FILIAL
                         INS-FILIAL    INV-FILIAL     INVE-FILIAL
                         LOG-FILIAL    MCOB-FILIAL    MDES-FILIAL
                         MDOC-FILIAL   MFAB-FILIAL    MGRU-FILIAL
                         MNIV-FILIAL   MPRG-FILIAL    MPUB-FILIAL
                         MSIT-FILIAL   MVEN-FILIAL    MDS-FILIAL
                         MEC-FILIAL    NEG-FILIAL     AGC-FILIAL
                         ORCP-FILIAL   ORCS-FILIAL    PROP-FILIAL
                         RAT-FILIAL    REQ-FILIAL     WK-EMPEXE
                         SEG-FILIAL    SEGU-FILIAL    SUG-FILIAL
                         VPER-FILIAL   CDT-FILIAL     MDOCP-FILIAL
                         MCOBP-FILIAL  MPER-FILIAL    WK-FILIAL
                         WK-FILIALE    RTNF-FILIAL    AGC-FILIAL
                         REG-FILIAL    COM-FILIAL     COMM-FILIAL
                         PFNF-FILIAL   PDNF-FILIAL    PTIM-FILIAL
                         OFC-FILIAL    REV-FILIAL     ORCPP-FILIAL
                         NBM-FILIAL    PCF-FILIAL     MENT-FILIAL
                         CHP-FILIAL    CHM-FILIAL     PFIS-FILIAL
                         MSER-FILIAL   CFO-FILIAL
          PERFORM ABRE-MASGER-I
          MOVE WK-DEP TO NUMEMPR-GER OF REG-GER
          PERFORM LE-MASGER
          IF UNICOCLI-GER OF REG-GER = "S"
             MOVE "999" TO CLI-FILIAL CLI-FILIAL1
          END-IF
          IF FINANCONSOL-GER OF REG-GER NOT = ZEROS
             MOVE FINANCONSOL-GER OF REG-GER TO CAI-FILIAL
             MOVE FINANCONSOL-GER OF REG-GER TO REC-FILIAL
             MOVE FINANCONSOL-GER OF REG-GER TO PAG-FILIAL
             MOVE FINANCONSOL-GER OF REG-GER TO CPM-FILIAL
             MOVE FINANCONSOL-GER OF REG-GER TO PTIM-FILIAL
          END-IF
          IF VEIFILIAL-GER OF REG-GER NOT NUMERIC
             MOVE ZEROS TO VEIFILIAL-GER OF REG-GER
          END-IF
          IF VEIFILIAL-GER OF REG-GER NOT = ZEROS
             MOVE VEIFILIAL-GER OF REG-GER TO VEI-FILIAL
             MOVE VEIFILIAL-GER OF REG-GER TO SEG-FILIAL
          END-IF
          IF SUPERMP35-GER OF REG-GER IS NOT NUMERIC
             MOVE ZEROS TO  SUPERMP35-GER OF REG-GER
          END-IF
          IF VERSAO-GER OF REG-GER IS NOT NUMERIC
             MOVE ZEROS TO VERSAO-GER OF REG-GER
          END-IF

          IF IP-GER OF REG-GER NOT = SPACES
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@cobban"
               INTO PATH-COBBAN
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@agenda"
               INTO PATH-AGENDA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ageprop"
               INTO PATH-AGEPROP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ageconc"
               INTO PATH-AGECONC
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ageassu"
               INTO PATH-AGEASSU
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@contrato"
               INTO PATH-CONTRATO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@clientes"
               INTO PATH-CLIENTES
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@receber"
               INTO PATH-RECEBER
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@fin_temp"
               INTO PATH-FINTEMP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@recebidos"
               INTO PATH-RECEBIDOS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@pagar"
               INTO PATH-PAGAR
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@pagos"
               INTO PATH-PAGOS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@xmlpagar"
               INTO PATH-XMLPAGAR
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@catalogo"
               INTO PATH-CATALOGO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@estoque"
               INTO PATH-ESTOQUE
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@conv_filtros"
               INTO PATH-CONVFILTROS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@kardex"
               INTO PATH-KARDEX
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@kardexm"
               INTO PATH-KARDEXM
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@resumo"
               INTO PATH-RESUMO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@compras"
               INTO PATH-COMPRAS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@comprasm"
               INTO PATH-COMPRASM
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@reparo"
               INTO PATH-REPARO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@pecobs"
               INTO PATH-PECOBS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@peccont"
               INTO PATH-PECCONT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scoexe"
               INTO PATH-SCOEXE
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scoemp"
               INTO PATH-SCOEMP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scoger"
               INTO PATH-SCOGER
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scogercab"
               INTO PATH-SCOGERCAB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scogerdet"
               INTO PATH-SCOGERDET
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scogerprv"
               INTO PATH-SCOGERPRV
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scogertot"
               INTO PATH-SCOGERTOT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scodep"
               INTO PATH-SCODEP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scopla"
               INTO PATH-SCOPLA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@scosal"
               INTO PATH-SCOSAL
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@cotep"
               INTO PATH-COTEP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@notascab"
               INTO PATH-NOTASCAB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@notasdet"
               INTO PATH-NOTASDET
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@xmlnotacab"
               INTO PATH-XMLNOTASCAB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@xmlnotadet"
               INTO PATH-XMLNOTASDET
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@notasentcab"
               INTO PATH-NOTASENTCAB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@notasentdet"
               INTO PATH-NOTASENTDET
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masfil"
               INTO PATH-MASFIL
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mastrib"
               INTO PATH-MASTRIB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masnbm"
               INTO PATH-MASNBM
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mascfo"
               INTO PATH-MASCFO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masfor"
               INTO PATH-MASFOR
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masprg"
               INTO PATH-MASPRG
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masgru"
               INTO PATH-MASGRU
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mascai"
               INTO PATH-MASCAI
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masope"
               INTO PATH-MASOPE
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masmon"
               INTO PATH-MASMON
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masniv"
               INTO PATH-MASNIV
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masser"
               INTO PATH-MASSER
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@maspub"
               INTO PATH-MASPUB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masos"
               INTO PATH-MASOS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masent"
               INTO PATH-MASENT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masusu"
               INTO PATH-MASUSU
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masfab"
               INTO PATH-MASFAB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@massit"
               INTO PATH-MASSIT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masven"
               INTO PATH-MASVEN
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mds"
               INTO PATH-MDS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mecanico"
               INTO PATH-MECANICO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@itenssub"
               INTO PATH-ITENSSUB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mascobp"
               INTO PATH-MASCOBP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masdocp"
               INTO PATH-MASDOCP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masdoc"
               INTO PATH-MASDOC
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mascob"
               INTO PATH-MASCOB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masdep"
               INTO PATH-MASDEP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masnat"
               INTO PATH-MASNAT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@grfuncao"
               INTO PATH-GRFUNCAO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@defeito"
               INTO PATH-DEFEITO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@medida"
               INTO PATH-MEDIDA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@requis"
               INTO PATH-REQUIS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@cdt"
               INTO PATH-CDT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@tmo"
               INTO PATH-TMO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ordemser"
               INTO PATH-ORDEMSER
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ordemsers"
               INTO PATH-ORDEMSERS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@munic"
               INTO PATH-MUNIC
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@taberros"
               INTO PATH-TABERROS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@fechanf"
               INTO PATH-FECHANF
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@dadosnf"
               INTO PATH-DADOSNF
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@titmov"
               INTO PATH-TITMOV
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@titobs"
               INTO PATH-TITOBS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@histor"
               INTO PATH-HISTOR
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@clifis"
               INTO PATH-CLIFIS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@patrim"
               INTO PATH-PATRIM
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@clientes1"
               INTO PATH-CLIENTES1
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@area"
               INTO PATH-AREA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@dadcont"
               INTO PATH-DADCONT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@precont"
               INTO PATH-PRECONT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@aplic"
               INTO PATH-APLIC
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@log"
               INTO PATH-LOG
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@tipotmo"
               INTO PATH-TIPOTMO
             END-STRING
      *****************************************************************

             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@veiculos"
               INTO PATH-VEICULOS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@instruc"
               INTO PATH-INSTRUC
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@desmod"
               INTO PATH-DESMOD
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@modelos"
               INTO PATH-MODELOS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@opcion"
               INTO PATH-OPCION
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@cores"
               INTO PATH-CORES
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@cotacao"
               INTO PATH-COTACAO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@frota"
               INTO PATH-FROTA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@segmento"
               INTO PATH-SEGMENTO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@icms"
               INTO PATH-ICMS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@funcoes"
               INTO PATH-FUNCOES
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@giaicms"
               INTO PATH-GIAICMS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@revisao"
               INTO PATH-REVISAO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@proposta"
               INTO PATH-PROPOSTA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ficha"
               INTO PATH-FICHA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@negocio"
               INTO PATH-NEGOCIO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@fin_temp"
               INTO PATH-NEGOCIO
             END-STRING

             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@orcamp"
               INTO PATH-ORCAMP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@orcampp"
               INTO PATH-ORCAMPP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@caixa"
               INTO PATH-CAIXA
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@caixacab"
               INTO PATH-CAIXACAB
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@movtit"
               INTO PATH-MOVTIT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@pecfal"
               INTO PATH-PECFAL
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@chamados"
               INTO PATH-CHAMADOS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@chapecas"
               INTO PATH-CHAPECAS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@comprom"
               INTO PATH-COMPROM
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@bvu"
               INTO PATH-BVU
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masdes"
               INTO PATH-MASDES
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@masper"
               INTO PATH-MASPER
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@objetivo"
               INTO PATH-OBJETIVO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@rateio"
               INTO PATH-RATEIO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@orcser"
               INTO PATH-ORCSER
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@orcserp"
               INTO PATH-ORCSERP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@orcsers"
               INTO PATH-ORCSERS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@seguro"
               INTO PATH-SEGURO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@sugestao"
               INTO PATH-SUGESTAO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@vendper"
               INTO PATH-VENDPER
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@vendperobs"
               INTO PATH-VENDPEROBS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@giro"
               INTO PATH-GIRO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@fabric"
               INTO PATH-FABRIC
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ratnfe"
               INTO PATH-RATNFE
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@regiao"
               INTO PATH-REGIAO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@cordenadas"
               INTO PATH-CORDENADAS
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@agemec"
               INTO PATH-AGEMEC
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@maspag"
               INTO PATH-MASPAG
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ofcont"
               INTO PATH-OFCONT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@bancos"
               INTO PATH-BANCO
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@modcomp"
               INTO PATH-MODCOMP
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@potencial"
               INTO PATH-POTENCIAL
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@vendpag"
               INTO PATH-VENDPAG
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@mancont"
               INTO PATH-MANCONT
             END-STRING
             STRING "@" IP-GER OF REG-GER DELIMITED BY SPACE
                    "@3306@root@k15720@"
                    DB-GER OF REG-GER     DELIMITED BY SPACE
                    "@ibmmq"
               INTO PATH-IBMMQ
             END-STRING



          ELSE
              MOVE "../arq/agenda.dat"        TO PATH-AGENDA
              MOVE "../arq/ageprop.dat"       TO PATH-AGEPROP
              MOVE "../arq/ageconc.dat"       TO PATH-AGECONC
              MOVE "../arq/ageassu.dat"       TO PATH-AGEASSU
              MOVE "../arq/scodep.dat"        TO PATH-SCODEP
              MOVE "../arq/scoemp.dat"        TO PATH-SCOEMP
              MOVE "../arq/scopla.dat"        TO PATH-SCOPLA
              MOVE "../arq/cotep.dat"         TO PATH-COTEP
              MOVE "../arq/kardex.dat"        TO PATH-KARDEX
              MOVE "../arq/kardexm.dat"       TO PATH-KARDEXM
              MOVE "../arq/resumo.dat"        TO PATH-RESUMO
              MOVE "../arq/notascab.dat"      TO PATH-NOTASCAB
              MOVE "../arq/notasdet.dat"      TO PATH-NOTASDET
              MOVE "../arq/notasentcab.dat"   TO PATH-NOTASENTCAB
              MOVE "../arq/notasentdet.dat"   TO PATH-NOTASENTDET
              MOVE "../arq/scoexe.dat"        TO PATH-SCOEXE
              MOVE "../arq/scoemp.dat"        TO PATH-SCOEMP
              MOVE "../arq/scoger.dat"        TO PATH-SCOGER
              MOVE "../arq/scogercab.dat"     TO PATH-SCOGERCAB
              MOVE "../arq/scogerdet.dat"     TO PATH-SCOGERDET
              MOVE "../arq/scogerprv.dat"     TO PATH-SCOGERPRV
              MOVE "../arq/scogertot.dat"     TO PATH-SCOGERTOT
              MOVE "../arq/scopla.dat"        TO PATH-SCOPLA
              MOVE "../arq/scosal.dat"        TO PATH-SCOSAL
              MOVE "../arq/cobban.dat"        TO PATH-COBBAN
              MOVE "../arq/reparo.dat"        TO PATH-REPARO
              STRING "../arq/" COM-FILIAL "compras.dat"
                INTO PATH-COMPRAS
              END-STRING
              STRING "../arq/" COMM-FILIAL "comprasm.dat"
                INTO PATH-COMPRASM
              END-STRING
              STRING "../arq/" CLI-FILIAL "clientes.dat"
                INTO PATH-CLIENTES
              END-STRING
              STRING "../arq/" EST-FILIAL "estoque.dat"
                INTO PATH-ESTOQUE
              END-STRING
              STRING "../arq/" REC-FILIAL "receber.dat"
                INTO PATH-RECEBER
              END-STRING
              STRING "../arq/" PAG-FILIAL "pagar.dat"
                INTO PATH-PAGAR
              END-STRING

              MOVE  "../arq/munic.dat"    TO PATH-MUNIC
              MOVE  "../arq/grfuncao.dat" TO PATH-GRFUNCAO
              MOVE  "../arq/defeito.dat"  TO PATH-DEFEITO
              MOVE  "../arq/medida.dat"   TO PATH-MEDIDA
              MOVE  "../arq/mastrib.dat"  TO PATH-MASTRIB
              MOVE  "../arq/masnat.dat"   TO PATH-MASNAT
              MOVE  "../arq/masnbm.dat"   TO PATH-MASNBM
              MOVE  "../arq/mascfo.dat"   TO PATH-MASCFO
              MOVE  "../arq/masent.dat"   TO PATH-MASENT
              MOVE  "../arq/masprg.dat"   TO PATH-MASPRG
              MOVE  "../arq/masusu.dat"   TO PATH-MASUSU
              MOVE  "../arq/masos.dat"    TO PATH-MASOS
              MOVE  "../arq/masgru.dat"   TO PATH-MASGRU
              MOVE  "../arq/masope.dat"   TO PATH-MASOPE
              MOVE  "../arq/masniv.dat"   TO PATH-MASNIV
              MOVE  "../arq/maspub.dat"   TO PATH-MASPUB
              MOVE  "../arq/masfab.dat"   TO PATH-MASFAB
              MOVE  "../arq/massit.dat"   TO PATH-MASSIT
              MOVE  "../arq/masven.dat"   TO PATH-MASVEN
              MOVE  "../arq/itenssub.dat"  TO PATH-ITENSSUB
              MOVE  "../arq/masfor.dat"   TO PATH-MASFOR
              MOVE  "../arq/mascai.dat"   TO PATH-MASCAI
              MOVE  "../arq/mds.dat"      TO PATH-MDS
              MOVE  "../arq/mecanico.dat" TO PATH-MECANICO
              MOVE  "../arq/mascobp.dat"  TO PATH-MASCOBP
              MOVE  "../arq/masdocp.dat"  TO PATH-MASDOCP
              MOVE  "../arq/masdoc.dat"   TO PATH-MASDOC
              MOVE  "../arq/mascob.dat"   TO PATH-MASCOB
              MOVE  "../arq/masdep.dat"   TO PATH-MASDEP
              MOVE  "../arq/requis.dat"   TO PATH-REQUIS
              MOVE  "../arq/cdt.dat"      TO PATH-CDT
              MOVE  "../arq/ordemser.dat" TO PATH-ORDEMSER
              MOVE  "../arq/ordemsers.dat" TO PATH-ORDEMSERS
              MOVE  "../arq/tmo.dat"      TO PATH-TMO
              MOVE  "../arq/fechanf.dat"  TO PATH-FECHANF
              MOVE  "../arq/dadosnf.dat"  TO PATH-DADOSNF
              MOVE  "../arq/titmov.dat"   TO PATH-TITMOV
              MOVE  "../arq/titmov.dat"   TO PATH-TITOBS
              MOVE  "../arq/histor.dat"   TO PATH-HISTOR
              MOVE  "../arq/clifis.dat"   TO PATH-CLIFIS
              MOVE  "../arq/clientes1.dat" TO PATH-CLIENTES1
              MOVE  "../arq/area.dat"     TO PATH-AREA
              MOVE  "../arq/dadcont.dat"  TO PATH-DADCONT
              MOVE  "../arq/precont.dat"  TO PATH-PRECONT
              MOVE  "../arq/aplic.dat"    TO PATH-APLIC
              MOVE  "../arq/catalogo.dat" TO PATH-CATALOGO
              MOVE  "../arq/log.dat"      TO PATH-LOG
              MOVE  "../arq/patrim.dat"   TO PATH-PATRIM
              MOVE  "../arq/tipotmo.dat"  TO PATH-TIPOTMO
      *****************************************************************

              MOVE "../arq/veiculos.dat"  TO PATH-VEICULOS
              MOVE "../arq/instruc.dat"   TO PATH-INSTRUC
              MOVE "../arq/desmod.dat"    TO PATH-DESMOD
              MOVE "../arq/modelos.dat"   TO PATH-MODELOS
              MOVE "../arq/opcion.dat"    TO PATH-OPCION
              MOVE "../arq/cores.dat"     TO PATH-CORES
              MOVE "../arq/cotacao.dat"   TO PATH-COTACAO
              MOVE "../arq/frota.dat"     TO PATH-FROTA
              MOVE "../arq/segmento.dat"  TO PATH-SEGMENTO
              MOVE "../arq/icms.dat"      TO PATH-ICMS
              MOVE "../arq/funcoes.dat"   TO PATH-FUNCOES
              MOVE "../arq/giaicms.dat"   TO PATH-GIAICMS
              MOVE "../arq/revisao.dat"   TO PATH-REVISAO
              MOVE "../arq/proposta.dat"  TO PATH-PROPOSTA
              MOVE "../arq/negocio.dat"   TO PATH-NEGOCIO
              MOVE "../arq/ficha.dat"     TO PATH-FICHA

              MOVE "../arq/orcamp.dat"   TO PATH-ORCAMP
              MOVE "../arq/orcampp.dat"  TO PATH-ORCAMPP
              MOVE "../arq/caixa.dat"    TO PATH-CAIXA
              MOVE "../arq/caixacab.dat" TO PATH-CAIXACAB
              MOVE "../arq/movtit.dat"   TO PATH-MOVTIT
              MOVE "../arq/pecfal.dat"   TO PATH-PECFAL
              MOVE "../arq/chamados.dat" TO PATH-CHAMADOS
              MOVE "../arq/chapecas.dat" TO PATH-CHAPECAS
              MOVE "../arq/comprom.dat"  TO PATH-COMPROM
              MOVE "../arq/bvu.dat"      TO PATH-BVU
              MOVE "../arq/masdes.dat"   TO PATH-MASDES
              MOVE "../arq/masper.dat"   TO PATH-MASPER
              MOVE "../arq/objetivo.dat" TO PATH-OBJETIVO
              MOVE "../arq/rateio.dat"   TO PATH-RATEIO
              MOVE "../arq/orcser.dat"   TO PATH-ORCSER
              MOVE "../arq/orcserp.dat"  TO PATH-ORCSERP
              MOVE "../arq/orcsers.dat"  TO PATH-ORCSERS
              MOVE "../arq/seguro.dat"   TO PATH-SEGURO
              MOVE "../arq/sugestao.dat" TO PATH-SUGESTAO
              MOVE "../arq/vendper.dat"  TO PATH-VENDPER
              MOVE "../arq/vendperobs.dat"  TO PATH-VENDPEROBS
              MOVE "../arq/giro.dat"     TO PATH-GIRO
              MOVE "../arq/fabric.dat"   TO PATH-FABRIC
              MOVE "../arq/ratnfe.dat"   TO PATH-RATNFE
              MOVE "../arq/regiao.dat"   TO PATH-REGIAO
              MOVE "../arq/agemec.dat"   TO PATH-AGEMEC
              MOVE "../arq/ofcont.dat"   TO PATH-OFCONT
              MOVE "../arq/maspag.dat"   TO PATH-MASPAG
              MOVE "../arq/masser.dat"   TO PATH-MASSER
              MOVE "../arq/comprom.dat"  TO PATH-COMPROM
              MOVE "../arq/bancos.dat"   TO PATH-BANCO
              MOVE "../arq/modcomp.dat"  TO PATH-MODCOMP
              MOVE "../arq/potencial.dat" TO PATH-POTENCIAL
              MOVE "../arq/vendpag.dat"   TO PATH-VENDPAG
              MOVE "../arq/mancont.dat"   TO PATH-MANCONT

          END-IF
          PERFORM FECHA-MASGER
          MOVE 300        TO    W-TIME
      *   CALL "LockTime" USING W-TIME.
          EXIT SECTION.
      *----------------------------------------------------------------*
       GERAL SECTION.
          MOVE 20190105 TO WK-VERSAO
      *   início consitência inventário
          IF IDIOMA-GER OF REG-GER NOT = "E" AND
             WK-USU                NOT = 98

          CALL "CBL_TOUPPER" USING DS-SET-NAME
                BY VALUE      10
                RETURNING     STATUS-CODE
          IF DS-SET-NAME = "CTR101"  OR
                           "EST001C" OR
                           "EST003"  OR
                           "EST004"  OR
                           "EST005"  OR
                           "EST006"  OR
                           "EST008"  OR
                           "EST010"  OR
                           "EST012"  OR
                           "EST014"  OR
                           "EST016"  OR
                           "EST019"  OR
                           "EST033"  OR
                           "EST049"  OR
                           "SER007"  OR
                           "VEI006"
             MOVE CGC-GER OF REG-GER TO WK-CGC-GER
             IF ANOMESINV-GER OF REG-GER IS NOT NUMERIC
                MOVE ZEROS TO ANOMESINV-GER OF REG-GER
             END-IF
             IF DS-SET-NAME NOT = "EST001C" AND
                                  "EST004"  AND
                                  "EST005"  AND
                                  "EST014"
                MOVE FUNCTION CURRENT-DATE TO WK-DATA
             END-IF
             STRING WK-ANO WK-MES INTO WANOMES
             IF WANOMES <= ANOMESINV-GER OF REG-GER
                MOVE SPACES TO MSG
                STRING "Inventário mensal de "
                       ANOMESINV-GER OF REG-GER(5:2) "/"
                       ANOMESINV-GER OF REG-GER(1:4)
                       " fechado! "
                       " Movimentação do estoque sera liberada mas é "
                       " necessario gerar o inventário novamente para "
                       " atualizar o novo custo médio."
                DELIMITED BY SIZE SPACES
                     INTO MSG
                END-STRING
                MOVE FUNCTION CURRENT-DATE TO WK-DATA
                MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                CALL "dsgrun" USING DS-CONTROL-BLOCK
                                   DATA-BLOCK
                END-CALL
             END-IF
      *      MOVE ANOMESINV-GER OF REG-GER(5:2) TO INV-ANOMES(1:2)
      *      MOVE ANOMESINV-GER OF REG-GER(1:4) TO INV-ANOMES(3:4)
      *      CALL "CBL_CHECK_FILE_EXIST" USING  PATH-INVENT
      *                                         FILE-DETAILS
      *                               RETURNING STATUS-CODE
      *      END-CALL
      *      IF STATUS-CODE = ZEROS
      *         IF WK-MES = INV-ANOMES(1:2) AND
      *            WK-ANO = INV-ANOMES(3:4)
      *            STRING "Arquivo de inventário " PATH-INVENT
      *                   " gerado! "
      *             " Movimentação do estoque sera liberada mas é "
      *             " necessario gerar o inventário novamente para "
      *             " atualizar o novo custo médio."
      *            DELIMITED BY SIZE SPACES
      *               INTO MSG
      *            END-STRING
      *            MOVE FUNCTION CURRENT-DATE TO WK-DATA
      *            MOVE "DISPLAY-MSG" TO DS-PROCEDURE
      *            CALL "dsgrun" USING DS-CONTROL-BLOCK
      *                               DATA-BLOCK
      *            END-CALL
      *         END-IF
      *      END-IF
             MOVE WK-MES                        TO INV-ANOMES(1:2)
             MOVE WK-ANO                        TO INV-ANOMES(3:4)
             CALL "CBL_CHECK_FILE_EXIST" USING  PATH-INVENT
                                                FILE-DETAILS
                                      RETURNING STATUS-CODE
             END-CALL
             IF STATUS-CODE = ZEROS
                IF WK-MES = INV-ANOMES(1:2) AND
                   WK-ANO = INV-ANOMES(3:4)
                   STRING "Arquivo de inventário " PATH-INVENT
                          " gerado! "
                    " Movimentação do estoque sera liberada mas é "
                    " necessario gerar o inventário novamente para "
                    " atualizar o novo custo médio."
                   DELIMITED BY SIZE SPACES
                        INTO MSG
                   END-STRING
                   MOVE FUNCTION CURRENT-DATE TO WK-DATA
                   MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                   CALL "dsgrun" USING DS-CONTROL-BLOCK
                                      DATA-BLOCK
                   END-CALL
                END-IF
             END-IF
      *      MOVE FUNCTION CURRENT-DATE TO WK-DATA
      *      MOVE ANOMESINV-GER OF REG-GER TO WANOMES
      *      ADD 1 TO ANOMES-MES
      *      IF ANOMES-MES > 12
      *         MOVE 01 TO ANOMES-MES
      *         ADD   1 TO ANOMES-ANO
      *      END-IF
      *      IF WK-MES NOT = ANOMES-MES OR
      *         WK-ANO NOT = ANOMES-ANO
      *         MOVE ANOMESINV-GER OF REG-GER TO WANOMES
      *         IF IDIOMA-GER OF REG-GER = "E"
      *            STRING " Último inventario mensual en "
      *                   ANOMES-MES "/" ANOMES-ANO
      *                   " Mes y Año de la computadora"
      *                     WK-MES "/" WK-ANO
      *                   " Movimiento del stock no permitida en el"
      *                   " programa: " DS-SET-NAME
      *            DELIMITED BY SIZE SPACES INTO MSG
      *         ELSE
      *            STRING " Último inventário mensal em "
      *                   ANOMES-MES "/" ANOMES-ANO
      *                   " Mes e Ano da Máquina " WK-MES "/" WK-ANO
      *                   " Movimentação do estoque não permitida no"
      *                   " programa: " DS-SET-NAME
      *            DELIMITED BY SIZE SPACES INTO MSG
      *         END-IF
      *         PERFORM ABORTA
      *      END-IF
             PERFORM CONTROLE-VERSAO
          END-IF
          END-IF
          IF DS-SET-NAME = "AJU001"  OR
             DS-SET-NAME = "EST166"  OR
             DS-SET-NAME = "LFE102"  OR
             DS-SET-NAME = "LFS102"  OR
             DS-SET-NAME = "REMESSA" OR
             DS-SET-NAME = "RETORNO" OR
             DS-SET-NAME = "RMI001"  OR
             DS-SET-NAME = "RMI101"  OR
             DS-SET-NAME = "RMI103"
             PERFORM CONTROLE-VERSAO
          END-IF
      *   fim consitência inventário
          MOVE FUNCTION CURRENT-DATE TO WK-DATA
          EXIT SECTION.
      *----------------------------------------------------------------*
       CONTROLE-VERSAO SECTION.
      *   IF WK-VERSAO NOT = VERSAO-GER OF REG-GER
      *      MOVE 36 TO TIT-LEN
      *      MOVE SPACES TO TIT-TEXT
      *      MOVE VERSAO-GER OF REG-GER TO WK-VERSAO-GER
      *      STRING DS-SET-NAME(1:10) WK-VERSAO-GER WK-VERSAO
      *        INTO TIT-TEXT
      *      CALL "EST051" USING WK-USUARIO DS-CONTROL-BLOCK TITULO
      *      CANCEL "EST051"
      *      PERFORM INIC-DIALOG
      *      IF WK-VERSAO NOT = VERSAO-GER OF REG-GER
      *         MOVE SPACES TO MSG
      *         IF IDIOMA-GER OF REG-GER NOT = "E"
      *            STRING " Versão do programa " DS-SET-NAME(1:8)
      *                   " incompativel! "
      *              INTO MSG
      *         ELSE
      *            STRING " Version del programa " DS-SET-NAME(1:8)
      *                   " incompatible! "
      *              INTO MSG
      *         END-IF
      *         PERFORM ABORTA
      *      END-IF
      *   END-IF
          EXIT SECTION.
      *----------------------------------------------------------------*
       ABORTA.
          MOVE FUNCTION CURRENT-DATE TO WK-DATA
          MOVE "DISPLAY-MSG" TO DS-PROCEDURE
          CALL "dsgrun" USING DS-CONTROL-BLOCK
                             DATA-BLOCK
          END-CALL
          GO FIM-PROGRAMA.
          .
      *----------------------------------------------------------------*
       TEMPORIZADOR SECTION.
          MOVE FUNCTION CURRENT-DATE TO WK-DATA
          COMPUTE WK-TEMPO-ANTERIOR = (WK-HRH * 360) +
                                      (WK-MIN * 60)  +
                                       WK-SEC
          ADD 10 TO WK-TEMPO-ANTERIOR
          MOVE ZEROS   TO WK-TEMPO-ATUAL
          PERFORM UNTIL WK-TEMPO-ATUAL > WK-TEMPO-ANTERIOR
             MOVE FUNCTION CURRENT-DATE TO WK-DATA
             COMPUTE WK-TEMPO-ATUAL = (WK-HRH * 360) +
                                      (WK-MIN * 60)  +
                                       WK-SEC
          END-PERFORM
          EXIT SECTION.

       DATA-SQL SECTION.
          IF DTTEMP(1:8)  NOT NUMERIC
             MOVE ZEROS TO DTTEMP(1:8)
          END-IF
          IF DTTEMP(1:8) = ZEROS
             MOVE "0000-00-00" TO DTTEMP
             MOVE -1         TO DTNULL
          ELSE
             IF DTTEMP(18:1) = "N"
                MOVE DTTEMP(1:8) TO WK-DATACOR
                STRING WK-ANOCOR "-" WK-MESCOR "-" WK-DIACOR
                    DELIMITED BY SIZE INTO DTTEMP(1:10)
                END-STRING
                MOVE 0         TO DTNULL
             ELSE
                MOVE DTTEMP(1:8) TO WK-DATAINV
                STRING WK-ANOINV "-" WK-MESINV "-" WK-DIAINV
                    DELIMITED BY SIZE INTO DTTEMP(1:10)
                END-STRING
                MOVE 0         TO DTNULL
             END-IF
          END-IF
          EXIT SECTION.

       SQL-DATA SECTION.
          IF DTTEMP(18:1) NOT = "N"
             STRING DTTEMP(1:4) DTTEMP(6:2) DTTEMP(9:2) INTO WK-DATAINV
             END-STRING
             MOVE WK-DATAINV TO WK-DATACOR
          ELSE
             STRING DTTEMP(9:2) DTTEMP(6:2) DTTEMP(1:4) INTO WK-DATACOR
             END-STRING
          END-IF
          EXIT SECTION.


      *----------------------------------------------------------------*
           COPY "DISPLAYT.CPY".
       010-DISPLAY-INICIAL SECTION.
           MOVE ZEROS             TO CONTADOR
           IF IDIOMA-GER OF REG-GER = "P"
              MOVE "Processando..."  TO IO-TEXT-BUFFER
           END-IF
           IF IDIOMA-GER OF REG-GER = "E"
              MOVE "Procesando..."  TO IO-TEXT-BUFFER
           END-IF
           MOVE "MOSTRA-MSG"      TO DS-PROCEDURE
           call "dsgrun" using ds-control-block data-block.
           EXIT SECTION.
       010-DISPLAY-PROCESSO SECTION.
           ADD  1 TO CONTADOR
           MOVE SPACES TO IO-TEXT-BUFFER
           IF IDIOMA-GER OF REG-GER = "P"
              STRING "Processando... " DELIMITED BY SIZE
                     CONTADOR          DELIMITED BY SIZE
                     INTO IO-TEXT-BUFFER
              END-STRING
           END-IF
           IF IDIOMA-GER OF REG-GER = "E"
              STRING "Procesando... " DELIMITED BY SIZE
                     CONTADOR         DELIMITED BY SIZE
                     INTO IO-TEXT-BUFFER
              END-STRING
           END-IF
           MOVE "MOSTRA-MSG" TO DS-PROCEDURE
           call "dsgrun" using ds-control-block data-block.
           EXIT SECTION.
       010-DISPLAY-PROCESSO2 SECTION.
           ADD  1 TO CONTADOR
           PERFORM VARYING WK-POS FROM 1 BY 1 UNTIL
              IO-TEXT-BUFFER (WK-POS:2) = "  "
           END-PERFORM
           ADD 2 TO WK-POS
           MOVE CONTADOR TO IO-TEXT-BUFFER (WK-POS:7)
           MOVE "MOSTRA-MSG" TO DS-PROCEDURE
           call "dsgrun" using ds-control-block data-block.
           EXIT SECTION.
       010-DISPLAY-PROCESSO50 SECTION.
           ADD  1 TO CONTADOR
           IF CONTADOR(5:2) = "00" OR "50"
              PERFORM VARYING WK-POS FROM 1 BY 1 UNTIL
                 IO-TEXT-BUFFER (WK-POS:2) = "  "
              END-PERFORM
              ADD 2 TO WK-POS
              MOVE CONTADOR TO IO-TEXT-BUFFER (WK-POS:7)
              MOVE "MOSTRA-MSG" TO DS-PROCEDURE
              call "dsgrun" using ds-control-block data-block
           END-IF
           EXIT SECTION.
       010-DISPLAY-FIM SECTION.
           IF IDIOMA-GER OF REG-GER = "P"
              MOVE "Fim do Processamento" TO IO-TEXT-BUFFER
           END-IF
           IF IDIOMA-GER OF REG-GER = "E"
              MOVE "Fin del Procesamiento" TO IO-TEXT-BUFFER
           END-IF
           MOVE "MOSTRA-MSG" TO DS-PROCEDURE
           call "dsgrun" using ds-control-block data-block.
           EXIT SECTION.
       010-DISPLAY-TOTAL SECTION.
           MOVE SPACES TO IO-TEXT-BUFFER
           MOVE CONTADOR TO CONTADOR-R
           STRING "Total... " CONTADOR-R DELIMITED BY SIZE
                  INTO IO-TEXT-BUFFER
           END-STRING
           MOVE "MOSTRA-MSG" TO DS-PROCEDURE
           call "dsgrun" using ds-control-block data-block.
           EXIT SECTION.
       010-DISPLAY-TEMPORIZADOR SECTION.
           MOVE "MOSTRA-MSG" TO DS-PROCEDURE
           call "dsgrun" using ds-control-block data-block.
           EXIT SECTION.

           COPY "CLIENTES.CPY".
       ABRE-CLIENTES SECTION.
           OPEN I-O CLIENTES.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CLIENTES"   TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-CLIENTES
           ELSE
              MOVE "S"         TO ARQ-CLIENTES
           END-IF.
           PERFORM AA000-VERIFICA.

           OPEN I-O CLIFIS.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CLIFIS"    TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-CLIFIS
           ELSE
              MOVE "S"         TO ARQ-CLIFIS
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.


       ABRE-CLIENTES-I SECTION.
           OPEN INPUT CLIENTES.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CLIENTES"   TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-CLIENTES
           ELSE
              MOVE "S"         TO ARQ-CLIENTES
           END-IF.
           PERFORM AA000-VERIFICA.

           OPEN INPUT CLIFIS.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CLIFIS"    TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-CLIFIS
           ELSE
              MOVE "S"         TO ARQ-CLIFIS
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

      * NAO USAR ESTA CHAVE - MOTIVO DUPLICACAO DE CLIENTES
      *LE-CLIENTES-A03 SECTION.
      *    MOVE ZEROS TO WK-STAFILE.
      *    READ CLIENTES WITH IGNORE LOCK KEY IS CHAVE-CLI-A03
      *         INVALID KEY
      *         MOVE 1 TO WK-STAFILE
      *    NOT INVALID MOVE ZEROS TO WK-STAFILE
      *    END-READ.
      *    PERFORM NAO-NUMERICO-CLIENTES
      *    PERFORM VERIFICA-STATUS
      *    IF VERFS1 NOT = "0" AND "2"
      *       MOVE "Clientes" TO WK-ARQ
      *       MOVE "S"        TO NAO-CRITICO
      *       PERFORM AA000-VERIFICA
      *    END-IF.
      *    EXIT SECTION.

       LE-CLIENTES-A05 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES WITH IGNORE LOCK KEY IS CHAVE-CLI-A05
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ.
           IF ATIVOINATIVO-CLI OF REG-CLI = "E"       AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA" AND
              DS-SET-NAME             NOT = "REC010"  AND
              DS-SET-NAME             NOT = "PAG001"
              MOVE 1 TO WK-STAFILE
           END-IF
           IF ATIVOINATIVO-CLI OF REG-CLI = "I" AND
              DS-SET-NAME                 = "REC120"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "Clientes" TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.

       LE-CLIENTES-A08 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES WITH IGNORE LOCK KEY IS CHAVE-CLI-A08
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "Clientes" TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.

       LE-CLIENTES SECTION.
           MOVE ZEROS TO WK-STAFILE.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "CLIENTES" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.              
           EXIT SECTION.   
           
       LE-CLIENTES-A01 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES WITH IGNORE LOCK KEY IS CHAVE-CLI-A01
           INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "CLIENTES" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.

       LE-BLOQ-CLIENTES SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ CLIENTES WITH LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA" AND
              DS-SET-NAME             NOT = "REC010"  AND
              DS-SET-NAME             NOT = "PAG001"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "CLIENTES " TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       LE-BLOQ-CLIENTES-A03 SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ CLIENTES KEY IS CHAVE-CLI-A03 INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "CLIENTES " TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           EXIT SECTION.

       LE-BLOQ-CLIENTES-A05 SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ CLIENTES KEY IS CHAVE-CLI-A05 INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA" AND
              DS-SET-NAME             NOT = "REC010"  AND
              DS-SET-NAME             NOT = "PAG001"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "CLIENTES " TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           EXIT SECTION.

       LE-BLOQ1-CLIENTES SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           MOVE ZEROS  TO WK-STAFILE.
           READ CLIENTES WITH LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT  INVALID KEY
                MOVE   0 TO WK-STAFILE
           END-READ.
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA" AND
              DS-SET-NAME             NOT = "REC010"  AND
              DS-SET-NAME             NOT = "PAG001"
              MOVE 1 TO WK-STAFILE
           END-IF
           PERFORM NAO-NUMERICO-CLIENTES
           EXIT SECTION.

       LE-CLIFIS SECTION.
           MOVE ZEROS TO WK-STAFILE.
           MOVE WK-DEP TO FILIAL-CLIF OF REG-CLIF
           IF CLIFORN-CLIF OF REG-CLIF = SPACE
              MOVE "C" TO CLIFORN-CLIF OF REG-CLIF
           END-IF
           READ CLIFIS WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
                NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF PERCSUB-CLI OF REG-CLIF NOT NUMERIC
              MOVE ZEROS TO PERCSUB-CLI OF REG-CLIF
           END-IF
           IF OPTSIMPLES-CLI OF REG-CLIF NOT NUMERIC
              MOVE ZERO TO OPTSIMPLES-CLI OF REG-CLIF
           END-IF
           IF VERFS1 NOT = "0" AND "2"
              MOVE PATH-CLIFIS TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           IF WK-STAFILE = 01
              MOVE SPACES TO MSG
              MOVE ZEROS  TO WK-STAFILE
           END-IF
           EXIT SECTION.

       NAO-NUMERICO-CLIENTES SECTION.
           IF DATCAD-CLI    OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATCAD-CLI OF REG-CLI
           END-IF
           IF DATCADI-CLI   OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATCADI-CLI OF REG-CLI
           END-IF
           IF DATANASC-CLI  OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATANASC-CLI OF REG-CLI
           END-IF
           IF DATATUAL-CLI  OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATATUAL-CLI OF REG-CLI
           END-IF
           IF DATCOMP-CLI   OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATCOMP-CLI OF REG-CLI
           END-IF
           IF DATBLOQ-CLI   OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATBLOQ-CLI OF REG-CLI
           END-IF
           IF DATLIB-CLI    OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATLIB-CLI OF REG-CLI
           END-IF
           IF DATALT-CLI    OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DATALT-CLI OF REG-CLI
           END-IF
           IF DTNASCONJ-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS    TO DTNASCONJ-CLI OF REG-CLI
           END-IF
           IF SEXO-CLI OF REG-CLI NOT = "M" AND "F"
              MOVE SPACES   TO SEXO-CLI OF REG-CLI
           END-IF
           IF COMISSAOAVI-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO COMISSAOAVI-CLI OF REG-CLI
           END-IF
           IF TIPCOB-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO TIPCOB-CLI OF REG-CLI
           END-IF
           IF EXTERIOR-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO EXTERIOR-CLI OF REG-CLI
           END-IF
           IF CODFOR-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO CODFOR-CLI OF REG-CLI
           END-IF
           IF FONE-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO FONE-CLI OF REG-CLI
           END-IF
           IF FONE1-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO FONE1-CLI OF REG-CLI
           END-IF
           IF CELULAR-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO CELULAR-CLI OF REG-CLI
           END-IF
           IF PERCDESC-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO PERCDESC-CLI OF REG-CLI
           END-IF
           IF CONDPAG-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO CONDPAG-CLI OF REG-CLI
           END-IF
           IF NAOCONTR-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZERO TO NAOCONTR-CLI OF REG-CLI
           END-IF
           IF CONTR-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZERO TO CONTR-CLI OF REG-CLI
           END-IF
           IF FATLIQ-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZERO TO FATLIQ-CLI OF REG-CLI
           END-IF
           IF REGIAO-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZERO TO REGIAO-CLI OF REG-CLI
           END-IF
           IF CLIFORN-CLIF OF REG-CLIF = SPACE
              MOVE "C" TO CLIFORN-CLIF OF REG-CLIF
           END-IF
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           IF DESLMARG-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO DESLMARG-CLI OF REG-CLI
           END-IF
           IF KMPERC-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO KMPERC-CLI OF REG-CLI
           END-IF
           IF VCTO-CLI   OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO VCTO-CLI   OF REG-CLI
           END-IF
           IF NFEAVISTA-CLI OF REG-CLI IS NOT NUMERIC
              MOVE ZEROS TO NFEAVISTA-CLI OF REG-CLI
           END-IF
           IF CARGAMEDIA-CLI OF REG-CLI NOT NUMERIC OR
              CARGAMEDIA-CLI OF REG-CLI = 202,02
              MOVE ZEROS TO CARGAMEDIA-CLI OF REG-CLI
           END-IF
           EXIT SECTION.

       LE-CLIENTES-PROX SECTION.
           INITIALIZE REG-CLI
           MOVE CORR DATA-BLOCK TO REG-CLI
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           START CLIENTES KEY GREATER CHAVE-CLI INVALID KEY
              MOVE LOW-VALUE TO REG-CLI
              IF CLIFORN-CLI OF REG-CLI = SPACE
                 MOVE "C" TO CLIFORN-CLI OF REG-CLI
              END-IF
              START CLIENTES KEY NOT LESS CHAVE-CLI
                  INVALID KEY
                     MOVE ZEROS TO W-STATUS
              END-START
              MOVE SPACES TO MSG
              IF IDIOMA-GER OF REG-GER = "P"
                 STRING "Não Existe Próximo Registro, "
                        "Vai para o Início do Arquivo" INTO MSG
              END-IF
              IF IDIOMA-GER OF REG-GER = "E"
                 STRING "No Existe Próximo Registro, "
                        "Va para el Inicio del Archivo" INTO MSG
             END-IF
             MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           END-START
           IF VERFS NOT = ZEROS
              MOVE SPACES TO MSG
              STRING "Não Existe Registro no Arquivo-" VERFS
              INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           ELSE
              PERFORM LE-CLIENTES-NEXT
              MOVE CORR REG-CLI TO DATA-BLOCK
           END-IF
           EXIT SECTION.

       LE-CLIENTES-ANT SECTION.
           INITIALIZE REG-CLI
           MOVE CORR DATA-BLOCK TO REG-CLI
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           START CLIENTES KEY LESS CHAVE-CLI INVALID KEY
              MOVE HIGH-VALUE TO REG-CLI
              IF CLIFORN-CLI OF REG-CLI = SPACE
                 MOVE "C" TO CLIFORN-CLI OF REG-CLI
              END-IF
              START CLIENTES KEY LESS CHAVE-CLI
                  INVALID KEY
                     MOVE ZEROS TO W-STATUS
              END-START
              MOVE SPACES TO MSG
              IF IDIOMA-GER OF REG-GER = "P"
                 STRING "Não Existe Registro Anterior, "
                     "Vai para o Fim do Arquivo" INTO MSG
              END-IF
              IF IDIOMA-GER OF REG-GER = "E"
                 STRING "No Existe Registro Anterior, "
                     "Va para el Fin del Archivo" INTO MSG
              END-IF
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           END-START
           IF VERFS NOT = ZEROS
              MOVE SPACES TO MSG
              STRING "Não Existe Registro no Arquivo-" VERFS
              INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           ELSE
              PERFORM LE-CLIENTES-PREVIOUS
              MOVE CORR REG-CLI TO DATA-BLOCK
           END-IF
           EXIT SECTION.

       DELETA-CLIENTES SECTION.
           MOVE WK-DATA(1:8)        TO WK-DATAINV
           MOVE WK-DIACOR           TO WK-DIAINV
           MOVE WK-MESCOR           TO WK-MESINV
           MOVE WK-ANOCOR           TO WK-ANOINV
           MOVE WK-DATACOR          TO DTEXCL-CLI       OF REG-CLI
           MOVE "E"                 TO ATIVOINATIVO-CLI OF REG-CLI
           MOVE WK-DATA(1:8)        TO DATALT-CLI       OF REG-CLI
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           REWRITE REG-CLI END-REWRITE
           DELETE CLIENTES.
           EXIT SECTION.

       GRAVA-CLIENTES SECTION.
           IF PROGRAMA-CLI OF REG-CLI = SPACES
              MOVE DS-SET-NAME TO PROGRAMA-CLI OF REG-CLI
           END-IF
           IF (CGCCPF-CLI  OF REG-CLI = ZEROS OR
               CGCCPF-CLI  OF REG-CLI IS NOT NUMERIC) AND
               RUC-GER     OF REG-GER = "S"
               MOVE WK-DATA(1:8) TO DATALT-CLI OF REG-CLI
               MOVE CODIGO-CLI OF REG-CLI TO CGCCPF-CLI OF REG-CLI
               IF CLIFORN-CLI OF REG-CLI = "F"
                  COMPUTE CGCCPF-CLI OF REG-CLI =
                          CODIGO-CLI OF REG-CLI + DATALT-CLI OF REG-CLI
               END-IF
           END-IF
           IF DATCAD-CLI OF REG-CLI = ZEROS  OR
              DATCAD-CLI OF REG-CLI NOT NUMERIC
              MOVE WK-DATA(1:8) TO DATCADI-CLI OF REG-CLI
              MOVE WK-DATA(1:8) TO WK-DATAINV
              MOVE WK-DIAINV    TO WK-DIACOR
              MOVE WK-MESINV    TO WK-MESCOR
              MOVE WK-ANOINV    TO WK-ANOCOR
              MOVE WK-DATACOR   TO DATCAD-CLI  OF REG-CLI
           END-IF
      *    IF (RUC-GER OF REG-GER = SPACE OR "N") AND
      *       CODIGO-CLI OF REG-CLI = CGCCPF-CLI OF REG-CLI
      *       MOVE "CLIENTES " TO WK-ARQ
      *       MOVE "S"       TO NAO-CRITICO
      *       MOVE "DISPLAY-MSG" TO DS-PROCEDURE
      *       MOVE SPACES TO WK-MSG
      *       IF IDIOMA-GER OF REG-GER = "P"
      *          MOVE "Cliente sem o CNPJ!"
      *            TO TEX-MSG
      *       END-IF
      *       IF IDIOMA-GER OF REG-GER = "E"
      *          MOVE "Cliente sin el RNC o RUC!"
      *            TO TEX-MSG
      *       END-IF
      *       MOVE WK-MSG           TO MSG
      *       CALL "dsgrun" USING DS-CONTROL-BLOCK
      *                    DATA-BLOCK
      *       END-CALL
      *    ELSE
              IF UF-CLI OF REG-CLI = SPACES
                 MOVE ESTADO-GER OF REG-GER TO UF-CLI OF REG-CLI
              END-IF
              IF CLIFORN-CLI OF REG-CLI = SPACE
                 MOVE "C" TO CLIFORN-CLI OF REG-CLI
              END-IF
              WRITE REG-CLI INVALID KEY REWRITE REG-CLI END-WRITE
              PERFORM VERIFICA-STATUS
              IF VERFS1 NOT = "0"
                 MOVE "CLIENTES " TO WK-ARQ
                 MOVE "S"       TO NAO-CRITICO
                 MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                 IF IDIOMA-GER OF REG-GER = "P"
                    MOVE "Registro näo gravado!" TO TEX-MSG
                 END-IF
                 IF IDIOMA-GER OF REG-GER = "E"
                    MOVE "Registro no grabado!" TO TEX-MSG
                 END-IF
                 MOVE WK-MSG           TO MSG
                 CALL "dsgrun" USING DS-CONTROL-BLOCK
                              DATA-BLOCK
                 END-CALL
              END-IF
      *    END-IF
           EXIT SECTION.

       GRAVA-CLIFIS SECTION.
           MOVE WK-DEP TO FILIAL-CLIF OF REG-CLIF
           IF CLIFORN-CLIF OF REG-CLIF = SPACE
              MOVE "C" TO CLIFORN-CLIF OF REG-CLIF
           END-IF
           WRITE REG-CLIF INVALID KEY REWRITE REG-CLIF END-WRITE
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CLIFIS " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              IF IDIOMA-GER OF REG-GER = "P"
                 MOVE "Registro näo gravado!" TO TEX-MSG
              END-IF
              IF IDIOMA-GER OF REG-GER = "E"
                 MOVE "Registro no grabado!" TO TEX-MSG
              END-IF
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.


       REGRAVA-CLIENTES SECTION.
           IF PROGRAMA-CLI OF REG-CLI = SPACES
              MOVE DS-SET-NAME TO PROGRAMA-CLI OF REG-CLI
           END-IF
           IF (CGCCPF-CLI OF REG-CLI = ZEROS OR
              CGCCPF-CLI OF REG-CLI IS NOT NUMERIC) AND
              RUC-GER    OF REG-GER = "S"
              MOVE CODIGO-CLI OF REG-CLI TO CGCCPF-CLI OF REG-CLI
              IF CLIFORN-CLI OF REG-CLI = "F"
                 MOVE WK-DATA(1:8) TO DATALT-CLI OF REG-CLI
                 COMPUTE CGCCPF-CLI OF REG-CLI =
                         CODIGO-CLI OF REG-CLI + DATALT-CLI OF REG-CLI
              END-IF
           END-IF
      *    IF (RUC-GER OF REG-GER = SPACE OR "N") AND
      *       CODIGO-CLI OF REG-CLI = CGCCPF-CLI OF REG-CLI
      *       MOVE "CLIENTES " TO WK-ARQ
      *       MOVE "S"       TO NAO-CRITICO
      *       MOVE "DISPLAY-MSG" TO DS-PROCEDURE
      *       IF IDIOMA-GER OF REG-GER = "P"
      *          MOVE "Problema ao gravar o cadastro do cliente!"
      *            TO TEX-MSG
      *       END-IF
      *       MOVE WK-MSG           TO MSG
      *       CALL "dsgrun" USING DS-CONTROL-BLOCK
      *                    DATA-BLOCK
      *       END-CALL
      *    ELSE
              IF CLIFORN-CLI OF REG-CLI = SPACE
                 MOVE "C" TO CLIFORN-CLI OF REG-CLI
              END-IF
              REWRITE REG-CLI INVALID KEY WRITE REG-CLI
              END-REWRITE
              PERFORM VERIFICA-STATUS
              IF VERFS1 NOT = "0"
                 MOVE "CLIENTES " TO WK-ARQ
                 MOVE "S"       TO NAO-CRITICO
                 MOVE "DISPLAY-MSG" TO DS-PROCEDURE
                 IF IDIOMA-GER OF REG-GER = "P"
                    MOVE "Registro näo gravado!" TO TEX-MSG
                 END-IF
                 IF IDIOMA-GER OF REG-GER = "E"
                    MOVE "¡Registro no grabado!" TO TEX-MSG
                 END-IF
                 MOVE WK-MSG           TO MSG
                 CALL "dsgrun" USING DS-CONTROL-BLOCK
                              DATA-BLOCK
                 END-CALL
              END-IF
      *    END-IF
           EXIT SECTION.

       START-CLIENTES SECTION.
           MOVE ZEROS TO WK-ERRO
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           START CLIENTES KEY IS NOT LESS CHAVE-CLI INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-CLIENTES-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           START CLIENTES KEY IS GREATER THAN CHAVE-CLI-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-CLIENTES-A02 SECTION.
           MOVE ZEROS TO WK-ERRO
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           START CLIENTES KEY IS NOT LESS CHAVE-CLI-A02 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-CLIENTES-A06 SECTION.
           MOVE ZEROS TO WK-ERRO
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           START CLIENTES KEY IS NOT LESS CHAVE-CLI-A06 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-CLIENTES-A07 SECTION.
           MOVE ZEROS TO WK-ERRO
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           START CLIENTES KEY IS NOT LESS CHAVE-CLI-A07 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-CLIENTES-NEXT SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES NEXT WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-CLIENTES
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              IF WK-ERRO = 093
                 EXIT SECTION
              ELSE
                 GO LE-CLIENTES-NEXT
              END-IF
           END-IF
           IF ATIVOINATIVO-CLI OF REG-CLI = "I" AND
              DS-SET-NAME                 = "REC120"
              GO LE-CLIENTES-NEXT
           END-IF
           EXIT SECTION.

       LE-CLIENTES-NEXT-I SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES NEXT WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-CLIENTES
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              IF WK-ERRO = 093
                 EXIT SECTION
              ELSE
                 GO LE-CLIENTES-NEXT
              END-IF
           END-IF
           EXIT SECTION.


       LE-CLIENTES-PREVIOUS SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES PREVIOUS WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-CLIENTES
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              IF WK-ERRO = 093
                 EXIT SECTION
              ELSE
                 GO LE-CLIENTES-PREVIOUS
              END-IF
           END-IF
           IF ATIVOINATIVO-CLI OF REG-CLI = "I" AND
              DS-SET-NAME                 = "REC120"
              GO LE-CLIENTES-PREVIOUS
           END-IF
           EXIT SECTION.

       LE-BLOQ-CLIENTES-NEXT SECTION.
           IF CLIFORN-CLI OF REG-CLI = SPACE
              MOVE "C" TO CLIFORN-CLI OF REG-CLI
           END-IF
           READ CLIENTES NEXT AT END
              MOVE 93 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-CLIENTES
           IF ATIVOINATIVO-CLI OF REG-CLI = "E" AND
              DS-SET-NAME             NOT = "RETORNO" AND
              DS-SET-NAME             NOT = "REMESSA"
              GO LE-BLOQ-CLIENTES-NEXT
           END-IF
           IF ATIVOINATIVO-CLI OF REG-CLI = "I" AND
              DS-SET-NAME                 = "REC120"
              GO LE-BLOQ-CLIENTES-NEXT
           END-IF
           EXIT SECTION.

       FECHA-CLIENTES SECTION.
           CLOSE CLIENTES CLIFIS
           EXIT  SECTION.
           COPY "SEGMENTO.CPY".
       ABRE-SEGMENTO SECTION.
           OPEN I-O SEGMENTO.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "SEGMENTO"   TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-SEGMENTO
           ELSE
              MOVE "S"         TO ARQ-SEGMENTO
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-SEGMENTO-I SECTION.
           OPEN INPUT SEGMENTO.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "SEGMENTO"   TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-SEGMENTO
           ELSE
              MOVE "S"         TO ARQ-SEGMENTO
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
           
       LE-SEGMENTO SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ SEGMENTO WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "SEGMENTO" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-SEGMENTO-A01 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ SEGMENTO WITH IGNORE LOCK KEY IS CHAVE-SEG-A01
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "SEGMENTO" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-SEGMENTO-A02 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ SEGMENTO WITH IGNORE LOCK KEY IS CHAVE-SEG-A02
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "SEGMENTO" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-SEGMENTO-A03 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ SEGMENTO WITH IGNORE LOCK KEY IS CHAVE-SEG-A03
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "SEGMENTO" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-BLOQ-SEGMENTO SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ SEGMENTO INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "SEGMENTO " TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-BLOQ-SEGMENTO-A02 SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ SEGMENTO KEY IS CHAVE-SEG-A02 INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "SEGMENTO " TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-BLOQ-SEGMENTO-A03 SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ SEGMENTO KEY IS CHAVE-SEG-A03 INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "SEGMENTO " TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-SEGMENTO-PROX SECTION.
           INITIALIZE REG-SEG
           MOVE CORR DATA-BLOCK TO REG-SEG
           PERFORM START-SEGMENTO-GREATER
           IF WK-ERRO NOT = ZEROS
              MOVE LOW-VALUE TO REG-SEG
              PERFORM START-SEGMENTO
              MOVE SPACES TO MSG
              STRING "Não Existe Próximo Registro, "
                     "Vai para o Início do Arquivo" INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           END-IF
           IF VERFS NOT = ZEROS
              MOVE SPACES TO MSG
              STRING "Não Existe Registro no Arquivo-" VERFS
              INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           ELSE
              PERFORM LE-SEGMENTO-NEXT
              MOVE CORR REG-SEG TO DATA-BLOCK
           END-IF
           EXIT SECTION.

       LE-SEGMENTO-ANT SECTION.
           INITIALIZE REG-SEG
           MOVE CORR DATA-BLOCK TO REG-SEG
           PERFORM START-SEGMENTO-LESS
           IF WK-ERRO NOT = ZEROS
              MOVE HIGH-VALUE TO REG-SEG
              PERFORM START-SEGMENTO-LESS
              MOVE SPACES TO MSG
              STRING "Não Existe Registro Anterior, "
                     "Vai para o Fim do Arquivo" INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           END-IF
           IF VERFS NOT = ZEROS
              MOVE SPACES TO MSG
              STRING "Não Existe Registro no Arquivo-" VERFS
              INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           ELSE
              PERFORM LE-SEGMENTO-PREVIOUS
              MOVE CORR REG-SEG TO DATA-BLOCK
           END-IF
           EXIT SECTION.

       DELETA-SEGMENTO SECTION.
           DELETE SEGMENTO.
           EXIT SECTION.
           
       GRAVA-SEGMENTO SECTION.
           WRITE REG-SEG INVALID KEY REWRITE REG-SEG
           END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE "SEGMENTO " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       REGRAVA-SEGMENTO SECTION.
           REWRITE REG-SEG INVALID KEY 
                   WRITE REG-SEG END-WRITE
           END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE "SEGMENTO " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-SEGMENTO-GREATER SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS GREATER THAN CHAVE-SEG INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-SEGMENTO-LESS SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS LESS THAN CHAVE-SEG INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-SEGMENTO-EQUAL SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS EQUAL CHAVE-SEG INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.


       START-SEGMENTO SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS NOT LESS CHAVE-SEG INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-SEGMENTO-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS NOT LESS CHAVE-SEG-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-SEGMENTO-EQUAL-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS EQUAL CHAVE-SEG-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-SEGMENTO-A02 SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS NOT LESS CHAVE-SEG-A02 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-SEGMENTO-A03 SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS NOT LESS CHAVE-SEG-A03 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-SEGMENTO-A04 SECTION.
           MOVE ZEROS TO WK-ERRO
           START SEGMENTO KEY IS NOT LESS CHAVE-SEG-A04 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-BLOQ-SEGMENTO-NEXT SECTION.
           READ SEGMENTO NEXT AT END
              MOVE 93 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-SEGMENTO-NEXT SECTION.
           READ SEGMENTO NEXT WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       LE-SEGMENTO-PREVIOUS SECTION.
           READ SEGMENTO PREVIOUS WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-SEGMENTO
           EXIT SECTION.

       NAO-NUMERICO-SEGMENTO SECTION.
           IF REGIAO-SEG OF REG-SEG IS NOT NUMERIC
              MOVE ZEROS TO REGIAO-SEG OF REG-SEG
           END-IF
           IF DTCHEGADA-SEG OF REG-SEG IS NOT NUMERIC
              MOVE ZEROS TO DTCHEGADA-SEG OF REG-SEG
           END-IF
           IF VLRCOMPRA-SEG OF REG-SEG IS NOT NUMERIC
              MOVE ZEROS TO VLRCOMPRA-SEG OF REG-SEG
           END-IF
           IF VLRVENDA-SEG OF REG-SEG IS NOT NUMERIC
              MOVE ZEROS TO VLRVENDA-SEG OF REG-SEG
           END-IF
           IF VLRALUGUEL-SEG OF REG-SEG IS NOT NUMERIC
              MOVE ZEROS TO VLRALUGUEL-SEG OF REG-SEG
           END-IF
           IF DTABER-SEG OF REG-SEG IS NOT NUMERIC
              MOVE ZEROS TO DTABER-SEG OF REG-SEG
           END-IF
           IF PRIMDONO-SEG OF REG-SEG NOT NUMERIC
              MOVE ZEROS TO PRIMDONO-SEG OF REG-SEG
           END-IF
           EXIT SECTION.

       FECHA-SEGMENTO SECTION.
           CLOSE SEGMENTO
           EXIT  SECTION.
           COPY "CORDENADAS.CPY".
       ABRE-CORDENADAS SECTION.
           OPEN I-O CORDENADAS.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CORDENADAS"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-CORDENADAS
           ELSE
              MOVE "S"        TO ARQ-CORDENADAS
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-CORDENADAS-I SECTION.
           OPEN INPUT CORDENADAS.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CORDENADAS"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-CORDENADAS
           ELSE
              MOVE "S"        TO ARQ-CORDENADAS
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
           
       LE-CORDENADAS SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ CORDENADAS WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
                MOVE CIDADE-COR OF REG-COR
                  TO BAIRRO-COR OF REG-COR
                READ CORDENADAS WITH IGNORE LOCK INVALID KEY
                     MOVE 1 TO WK-STAFILE
                NOT INVALID KEY
                     MOVE 0 TO WK-STAFILE
                END-READ
           NOT INVALID
                MOVE ZEROS    TO WK-STAFILE
           END-READ.
           PERFORM NAO-NUMERICO-CORDENADAS
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "CORDENADAS"   TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.              
           EXIT SECTION.

          
       LE-BLOQ-CORDENADAS SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ CORDENADAS INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM NAO-NUMERICO-CORDENADAS
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "CORDENADAS "  TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       DELETA-CORDENADAS SECTION.
           DELETE CORDENADAS.
           EXIT SECTION.
           
       GRAVA-CORDENADAS SECTION.

           WRITE REG-COR INVALID KEY REWRITE REG-COR
           END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE "CORDENADAS " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       REGRAVA-CORDENADAS SECTION.
           REWRITE REG-COR INVALID KEY WRITE REG-COR
           END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "CORDENADAS " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-CORDENADAS SECTION.
           MOVE ZEROS TO WK-ERRO
           START CORDENADAS KEY IS NOT LESS THAN CHAVE-COR INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.


       LE-CORDENADAS-NEXT SECTION.
           READ CORDENADAS NEXT WITH IGNORE LOCK AT END
              MOVE 093 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-CORDENADAS
           EXIT SECTION.

       LE-BLOQ-CORDENADAS-NEXT SECTION.
           READ CORDENADAS NEXT AT END
              MOVE 093 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-CORDENADAS
           EXIT SECTION.

       FECHA-CORDENADAS SECTION.
           CLOSE CORDENADAS
           EXIT  SECTION.

       NAO-NUMERICO-CORDENADAS SECTION.
           EXIT  SECTION.

           COPY "FABRIC.CPY".
       ABRE-FABRIC SECTION.
           OPEN I-O FABRIC.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "FABRIC"   TO WK-ARQ
              MOVE "S"        TO CRITICO
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-FABRIC-I SECTION.
           OPEN INPUT FABRIC.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "FABRIC"   TO WK-ARQ
              MOVE "S"        TO CRITICO
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
           
       LE-FABRIC SECTION.
           MOVE ZEROS TO WK-STAFILE
           READ FABRIC WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
                NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FABRIC" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF
           EXIT SECTION.

       LE-FABRIC-A01 SECTION.
           MOVE ZEROS TO WK-STAFILE
           READ FABRIC WITH IGNORE LOCK KEY IS CHAVE-FABR-A01
                INVALID KEY
                MOVE 1 TO WK-STAFILE
                NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FABRIC" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF
           EXIT SECTION.

       LE-BLOQ-FABRIC SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ FABRIC INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FABRIC" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       DELETA-FABRIC SECTION.
           DELETE FABRIC END-DELETE
           EXIT SECTION.

       GRAVA-FABRIC SECTION.
           MOVE WK-DATA(1:8) TO FAB-DTALTER OF REG-FABR
           REWRITE REG-FABR INVALID KEY WRITE REG-FABR
           END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FABRIC" TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       LE-FABRIC-ANT SECTION.
           INITIALIZE REG-FABR
           MOVE CORR DATA-BLOCK TO REG-FABR
           START FABRIC KEY LESS CHAVE-FABR INVALID KEY
              MOVE HIGH-VALUE TO REG-FABR
              START FABRIC KEY LESS CHAVE-FABR
                  INVALID KEY CONTINUE
              END-START
              MOVE SPACES TO MSG
              STRING "Não Existe Registro Anterior, "
                     "Vai para o Fim do Arquivo" INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           END-START
           IF VERFS NOT = ZEROS
              MOVE SPACES TO MSG
              STRING "Não Existe Registro no Arquivo-" VERFS
              INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           ELSE
              READ FABRIC PREVIOUS WITH IGNORE LOCK AT END
                 CONTINUE
              END-READ
              MOVE CORR REG-FABR TO DATA-BLOCK
           END-IF
           EXIT SECTION.

       LE-FABRIC-PROX SECTION.
           INITIALIZE REG-FABR
           MOVE CORR DATA-BLOCK TO REG-FABR
           START FABRIC KEY GREATER CHAVE-FABR INVALID KEY
              MOVE LOW-VALUE TO REG-FABR
              START FABRIC KEY NOT LESS CHAVE-FABR
                  INVALID KEY CONTINUE
              END-START
              MOVE SPACES TO MSG
              STRING "Não Existe Próximo Registro, "
                     "Vai para o Início do Arquivo" INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           END-START
           IF VERFS NOT = ZEROS
              MOVE SPACES TO MSG
              STRING "Não Existe Registro no Arquivo-" VERFS
              INTO MSG
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           ELSE
              READ FABRIC NEXT WITH IGNORE LOCK AT END
                 CONTINUE
              END-READ
              MOVE CORR REG-FABR TO DATA-BLOCK
           END-IF
           EXIT SECTION.

       START-FABRIC-LESS SECTION.
           MOVE ZEROS TO WK-ERRO
           START FABRIC KEY IS LESS THAN CHAVE-FABR INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-FABRIC SECTION.
           MOVE ZEROS TO WK-ERRO
           START FABRIC KEY IS NOT LESS THAN CHAVE-FABR INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-FABRIC-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           START FABRIC KEY IS NOT LESS THAN CHAVE-FABR-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-bloq-fABRIC-NEXT SECTION.
           READ FABRIC NEXT AT END
              MOVE 093 TO WK-ERRO
           END-READ
           EXIT SECTION.

       LE-FABRIC-NEXT SECTION.
           READ FABRIC NEXT WITH IGNORE LOCK AT END
              MOVE 093 TO WK-ERRO
           END-READ
           EXIT SECTION.

       LE-FABRIC-PREVIOUS SECTION.
           READ FABRIC PREVIOUS WITH IGNORE LOCK AT END
              MOVE 093 TO WK-ERRO
           END-READ
           EXIT SECTION.

       FECHA-FABRIC SECTION.
           CLOSE FABRIC
           EXIT  SECTION.
      *----------------------------------------------------------------*

           COPY "FROTA.CPY".
       ABRE-FROTA SECTION.
           OPEN I-O FROTA.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "FROTA"   TO WK-ARQ
              MOVE "S"        TO CRITICO
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-FROTA-I SECTION.
           OPEN INPUT FROTA.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "FROTA"   TO WK-ARQ
              MOVE "S"        TO CRITICO
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
           
       LE-FROTA SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ FROTA WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
                NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FROTA" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.

       LE-FROTA-A04 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ FROTA WITH IGNORE LOCK KEY IS CHAVE-FRO-A04 INVALID KEY
                MOVE 1 TO WK-STAFILE
                NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FROTA" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.

       LE-BLOQ-FROTA SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ FROTA INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FROTA" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       DELETA-FROTA SECTION.
           PERFORM ABRE-USUARIO
           PERFORM LE-USUARIO-A02
           PERFORM FECHA-USUARIO
           IF SENHA OF DATA-BLOCK =
              SENHA-USU OF REG-USU AND
              ACESSO-USU OF REG-USU > 1
              DELETE FROTA
                 INVALID KEY
                    MOVE 93 TO WK-ERRO
                 NOT INVALID
                    MOVE "Registro Deletado!" TO MSG
                    MOVE ZEROS TO SENHA
              END-DELETE
           ELSE
              MOVE "Usuário sem permissão!" TO MSG
              MOVE 93 TO WK-ERRO
           END-IF.
           EXIT SECTION.

       DELETE-FROTA SECTION.
           DELETE FROTA END-DELETE
           EXIT SECTION.

       GRAVA-FROTA SECTION.
           IF FRO-PROGRAMA OF REG-FRO = SPACES
              MOVE DS-SET-NAME TO FRO-PROGRAMA OF REG-FRO
           END-IF
           WRITE REG-FRO INVALID KEY REWRITE REG-FRO
           END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "FROTA" TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-FROTA-LESS SECTION.
           MOVE ZEROS TO WK-ERRO
           START FROTA KEY IS LESS THAN CHAVE-FRO INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-FROTA-GREATER SECTION.
           MOVE ZEROS TO WK-ERRO
           START FROTA KEY IS GREATER THAN CHAVE-FRO INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-FROTA SECTION.
           MOVE ZEROS TO WK-ERRO
           START FROTA KEY IS NOT LESS CHAVE-FRO INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-FROTA-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           START FROTA KEY IS NOT LESS CHAVE-FRO-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-FROTA-A04 SECTION.
           MOVE ZEROS TO WK-ERRO
           START FROTA KEY IS NOT LESS CHAVE-FRO-A04 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-FROTA-NEXT SECTION.
           READ FROTA NEXT WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           EXIT SECTION.

       LE-FROTA-PREVIOUS SECTION.
           READ FROTA PREVIOUS WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           EXIT SECTION.

       FECHA-FROTA SECTION.
           CLOSE FROTA
           EXIT  SECTION.
      *----------------------------------------------------------------*

           COPY "LOG.CPY".
      *----------------------------------------------------------------*
       ABRE-LOG SECTION.
           OPEN I-O LOG.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "LOG"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-LOG
           ELSE
              MOVE "S"     TO ARQ-LOG
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
      *----------------------------------------------------------------*
       ABRE-LOG-I SECTION.
           OPEN INPUT LOG.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "LOG"   TO WK-ARQ
              MOVE "S"     TO CRITICO, ARQ-LOG
           ELSE
              MOVE "S"     TO ARQ-LOG
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
      *----------------------------------------------------------------*
       LE-LOG SECTION.
           MOVE ZEROS  TO WK-STAFILE.
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           READ LOG WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
                NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "LOG" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.
      *----------------------------------------------------------------*
       LE-BLOQ-LOG SECTION.
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           PERFORM UNTIL VERFS = "99"
              MOVE ZEROS TO WK-STAFILE
              READ LOG INVALID KEY
                       MOVE 1 TO WK-STAFILE
                   NOT INVALID
                       MOVE ZEROS TO WK-STAFILE
              END-READ
              PERFORM VERIFICA-STATUS
              IF VERFS1 NOT = "0" AND "2"
                 MOVE "LOG" TO WK-ARQ
                 MOVE "S"         TO NAO-CRITICO
                 PERFORM AA000-VERIFICA
              ELSE
                 MOVE 99 TO VERFS
              END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
      *----------------------------------------------------------------*
       READ-NEXT-LOG SECTION.
           READ LOG NEXT WITH IGNORE LOCK AT END
                MOVE 093 TO WK-ERRO
           END-READ.
           EXIT SECTION.
      *----------------------------------------------------------------*
       READ-BLOQ-NEXT-LOG SECTION.
          READ LOG NEXT AT END
               MOVE 093 TO WK-ERRO
          END-READ
          PERFORM VERIFICA-STATUS
          IF MSG NOT = SPACES
             CALL DIALOG-SYSTEM USING DS-CONTROL-BLOCK
                                      DATA-BLOCK
             END-CALL
             PERFORM UNTIL MSG NOT = SPACES
                READ LOG END-READ
                PERFORM VERIFICA-STATUS
                IF MSG NOT= SPACES
                   CALL DIALOG-SYSTEM USING DS-CONTROL-BLOCK
                                            DATA-BLOCK
                   END-CALL
                END-IF
             END-PERFORM
          END-IF
           EXIT SECTION.
      *----------------------------------------------------------------*
       START-LOG-CHAVE SECTION.
           MOVE ZEROS TO WK-ERRO
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           IF WK-WHERE = SPACES
              MOVE 1 TO W-VAR
              CALL "IgualaCmp" USING W-VAR
           END-IF
           START LOG KEY IS NOT LESS ID-LOG INVALID KEY
                 MOVE 093 TO WK-ERRO
           END-START
           MOVE SPACES TO WK-WHERE
           EXIT SECTION.
      *----------------------------------------------------------------*
       START-LOG-CHAVE-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           IF WK-WHERE = SPACES
              MOVE 1 TO W-VAR
              CALL "IgualaCmp" USING W-VAR
           END-IF
           START LOG KEY IS NOT LESS CHAVE-LOG-A01 INVALID KEY
                 MOVE 093 TO WK-ERRO
           END-START
           MOVE SPACES TO WK-WHERE
           EXIT SECTION.
      *----------------------------------------------------------------*
       START-LOG-CHAVE-A02 SECTION.
           MOVE ZEROS TO WK-ERRO
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           IF WK-WHERE = SPACES
              MOVE 1 TO W-VAR
              CALL "IgualaCmp" USING W-VAR
           END-IF
           START LOG KEY IS NOT LESS CHAVE-LOG-A02 INVALID KEY
                 MOVE 093 TO WK-ERRO
           END-START
           MOVE SPACES TO WK-WHERE
           EXIT SECTION.
      *----------------------------------------------------------------*
       DELETA-LOG SECTION.
           DELETE LOG END-DELETE
           EXIT SECTION.
      *----------------------------------------------------------------*
       GRAVA-LOG-SIMPLES SECTION.
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           WRITE REG-LOG END-WRITE
           EXIT SECTION.
      *----------------------------------------------------------------*
       GRAVA-LOG SECTION.
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           WRITE REG-LOG INVALID KEY
             ADD 1 TO CHAVE-LOG
             WRITE REG-LOG INVALID KEY
             PERFORM TEMPORIZADOR
             ADD 1 TO CHAVE-LOG
             WRITE REG-LOG
           END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              IF DS-WINDOW-NAME NOT = SPACES
              MOVE "LOG" TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL DIALOG-SYSTEM USING DS-CONTROL-BLOCK
                                       DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.
      *----------------------------------------------------------------*
       SO-GRAVA-LOG SECTION.
           MOVE WK-DEP TO FILIAL-LOG OF REG-LOG
           WRITE REG-LOG END-WRITE
           IF VERFS = "22"
              ADD 1 TO CHAVE-LOG OF REG-LOG
              GO TO SO-GRAVA-LOG
           END-IF
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              IF DS-WINDOW-NAME NOT = SPACES
              MOVE "LOG" TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL DIALOG-SYSTEM USING DS-CONTROL-BLOCK
                                       DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.
      *----------------------------------------------------------------*
       FECHA-LOG SECTION.
           CLOSE LOG
           MOVE SPACES TO ARQ-LOG
           EXIT  SECTION.
           COPY "MASGER.CPY".
       ABRE-MASGER SECTION.
           OPEN I-O MASGER.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASGER   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASGER
           ELSE
              MOVE "S"        TO ARQ-MASGER
           END-IF
           PERFORM AA000-VERIFICA.

           IF PATH-MASFIL NOT = SPACES
              OPEN I-O MASFIL
              PERFORM VERIFICA-STATUS
              IF VERFS1 NOT = "0"
                 MOVE PATH-MASFIL   TO WK-ARQ
                 MOVE "S"        TO CRITICO, ARQ-MASFIL
              ELSE
                 MOVE "S"        TO ARQ-MASFIL
              END-IF
              PERFORM AA000-VERIFICA
           END-IF
           EXIT SECTION.

       ABRE-MASGER-I SECTION.
           OPEN INPUT MASGER.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASGER   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASGER
           ELSE
              MOVE "S"        TO ARQ-MASGER
           END-IF
           PERFORM AA000-VERIFICA.

           IF PATH-MASFIL NOT = SPACES
              OPEN INPUT MASFIL
              PERFORM VERIFICA-STATUS
              IF VERFS1 NOT = "0"
                 MOVE PATH-MASFIL   TO WK-ARQ
                 MOVE "S"        TO CRITICO, ARQ-MASFIL
              ELSE
                 MOVE "S"        TO ARQ-MASFIL
              END-IF
              PERFORM AA000-VERIFICA
           END-IF
           EXIT SECTION.

       ABRE-MASGER-O SECTION.
           OPEN OUTPUT MASGER.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASGER   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASGER
           ELSE
              MOVE "S"        TO ARQ-MASGER
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       LE-MASGER SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ MASGER WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS    TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE PATH-MASGER   TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           PERFORM NAO-NUMERICO-MASGER

           IF PATH-MASFIL NOT = SPACES
              INITIALIZE REG-FIL
              MOVE 1      TO EMPRESA-FIL OF REG-FIL
              MOVE WK-DEP TO CODIGO-FIL  OF REG-FIL
              MOVE ZEROS TO WK-STAFILE
              READ MASFIL WITH IGNORE LOCK INVALID KEY
                   MOVE 1 TO WK-STAFILE
              NOT INVALID
                   MOVE ZEROS    TO WK-STAFILE
              END-READ
              PERFORM VERIFICA-STATUS
              IF VERFS1 NOT = "0" AND "2"
                 MOVE PATH-MASFIL   TO WK-ARQ
                 MOVE "S"        TO NAO-CRITICO
                 PERFORM AA000-VERIFICA
              END-IF
              PERFORM NAO-NUMERICO-MASFIL
           END-IF
           EXIT SECTION.   
           
       LE-BLOQ-MASGER SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ MASGER INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE PATH-MASGER  TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           PERFORM NAO-NUMERICO-MASGER

           IF PATH-MASFIL NOT = SPACES
              INITIALIZE REG-FIL
              MOVE 1      TO EMPRESA-FIL OF REG-FIL
              MOVE WK-DEP TO CODIGO-FIL  OF REG-FIL
              PERFORM UNTIL VERFS = "99"
              MOVE ZEROS TO WK-STAFILE
              READ MASFIL INVALID KEY
                   MOVE 1 TO WK-STAFILE
              NOT INVALID
                   MOVE ZEROS TO WK-STAFILE
              END-READ
              PERFORM VERIFICA-STATUS
              IF VERFS1 NOT = "0" AND "2"
                 MOVE PATH-MASFIL  TO WK-ARQ
                 MOVE "S"        TO NAO-CRITICO
                 PERFORM AA000-VERIFICA
              ELSE
                 MOVE 99 TO VERFS
              END-IF
              END-PERFORM
              MOVE "00" TO VERFS
              PERFORM NAO-NUMERICO-MASFIL
           END-IF
           EXIT SECTION.   
           
       DELETA-MASGER SECTION.
           DELETE MASGER.
           EXIT SECTION.
           
       GRAVA-MASGER SECTION.
              
           WRITE REG-GER INVALID KEY REWRITE REG-GER END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE PATH-MASGER TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              IF IDIOMA-GER OF REG-GER = "P"
                 MOVE "Registro não gravado!" TO TEX-MSG
              END-IF
              IF IDIOMA-GER OF REG-GER = "E"
                 MOVE "¡Registro no grabado!" TO TEX-MSG
              END-IF
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       REGRAVA-MASGER SECTION.

           REWRITE REG-GER INVALID KEY WRITE REG-GER END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASGER TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-MASGER SECTION.
           MOVE ZEROS TO WK-ERRO
           START MASGER KEY IS NOT LESS THAN CHAVE-GER INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-MASGER-NEXT SECTION.
           READ MASGER NEXT WITH IGNORE LOCK AT END
              MOVE 093 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-MASGER
           EXIT SECTION.

       LE-BLOQ-MASGER-NEXT SECTION.
           READ MASGER NEXT AT END
              MOVE 093 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-MASGER
           EXIT SECTION.

       NAO-NUMERICO-MASGER SECTION.
           IF CEP-GER             OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO CEP-GER             OF REG-GER
           END-IF
           IF PREF-GER            OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  PREF-GER            OF REG-GER
           END-IF
           IF FONE-GER            OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  FONE-GER            OF REG-GER
           END-IF
           IF FAX-GER             OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  FAX-GER             OF REG-GER
           END-IF
           IF ULTCLI-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTCLI-GER          OF REG-GER
           END-IF
           IF ULTEST-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTEST-GER          OF REG-GER
           END-IF
           IF LUCRODES-GER        OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  LUCRODES-GER        OF REG-GER
           END-IF
           IF VALDAT-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  VALDAT-GER          OF REG-GER
           END-IF
           IF VALNUM-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  VALNUM-GER          OF REG-GER
           END-IF
           IF VALSEG-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  VALSEG-GER          OF REG-GER
           END-IF
           IF ULTPED-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTPED-GER          OF REG-GER
           END-IF
           IF ULTFOR-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTFOR-GER          OF REG-GER
           END-IF
           IF ULTCUP-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTCUP-GER          OF REG-GER
           END-IF
           IF ULTNOTSAI-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTNOTSAI-GER       OF REG-GER
           END-IF
           IF ULTNOTENT-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTNOTENT-GER       OF REG-GER
           END-IF
           IF ULTFAT-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTFAT-GER          OF REG-GER
           END-IF
           IF ULTDUP-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTDUP-GER          OF REG-GER
           END-IF
           IF ULTLIVDUP-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTLIVDUP-GER       OF REG-GER
           END-IF
           IF ULTFLHDUP-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTFLHDUP-GER       OF REG-GER
           END-IF
           IF ULTORC-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTORC-GER          OF REG-GER
           END-IF
           IF ULTFATLOC-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTFATLOC-GER       OF REG-GER
           END-IF
           IF PIS-GER             OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  PIS-GER             OF REG-GER
           END-IF
           IF PERADM-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  PERADM-GER          OF REG-GER
           END-IF
           IF ALIQISS-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ALIQISS-GER         OF REG-GER
           END-IF
           IF COFINS-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  COFINS-GER          OF REG-GER
           END-IF
           IF ULTPROP-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTPROP-GER         OF REG-GER
           END-IF
           IF ULTOS-GER           OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTOS-GER           OF REG-GER
           END-IF
           IF ULTREQ-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTREQ-GER          OF REG-GER
           END-IF
           IF ULTORCS-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTORCS-GER         OF REG-GER
           END-IF
           IF USANOTA-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  USANOTA-GER         OF REG-GER
           END-IF
           IF NROITENS-GER        OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  NROITENS-GER        OF REG-GER
           END-IF
           IF NROSERV-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  NROSERV-GER         OF REG-GER
           END-IF
           IF GRALTO-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  GRALTO-GER          OF REG-GER
           END-IF
           IF GRBAIXO-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  GRBAIXO-GER         OF REG-GER
           END-IF
           IF CURVAA-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CURVAA-GER          OF REG-GER
           END-IF
           IF CURVAB-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CURVAB-GER          OF REG-GER
           END-IF
           IF CURVAC-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CURVAC-GER          OF REG-GER
           END-IF
           IF CURVAX-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CURVAX-GER          OF REG-GER
           END-IF
           IF CURVAY-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CURVAY-GER          OF REG-GER
           END-IF
           IF CURVAZ-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CURVAZ-GER          OF REG-GER
           END-IF
           IF BARATO-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  BARATO-GER          OF REG-GER
           END-IF
           IF MEDIO-GER           OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  MEDIO-GER           OF REG-GER
           END-IF
           IF SALDONEG-GER        OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SALDONEG-GER        OF REG-GER
           END-IF
           IF SEMMOV-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SEMMOV-GER          OF REG-GER
           END-IF
           IF DPPECAS-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  DPPECAS-GER         OF REG-GER
           END-IF
           IF DPSERV-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  DPSERV-GER          OF REG-GER
           END-IF
           IF VEICNOV-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  VEICNOV-GER         OF REG-GER
           END-IF
           IF VEICUSA-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  VEICUSA-GER         OF REG-GER
           END-IF
           IF ULTINSTFAT-GER      OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTINSTFAT-GER      OF REG-GER
           END-IF
           IF TIMER-GER           OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  TIMER-GER           OF REG-GER
           END-IF
           IF TURNO2-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  TURNO2-GER          OF REG-GER
           END-IF
           IF TURNO3-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  TURNO3-GER          OF REG-GER
           END-IF
           IF TURNO4-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  TURNO4-GER          OF REG-GER
           END-IF
           IF TURNO5-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  TURNO5-GER          OF REG-GER
           END-IF
           IF TURNO6-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  TURNO6-GER          OF REG-GER
           END-IF
           IF LOCACAO-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  LOCACAO-GER         OF REG-GER
           END-IF
           IF NRECF-GER           OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  NRECF-GER           OF REG-GER
           END-IF
           IF DEVSER-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  DEVSER-GER          OF REG-GER
           END-IF
           IF QTDIABLOQ-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  QTDIABLOQ-GER       OF REG-GER
           END-IF
           IF NAOBLOQVEI-GER      OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  NAOBLOQVEI-GER      OF REG-GER
           END-IF
           IF MASCARA-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  MASCARA-GER         OF REG-GER
           END-IF
           IF SAIREMNOESTADO-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SAIREMNOESTADO-GER  OF REG-GER
           END-IF
           IF ENTREMNOESTADO-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ENTREMNOESTADO-GER  OF REG-GER
           END-IF
           IF SAIREMOUTROSEST-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SAIREMOUTROSEST-GER OF REG-GER
           END-IF
           IF ENTREMOUTROSEST-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ENTREMOUTROSEST-GER OF REG-GER
           END-IF
           IF FINANCONSOL-GER     OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  FINANCONSOL-GER     OF REG-GER
           END-IF
           IF CODADTO-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CODADTO-GER         OF REG-GER
           END-IF
           IF LIBAUTOMATICA-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  LIBAUTOMATICA-GER   OF REG-GER
           END-IF
           IF NUMITENSREQ-GER     OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  NUMITENSREQ-GER     OF REG-GER
           END-IF
           IF ESTCRIMIN-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ESTCRIMIN-GER       OF REG-GER
           END-IF
           IF ESTCRIMAX-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ESTCRIMAX-GER       OF REG-GER
           END-IF
           IF NIVEL-GER           OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  NIVEL-GER           OF REG-GER
           END-IF
           IF DATENCERCR-GER      OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  DATENCERCR-GER      OF REG-GER
           END-IF
           IF DATENCERCP-GER      OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  DATENCERCP-GER      OF REG-GER
           END-IF
           IF DATENCERCX-GER      OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  DATENCERCX-GER      OF REG-GER
           END-IF
           IF QTDIAORC-GER        OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  QTDIAORC-GER        OF REG-GER
           END-IF
           IF CURVAD-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CURVAD-GER          OF REG-GER
           END-IF
           IF CODDEVCPR-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CODDEVCPR-GER       OF REG-GER
           END-IF
           IF DOCENTVU-GER        OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  DOCENTVU-GER        OF REG-GER
           END-IF
           IF COBENTVU-GER        OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  COBENTVU-GER        OF REG-GER
           END-IF
           IF PRZVENCENTVU-GER    OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  PRZVENCENTVU-GER    OF REG-GER
           END-IF
           IF ALIQITBIS-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ALIQITBIS-GER       OF REG-GER
           END-IF
           IF ANOMES-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ANOMES-GER          OF REG-GER
           END-IF
           IF INATIVA-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  INATIVA-GER         OF REG-GER
           END-IF
           IF ULTPEDE-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTPEDE-GER         OF REG-GER
           END-IF
           IF RECMERC-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  RECMERC-GER         OF REG-GER
           END-IF
           IF CMSAINOESTADO-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CMSAINOESTADO-GER   OF REG-GER
           END-IF
           IF CMSAIOUTROSEST-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  CMSAIOUTROSEST-GER  OF REG-GER
           END-IF
           IF SAIDEMNOESTADO-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SAIDEMNOESTADO-GER  OF REG-GER
           END-IF
           IF ENTDEMNOESTADO-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ENTDEMNOESTADO-GER  OF REG-GER
           END-IF
           IF SAIDEMOUTROSEST-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SAIDEMOUTROSEST-GER OF REG-GER
           END-IF
           IF ENTDEMOUTROSEST-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ENTDEMOUTROSEST-GER OF REG-GER
           END-IF
           IF ULTTRANS-GER        OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTTRANS-GER        OF REG-GER
           END-IF
           IF ULTNOTSER-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  ULTNOTSER-GER       OF REG-GER
           END-IF
           IF FILNOT-GER          OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  FILNOT-GER          OF REG-GER
           END-IF
           IF FILNOTE-GER         OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  FILNOTE-GER         OF REG-GER
           END-IF
           IF VEIFILIAL-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  VEIFILIAL-GER       OF REG-GER
           END-IF
           IF CODNATGARE1-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO CODNATGARE1-GER OF REG-GER
           END-IF
           IF CODNATGARE2-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO CODNATGARE2-GER OF REG-GER
           END-IF
           IF CODNATGARR1-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO CODNATGARR1-GER OF REG-GER
           END-IF
           IF CODNATGARR2-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO CODNATGARR2-GER OF REG-GER
           END-IF
           IF DPLOC-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO DPLOC-GER OF REG-GER
           END-IF
           IF NUMITENSREQ-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO NUMITENSREQ-GER OF REG-GER
           END-IF
           IF ALIQICM-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO ALIQICM-GER OF REG-GER
           END-IF
           IF DIASAGE-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO DIASAGE-GER OF REG-GER
           END-IF
           IF LOTE-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO LOTE-GER OF REG-GER
           END-IF
           IF REVISAO1-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO1-GER   OF REG-GER
           END-IF
           IF REVISAO2-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO2-GER   OF REG-GER
           END-IF
           IF REVISAO3-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO3-GER   OF REG-GER
           END-IF
           IF REVISAO4-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO4-GER   OF REG-GER
           END-IF
           IF REVISAO5-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO5-GER   OF REG-GER
           END-IF
           IF REVISAO6-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO6-GER   OF REG-GER
           END-IF
           IF REVISAO7-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO7-GER   OF REG-GER
           END-IF
           IF REVISAO8-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO8-GER   OF REG-GER
           END-IF
           IF REVISAO9-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO REVISAO9-GER   OF REG-GER
           END-IF
           IF DIASTRAZ-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO DIASTRAZ-GER OF REG-GER
           END-IF
           IF DIASAVISO-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO DIASAVISO-GER OF REG-GER
           END-IF
           IF OPEJUR-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  OPEJUR-GER   OF REG-GER
           END-IF
           IF OPEDESC-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  OPEDESC-GER  OF REG-GER
           END-IF
           IF OPEABAT-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  OPEABAT-GER  OF REG-GER
           END-IF
           IF OPEOCRED-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  OPEOCRED-GER OF REG-GER
           END-IF
           IF OPEIOF-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  OPEIOF-GER   OF REG-GER
           END-IF
           IF OPEDESP-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  OPEDESP-GER  OF REG-GER
           END-IF
           IF OPEODESP-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  OPEODESP-GER OF REG-GER
           END-IF
           IF REMCXBCO-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  REMCXBCO-GER OF REG-GER
           END-IF
           IF QTDIAOCPEND-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  QTDIAOCPEND-GER OF REG-GER
           END-IF
           IF MAISIPI-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  MAISIPI-GER OF REG-GER
           END-IF
           IF SUPERMP35-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SUPERMP35-GER OF REG-GER
           END-IF
           IF SOMAPC-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO  SOMAPC-GER OF REG-GER
           END-IF
           IF VERSAO-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO VERSAO-GER OF REG-GER
           END-IF
           IF QTDIABLOQI-GER OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO QTDIABLOQI-GER OF REG-GER
           END-IF
           IF ORDSEP-GER     OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO ORDSEP-GER     OF REG-GER
           END-IF
           IF GRAVACH-GER    OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO GRAVACH-GER    OF REG-GER
           END-IF
           IF NFS-E-GER     OF REG-GER IS NOT NUMERIC
              MOVE ZERO  TO NFS-E-GER OF REG-GER
           END-IF
           IF NFES-GER     OF REG-GER IS NOT NUMERIC
              MOVE ZERO  TO NFES-GER OF REG-GER
           END-IF
           IF NSU-GER       OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO NSU-GER OF REG-GER
           END-IF
           IF NUMCONT-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO NUMCONT-GER OF REG-GER
           END-IF
           IF SELREQ-GER   OF REG-GER IS NOT NUMERIC
              MOVE ZEROS TO SELREQ-GER OF REG-GER
           END-IF
           IF TRIBFRET-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZERO TO TRIBFRET-GER OF REG-GER
           END-IF
           IF ALIQNV-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZERO TO ALIQNV-GER OF REG-GER
           END-IF
           IF ALIQUS-GER  OF REG-GER IS NOT NUMERIC
              MOVE ZERO TO ALIQUS-GER OF REG-GER
           END-IF
           IF ALIQICMS-GER OF REG-GER IS NOT NUMERIC
              MOVE ZERO TO ALIQICMS-GER OF REG-GER
           END-IF
           IF STFIN-GER OF REG-GER IS NOT NUMERIC
              MOVE ZERO TO STFIN-GER OF REG-GER
           END-IF
           IF STTOT-GER OF REG-GER IS NOT NUMERIC
              MOVE ZERO TO STTOT-GER OF REG-GER
           END-IF
           IF STSEMICMS-GER OF REG-GER IS NOT NUMERIC
              MOVE ZERO TO STSEMICMS-GER OF REG-GER
           END-IF
           EXIT SECTION.


       FECHA-MASGER SECTION.
           CLOSE MASGER MASFIL.
           EXIT  SECTION.

       COPY "MASFIL.CPY".
       ABRE-MASFIL SECTION.
           OPEN I-O MASFIL.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASFIL   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASFIL
           ELSE
              MOVE "S"        TO ARQ-MASFIL
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-MASFIL-I SECTION.
           OPEN INPUT MASFIL.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASFIL   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASFIL
           ELSE
              MOVE "S"        TO ARQ-MASFIL
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-MASFIL-O SECTION.
           OPEN OUTPUT MASFIL.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASFIL   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASFIL
           ELSE
              MOVE "S"        TO ARQ-MASFIL
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       LE-MASFIL SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ MASFIL WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS    TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE PATH-MASFIL   TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           PERFORM NAO-NUMERICO-MASFIL
           EXIT SECTION.   
           
       LE-BLOQ-MASFIL SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ MASFIL INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE PATH-MASFIL  TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           PERFORM NAO-NUMERICO-MASFIL
           EXIT SECTION.   
           
       DELETA-MASFIL SECTION.
           DELETE MASFIL.
           EXIT SECTION.
           
       GRAVA-MASFIL SECTION.
              
           WRITE REG-FIL INVALID KEY REWRITE REG-FIL END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE PATH-MASFIL TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro não gravado!" TO TEX-MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       REGRAVA-MASFIL SECTION.

           REWRITE REG-FIL INVALID KEY WRITE REG-FIL END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASFIL TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-MASFIL SECTION.
           MOVE ZEROS TO WK-ERRO
           START MASFIL KEY IS NOT LESS THAN CHAVE-FIL INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-MASFIL-NEXT SECTION.
           READ MASFIL NEXT WITH IGNORE LOCK AT END
              MOVE 093 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-MASFIL
           EXIT SECTION.

       LE-BLOQ-MASFIL-NEXT SECTION.
           READ MASFIL NEXT AT END
              MOVE 093 TO WK-ERRO
           END-READ
           PERFORM NAO-NUMERICO-MASFIL
           EXIT SECTION.

       NAO-NUMERICO-MASFIL SECTION.
           EXIT SECTION.


       FECHA-MASFIL SECTION.
           CLOSE MASFIL.
           EXIT  SECTION.


           COPY "MASPUB.CPY".
       ABRE-MASPUB SECTION.
           OPEN I-O MASPUB.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "MASPUB"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASPUB
           ELSE
              MOVE "S"        TO ARQ-MASPUB
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-MASPUB-I SECTION.
           OPEN INPUT MASPUB.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "MASPUB"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASPUB
           ELSE
              MOVE "S"        TO ARQ-MASPUB
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
           
       LE-MASPUB SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ MASPUB WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
                NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MASPUB" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.
           
       LE-BLOQ-MASPUB SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ MASPUB INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MASPUB" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       DELETA-MASPUB SECTION.
           DELETE MASPUB
              INVALID KEY
                 MOVE 93 TO WK-ERRO
              NOT INVALID
                 MOVE "Registro Deletado!" TO MSG
           END-DELETE.
           EXIT SECTION.

       GRAVA-MASPUB SECTION.
           REWRITE REG-PUB INVALID KEY WRITE REG-PUB
           END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MASPUB" TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-MASPUB.
           MOVE ZEROS TO WK-ERRO
           START MASPUB KEY IS NOT LESS CHAVE-PUB INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-MASPUB-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           START MASPUB KEY IS NOT LESS CHAVE-PUB-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-MASPUB-NEXT SECTION.
           READ MASPUB NEXT WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           EXIT SECTION.

       LE-BLOQ-MASPUB-NEXT SECTION.
           READ MASPUB NEXT AT END
              MOVE 93 TO WK-ERRO
           END-READ
           EXIT SECTION.

       LE-MASPUB-PREVIOUS SECTION.
           READ MASPUB NEXT WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ
           EXIT SECTION.

       PEGA-ANTERIOR-REGISTRO-MASPUB SECTION.
           START MASPUB KEY LESS CHAVE-PUB INVALID KEY
               MOVE HIGH-VALUE TO REG-PUB
               IF WK-WHERE = SPACES
                  MOVE 1 TO W-VAR
                  CALL "IgualaCmp" USING W-VAR
               END-IF
               START MASPUB KEY LESS CHAVE-PUB
                    INVALID KEY CONTINUE
               END-START
               MOVE SPACES TO MSG
               STRING "Não Existe Registro Anterior, "
                      "Vai para o Fim do Arquivo" INTO MSG
               MOVE "DISPLAY-MSG" TO DS-PROCEDURE
           END-START.
           EXIT SECTION.

       PEGA-PROXIMO-REGISTRO-MASPUB SECTION.
           START MASPUB KEY GREATER CHAVE-PUB INVALID KEY
             MOVE LOW-VALUE TO REG-PUB
             START MASPUB KEY NOT LESS CHAVE-PUB
                   INVALID KEY CONTINUE
             END-START
             MOVE SPACES TO MSG
             STRING "Não Existe Próximo Registro, "
                    "Vai para o Início do Arquivo" INTO MSG
                    MOVE "DISPLAY-MSG" TO DS-PROCEDURE
             END-START.
             EXIT SECTION.

       FECHA-MASPUB SECTION.
           CLOSE MASPUB
           EXIT  SECTION.

      *----------------------------------------------------------------*

           COPY "MASVEN.CPY".
       ABRE-MASVEN SECTION.
           OPEN I-O MASVEN.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "MASVEN"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASVEN
           ELSE
              MOVE "S"        TO ARQ-MASVEN
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-MASVEN-I SECTION.
           OPEN INPUT MASVEN.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "MASVEN"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASVEN
           ELSE
              MOVE "S"        TO ARQ-MASVEN
           END-IF
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
           
       LE-MASVEN SECTION.
           MOVE ZEROS TO WK-STAFILE.
           MOVE WK-DEP TO LOJA-VEN OF REG-VEN
           READ MASVEN WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS    TO WK-STAFILE
           END-READ.
           PERFORM NAO-NUMERICO-MASVEN
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MASVEN"   TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.              
           EXIT SECTION.

       LE-MASVEN-A01 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           MOVE WK-DEP TO LOJA-VEN OF REG-VEN
           READ MASVEN WITH IGNORE LOCK KEY IS CHAVE-VEN-A01
                 INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS    TO WK-STAFILE
           END-READ.
           PERFORM NAO-NUMERICO-MASVEN
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MASVEN"   TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.
           
       LE-BLOQ-MASVEN SECTION.
           MOVE WK-DEP TO LOJA-VEN OF REG-VEN
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ MASVEN INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID
                MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM NAO-NUMERICO-MASVEN
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MASVEN "  TO WK-ARQ
              MOVE "S"        TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       DELETA-MASVEN SECTION.
           DELETE MASVEN.
           EXIT SECTION.
           
       GRAVA-MASVEN SECTION.

           WRITE REG-VEN INVALID KEY REWRITE REG-VEN
           END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE "MASVEN " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       REGRAVA-MASVEN SECTION.
           REWRITE REG-VEN INVALID KEY WRITE REG-VEN
           END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "MASVEN " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-MASVEN SECTION.
           MOVE ZEROS TO WK-ERRO
           IF WK-WHERE = SPACES
              MOVE 1 TO W-VAR
              CALL "IgualaCmp" USING W-VAR
           END-IF
           MOVE WK-DEP TO LOJA-VEN OF REG-VEN
           START MASVEN KEY IS NOT LESS THAN CHAVE-VEN INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-MASVEN-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           IF WK-WHERE = SPACES
              MOVE 1 TO W-VAR
              CALL "IgualaCmp" USING W-VAR
           END-IF
           MOVE WK-DEP TO LOJA-VEN OF REG-VEN
           START MASVEN KEY IS NOT LESS THAN CHAVE-VEN-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-MASVEN-A02 SECTION.
           IF WK-WHERE = SPACES
              MOVE 1 TO W-VAR
              CALL "IgualaCmp" USING W-VAR
           END-IF
           MOVE WK-DEP TO LOJA-VEN OF REG-VEN
           START MASVEN KEY IS NOT LESS THAN CHAVE-VEN-A02 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-MASVEN-NEXT SECTION.
           READ MASVEN NEXT WITH IGNORE LOCK AT END
              MOVE 093 TO WK-ERRO
           END-READ
           IF WK-DEP NOT = LOJA-VEN OF REG-VEN
              MOVE 093 TO WK-ERRO
           END-IF
           PERFORM NAO-NUMERICO-MASVEN
           EXIT SECTION.

       LE-BLOQ-MASVEN-NEXT SECTION.
           READ MASVEN NEXT AT END
              MOVE 093 TO WK-ERRO
           END-READ
           IF WK-DEP NOT = LOJA-VEN OF REG-VEN
              MOVE 093 TO WK-ERRO
           END-IF
           PERFORM NAO-NUMERICO-MASVEN
           EXIT SECTION.

       FECHA-MASVEN SECTION.
           CLOSE MASVEN
           EXIT  SECTION.

       NAO-NUMERICO-MASVEN SECTION.
           IF CODGER-VEN OF REG-VEN IS NOT NUMERIC
              MOVE ZEROS TO CODGER-VEN OF REG-VEN
           END-IF
           IF COMGER-VEN OF REG-VEN IS NOT NUMERIC
              MOVE ZEROS TO COMGER-VEN OF REG-VEN
           END-IF
           IF CODSUP-VEN OF REG-VEN IS NOT NUMERIC
              MOVE ZEROS TO CODSUP-VEN OF REG-VEN
           END-IF
           IF COMSUP-VEN OF REG-VEN IS NOT NUMERIC
              MOVE ZEROS TO COMSUP-VEN OF REG-VEN
           END-IF
           IF DESC-VEN OF REG-VEN IS NOT NUMERIC
              MOVE ZEROS TO DESC-VEN OF REG-VEN
           END-IF
           IF DESCS-VEN OF REG-VEN IS NOT NUMERIC
              MOVE ZEROS TO DESCS-VEN OF REG-VEN
           END-IF
           IF LIMITE-VEN OF REG-VEN IS NOT NUMERIC
              MOVE ZEROS TO LIMITE-VEN OF REG-VEN
           END-IF
           EXIT  SECTION.

           COPY "MODELOS.CPY".
       ABRE-MODELOS SECTION.
           OPEN I-O MODELOS.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "MODELOS"   TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-MODELOS
           ELSE
              MOVE "S"         TO ARQ-MODELOS
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-MODELOS-I SECTION.
           OPEN INPUT MODELOS.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "MODELOS"   TO WK-ARQ
              MOVE "S"         TO CRITICO, ARQ-MODELOS
           ELSE
              MOVE "S"         TO ARQ-MODELOS
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.
           
       LE-MODELOS SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ MODELOS WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MODELOS" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.              
           EXIT SECTION.   
           
       LE-BLOQ-MODELOS SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ MODELOS INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "MODELOS " TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       DELETA-MODELOS SECTION.
           DELETE MODELOS.
           EXIT SECTION.
           
       GRAVA-MODELOS SECTION.

           WRITE REG-MOD INVALID KEY REWRITE REG-MOD
           END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE "MODELOS " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       REGRAVA-MODELOS SECTION.

           REWRITE REG-MOD INVALID KEY WRITE REG-MOD
           END-REWRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" 
              MOVE "MODELOS " TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-MODELOS SECTION.
           MOVE ZEROS TO WK-ERRO
           START MODELOS KEY IS NOT LESS THAN CHAVE-MOD INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-MODELOS-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           START MODELOS KEY IS NOT LESS THAN CHAVE-MOD-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       START-MODELOS-A02 SECTION.
           MOVE ZEROS TO WK-ERRO
           START MODELOS KEY IS NOT LESS THAN CHAVE-MOD-A02 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START
           EXIT SECTION.

       LE-MODELOS-NEXT SECTION.
           READ MODELOS NEXT WITH IGNORE LOCK AT END
              MOVE 093 TO WK-ERRO
           END-READ
           EXIT SECTION.

       LE-BLOQ-MODELOS-NEXT SECTION.
           READ MODELOS NEXT AT END
              MOVE 093 TO WK-ERRO
           END-READ
           EXIT SECTION.

       FECHA-MODELOS SECTION.
           CLOSE MODELOS
           EXIT  SECTION.
           COPY "MASUSU.CPY".
       ABRE-USUARIO SECTION.
           OPEN I-O MASUSU.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE PATH-MASUSU   TO WK-ARQ
              MOVE "S"           TO CRITICO, ARQ-MASUSU
           ELSE
              MOVE "S"           TO ARQ-MASUSU
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-USUARIO-I SECTION.
           OPEN INPUT MASUSU.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0"
              MOVE "../arq/masusu.dat"   TO WK-ARQ
              MOVE "S"        TO CRITICO, ARQ-MASUSU
           ELSE
              MOVE "S"        TO ARQ-MASUSU
           END-IF.
           PERFORM AA000-VERIFICA.
           EXIT SECTION.

       ABRE-USUARIO-O SECTION.
           OPEN OUTPUT MASUSU.
           EXIT SECTION.

       LE-USUARIO SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ MASUSU WITH IGNORE LOCK INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM NAO-NUMERICO-USUARIO
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "../arq/masusu.dat" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.

       LE-BLOQ-USUARIO SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ MASUSU INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM NAO-NUMERICO-USUARIO
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "../arq/masusu.dat" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS
           EXIT SECTION.


       LE-USUARIO-A01 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ MASUSU WITH IGNORE LOCK
                KEY IS CHAVE-USUAR-A01
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM NAO-NUMERICO-USUARIO
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "../arq/masusu.dat" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.
           EXIT SECTION.


       LE-USUARIO-A02 SECTION.
           MOVE ZEROS TO WK-STAFILE.
           READ MASUSU WITH IGNORE LOCK
                KEY IS CHAVE-USUAR-A02
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ.
           PERFORM NAO-NUMERICO-USUARIO
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "../arq/masusu.dat" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           END-IF.              
           EXIT SECTION.   
           
       LE-BLOQ-USUARIO-A02 SECTION.
           PERFORM UNTIL VERFS = "99"
           MOVE ZEROS TO WK-STAFILE
           READ MASUSU KEY IS CHAVE-USUAR-A02
                INVALID KEY
                MOVE 1 TO WK-STAFILE
           NOT INVALID MOVE ZEROS TO WK-STAFILE
           END-READ
           PERFORM NAO-NUMERICO-USUARIO
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "../arq/masusu.dat" TO WK-ARQ
              MOVE "S"         TO NAO-CRITICO
              PERFORM AA000-VERIFICA
           ELSE
              MOVE 99 TO VERFS
           END-IF
           END-PERFORM
           MOVE "00" TO VERFS           
           EXIT SECTION.   
           
       DELETA-USUARIO SECTION.
           DELETE MASUSU.
           EXIT SECTION.
           
       GRAVA-USUARIO SECTION.

           WRITE REG-USU INVALID KEY REWRITE REG-USU
           END-WRITE.
           PERFORM VERIFICA-STATUS
           IF VERFS1 NOT = "0" AND "2"
              MOVE "../arq/masusu.dat" TO WK-ARQ
              MOVE "S"       TO NAO-CRITICO
              MOVE "DISPLAY-MSG" TO DS-PROCEDURE
              MOVE "Registro näo gravado!" TO TEX-MSG
              MOVE WK-MSG           TO MSG
              CALL "dsgrun" USING DS-CONTROL-BLOCK
                           DATA-BLOCK
              END-CALL
           END-IF.
           EXIT SECTION.

       START-USUARIO SECTION.
           MOVE ZEROS TO WK-ERRO
           START MASUSU KEY IS NOT LESS CHAVE-USU INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START.

       START-USUARIO-A01 SECTION.
           MOVE ZEROS TO WK-ERRO
           START MASUSU KEY IS NOT LESS CHAVE-USUAR-A01 INVALID KEY
              MOVE 93 TO WK-ERRO
           END-START.

       LE-USUARIO-NEXT SECTION.
           READ MASUSU NEXT WITH IGNORE LOCK AT END
              MOVE 93 TO WK-ERRO
           END-READ.
           PERFORM NAO-NUMERICO-USUARIO
           EXIT SECTION.

       FECHA-USUARIO SECTION.
           CLOSE MASUSU
           EXIT  SECTION.

       NAO-NUMERICO-USUARIO SECTION.
           IF ALTERCLI-USU OF REG-USU NOT NUMERIC
              MOVE ZEROS TO ALTERCLI-USU OF REG-USU
           END-IF
           IF GRAVACLI-USU OF REG-USU NOT NUMERIC
              MOVE ZEROS TO GRAVACLI-USU OF REG-USU
           END-IF
           IF DELOS-USU OF REG-USU NOT NUMERIC
              MOVE ZEROS TO DELOS-USU OF REG-USU
           END-IF
           IF MARGEN-USU OF REG-USU NOT NUMERIC
              MOVE ZEROS TO MARGEN-USU OF REG-USU
           END-IF
           IF STATUSVEI-USU OF REG-USU NOT NUMERIC
              MOVE ZERO TO STATUSVEI-USU OF REG-USU
           END-IF
           EXIT  SECTION.

           COPY "REGISTRO.CPY".
      ****************************************************************
      *                                                              *
      ****************************************************************

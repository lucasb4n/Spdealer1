#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

xml_receber = '''<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="ContasReceberReport" pageWidth="595" pageHeight="842" columnWidth="555" leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
  <property name="com.jaspersoft.studio.data.defaultdataadapter" value="New Data Adapter"/>
  <queryString language="SQL"><![CDATA[SELECT codigo_rec, numdup_rec, parcela_rec, nome_cli, dtvenci_rec, vlrdup_rec, vlrsal_rec FROM receber LIMIT 100]]></queryString>
  <field name="codigo_rec" class="java.lang.Integer"/>
  <field name="numdup_rec" class="java.lang.String"/>
  <field name="parcela_rec" class="java.lang.String"/>
  <field name="nome_cli" class="java.lang.String"/>
  <field name="dtvenci_rec" class="java.sql.Date"/>
  <field name="vlrdup_rec" class="java.math.BigDecimal"/>
  <field name="vlrsal_rec" class="java.math.BigDecimal"/>
  <background><band splitType="Stretch"/></background>
  <title><band height="30"><staticText><reportElement x="0" y="0" width="555" height="30" uuid="t1"/><textElement textAlignment="Center"><font size="16" isBold="true"/></textElement><text><![CDATA[CONTAS A RECEBER]]></text></staticText></band></title>
  <pageHeader><band height="15"><line><reportElement x="0" y="14" width="555" height="1" uuid="l1"/></line></band></pageHeader>
  <detail><band height="15"><textField><reportElement x="0" y="0" width="555" height="15" uuid="d1"/><textElement fontSize="9"/><textFieldExpression><![CDATA[$F{nome_cli}]]></textFieldExpression></textField></band></detail>
  <pageFooter><band height="15"/></pageFooter>
  <summary><band height="1"/></summary>
</jasperReport>'''

path = r'h:\DISCO_D\Desenvolvimento\Seprocom\spdealer\src\main\resources\reports\ContasReceberReport.jrxml'
with open(path, 'w', encoding='utf-8') as f:
    f.write(xml_receber)

print('✅ ContasReceberReport.jrxml criado com UTF-8 puro')

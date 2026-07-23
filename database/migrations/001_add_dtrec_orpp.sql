-- Migration: Add DTREC_ORPP column to orcampp table
-- This column stores the item quantity (currently being saved in DTREQ_ORPP)

ALTER TABLE orcampp
  ADD COLUMN DTREC_ORPP DECIMAL(7,0) DEFAULT NULL AFTER DTREQ_ORPP;

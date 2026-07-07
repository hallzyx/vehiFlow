-- AlterTable
ALTER TABLE `cotizaciones` 
ADD COLUMN `seg_desgrav_tipo` VARCHAR(20) NOT NULL DEFAULT 'ENTIDAD',
ADD COLUMN `seg_desgrav_cia` VARCHAR(100) NULL,
ADD COLUMN `seg_desgrav_poliza` VARCHAR(50) NULL,
ADD COLUMN `seg_vehi_tipo` VARCHAR(20) NOT NULL DEFAULT 'ENTIDAD',
ADD COLUMN `seg_vehi_cia` VARCHAR(100) NULL,
ADD COLUMN `seg_vehi_poliza` VARCHAR(50) NULL;
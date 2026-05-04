-- CreateTable
CREATE TABLE `usuarios` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(50) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `nombre_compl` VARCHAR(150) NOT NULL,
    `rol` ENUM('ADMIN', 'ASESOR', 'ANALISTA', 'AUDITOR') NOT NULL,
    `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tipo_documento` ENUM('DNI', 'CE', 'PASAPORTE') NOT NULL,
    `num_documento` VARCHAR(15) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `ap_paterno` VARCHAR(100) NOT NULL,
    `ap_materno` VARCHAR(100) NULL,
    `celular` VARCHAR(9) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `direccion` VARCHAR(200) NOT NULL,
    `fec_nacimiento` DATE NULL,
    `ingresos_mens` DECIMAL(12, 2) NULL,
    `moneda_ingres` ENUM('PEN', 'USD') NULL,
    `situacion_lab` VARCHAR(20) NULL,
    `empresa_empl` VARCHAR(150) NULL,
    `estado` ENUM('ACTIVO', 'ARCHIVADO') NOT NULL DEFAULT 'ACTIVO',
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `creado_por` BIGINT NOT NULL,

    UNIQUE INDEX `clientes_num_documento_key`(`num_documento`),
    UNIQUE INDEX `clientes_correo_key`(`correo`),
    INDEX `clientes_num_documento_idx`(`num_documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehiculos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `marca` VARCHAR(50) NOT NULL,
    `modelo` VARCHAR(100) NOT NULL,
    `version` VARCHAR(100) NULL,
    `anio` SMALLINT NOT NULL,
    `precio_lista` DECIMAL(12, 2) NOT NULL,
    `moneda_precio` ENUM('PEN', 'USD') NOT NULL,
    `concesionario` VARCHAR(150) NOT NULL,
    `val_resid_est` DECIMAL(12, 2) NULL,
    `tipo_val_resid` ENUM('MONTO', 'PORCENTAJE') NULL,
    `tipo_vehiculo` ENUM('SEDAN', 'SUV', 'CAMIONETA', 'PICKUP', 'HATCHBACK', 'COUPE', 'STATION_WAGON', 'VAN', 'OTRO') NULL,
    `transmision` ENUM('MANUAL', 'AUTOMATICA', 'CVT', 'DUAL') NULL,
    `combustible` ENUM('GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO', 'GLP') NULL,
    `estado` ENUM('DISPONIBLE', 'ARCHIVADO') NOT NULL DEFAULT 'DISPONIBLE',
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `creado_por` BIGINT NOT NULL,

    INDEX `vehiculos_marca_modelo_idx`(`marca`, `modelo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cotizaciones` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_cliente` BIGINT NOT NULL,
    `id_vehiculo` BIGINT NOT NULL,
    `id_usuario` BIGINT NOT NULL,
    `version` SMALLINT NOT NULL DEFAULT 1,
    `estado` ENUM('BORRADOR', 'SIMULADA', 'PRESENTADA', 'APROBADA', 'RECHAZADA', 'ARCHIVADA', 'ARCHIVADA_VERSION') NOT NULL DEFAULT 'BORRADOR',
    `moneda_op` ENUM('PEN', 'USD') NOT NULL,
    `tasa_ingresada` DECIMAL(8, 4) NOT NULL,
    `capitalizacion` ENUM('DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL') NOT NULL,
    `tea` DECIMAL(8, 6) NOT NULL,
    `tem` DECIMAL(10, 8) NOT NULL,
    `precio_veh` DECIMAL(12, 2) NOT NULL,
    `cuota_ini_pct` DECIMAL(5, 2) NOT NULL,
    `cuota_ini_mnt` DECIMAL(12, 2) NOT NULL,
    `monto_financ` DECIMAL(12, 2) NOT NULL,
    `plazo_meses` SMALLINT NOT NULL,
    `fec_desembolso` DATE NOT NULL,
    `fec_1era_cuota` DATE NOT NULL,
    `gracia_flag` BOOLEAN NOT NULL DEFAULT false,
    `graciaTipo` ENUM('TOTAL', 'PARCIAL') NULL,
    `gracia_meses` SMALLINT NULL,
    `residual_flag` BOOLEAN NOT NULL DEFAULT false,
    `residual_monto` DECIMAL(12, 2) NULL,
    `seg_desgrav` DECIMAL(6, 4) NULL,
    `seg_vehi` DECIMAL(10, 2) NULL,
    `gasto_gps` DECIMAL(10, 2) NULL,
    `gasto_not` DECIMAL(10, 2) NULL,
    `tcea` DECIMAL(8, 4) NOT NULL,
    `van_deudor` DECIMAL(14, 2) NOT NULL,
    `tir_m` DECIMAL(8, 6) NOT NULL,
    `tir_a` DECIMAL(8, 4) NOT NULL,
    `tot_pagado` DECIMAL(14, 2) NOT NULL,
    `costo_cred` DECIMAL(14, 2) NOT NULL,
    `motivo_ed` VARCHAR(200) NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `cotizaciones_id_cliente_idx`(`id_cliente`),
    INDEX `cotizaciones_id_vehiculo_idx`(`id_vehiculo`),
    INDEX `cotizaciones_estado_idx`(`estado`),
    INDEX `cotizaciones_creado_en_idx`(`creado_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuotas` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_cotizacion` BIGINT NOT NULL,
    `numero` SMALLINT NOT NULL,
    `tipo_cuota` ENUM('GRACIA_TOTAL', 'GRACIA_PARCIAL', 'NORMAL', 'RESIDUAL') NOT NULL,
    `fec_vencimient` DATE NOT NULL,
    `saldo_inicial` DECIMAL(12, 2) NOT NULL,
    `interes` DECIMAL(12, 2) NOT NULL,
    `amortizacion` DECIMAL(12, 2) NOT NULL,
    `seg_desgravame` DECIMAL(10, 2) NOT NULL,
    `seg_vehicular` DECIMAL(10, 2) NOT NULL,
    `otros_gastos` DECIMAL(10, 2) NOT NULL,
    `cuota_total` DECIMAL(12, 2) NOT NULL,
    `saldo_final` DECIMAL(12, 2) NOT NULL,

    INDEX `cuotas_id_cotizacion_idx`(`id_cotizacion`),
    INDEX `cuotas_fec_vencimient_idx`(`fec_vencimient`),
    UNIQUE INDEX `cuotas_id_cotizacion_numero_key`(`id_cotizacion`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operaciones` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_cotizacion` BIGINT NOT NULL,
    `estado_op` ENUM('ACTIVA', 'CANCELADA', 'CERRADA') NOT NULL,
    `fec_inicio` DATE NOT NULL,
    `fec_termino` DATE NULL,
    `saldo_actual` DECIMAL(12, 2) NOT NULL,
    `version_crono` SMALLINT NOT NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `operaciones_id_cotizacion_key`(`id_cotizacion`),
    INDEX `operaciones_estado_op_idx`(`estado_op`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_operac` BIGINT NOT NULL,
    `fecha_pago` DATE NOT NULL,
    `monto_tot` DECIMAL(12, 2) NOT NULL,
    `tipo_pago` ENUM('CUOTA_NORMAL', 'ANTICIPADO_PARCIAL', 'CANCELACION_TOTAL') NOT NULL,
    `cuota_aplic` DECIMAL(12, 2) NOT NULL,
    `interes_dia` DECIMAL(12, 2) NOT NULL,
    `capital_am` DECIMAL(12, 2) NOT NULL,
    `saldo_ant` DECIMAL(12, 2) NOT NULL,
    `saldo_nvo` DECIMAL(12, 2) NOT NULL,
    `modalidad` ENUM('REDUCIR_PLAZO', 'REDUCIR_CUOTA') NULL,
    `penalidad` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `canal_pago` ENUM('VENTANILLA', 'TRANSFERENCIA', 'APP', 'DEBITO_AUTOMATICO', 'OTRO') NOT NULL,
    `referencia` VARCHAR(50) NOT NULL,
    `id_usuario` BIGINT NOT NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `pagos_id_operac_idx`(`id_operac`),
    INDEX `pagos_fecha_pago_idx`(`fecha_pago`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entidad` VARCHAR(30) NOT NULL,
    `id_entidad` BIGINT NOT NULL,
    `accion` ENUM('CREACION', 'EDICION', 'ARCHIVADO', 'LOGIN', 'LOGOUT', 'ELIMINACION', 'CAMBIO_ESTADO') NOT NULL,
    `campos_anteriores` JSON NULL,
    `campos_nuevos` JSON NULL,
    `id_usuario` BIGINT NOT NULL,
    `fecha_hora` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `audit_log_entidad_id_entidad_idx`(`entidad`, `id_entidad`),
    INDEX `audit_log_fecha_hora_idx`(`fecha_hora`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sessions_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `provider_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `access_token` VARCHAR(191) NULL,
    `refresh_token` VARCHAR(191) NULL,
    `id_token` VARCHAR(191) NULL,
    `access_token_expires_at` DATETIME(3) NULL,
    `refresh_token_expires_at` DATETIME(3) NULL,
    `scope` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accounts_provider_id_account_id_key`(`provider_id`, `account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verifications` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verifications_identifier_value_key`(`identifier`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_creado_por_fkey` FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehiculos` ADD CONSTRAINT `vehiculos_creado_por_fkey` FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_id_vehiculo_fkey` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuotas` ADD CONSTRAINT `cuotas_id_cotizacion_fkey` FOREIGN KEY (`id_cotizacion`) REFERENCES `cotizaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operaciones` ADD CONSTRAINT `operaciones_id_cotizacion_fkey` FOREIGN KEY (`id_cotizacion`) REFERENCES `cotizaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_id_operac_fkey` FOREIGN KEY (`id_operac`) REFERENCES `operaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

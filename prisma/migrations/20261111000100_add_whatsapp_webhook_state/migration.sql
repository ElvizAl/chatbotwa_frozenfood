CREATE TABLE "whatsapp_sync_state" (
    "phoneNumberId" TEXT NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_sync_state_pkey" PRIMARY KEY ("phoneNumberId")
);

CREATE TABLE "whatsapp_webhook_receipt" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_webhook_receipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "whatsapp_webhook_receipt_phoneNumberId_createdAt_idx"
ON "whatsapp_webhook_receipt"("phoneNumberId", "createdAt");

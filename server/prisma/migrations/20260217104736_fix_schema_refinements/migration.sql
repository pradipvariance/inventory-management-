/*
  Warnings:

  - Added the required column `updatedAt` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "deliveryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StockTransfer" ADD COLUMN     "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "boxQuantity" DROP DEFAULT,
ALTER COLUMN "itemQuantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

/*
  Warnings:

  - You are about to drop the column `card_number` on the `gift_card` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `gift_card_transaction` table. All the data in the column will be lost.
  - You are about to drop the column `new_balance` on the `gift_card_transaction` table. All the data in the column will be lost.
  - You are about to drop the column `previous_balance` on the `gift_card_transaction` table. All the data in the column will be lost.
  - Added the required column `balance_after` to the `gift_card_transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balance_before` to the `gift_card_transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `times_used_after` to the `gift_card_transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `times_used_before` to the `gift_card_transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "gift_card_card_number_key";

-- AlterTable
ALTER TABLE "gift_card" DROP COLUMN "card_number",
ADD COLUMN     "is_percentage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "times_used" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "gift_card_transaction" DROP COLUMN "description",
DROP COLUMN "new_balance",
DROP COLUMN "previous_balance",
ADD COLUMN     "balance_after" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "balance_before" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "times_used_after" INTEGER NOT NULL,
ADD COLUMN     "times_used_before" INTEGER NOT NULL;

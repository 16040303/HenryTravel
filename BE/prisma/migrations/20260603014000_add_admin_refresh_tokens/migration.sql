-- CreateTable
CREATE TABLE "public"."admin_refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_refresh_tokens_token_hash_key" ON "public"."admin_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_user_id_idx" ON "public"."admin_refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_expires_at_idx" ON "public"."admin_refresh_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

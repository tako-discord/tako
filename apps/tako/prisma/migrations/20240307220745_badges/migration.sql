-- CreateTable
CREATE TABLE "Badge" (
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "users" TEXT[],

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("name")
);

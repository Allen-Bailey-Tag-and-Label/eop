-- CreateTable
CREATE TABLE "Faq" (
    "id" SERIAL NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTitle" (
    "id" SERIAL NOT NULL,
    "costCenter" TEXT NOT NULL,
    "eeoClassification" TEXT NOT NULL,
    "jobCode" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "workCompClass" TEXT NOT NULL,

    CONSTRAINT "JobTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayChangeRequest" (
    "id" SERIAL NOT NULL,
    "change" JSONB NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "jobTitleId" INTEGER NOT NULL,
    "previous" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "PayChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "dateHired" TEXT NOT NULL,
    "email" TEXT,
    "ennisId" INTEGER,
    "extension" INTEGER,
    "firstName" TEXT NOT NULL,
    "isExempt" BOOLEAN NOT NULL DEFAULT false,
    "jobTitleId" INTEGER NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "href" TEXT NOT NULL,
    "group" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsQuote" (
    "id" SERIAL NOT NULL,
    "classification" TEXT NOT NULL,
    "datetimeCreatedAt" TIMESTAMP(3) NOT NULL,
    "packageInfo" JSONB NOT NULL,
    "quote" INTEGER NOT NULL,
    "rates" JSONB NOT NULL,
    "shipper" JSONB NOT NULL,
    "shipTo" JSONB NOT NULL,

    CONSTRAINT "UpsQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPasswordResetRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserPasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToRoute" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPasswordResetRequest_userId_key" ON "UserPasswordResetRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToRoute_AB_unique" ON "_RoleToRoute"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToRoute_B_index" ON "_RoleToRoute"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "PayChangeRequest" ADD CONSTRAINT "PayChangeRequest_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayChangeRequest" ADD CONSTRAINT "PayChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPasswordResetRequest" ADD CONSTRAINT "UserPasswordResetRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToRoute" ADD CONSTRAINT "_RoleToRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToRoute" ADD CONSTRAINT "_RoleToRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

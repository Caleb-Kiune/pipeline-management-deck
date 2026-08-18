/*
  Warnings:

  - A unique constraint covering the columns `[month,year]` on the table `ReportingPeriod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_month_year_key" ON "ReportingPeriod"("month", "year");

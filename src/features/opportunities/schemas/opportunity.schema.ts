import { z } from "zod";
import { Category, Product, Stage } from "@prisma/client";

export const opportunityFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  category: z.nativeEnum(Category, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  product: z.nativeEnum(Product, {
    errorMap: () => ({ message: "Please select a valid product" }),
  }),
  expected_premium: z.coerce.number().positive("Expected premium must be a positive number"),
  stage: z.nativeEnum(Stage, {
    errorMap: () => ({ message: "Please select a valid stage" }),
  }),
  latest_comment: z.string().optional(),
  period_id: z.string().uuid("Invalid period ID"),
});

export const createOpportunitySchema = opportunityFormSchema;

export const updateOpportunitySchema = opportunityFormSchema.partial().extend({
  id: z.string().uuid("Invalid opportunity ID"),
});

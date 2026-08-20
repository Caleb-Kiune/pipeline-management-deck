import { z } from "zod";
import { Product, Stage } from "@prisma/client";

export const opportunityFormSchema = z.object({
  client_name: z.string().trim().min(2, "Client name is required (min 2 chars)"),
  intermediary: z.string().trim().min(2, "Intermediary is required (min 2 chars)"),
  contact_person: z.string().optional(),
  product: z.nativeEnum(Product, {
    message: "Please select a valid product"
  }).refine(val => val !== Product.OTHER, {
    message: "Please specify the exact product; OTHER is not allowed for reconciliation."
  }),
  expected_premium: z.coerce.number().positive("Expected premium must be a positive number"),
  expected_closure_month: z.string().min(1, "Expected closure month is required"),
  stage: z.nativeEnum(Stage, {
    message: "Please select a valid stage"
  }),
  latest_comment: z.string().optional(),

});

export const createOpportunitySchema = opportunityFormSchema;

export const updateOpportunitySchema = opportunityFormSchema.partial().extend({
  id: z.string().uuid("Invalid opportunity ID"),
});

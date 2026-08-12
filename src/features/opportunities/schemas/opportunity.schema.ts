import { z } from "zod";
import { Product, Stage } from "@prisma/client";

export const opportunityFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  contact_person: z.string().optional(),
  product: z.nativeEnum(Product, {
    message: "Please select a valid product"
  }),
  expected_premium: z.coerce.number().positive("Expected premium must be a positive number"),
  stage: z.nativeEnum(Stage, {
    message: "Please select a valid stage"
  }),
  latest_comment: z.string().optional(),

});

export const createOpportunitySchema = opportunityFormSchema;

export const updateOpportunitySchema = opportunityFormSchema.partial().extend({
  id: z.string().uuid("Invalid opportunity ID"),
});

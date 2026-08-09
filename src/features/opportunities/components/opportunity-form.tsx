"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, Product, Stage } from "@prisma/client";
import { opportunityFormSchema } from "../schemas/opportunity.schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createOpportunity, updateOpportunity } from "../actions/opportunity.actions";

type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;

interface OpportunityFormProps {
  initialData?: OpportunityFormValues & { id?: string };
  userId: string;
  onSuccess?: () => void;
}

export function OpportunityForm({ initialData, userId, onSuccess }: OpportunityFormProps) {
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: initialData || {
      client_name: "",
      category: Category.MEDICAL,
      product: Product.COOP_CARE,
      expected_premium: 0,
      stage: Stage.PROSPECT,
      latest_comment: "",
      period_id: "",
    },
  });

  async function onSubmit(data: OpportunityFormValues) {
    try {
      if (initialData?.id) {
        await updateOpportunity(initialData.id, data);
      } else {
        await createOpportunity(data, userId);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save opportunity", error);
      // In a real implementation, you might show a toast here
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter client name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Category).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Product).map((product) => (
                    <SelectItem key={product} value={product}>
                      {product.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expected_premium"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Premium</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Stage).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reporting Period ID</FormLabel>
              <FormControl>
                <Input placeholder="Reporting Period UUID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="latest_comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latest Comment (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add a comment..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save Opportunity</Button>
      </form>
    </Form>
  );
}

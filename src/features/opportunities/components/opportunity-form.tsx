"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product, Stage } from "@prisma/client";
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
  onSuccess?: () => void;
}

export function OpportunityForm({ initialData, onSuccess }: OpportunityFormProps) {
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: initialData || {
      client_name: "",
      contact_person: "",
      product: Product.COOP_CARE,
      expected_premium: 0,
      stage: Stage.PROSPECT,
      latest_comment: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        client_name: "",
        contact_person: "",
        product: Product.COOP_CARE,
        expected_premium: 0,
        stage: Stage.PROSPECT,
        latest_comment: "",
      });
    }
  }, [initialData, form]);

  async function onSubmit(data: OpportunityFormValues) {
    try {
      if (initialData?.id) {
        await updateOpportunity(initialData.id, { ...data, id: initialData.id });
      } else {
        await createOpportunity(data);
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
          name="contact_person"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter contact person" {...field} value={field.value || ""} />
              </FormControl>
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
              <Select onValueChange={field.onChange} value={field.value}>
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
                <Input 
                  type="number" 
                  placeholder="0" 
                  {...field} 
                  value={field.value || ""} 
                  onChange={e => field.onChange(e.target.value)} 
                  onWheel={e => e.currentTarget.blur()}
                />
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
              <Select onValueChange={field.onChange} value={field.value}>
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

        <Button type="submit" className="w-full">Save Opportunity</Button>
      </form>
    </Form>
  );
}

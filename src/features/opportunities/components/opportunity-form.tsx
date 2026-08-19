"use client";

import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;

interface OpportunityFormProps {
  initialData?: OpportunityFormValues & { id?: string };
  onSuccess?: () => void;
}

export function OpportunityForm({ initialData, onSuccess }: OpportunityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema) as any,
    defaultValues: initialData || {
      client_name: "",
      intermediary: "",
      contact_person: "",
      product: Product.COOP_CARE,
      expected_premium: "" as any,
      expected_closure_month: "",
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
        intermediary: "",
        contact_person: "",
        product: Product.COOP_CARE,
        expected_premium: "" as any,
        expected_closure_month: "",
        stage: Stage.PROSPECT,
        latest_comment: "",
      });
    }
  }, [initialData, form]);

  async function onSubmit(data: OpportunityFormValues) {
    setIsSubmitting(true);
    try {
      let res;
      if (initialData?.id) {
        res = await updateOpportunity(initialData.id, { ...data, id: initialData.id });
      } else {
        res = await createOpportunity(data);
      }
      
      if (!res.success) {
        toast.error(res.error || "Failed to save opportunity");
      } else {
        toast.success(res.message || "Opportunity saved successfully");
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to save opportunity", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter client name" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="intermediary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intermediary</FormLabel>
              <FormControl>
                <Input placeholder="Enter intermediary (e.g., Direct)" disabled={isSubmitting} {...field} value={field.value || ""} />
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
                <Input placeholder="Enter contact person" disabled={isSubmitting} {...field} value={field.value || ""} />
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
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                  disabled={isSubmitting}
                  {...field} 
                  value={field.value ?? ""} 
                  onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} 
                  onWheel={e => e.currentTarget.blur()}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expected_closure_month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Closure Month</FormLabel>
              <FormControl>
                <Input type="month" disabled={isSubmitting} {...field} />
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
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
            <FormItem className="md:col-span-2">
              <FormLabel>Latest Comment (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add a comment..." disabled={isSubmitting} {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:col-span-2 mt-4" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Opportunity"
          )}
        </Button>
      </form>
    </Form>
  );
}

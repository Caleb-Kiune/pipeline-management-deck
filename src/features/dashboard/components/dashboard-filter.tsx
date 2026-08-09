"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Category } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentCategory = searchParams.get("category") || "ALL";

  function onCategoryChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    // Update the URL to trigger a server re-render
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground">Category:</span>
      <Select value={currentCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          {Object.values(Category).map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

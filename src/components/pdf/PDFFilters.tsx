import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BRANCHES, SEMESTERS, UNITS } from "@/types/pdf";
import { SORT_OPTIONS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface PDFFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  branch: string;
  onBranchChange: (value: string) => void;
  semester: string;
  onSemesterChange: (value: string) => void;
  unit: string;
  onUnitChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
}

export function PDFFilters({
  search,
  onSearchChange,
  branch,
  onBranchChange,
  semester,
  onSemesterChange,
  unit,
  onUnitChange,
  sortBy,
  onSortChange,
  onClearFilters,
}: PDFFiltersProps) {
  const hasActiveFilters = search || branch !== "all" || semester !== "all" || unit !== "all";

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by subject, uploader..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select value={branch} onValueChange={onBranchChange}>
          <SelectTrigger>
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {BRANCHES.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={semester} onValueChange={onSemesterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {SEMESTERS.map((s) => (
              <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={unit} onValueChange={onUnitChange}>
          <SelectTrigger>
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u.toString()}>Unit {u}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary">
              Search: "{search}"
              <button onClick={() => onSearchChange("")} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {branch !== "all" && (
            <Badge variant="secondary">
              {branch}
              <button onClick={() => onBranchChange("all")} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {semester !== "all" && (
            <Badge variant="secondary">
              Sem {semester}
              <button onClick={() => onSemesterChange("all")} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {unit !== "all" && (
            <Badge variant="secondary">
              Unit {unit}
              <button onClick={() => onUnitChange("all")} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

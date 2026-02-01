import { useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PDFCard } from "@/components/pdf/PDFCard";
import { PDFFilters } from "@/components/pdf/PDFFilters";
import { PDFPreviewModal } from "@/components/pdf/PDFPreviewModal";
import { DeletePDFModal } from "@/components/pdf/DeletePDFModal";
import { Button } from "@/components/ui/button";
import { PDF } from "@/types/pdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Browse() {
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPDF, setSelectedPDF] = useState<PDF | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [semester, setSemester] = useState("all");
  const [unit, setUnit] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    fetchPDFs();
  }, [branch, semester, unit, sortBy]);

  const fetchPDFs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("pdfs")
        .select("*")
        .eq("status", "approved");

      if (branch !== "all") {
        query = query.eq("branch", branch);
      }
      if (semester !== "all") {
        query = query.eq("semester", parseInt(semester));
      }
      if (unit !== "all") {
        query = query.eq("unit", parseInt(unit));
      }

      // Sorting
      switch (sortBy) {
        case "most_downloaded":
          query = query.order("downloads_count", { ascending: false });
          break;
        case "most_viewed":
          query = query.order("views_count", { ascending: false });
          break;
        case "highest_rated":
          query = query.order("average_rating", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      // Cast the data to PDF type
      setPdfs((data || []) as PDF[]);
    } catch (error: any) {
      toast({
        title: "Error loading PDFs",
        description: error.message || "Could not load PDFs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (pdf: PDF) => {
    try {
      // Increment download count
      await supabase.rpc("increment_pdf_downloads", { pdf_uuid: pdf.id });

      // Get download URL
      const { data } = supabase.storage.from("pdfs").getPublicUrl(pdf.file_path);
      
      // Open in new tab
      window.open(data.publicUrl, "_blank");

      toast({
        title: "Download started",
        description: `Downloading ${pdf.file_name}`,
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Could not download PDF.",
        variant: "destructive",
      });
    }
  };

  const filteredPDFs = pdfs.filter((pdf) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      pdf.subject_name.toLowerCase().includes(searchLower) ||
      pdf.uploader_name.toLowerCase().includes(searchLower) ||
      pdf.file_name.toLowerCase().includes(searchLower)
    );
  });

  const clearFilters = () => {
    setSearch("");
    setBranch("all");
    setSemester("all");
    setUnit("all");
    setSortBy("latest");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Browse PDFs</h1>
            <p className="text-muted-foreground mt-1">
              Discover and download academic resources shared by students
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowDeleteModal(true)}>
            Delete My PDF
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <PDFFilters
              search={search}
              onSearchChange={setSearch}
              branch={branch}
              onBranchChange={setBranch}
              semester={semester}
              onSemesterChange={setSemester}
              unit={unit}
              onUnitChange={setUnit}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClearFilters={clearFilters}
            />
          </div>

          {/* PDF Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPDFs.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No PDFs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPDFs.map((pdf) => (
                  <PDFCard
                    key={pdf.id}
                    pdf={pdf}
                    onView={setSelectedPDF}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PDFPreviewModal
        pdf={selectedPDF}
        isOpen={!!selectedPDF}
        onClose={() => setSelectedPDF(null)}
        onDownload={handleDownload}
      />

      <DeletePDFModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={fetchPDFs}
      />
    </Layout>
  );
}

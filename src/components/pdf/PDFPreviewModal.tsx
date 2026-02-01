import { useState, useEffect } from "react";
import { X, Download, Star, Flag, Eye, User, Calendar, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PDF } from "@/types/pdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PDFPreviewModalProps {
  pdf: PDF | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (pdf: PDF) => void;
}

export function PDFPreviewModal({ pdf, isOpen, onClose, onDownload }: PDFPreviewModalProps) {
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rollNumberForRating, setRollNumberForRating] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporterRollNumber, setReporterRollNumber] = useState("");

  useEffect(() => {
    if (pdf && isOpen) {
      loadPDF();
      incrementViews();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [pdf, isOpen]);

  const loadPDF = async () => {
    if (!pdf) return;
    setIsLoading(true);
    
    try {
      const { data } = supabase.storage.from("pdfs").getPublicUrl(pdf.file_path);
      setPdfUrl(data.publicUrl);
    } catch (error) {
      toast({
        title: "Error loading PDF",
        description: "Could not load the PDF preview.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViews = async () => {
    if (!pdf) return;
    await supabase.rpc("increment_pdf_views", { pdf_uuid: pdf.id });
  };

  const handleRatingSubmit = async () => {
    if (!pdf || userRating === 0 || !rollNumberForRating.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your roll number and rating.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("pdf_ratings").upsert({
        pdf_id: pdf.id,
        roll_number: rollNumberForRating,
        rating: userRating,
        comment: comment || null,
      });

      if (error) throw error;

      toast({
        title: "Rating submitted!",
        description: "Thank you for your feedback.",
      });
      setUserRating(0);
      setComment("");
      setRollNumberForRating("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not submit rating.",
        variant: "destructive",
      });
    }
  };

  const handleReportSubmit = async () => {
    if (!pdf || !reportReason.trim() || !reporterRollNumber.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your roll number and reason.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("pdf_reports").insert({
        pdf_id: pdf.id,
        reporter_roll_number: reporterRollNumber,
        reason: reportReason,
      });

      if (error) throw error;

      toast({
        title: "Report submitted!",
        description: "Thank you for helping us maintain quality.",
      });
      setShowReportForm(false);
      setReportReason("");
      setReporterRollNumber("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not submit report.",
        variant: "destructive",
      });
    }
  };

  if (!pdf) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{pdf.file_name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{pdf.subject_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onDownload(pdf)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* PDF Viewer */}
          <div className="flex-1 bg-muted/50 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full"
                title="PDF Preview"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Could not load PDF preview
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-border overflow-y-auto p-4 space-y-6">
            {/* Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="font-medium">{pdf.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-medium">{pdf.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit</span>
                  <span className="font-medium">{pdf.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{(pdf.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 py-3 border-y border-border">
              <div className="flex items-center gap-1.5 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>{pdf.views_count} views</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>{pdf.downloads_count} downloads</span>
              </div>
            </div>

            {/* Uploader */}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{pdf.uploader_name}</span>
              <span className="text-muted-foreground">•</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDistanceToNow(new Date(pdf.created_at), { addSuffix: true })}</span>
            </div>

            {/* AI Summary */}
            {pdf.ai_summary && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">AI Summary</h3>
                <p className="text-sm text-muted-foreground">{pdf.ai_summary}</p>
                {pdf.ai_topics && pdf.ai_topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pdf.ai_topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rating */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Rate this PDF</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoverRating || userRating)
                          ? "fill-chart-4 text-chart-4"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Your roll number"
                value={rollNumberForRating}
                onChange={(e) => setRollNumberForRating(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              />
              <Textarea
                placeholder="Add a comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
              <Button size="sm" onClick={handleRatingSubmit} disabled={userRating === 0}>
                Submit Rating
              </Button>
            </div>

            {/* Report */}
            <div className="pt-3 border-t border-border">
              {!showReportForm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setShowReportForm(true)}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Report this PDF
                </Button>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-destructive">Report PDF</h4>
                  <input
                    type="text"
                    placeholder="Your roll number"
                    value={reporterRollNumber}
                    onChange={(e) => setReporterRollNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                  />
                  <Textarea
                    placeholder="Reason for reporting..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={handleReportSubmit}>
                      Submit Report
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowReportForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

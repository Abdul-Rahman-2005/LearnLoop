import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeletePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeletePDFModal({ isOpen, onClose, onSuccess }: DeletePDFModalProps) {
  const { toast } = useToast();
  const [rollNumber, setRollNumber] = useState("");
  const [uploadReference, setUploadReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundPDF, setFoundPDF] = useState<{ id: string; file_name: string; file_path: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSearch = async () => {
    if (!rollNumber.trim() || !uploadReference.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both roll number and upload reference.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pdfs")
        .select("id, file_name, file_path")
        .eq("uploader_roll_number", rollNumber)
        .eq("upload_reference", uploadReference)
        .single();

      if (error || !data) {
        toast({
          title: "PDF not found",
          description: "No PDF found with the provided credentials.",
          variant: "destructive",
        });
        return;
      }

      setFoundPDF(data);
      setShowConfirm(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not search for PDF.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!foundPDF) return;

    setIsLoading(true);
    try {
      // Delete from storage
      await supabase.storage.from("pdfs").remove([foundPDF.file_path]);

      // Delete from database
      const { error } = await supabase.from("pdfs").delete().eq("id", foundPDF.id);
      if (error) throw error;

      toast({
        title: "PDF deleted",
        description: "Your PDF has been permanently deleted.",
      });
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete PDF.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRollNumber("");
    setUploadReference("");
    setFoundPDF(null);
    setShowConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Your PDF
          </DialogTitle>
          <DialogDescription>
            Verify your ownership to delete your uploaded PDF.
          </DialogDescription>
        </DialogHeader>

        {!showConfirm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter your roll number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadReference">Upload Reference</Label>
              <Input
                id="uploadReference"
                value={uploadReference}
                onChange={(e) => setUploadReference(e.target.value)}
                placeholder="Enter upload reference code"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Find PDF"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                <p className="font-medium">Are you sure you want to permanently delete this PDF?</p>
                <p className="mt-1 text-sm">{foundPDF?.file_name}</p>
                <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

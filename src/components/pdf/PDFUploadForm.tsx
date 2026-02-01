import { useState } from "react";
import { Upload, FileText, AlertCircle, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRANCHES, SEMESTERS, UNITS } from "@/types/pdf";
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  studentName: string;
  rollNumber: string;
  branch: string;
  subjectName: string;
  semester: string;
  unit: string;
  file: File | null;
}

export function PDFUploadForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    studentName: "",
    rollNumber: "",
    branch: "",
    subjectName: "",
    semester: "",
    unit: "",
    file: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadReference, setUploadReference] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = "Student name is required";
    }
    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = "Roll number is required";
    }
    if (!formData.branch) {
      newErrors.branch = "Branch is required";
    }
    if (!formData.subjectName.trim()) {
      newErrors.subjectName = "Subject name is required";
    }
    if (!formData.semester) {
      newErrors.semester = "Semester is required";
    }
    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }
    if (!formData.file) {
      newErrors.file = "PDF file is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicate = async () => {
    if (!formData.branch || !formData.subjectName || !formData.semester || !formData.unit) return;

    const { data } = await supabase
      .from("pdfs")
      .select("id, file_name")
      .eq("branch", formData.branch)
      .eq("subject_name", formData.subjectName)
      .eq("semester", parseInt(formData.semester))
      .eq("unit", parseInt(formData.unit))
      .limit(1);

    if (data && data.length > 0) {
      setDuplicateWarning(`A similar PDF already exists: "${data[0].file_name}". You can still upload if your content is different.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setErrors({ ...errors, file: "Only PDF files are allowed" });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors({ ...errors, file: "File size must be less than 30MB" });
        return;
      }
      setFormData({ ...formData, file });
      setErrors({ ...errors, file: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !formData.file) return;

    setIsSubmitting(true);

    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${formData.file.name}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // Insert metadata
      const { data, error: insertError } = await supabase
        .from("pdfs")
        .insert({
          uploader_roll_number: formData.rollNumber,
          uploader_name: formData.studentName,
          branch: formData.branch,
          subject_name: formData.subjectName,
          semester: parseInt(formData.semester),
          unit: parseInt(formData.unit),
          file_name: formData.file.name,
          file_path: filePath,
          file_size: formData.file.size,
          status: "approved", // Auto-approve for now
        })
        .select("id, upload_reference")
        .single();

      if (insertError) throw insertError;

      // Trigger AI summary generation in background (fire and forget)
      const contentForAI = `Subject: ${formData.subjectName}\nBranch: ${formData.branch}\nSemester: ${formData.semester}\nUnit: ${formData.unit}\nFile: ${formData.file.name}`;
      
      supabase.functions.invoke('generate-summary', {
        body: { pdf_id: data.id, content: contentForAI }
      }).then(({ error }) => {
        if (error) console.error('AI summary generation failed:', error);
        else console.log('AI summary generated successfully');
      });

      setUploadSuccess(true);
      setUploadReference(data.upload_reference);
      toast({
        title: "Upload Successful!",
        description: "Your PDF has been uploaded. AI summary is being generated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred while uploading.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (uploadSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-chart-2/20 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-chart-2" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Upload Successful!</h2>
            <p className="text-muted-foreground">Your PDF has been uploaded and is now available for others to view.</p>
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription>
                <strong>Your Upload Reference:</strong> <code className="bg-muted px-2 py-1 rounded">{uploadReference}</code>
                <p className="text-sm mt-2 text-muted-foreground">Save this reference along with your roll number to delete this PDF later.</p>
              </AlertDescription>
            </Alert>
            <Button onClick={() => {
              setUploadSuccess(false);
              setFormData({
                studentName: "",
                rollNumber: "",
                branch: "",
                subjectName: "",
                semester: "",
                unit: "",
                file: null,
              });
            }}>
              Upload Another PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload PDF
        </CardTitle>
        <CardDescription>
          Share your academic notes with fellow students. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="Enter your name"
                className={errors.studentName ? "border-destructive" : ""}
              />
              {errors.studentName && (
                <p className="text-sm text-destructive">{errors.studentName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input
                id="rollNumber"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="Enter your roll number"
                className={errors.rollNumber ? "border-destructive" : ""}
              />
              {errors.rollNumber && (
                <p className="text-sm text-destructive">{errors.rollNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select
                value={formData.branch}
                onValueChange={(value) => {
                  setFormData({ ...formData, branch: value });
                  setTimeout(checkDuplicate, 100);
                }}
              >
                <SelectTrigger className={errors.branch ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch && (
                <p className="text-sm text-destructive">{errors.branch}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name *</Label>
              <Input
                id="subjectName"
                value={formData.subjectName}
                onChange={(e) => {
                  setFormData({ ...formData, subjectName: e.target.value });
                  setTimeout(checkDuplicate, 500);
                }}
                placeholder="e.g., Data Structures"
                className={errors.subjectName ? "border-destructive" : ""}
              />
              {errors.subjectName && (
                <p className="text-sm text-destructive">{errors.subjectName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Semester *</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => {
                  setFormData({ ...formData, semester: value });
                  setTimeout(checkDuplicate, 100);
                }}
              >
                <SelectTrigger className={errors.semester ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.semester && (
                <p className="text-sm text-destructive">{errors.semester}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => {
                  setFormData({ ...formData, unit: value });
                  setTimeout(checkDuplicate, 100);
                }}
              >
                <SelectTrigger className={errors.unit ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u.toString()}>Unit {u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit}</p>
              )}
            </div>
          </div>

          {duplicateWarning && (
            <Alert className="bg-chart-4/10 border-chart-4/30">
              <AlertCircle className="h-4 w-4 text-chart-4" />
              <AlertDescription className="text-chart-4">{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">PDF File * (Max 30MB)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                {formData.file ? (
                  <div className="flex items-center justify-center gap-2 text-foreground">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{formData.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">PDF files only (max 30MB)</p>
                  </div>
                )}
              </label>
            </div>
            {errors.file && (
              <p className="text-sm text-destructive">{errors.file}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

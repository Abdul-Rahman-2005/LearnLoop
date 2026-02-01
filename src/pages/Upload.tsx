import { Layout } from "@/components/layout/Layout";
import { PDFUploadForm } from "@/components/pdf/PDFUploadForm";

export default function Upload() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload PDF</h1>
          <p className="text-muted-foreground">
            Share your academic notes and help fellow students succeed
          </p>
        </div>
        
        <PDFUploadForm />
      </div>
    </Layout>
  );
}

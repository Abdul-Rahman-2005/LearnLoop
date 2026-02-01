import { FileText, Download, Eye, Star, TrendingUp, Clock, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PDF } from "@/types/pdf";
import { formatDistanceToNow } from "date-fns";

interface PDFCardProps {
  pdf: PDF;
  onView: (pdf: PDF) => void;
  onDownload: (pdf: PDF) => void;
}

export function PDFCard({ pdf, onView, onDownload }: PDFCardProps) {
  const isTrending = pdf.views_count > 100 || pdf.downloads_count > 50;
  const isMostDownloaded = pdf.downloads_count > 100;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate" title={pdf.file_name}>
                {pdf.file_name}
              </h3>
              <p className="text-sm text-muted-foreground">{pdf.subject_name}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {isTrending && (
              <Badge variant="secondary" className="bg-chart-1/20 text-chart-1 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
            {isMostDownloaded && (
              <Badge variant="secondary" className="bg-chart-2/20 text-chart-2 text-xs">
                Most Downloaded
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium">Branch:</span>
            <span className="truncate">{pdf.branch}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium">Sem:</span>
            <span>{pdf.semester}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium">Unit:</span>
            <span>{pdf.unit}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium">Size:</span>
            <span>{formatFileSize(pdf.file_size)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{pdf.views_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{pdf.downloads_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-chart-4" />
            <span>{pdf.average_rating.toFixed(1)}</span>
            <span className="text-xs">({pdf.ratings_count})</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{pdf.uploader_name}</span>
          <span>•</span>
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(pdf.created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onView(pdf)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <Button 
          size="sm" 
          className="flex-1"
          onClick={() => onDownload(pdf)}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}

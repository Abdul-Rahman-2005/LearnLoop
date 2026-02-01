import { BookOpen, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">LearnLoop</span>
            <span className="text-sm">© {new Date().getFullYear()} All Rights Reserved to SHAIK.ABDUL RAHMAN</span>
          </div>
          
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-destructive" /> for students
          </p>
        </div>
      </div>
    </footer>
  );
}

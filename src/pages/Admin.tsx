import { useState, useEffect } from "react";
import { Shield, FileText, CheckCircle, XCircle, Trash2, Eye, AlertTriangle, Loader2, BarChart3, Settings } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDF, PDFReport } from "@/types/pdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Admin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [pendingPdfs, setPendingPdfs] = useState<PDF[]>([]);
  const [reports, setReports] = useState<(PDFReport & { pdf?: PDF })[]>([]);
  const [stats, setStats] = useState({
    totalPdfs: 0,
    pendingPdfs: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalReports: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<PDF | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Simple admin password - in production, use proper auth
  const DEFAULT_PASSWORD = "Rahman@2005";
  const getAdminPassword = () => localStorage.getItem("admin_password") || DEFAULT_PASSWORD;

  const handleLogin = () => {
    if (adminPassword === getAdminPassword()) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      toast({
        title: "Invalid password",
        description: "Please enter the correct admin password.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = () => {
    if (currentPassword !== getAdminPassword()) {
      toast({
        title: "Incorrect current password",
        description: "Please enter the correct current password.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem("admin_password", newPassword);
    setShowPasswordChange(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    toast({
      title: "Password changed",
      description: "Admin password has been updated successfully.",
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all PDFs
      const { data: allPdfs } = await supabase
        .from("pdfs")
        .select("*")
        .order("created_at", { ascending: false });

      setPdfs((allPdfs || []) as PDF[]);
      setPendingPdfs((allPdfs || []).filter((p: any) => p.status === "pending") as PDF[]);

      // Fetch reports with PDF details
      const { data: reportsData } = await supabase
        .from("pdf_reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Fetch PDF details for each report
      const reportsWithPdf = await Promise.all(
        (reportsData || []).map(async (report: any) => {
          const { data: pdfData } = await supabase
            .from("pdfs")
            .select("*")
            .eq("id", report.pdf_id)
            .single();
          return { ...report, pdf: pdfData as PDF | null };
        })
      );

      setReports(reportsWithPdf as (PDFReport & { pdf?: PDF })[]);

      // Calculate stats
      const totalDownloads = (allPdfs || []).reduce((sum: number, p: any) => sum + (p.downloads_count || 0), 0);
      const totalViews = (allPdfs || []).reduce((sum: number, p: any) => sum + (p.views_count || 0), 0);

      setStats({
        totalPdfs: (allPdfs || []).length,
        pendingPdfs: (allPdfs || []).filter((p: any) => p.status === "pending").length,
        totalDownloads,
        totalViews,
        totalReports: (reportsData || []).length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (pdf: PDF) => {
    try {
      const { error } = await supabase
        .from("pdfs")
        .update({ status: "approved" })
        .eq("id", pdf.id);

      if (error) throw error;

      toast({ title: "PDF Approved", description: pdf.file_name });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (pdf: PDF) => {
    try {
      const { error } = await supabase
        .from("pdfs")
        .update({ status: "rejected" })
        .eq("id", pdf.id);

      if (error) throw error;

      toast({ title: "PDF Rejected", description: pdf.file_name });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (pdf: PDF) => {
    try {
      // Delete from storage
      await supabase.storage.from("pdfs").remove([pdf.file_path]);

      // Delete from database
      const { error } = await supabase.from("pdfs").delete().eq("id", pdf.id);
      if (error) throw error;

      toast({ title: "PDF Deleted", description: pdf.file_name });
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("pdf_reports")
        .update({ status: "dismissed" })
        .eq("id", reportId);

      if (error) throw error;

      toast({ title: "Report dismissed" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteReportedPdf = async (report: PDFReport & { pdf?: PDF }) => {
    if (!report.pdf) return;
    
    try {
      // Delete from storage
      await supabase.storage.from("pdfs").remove([report.pdf.file_path]);

      // Delete from database
      const { error } = await supabase.from("pdfs").delete().eq("id", report.pdf.id);
      if (error) throw error;

      // Mark report as resolved
      await supabase
        .from("pdf_reports")
        .update({ status: "resolved" })
        .eq("id", report.id);

      toast({ title: "PDF Deleted", description: `Deleted ${report.pdf.file_name} and resolved the report.` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>Enter the admin password to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage PDFs and moderate content</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Admin Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowPasswordChange(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handlePasswordChange}>
                      Update Password
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.totalPdfs}</p>
              <p className="text-sm text-muted-foreground">Total PDFs</p>
            </CardContent>
          </Card>
          <Card className={stats.pendingPdfs > 0 ? "border-chart-4" : ""}>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-chart-4 mb-2" />
              <p className="text-2xl font-bold">{stats.pendingPdfs}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-chart-2 mb-2" />
              <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </CardContent>
          </Card>
          <Card className={stats.totalReports > 0 ? "border-destructive" : ""}>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-2xl font-bold">{stats.totalReports}</p>
              <p className="text-sm text-muted-foreground">Reports</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Approval
              {pendingPdfs.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingPdfs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All PDFs</TabsTrigger>
            <TabsTrigger value="reports">
              Reports
              {reports.length > 0 && (
                <Badge variant="destructive" className="ml-2">{reports.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingPdfs.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-chart-2 mb-4" />
                  <p className="text-lg font-semibold">All caught up!</p>
                  <p className="text-muted-foreground">No pending PDFs to review</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Uploader</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPdfs.map((pdf) => (
                      <TableRow key={pdf.id}>
                        <TableCell className="font-medium">{pdf.file_name}</TableCell>
                        <TableCell>{pdf.subject_name}</TableCell>
                        <TableCell>{pdf.uploader_name}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(pdf.created_at), { addSuffix: true })}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" onClick={() => handleApprove(pdf)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(pdf)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pdfs.map((pdf) => (
                    <TableRow key={pdf.id}>
                      <TableCell className="font-medium">{pdf.file_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pdf.status === "approved"
                              ? "default"
                              : pdf.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {pdf.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{pdf.views_count}</TableCell>
                      <TableCell>{pdf.downloads_count}</TableCell>
                      <TableCell>{pdf.average_rating.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm(pdf)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete PDF</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{pdf.file_name}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-3 justify-end">
                              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={() => handleDelete(pdf)}>
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-chart-2 mb-4" />
                  <p className="text-lg font-semibold">No reports</p>
                  <p className="text-muted-foreground">All content is clean</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id} className="border-destructive/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Report #{report.id.slice(0, 8)}
                          </CardTitle>
                          <CardDescription>
                            Reported by {report.reporter_roll_number} • {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">Pending Review</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Report Reason */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Report Reason</Label>
                        <Alert>
                          <AlertDescription className="whitespace-pre-wrap">
                            {report.reason}
                          </AlertDescription>
                        </Alert>
                      </div>

                      {/* PDF Details */}
                      {report.pdf ? (
                        <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/50">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{report.pdf.file_name}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Subject:</span>{" "}
                              <span className="font-medium">{report.pdf.subject_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Branch:</span>{" "}
                              <span className="font-medium">{report.pdf.branch}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Uploader:</span>{" "}
                              <span className="font-medium">{report.pdf.uploader_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>{" "}
                              <Badge variant={report.pdf.status === "approved" ? "default" : "secondary"}>
                                {report.pdf.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" /> {report.pdf.views_count} views
                            </span>
                            <span>{report.pdf.downloads_count} downloads</span>
                            <span>Rating: {report.pdf.average_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            PDF not found. It may have already been deleted.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleDismissReport(report.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss Report
                        </Button>
                        {report.pdf && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete PDF
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Reported PDF</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete "{report.pdf.file_name}"? This action cannot be undone. The report will be marked as resolved.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex gap-3 justify-end">
                                <Button variant="outline">Cancel</Button>
                                <Button variant="destructive" onClick={() => handleDeleteReportedPdf(report)}>
                                  Delete PDF
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

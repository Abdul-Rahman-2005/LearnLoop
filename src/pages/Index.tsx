import { Link } from "react-router-dom";
import { Upload, Search, Trophy, Shield, BookOpen, FileText, Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import heroImage from "@/assets/hero-illustration.jpg";

const Index = () => {
  const features = [
    {
      icon: Upload,
      title: "Easy Upload",
      description: "Upload your notes with just a few clicks. Support for PDFs up to 30MB.",
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Find exactly what you need with advanced filters by branch, semester, and unit.",
    },
    {
      icon: Sparkles,
      title: "AI-Powered",
      description: "Get automatic summaries and key topics extracted from uploaded documents.",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Earn points and badges for contributing. Climb the leaderboard!",
    },
  ];

  const stats = [
    { icon: FileText, value: "1000+", label: "PDFs Shared" },
    { icon: Users, value: "500+", label: "Contributors" },
    { icon: TrendingUp, value: "10k+", label: "Downloads" },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/30 to-background py-20 md:py-32">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Academic PDF Sharing Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Share Knowledge,<br />
              <span className="text-primary">Empower Learning</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              LearnLoop is your one-stop platform for sharing and discovering academic PDFs. 
              Upload notes, find study materials, and help your fellow students succeed.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/browse">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8">
                  <Search className="h-5 w-5" />
                  Browse PDFs
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-lg px-8">
                  <Upload className="h-5 w-5" />
                  Upload Notes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose LearnLoop?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to share and discover academic resources, all in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-primary/50 transition-colors group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/20 to-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-card/80 backdrop-blur border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Ready to contribute?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Share your notes and help fellow students. Earn points, climb the leaderboard, 
                    and become a LearnLoop legend!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Link to="/upload">
                      <Button size="lg" className="gap-2">
                        <Upload className="h-5 w-5" />
                        Start Uploading
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/leaderboard">
                      <Button size="lg" variant="outline" className="gap-2">
                        <Trophy className="h-5 w-5" />
                        View Leaderboard
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

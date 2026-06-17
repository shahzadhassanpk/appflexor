import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Terminal, Zap, Shield, Code, Cpu, Blocks, Layers, Server } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("deploy");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Blocks className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Appflexor</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#docs" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Log in</Link>
            <Button className="font-semibold" data-testid="button-nav-signup">Start Building</Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          {/* Abstract Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
                <Zap className="w-4 h-4" />
                <span>Appflexor 2.0 is now live</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-8 text-balance">
                Flex your apps with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                  absolute confidence.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                The developer-first platform for shipping, scaling, and maintaining modern applications. No magic black boxes, just pure control and raw power.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-12 px-8 text-base font-semibold group w-full sm:w-auto" data-testid="button-hero-start">
                  Start Flexing Now
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold w-full sm:w-auto" data-testid="button-hero-docs">
                  <Terminal className="mr-2 w-4 h-4" />
                  Read the Docs
                </Button>
              </div>
            </div>

            {/* Code/Terminal Mockup */}
            <div className="mt-20 max-w-5xl mx-auto rounded-xl overflow-hidden border border-border/50 bg-card shadow-2xl relative">
              {/* Window Controls */}
              <div className="h-12 border-b border-border/50 bg-muted/50 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center text-xs font-mono text-muted-foreground">
                  ~/projects/appflexor-demo
                </div>
              </div>
              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto text-left">
                <div className="text-muted-foreground mb-2"># Initialize a new flex environment</div>
                <div className="flex">
                  <span className="text-primary mr-2">➜</span>
                  <span className="text-foreground">flex init my-awesome-app</span>
                </div>
                <div className="text-green-500 mt-1">✔ Created new flex environment</div>
                
                <div className="text-muted-foreground mt-4 mb-2"># Deploy to edge network</div>
                <div className="flex">
                  <span className="text-primary mr-2">➜</span>
                  <span className="text-foreground">flex deploy --production</span>
                </div>
                <div className="text-blue-400 mt-1">Building assets...</div>
                <div className="text-blue-400">Optimizing routes...</div>
                <div className="text-green-500 mt-1">✔ Deployed successfully to 142 edge nodes in 2.4s</div>
                <div className="text-foreground mt-2">
                  URL: <a href="#" className="text-primary hover:underline">https://my-awesome-app.flex.dev</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border/40">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Built for engineers who care.</h2>
              <p className="text-muted-foreground text-lg">We sweat the details so you can focus on building incredible experiences. Tight primitives, fast workflows.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Sub-second deploys</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Push code and see it live instantly. Our proprietary edge routing architecture ensures your updates propagate globally before you can switch tabs.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Type-safe environment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  End-to-end type safety from database to client. Catch configuration errors at build time, not runtime.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Raw compute access</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Need more than serverless? Drop down into raw compute primitives instantly. We don't hide the infrastructure when you actually need it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Feature Demo */}
        <section className="py-32 relative">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                  Configure once. <br />Deploy everywhere.
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Stop wrestling with complex CI/CD pipelines. Appflexor reads your configuration and automatically provisions the exact infrastructure your code needs.
                </p>
                
                <div className="space-y-4">
                  {[
                    { id: "deploy", icon: Server, title: "Edge Deployment", desc: "Global distribution by default." },
                    { id: "data", icon: Layers, title: "Data Layer", desc: "Distributed SQLite with read replicas." },
                    { id: "auth", icon: Shield, title: "Auth & Identity", desc: "Secure sessions and edge middleware." }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start p-4 rounded-xl border transition-all text-left ${
                        activeTab === tab.id 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-transparent hover:border-border/50 hover:bg-muted/30"
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <tab.icon className={`w-6 h-6 mt-0.5 mr-4 ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <h4 className={`font-semibold ${activeTab === tab.id ? "text-foreground" : "text-foreground"}`}>{tab.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{tab.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Code Viewer */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl h-[400px] flex flex-col">
                <div className="flex border-b border-border/50 bg-muted/30">
                  <div className="px-4 py-2 text-sm font-mono text-muted-foreground border-r border-border/50">flex.config.ts</div>
                </div>
                <div className="p-6 font-mono text-sm overflow-auto flex-1">
                  {activeTab === "deploy" && (
                    <div className="text-foreground animate-in fade-in zoom-in-95 duration-300">
                      <span className="text-blue-500">export default</span> {'{'}
                      <br />
                      {'  '}name: <span className="text-green-500">'my-app'</span>,
                      <br />
                      {'  '}region: <span className="text-green-500">'global'</span>,
                      <br />
                      {'  '}runtime: <span className="text-green-500">'edge'</span>,
                      <br />
                      {'  '}scaling: {'{'}
                      <br />
                      {'    '}min: <span className="text-orange-500">0</span>,
                      <br />
                      {'    '}max: <span className="text-orange-500">100</span>
                      <br />
                      {'  }'}
                      <br />
                      {'}'};
                    </div>
                  )}
                  {activeTab === "data" && (
                    <div className="text-foreground animate-in fade-in zoom-in-95 duration-300">
                      <span className="text-blue-500">export default</span> {'{'}
                      <br />
                      {'  '}database: {'{'}
                      <br />
                      {'    '}type: <span className="text-green-500">'sqlite'</span>,
                      <br />
                      {'    '}replicas: <span className="text-orange-500">5</span>,
                      <br />
                      {'    '}sync: <span className="text-green-500">'active'</span>
                      <br />
                      {'  }'}
                      <br />
                      {'}'};
                    </div>
                  )}
                  {activeTab === "auth" && (
                    <div className="text-foreground animate-in fade-in zoom-in-95 duration-300">
                      <span className="text-blue-500">export default</span> {'{'}
                      <br />
                      {'  '}auth: {'{'}
                      <br />
                      {'    '}providers: [<span className="text-green-500">'github'</span>, <span className="text-green-500">'google'</span>],
                      <br />
                      {'    '}sessionStrategy: <span className="text-green-500">'jwt'</span>,
                      <br />
                      {'    '}edgeMiddleware: <span className="text-orange-500">true</span>
                      <br />
                      {'  }'}
                      <br />
                      {'}'};
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 border-t border-border/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Stop managing servers. <br />Start building apps.</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join thousands of developers who have already switched to Appflexor for their critical infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-base font-semibold group w-full sm:w-auto" data-testid="button-cta-start">
                Get Started for Free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4 sm:mt-0 sm:ml-4">No credit card required.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                  <Blocks className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight">Appflexor</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                The modern app platform for developers who care about craft.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Developers</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Appflexor Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

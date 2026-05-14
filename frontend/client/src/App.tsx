import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PipelinesPage, { Analyses, Comparisons } from "./pages/Pipelines";
import PipelineDetail from "./pages/PipelineDetail";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyses" component={Analyses} />
      <Route path="/analyses/:id" component={PipelineDetail} />
      <Route path="/comparisons" component={Comparisons} />
      <Route path="/comparisons/:id" component={PipelineDetail} />
      <Route path="/pipelines" component={PipelinesPage} />
      <Route path="/pipelines/:id" component={PipelineDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

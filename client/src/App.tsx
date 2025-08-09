import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Wallet from "@/pages/Wallet";
import AdminDashboard from "@/pages/AdminDashboard";
import LiveStream from "@/pages/LiveStream";

function AppRoutes() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark">
        <div className="text-center">
          <div className="w-8 h-8 bitcoin-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route>
            <Redirect to="/login" />
          </Route>
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/wallet" component={Wallet} />
          <Route path="/live/:id" component={LiveStream} />
          {user.isAdmin && (
            <Route path="/admin" component={AdminDashboard} />
          )}
          <Route path="/login">
            <Redirect to="/" />
          </Route>
          <Route path="/register">
            <Redirect to="/" />
          </Route>
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-dark">
              <Toaster />
              <AppRoutes />
            </div>
          </SocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

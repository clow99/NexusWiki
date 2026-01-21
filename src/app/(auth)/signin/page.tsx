import Image from "next/image";
import { SignInButton } from "@/components/auth/signin-button";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-bg opacity-90" />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-2xl border border-white/20 p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/Gemini_Generated_Image_mslllemslllemsll-removebg-preview.png"
              alt="NexusWiki"
              width={240}
              height={80}
              className="h-16 w-auto"
              priority
            />
          </div>
          
          {/* Content */}
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your workspace
            </p>
          </div>
          
          {/* Sign in button */}
          <SignInButton />
          
          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
        
        {/* Bottom tagline */}
        <p className="mt-6 text-center text-sm text-white/80">
          Knowledge Connected.
        </p>
      </div>
    </div>
  );
}

"use client";
import { Shield, Globe, Building2, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Background Animation */}
      <BackgroundEffects />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <Header />
        <MainContent router={router} />
        <Footer />
      </div>
    </div>
  );
}

// Background animation component
function BackgroundEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse delay-500"></div>
    </div>
  );
}

// Header component
function Header() {
  return (
    <header className="mb-12 text-center">
      <div className="inline-flex items-center justify-center   mb-6 ">
        <img src="/logo.svg" alt="Force Company Logo" />
      </div>
      <h1 className="text-5xl font-bold text-white mb-2">Force </h1>
      <p className="text-xl text-blue-200">Administrative Control Panel</p>
    </header>
  );
}

// Main content component
function MainContent({ router }: { router: any }) {
  return (
    <main className="max-w-4xl w-full">
      <WelcomeSection />
      <DashboardButton router={router} />
    </main>
  );
}

// Welcome section
function WelcomeSection() {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-white mb-4">Welcome, Administrator</h2>
      <p className="text-xl text-blue-200 max-w-3xl mx-auto">
        Manage your organization's users, data, and operations with our comprehensive 
        administrative dashboard built for Force Company's unique needs.
      </p>
    </div>
  );
}

// Dashboard access button
function DashboardButton({ router }: { router: any }) {
  return (
    <div className="text-center mb-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-white/20 max-w-lg mx-auto">
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-8 mx-auto shadow-xl">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4">Ready to Get Started?</h3>
        <p className="text-blue-200 mb-8 text-lg">
          Access your administrative dashboard to begin managing Force Company's operations.
        </p>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="group inline-flex items-center justify-center w-full px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl text-lg"
        >
          <span>Enter Admin Dashboard</span>
          <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// Footer component
function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="text-center">
      <div className="flex items-center justify-center space-x-8 mb-4">
        <FooterItem icon={Globe} text="Global Operations" />
        <FooterItem icon={Shield} text="ISO 27001 Certified" />
        <FooterItem icon={Building2} text="Force Company" />
      </div>
      <p className="text-sm text-blue-400">
        © {currentYear} Force Company. All rights reserved. | Admin Portal v2.0
      </p>
    </footer>
  );
}

// Footer item component
function FooterItem({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center text-sm text-blue-300">
      <Icon className="w-4 h-4 mr-2" />
      <span>{text}</span>
    </div>
  );
}
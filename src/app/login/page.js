"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Sun, Moon, Bike } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) return <div className="w-10 h-10"></div>

  return (
    <button
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
      onClick={toggleTheme}
      title="Toggle Light/Dark Mode"
    >
      {/* Show Moon when dark, Sun when light to reflect current state */}
      {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
    </button>
  )
}

export default function DeliveryBoyLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotEmail, setForgotEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const [forgotError, setForgotError] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotError("")
    setForgotMessage("")
    setForgotLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to request OTP")
      setForgotMessage(data.message || "OTP sent to your registered email")
      setForgotStep(2)
    } catch (err) {
      setForgotError(err.message)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setForgotError("")
    setForgotMessage("")
    setForgotLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to reset password")
      
      setForgotMessage("Password reset successfully! You can now login.")
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotEmail("")
        setOtp("")
        setNewPassword("")
        setForgotMessage("")
      }, 2000)
    } catch (err) {
      setForgotError(err.message)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Invalid credentials. Please try again.")
        return
      }

      localStorage.setItem("delivery_token", data.data.token)
      localStorage.setItem("delivery_user", JSON.stringify(data.data))
      router.push("/") // Redirect to delivery dashboard
    } catch (err) {
      setError("Unable to connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)] font-sans selection:bg-[#E8A359] selection:text-[#14452F]">
      
      {/* Left Side - Brand Showcase (Hidden on mobile) */}
      {/* Premium Light Mode: Soft Pearl/Mesh Gradient, Dark Mode: Deep Forest Gradient */}
      <div className="hidden lg:flex w-[45%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-50 via-white to-orange-50 dark:from-[#1A5C3F] dark:via-[#14452F] dark:to-[#0C291C] flex-col justify-between p-14 relative overflow-hidden transition-colors duration-500 border-r border-gray-200 dark:border-[#E8A359]/20 shadow-[4px_0_24px_rgba(0,0,0,0.03)] dark:shadow-none z-10">
        
        {/* Subtle, elegant geometric pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.1] mix-blend-multiply dark:mix-blend-overlay pointer-events-none transition-opacity duration-500"></div>

        <div className="relative z-20 flex flex-col justify-between h-full w-full">
          <div>
            {/* Logo container: Made into a PERFECT CIRCLE so the JPEG's background looks like a deliberate badge. */}
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden ring-4 ring-white dark:ring-[#14452F] transition-all duration-500">
              <img src="/logo.jpeg" alt="Lalbaug Roti House Logo" className="w-full h-full object-cover scale-[1.05]" />
            </div>
            
            {/* Elegant Serif Font for the Title */}
            <h1 className="text-5xl md:text-[4rem] tracking-tight mb-4 text-[#14452F] dark:text-white leading-[1.05] font-serif transition-colors duration-500 drop-shadow-sm">
              Delivery <br/>
              <span className="text-[#E8A359]">Partner App</span>
            </h1>
            
            <p className="text-[#14452F]/75 dark:text-white/80 text-lg max-w-md leading-relaxed mt-8 font-medium transition-colors duration-500">
              Your route to success. Manage your daily deliveries, track your earnings, and stay connected with Lalbaug Roti House.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[#14452F] dark:text-white/90 text-sm font-bold uppercase bg-white/60 dark:bg-black/20 w-max px-6 py-3.5 rounded-2xl border border-white/40 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-500 backdrop-blur-md">
            <Bike className="w-5 h-5 text-[#E8A359]" />
            Delivery Fleet Portal
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[55%] flex flex-col p-8 sm:p-16 relative bg-[var(--background)] min-h-screen justify-center transition-colors duration-500 z-0">
        
        {/* Theme Toggle Top Right */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8 bg-[var(--card)] border border-[var(--border)] rounded-full shadow-sm p-0.5">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-[420px] mx-auto">
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="flex lg:hidden flex-col items-center text-center mb-10">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-5 shadow-lg overflow-hidden ring-4 ring-white border border-gray-100">
              <img src="/logo.jpeg" alt="Lalbaug Roti House Logo" className="w-full h-full object-cover scale-[1.05]" />
            </div>
            <h1 className="text-3xl font-serif text-[var(--foreground)] tracking-tight">Delivery App</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">Partner Login</h2>
            <p className="text-[var(--muted-foreground)] font-medium text-base">Enter your registered email and password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm p-4 shadow-sm flex items-center font-medium">
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">Email Address</label>
              <input
                type="email"
                placeholder="delivery@lalbaugrotihouse.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full h-14 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:bg-[var(--background)] focus:ring-2 focus:ring-[#14452F] focus:border-transparent transition-all rounded-xl px-5 outline-none shadow-sm text-base hover:border-gray-300 dark:hover:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[var(--foreground)]">Password</label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm font-semibold text-[#E8A359] hover:text-[#c48847] transition-colors">Forgot Password?</button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full h-14 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:bg-[var(--background)] focus:ring-2 focus:ring-[#14452F] focus:border-transparent transition-all rounded-xl px-5 outline-none shadow-sm font-sans tracking-widest text-lg hover:border-gray-300 dark:hover:border-gray-600"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 mt-6 bg-[#14452F] hover:bg-[#0f3423] text-white font-bold text-lg rounded-xl shadow-[0_4px_14px_0_rgba(20,69,47,0.25)] hover:shadow-[0_6px_20px_rgba(20,69,47,0.35)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Login to Deliveries
                  <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </span>
              )}
            </button>
          </form>


        </div>

      </div>

      {/* Forget Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-md rounded-2xl shadow-2xl p-8 relative border border-[var(--border)]">
            <button 
              onClick={() => { setShowForgotModal(false); setForgotStep(1); setForgotMessage(""); setForgotError(""); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">Forgot Password</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-6">
              {forgotStep === 1 ? "Enter your registered email to receive an OTP." : "Enter the OTP sent to your registered email and your new password."}
            </p>

            {forgotError && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm p-3 mb-4 font-medium">
                {forgotError}
              </div>
            )}
            {forgotMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 text-sm p-3 mb-4 font-medium">
                {forgotMessage}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--foreground)] block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[#14452F] focus:border-transparent rounded-xl px-4 outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="w-full h-12 bg-[#14452F] hover:bg-[#0f3423] text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {forgotLoading ? "Requesting..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--foreground)] block mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full h-12 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[#14452F] focus:border-transparent rounded-xl px-4 outline-none tracking-widest text-center text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--foreground)] block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-12 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[#14452F] focus:border-transparent rounded-xl px-4 outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="w-full h-12 bg-[#14452F] hover:bg-[#0f3423] text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

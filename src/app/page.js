"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, MapPin, Phone, CheckCircle2, Navigation, Package, User, Sun, Moon, KeyRound, X, Menu, History, LayoutDashboard, DollarSign, Bike, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import axios from "axios"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <Button variant="ghost" size="icon" className="w-9 h-9"></Button>

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      title={`Current theme: ${theme}. Click to change.`}
    >
      {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-blue-400" />}
    </Button>
  )
}

export default function DeliveryDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [earningsStats, setEarningsStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, orders, history, earnings, profile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Profile Update State
  const [profileForm, setProfileForm] = useState({ name: '', vehicleType: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })

  // Password Change State
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' })
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg] = useState({ type: '', text: '' })

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotOtp, setForgotOtp] = useState("")
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const [forgotError, setForgotError] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, status: null })
  const [otpInput, setOtpInput] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("delivery_token")
    const userData = localStorage.getItem("delivery_user")
    
    if (!token || !userData || userData === "undefined") {
      router.push("/login")
      return
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser)
      setProfileForm({ name: parsedUser.name || '', vehicleType: parsedUser.vehicleType || '' })
    } catch (e) {
      console.error("Failed to parse delivery_user data:", e)
      router.push("/login")
      return
    }
    
    fetchData(token)
  }, [router, activeTab])

  // Listen for socket-triggered refreshes
  useEffect(() => {
    const handleRefresh = () => {
      const token = localStorage.getItem("delivery_token")
      if (token) fetchData(token)
    }
    window.addEventListener("refresh_orders", handleRefresh)
    return () => window.removeEventListener("refresh_orders", handleRefresh)
  }, [activeTab])

  const fetchData = async (token) => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        await fetchDashboard(token);
      } else if (activeTab === 'orders' || activeTab === 'history') {
        await fetchOrders(token);
      } else if (activeTab === 'earnings') {
        await fetchEarnings(token);
      }
    } catch (err) {
      console.error("Fetch data error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async (token) => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/dashboard-stats`, {
      headers: { "Authorization": `Bearer ${token}` }, validateStatus: () => true
    })
    if (res.status === 200 || res.status === 201) {
      const data = res.data
      setDashboardStats(data.data)
    } else if (res.status === 401) handleLogout()
  }

  const fetchEarnings = async (token) => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/earnings`, {
      headers: { "Authorization": `Bearer ${token}` }, validateStatus: () => true
    })
    if (res.status === 200 || res.status === 201) {
      const data = res.data
      setEarningsStats(data.data)
    }
  }

  const fetchOrders = async (token) => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/orders`, {
      headers: { "Authorization": `Bearer ${token}` }, validateStatus: () => true
    })
    if (res.status === 200 || res.status === 201) {
      const data = res.data
      setOrders(data.data || [])
    } else if (res.status === 401) handleLogout()
  }

  const handleUpdateStatus = (orderId, status) => {
    if (status === 'DELIVERED' || status === 'FAILED') {
      setConfirmModal({ isOpen: true, orderId, status });
      setOtpInput(""); // reset otp
    } else {
      executeStatusUpdate(orderId, status);
    }
  }

  const executeStatusUpdate = async (orderId, status) => {
    if (status === 'DELIVERED' && (!otpInput || otpInput.length !== 4)) {
      alert("Please enter a valid 4-digit OTP provided by the customer.");
      return;
    }
    setConfirmModal({ isOpen: false, orderId: null, status: null });
    setUpdatingId(orderId)
    const token = localStorage.getItem("delivery_token")
    try {
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/orders/${orderId}/status`, { status, otp: otpInput }, {
        headers: { 
          "Authorization": `Bearer ${token}`
        }, validateStatus: () => true
      })
      if (res.status === 200 || res.status === 201) {
        fetchOrders(token); // Refresh orders
      } else {
        const errorData = res.data;
        alert(`Failed to update status: ${errorData.message}`);
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileMsg({ type: '', text: '' })
    setProfileLoading(true)
    try {
      const token = localStorage.getItem("delivery_token")
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/profile`, profileForm, {
        headers: {
          "Authorization": `Bearer ${token}`
        }, validateStatus: () => true
      })
      const data = res.data
      if (res.status !== 200 && res.status !== 201) throw new Error(data.message || "Failed to update profile")
      
      setUser(data.data)
      localStorage.setItem("delivery_user", JSON.stringify(data.data))
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("delivery_token")
    localStorage.removeItem("delivery_user")
    router.push("/login")
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPassMsg({ type: '', text: '' })
    if (!passForm.currentPassword || !passForm.newPassword) {
      return setPassMsg({ type: 'error', text: 'Please fill in all fields' })
    }
    setPassLoading(true)
    try {
      const token = localStorage.getItem("delivery_token")
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/change-password`, passForm, {
        headers: {
          "Authorization": `Bearer ${token}`
        }, validateStatus: () => true
      })
      const data = res.data
      if (res.status !== 200 && res.status !== 201) throw new Error(data.message || "Failed to change password")
      
      setPassMsg({ type: 'success', text: 'Password changed successfully!' })
      setPassForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message })
    } finally {
      setPassLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotError("")
    setForgotMessage("")
    setForgotLoading(true)
    
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/forgot-password`, { email: user.email }, { validateStatus: () => true })
      const data = res.data
      if (res.status !== 200 && res.status !== 201) throw new Error(data.message || "Failed to send OTP")
      setForgotMessage(data.message || "OTP sent to your email")
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
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/delivery-boy/reset-password`, { email: user.email, otp: forgotOtp, newPassword: forgotNewPassword }, { validateStatus: () => true })
      const data = res.data
      if (res.status !== 200 && res.status !== 201) throw new Error(data.message || "Failed to reset password")
      
      setForgotMessage("Password reset successfully!")
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotOtp("")
        setForgotNewPassword("")
        setForgotMessage("")
      }, 3000)
    } catch (err) {
      setForgotError(err.message)
    } finally {
      setForgotLoading(false)
    }
  }

  if (loading && !dashboardStats && !orders.length && !earningsStats) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="layout-bg flex min-h-screen p-2 md:p-4 gap-2 md:gap-4 selection:bg-[#E8A359] selection:text-[#14452F] relative">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card)] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                confirmModal.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
                {confirmModal.status === 'DELIVERED' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Confirm {confirmModal.status === 'DELIVERED' ? 'Delivery' : 'Failure'}
              </h3>
              <p className="text-[var(--muted-foreground)] mb-6 text-sm">
                {confirmModal.status === 'DELIVERED' 
                  ? 'Please enter the 4-digit OTP provided by the customer to complete this delivery.' 
                  : 'Are you sure you want to mark this order as FAILED? This action cannot be undone.'}
              </p>

              {confirmModal.status === 'DELIVERED' && (
                <div className="mb-6 w-full">
                  <Input 
                    type="number" 
                    placeholder="Enter 4-digit OTP" 
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.slice(0, 4))}
                    className="text-center text-2xl tracking-[0.5em] h-14 font-bold border-2 focus-visible:ring-emerald-500"
                  />
                </div>
              )}

              <div className="flex gap-3 w-full">
                <Button 
                  onClick={() => setConfirmModal({ isOpen: false, orderId: null, status: null })}
                  variant="outline" 
                  className="flex-1 rounded-xl h-12"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => executeStatusUpdate(confirmModal.orderId, confirmModal.status)}
                  className={`flex-1 rounded-xl h-12 font-bold text-white shadow-md ${
                    confirmModal.status === 'DELIVERED' ? 'bg-[#14452F] hover:bg-[#0C291C]' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Yes, Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar matching Admin Layout */}
      <aside className={`w-[260px] border border-[var(--border)]/50 glass-panel h-[calc(100vh-16px)] md:h-[calc(100vh-32px)] fixed top-2 md:top-4 z-40 rounded-2xl md:rounded-3xl premium-shadow overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'left-2 translate-x-0' : '-translate-x-[150%] md:translate-x-0 left-2 md:left-4'}`}>
        <div className="flex h-16 md:h-20 items-center justify-between px-6 border-b border-[var(--border)]/50">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mr-3 premium-shadow overflow-hidden bg-white shrink-0 ring-2 ring-[var(--primary)]/20">
              <img src="/logo.jpeg" alt="Logo" className="object-cover w-full h-full scale-[1.05]" />
            </div>
            <h1 className="text-lg font-extrabold text-[var(--foreground)] tracking-tight">Delivery</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-4 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mt-2">
          Partner Menu
        </div>

        <nav className="px-3 space-y-1">
          <div 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`relative flex items-center space-x-3 px-4 py-3.5 mb-1 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20' 
                : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="flex-1">Dashboard</span>
          </div>

          <div 
            onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
            className={`relative flex items-center space-x-3 px-4 py-3.5 mb-1 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20' 
                : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]'
            }`}
          >
            <Package className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'orders' ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="flex-1">Assigned Orders</span>
          </div>

          <div 
            onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
            className={`relative flex items-center space-x-3 px-4 py-3.5 mb-1 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20' 
                : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]'
            }`}
          >
            <History className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'history' ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="flex-1">Delivery History</span>
          </div>

          <div 
            onClick={() => { setActiveTab('earnings'); setIsMobileMenuOpen(false); }}
            className={`relative flex items-center space-x-3 px-4 py-3.5 mb-1 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'earnings'
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]'
            }`}
          >
            <DollarSign className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'earnings' ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="flex-1">My Earnings</span>
          </div>
          
          <div 
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className={`relative flex items-center space-x-3 px-4 py-3.5 mb-1 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]'
            }`}
          >
            <User className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'profile' ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="flex-1">My Profile</span>
          </div>
        </nav>
        
        <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-3">
          <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl p-3 text-center">
             <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-1">Status</p>
             <p className="text-sm font-bold text-[var(--foreground)]">Online & Ready</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm border border-red-100 dark:border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-[calc(100vh-16px)] md:min-h-[calc(100vh-32px)] relative z-10 gap-2 md:gap-4 w-full">
        {/* Header */}
        <header className="h-16 md:h-20 border border-[var(--border)]/50 glass-panel flex items-center justify-between px-4 md:px-8 sticky top-2 md:top-4 z-30 transition-all duration-300 rounded-2xl md:rounded-3xl premium-shadow">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-[var(--foreground)] p-1 hover:bg-[var(--border)]/50 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="md:hidden w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden ring-2 ring-[var(--primary)] shrink-0">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover scale-[1.05]" />
            </div>
            <div>
              <h1 className="font-bold text-[var(--foreground)] leading-tight text-lg sm:text-xl capitalize">{activeTab.replace('-', ' ')}</h1>
              {user && activeTab === 'dashboard' && <p className="text-xs text-[var(--muted-foreground)] font-medium hidden sm:block">Welcome back, {user.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-8 mt-4">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && dashboardStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                <Card className="glass-panel premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden relative min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider w-2/3 leading-tight pt-1">Total Assigned</p>
                      <div className="p-3 rounded-2xl bg-blue-100 shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                        <Package className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] drop-shadow-sm">{dashboardStats.totalAssigned}</h3>
                    </div>
                  </div>
                </Card>

                <Card className="glass-panel premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden relative min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider w-2/3 leading-tight pt-1">Pending</p>
                      <div className="p-3 rounded-2xl bg-amber-100 shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                        <Clock className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] drop-shadow-sm">{dashboardStats.pending}</h3>
                    </div>
                  </div>
                </Card>

                <Card className="glass-panel premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden relative min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider w-2/3 leading-tight pt-1">Delivered</p>
                      <div className="p-3 rounded-2xl bg-emerald-100 shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                        <CheckCircle2 className="w-6 h-6 text-[var(--primary)]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] drop-shadow-sm">{dashboardStats.delivered}</h3>
                    </div>
                  </div>
                </Card>

                <Card className="glass-panel premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden relative min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider w-2/3 leading-tight pt-1" title="Today's Deliveries">Today's Deliveries</p>
                      <div className="p-3 rounded-2xl bg-violet-100 shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                        <Bike className="w-6 h-6 text-violet-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] drop-shadow-sm">{dashboardStats.todaysDeliveries}</h3>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions / Getting Started */}
              <div className="glass-panel premium-shadow rounded-3xl border border-[var(--border)] p-6 md:p-8 bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setActiveTab('orders')} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl shadow-md h-12 px-6">
                    View Assigned Orders
                  </Button>
                  <Button onClick={() => setActiveTab('earnings')} variant="outline" className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-xl h-12 px-6">
                    Check Earnings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* EARNINGS TAB */}
          {activeTab === 'earnings' && earningsStats && (
            <div className="space-y-6">
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">My Earnings</h2>
                <p className="text-[var(--muted-foreground)] font-medium">Track your delivery payouts and performance.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="glass-panel premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden relative min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider w-2/3 leading-tight pt-1">Total Earnings</p>
                      <div className="p-3 rounded-2xl bg-emerald-100 shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--foreground)] drop-shadow-sm">₹{earningsStats.totalEarnings}</h3>
                      <p className="text-xs mt-2 text-[var(--muted-foreground)]">Lifetime delivery payouts</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="glass-panel premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden relative min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider w-2/3 leading-tight pt-1">Today's Earnings</p>
                      <div className="p-3 rounded-2xl bg-amber-100 shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                        <Sun className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] drop-shadow-sm">₹{earningsStats.dailyEarnings}</h3>
                      <p className="text-xs mt-2 text-[var(--muted-foreground)]">Calculated from midnight</p>
                    </div>
                  </div>
                </Card>

                <Card className="glass-panel premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden relative min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider w-2/3 leading-tight pt-1">This Week</p>
                      <div className="p-3 rounded-2xl bg-blue-100 shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                        <History className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] drop-shadow-sm">₹{earningsStats.weeklyEarnings}</h3>
                      <p className="text-xs mt-2 text-[var(--muted-foreground)]">Since Sunday</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="glass-panel premium-shadow border border-[var(--border)] rounded-3xl p-8 mt-8 flex items-start gap-4 bg-[var(--primary)]/5">
                 <AlertCircle className="w-6 h-6 text-[var(--primary)] shrink-0" />
                 <div>
                   <h4 className="font-bold text-[var(--foreground)] mb-1">How earnings are calculated</h4>
                   <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                     Earnings are calculated based on the <strong>Delivery Charge</strong> assigned to each order at checkout. 
                     An order is only added to your earnings once it is successfully marked as <strong>DELIVERED</strong>. 
                     Failed or cancelled orders do not contribute to your earnings.
                   </p>
                 </div>
              </div>
            </div>
          )}

          {/* ORDERS & HISTORY TABS */}
          {(activeTab === 'orders' || activeTab === 'history') && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">
                  {activeTab === 'orders' ? 'Assigned Deliveries' : 'Delivery History'}
                </h2>
                <p className="text-[var(--muted-foreground)] font-medium">
                  {activeTab === 'orders' ? 'Orders that are currently active and assigned to you.' : 'Orders you have successfully delivered or failed.'}
                </p>
              </div>

              {(() => {
                const displayedOrders = orders.filter(o => 
                  activeTab === 'orders' ? !['DELIVERED', 'FAILED', 'CANCELLED'].includes(o.orderStatus) : ['DELIVERED', 'FAILED'].includes(o.orderStatus)
                );

                if (displayedOrders.length === 0) {
                  return (
                    <div className="glass-panel rounded-3xl border border-[var(--border)] p-12 text-center flex flex-col items-center justify-center min-h-[40vh]">
                      <div className="w-20 h-20 bg-[var(--muted)] rounded-full flex items-center justify-center mb-6">
                        {activeTab === 'orders' ? (
                          <Package className="w-10 h-10 text-[var(--muted-foreground)] opacity-50" />
                        ) : (
                          <History className="w-10 h-10 text-[var(--muted-foreground)] opacity-50" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                        {activeTab === 'orders' ? 'No Active Deliveries' : 'No Delivery History'}
                      </h3>
                      <p className="text-[var(--muted-foreground)] max-w-sm">
                        {activeTab === 'orders' ? 'You have no pending deliveries assigned to you at the moment. Take a break!' : 'You have not completed any orders yet.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayedOrders.map((order) => (
                      <Card key={order._id} className="glass-panel premium-shadow overflow-hidden flex flex-col border-[var(--border)]">
                        {/* Order Header */}
                      <div className="bg-[var(--sidebar)] border-b border-[var(--border)] p-5 flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">Order ID</span>
                          <span className="text-lg font-bold text-[var(--foreground)]">#{order.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.orderStatus) && (
                            <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                              </span>
                              <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Active</span>
                            </div>
                          )}
                          <Badge className={`shadow-sm ${
                            order.orderStatus === 'DELIVERED' ? 'bg-green-600' :
                            order.orderStatus === 'FAILED' ? 'bg-red-600' :
                            'bg-[#E8A359] hover:bg-[#c48847]'
                          } text-white`}>
                            {order.orderStatus.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-5 flex-1 flex flex-col gap-5">
                        {/* Customer Info */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 bg-[var(--primary)]/10 p-2 rounded-full text-[var(--primary)] shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--foreground)] text-sm">{order.address?.customerName || 'Customer'}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Amount to collect: <strong className="text-[var(--primary)]">₹{order.totalAmount}</strong> ({order.paymentStatus})</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 bg-blue-500/10 p-2 rounded-full text-blue-600 shrink-0">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                              <p className="font-semibold text-[var(--foreground)] text-sm">{order.address?.phone || 'N/A'}</p>
                              <a href={`tel:${order.address?.phone}`} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full shadow-sm transition-colors">
                                Call
                              </a>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 bg-red-500/10 p-2 rounded-full text-red-600 shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--foreground)] text-sm leading-relaxed break-words">{[order.address?.addressLine1, order.address?.addressLine2, order.address?.city, order.address?.pincode].filter(Boolean).join(', ') || 'Address not provided'}</p>
                              {order.address?.landmark && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">Landmark: {order.address.landmark}</p>
                              )}
                              {order.address?.latitude && order.address?.longitude && (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${order.address.latitude},${order.address.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline mt-2 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md"
                                >
                                  <Navigation className="w-3 h-3" /> Get Directions
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Items Summary */}
                        <div className="mt-auto pt-4 border-t border-[var(--border)] border-dashed">
                          <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Order Items</p>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="text-sm pb-1.5 border-b border-[var(--border)]/30 last:border-0 last:pb-0">
                                <div className="flex justify-between">
                                  <span className="text-[var(--foreground)] font-medium"><span className="text-[var(--muted-foreground)] font-bold">{item.quantity}x</span> {item.name || item.product?.name || 'Item'}</span>
                                </div>
                                {item.addons && item.addons.length > 0 && (
                                  <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 pl-5">
                                    + {item.addons.map(a => `${a.name} (x${a.quantity || 1})`).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>

                      {/* Footer Actions / Progressive Buttons */}
                      {activeTab === 'orders' && (
                        <div className="p-4 border-t border-[var(--border)] bg-black/5 dark:bg-white/5 space-y-3">
                          {order.orderStatus === 'ASSIGNED' && (
                            <Button 
                              onClick={() => handleUpdateStatus(order._id, 'PICKED_UP')}
                              disabled={updatingId === order._id}
                              className="w-full bg-[#E8A359] hover:bg-[#c48847] text-white font-bold h-12 shadow-md hover:shadow-lg transition-all rounded-xl text-md"
                            >
                              {updatingId === order._id ? "Updating..." : "Accept & Pick Up Order"}
                            </Button>
                          )}

                          {order.orderStatus === 'PICKED_UP' && (
                            <Button 
                              onClick={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')}
                              disabled={updatingId === order._id}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md hover:shadow-lg transition-all rounded-xl text-md"
                            >
                              {updatingId === order._id ? "Updating..." : "Start Delivery (Out for Delivery)"}
                            </Button>
                          )}

                          {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                                disabled={updatingId === order._id}
                                className="flex-1 bg-[#14452F] hover:bg-[#0C291C] text-white font-bold h-12 shadow-md hover:shadow-lg transition-all rounded-xl"
                              >
                                {updatingId === order._id ? "Updating..." : "Mark Delivered"}
                              </Button>
                              <Button 
                                onClick={() => handleUpdateStatus(order._id, 'FAILED')}
                                disabled={updatingId === order._id}
                                variant="destructive"
                                className="h-12 shadow-md rounded-xl px-4"
                                title="Mark as Failed"
                              >
                                Fail
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              );
              })()}
            </>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">My Profile</h2>
                <p className="text-[var(--muted-foreground)] font-medium">Manage your personal details and account settings.</p>
              </div>
              
              {user && (
                <div className="glass-panel premium-shadow rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] relative">
                    <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-1 border-4 border-white dark:border-[var(--card)]">
                       <div className="w-full h-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-4xl font-bold rounded-xl">
                         {user.name?.charAt(0).toUpperCase()}
                       </div>
                    </div>
                  </div>
                  
                  <div className="pt-16 p-8">
                    
                    {/* Update Profile Form */}
                    <div className="mb-8">
                       <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-[var(--primary)]" />
                        Personal Information
                       </h3>
                       
                       {profileMsg.text && (
                          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border ${
                            profileMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-900/50'
                          }`}>
                            {profileMsg.text}
                          </div>
                       )}

                       <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[var(--muted-foreground)]">Full Name</label>
                            <Input 
                              type="text" 
                              className="bg-white dark:bg-[var(--sidebar)] border-[var(--border)] rounded-xl h-12"
                              value={profileForm.name}
                              onChange={e => setProfileForm(p => ({...p, name: e.target.value}))}
                              required
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[var(--muted-foreground)]">Vehicle Details</label>
                            <Input 
                              type="text" 
                              className="bg-white dark:bg-[var(--sidebar)] border-[var(--border)] rounded-xl h-12"
                              value={profileForm.vehicleType}
                              onChange={e => setProfileForm(p => ({...p, vehicleType: e.target.value}))}
                              placeholder="e.g. Honda Activa"
                            />
                         </div>
                         <div className="space-y-1.5 opacity-60">
                            <label className="text-sm font-bold text-[var(--muted-foreground)]">Email Address (Cannot change)</label>
                            <Input type="email" className="bg-white dark:bg-[var(--sidebar)] border-[var(--border)] rounded-xl h-12" value={user.email} disabled />
                         </div>
                         <div className="space-y-1.5 opacity-60">
                            <label className="text-sm font-bold text-[var(--muted-foreground)]">Phone Number (Cannot change)</label>
                            <Input type="text" className="bg-white dark:bg-[var(--sidebar)] border-[var(--border)] rounded-xl h-12" value={user.phone} disabled />
                         </div>
                         <div className="md:col-span-2 mt-2">
                           <Button type="submit" disabled={profileLoading} className="bg-[#14452F] hover:bg-[#0C291C] text-white rounded-xl shadow-md h-12 px-8">
                             {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                           </Button>
                         </div>
                       </form>
                    </div>
                  </div>
                  
                  {/* Change Password Section */}
                  <div className="border-t border-[var(--border)] bg-black/5 dark:bg-white/5 p-8">
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-[var(--primary)]" />
                      Change Password
                    </h3>
                    
                    {passMsg.text && (
                      <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border ${
                        passMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-900/50'
                      }`}>
                        {passMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[var(--muted-foreground)]">Current Password</label>
                        <Input 
                          type="password" 
                          className="bg-white dark:bg-[var(--sidebar)] border-[var(--border)] rounded-xl"
                          placeholder="••••••••"
                          value={passForm.currentPassword}
                          onChange={e => setPassForm(p => ({...p, currentPassword: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[var(--muted-foreground)]">New Password</label>
                        <Input 
                          type="password" 
                          className="bg-white dark:bg-[var(--sidebar)] border-[var(--border)] rounded-xl"
                          placeholder="••••••••"
                          value={passForm.newPassword}
                          onChange={e => setPassForm(p => ({...p, newPassword: e.target.value}))}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={passLoading}
                        className="w-full bg-[#E8A359] hover:bg-[#c48847] text-white rounded-xl shadow-md mt-2"
                      >
                        {passLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                      <div className="mt-4 flex justify-end">
                        <button type="button" onClick={() => {
                          setShowForgotModal(true);
                          setTimeout(() => document.getElementById('forgot-password-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                        }} className="text-sm text-[var(--primary)] font-bold hover:underline">
                          Forget Password?
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Forgot Password Flow */}
      {showForgotModal && (
        <Card className="glass-panel premium-shadow overflow-hidden mt-8 bg-[#FAF8F5] border-[#EAE5D9]" id="forgot-password-section">
          <CardHeader className="border-b border-[#EAE5D9] bg-[#14452F]">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white tracking-widest uppercase text-xl font-bold font-serif">Reset Password</CardTitle>
                <CardDescription className="text-white/80 mt-2 font-medium">
                  {forgotStep === 1 ? "We will send an OTP to your registered email." : "Enter the OTP sent to your email and your new password."}
                </CardDescription>
              </div>
              <button 
                onClick={() => { setShowForgotModal(false); setForgotStep(1); setForgotMessage(""); setForgotError(""); }}
                className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {forgotError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-4 flex items-center border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2" />
                {forgotError}
              </div>
            )}
            {forgotMessage && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm font-medium mb-4 flex items-center border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mr-2" />
                {forgotMessage}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#73706A] uppercase tracking-wider mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={user?.email || "delivery@lalbaugrotihouse.com"}
                    disabled
                    className="bg-[#EAE5D9]/50 border-[#EAE5D9] text-[#2C3E35] focus-visible:ring-[#16A34A]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#14452F] hover:bg-[#0C291C] text-white rounded-xl h-12 shadow-md mt-4 text-sm tracking-widest font-bold uppercase"
                >
                  {forgotLoading ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#73706A] uppercase tracking-wider mb-2 block">OTP Code</label>
                  <Input
                    type="text"
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="bg-white border-[#EAE5D9] text-[#2C3E35] focus-visible:ring-[#16A34A] tracking-widest"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#73706A] uppercase tracking-wider mb-2 block">New Password</label>
                  <Input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white border-[#EAE5D9] text-[#2C3E35] focus-visible:ring-[#16A34A] tracking-widest"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#14452F] hover:bg-[#0C291C] text-white rounded-xl h-12 shadow-md mt-4 text-sm tracking-widest font-bold uppercase"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

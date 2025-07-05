"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Calculator, Truck, Search, RotateCcw, Info, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { calculateDistance, reverseGeocode, geocodeAddress } from "@/lib/utils"

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import("@/components/map"), { ssr: false })

type LocationState = "selecting-source" | "selecting-destination" | "completed"

interface User {
  id: number
  phone_number: string
}

export default function RequestPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  const [sourceLocation, setSourceLocation] = useState<[number, number] | null>(null)
  const [destinationLocation, setDestinationLocation] = useState<[number, number] | null>(null)
  const [sourceAddress, setSourceAddress] = useState("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [searchAddress, setSearchAddress] = useState("")
  const [weight, setWeight] = useState("")
  const [distance, setDistance] = useState(0)
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Location selection state
  const [locationState, setLocationState] = useState<LocationState>("selecting-source")

  // Tehran coordinates as default center
  const mapCenter: [number, number] = [35.6892, 51.389]

  // Check for existing session on component mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()

      if (data.authenticated) {
        setUser(data.user)
        setPhoneNumber(data.user.phone_number)
        setIsVerified(true)
        setStep(3) // Skip to freight request form
        console.log("✅ User session found:", data.user)
      } else {
        console.log("❌ No valid session found")
      }
    } catch (error) {
      console.error("Session check error:", error)
    } finally {
      setIsCheckingSession(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setIsVerified(false)
      setStep(1)
      setPhoneNumber("")
      setOtpCode("")
      console.log("✅ User logged out")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Get current instruction based on state
  const getMapInstructions = () => {
    switch (locationState) {
      case "selecting-source":
        return "روی نقشه کلیک کنید تا مبدا را انتخاب کنید"
      case "selecting-destination":
        return "حالا روی نقشه کلیک کنید تا مقصد را انتخاب کنید"
      case "completed":
        return "مبدا و مقصد انتخاب شدند. برای تغییر روی نشانگرها کلیک کنید"
      default:
        return "روی نقشه کلیک کنید"
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    console.log(`🗺️ Map clicked: ${lat}, ${lng}`)
    console.log(`📍 Current state: ${locationState}`)

    if (locationState === "selecting-source") {
      console.log("✅ Setting source location")
      setSourceLocation([lat, lng])
      const address = await reverseGeocode(lat, lng)
      setSourceAddress(address)
      setLocationState("selecting-destination")
      console.log("🔄 State changed to selecting-destination")
    } else if (locationState === "selecting-destination") {
      console.log("✅ Setting destination location")
      setDestinationLocation([lat, lng])
      const address = await reverseGeocode(lat, lng)
      setDestinationAddress(address)
      setLocationState("completed")
      console.log("🔄 State changed to completed")
    } else {
      console.log("❌ Map click ignored - state is completed")
    }
  }

  const handleSourceMarkerClick = () => {
    console.log("🟢 Source marker clicked - removing source")
    setSourceLocation(null)
    setSourceAddress("")
    if (destinationLocation) {
      setLocationState("selecting-destination")
    } else {
      setLocationState("selecting-source")
    }
  }

  const handleDestinationMarkerClick = () => {
    console.log("🔴 Destination marker clicked - removing destination")
    setDestinationLocation(null)
    setDestinationAddress("")
    setLocationState("selecting-destination")
  }

  const searchLocation = async () => {
    if (!searchAddress.trim()) return

    setIsSearching(true)
    try {
      const result = await geocodeAddress(searchAddress)
      if (result) {
        if (locationState === "selecting-source") {
          setSourceLocation([result.lat, result.lng])
          setSourceAddress(result.display_name)
          setLocationState("selecting-destination")
        } else if (locationState === "selecting-destination") {
          setDestinationLocation([result.lat, result.lng])
          setDestinationAddress(result.display_name)
          setLocationState("completed")
        }
        setSearchAddress("")
      } else {
        alert("آدرس پیدا نشد")
      }
    } catch (error) {
      alert("خطا در جستجو")
    } finally {
      setIsSearching(false)
    }
  }

  // Calculate distance and price when both locations are set
  useEffect(() => {
    if (sourceLocation && destinationLocation && weight) {
      const dist = calculateDistance(
        sourceLocation[0],
        sourceLocation[1],
        destinationLocation[0],
        destinationLocation[1],
      )
      setDistance(dist)

      // Updated pricing formula:
      // Base price: 5,000 Toman
      // Distance: 10,000 Toman per km
      // Weight: 400 Toman per kg
      const weightNum = Number.parseFloat(weight) || 0
      const basePrice = 5000
      const distancePrice = dist * 10000
      const weightPrice = weightNum * 400
      const totalPrice = basePrice + distancePrice + weightPrice

      setCalculatedPrice(totalPrice)
    }
  }, [sourceLocation, destinationLocation, weight])

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      alert("لطفا شماره تلفن معتبر وارد کنید")
      return
    }

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`کد تایید به شماره ${phoneNumber} ارسال شد`)
        setStep(2)
      } else {
        alert(data.error || "خطا در ارسال کد تایید")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      alert("خطا در ارسال کد تایید")
    }
  }

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 4) {
      alert("لطفا کد تایید 4 رقمی را وارد کنید")
      return
    }

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp_code: otpCode.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setIsVerified(true)
        setStep(3)
        console.log("User verified and session created:", data.user)
      } else {
        alert(data.error || "کد تایید اشتباه است")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      alert("خطا در تایید کد")
    }
  }

  const submitRequest = async () => {
    if (!sourceLocation || !destinationLocation || !weight) {
      alert("لطفا تمام فیلدها را پر کنید")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/freight-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          source_address: sourceAddress,
          source_lat: sourceLocation[0],
          source_lng: sourceLocation[1],
          destination_address: destinationAddress,
          destination_lat: destinationLocation[0],
          destination_lng: destinationLocation[1],
          distance_km: distance,
          weight_kg: Number.parseFloat(weight),
          calculated_price: calculatedPrice,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        throw new Error("Failed to submit request")
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      alert("خطا در ثبت درخواست")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetMap = () => {
    console.log("🔄 Resetting map")
    setSourceLocation(null)
    setDestinationLocation(null)
    setSourceAddress("")
    setDestinationAddress("")
    setDistance(0)
    setCalculatedPrice(0)
    setLocationState("selecting-source")
  }

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p>در حال بررسی وضعیت ورود...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">درخواست ثبت شد</CardTitle>
            <CardDescription>درخواست حمل بار شما با موفقیت ثبت شد. به زودی با شما تماس خواهیم گرفت.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>مسافت:</span>
                <span>{distance.toFixed(1)} کیلومتر</span>
              </div>
              <div className="flex justify-between">
                <span>وزن:</span>
                <span>{weight} کیلوگرم</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>قیمت کل:</span>
                <span>{calculatedPrice.toLocaleString()} تومان</span>
              </div>
            </div>
            <Link href="/" className="w-full mt-4">
              <Button className="w-full">بازگشت به صفحه اصلی</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">بسبار</h1>
          </Link>
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">درخواست حمل بار</h2>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.phone_number}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Step 1: Phone Number */}
        {step === 1 && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>ورود شماره تلفن</CardTitle>
              <CardDescription>برای ثبت درخواست، شماره تلفن خود را وارد کنید</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">شماره تلفن</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="ltr text-left"
                />
              </div>
              <Button onClick={sendOTP} className="w-full" disabled={!phoneNumber || phoneNumber.length < 11}>
                ارسال کد تایید
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>تایید شماره تلفن</CardTitle>
              <CardDescription>کد تایید ارسال شده به شماره {phoneNumber} را وارد کنید</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="otp">کد تایید</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="1234"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="ltr text-center text-2xl tracking-widest"
                  maxLength={4}
                />
              </div>
              <Button onClick={verifyOTP} className="w-full" disabled={otpCode.length !== 4}>
                تایید
              </Button>
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                تغییر شماره تلفن
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Freight Request Form */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  انتخاب مسیر
                </CardTitle>
                <CardDescription>
                  <span className={locationState === "selecting-destination" ? "text-red-600 font-semibold" : ""}>
                    {getMapInstructions()}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Status indicator */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${sourceLocation ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <span className="text-sm">مبدا</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${destinationLocation ? "bg-red-500" : "bg-gray-300"}`}
                      ></div>
                      <span className="text-sm">مقصد</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      وضعیت:{" "}
                      {locationState === "selecting-source"
                        ? "انتخاب مبدا"
                        : locationState === "selecting-destination"
                          ? "انتخاب مقصد"
                          : "تکمیل شده"}
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">راهنمای استفاده:</p>
                      <ul className="space-y-1">
                        <li>• کلیک اول: انتخاب مبدا (نشانگر سبز A)</li>
                        <li>• کلیک دوم: انتخاب مقصد (نشانگر قرمز B)</li>
                        <li>• برای تغییر هر نقطه، روی نشانگر آن کلیک کنید</li>
                        <li>• می‌توانید از جستجوی آدرس نیز استفاده کنید</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Address Search */}
                <div className="mb-4 flex gap-2">
                  <Input
                    placeholder={
                      locationState === "selecting-source"
                        ? "جستجوی آدرس مبدا..."
                        : locationState === "selecting-destination"
                          ? "جستجوی آدرس مقصد..."
                          : "جستجوی آدرس..."
                    }
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchLocation()}
                  />
                  <Button onClick={searchLocation} disabled={isSearching} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <Map
                  center={mapCenter}
                  zoom={10}
                  onMapClick={handleMapClick}
                  sourceLocation={sourceLocation}
                  destinationLocation={destinationLocation}
                  onSourceMarkerClick={handleSourceMarkerClick}
                  onDestinationMarkerClick={handleDestinationMarkerClick}
                  className="h-96 w-full rounded-lg border"
                />

                <div className="mt-4 space-y-2">
                  {sourceAddress && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded border border-green-200">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <span className="flex-1">مبدا: {sourceAddress}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSourceMarkerClick}
                        className="h-6 px-2 text-green-700 hover:text-green-900"
                      >
                        تغییر
                      </Button>
                    </div>
                  )}
                  {destinationAddress && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-red-50 rounded border border-red-200">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      <span className="flex-1">مقصد: {destinationAddress}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDestinationMarkerClick}
                        className="h-6 px-2 text-red-700 hover:text-red-900"
                      >
                        تغییر
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={resetMap}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <RotateCcw className="h-4 w-4" />
                    پاک کردن نقشه
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  مشخصات بار و محاسبه قیمت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="weight">وزن بار (کیلوگرم)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="100"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="ltr"
                  />
                </div>

                {distance > 0 && weight && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold text-blue-900">محاسبه قیمت:</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between py-1">
                        <span>مسافت:</span>
                        <span className="font-medium">{distance.toFixed(1)} کیلومتر</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>وزن بار:</span>
                        <span className="font-medium">{weight} کیلوگرم</span>
                      </div>
                      <hr className="border-blue-200" />
                      <div className="flex justify-between py-1">
                        <span>هزینه پایه:</span>
                        <span>{(5000).toLocaleString()} تومان</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>هزینه مسافت ({(10000).toLocaleString()} تومان × کیلومتر):</span>
                        <span>{(distance * 10000).toLocaleString()} تومان</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>هزینه وزن ({(400).toLocaleString()} تومان × کیلوگرم):</span>
                        <span>{(Number.parseFloat(weight) * 400).toLocaleString()} تومان</span>
                      </div>
                      <hr className="border-blue-300" />
                      <div className="flex justify-between font-bold text-lg py-2 text-blue-900">
                        <span>قیمت کل:</span>
                        <span>{calculatedPrice.toLocaleString()} تومان</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={submitRequest}
                  className="w-full"
                  disabled={!sourceLocation || !destinationLocation || !weight || isSubmitting}
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت درخواست"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

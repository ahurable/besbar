"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Truck, Eye, Phone, MapPin, Package, DollarSign } from "lucide-react"
import Link from "next/link"
import type { FreightRequest } from "@/lib/database"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [requests, setRequests] = useState<FreightRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<FreightRequest | null>(null)

  const login = async () => {
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true)
      loadRequests()
    } else {
      alert("نام کاربری یا رمز عبور اشتباه است")
    }
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/freight-requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error("Error loading requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/freight-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        loadRequests()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">در انتظار</Badge>
      case "confirmed":
        return <Badge variant="default">تایید شده</Badge>
      case "completed":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            تکمیل شده
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">لغو شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>پنل مدیریت</CardTitle>
            <CardDescription>برای ورود به پنل مدیریت، نام کاربری و رمز عبور خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">نام کاربری</Label>
              <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">رمز عبور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={login} className="w-full">
              ورود
            </Button>
            <Link href="/" className="block text-center">
              <Button variant="outline" className="w-full bg-transparent">
                بازگشت به صفحه اصلی
              </Button>
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
            <Link href="/admin/otp-logs">
              <Button variant="outline" size="sm">
                لاگ OTP
              </Button>
            </Link>
            <span className="text-sm text-gray-600">مدیر: {username}</span>
            <Button variant="outline" size="sm" onClick={() => setIsAuthenticated(false)}>
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">درخواست‌های حمل بار</h2>
          <Button onClick={loadRequests} disabled={loading}>
            {loading ? "در حال بارگذاری..." : "بروزرسانی"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">کل درخواست‌ها</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">در انتظار</p>
                  <p className="text-2xl font-bold">{requests.filter((r) => r.status === "pending").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">تکمیل شده</p>
                  <p className="text-2xl font-bold">{requests.filter((r) => r.status === "completed").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">کل درآمد</p>
                  <p className="text-2xl font-bold">
                    {requests
                      .filter((r) => r.status === "completed")
                      .reduce((sum, r) => sum + r.calculated_price, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست درخواست‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>شماره تلفن</TableHead>
                  <TableHead>مسیر</TableHead>
                  <TableHead>مسافت</TableHead>
                  <TableHead>وزن</TableHead>
                  <TableHead>قیمت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{new Date(request.created_at).toLocaleDateString("fa-IR")}</TableCell>
                    <TableCell className="ltr">{request.phone_number}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {request.source_address} → {request.destination_address}
                      </div>
                    </TableCell>
                    <TableCell>{request.distance_km.toFixed(1)} کم</TableCell>
                    <TableCell>{request.weight_kg} کگ</TableCell>
                    <TableCell>{request.calculated_price.toLocaleString()} ت</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === "pending" && (
                          <Button size="sm" onClick={() => updateStatus(request.id, "confirmed")}>
                            تایید
                          </Button>
                        )}
                        {request.status === "confirmed" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, "completed")}>
                            تکمیل
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>جزئیات درخواست</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                  className="absolute top-4 left-4"
                >
                  بستن
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>شماره تلفن</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4" />
                      <span className="ltr">{selectedRequest.phone_number}</span>
                    </div>
                  </div>
                  <div>
                    <Label>تاریخ ثبت</Label>
                    <p className="mt-1">{new Date(selectedRequest.created_at).toLocaleString("fa-IR")}</p>
                  </div>
                </div>

                <div>
                  <Label>مبدا</Label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 mt-1 text-green-600" />
                    <span>{selectedRequest.source_address}</span>
                  </div>
                </div>

                <div>
                  <Label>مقصد</Label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 mt-1 text-red-600" />
                    <span>{selectedRequest.destination_address}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>مسافت</Label>
                    <p className="mt-1 font-semibold">{selectedRequest.distance_km.toFixed(1)} کیلومتر</p>
                  </div>
                  <div>
                    <Label>وزن</Label>
                    <p className="mt-1 font-semibold">{selectedRequest.weight_kg} کیلوگرم</p>
                  </div>
                  <div>
                    <Label>قیمت کل</Label>
                    <p className="mt-1 font-semibold text-lg">
                      {selectedRequest.calculated_price.toLocaleString()} تومان
                    </p>
                  </div>
                </div>

                <div>
                  <Label>وضعیت</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedRequest.status === "pending" && (
                    <>
                      <Button
                        onClick={() => {
                          updateStatus(selectedRequest.id, "confirmed")
                          setSelectedRequest(null)
                        }}
                      >
                        تایید درخواست
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          updateStatus(selectedRequest.id, "cancelled")
                          setSelectedRequest(null)
                        }}
                      >
                        لغو درخواست
                      </Button>
                    </>
                  )}
                  {selectedRequest.status === "confirmed" && (
                    <Button
                      onClick={() => {
                        updateStatus(selectedRequest.id, "completed")
                        setSelectedRequest(null)
                      }}
                    >
                      تکمیل درخواست
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

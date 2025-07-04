"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Truck, Phone, Clock, CheckCircle, XCircle, Send } from "lucide-react"
import Link from "next/link"

interface OTPLog {
  id: number
  phone_number: string
  otp_code: string
  sent_at: string
  verified_at?: string
  status: string
}

export default function OTPLogsPage() {
  const [logs, setLogs] = useState<OTPLog[]>([])
  const [loading, setLoading] = useState(false)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/otp-logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Error loading OTP logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Send className="h-3 w-3" />
            ارسال شده
          </Badge>
        )
      case "verified":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            تایید شده
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            ناموفق
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">بارچی - لاگ OTP</h1>
          </Link>
          <Link href="/admin">
            <Button variant="outline">بازگشت به پنل مدیریت</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">گزارش کدهای تایید</h2>
          <Button onClick={loadLogs} disabled={loading}>
            {loading ? "در حال بارگذاری..." : "بروزرسانی"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">کل ارسال‌ها</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">تایید شده</p>
                  <p className="text-2xl font-bold">{logs.filter((l) => l.status === "verified").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">در انتظار</p>
                  <p className="text-2xl font-bold">{logs.filter((l) => l.status === "sent").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">ناموفق</p>
                  <p className="text-2xl font-bold">{logs.filter((l) => l.status === "failed").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OTP Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست کدهای تایید</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره تلفن</TableHead>
                  <TableHead>کد OTP</TableHead>
                  <TableHead>زمان ارسال</TableHead>
                  <TableHead>زمان تایید</TableHead>
                  <TableHead>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="ltr">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {log.phone_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-lg font-mono">{log.otp_code}</code>
                    </TableCell>
                    <TableCell>{new Date(log.sent_at).toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{log.verified_at ? new Date(log.verified_at).toLocaleString("fa-IR") : "-"}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

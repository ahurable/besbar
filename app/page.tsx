import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, MapPin, Calculator, Clock, Phone } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">بسبار</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/request" className="text-gray-600 hover:text-blue-600">
              درخواست حمل بار
            </Link>
            {/* <Link href="/admin" className="text-gray-600 hover:text-blue-600">
              پنل مدیریت
            </Link> */}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">حمل و نقل بار با بهترین قیمت</h2>
        <h1>آژانس هوشمند باربری بسبار</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          با سرویس آنلاین ما، بارتان را با کمترین هزینه و بیشترین سرعت به مقصد برسانید
        </p>
        <Link href="/request">
          <Button size="lg" className="text-lg px-8 py-3">
            درخواست حمل بار
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">چرا بسبار؟</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader className="text-center">
              <Calculator className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>محاسبه دقیق قیمت</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                قیمت حمل بار بر اساس مسافت و وزن بار به صورت دقیق محاسبه می‌شود
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>انتخاب مسیر روی نقشه</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                مبدا و مقصد خود را به راحتی روی نقشه انتخاب کنید
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>سرویس ۲۴ ساعته</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                در تمام ساعات شبانه روز آماده ارائه خدمات به شما هستیم
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">نحوه کار</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                ۱
              </div>
              <h4 className="font-semibold mb-2">ثبت شماره تلفن</h4>
              <p className="text-gray-600">شماره تلفن خود را وارد کنید</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                ۲
              </div>
              <h4 className="font-semibold mb-2">انتخاب مسیر</h4>
              <p className="text-gray-600">مبدا و مقصد را روی نقشه مشخص کنید</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                ۳
              </div>
              <h4 className="font-semibold mb-2">وزن بار</h4>
              <p className="text-gray-600">وزن بار خود را مشخص کنید</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                ۴
              </div>
              <h4 className="font-semibold mb-2">دریافت قیمت</h4>
              <p className="text-gray-600">قیمت نهایی را مشاهده کنید</p>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="mt-12 max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Calculator className="h-5 w-5" />
                  نحوه محاسبه قیمت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>هزینه پایه:</span>
                    <span className="font-semibold">۵,۰۰۰ تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه هر کیلومتر:</span>
                    <span className="font-semibold">۸۰۰ تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه هر کیلوگرم:</span>
                    <span className="font-semibold">۲۰۰ تومان</span>
                  </div>
                  <hr />
                  <div className="text-center text-gray-600 text-xs">
                    مثال: حمل ۱۰۰ کیلوگرم بار در مسافت ۲۰ کیلومتری = ۵,۰۰۰ + (۲۰ × ۸۰۰) + (۱۰۰ × ۲۰۰) = ۴۱,۰۰۰ تومان
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl font-bold mb-8">تماس با ما</h3>
        <div className="flex justify-center items-center gap-2 text-xl">
          <Phone className="h-6 w-6 text-blue-600" />
          <span className="ltr">0990 339 2645</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="h-6 w-6" />
            <span className="text-xl font-bold">بسبار</span>
          </div>
          <p className="text-gray-400">© ۱۴۰۳ بسبار. تمامی حقوق محفوظ است.</p>
        </div>
      </footer>
    </div>
  )
}

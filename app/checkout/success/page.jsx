import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default async function CheckoutSuccessPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout/success")
  }

  const orderId = searchParams?.orderId
  if (!orderId) {
    notFound()
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { items: { include: { product: true, variant: true } } },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-background border border-border rounded-xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 text-green-700 p-2">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Order placed</h1>
            <p className="text-sm text-muted-foreground">
              Order #{order.id.slice(-6).toUpperCase()} is in pending payment.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items</span>
            <span>{order.items.reduce((sum, item) => sum + item.qty, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatMoney(order.totalCents / 100)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-semibold capitalize">{order.status.replace(/_/g, " ").toLowerCase()}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          You will receive payment instructions soon. You can track this order from your account.
        </p>

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href={`/account/orders/${order.id}`}>View Order</Link>
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

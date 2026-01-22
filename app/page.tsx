import { TransactionTable } from "@/components/transaction-table"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Image src="/images/vonamawu-logo.png" alt="VONAMAWU Logo" width={70} height={70} />
          <h1 className="text-2xl font-bold tracking-tight">Fund Management</h1>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </Link>
      </div>
      <TransactionTable />
    </main>
  )
}

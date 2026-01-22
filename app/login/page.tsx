import { LoginForm } from "@/components/login-form"
import { PageHeader } from "@/components/page-header"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center py-12 px-4 md:px-6 bg-white">
      <div className="container relative z-10">
        <div className="flex flex-col items-center justify-center mb-8">
          <Image src="/images/vonamawu-logo.png" alt="VONAMAWU Logo" width={180} height={180} className="mb-6" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Fund Management</h1>
          <p className="text-gray-500 mt-2">Powered by VONAMAWU</p>
        </div>

        <div className="w-full max-w-md mx-auto space-y-6 bg-white p-8 rounded-xl border border-gray-200 shadow-xl">
          <PageHeader title="Bienvenue" description="Connectez-vous pour continuer" />
          <LoginForm />
        </div>
      </div>
    </main>
  )
}

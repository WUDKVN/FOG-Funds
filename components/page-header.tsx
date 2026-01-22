interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
      {description && <p className="text-gray-500 mt-2">{description}</p>}
    </div>
  )
}

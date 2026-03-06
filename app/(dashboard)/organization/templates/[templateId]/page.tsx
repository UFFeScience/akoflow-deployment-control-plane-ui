import { TemplateDetail } from "@/components/templates/template-detail"

export default async function TemplateDetailPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  return <TemplateDetail templateId={templateId} />
}

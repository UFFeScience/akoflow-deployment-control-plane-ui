import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { BasicInfo } from "./types"

interface Props {
  info: BasicInfo
  setInfo: React.Dispatch<React.SetStateAction<BasicInfo>>
  setName: (n: string) => void
}

export function Step1BasicInfo({ info, setInfo, setName }: Props) {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">Configure the template's metadata and runtime environment.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Name <span className="text-destructive">*</span></Label>
          <Input value={info.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NVFlare GKE Template" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Slug <span className="text-destructive">*</span></Label>
          <Input value={info.slug} onChange={(e) => setInfo((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} placeholder="e.g. nvflare-gke" className="font-mono" />
          <p className="text-xs text-muted-foreground">Used as identifier in APIs</p>
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label>Description</Label>
          <Textarea value={info.description} onChange={(e) => setInfo((p) => ({ ...p, description: e.target.value }))} placeholder="What does this template do?" rows={3} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>First Version <span className="text-destructive">*</span></Label>
          <Input value={info.first_version} onChange={(e) => setInfo((p) => ({ ...p, first_version: e.target.value }))} placeholder="1.0.0" className="font-mono" />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <Checkbox id="is_public" checked={info.is_public} onCheckedChange={(v) => setInfo((p) => ({ ...p, is_public: !!v }))} />
          <Label htmlFor="is_public" className="cursor-pointer">
            Make this template publicly accessible
            <span className="block text-xs text-muted-foreground font-normal">Other organizations can use this template</span>
          </Label>
        </div>
      </div>
    </div>
  )
}

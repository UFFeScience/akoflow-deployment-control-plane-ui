import { TableCell, TableRow } from "@/components/ui/table"
import { InstanceCellRenderers } from "./instance-cell-renderers"

type InstanceRowProps = {
  row: any
}

export function InstanceRow({ row }: InstanceRowProps) {
  const r = InstanceCellRenderers

  return (
    <TableRow key={row.id} className="h-9">
      <TableCell>{r.instanceLabel(row)}</TableCell>
      <TableCell>{r.clusterName(row)}</TableCell>
      <TableCell>{r.role(row)}</TableCell>
      <TableCell>{r.provider(row)}</TableCell>
      <TableCell>{r.region(row)}</TableCell>
      <TableCell>{r.status(row)}</TableCell>
      <TableCell>{r.health(row)}</TableCell>
      <TableCell>{r.publicIp(row)}</TableCell>
      <TableCell>{r.privateIp(row)}</TableCell>
    </TableRow>
  )
}

export function GraphLegend() {
  const items = [
    { color: "bg-green-500",  label: "Running" },
    { color: "bg-yellow-500", label: "Pending" },
    { color: "bg-gray-500",   label: "Stopped" },
    { color: "bg-red-500",    label: "Failed"  },
  ]
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-xs">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${color}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

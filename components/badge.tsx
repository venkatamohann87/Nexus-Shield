export function Badge({ value }: { value: string }) { return <span className={`badge ${value.toLowerCase().replace(/[^a-z]+/g, "_")}`}>{value.replaceAll("_", " ")}</span>; }

export default function LabValue({ value }: { value: string | number }) {
  return <code key={value} className="lab-value">{value}</code>
}

export default function ChildLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-[#eaf8fb] text-[#18383f]">{children}</div>;
}

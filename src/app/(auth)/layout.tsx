export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-[#f7fbff]">{children}</div>;
}

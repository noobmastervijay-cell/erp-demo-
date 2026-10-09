import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 mb-4 shadow-xl">
        <img src="/smit-logo.png" alt="SMIT Logo" className="max-h-12 max-w-12 object-contain" />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">404 - Page Not Found</h1>
      <p className="text-xs text-slate-400 mb-6 max-w-sm">
        The requested page does not exist in the Sri Muthukumaran Institute of Technology ERP system.
      </p>
      <Link href="/login">
        <Button variant="gold" size="sm">Return to Login Page</Button>
      </Link>
    </div>
  );
}

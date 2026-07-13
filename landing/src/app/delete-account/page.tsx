import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Delete Account — Digital Mandir",
  description: "Request permanent deletion of your Digital Mandir account and all associated data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans">

      {/* Header */}
      <header className="fixed top-0 z-50 w-full pt-4">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl h-14 flex items-center justify-between bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm px-6 rounded-full">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FFCC80] flex items-center justify-center shadow-[0_0_15px_rgba(255,153,51,0.3)]">
                <div className="w-6 h-6 rounded-full bg-[#FAFAF9] flex items-center justify-center">
                  <Image src="/splash-icon.png" alt="Logo" width={14} height={14} className="object-contain drop-shadow-sm brightness-110" />
                </div>
              </div>
              <span className="text-sm font-bold tracking-tight text-[#1C1917]">DigitalMandir</span>
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-[#57534E] hover:text-[#1C1917] transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Background blurs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[#FF9933]/[0.06] blur-[180px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FFCC80]/[0.08] blur-[150px]"></div>
      </div>

      <main className="relative z-10 container mx-auto px-6 max-w-2xl pt-36 pb-24">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 shadow-sm mb-8 text-xs font-semibold tracking-wider text-red-500 uppercase">
          Account
        </div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tighter text-[#1C1917] mb-4 leading-tight">
          Delete Account
        </h1>
        <p className="text-[#57534E] text-lg font-medium mb-16 leading-relaxed">
          We are sorry to see you go. Account deletion is permanent and cannot be undone.
        </p>

        {/* What gets deleted */}
        <section className="border-t border-black/[0.06] pt-10 mb-12">
          <h2 className="font-serif text-2xl font-bold text-[#1C1917] mb-5">What will be deleted</h2>
          <ul className="space-y-3">
            {[
              "Your account profile and email address",
              "All mantra practice history and streak data",
              "Saved mantras, favourites, and custom configurations",
              "Push notification tokens and device registrations",
              "Any data associated with your account on our servers",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-[#44403C] text-[15px] leading-relaxed">
                <span className="mt-[6px] flex-shrink-0 w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 block"></span>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* How to delete — from app */}
        <section className="border-t border-black/[0.06] pt-10 mb-12">
          <h2 className="font-serif text-2xl font-bold text-[#1C1917] mb-5">Option 1 — Delete from the app</h2>
          <ol className="space-y-4">
            {[
              "Open the Digital Mandir app on your device.",
              'Go to Profile → Settings → Account.',
              'Tap "Delete Account".',
              "Enter your password to confirm.",
              "Your account and all data will be permanently deleted within 30 days.",
            ].map((step, i) => (
              <li key={i} className="flex gap-4 text-[#44403C] text-[15px] leading-relaxed">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 flex items-center justify-center text-xs font-bold text-[#FF9933]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* How to delete — email */}
        <section className="border-t border-black/[0.06] pt-10 mb-12">
          <h2 className="font-serif text-2xl font-bold text-[#1C1917] mb-5">Option 2 — Request via email</h2>
          <p className="text-[#57534E] text-[15px] leading-relaxed mb-6">
            If you no longer have access to the app, send a deletion request to:
          </p>
          <a
            href="mailto:privacy@digitalmandir.app?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%20associated%20with%20this%20email%20address."
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF9933] to-[#E68A2E] px-8 py-3 text-sm font-bold text-[#1C1917] shadow-[0_4px_15px_rgba(255,153,51,0.25)] hover:shadow-[0_8px_25px_rgba(255,153,51,0.4)] hover:-translate-y-0.5 transition-all"
          >
            privacy@digitalmandir.app
          </a>
          <p className="text-[#78716C] text-sm mt-4">
            Please use the email address registered to your account. We will process your request within 30 days.
          </p>
        </section>

        {/* Warning notice */}
        <div className="rounded-3xl bg-red-50 border border-red-200 p-8">
          <h3 className="font-serif text-lg font-bold text-red-700 mb-2">⚠ This action is irreversible</h3>
          <p className="text-red-600 text-sm leading-relaxed">
            Once deleted, your account cannot be recovered. All practice history, streaks, and personal data will be permanently erased. If you only want a break, consider logging out instead.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/[0.05] py-8">
        <div className="container mx-auto px-6 max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#57534E]">
          <p>© {new Date().getFullYear()} DigitalMandir. Built with devotion.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-[#1C1917] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

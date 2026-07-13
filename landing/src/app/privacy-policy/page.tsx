import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy — Digital Mandir",
  description: "Learn how Digital Mandir collects, uses, and protects your personal information.",
};

const sections = [
  {
    title: "Information We Collect",
    content: [
      "**Account Information:** When you create an account, we collect your name, email address, and password (stored as a secure hash).",
      "**Usage Data:** We collect anonymised data about how you use the app — mantras practiced, streak counts, and session durations — to improve your experience.",
      "**Device Information:** We may collect basic device identifiers (OS version, device model) for crash reporting and compatibility purposes.",
      "**Push Notification Tokens:** If you enable notifications, we store a device token solely to deliver reminders you have configured.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "To provide and maintain the Digital Mandir service.",
      "To personalise your practice experience, including streak tracking and progress history.",
      "To send you service-related notifications and, if opted in, practice reminders.",
      "To diagnose technical issues, fix bugs, and improve app performance.",
      "We never sell your personal data to third parties.",
    ],
  },
  {
    title: "Data Storage & Security",
    content: [
      "Your data is stored on servers protected by industry-standard encryption (TLS in transit, AES-256 at rest).",
      "Passwords are hashed using bcrypt and are never stored or transmitted in plain text.",
      "We perform regular security audits and follow OWASP security guidelines.",
      "Only authorised personnel have access to production databases.",
    ],
  },
  {
    title: "Offline Use",
    content: [
      "Digital Mandir is designed to work fully offline. All core functionality (mantra counting, audio playback, local progress) runs on your device without sending data to our servers.",
      "Data synchronisation to the cloud is optional and only occurs when you are signed in and connected to the internet.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "We use Firebase Cloud Messaging solely to deliver push notifications you have opted into.",
      "We do not integrate advertising SDKs or behavioural tracking tools.",
      "Links to third-party websites are provided for your convenience; we are not responsible for their privacy practices.",
    ],
  },
  {
    title: "Children's Privacy",
    content: [
      "Digital Mandir is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "**Access:** You may request a copy of all personal data we hold about you.",
      "**Correction:** You may update your account information at any time from the app settings.",
      "**Deletion:** You may request full deletion of your account and all associated data. See our Account Deletion page or contact us directly.",
      "**Portability:** You may request an export of your practice data in a machine-readable format.",
      "To exercise any of these rights, email us at privacy@digitalmandir.app.",
    ],
  },
  {
    title: "Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification or email. Continued use of the app after changes constitutes acceptance of the updated policy.",
      "This policy was last updated on March 8, 2026.",
    ],
  },
];

export default function PrivacyPolicyPage() {
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

      <main className="relative z-10 container mx-auto px-6 max-w-3xl pt-36 pb-24">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#FF9933]/20 shadow-sm mb-8 text-xs font-semibold tracking-wider text-[#FF9933] uppercase">
          Legal
        </div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tighter text-[#1C1917] mb-4 leading-tight">
          Privacy Policy
        </h1>
        <p className="text-[#57534E] text-lg font-medium mb-16 leading-relaxed">
          Your trust is sacred to us. Here is exactly how we handle your data — plainly and honestly.
        </p>

        <div className="space-y-12">
          {sections.map((section, i) => (
            <section key={i} className="border-t border-black/[0.06] pt-10">
              <h2 className="font-serif text-2xl font-bold text-[#1C1917] mb-5">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex gap-3 text-[#44403C] leading-relaxed text-[15px]">
                    <span className="mt-[6px] flex-shrink-0 w-5 h-5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933] block"></span>
                    </span>
                    <span dangerouslySetInnerHTML={{
                      __html: item
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 rounded-3xl bg-gradient-to-br from-[#FF9933]/10 to-[#FFCC80]/10 border border-[#FF9933]/20 p-8">
          <h3 className="font-serif text-xl font-bold text-[#1C1917] mb-2">Questions?</h3>
          <p className="text-[#57534E] text-sm leading-relaxed">
            Reach us at{" "}
            <a href="mailto:privacy@digitalmandir.app" className="text-[#FF9933] font-semibold hover:underline">
              privacy@digitalmandir.app
            </a>
            . We aim to respond within 48 hours.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/[0.05] py-8">
        <div className="container mx-auto px-6 max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#57534E]">
          <p>© {new Date().getFullYear()} DigitalMandir. Built with devotion.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-[#1C1917] font-semibold">Privacy</Link>
            <Link href="/delete-account" className="hover:text-[#1C1917] transition-colors">Delete Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

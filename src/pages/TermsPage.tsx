import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const PAGE_BG = '#EEF3FB'

export default function TermsPage() {
  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = PAGE_BG
    document.body.style.color = '#002365'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  return (
    <div
      className="min-h-screen w-full font-sans text-foreground"
      style={{ backgroundColor: '#fff' }}
    >
      <div className="relative">
        <Navbar />
      </div>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
        >
          <Link
            to="/"
            aria-label="Home"
            className="inline-flex items-center transition hover:opacity-80"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-brand-navy/60" />
          <span className="text-brand-navy/70">Terms and conditions</span>
        </nav>

        {/* Title block */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-5"
        >
          <h1 className="text-2xl font-medium leading-tight text-brand-navy md:text-[32px]">
            Terms and Conditions
          </h1>
          <p className="mt-1 text-[13px] text-foreground/80 md:text-sm">
            Creative One Business SPC (Cretixone){' '}
            <span className="font-medium">Last Updated:</span> April 23, 2026
          </p>
        </motion.header>

        {/* Sections */}
        <motion.div
          className="mt-10 space-y-9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <Section n={1} title="INTRODUCTION">
            <p>
              Welcome to Cretixone, operated by Creative One Business SPC, a
              company registered in the Sultanate of Oman. These Terms &
              Conditions (“Terms”) govern your access to and use of our website,
              services, digital marketplace, and content platform. By accessing
              or using our platform, you agree to be legally bound by these
              Terms.
            </p>
          </Section>

          <Section n={2} title="DEFINITIONS">
            <Definition label="Platform:" text="The website and services operated by Cretixone." />
            <Definition label="User:" text="Any person accessing or using the platform." />
            <Definition label="Contributor:" text="A user who uploads, shares, or sells content." />
            <Definition label="Content:" text="Images, artwork, designs, media, and digital files." />
            <Definition label="Buyer:" text="A user purchasing or licensing content." />
          </Section>

          <Section n={3} title="ELIGIBILITY">
            <p>To use this platform, you must:</p>
            <p>Be at least 18 years old.</p>
            <p>Have full legal capacity under the laws of the Sultanate of Oman.</p>
            <p>Provide accurate and complete registration information.</p>
            <p>
              We reserve the right to refuse service or terminate accounts at our
              sole discretion.
            </p>
          </Section>

          <Section n={4} title="PLATFORM ROLE">
            <p>Cretixone acts as a digital intermediary connecting contributors and buyers.</p>
            <p>We do not own the content uploaded by users (unless otherwise stated).</p>
            <p>
              We do not guarantee the accuracy, legality, or originality of
              user-submitted content.
            </p>
            <p>Cretixone is not responsible for disputes between Buyers and Contributors.</p>
          </Section>

          <Section n={5} title="USER ACCOUNTS">
            <p>
              Users are responsible for maintaining the confidentiality of their
              login credentials. You accept full responsibility for all activities
              that occur under your account. Cretixone reserves the right to
              suspend or terminate accounts that violate these Terms.
            </p>
          </Section>

          <Section n={6} title="CONTENT OWNERSHIP & LICENSING">
            <p>
              <span className="font-semibold">6.1 Contributor Ownership:</span>{' '}
              Contributors retain the copyright to their uploaded content. By
              uploading, contributors grant Cretixone a non-exclusive, worldwide,
              royalty-free license to display, promote, and distribute the
              content for platform operations.
            </p>
            <p>
              <span className="font-semibold">6.2 Buyer License:</span> Upon
              successful payment, buyers receive a limited, non-exclusive,
              non-transferable license to use the content based on the license
              type selected (e.g., Personal or Commercial).
            </p>
            <p>
              <span className="font-semibold">6.3 Restrictions:</span> Buyers may
              NOT resell/redistribute content as standalone files, claim original
              authorship, or use content for illegal or defamatory purposes.
            </p>
          </Section>

          <Section n={7} title="CONTRIBUTOR OBLIGATIONS">
            <p>Contributors represent and warrant that:</p>
            <p>
              The content is original and does not infringe upon any third-party
              intellectual property.
            </p>
            <p>Necessary model or property releases have been obtained.</p>
            <p>The content does not contain viruses or malicious code.</p>
            <p>
              Cretixone reserves the right to remove any content without notice
              if it is deemed inappropriate or infringing.
            </p>
          </Section>

          <Section n={8} title="PROHIBITED CONDUCT">
            <p>Users shall not:</p>
            <p>Use the platform for any fraudulent or illegal activity.</p>
            <p>
              Attempt to bypass security features or “scrape” data from the
              platform.
            </p>
            <p>
              Upload content that is offensive, discriminatory, or violates Omani
              public policy.
            </p>
          </Section>

          <Section n={9} title="PAYMENTS, FEES & COMMISSIONS">
            <Definition
              label="Pricing:"
              text="All prices are set as displayed on the platform."
            />
            <Definition
              label="Commissions:"
              text="Cretixone may deduct a service fee or commission from transactions as agreed upon in the Contributor dashboard."
            />
            <Definition
              label="Refunds:"
              text="Due to the nature of digital products, all sales are final and non-refundable unless the file is proven to be defective or misrepresented."
            />
          </Section>

          <Section n={10} title="TAXATION (OMAN VAT)">
            <p>
              In compliance with Omani law, prices may be subject to 5% Value
              Added Tax (VAT) where applicable. Users are responsible for any
              additional tax obligations arising from their use of the platform.
            </p>
          </Section>

          <Section n={11} title="INDEMNIFICATION">
            <p>
              You agree to indemnify, defend, and hold harmless Creative One
              Business SPC, its officers, and employees from any claims,
              liabilities, damages, or legal expenses (including attorney fees)
              arising from your breach of these Terms, your use of the platform,
              or your infringement of any third-party rights.
            </p>
          </Section>

          <Section n={12} title="LIMITATION OF LIABILITY">
            <p>
              To the maximum extent permitted under Omani law, Cretixone shall
              not be liable for any indirect, incidental, or consequential
              damages, including loss of profits, data, or business reputation,
              arising out of your use of the platform.
            </p>
          </Section>

          <Section n={13} title="COPYRIGHT INFRINGEMENT (TAKEDOWN POLICY)">
            <p>
              If you believe your work has been copied in a way that constitutes
              copyright infringement, please contact us with:
            </p>
            <p>Proof of ownership.</p>
            <p>Identification of the infringing material.</p>
            <p>Your contact information.</p>
          </Section>

          <Section n={14} title="FORCE MAJEURE">
            <p>
              Cretixone shall not be held liable for any delay or failure in
              performance resulting from causes beyond its reasonable control,
              including but not limited to internet outages, server failures,
              natural disasters, or government restrictions.
            </p>
          </Section>

          <Section n={15} title="GOVERNING LAW & JURISDICTION">
            <p>
              These Terms are governed by and construed in accordance with the
              laws of the Sultanate of Oman. Any disputes arising from these
              Terms shall be subject to the exclusive jurisdiction of the Omani
              Courts.
            </p>
          </Section>

          <Section n={16} title="CHANGES TO TERMS">
            <p>
              We reserve the right to update these Terms at any time. Your
              continued use of the platform following any changes constitutes
              your acceptance of the new Terms.
            </p>
          </Section>

          <Section n={17} title="CONTACT INFORMATION">
            <p>
              Creative One Business SPC (Cretixone) Location: Sultanate of Oman
            </p>
            <div className="mt-4 flex flex-col gap-2 text-foreground sm:flex-row sm:gap-12">
              <p>
                <span className="font-semibold">Email:</span>{' '}
                [Insert Your Email Here]
              </p>
              <p>
                <span className="font-semibold">Website:</span> www.cretixone.com
              </p>
            </div>
          </Section>
        </motion.div>
      </main>

      <Footer />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 rounded-full"
        style={{
          top: '-186px',
          width: 'min(1560px, 140vw)',
          height: '270px',
          background: 'rgba(65, 105, 226, 0.2)',
          filter: 'blur(130px)',
        }}
      />
    </div>
  )
}

interface SectionProps {
  n: number
  title: string
  children: React.ReactNode
}

function Section({ n, title, children }: SectionProps) {
  return (
    <section>
      <h2 className="text-[15px] font-medium tracking-wide text-brand-navy md:text-[18px]">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-foreground md:text-sm">
        {children}
      </div>
    </section>
  )
}

function Definition({ label, text }: { label: string; text: string }) {
  return (
    <p>
      <span className="font-semibold">{label}</span> {text}
    </p>
  )
}

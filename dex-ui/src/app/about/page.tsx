import Link from "next/link";

function formatCreatorAddress(address: string | undefined): string {
  if (!address) {
    return "Creator wallet: Not configured";
  }

  const prefix = address.slice(0, 10);
  const suffix = address.slice(-10);
  return `Creator wallet: ${prefix}...${suffix}`;
}

export default function AboutPage() {
  const creatorAddress = process.env.NEXT_PUBLIC_CREATOR_ADDRESS;
  const displayAddress = formatCreatorAddress(creatorAddress);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="aurora-shell w-full max-w-3xl">
          <article className="card about-card flex flex-col items-center gap-6 text-center">
            <header className="space-y-3">
              <p className="text-sm uppercase tracking-[0.6em] text-purple-400/80">
                Discover
              </p>
              <h1 className="dashboard-title glow text-4xl md:text-5xl">
                About AetherDEX
              </h1>
              <h2 className="text-lg font-medium text-gray-300 md:text-xl">
                Built by Andy – Powered by Solidity, Next.js &amp; Web3.
              </h2>
            </header>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
              AetherDEX is a minimalist decentralized exchange experience that
              blends performant smart contracts with a luminous, futuristic UI.
              Explore automated liquidity, token swaps, and live on-chain
              insights designed to make decentralized finance feel elegant and
              intuitive.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link
                href="https://github.com/Tiger972/AetherDEX"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-purple-500/60 bg-purple-600/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition duration-300 hover:border-purple-400/80 hover:bg-purple-600/50 hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] focus:outline-none focus:ring-2 focus:ring-purple-400/70"
              >
                View Smart Contract on GitHub
              </Link>

              <p className="text-sm font-medium text-gray-400">{displayAddress}</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 5h12M3 9h8M3 13h10"
                stroke="#09090b"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="14" cy="13" r="2.5" fill="#22c55e" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            ReviewMind
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          AI-powered PR reviews
        </h1>
        <p className="text-zinc-400 text-base mb-10 leading-relaxed">
          Connect your GitHub repo. Get instant, intelligent comments on every
          pull request.
        </p>

        {/* GitHub OAuth button */}
        <a
          href="http://localhost:3333/auth/github"
          className="inline-flex items-center gap-3 bg-white text-zinc-900 font-medium px-6 py-3 rounded-lg hover:bg-zinc-100 transition-colors w-full justify-center text-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Continue with GitHub
        </a>

        <p className="text-zinc-600 text-xs mt-6">
          No credit card required · Free to start
        </p>
      </div>
    </main>
  );
}

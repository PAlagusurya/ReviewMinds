"use client";

import { useEffect, useState } from "react";

interface User {
  githubId: string;
  username: string;
  displayName: string;
  emails: { value: string }[];
  avatar: string;
  accessToken: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/auth/github/callback", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 5h12M3 9h8M3 13h10"
                stroke="#09090b"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="14" cy="13" r="2.5" fill="#22c55e" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">
            ReviewMind
          </span>
        </div>

        {/* User avatar from GitHub */}
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm hidden sm:block">
              {user.displayName}
            </span>
            <img
              src={user.avatar}
              alt={user.username}
              className="w-8 h-8 rounded-full border border-zinc-700"
            />
          </div>
        )}
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {user ? `Welcome, ${user.displayName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {user
              ? `@${user.username} · ${user.emails[0]?.value}`
              : "Loading..."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "PRs reviewed", value: "0" },
            { label: "Comments added", value: "0" },
            { label: "Issues caught", value: "0" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4"
            >
              <p className="text-zinc-500 text-xs mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-12 text-center">
          <p className="text-zinc-500 text-sm">
            No pull requests reviewed yet.
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Connect a repo to get started.
          </p>
        </div>
      </div>
    </div>
  );
}

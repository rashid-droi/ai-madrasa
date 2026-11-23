"use client";

// Shown when a page throws. Never displays error details to the user.
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="text-sm text-gray-500">Please try again. If it keeps happening, contact the admin.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </main>
  );
}

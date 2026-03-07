"use client";

import { FormEvent, useState } from "react";

type AgeVerificationModalProps = {
  onConfirm: (birthDate: string) => void;
};

function isAtLeast21YearsOld(birthDateIso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDateIso);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age >= 21;
}

export default function AgeVerificationModal({ onConfirm }: AgeVerificationModalProps) {
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!birthDate) {
      setError("Enter your date of birth to continue.");
      return;
    }

    if (!isAtLeast21YearsOld(birthDate)) {
      setError("You must be at least 21 years old to access this site.");
      return;
    }

    setError(null);
    onConfirm(birthDate);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center"
      >
        <h2 className="text-2xl font-bold mb-4 text-[#0ea5a4] text-center uppercase tracking-wide">RESEARCH USE ONLY</h2>
        <p className="mb-4 text-center text-gray-700 font-semibold">IMPORTANT DISCLAIMER</p>
        <p className="mb-4 text-center text-gray-700">
          All products sold on this website are strictly for laboratory and research purposes only.<br /><br />
          These products are <span className="font-bold uppercase">NOT intended for human consumption, self-administration, or any clinical use</span>. They are designed exclusively for qualified researchers conducting scientific studies in controlled laboratory environments.<br /><br />
          Enter your date of birth to verify you are at least 21 years old before proceeding.
        </p>
        <label className="w-full text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
          Date of Birth
        </label>
        <input
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        {error ? <p className="mt-3 w-full text-sm font-semibold text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="mt-4 px-8 py-3 rounded bg-[#0ea5a4] text-white font-semibold text-lg hover:bg-[#0e8e8e] transition-colors"
        >
          VERIFY AGE - PROCEED TO SITE
        </button>
      </form>
    </div>
  );
}

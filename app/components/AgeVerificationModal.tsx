"use client";

type AgeVerificationModalProps = {
  onConfirm: () => void;
};

export default function AgeVerificationModal({ onConfirm }: AgeVerificationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-[#0ea5a4] text-center uppercase tracking-wide">RESEARCH USE ONLY</h2>
        <p className="mb-4 text-center text-gray-700 font-semibold">IMPORTANT DISCLAIMER</p>
        <p className="mb-4 text-center text-gray-700">
          All products sold on this website are strictly for laboratory and research purposes only.<br /><br />
          These products are <span className="font-bold uppercase">NOT intended for human consumption, self-administration, or any clinical use</span>. They are designed exclusively for qualified researchers conducting scientific studies in controlled laboratory environments.<br /><br />
          By proceeding, you confirm you are at least 21 years old, understand these restrictions, and agree to use all purchased products solely for legitimate research purposes in compliance with applicable laws and regulations.
        </p>
        <button
          className="mt-4 px-8 py-3 rounded bg-[#0ea5a4] text-white font-semibold text-lg hover:bg-[#0e8e8e] transition-colors"
          onClick={onConfirm}
        >
          I AGREE - PROCEED TO SITE
        </button>
      </div>
    </div>
  );
}

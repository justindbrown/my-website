"use client";

import { useState } from "react";
import AgeVerificationModal from "./AgeVerificationModal";
import {
  RESEARCH_GATE_COOKIE,
  RESEARCH_GATE_DURATION_SECONDS,
  RESEARCH_GATE_VALUE,
} from "../lib/research-gate";

type ResearchUseGateProps = {
  initialAcknowledged: boolean;
};

function hasAcknowledged(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const localAck =
    typeof window !== "undefined" ? window.localStorage.getItem(RESEARCH_GATE_COOKIE) : null;
  const cookieAck = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${RESEARCH_GATE_COOKIE}=`));

  return (
    localAck === RESEARCH_GATE_VALUE ||
    cookieAck === `${RESEARCH_GATE_COOKIE}=${RESEARCH_GATE_VALUE}`
  );
}

function rememberAcknowledgement() {
  if (typeof document === "undefined") {
    return;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(RESEARCH_GATE_COOKIE, RESEARCH_GATE_VALUE);
  }

  const secureSegment = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RESEARCH_GATE_COOKIE}=${RESEARCH_GATE_VALUE}; Max-Age=${RESEARCH_GATE_DURATION_SECONDS}; Path=/; SameSite=Lax${secureSegment}`;
}

export default function ResearchUseGate({ initialAcknowledged }: ResearchUseGateProps) {
  const [open, setOpen] = useState(() => {
    if (typeof document === "undefined") {
      return !initialAcknowledged;
    }

    return !hasAcknowledged();
  });

  if (!open) {
    return null;
  }

  return (
    <AgeVerificationModal
      onConfirm={() => {
        rememberAcknowledgement();
        setOpen(false);
      }}
    />
  );
}

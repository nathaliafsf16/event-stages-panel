import { NextResponse } from "next/server";
import {
  getIdentity,
  requireIdentity,
  type VerifiedIdentity,
} from "../../cursor/identity";

const noStore = { "cache-control": "private, no-store" };

export async function requireViewer(
  request: Request,
): Promise<VerifiedIdentity | NextResponse> {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) {
    return NextResponse.json(
      { error: "Faça login no Cursor para alterar eventos." },
      { status: 401, headers: noStore },
    );
  }
  return identity;
}

export async function optionalViewer(request: Request) {
  return getIdentity(request);
}

export function viewerLabel(identity: VerifiedIdentity): string {
  if (identity.kind === "key") {
    return identity.name || "Chave de API";
  }
  return identity.name || identity.email || "Usuário autenticado";
}

export function forbiddenOwner(): NextResponse {
  return NextResponse.json(
    { error: "Só quem criou este evento pode adicionar etapas." },
    { status: 403, headers: noStore },
  );
}

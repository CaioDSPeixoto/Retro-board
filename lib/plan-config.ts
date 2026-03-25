import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { PLAN_LIMITS } from "@/types/user";
import type { PlanLimits, SubscriptionPlan } from "@/types/user";

const DOC_ID = "current";
const COLLECTION = "plan_config";

export async function getStoredPlanLimits(): Promise<Record<SubscriptionPlan, PlanLimits>> {
  try {
    const doc = await adminDb.collection(COLLECTION).doc(DOC_ID).get();
    if (!doc.exists) return { ...PLAN_LIMITS };

    const data = doc.data() as Record<string, unknown>;
    const result = { ...PLAN_LIMITS };

    for (const plan of ["free", "pro", "team"] as SubscriptionPlan[]) {
      if (data[plan] && typeof data[plan] === "object") {
        result[plan] = { ...PLAN_LIMITS[plan], ...(data[plan] as Partial<PlanLimits>) };
      }
    }

    return result;
  } catch {
    return { ...PLAN_LIMITS };
  }
}

export async function saveStoredPlanLimits(
  limits: Record<SubscriptionPlan, PlanLimits>,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(DOC_ID).set(limits, { merge: true });
}

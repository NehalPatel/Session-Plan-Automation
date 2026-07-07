import type { Division, PlanMetadata } from "@session-plan/shared";

export function normalizeMetadata(metadata: PlanMetadata & { division?: string }): PlanMetadata {
  if (metadata.divisions?.length) {
    return metadata;
  }
  const legacy = metadata.division;
  return {
    ...metadata,
    divisions: legacy ? [legacy as Division] : ["A"],
  };
}

export function toPlanResponse(plan: unknown) {
  const doc = plan as Record<string, unknown>;

  const schedule = (doc.schedule as { date: string }[]) ?? [];
  const dateRange = (doc.dateRange as { fromDate: string; toDate: string }) ?? {
    fromDate: schedule[0]?.date ?? "",
    toDate: schedule[schedule.length - 1]?.date ?? "",
  };

  const syllabusId = doc.syllabusId as { toString(): string } | null | undefined;

  return {
    id: (doc._id as { toString(): string }).toString(),
    userId: (doc.userId as { toString(): string }).toString(),
    syllabusId: syllabusId?.toString(),
    metadata: normalizeMetadata(doc.metadata as PlanMetadata & { division?: string }),
    dateRange,
    schedule: doc.schedule,
    unitSelection: doc.unitSelection,
    rows: doc.rows,
    status: doc.status,
    createdAt: (doc.createdAt as Date | undefined)?.toISOString(),
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

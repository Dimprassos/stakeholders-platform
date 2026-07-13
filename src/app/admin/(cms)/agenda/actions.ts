"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEventId } from "@/lib/event";
import { AGENDA_TYPES } from "@/lib/agenda";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function revalidateAgenda() {
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
}

export async function addAgendaItemAction(formData: FormData): Promise<void> {
  const eventId = await getAdminEventId();
  const day = str(formData, "day");
  const startTime = str(formData, "startTime");
  const title = str(formData, "title");
  if (!day || !startTime || !title) redirect("/admin/agenda?err=required");

  const type = str(formData, "type");
  await prisma.agendaItem.create({
    data: {
      eventId,
      day,
      dayLabel: str(formData, "dayLabel") || null,
      startTime,
      endTime: str(formData, "endTime") || null,
      title,
      type: (AGENDA_TYPES as readonly string[]).includes(type) ? type : "SESSION",
      location: str(formData, "location") || null,
      speaker: str(formData, "speaker") || null,
      description: str(formData, "description") || null,
      displayOrder: Number.parseInt(str(formData, "displayOrder"), 10) || 0,
    },
  });

  revalidateAgenda();
  redirect("/admin/agenda?added=1");
}

export async function deleteAgendaItemAction(formData: FormData): Promise<void> {
  const eventId = await getAdminEventId();
  const id = str(formData, "id");
  if (!id) return;
  // Scoped by eventId so an admin can only delete items from their own event.
  await prisma.agendaItem.deleteMany({ where: { id, eventId } });
  revalidateAgenda();
}

export async function saveAgendaNoteAction(formData: FormData): Promise<void> {
  const eventId = await getAdminEventId();
  const note = str(formData, "agendaNote");
  await prisma.event.update({
    where: { id: eventId },
    data: { agendaNote: note || null },
  });
  revalidateAgenda();
  redirect("/admin/agenda?noted=1");
}

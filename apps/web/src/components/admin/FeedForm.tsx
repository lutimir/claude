"use client";

import { startTransition, useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { FeedPreview } from "@app0/core";
import { feedFormAction, type FeedFormState } from "@/app/admin/obchody/actions";

interface FeedFormProps {
  shopId: number;
  feed?: {
    id: number;
    url: string;
    enabled: boolean;
    consentConfirmedAt: Date | null;
    consentNote: string | null;
    consentContact: string | null;
  };
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900";
const labelClass = "flex flex-col gap-1 text-sm font-medium";

const initialState: FeedFormState = { status: "idle" };

export function FeedForm({ shopId, feed }: FeedFormProps) {
  const t = useTranslations("admin");
  const [state, formAction, pending] = useActionState(feedFormAction, initialState);
  // Kontrolované polia — po server action (validácii) React resetuje
  // nekontrolovaný formulár a hodnoty by sa stratili.
  const [url, setUrl] = useState(feed?.url ?? "");
  const [enabled, setEnabled] = useState(feed?.enabled ?? false);
  const [consentConfirmed, setConsentConfirmed] = useState(Boolean(feed?.consentConfirmedAt));
  const [consentNote, setConsentNote] = useState(feed?.consentNote ?? "");
  const [consentContact, setConsentContact] = useState(feed?.consentContact ?? "");

  // Manuálny dispatch namiesto <form action> — obchádza automatický reset
  // formulára po dokončení server action (stratil by stav checkboxov).
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-2xl flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <input type="hidden" name="shopId" value={shopId} />
      {feed ? <input type="hidden" name="feedId" value={feed.id} /> : null}

      {state.status === "error" ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      ) : null}

      <label className={labelClass}>
        {t("feedFormUrl")}
        <input
          name="url"
          type="url"
          required
          placeholder="https://obchod.sk/heureka.xml"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="enabled"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        {t("feedFormEnabled")}
      </label>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="consentConfirmed"
            checked={consentConfirmed}
            onChange={(event) => setConsentConfirmed(event.target.checked)}
          />
          {t("feedFormConsentConfirmed")}
        </label>
        <p className="text-xs text-neutral-500">{t("consentRequired")}</p>
        <label className={labelClass}>
          {t("feedFormConsentNote")}
          <textarea
            name="consentNote"
            rows={2}
            value={consentNote}
            onChange={(event) => setConsentNote(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          {t("feedFormConsentContact")}
          <input
            name="consentContact"
            value={consentContact}
            onChange={(event) => setConsentContact(event.target.value)}
            className={inputClass}
          />
        </label>
      </fieldset>

      {state.status === "validated" && state.preview ? (
        <FeedPreviewCard preview={state.preview} />
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          name="intent"
          value="validate"
          disabled={pending}
          className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          {pending ? t("validating") : t("validateFeed")}
        </button>
        <button
          type="submit"
          name="intent"
          value="save"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {t("save")}
        </button>
      </div>
    </form>
  );
}

function FeedPreviewCard({ preview }: { preview: FeedPreview }) {
  const t = useTranslations("admin");
  const stats = [
    { label: t("previewTotal"), value: preview.totalItems },
    { label: t("previewValidEan"), value: preview.itemsWithValidEan },
    { label: t("previewInvalidEan"), value: preview.itemsWithInvalidEan },
    { label: t("previewNoEan"), value: preview.itemsWithoutEan },
  ];
  return (
    <section className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/50">
      <h3 className="font-semibold">{t("previewTitle")}</h3>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {stats.map((stat) => (
          <div key={stat.label} className="flex gap-1.5">
            <dd className="font-bold">{stat.value}</dd>
            <dt className="text-neutral-600 dark:text-neutral-300">{stat.label}</dt>
          </div>
        ))}
      </dl>

      {preview.warnings.length > 0 ? (
        <div className="mt-2">
          <p className="font-medium">
            {t("previewWarnings")} ({preview.warningsCount}):
          </p>
          <ul className="mt-1 list-inside list-disc text-xs text-amber-700 dark:text-amber-300">
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 font-medium">{t("previewSample")}:</p>
      <div className="mt-1 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-1 pr-3 font-medium">{t("previewName")}</th>
              <th className="py-1 pr-3 font-medium">{t("previewPrice")}</th>
              <th className="py-1 pr-3 font-medium">EAN</th>
              <th className="py-1 font-medium">{t("previewCategory")}</th>
            </tr>
          </thead>
          <tbody>
            {preview.sample.map((item) => (
              <tr key={item.externalId} className="border-t border-emerald-200 dark:border-emerald-900">
                <td className="max-w-64 truncate py-1 pr-3">{item.name}</td>
                <td className="py-1 pr-3">{item.price.toFixed(2)}</td>
                <td className="py-1 pr-3 font-mono">
                  {item.ean ?? "—"}
                  {item.ean ? (item.eanValid ? " ✓" : " ✗") : ""}
                </td>
                <td className="py-1">{item.category ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

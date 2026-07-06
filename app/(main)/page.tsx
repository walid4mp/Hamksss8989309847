/* eslint-disable @next/next/no-img-element */
"use client";

import Fieldset from "@/components/fieldset";
import Header from "@/components/header";
import ArrowRightIcon from "@/components/icons/arrow-right";
import LightningBoltIcon from "@/components/icons/lightning-bolt";
import LoadingButton from "@/components/loading-button";
import SiteFooter from "@/components/site-footer";
import Spinner from "@/components/spinner";
import { toast } from "@/hooks/use-toast";
import {
  FREE_DAILY_POINTS,
  HIGH_QUALITY_COST,
  LOW_QUALITY_COST,
  contactLinks,
  developerAccounts,
  paymentMethods,
  platformHighlights,
  subscriptionPlans,
} from "@/lib/site-content";
import * as Select from "@radix-ui/react-select";
import assert from "assert";
import {
  CheckIcon,
  ChevronDownIcon,
  CreditCard,
  Gift,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useS3Upload } from "next-s3-upload";
import {
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { Context } from "./providers";
import UploadIcon from "@/components/icons/upload-icon";
import { MODELS, SUGGESTED_PROMPTS } from "@/lib/constants";

type PointsLedger = {
  date: string;
  remaining: number;
};

const pointsLedgerKey = "warhex-free-points-ledger";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readPointsLedger(): PointsLedger {
  if (typeof window === "undefined") {
    return { date: getTodayKey(), remaining: FREE_DAILY_POINTS };
  }

  const stored = window.localStorage.getItem(pointsLedgerKey);
  const today = getTodayKey();

  if (!stored) {
    const fresh = { date: today, remaining: FREE_DAILY_POINTS };
    window.localStorage.setItem(pointsLedgerKey, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(stored) as PointsLedger;
    if (parsed.date !== today) {
      const refreshed = { date: today, remaining: FREE_DAILY_POINTS };
      window.localStorage.setItem(pointsLedgerKey, JSON.stringify(refreshed));
      return refreshed;
    }

    return {
      date: parsed.date,
      remaining: Math.max(0, Math.min(FREE_DAILY_POINTS, parsed.remaining)),
    };
  } catch {
    const fallback = { date: today, remaining: FREE_DAILY_POINTS };
    window.localStorage.setItem(pointsLedgerKey, JSON.stringify(fallback));
    return fallback;
  }
}

function writePointsLedger(nextRemaining: number) {
  const ledger = {
    date: getTodayKey(),
    remaining: Math.max(0, Math.min(FREE_DAILY_POINTS, nextRemaining)),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(pointsLedgerKey, JSON.stringify(ledger));
  }

  return ledger.remaining;
}

function paymentIcon(id: string) {
  switch (id) {
    case "paypal":
      return Wallet;
    case "visa":
      return CreditCard;
    case "redotpay":
      return ShieldCheck;
    default:
      return Ticket;
  }
}

export default function Home() {
  const { setStreamPromise } = use(Context);
  const router = useRouter();
  const { uploadToS3 } = useS3Upload();

  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [model, setModel] = useState(
    MODELS.find((entry) => !entry.hidden)?.value || MODELS[0].value,
  );
  const [quality, setQuality] = useState("low");
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>();
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [remainingPoints, setRemainingPoints] = useState(FREE_DAILY_POINTS);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRemainingPoints(readPointsLedger().remaining);
    textareaRef.current?.focus();
  }, []);

  const selectedModel = useMemo(
    () => MODELS.find((entry) => entry.value === model),
    [model],
  );

  const qualityOptions = useMemo(
    () => [
      { value: "low", label: `Standard quality · ${LOW_QUALITY_COST} points` },
      { value: "high", label: `High quality · ${HIGH_QUALITY_COST} points` },
    ],
    [],
  );

  const textareaResizePrompt = useMemo(
    () =>
      prompt
        .split("\n")
        .map((text) => (text === "" ? "a" : text))
        .join("\n"),
    [prompt],
  );

  const generationCost =
    quality === "high" ? HIGH_QUALITY_COST : LOW_QUALITY_COST;

  const handleScreenshotUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (prompt.length === 0) setPrompt("Build this");
    setQuality("low");
    setScreenshotLoading(true);
    setScreenshotName(file.name);

    try {
      const { url } = await uploadToS3(file);
      setScreenshotUrl(url);
    } finally {
      setScreenshotLoading(false);
    }
  };

  const clearScreenshot = () => {
    setScreenshotUrl(undefined);
    setScreenshotName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const reservePoints = (cost: number) => {
    const ledger = readPointsLedger();
    if (ledger.remaining < cost) {
      return false;
    }

    const nextRemaining = writePointsLedger(ledger.remaining - cost);
    setRemainingPoints(nextRemaining);
    return true;
  };

  const refundPoints = (cost: number) => {
    const ledger = readPointsLedger();
    const nextRemaining = writePointsLedger(ledger.remaining + cost);
    setRemainingPoints(nextRemaining);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f5f7fb] text-gray-900">
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
        <img
          src="/halo.png"
          alt=""
          className="max-h-[953px] w-full max-w-[1200px] object-cover object-top mix-blend-screen"
        />
      </div>

      <div className="isolate flex min-h-screen flex-col">
        <Header />

        <main className="mx-auto flex w-full max-w-6xl grow flex-col gap-16 px-4 pb-16 pt-10 lg:gap-20 lg:pt-14">
          <section className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm text-blue-700 shadow-sm">
                <Gift className="h-4 w-4" />
                Free plan includes {FREE_DAILY_POINTS} points every day
              </div>

              <div className="space-y-5">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-gray-900 md:text-6xl">
                  Build apps faster with complete parameters, clear pricing, and
                  managed developer access.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-gray-600">
                  The workspace now includes a project name field, uploaded image
                  name preview, free daily points, paid subscriptions, multiple
                  payment methods, and a ready-to-use developer access catalog.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {platformHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur"
                  >
                    <p className="text-base font-semibold text-gray-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Free daily balance
                  </p>
                  <p className="text-2xl font-semibold text-blue-950">
                    {remainingPoints} / {FREE_DAILY_POINTS}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
                  Current run cost: <span className="font-semibold">{generationCost} points</span>
                </div>
              </div>

              <form
                className="relative"
                action={async (formData) => {
                  startTransition(async () => {
                    const entries = Object.fromEntries(formData);
                    const { prompt, model, quality, projectName } = entries;

                    assert.ok(typeof prompt === "string");
                    assert.ok(typeof model === "string");
                    assert.ok(typeof projectName === "string");
                    assert.ok(quality === "high" || quality === "low");

                    const cost =
                      quality === "high" ? HIGH_QUALITY_COST : LOW_QUALITY_COST;

                    if (!reservePoints(cost)) {
                      toast({
                        title: "Not enough free points",
                        description:
                          "Wait for the daily reset or upgrade to Pro / Professional.",
                      });
                      return;
                    }

                    try {
                      const effectivePrompt = projectName.trim().length
                        ? `Project name: ${projectName.trim()}\n\n${prompt}`
                        : prompt;

                      const response = await fetch("/api/create-chat", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          prompt: effectivePrompt,
                          model,
                          quality,
                          screenshotUrl,
                        }),
                      });

                      if (!response.ok) {
                        refundPoints(cost);
                        throw new Error("Failed to create chat");
                      }

                      const { chatId, lastMessageId } = await response.json();
                      const streamPromise = fetch(
                        "/api/get-next-completion-stream-promise",
                        {
                          method: "POST",
                          body: JSON.stringify({ messageId: lastMessageId, model }),
                        },
                      ).then((res) => {
                        if (!res.body) {
                          throw new Error("No body on response");
                        }
                        return res.body;
                      });

                      startTransition(() => {
                        setStreamPromise(streamPromise);
                        router.push(`/chats/${chatId}`);
                      });
                    } catch (error) {
                      refundPoints(cost);
                      toast({
                        title: "Generation failed",
                        description:
                          error instanceof Error
                            ? error.message
                            : "Something went wrong while creating the chat.",
                      });
                    }
                  });
                }}
              >
                <Fieldset className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="projectName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Project name
                    </label>
                    <input
                      id="projectName"
                      name="projectName"
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      placeholder="Example: WarHex Prompt Studio"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="relative rounded-[24px] border border-gray-200 bg-white pb-12 shadow-sm">
                    <div className="w-full">
                      {(screenshotLoading || screenshotUrl) && (
                        <div className="relative mx-3 mt-3">
                          {screenshotLoading ? (
                            <div className="group mb-2 flex h-20 w-24 animate-pulse items-center justify-center rounded-2xl bg-gray-200">
                              <Spinner />
                            </div>
                          ) : (
                            <div className="mb-3 flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                              <img
                                alt="Screenshot preview"
                                src={screenshotUrl}
                                className="h-20 w-24 rounded-xl object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                                  Uploaded image
                                </p>
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {screenshotName || "Unnamed screenshot"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  The image will be used as a visual reference.
                                </p>
                              </div>
                              <button
                                type="button"
                                className="rounded-full bg-white p-1 text-gray-500 transition hover:text-gray-900"
                                onClick={clearScreenshot}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="size-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="relative">
                        <div className="p-3">
                          <p className="invisible w-full whitespace-pre-wrap text-sm">
                            {textareaResizePrompt}
                          </p>
                        </div>
                        <textarea
                          ref={textareaRef}
                          placeholder="Build me a subscription-ready AI coding app with pricing, code redemption, and developer access..."
                          required
                          name="prompt"
                          rows={4}
                          className="peer absolute inset-0 w-full resize-none bg-transparent px-4 py-3 text-sm placeholder-gray-500 focus-visible:outline-none disabled:opacity-50"
                          value={prompt}
                          onChange={(event) => setPrompt(event.target.value)}
                          onPaste={(event) => {
                            event.preventDefault();
                            const pastedText = event.clipboardData.getData("text");
                            const cleanedText = pastedText
                              .replace(/\r\n/g, "\n")
                              .replace(/\r/g, "\n")
                              .replace(/\n{3,}/g, "\n\n")
                              .trim();

                            const textarea = event.target as HTMLTextAreaElement;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const newValue =
                              prompt.slice(0, start) +
                              cleanedText +
                              prompt.slice(end);

                            setPrompt(newValue);

                            setTimeout(() => {
                              if (textareaRef.current) {
                                textareaRef.current.selectionStart =
                                  start + cleanedText.length;
                                textareaRef.current.selectionEnd =
                                  start + cleanedText.length;
                              }
                            }, 0);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              const target = event.target;
                              if (!(target instanceof HTMLTextAreaElement)) return;
                              target.closest("form")?.requestSubmit();
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-3 right-2.5 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Select.Root
                          name="model"
                          value={model}
                          onValueChange={setModel}
                        >
                          <Select.Trigger className="inline-flex items-center gap-1 rounded-md p-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
                            <Select.Value aria-label={model}>
                              <span>{selectedModel?.label}</span>
                            </Select.Value>
                            <Select.Icon>
                              <ChevronDownIcon className="size-3" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5">
                              <Select.Viewport className="space-y-1 p-2">
                                {MODELS.filter((entry) => !entry.hidden).map((entry) => (
                                  <Select.Item
                                    key={entry.value}
                                    value={entry.value}
                                    className="flex cursor-pointer items-center gap-1 rounded-md p-1 text-sm data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                                  >
                                    <Select.ItemText className="inline-flex items-center gap-2 text-gray-500">
                                      {entry.label}
                                    </Select.ItemText>
                                    <Select.ItemIndicator>
                                      <CheckIcon className="size-3 text-blue-600" />
                                    </Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                              <Select.ScrollDownButton />
                              <Select.Arrow />
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>

                        <div className="h-4 w-px bg-gray-200 max-sm:hidden" />

                        <Select.Root
                          name="quality"
                          value={quality}
                          onValueChange={setQuality}
                        >
                          <Select.Trigger className="inline-flex items-center gap-1 rounded p-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
                            <Select.Value aria-label={quality}>
                              <span className="max-sm:hidden">
                                {quality === "low"
                                  ? `Standard quality · ${LOW_QUALITY_COST} points`
                                  : `High quality · ${HIGH_QUALITY_COST} points`}
                              </span>
                              <span className="sm:hidden">
                                <LightningBoltIcon className="size-3" />
                              </span>
                            </Select.Value>
                            <Select.Icon>
                              <ChevronDownIcon className="size-3" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5">
                              <Select.Viewport className="space-y-1 p-2">
                                {qualityOptions.map((option) => (
                                  <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    className="flex cursor-pointer items-center gap-1 rounded-md p-1 text-sm data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                                  >
                                    <Select.ItemText className="inline-flex items-center gap-2 text-gray-500">
                                      {option.label}
                                    </Select.ItemText>
                                    <Select.ItemIndicator>
                                      <CheckIcon className="size-3 text-blue-600" />
                                    </Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                              <Select.ScrollDownButton />
                              <Select.Arrow />
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>

                        <div className="h-4 w-px bg-gray-200 max-sm:hidden" />

                        <div>
                          <label
                            htmlFor="screenshot"
                            className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                          >
                            <div className="flex size-6 items-center justify-center rounded bg-black hover:bg-gray-700">
                              <UploadIcon className="size-4" />
                            </div>
                            <div className="flex items-center justify-center transition">
                              Attach image
                            </div>
                          </label>
                          <input
                            id="screenshot"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleScreenshotUpload}
                            className="hidden"
                            ref={fileInputRef}
                          />
                        </div>
                      </div>

                      <div className="relative flex shrink-0 has-[:disabled]:opacity-50">
                        <div className="pointer-events-none absolute inset-0 -bottom-[1px] rounded bg-blue-500" />
                        <LoadingButton
                          className="relative inline-flex size-9 items-center justify-center rounded-full bg-blue-500 font-medium text-white shadow-lg outline-blue-300 hover:bg-blue-500/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-90"
                          type="submit"
                          disabled={screenshotLoading || prompt.length === 0}
                        >
                          <ArrowRightIcon />
                        </LoadingButton>
                      </div>
                    </div>

                    {isPending && (
                      <LoadingMessage
                        isHighQuality={quality === "high"}
                        screenshotUrl={screenshotUrl}
                      />
                    )}
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">Parameters:</span>{" "}
                      Project name, prompt, model, quality, and image name preview.
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">Free usage:</span>{" "}
                      {FREE_DAILY_POINTS} points daily with automatic guest reset.
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">Payments:</span>{" "}
                      PayPal, Visa, RedotPay, and redeemable code checkout.
                    </div>
                  </div>
                </Fieldset>
              </form>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {SUGGESTED_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setPrompt(item.description);
                      setTimeout(() => {
                        textareaRef.current?.focus();
                        if (textareaRef.current) {
                          textareaRef.current.selectionStart =
                            textareaRef.current.value.length;
                          textareaRef.current.selectionEnd =
                            textareaRef.current.value.length;
                        }
                      }, 0);
                    }}
                    className="rounded-full bg-[#E5E9EF] px-3 py-1.5 text-xs tracking-[0%] transition-colors hover:bg-[#d8dde5]"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600">
                  Subscription plans
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                  Free, Pro, and Professional in monthly and yearly options
                </h2>
              </div>
              <Link
                href="/pricing"
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                View full pricing →
              </Link>
            </div>
            <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-gray-900">
                      {plan.name}
                    </p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plan.cadence}</p>
                  <p className="mt-4 text-3xl font-semibold text-gray-900">
                    {plan.price}
                  </p>
                  <p className="mt-2 text-sm font-medium text-blue-700">
                    {plan.points}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {plan.description}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-gray-600">
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckIcon className="mt-1 h-4 w-4 text-blue-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600">
                Payment methods
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                Pay with PayPal, Visa, RedotPay, or prepaid codes
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                The updated experience now includes multiple checkout options so
                paid subscriptions and code redemption are easy to understand and
                easy to extend later with real payment integrations.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {paymentMethods.map((method) => {
                const Icon = paymentIcon(method.id);
                return (
                  <div
                    key={method.id}
                    className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-gray-900">
                      {method.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {method.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600">
                  Developer accounts
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                  10 ready-to-use developer accounts with full permissions
                </h2>
              </div>
              <Link
                href="/developers"
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Manage all developer accounts →
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {developerAccounts.slice(0, 4).map((account) => (
                <div
                  key={account.email}
                  className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {account.name}
                      </p>
                      <p className="text-sm text-gray-500">{account.role}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Full access
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-gray-900">Email:</span>{" "}
                      {account.email}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Code:</span>{" "}
                      {account.accessCode}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Includes all premium features, all code packages, and custom
                    code creation permissions.
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-blue-100 bg-gradient-to-r from-blue-600 to-slate-900 p-8 text-white shadow-lg md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                  Contact us
                </p>
                <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
                  Reach WarHex on WhatsApp, Instagram, Facebook, or email
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50">
                  A dedicated contact page was added so support details are easy
                  to find directly from the product navigation and footer.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={contactLinks.whatsapp}
                  target="_blank"
                  className="rounded-2xl bg-white/10 px-4 py-4 text-sm font-medium transition hover:bg-white/20"
                >
                  WhatsApp
                </a>
                <a
                  href={contactLinks.instagram}
                  target="_blank"
                  className="rounded-2xl bg-white/10 px-4 py-4 text-sm font-medium transition hover:bg-white/20"
                >
                  Instagram
                </a>
                <a
                  href={contactLinks.facebook}
                  target="_blank"
                  className="rounded-2xl bg-white/10 px-4 py-4 text-sm font-medium transition hover:bg-white/20"
                >
                  Facebook
                </a>
                <a
                  href={contactLinks.email}
                  className="rounded-2xl bg-white/10 px-4 py-4 text-sm font-medium transition hover:bg-white/20"
                >
                  {contactLinks.emailLabel}
                </a>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

function LoadingMessage({
  isHighQuality,
  screenshotUrl,
}: {
  isHighQuality: boolean;
  screenshotUrl: string | undefined;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
        <Sparkles className="h-5 w-5 animate-pulse text-blue-600" />
        <span className="text-balance text-center text-sm md:text-base">
          {isHighQuality
            ? "Preparing a higher quality project plan, this may take a few more seconds..."
            : screenshotUrl
              ? "Analyzing your reference image..."
              : "Creating your app..."}
        </span>
      </div>
    </div>
  );
}

export const runtime = "edge";
export const maxDuration = 60;

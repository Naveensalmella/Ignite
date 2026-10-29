"use client";
import { useState } from 'react';
import { Flame, Dumbbell, Apple, MessageCircle, Crown, ArrowRight, House, ListChecks, Backpack, Ghost, Shield } from 'lucide-react';
import { IconBadge, Pill } from '@/components/ui/kit';
import BrandMark from '@/components/ui/BrandMark';

const SLIDES = [
    {
        icon: Flame, tone: "sky",
        title: "Welcome to IGNITE",
        subtitle: "Level up your life",
        desc: "The gamified self-improvement app that turns your daily routine into an RPG adventure.",
    },
    {
        icon: Dumbbell, tone: "orange",
        title: "Train like a Hunter",
        subtitle: "22 structured programs",
        desc: "Gym, combat, yoga, running — pick your path. Track sets, reps and calories, and clear Gates as you get stronger.",
    },
    {
        icon: Apple, tone: "lime",
        title: "Fuel your body",
        subtitle: "Smart nutrition tracking",
        desc: "199 Indian foods, an AI food scanner, meal plans and macro tracking. Eat right, perform better.",
    },
    {
        icon: MessageCircle, tone: "violet",
        title: "Your AI Coach",
        subtitle: "Speaks as the System",
        desc: "Four specialties — Trainer, Nutrition, Recovery and Commander. It knows your stats and quests.",
    },
    {
        icon: Crown, tone: "amber",
        title: "Arise, Player",
        subtitle: "Daily Quest · Stats · Hunter ranks",
        desc: "Clear the Daily Quest, grow STR, AGI, VIT, INT and PER, earn Gold and Items, raise your Shadow Army and climb from E-Rank to National Level.",
    },
];

const STRIP = [House, ListChecks, Dumbbell, MessageCircle, Backpack, Ghost, Shield];

export default function IntroPage({ onGetStarted }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slide = SLIDES[currentSlide];
    const isLast = currentSlide === SLIDES.length - 1;

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8" style={{ background: "var(--bg)" }}>
            <div className="w-full flex flex-col items-center gap-5" style={{ maxWidth: 400 }}>
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <BrandMark size={30} />
                    <span className="text-accent-grad text-[22px] font-extrabold" style={{ letterSpacing: 3 }}>IGNITE</span>
                </div>

                {/* Slide content */}
                <div className="card w-full text-center" style={{ padding: "32px 22px" }} aria-live="polite">
                    <div className="fade-in" key={currentSlide}>
                        <div className="flex justify-center mb-5">
                            <IconBadge icon={slide.icon} tone={slide.tone} size={76} />
                        </div>
                        <h1 className="text-[24px] font-extrabold leading-tight mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-.01em" }}>
                            {slide.title}
                        </h1>
                        <div className="mb-4"><Pill tone={slide.tone}>{slide.subtitle}</Pill></div>
                        <p className="text-[14px] leading-relaxed m-0" style={{ color: "var(--text-secondary)" }}>
                            {slide.desc}
                        </p>
                    </div>
                </div>

                {/* Dots */}
                <div className="flex items-center" role="tablist" aria-label="Intro slides">
                    {SLIDES.map((s, i) => (
                        <button key={i} type="button" role="tab" aria-selected={i === currentSlide} aria-label={`Slide ${i + 1}: ${s.title}`}
                            onClick={() => setCurrentSlide(i)}
                            className="flex items-center justify-center" style={{ width: i === currentSlide ? 36 : 20, height: 36, background: "none", border: "none", padding: 0 }}>
                            <span style={{ display: "block", width: i === currentSlide ? 24 : 8, height: 8, borderRadius: 999, background: i === currentSlide ? "var(--accent)" : "var(--track)", transition: "width .3s, background .3s" }} />
                        </button>
                    ))}
                </div>

                {/* Buttons */}
                <div className="w-full">
                    {isLast ? (
                        <button type="button" onClick={onGetStarted} className="bp w-full" style={{ padding: "14px 20px", fontSize: 15 }}>
                            Get started <ArrowRight size={17} />
                        </button>
                    ) : (
                        <div className="flex gap-2.5">
                            <button type="button" onClick={onGetStarted} className="bg" style={{ flex: 1, padding: "14px 16px" }}>
                                Skip
                            </button>
                            <button type="button" onClick={() => setCurrentSlide(currentSlide + 1)} className="bp" style={{ flex: 2, padding: "14px 16px", fontSize: 15 }}>
                                Next <ArrowRight size={17} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Feature strip */}
                <div className="flex gap-4 mt-2" style={{ color: "var(--text-dim)" }} aria-hidden="true">
                    {STRIP.map((Icon, i) => <Icon key={i} size={17} />)}
                </div>
            </div>
        </div>
    );
}

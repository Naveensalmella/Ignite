// One line icon per concept, so every page uses the same symbol for the same thing.
import {
    House, ListChecks, Dumbbell, MessageCircle, Backpack, Flame, Coins, Zap, Shield, ShieldCheck, FlaskConical,
    ScrollText, KeyRound, Gift, RotateCcw, Ghost, Sparkles, Award, Trophy, Skull, PawPrint, Castle, Snowflake, Bug,
    Landmark, Timer, Heart, Apple, Droplet, Moon, NotebookPen, Wallet, CalendarDays, Camera, Users, User, Target,
    BookOpen, Brain, Flower2, Footprints, Activity, Crown, Star, Swords, Share2, Settings, Eye,
    Wind, Mountain, Hand, Wand2, Sword, Droplets,
} from "lucide-react";

/** App areas */
export const AREA = {
    home: House, quests: ListChecks, train: Dumbbell, coach: MessageCircle, items: Backpack,
    nutrition: Apple, water: Droplet, focus: Timer, wellness: Heart, journal: NotebookPen, sleep: Moon,
    finance: Wallet, routine: CalendarDays, photos: Camera, social: Users, profile: User, share: Share2,
    settings: Settings, shadows: Ghost, gates: Swords, skills: Sparkles, titles: Award, badges: Trophy,
    streak: Flame, gold: Coins, xp: Zap, rank: Shield, target: Target, read: BookOpen, mind: Brain,
    meditate: Flower2, steps: Footprints, activity: Activity, crown: Crown, star: Star,
};

/** Tone per area (see --tone-* tokens) */
export const AREA_TONE = {
    train: "orange", gates: "orange", nutrition: "lime", water: "sky", focus: "violet", wellness: "rose",
    journal: "rose", sleep: "blue", finance: "amber", routine: "teal", photos: "sky", social: "blue",
    profile: "sky", shadows: "violet", skills: "sky", titles: "amber", badges: "amber", streak: "orange",
    gold: "amber", xp: "sky", quests: "teal", coach: "sky", items: "amber", share: "sky",
};

/** Shop / inventory items */
export const ITEM_ICON = { shield: ShieldCheck, potion: FlaskConical, pardon: ScrollText, key: KeyRound, box: Gift, reset: RotateCcw };
export const ITEM_TONE = { shield: "teal", potion: "violet", pardon: "rose", key: "amber", box: "orange", reset: "sky" };

/** Gate themes */
export const GATE_ICON = { goblin: Skull, lycan: PawPrint, orc: Castle, ice: Snowflake, ant: Bug, temple: Landmark, castle: Flame };

/** Player stats */
export const STAT_ICON = { str: Dumbbell, agi: Zap, vit: Heart, int: Brain, per: Eye };


/** Skills (lib/system/progression SKILLS ids) */
export const SKILL_ICON = {
    bloodlust: Droplets, sprint: Wind, tenacity: ShieldCheck, mana_sense: Sparkles, detection: Eye,
    stealth: Moon, iron_body: Mountain, inner_peace: Flower2, vital_strike: Sword, rulers_authority: Hand,
};

/** Job classes */
export const CLASS_ICON = { fighter: Swords, assassin: Sword, tank: Shield, mage: Wand2, ranger: Target, monarch: Crown };

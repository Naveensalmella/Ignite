"use client";
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

export default function PageTransition({ children, pageKey }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pageKey}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ width: "100%" }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

// Reusable animated card wrapper
export function AnimatedCard({ children, delay = 0, style = {} }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay, ease: "easeOut" }}
            style={style}
        >
            {children}
        </motion.div>
    );
}

// Staggered list animation
export function StaggerContainer({ children, style = {} }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } }
            }}
            style={style}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, style = {} }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={style}
        >
            {children}
        </motion.div>
    );
}